# Stripe — Setup Runbook

End-to-end checklist to bring Stripe Connect online for EducatedTraveler. Do this once. Do it carefully.

> Order matters: do steps 1 → 7 in sequence. Skipping ahead breaks signature verification or destination charges.

---

## 1 · Stripe account + Connect

1. Go to https://dashboard.stripe.com — create the EducatedTraveler account if it doesn't exist yet. Use `founder@educatedtraveler.app`.
2. **Activate Connect.** Dashboard → **Connect** → click **Get started**. Choose:
   - Platform type: *Marketplace*
   - Account type accepted: *Express* (we generate onboarding links from our app)
3. Fill in the platform profile. The instructor onboarding screens inherit the branding — set the platform name, support email, and logo here.
4. **Payment methods.** In *Settings → Payments → Payment methods*, enable cards (default). Optional: Apple Pay / Google Pay.
5. **Branding.** *Settings → Branding* — upload the EducatedTraveler logo and set the brand color `#0066B1`. This is what shows on Checkout.

---

## 2 · API keys

Dashboard → **Developers → API keys**:

| Key | Where it lives |
|-----|---------------|
| Publishable key (`pk_…`) | Not needed for now (we use Checkout-hosted, no card collection on our site). |
| **Secret key** (`sk_…`) | `STRIPE_SECRET_KEY` in Supabase Edge Function secrets. |

For the first end-to-end run, use **test mode** keys (`sk_test_…`). Switch to live keys only after a clean test transaction.

---

## 3 · Run the DB migration

```bash
# From project root
supabase db push        # applies migrations/006_stripe.sql
# or paste 006_stripe.sql into Supabase Dashboard → SQL Editor
```

What this adds:
- `instructors.stripe_account_id` + onboarding flags
- `enrollments.stripe_payment_intent_id`, `payment_status`, `amount_paid_cents`, etc.
- `payments` audit table
- `instructor_cohort_revenue` view (powers the dashboard Payments panel)

---

## 4 · Set Edge Function secrets

The functions read environment variables. Set them once in Supabase:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY="sk_test_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  APP_URL="https://educatedtraveler.app" \
  PLATFORM_FEE_BPS="1000"
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
# RESEND_API_KEY should already be set (used by send-welcome-email)
```

`STRIPE_WEBHOOK_SECRET` comes from step 6 — set it after creating the webhook endpoint.

`PLATFORM_FEE_BPS=1000` = 10% platform fee. Adjust to taste; reflects in the Checkout `application_fee_amount` and the `instructor_cohort_revenue` view's payout calculation (currently hard-coded at 90% in the SQL — keep them aligned if you change either).

---

## 5 · Deploy the Edge Functions

```bash
supabase functions deploy stripe-connect-onboard
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy send-receipt-email
```

The webhook function must be **public** (no JWT verification) because Stripe doesn't send a Supabase JWT. Verify in the Supabase dashboard that `stripe-webhook` has *Verify JWT* turned **off**.

---

## 6 · Configure the webhook endpoint

Stripe Dashboard → **Developers → Webhooks → Add endpoint**.

- **URL:** `https://exaehwaqwcledemwpluw.supabase.co/functions/v1/stripe-webhook`
- **API version:** match the SDK version pinned in `stripe-webhook/index.ts` (currently `2024-06-20`).
- **Events to send:**
  - `checkout.session.completed`
  - `charge.refunded`
  - `account.updated` *(under Connect events — required for instructor onboarding sync)*

After creating the endpoint, click **Reveal signing secret** and put the value into `STRIPE_WEBHOOK_SECRET` (step 4).

---

## 7 · Smoke test

### Test mode dry run

1. **Sign in as the instructor.** Visit `/instructor-dashboard`. The "Connect Stripe" banner appears. Click it — you should land on the Stripe Express onboarding flow. Use Stripe's [test data](https://stripe.com/docs/connect/testing) (e.g., SSN `000000000`, address `address_full_match`). Submit.
2. **Return to the dashboard.** The badge should flip to `connected` and the revenue summary appears.
3. **Sign in as a student** (different email). Visit `/sushi-mastery`, click *Apply for Full Program*. You should be redirected to a Stripe Checkout page with the cohort title and price.
4. **Pay** with `4242 4242 4242 4242`, any future expiry, any CVC. You land on `/enrollment-success`.
5. Check:
   - The student's row in `enrollments` shows `payment_status = paid`, `amount_paid_cents` set, `paid_at` timestamped.
   - A row exists in `payments` with `event_type = checkout.session.completed`, `application_fee_cents` matching 10% of the price.
   - The student receives the receipt email via Resend.
   - Instructor dashboard shows the new student in the Payments panel and the cohort card.

### Refund flow

In Stripe Dashboard → Payments → click the test charge → Refund. The webhook fires, the enrollment flips to `cancelled` / `refunded`, and a `payments` row with negative `amount_cents` is logged.

---

## 8 · Going live

1. In Stripe, switch to **Live mode** (top-right toggle).
2. Re-create the webhook endpoint in live mode (the signing secret is different).
3. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase secrets to the live values.
4. Re-deploy any function whose env vars changed (`supabase functions deploy stripe-webhook` etc.) — secrets propagate without a redeploy, but redeploying flushes caches faster.
5. Have the first instructor (Hiroko Ishi) re-onboard in live mode — test-mode Connect accounts don't carry over.

---

## Architecture at a glance

```
Student clicks "Apply"
   ↓
website/js/checkout.js
   ↓ POST /functions/v1/stripe-checkout (with student's JWT)
   ↓
[Edge] stripe-checkout
   - looks up cohort + instructor's stripe_account_id
   - creates enrollment row (status=pending, payment_status=pending)
   - creates Stripe Checkout Session with destination=instructor account
   ↓ returns Checkout URL
   ↓
Stripe Checkout (hosted) → success or cancel
   ↓
Stripe Dashboard → fires webhook → POST /functions/v1/stripe-webhook
   ↓
[Edge] stripe-webhook
   - verifies signature
   - on checkout.session.completed: marks enrollment paid, logs payment, dispatches send-receipt-email
   - on charge.refunded: marks enrollment refunded, logs reversal
   - on account.updated: syncs instructor onboarding flags
```

Money flow: **destination charges with application fee**. Stripe charges the student → settles to the instructor's connected account → 10% platform fee routes back to the EducatedTraveler platform balance → Stripe pays out the instructor on its standard rolling schedule.

---

## Files touched

- `supabase/migrations/006_stripe.sql`
- `supabase/functions/_shared/cors.ts` *(new)*
- `supabase/functions/stripe-connect-onboard/index.ts` *(new)*
- `supabase/functions/stripe-checkout/index.ts` *(new)*
- `supabase/functions/stripe-webhook/index.ts` *(new)*
- `supabase/functions/send-receipt-email/index.ts` *(new)*
- `website/js/database.js` — added `getInstructorRevenue`, `getCohortPayments`, `startStripeOnboarding`, `startCohortCheckout`
- `website/js/checkout.js` *(new)* — `data-apply-experience` / `data-apply-cohort` handlers
- `website/instructor-dashboard.html` — Payouts & Revenue section + per-cohort revenue cards
- `website/sushi-mastery.html` — Apply CTAs now trigger Stripe Checkout
- `website/enrollment-success.html` *(new)*
- `website/enrollment-cancelled.html` *(new)*
- `netlify.toml` — pretty-URL redirects for the two new pages
