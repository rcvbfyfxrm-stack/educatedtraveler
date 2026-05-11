# SETUP — Auth Emails From founder@educatedtraveler.app

This fixes the "sign-up emails land in junk because they come from `noreply@mail.app.supabase.io`" problem.

Two things happen here:

1. **Custom SMTP** — route Supabase Auth emails through Resend (same provider you already use for welcome / follow-ups), sending FROM `founder@educatedtraveler.app`.
2. **Custom templates** — replace the generic Supabase emails with branded HTML.

Result: every confirmation, magic link, and password-reset email arrives as if you wrote it yourself, lands in the inbox (not spam), and matches the brand.

---

## Prerequisites

- Resend API key (already in `RESEND_API_KEY` env for the edge functions).
- `educatedtraveler.app` verified in Resend (you already have this — `send-welcome-email` uses `founder@educatedtraveler.app`).
- Access to Supabase Dashboard for project `exaehwaqwcledemwpluw`.

---

## Step 1 — Supabase Auth → SMTP Settings

Supabase Dashboard → **Project Settings → Auth → SMTP Settings** → toggle **Enable Custom SMTP**.

Fill in:

| Field | Value |
|---|---|
| Sender email | `founder@educatedtraveler.app` |
| Sender name | `Arnaud — EducatedTraveler` |
| Host | `smtp.resend.com` |
| Port number | `465` |
| Username | `resend` |
| Password | *your Resend API key* (`re_...`) |

Then **Save**. Use the "Send test email" button to verify a real message lands in your inbox.

> Rate limits: free Resend tier is 100 emails/day, 3,000/month. Plenty for the current volume but worth tracking on the Resend dashboard.

---

## Step 2 — Email rate limits

Same screen, **Email rate limit** section: bump to at least **30 emails/hour** so a busy launch day doesn't get throttled.

---

## Step 3 — Custom templates

Supabase Dashboard → **Auth → Email Templates**.

Replace the four templates that Supabase actually sends:

- **Confirm signup**
- **Magic Link**
- **Reset Password**
- **Change Email Address**

Each template uses Supabase variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`.

Drop in the HTML from `docs/email-templates/`:

- `auth-confirm-signup.html`
- `auth-magic-link.html`
- `auth-reset-password.html`
- `auth-change-email.html`

(They share the same look as `supabase/functions/send-welcome-email/index.ts` — dark background, EducatedTraveler wordmark, "Skills last, tans fade." footer.)

Subject lines:

- Confirm signup → `Confirm your EducatedTraveler account`
- Magic link → `Your sign-in link for EducatedTraveler`
- Reset password → `Reset your EducatedTraveler password`
- Change email → `Confirm your new email — EducatedTraveler`

---

## Step 4 — Verify deliverability

Send a test sign-up from a fresh Gmail / Outlook / iCloud address. Check:

- Sender displays as **Arnaud — EducatedTraveler `<founder@educatedtraveler.app>`**.
- Lands in primary inbox (not Promotions / Junk).
- SPF / DKIM / DMARC all pass — paste the message header into https://mxtoolbox.com/EmailHeaders.aspx and confirm all three are green.

If DKIM fails, the domain isn't fully verified in Resend yet — fix that first.

---

## Optional — Verify domain alignment

DMARC alignment requires that the **From domain** matches the **Return-Path domain**. Resend handles this when the domain is fully verified. Confirm in the message header that `Return-Path: bounces@<something>.resend.com` and `From: founder@educatedtraveler.app` both ultimately resolve to passing DKIM/SPF — most Gmail clients will show "signed-by: educatedtraveler.app" on the message details if alignment succeeded.
