# Sandbox Test — Installments + Instructor Confirmation

End-to-end verification for the installments + instructor-confirmation work
(merged via PR #2, migration `020_installments_confirmation.sql`). Run the whole
thing in **PayPal sandbox** before flipping anything to live.

Legend: `[ ]` do it · **DB:** assert in Supabase · **✉:** an email should arrive.

Conventions used below:
- `$URL` = `https://<project-ref>.supabase.co` (project ref `exaehwaqwcledemwpluw`).
- Functions live at `$URL/functions/v1/<name>`.
- SQL = run in Supabase Dashboard → SQL editor (or curl the REST API with the
  service key from `.env`, which bypasses RLS).

---

## 0. Pre-flight setup

- [ ] **PayPal sandbox accounts** at developer.paypal.com → Sandbox → Accounts:
      one **Business** (receives funds) and one **Personal** (the test buyer).
- [ ] **Frontend**: `website/js/paypal-config.js` → `PAYPAL_ENV = 'sandbox'` and
      `PAYPAL_CLIENT_ID_SANDBOX` is the sandbox app's client id.
- [ ] **Server secrets** (Supabase → Project Settings → Edge Functions):
      `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` = the
      **sandbox** REST app creds, `RESEND_API_KEY`, `APP_URL=https://educatedtraveler.app`.
      The sandbox client id in `paypal-config.js` and the secret `PAYPAL_CLIENT_ID`
      must be from the **same** sandbox app.
- [ ] **Migrations applied** in order through `020_installments_confirmation.sql`
      (it depends on `profiles.is_admin` existing, created by an earlier migration):
      `supabase db push` — confirm it ran without the view-replace error.
      **DB:** `\d enrollments` shows `payment_plan, deposit_cents, balance_cents,`
      `balance_due_date, confirm_token, confirmed_at, declined_at,`
      `paypal_balance_order_id, balance_reminder_sent_at, student_notes, addons`.
- [ ] **Functions deployed**:
      ```
      supabase functions deploy paypal-create-order paypal-capture-order \
        notify-instructor-enrollment send-receipt-email send-balance-reminders
      supabase functions deploy confirm-enrollment --no-verify-jwt
      ```
      `confirm-enrollment` **must** be `--no-verify-jwt` (the email link is public).
- [ ] **Test cohort seeded** — published, priced, **start_date ~3 months out**, with
      an instructor whose `instructors.email` is a real inbox you can read:
      ```sql
      insert into cohorts (instructor_id, title, location, start_date, end_date,
                           capacity, price_cents, status)
      values ('a1b2c3d4-1111-2222-3333-444455556666',  -- Hiroko (has email)
              'TEST — Sushi Mastery', 'Tokyo',
              (current_date + interval '90 days')::date,
              (current_date + interval '120 days')::date,
              2, 360000, 'published')             -- capacity 2 to test 'full' easily
      returning id;
      ```
      Confirm `select email from instructors where id = 'a1b2c3d4-…';` is set.
- [ ] **Two browser sessions / accounts**: a **student** (any signed-in user) and
      access to the **instructor's** inbox + the **instructor dashboard**.
- [ ] Reach checkout one of three ways: dashboard **Book** button, the direct URL
      `$APP/paypal-checkout.html?cohort=<id>`, or (optional) add
      `data-cohort-id="<id>"` to a `data-et-join` button on an experience page.

> Deposit math for the seed: price 360000¢ → deposit `round(360000/3)=120000` ($1,200),
> balance `240000` ($2,400), balance_due_date = start − 1 month.

---

## 1. Deposit path (installment)

- [ ] Sign in as the **student**, open `paypal-checkout.html?cohort=<id>`.
- [ ] Plan selector shows **Pay in full — $3,600** and **Pay 1/3 deposit now — $1,200 ·
      balance $2,400 due by \<date\>**. (If the cohort were <1 month out, the deposit
      option must be hidden.)
- [ ] Choose **deposit**, pay with the **sandbox buyer**.
- [ ] Redirects to `enrollment-success.html?...&kind=deposit` → headline **"Deposit
      received."** + "awaiting your instructor's confirmation".
- **DB:** the enrollment row:
      ```sql
      select status, payment_status, payment_plan, price_total_cents, deposit_cents,
             balance_cents, balance_due_date, amount_paid_cents, paypal_order_id,
             paypal_capture_id, confirm_token
      from enrollments where cohort_id = '<id>' order by enrolled_at desc limit 1;
      ```
      Expect: `status=awaiting_confirmation`, `payment_status=deposit_paid`,
      `payment_plan=installment`, `deposit_cents=120000`, `balance_cents=240000`,
      `amount_paid_cents=120000`, `balance_due_date = start−1mo`, both paypal ids set,
      `confirm_token` populated.
- **DB:** a `payments` row exists with `provider='paypal'`,
      `event_type='paypal.capture.completed'`, `amount_cents=120000`.
- **✉ student:** "Deposit received — …" with the balance + due date.
- **✉ instructor:** "Confirm \<student\>'s booking — …" with **Confirm this booking**
      + **Decline** links. (Check `supabase functions logs notify-instructor-enrollment`
      for a Resend id if it doesn't arrive.)
- [ ] **Student dashboard** shows the cohort as **"Awaiting confirmation"**, a
      "Deposit paid · balance $2,400 due \<date\>" note, and a **Pay balance** button.
      It is **not** "enrolled", and **no** cohort-chat link yet.

---

## 2. Confirm via the one-click email link

- [ ] **Bot-safety check first:** copy the Confirm URL from the email and `curl` it
      (a bare GET, like a scanner would):
      ```
      curl -s "$URL/functions/v1/confirm-enrollment?token=<confirm_token>" | grep -o "<h1>[^<]*" 
      ```
      It returns the **interstitial page** ("\<student\> wants to join"). **DB:** the row
      is **still** `awaiting_confirmation` — a GET must **not** mutate.
- [ ] Now open the same link in a browser and click **Confirm this booking** →
      page shows **"Seat confirmed"**.
- **DB:** `status=enrolled`, `confirmed_at` set, `confirmed_by` NULL (token path).
- **✉ student:** "You're confirmed — …".
- [ ] **Student dashboard** now shows **enrolled** + an **Open cohort chat** link
      (deposit-only but confirmed members get chat).
- [ ] **Idempotency:** reopen the link → "Already confirmed" (no second email).

---

## 3. Confirm / decline from the instructor dashboard

- [ ] As a **second student**, book the same cohort (full or deposit) and pay.
- [ ] In the **instructor dashboard**, the cohort card shows **"Awaiting your
      confirmation (1)"** with the student, their deposit/full state, and
      **Confirm** / **Decline** buttons.
- [ ] Click **Confirm** → page reloads; student moves into the enrolled roster and the
      "X / capacity students" count goes up. **DB:** `confirmed_by` = the instructor's
      user id this time.
- [ ] With a **third** booking, click **Decline** (accept the confirm dialog).
      **DB:** `status=declined`, `declined_at` set. **✉** student notified is optional
      (decline currently only flips state + frees the seat).

---

## 4. Capacity → full → revert

- [ ] Capacity is 2. After **two confirms**, **DB:** `cohorts.status='full'`; the
      public checkout/offerings show the cohort as full.
- [ ] **Decline or cancel** one confirmed seat so confirmed count < capacity.
      **DB:** `cohorts.status` flips back to `'published'` (recalc on confirm/decline).
> Note: a *student-initiated* cancel (`db.cancelEnrollment`) bypasses the edge
> function and can't revert cohort status by itself — known limitation, manual for now.

---

## 5. Balance payment (settle the remaining 2/3)

- [ ] On the **deposit student's** dashboard click **Pay balance** (or open
      `paypal-checkout.html?enrollment=<enrollment_id>&balance=1`).
- [ ] Page shows **"Pay your balance — $2,400"**. Pay with the sandbox buyer.
- [ ] Redirects to success with `kind=balance` → **"You're all paid up."**
- **DB:**
      ```sql
      select payment_status, balance_cents, amount_paid_cents,
             paypal_balance_order_id, paypal_balance_capture_id
      from enrollments where id = '<enrollment_id>';
      ```
      Expect `payment_status=paid`, `balance_cents=0`, `amount_paid_cents=360000`
      (cumulative deposit+balance), both balance paypal ids set.
- **✉ student:** receipt with **"Balance received"** copy.
- [ ] **Idempotency:** reopening the balance checkout shows "You're all paid up".

---

## 6. Balance-reminder cron (`send-balance-reminders`)

- [ ] Make a fresh deposit booking (status `enrolled` or `awaiting_confirmation`,
      `payment_status=deposit_paid`), then pull its due date into the window:
      ```sql
      update enrollments
         set balance_due_date = current_date,   -- inside [today-45, today+7]
             balance_reminder_sent_at = null
       where id = '<enrollment_id>';
      ```
- [ ] Invoke the function manually:
      ```
      curl -s -X POST "$URL/functions/v1/send-balance-reminders" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
      ```
      Response JSON shows `candidates>=1`, `sent>=1`.
- **✉ student:** "Balance due for … — $2,400" with a **Pay your balance** link to
      `paypal-checkout.html?enrollment=…&balance=1`.
- **DB:** `balance_reminder_sent_at` is now set.
- [ ] Re-invoke → that enrollment is **not** emailed again (`sent` excludes it).
- [ ] When ready for production, schedule it: Dashboard → Edge Functions →
      `send-balance-reminders` → Schedule → `0 10 * * *`.

---

## 7. Full-payment path

- [ ] A new student picks **Pay in full**, pays $3,600.
- **DB:** `payment_status=paid` immediately, `payment_plan=full`, `balance_cents=0`,
      but `status=awaiting_confirmation` — still gated on the instructor.
- [ ] Instructor confirms → `enrolled`. **✉ student** confirmation.

---

## 8. Guard / negative checks

- [ ] **Duplicate booking:** with an active booking, hit `paypal-checkout.html?cohort=<id>`
      again and try to pay → `paypal-create-order` returns **409 "You already have a
      booking for this cohort"**.
- [ ] **Balance on a declined booking:** decline a deposit student, then try the
      balance URL → **409 "This booking is no longer active"** (no charge).
- [ ] **Abandoned checkout:** open checkout, cancel on the PayPal screen. A
      `status=pending/payment_status=pending` row is created but the **student dashboard
      does not** show a phantom card, and the cohort still appears in the "Book"
      list (the timeline view filters both-pending rows).
- [ ] **Amount integrity (code-level):** `paypal-capture-order` verifies the captured
      amount equals the server-computed `deposit_cents`/`balance_cents` — a tampered
      client amount is rejected with **400 "Amount mismatch"**. (Not easily forced via
      the sandbox UI; confirm by reading the function, or by editing `deposit_cents` in
      the DB after order creation and re-capturing → expect the mismatch error.)

---

## 9. Cleanup

```sql
-- Removes test cohorts and cascades to their enrollments + messages.
delete from cohorts where title ilike '%TEST%';
```

---

## Sign-off

| Area | Pass |
|------|------|
| Deposit capture → awaiting_confirmation + emails | [ ] |
| GET link is read-only; button POST confirms | [ ] |
| Dashboard confirm + decline | [ ] |
| Capacity full ↔ published revert | [ ] |
| Balance payment → paid, balance 0 | [ ] |
| Balance reminder fires once | [ ] |
| Full-payment path | [ ] |
| Duplicate / declined-balance / abandoned guards | [ ] |

Once all green in sandbox: set `PAYPAL_ENV=live`, put the **live** client id in
`paypal-config.js` (`PAYPAL_CLIENT_ID_LIVE`) and live REST creds in the server
secrets, redeploy, and do one **small real** booking end-to-end before announcing.
