// Edge Function: paypal-create-order
// Creates a PayPal Orders v2 order for a cohort enrollment. Funds go to the
// platform PayPal account (Arnaud's Business account); instructor payouts
// are handled manually for now.
//
// Two shapes:
//   { cohort_id, plan: 'full'|'installment', notes?, addons? }  → new booking
//       'full'        charges the whole price now.
//       'installment' charges a 1/3 deposit now; the balance (remaining 2/3)
//                     is due >= 1 month before the cohort start_date.
//   { enrollment_id, kind: 'balance' }                          → pay balance
//       charges the outstanding balance on an existing deposit_paid enrollment.
//
// Auth: Bearer JWT (the student's access token).
// Returns: { order_id, enrollment_id, charge_cents, kind }
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

// start_date (DATE) minus one month, as YYYY-MM-DD, in UTC.
function balanceDueDate(startDate: string): string {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
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

    const body = await req.json().catch(() => ({}));

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ===================================================================
    // BALANCE TOP-UP — pay the remaining 2/3 on an existing enrollment.
    // ===================================================================
    if (body.kind === "balance") {
      const enrollmentId = body.enrollment_id;
      if (!enrollmentId) return json({ error: "enrollment_id required" }, 400);

      const { data: enrRow } = await admin
        .from("enrollments")
        .select(
          "id, user_id, cohort_id, status, payment_status, balance_cents, paypal_balance_order_id, cohorts(title, location)",
        )
        .eq("id", enrollmentId)
        .maybeSingle();

      const enr = enrRow as Record<string, any> | null;
      if (!enr) return json({ error: "Enrollment not found" }, 404);
      if (enr.user_id !== userId) return json({ error: "Not your enrollment" }, 403);
      if (enr.status === "cancelled" || enr.status === "declined") {
        return json({ error: "This booking is no longer active" }, 409);
      }
      if (enr.payment_status === "paid") return json({ error: "Already paid in full" }, 409);
      if (enr.payment_status !== "deposit_paid" || !enr.balance_cents || enr.balance_cents < 100) {
        return json({ error: "No balance due on this enrollment" }, 400);
      }

      const bcohort = enr.cohorts ?? {};
      const order = await createOrder({
        amountCents: enr.balance_cents,
        currency: "USD",
        description: [
          "Balance",
          bcohort.title,
          bcohort.location,
        ].filter(Boolean).join(" — "),
        customId: enr.id,
        requestId: `bal_${enr.id}_${enr.balance_cents}`,
        brandName: "EducatedTraveler",
      });

      await admin
        .from("enrollments")
        .update({ paypal_balance_order_id: order.id })
        .eq("id", enr.id);

      return json({
        order_id: order.id,
        enrollment_id: enr.id,
        charge_cents: enr.balance_cents,
        kind: "balance",
      });
    }

    // ===================================================================
    // NEW BOOKING — full price or 1/3 deposit.
    // ===================================================================
    const cohortId = body.cohort_id;
    const plan = body.plan === "installment" ? "installment" : "full";
    if (!cohortId) return json({ error: "cohort_id required" }, 400);

    const { data: cohort, error: cohortErr } = await admin
      .from("cohorts")
      .select("id, title, description, location, price_cents, start_date, status, instructor_id")
      .eq("id", cohortId)
      .single();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);

    if (cohort.status !== "published") {
      return json({ error: "Cohort is not open for enrollment" }, 400);
    }
    if (!cohort.price_cents || cohort.price_cents < 100) {
      return json({ error: "Cohort price not set" }, 400);
    }

    const total = cohort.price_cents;
    let paymentPlan = "full";
    let depositCents = total;
    let balanceCents = 0;
    let dueDate: string | null = null;

    if (plan === "installment") {
      if (!cohort.start_date) {
        return json({ error: "Installments need a class start date — please pay in full." }, 400);
      }
      const due = balanceDueDate(cohort.start_date as string);
      // The balance is only useful if it falls in the future; otherwise the
      // deposit + balance would both be due now, so force full payment.
      if (due <= new Date().toISOString().slice(0, 10)) {
        return json(
          { error: "This class starts too soon to split the payment — please pay in full." },
          400,
        );
      }
      depositCents = Math.round(total / 3);
      balanceCents = total - depositCents;
      // Both legs must clear PayPal's / our $1 floor, else capture would reject.
      if (depositCents < 100 || balanceCents < 100) {
        return json({ error: "This price is too low to split — please pay in full." }, 400);
      }
      paymentPlan = "installment";
      dueDate = due;
    }

    // Block duplicate active enrollment; reuse a stale pending row otherwise.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status, payment_status")
      .eq("user_id", userId)
      .eq("cohort_id", cohort.id)
      .maybeSingle();

    if (
      existing &&
      (existing.payment_status === "paid" ||
        existing.payment_status === "deposit_paid" ||
        existing.status === "enrolled" ||
        existing.status === "awaiting_confirmation")
    ) {
      return json({ error: "You already have a booking for this cohort" }, 409);
    }

    const enrollmentFields = {
      user_id: userId,
      cohort_id: cohort.id,
      status: "pending",
      payment_status: "pending",
      payment_plan: paymentPlan,
      price_total_cents: total,
      deposit_cents: depositCents,
      balance_cents: balanceCents,
      balance_due_date: dueDate,
      student_notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : null,
      addons: Array.isArray(body.addons) ? body.addons : null,
    };

    let enrollmentId: string;
    if (existing) {
      await admin.from("enrollments").update(enrollmentFields).eq("id", existing.id);
      enrollmentId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("enrollments")
        .insert(enrollmentFields)
        .select("id")
        .single();
      if (insErr || !inserted) {
        return json({ error: insErr?.message ?? "Could not create enrollment" }, 500);
      }
      enrollmentId = inserted.id;
    }

    const order = await createOrder({
      amountCents: depositCents,
      currency: "USD",
      description: [
        cohort.title,
        cohort.location,
        paymentPlan === "installment" ? "Deposit (1/3)" : null,
      ].filter(Boolean).join(" — "),
      customId: enrollmentId,
      // Vary by charge so switching plan (full↔deposit) before paying forces
      // a fresh order instead of returning the stale cached one.
      requestId: `enr_${enrollmentId}_${depositCents}`,
      brandName: "EducatedTraveler",
    });

    await admin
      .from("enrollments")
      .update({ paypal_order_id: order.id })
      .eq("id", enrollmentId);

    return json({
      order_id: order.id,
      enrollment_id: enrollmentId,
      charge_cents: depositCents,
      kind: paymentPlan === "installment" ? "deposit" : "full",
    });
  } catch (err) {
    console.error("paypal-create-order error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
