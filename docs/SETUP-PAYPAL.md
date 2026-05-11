# PayPal — Setup Runbook

End-to-end checklist to bring PayPal direct-to-platform checkout online for EducatedTraveler. Funds land in Arnaud's PayPal Business account; instructor payouts are handled manually until Stripe Connect is re-enabled.

> Order matters: do steps 1 → 7 in sequence. Skipping ahead breaks OAuth or capture verification.

---

## 1 · PayPal Business account

1. Sign in at https://www.paypal.com with `arnaud.callier@outlook.com` (the account currently holding EducatedTraveler funds).
2. **Upgrade Personal → Business.** Account Settings → *Upgrade to a Business account*. Use:
   - Business name: **EducatedTraveler**
   - Category: *Travel & Lodging → Tours / Educational services*
   - Website: `https://educatedtraveler.app`
   - Customer service email: `founder@educatedtraveler.app`
3. Confirm the email + add a phone number. Business accounts are required to use REST API credentials in production.
4. Optional but recommended: enable **PayPal Checkout** specifically in *Account Settings → Website preferences*.

---

## 2 · Developer app + REST credentials

1. Go to https://developer.paypal.com → sign in with the same email.
2. **My Apps & Credentials → REST API apps → Create App.**
   - App name: `EducatedTraveler Checkout`
   - Type: *Merchant*
   - Sandbox business account: the auto-generated `sb-…@business.example.com` (PayPal creates one for you on first visit)
3. Copy the **Sandbox** *Client ID* and *Secret*. Keep this tab open — you'll need a Live pair after step 7.
4. On the same screen, scroll to **Features** and tick **Accept payments** + **PayPal Checkout**. Save.

---

## 3 · Run the DB migration

```bash
# From project root
supabase db push        # applies migrations/010_paypal.sql
# or paste 010_paypal.sql into Supabase Dashboard → SQL Editor
```

What this adds:
- `enrollments.paypal_order_id`, `paypal_capture_id`, `paypal_payer_email`
- `payments.provider` (`'stripe' | 'paypal'`, defaults to `'stripe'` on old rows)
- `payments.paypal_order_id`, `payments.paypal_capture_id` (+ unique index for idempotency)

Stripe columns are untouched — the dormant code paths still type-check.

---

## 4 · Set Edge Function secrets

```bash
supabase secrets set \
  PAYPAL_CLIENT_ID="..." \
  PAYPAL_CLIENT_SECRET="..." \
  PAYPAL_ENV="sandbox" \
  APP_URL="https://educatedtraveler.app"
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
# RESEND_API_KEY should already be set
```

Flip `PAYPAL_ENV=live` only after step 7 passes cleanly in sandbox.

---

## 5 · Paste the Client ID into the frontend

The Client ID is **public** (it ends up in every browser anyway), so we ship it in the static site rather than fetching it at runtime.

Edit `website/js/paypal-config.js`:

```js
var PAYPAL_ENV = 'sandbox';                                     // step 7 flips to 'live'
var PAYPAL_CLIENT_ID_SANDBOX = 'AY...sandbox client id...';     // from step 2
var PAYPAL_CLIENT_ID_LIVE    = 'AY...live client id...';        // fill after step 7.4
```

Commit the file. The Secret never leaves Supabase — never paste it here.

---

## 6 · Deploy the Edge Functions

```bash
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

Both functions verify the student's Supabase JWT (`Authorization: Bearer …`), so leave *Verify JWT* **on** in the Supabase dashboard. No public webhook to configure — capture is server-driven from `onApprove()`, which is faster and gives us synchronous error handling.

---

## 7 · Smoke test

### Sandbox dry run

1. **Sandbox buyer.** developer.paypal.com → *Sandbox → Accounts*. Use the auto-generated `sb-…@personal.example.com` (password is on the same page).
2. **Sign in to EducatedTraveler** as a test student. From an offering page, click *Apply* — you should land on `/paypal-checkout.html?cohort=…`.
3. **The Smart Buttons** render in a vertical yellow pill layout. Click *PayPal*, log in with the sandbox buyer, confirm.
4. You should land on `/enrollment-success.html?order=<ORDER_ID>` with the last 12 chars of the order id shown as the receipt reference.
5. Check:
   - The enrollment row shows `payment_status = paid`, `paypal_capture_id` filled, `paid_at` timestamped, `paypal_payer_email` populated.
   - A row exists in `payments` with `provider = 'paypal'`, `event_type = 'paypal.capture.completed'`, `amount_cents` matching the cohort price, `application_fee_cents` ≈ 10% (notional — not split by PayPal).
   - The student receives the receipt email via Resend (same `send-receipt-email` function the Stripe path used).
   - The instructor receives the heads-up via `notify-instructor-enrollment`.
6. **Replay test (idempotency).** Hit `paypal-capture-order` a second time with the same `order_id`. It should return `{ ok: true, dedup: true }` — no duplicate `payments` row, no double dispatch.

### Failure paths to spot-check

- Tamper the cohort price in DevTools before clicking PayPal — the capture function rejects with **400 Amount mismatch** and the enrollment stays `pending`.
- Cancel mid-flow — the page shows *Payment cancelled. You can try again above.* The enrollment stays `pending` with `paypal_order_id` set (next attempt creates a fresh order).

---

## 8 · Going live

1. developer.paypal.com → toggle from **Sandbox** to **Live** (top right).
2. *My Apps & Credentials → Live → Create App* (or reuse the existing app and reveal Live credentials).
3. Update Supabase secrets:
   ```bash
   supabase secrets set \
     PAYPAL_CLIENT_ID="..."        # LIVE client id
     PAYPAL_CLIENT_SECRET="..."    # LIVE secret
     PAYPAL_ENV="live"
   ```
4. Edit `website/js/paypal-config.js`: fill `PAYPAL_CLIENT_ID_LIVE` and set `PAYPAL_ENV = 'live'`. Commit and push (Netlify auto-deploys).
5. Re-deploy the functions to flush any cached env:
   ```bash
   supabase functions deploy paypal-create-order
   supabase functions deploy paypal-capture-order
   ```
6. **Live $1 self-test.** Create a $1 test cohort, enroll yourself with a real PayPal account, refund yourself from paypal.com → *Activity*. Confirm `payments` got the success row and the enrollment flipped to `paid`.

---

## Architecture at a glance

```
Student clicks "Apply"
   ↓
website/js/checkout.js → window.location = /paypal-checkout.html?cohort=<id>
   ↓
PayPal Smart Buttons (vertical, gold, pill) — disable-funding=credit,card
   ↓ createOrder()
   ↓
[Edge] paypal-create-order
   - looks up cohort
   - upserts enrollment (status=pending, payment_status=pending)
   - POST /v2/checkout/orders (NO_SHIPPING, capture intent, custom_id=enrollment_id)
   - stamps enrollments.paypal_order_id
   ↓ returns { order_id }
   ↓
PayPal lightbox → buyer approves
   ↓ onApprove(data)
   ↓
[Edge] paypal-capture-order
   - POST /v2/checkout/orders/<id>/capture
   - verifies amount + currency match the cohort
   - marks enrollment paid, fills paypal_capture_id + paypal_payer_email
   - inserts into payments (provider='paypal')
   - dispatches send-receipt-email + notify-instructor-enrollment
   ↓ returns { ok: true }
   ↓
Browser → /enrollment-success.html?order=<id>
```

**Money flow:** capture intent on a single PayPal Business account. 100% of the gross lands in the platform balance. Arnaud manually pays instructors 90% on the schedule the `instructor_cohort_revenue` view computes.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Smart Buttons never render, console: `Expected client-id to be set` | `paypal-config.js` still has the `REPLACE_WITH_…` placeholder | Paste the real Client ID from step 2 |
| `PayPal OAuth failed: 401` in function logs | Wrong env (sandbox secret with live base URL or vice versa) | Make sure `PAYPAL_ENV` matches the credential pair |
| `Amount mismatch` 400 | Cohort `price_cents` changed between create and capture | Re-create the order: refresh the checkout page |
| Capture succeeds but enrollment stays `pending` | Auth header missing on capture call | Confirm the user still has a valid Supabase session; sign back in |
| `Order does not belong to this user` 403 | Two browser sessions sharing the same `paypal_order_id` | Treat as malicious — order was created by user A, captured by user B. Investigate the access logs |
| Instructor not notified | `notify-instructor-enrollment` not deployed or failing silently | `supabase functions logs notify-instructor-enrollment` — same path the Stripe webhook used |

---

## Files touched

- `supabase/migrations/010_paypal.sql`
- `supabase/functions/_shared/paypal.ts` *(new — OAuth + Orders v2 helper)*
- `supabase/functions/paypal-create-order/index.ts` *(new)*
- `supabase/functions/paypal-capture-order/index.ts` *(new)*
- `website/paypal-checkout.html` *(new — Smart Buttons page)*
- `website/js/paypal-config.js` *(new — Client ID + env)*
- `website/js/checkout.js` — `applyToCohort` now redirects to `/paypal-checkout.html?cohort=<id>`
- `website/js/database.js` — added `createPayPalOrder` / `capturePayPalOrder`; Stripe helpers kept dormant
- `website/enrollment-success.html` — receipt ref reads `?order=` *or* `?session_id=`

Stripe code (`stripe-checkout`, `stripe-webhook`, `stripe-connect-onboard`, `startCohortCheckout`, `startStripeOnboarding`, all `stripe_*` columns) is intentionally kept. To re-enable Stripe Connect later: point `checkout.js`'s `applyToCohort` back at `window.db.startCohortCheckout(cohortId)` and re-set the Stripe secrets — no rebuild needed.
