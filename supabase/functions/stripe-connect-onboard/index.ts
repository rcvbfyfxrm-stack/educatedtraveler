// Edge Function: stripe-connect-onboard
// Creates (or reuses) a Stripe Connect Express account for the authenticated
// instructor and returns a one-time onboarding link.
//
// Auth: Bearer JWT from supabase-js (the user's access token).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";

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

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const userId = userData.user.id;
    const userEmail = userData.user.email!;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: instructor, error: instErr } = await admin
      .from("instructors")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (instErr || !instructor) {
      return json({ error: "No instructor profile found" }, 404);
    }
    if (instructor.status !== "approved") {
      return json({ error: "Instructor not yet approved" }, 403);
    }

    let accountId = instructor.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: instructor.email || userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: instructor.name,
          url: instructor.website || undefined,
        },
        metadata: {
          instructor_id: instructor.id,
          user_id: userId,
        },
      });
      accountId = account.id;

      await admin
        .from("instructors")
        .update({ stripe_account_id: accountId })
        .eq("id", instructor.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/instructor-dashboard?stripe=refresh`,
      return_url: `${APP_URL}/instructor-dashboard?stripe=return`,
      type: "account_onboarding",
    });

    return json({ url: link.url, account_id: accountId });
  } catch (err) {
    console.error("stripe-connect-onboard error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
