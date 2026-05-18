// Edge Function: paypal-capture-order
// Captures a PayPal order created by paypal-create-order. Server-side
// verifies the amount against the cohort price (defends against a tampered
// client), then marks the enrollment paid, writes a row to `payments`, and
// fires the receipt + instructor-notification emails (same dispatch the
// Stripe webhook used to do).
//
// Body: { order_id: string }
// Auth: Bearer JWT (the student's access token).
// Returns: { ok: true, enrollment_id, capture_id }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { captureOrder, extractCapture } from "../_shared/paypal.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

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

    const { order_id } = await req.json();
    if (!order_id) return json({ error: "order_id required" }, 400);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve enrollment by the order_id we stamped on create.
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, user_id, cohort_id, payment_status, status")
      .eq("paypal_order_id", order_id)
      .maybeSingle();

    if (!enrollment) {
      return json({ error: "Enrollment not found for order" }, 404);
    }
    if (enrollment.user_id !== userId) {
      // Don't let user A finalize user B's order.
      return json({ error: "Order does not belong to this user" }, 403);
    }

    // Idempotency: already captured → return current state.
    if (enrollment.payment_status === "paid") {
      return json({
        ok: true,
        enrollment_id: enrollment.id,
        capture_id: null,
        dedup: true,
      });
    }

    const { data: cohort } = await admin
      .from("cohorts")
      .select("id, price_cents, instructor_id")
      .eq("id", enrollment.cohort_id)
      .single();

    if (!cohort) return json({ error: "Cohort missing" }, 404);

    const order = await captureOrder(order_id);
    const capture = extractCapture(order);

    if (!capture || capture.status !== "COMPLETED") {
      return json(
        { error: "Capture did not complete", paypal_status: capture?.status ?? order.status },
        402,
      );
    }

    // Server-side amount verification — never trust the client.
    if (capture.amount_cents !== cohort.price_cents) {
      console.error(
        `Amount mismatch on order ${order_id}: paid ${capture.amount_cents}, expected ${cohort.price_cents}`,
      );
      return json({ error: "Amount mismatch" }, 400);
    }

    if (capture.currency !== "usd") {
      return json({ error: "Currency mismatch" }, 400);
    }

    const payerEmail = order.payer?.email_address ?? null;

    await admin
      .from("enrollments")
      .update({
        status: "enrolled",
        payment_status: "paid",
        paypal_capture_id: capture.capture_id,
        paypal_payer_email: payerEmail,
        amount_paid_cents: capture.amount_cents,
        currency: capture.currency,
        paid_at: new Date().toISOString(),
      })
      .eq("id", enrollment.id);

    // 10% notional platform fee — Stripe used to split this automatically.
    // With PayPal direct, 100% lands in the platform account and Arnaud
    // pays instructors out manually. The view still uses 90/10.
    const platformFee = Math.round(capture.amount_cents * 0.1);

    await admin.from("payments").insert({
      provider: "paypal",
      enrollment_id: enrollment.id,
      user_id: enrollment.user_id,
      cohort_id: enrollment.cohort_id,
      instructor_id: cohort.instructor_id ?? null,
      paypal_order_id: order_id,
      paypal_capture_id: capture.capture_id,
      event_type: "paypal.capture.completed",
      amount_cents: capture.amount_cents,
      application_fee_cents: platformFee,
      currency: capture.currency,
      status: "succeeded",
      customer_email: payerEmail,
      raw: order as unknown as Record<string, unknown>,
    });

    // Same fire-and-forget dispatch the Stripe webhook used.
    const dispatchHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };
    await Promise.allSettled([
      fetch(`${SUPABASE_FUNCTIONS_URL}/send-receipt-email`, {
        method: "POST",
        headers: dispatchHeaders,
        body: JSON.stringify({ enrollment_id: enrollment.id }),
      }).catch((e) => console.error("send-receipt-email dispatch failed:", e)),
      fetch(`${SUPABASE_FUNCTIONS_URL}/notify-instructor-enrollment`, {
        method: "POST",
        headers: dispatchHeaders,
        body: JSON.stringify({ enrollment_id: enrollment.id }),
      }).catch((e) => console.error("notify-instructor-enrollment dispatch failed:", e)),
    ]);

    return json({
      ok: true,
      enrollment_id: enrollment.id,
      capture_id: capture.capture_id,
    });
  } catch (err) {
    console.error("paypal-capture-order error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
