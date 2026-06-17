# The Circle — newsletter sender (setup runbook)

**STATUS: DEPLOYED & VERIFIED 2026-06-17 (no emails sent yet).** Migration applied to
prod; all three functions deployed; dry-runs pass (welcome renders, broadcast reads the
list = 0 recipients, auth rejects bad tokens). Remaining = your call: send a test to
yourself, wire the auto-welcome webhook, and the first real broadcast (see end).

Reuses the existing **Resend** stack (domain `educatedtraveler.app` already verified —
emails send from `founder@educatedtraveler.app`; `RESEND_API_KEY` already a Supabase
function secret). No new third-party account, no DNS work.

**What's deployed (all typecheck-clean):**
- `migrations/021_circle_newsletter.sql` — adds `unsubscribed`, `unsubscribe_token`, `welcomed_at`, `last_issue` to `launch_waitlist`.
- `functions/_shared/circle-emails.ts` — warm templates (welcome + issue-01) + `sendCircleEmail` (with one-click `List-Unsubscribe` headers).
- `functions/circle-welcome/` — auto-welcome on signup (DB webhook). Re-fetches the row by id (anti-forgery); sends once.
- `functions/circle-unsubscribe/` — public token link; one-click + click-through page.
- `functions/circle-broadcast/` — admin-only (service-key bearer). Modes: `dryRun` (count, sends nothing), `test` (one address), real send.

Baseline: `launch_waitlist` is currently **empty (0 rows)** — zero blast risk.

---

## Activation (run from the repo dir)

```bash
cd "/Users/callierapca/Library/CloudStorage/ProtonDrive-arnaudcallier@pm.me-folder/NEXUS/Projects/I/educatedtraveler"
set -a; . ./.env; set +a            # loads SUPABASE_URL + SUPABASE_SERVICE_KEY
FN="https://exaehwaqwcledemwpluw.supabase.co/functions/v1"

# 1) migration (additive, idempotent)
supabase db query --linked --yes "$(cat supabase/migrations/021_circle_newsletter.sql)"

# 2) deploy the three functions (all public/self-guarded → --no-verify-jwt)
supabase functions deploy circle-welcome     --no-verify-jwt
supabase functions deploy circle-unsubscribe --no-verify-jwt
supabase functions deploy circle-broadcast   --no-verify-jwt
```

## Verify (sends NOTHING)

```bash
# welcome renders?
curl -s -X POST "$FN/circle-welcome" -H 'Content-Type: application/json' -d '{"dryRun":true}'
# broadcast can read the list + render an issue?
curl -s -X POST "$FN/circle-broadcast" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H 'Content-Type: application/json' -d '{"issue":"issue-01","dryRun":true}'
```

## Send a test to yourself (one real email to your inbox)

```bash
curl -s -X POST "$FN/circle-broadcast" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H 'Content-Type: application/json' -d '{"issue":"welcome","test":"arnaudcallier@pm.me"}'
curl -s -X POST "$FN/circle-broadcast" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H 'Content-Type: application/json' -d '{"issue":"issue-01","test":"arnaudcallier@pm.me"}'
```

## Wire the auto-welcome (Database Webhook)

Dashboard → **Database → Webhooks → Create a new hook**:
- Table `public.launch_waitlist` · Events: **Insert**
- Type: **Supabase Edge Function** → `circle-welcome` · Method POST
- (No secret needed — the function self-validates against the real row.)

From then on, every new Circle signup gets the welcome automatically. Disable by
deleting the webhook.

## Send issue #1 for real (only when you have a list, and you've approved it)

```bash
curl -s -X POST "$FN/circle-broadcast" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H 'Content-Type: application/json' -d '{"issue":"issue-01"}'
```

## Adding future letters
Add an entry to `ISSUES` in `_shared/circle-emails.ts` (e.g. `"issue-02"`), redeploy
`circle-broadcast`, then broadcast with `{"issue":"issue-02"}`. Keep the shape: one
place/master, one question, one Atlas link. Drafts live in `marketing/circle/`.
