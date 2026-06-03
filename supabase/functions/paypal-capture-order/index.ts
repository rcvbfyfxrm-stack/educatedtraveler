// Edge Function: paypal-capture-order
// Captures a PayPal order created by paypal-create-order. Server-side
// verifies the captured amount against what we actually charged (the deposit,
// the full price, or the outstanding balance — never trusting the client),
// then advances the enrollment, writes a row to `payments`, and fires the
// receipt + (for the initial capture) instructor-confirmation emails.
//
// A successful INITIAL capture does NOT enroll the student — it parks them in
// `awaiting_confirmation`. The instructor confirms via confirm-enrollment
// (one-click email link or dashboard), which flips them to `enrolled`.
//
// Body: { order_id: string }
// Auth: Bearer JWT (the student's access token).
// Returns: { ok: true, enrollment_id, capture_id, kind }

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
    // PayPal order IDs are uppercase alphanumeric tokens. Validate before it
    // is interpolated into the PostgREST .or() filter below.
    if (typeof order_id !== "string" || !/^[A-Z0-9]{6,40}$/.test(order_id)) {
      return json({ error: "Invalid order_id" }, 400);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve enrollment by either the initial OR the balance order id.
    const { data: enrollmentRow } = await admin
      .from("enrollments")
      .select(
        "id, user_id, cohort_id, payment_status, status, payment_plan, " +
          "deposit_cents, balance_cents, amount_paid_cents, " +
          "paypal_order_id, paypal_balance_order_id, paypal_capture_id, paypal_balance_capture_id",
      )
      .or(`paypal_order_id.eq.${order_id},paypal_balance_order_id.eq.${order_id}`)
      .maybeSingle();

    if (!enrollmentRow) {
      return json({ error: "Enrollment not found for order" }, 404);
    }
    // Supabase's typed builder mis-infers `.or()` + embeds; treat as a plain row.
    const enrollment = enrollmentRow as Record<string, any>;
    if (enrollment.user_id !== userId) {
      // Don't let user A finalize user B's order.
      return json({ error: "Order does not belong to this user" }, 403);
    }

    const isBalance = enrollment.paypal_balance_order_id === order_id;

    // Idempotency: this leg already captured → return current state.
    if (isBalance && enrollment.paypal_balance_capture_id) {
      return json({ ok: true, enrollment_id: enrollment.id, capture_id: enrollment.paypal_balance_capture_id, kind: "balance", dedup: true });
    }
    if (!isBalance && enrollment.paypal_capture_id) {
      return json({ ok: true, enrollment_id: enrollment.id, capture_id: enrollment.paypal_capture_id, kind: "initial", dedup: true });
    }

    // Never take money on a booking the instructor declined or that was
    // cancelled — even if a balance order was minted before that happened.
    if (enrollment.status === "declined" || enrollment.status === "cancelled") {
      return json({ error: "This booking is no longer active" }, 409);
    }
    if (isBalance && enrollment.payment_status !== "deposit_paid") {
      return json({ error: "No balance is due on this booking" }, 409);
    }

    // What we actually asked PayPal to charge for this leg.
    const expectedCents = isBalance ? enrollment.balance_cents : enrollment.deposit_cents;
    if (!expectedCents || expectedCents < 100) {
      return json({ error: "Nothing to charge for this order" }, 400);
    }

    const order = await captureOrder(order_id);
    const capture = extractCapture(order);

    if (!capture || capture.status !== "COMPLETED") {
      return json(
        { error: "Capture did not complete", paypal_status: capture?.status ?? order.status },
        402,
      );
    }

    // Server-side amount verification — never trust the client.
    if (capture.amount_cents !== expectedCents) {
      console.error(
        `Amount mismatch on order ${order_id}: paid ${capture.amount_cents}, expected ${expectedCents}`,
      );
      return json({ error: "Amount mismatch" }, 400);
    }
    if (capture.currency !== "usd") {
      return json({ error: "Currency mismatch" }, 400);
    }

    const payerEmail = order.payer?.email_address ?? null;
    const prevPaid = enrollment.amount_paid_cents ?? 0;

    if (isBalance) {
      // Final leg — the cohort is now paid in full.
      await admin
        .from("enrollments")
        .update({
          payment_status: "paid",
          balance_cents: 0,
          paypal_balance_capture_id: capture.capture_id,
          paypal_payer_email: payerEmail,
          amount_paid_cents: prevPaid + capture.amount_cents,
          currency: capture.currency,
        })
        .eq("id", enrollment.id);
    } else {
      // Initial leg — deposit or full. Park for instructor confirmation.
      const newPaymentStatus = enrollment.payment_plan === "installment" ? "deposit_paid" : "paid";
      await admin
        .from("enrollments")
        .update({
          status: "awaiting_confirmation",
          payment_status: newPaymentStatus,
          paypal_capture_id: capture.capture_id,
          paypal_payer_email: payerEmail,
          amount_paid_cents: capture.amount_cents,
          currency: capture.currency,
          paid_at: new Date().toISOString(),
        })
        .eq("id", enrollment.id);
    }

    const { data: cohortData } = await admin
      .from("cohorts")
      .select("id, instructor_id")
      .eq("id", enrollment.cohort_id)
      .single();
    const cohort = cohortData as Record<string, any> | null;

    // 10% notional platform fee — Arnaud pays instructors out manually.
    const platformFee = Math.round(capture.amount_cents * 0.1);

    await admin.from("payments").insert({
      provider: "paypal",
      enrollment_id: enrollment.id,
      user_id: enrollment.user_id,
      cohort_id: enrollment.cohort_id,
      instructor_id: cohort?.instructor_id ?? null,
      paypal_order_id: order_id,
      paypal_capture_id: capture.capture_id,
      event_type: isBalance ? "paypal.balance.completed" : "paypal.capture.completed",
      amount_cents: capture.amount_cents,
      application_fee_cents: platformFee,
      currency: capture.currency,
      status: "succeeded",
      customer_email: payerEmail,
      raw: order as unknown as Record<string, unknown>,
    });

    // Dispatch notification emails. Await + log so a future outage is visible
    // in function logs (the 2026-05-20 trial silently dropped because
    // notify-instructor-enrollment was never deployed and .catch hid the 404).
    async function dispatch(fn: string, extra: Record<string, unknown> = {}) {
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${fn}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ enrollment_id: enrollment.id, ...extra }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(`${fn} dispatch returned ${res.status}: ${text.slice(0, 500)}`);
          return { fn, ok: false, status: res.status, body: text.slice(0, 500) };
        }
        console.log(`${fn} dispatch ok (${res.status})`);
        return { fn, ok: true, status: res.status };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`${fn} dispatch threw: ${msg}`);
        return { fn, ok: false, error: msg };
      }
    }

    // Receipt always fires (it tailors copy to deposit/full/balance).
    // The instructor confirmation request fires on the INITIAL capture only.
    const tasks = [dispatch("send-receipt-email", { kind: isBalance ? "balance" : "initial" })];
    if (!isBalance) tasks.push(dispatch("notify-instructor-enrollment"));
    const results = await Promise.all(tasks);

    return json({
      ok: true,
      enrollment_id: enrollment.id,
      capture_id: capture.capture_id,
      kind: isBalance ? "balance" : "initial",
      dispatch: results,
    });
  } catch (err) {
    console.error("paypal-capture-order error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
