// Edge Function: paypal-create-order
// Creates a PayPal Orders v2 order for a cohort enrollment. Funds go to the
// platform PayPal account (Arnaud's Business account); instructor payouts
// are handled manually for now.
//
// Body: { cohort_id: string }
// Auth: Bearer JWT (the student's access token).
// Returns: { order_id, enrollment_id }
//
// The Smart Buttons SDK on /paypal-checkout.html calls this from
// `createOrder()` and then calls paypal-capture-order from `onApprove()`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createOrder } from "../_shared/paypal.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: cohort, error: cohortErr } = await admin
      .from("cohorts")
      .select("id, title, description, location, price_cents, status, instructor_id")
      .eq("id", cohort_id)
      .single();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);

    if (cohort.status !== "published") {
      return json({ error: "Cohort is not open for enrollment" }, 400);
    }
    if (!cohort.price_cents || cohort.price_cents < 100) {
      return json({ error: "Cohort price not set" }, 400);
    }

    // Block duplicate active enrollment.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status, payment_status, paypal_order_id")
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

    const order = await createOrder({
      amountCents: cohort.price_cents,
      currency: "USD",
      description: [cohort.title, cohort.location].filter(Boolean).join(" — "),
      customId: enrollmentId,
      brandName: "EducatedTraveler",
    });

    await admin
      .from("enrollments")
      .update({ paypal_order_id: order.id })
      .eq("id", enrollmentId);

    return json({ order_id: order.id, enrollment_id: enrollmentId });
  } catch (err) {
    console.error("paypal-create-order error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
