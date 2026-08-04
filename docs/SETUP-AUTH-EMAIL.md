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

> **No longer pasted by hand.** As of 2026-08-04 the four templates are declared
> in `supabase/config.toml` (`[auth.email.template.*]`, pointing at the files in
> `docs/email-templates/`). Edit the file, then ship it with:
>
> ```
> supabase config push --project-ref exaehwaqwcledemwpluw
> ```
>
> That makes them version-controlled, so the contrast check and CI cover them
> like everything else. Subjects are pinned in `config.toml` too — a push would
> otherwise blank them.
>
> Two traps worth knowing. `content_path` resolves from the **project root**, not
> from `supabase/`. And the CLI pushes storage defaults whether or not you list
> them: its default turns `vector.enabled` on, which 402s on this tier and aborts
> the run *after* the auth block has already applied — so the push looks failed
> when auth in fact went through. `[storage.vector] enabled = false` is pinned to
> the remote value to keep the command clean.

### The one rule for anything we email

**An email must be readable on a white page.** Gmail throws away `<body>`
styling and renders on its own white background. Our letters used to be
near-white text over `background:#0d0b09` on `<body>` — so they arrived as pale
text on white, effectively blank. Warm-Dark belongs on the website, which is a
browser and strips nothing; email gets the light letter palette instead.

In practice: dark text, solid hex colours only (Outlook ignores `rgba()`), and
never let legibility depend on a background surviving the trip.

Run `node scripts/check-email-contrast.mjs` before pasting anything. It fails on
all three mistakes, and CI runs it on every push.

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
