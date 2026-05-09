// Edge Function: stripe-checkout
// Creates a Stripe Checkout Session for a cohort enrollment using
// destination charges to the instructor's connected account.
//
// Body: { cohort_id: string }
// Auth: Bearer JWT (the student's access token).
// Returns: { url } — the Checkout URL to redirect to.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
// Platform fee in basis points. 1000 = 10%.
const PLATFORM_FEE_BPS = Number(Deno.env.get("PLATFORM_FEE_BPS") ?? "1000");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing auth" }, 401);
    }

    const { cohort_id } = await req.json();
    if (!cohort_id) return json({ error: "cohort_id required" }, 400);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const userId = userData.user.id;
    const userEmail = userData.user.email!;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: cohort, error: cohortErr } = await admin
      .from("cohorts")
      .select("id, title, description, location, price_cents, capacity, status, instructor_id")
      .eq("id", cohort_id)
      .single();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);

    if (cohort.status !== "published") {
      return json({ error: "Cohort is not open for enrollment" }, 400);
    }
    if (!cohort.price_cents || cohort.price_cents < 50) {
      return json({ error: "Cohort price not set" }, 400);
    }

    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, stripe_account_id, stripe_charges_enabled")
      .eq("id", cohort.instructor_id)
      .single();

    if (!instructor?.stripe_account_id || !instructor.stripe_charges_enabled) {
      return json({ error: "Instructor cannot accept payments yet" }, 400);
    }

    // Block duplicate active enrollment.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status, payment_status")
      .eq("user_id", userId)
      .eq("cohort_id", cohort.id)
      .maybeSingle();

    if (existing && (existing.payment_status === "paid" || existing.status === "enrolled")) {
      return json({ error: "Already enrolled" }, 409);
    }

    const enrollmentId =
      existing?.id ??
      (await admin
        .from("enrollments")
        .insert({
          user_id: userId,
          cohort_id: cohort.id,
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single()).data!.id;

    const applicationFee = Math.round(
      (cohort.price_cents * PLATFORM_FEE_BPS) / 10000,
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      client_reference_id: enrollmentId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: cohort.price_cents,
            product_data: {
              name: cohort.title,
              description: [cohort.location, cohort.description]
                .filter(Boolean)
                .join(" — ")
                .slice(0, 500) || undefined,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: { destination: instructor.stripe_account_id },
        metadata: {
          enrollment_id: enrollmentId,
          cohort_id: cohort.id,
          user_id: userId,
          instructor_id: instructor.id,
        },
      },
      metadata: {
        enrollment_id: enrollmentId,
        cohort_id: cohort.id,
        user_id: userId,
        instructor_id: instructor.id,
      },
      success_url: `${APP_URL}/enrollment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/enrollment-cancelled.html?cohort_id=${cohort.id}`,
    });

    await admin
      .from("enrollments")
      .update({ stripe_session_id: session.id })
      .eq("id", enrollmentId);

    return json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("stripe-checkout error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
