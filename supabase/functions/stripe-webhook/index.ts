// Edge Function: stripe-webhook
// Receives Stripe events. Verifies the signature, then:
//   - checkout.session.completed → mark enrollment paid, log payment, send receipt
//   - charge.refunded            → mark enrollment refunded, log payment
//   - account.updated            → sync instructor onboarding flags
//
// Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   https://<project>.supabase.co/functions/v1/stripe-webhook
// Subscribe to: checkout.session.completed, charge.refunded, account.updated

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  // Idempotency: skip events we've already processed.
  const { data: seen } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (seen) return new Response(JSON.stringify({ received: true, dedup: true }), { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event);
        break;
      case "account.updated":
        await handleAccountUpdated(event);
        break;
      default:
        // Ignore other event types.
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`Handler error for ${event.type}:`, err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// -----------------------------------------------------
// Handlers
// -----------------------------------------------------

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return;

  const meta = session.metadata ?? {};
  const enrollmentId = meta.enrollment_id || session.client_reference_id;
  const cohortId = meta.cohort_id;
  const userId = meta.user_id;
  const instructorId = meta.instructor_id;

  if (!enrollmentId) {
    console.error("No enrollment_id on session", session.id);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  let applicationFee: number | null = null;
  let chargeId: string | null = null;
  let destinationAccount: string | null = null;
  if (paymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = pi.latest_charge as Stripe.Charge | null;
    chargeId = charge?.id ?? null;
    applicationFee = (pi.application_fee_amount ?? null) as number | null;
    destinationAccount =
      (pi.transfer_data?.destination as string | undefined) ?? null;
  }

  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";

  await admin
    .from("enrollments")
    .update({
      status: "enrolled",
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      amount_paid_cents: amount,
      currency,
      paid_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  await admin.from("payments").insert({
    enrollment_id: enrollmentId,
    user_id: userId ?? null,
    cohort_id: cohortId ?? null,
    instructor_id: instructorId ?? null,
    stripe_event_id: event.id,
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: chargeId,
    stripe_account_id: destinationAccount,
    event_type: event.type,
    amount_cents: amount,
    application_fee_cents: applicationFee,
    currency,
    status: "succeeded",
    customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    raw: event as unknown as Record<string, unknown>,
  });

  // Fire-and-forget receipt email.
  await fetch(`${SUPABASE_FUNCTIONS_URL}/send-receipt-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ enrollment_id: enrollmentId }),
  }).catch((e) => console.error("send-receipt-email dispatch failed:", e));
}

async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;
  if (!paymentIntentId) return;

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, user_id, cohort_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!enrollment) return;

  await admin
    .from("enrollments")
    .update({
      status: "cancelled",
      payment_status: "refunded",
    })
    .eq("id", enrollment.id);

  const { data: cohort } = await admin
    .from("cohorts")
    .select("instructor_id")
    .eq("id", enrollment.cohort_id)
    .maybeSingle();

  await admin.from("payments").insert({
    enrollment_id: enrollment.id,
    user_id: enrollment.user_id,
    cohort_id: enrollment.cohort_id,
    instructor_id: cohort?.instructor_id ?? null,
    stripe_event_id: event.id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: charge.id,
    event_type: event.type,
    amount_cents: -(charge.amount_refunded ?? 0),
    currency: charge.currency,
    status: "refunded",
    customer_email: charge.billing_details?.email ?? null,
    raw: event as unknown as Record<string, unknown>,
  });
}

async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;

  const { data: instructor } = await admin
    .from("instructors")
    .select("id, stripe_onboarded_at")
    .eq("stripe_account_id", account.id)
    .maybeSingle();
  if (!instructor) return;

  const updates: Record<string, unknown> = {
    stripe_charges_enabled: account.charges_enabled,
    stripe_payouts_enabled: account.payouts_enabled,
    stripe_details_submitted: account.details_submitted,
  };
  if (
    account.charges_enabled &&
    account.details_submitted &&
    !instructor.stripe_onboarded_at
  ) {
    updates.stripe_onboarded_at = new Date().toISOString();
  }

  await admin.from("instructors").update(updates).eq("id", instructor.id);
}
