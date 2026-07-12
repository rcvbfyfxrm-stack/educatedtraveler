# The Circle Portrait — build handoff

Built 2026-07-12. **Nothing deployed, nothing sent** — Arnaud is the deploy + email gate.

## What this is
A login-gated, letter-driven questionnaire at **`/portrait`** where a member becomes
"the author of their own week." Magic-link sign-in (logs in *or* creates the account),
a delightful multi-beat flow, and it **writes their real `profiles` row** — culminating
in a **private letter to Arnaud**. Each completion **emails Arnaud** the answers + letter.

## Files
- `website/portrait.html` — the page (self-contained; reuses ET design lock + real Atlas crafts).
- `supabase/migrations/022_portrait_letter.sql` — adds `dream_letter, reach, portrait_complete, portrait_completed_at` to `profiles` (everything else reuses existing columns from 005).
- `supabase/functions/notify-portrait/index.ts` — emails Arnaud when a portrait is sealed. Called by the page via `supabase.functions.invoke('notify-portrait')`; verifies the caller's JWT and re-reads their own profile server-side (Resend, warm-dark shell, includes the letter). No DB webhook/trigger needed.
- `PORTRAIT_NOTIFY_TO` secret = where the note lands (defaults to arnaudcallier@pm.me).

## The flow (beats)
0. Who you are — name + email (email hidden if already signed in)
1. You now — profession, "what brought you to the door" (life-stage), location
2. The craft you'd give a week to — worlds → real disciplines (up to 3) + name-your-own
3. Where you're starting from — depth / timing / length / reach (skippable)
4. **The letter** — a real sheet of paper, "Dear Arnaud," → `dream_letter` (private)
5. Your portrait — a recap mirror of everything → **Seal** → upsert `profiles`

Answers persist in `localStorage` so a not-signed-in member can fill everything, get a
magic link at "Seal," and have it **auto-save on return** from the link.

## To go live (Arnaud's gate)
1. **Push** `website/portrait.html` to `main` (GitHub Pages → `/portrait`).
2. **Apply migration 022**: `supabase db query --linked --yes "$(cat supabase/migrations/022_portrait_letter.sql | sed '/^\/\*/,/\*\//d')"` — or paste the `ALTER TABLE` block in the SQL editor. (The commented OPTION B trigger is optional.)
3. **Deploy the function**: `supabase functions deploy notify-portrait`.
4. **Wire the webhook** (Dashboard → Database → Webhooks): table `profiles`, event `UPDATE`, → edge function `notify-portrait`. (OPTION A in the migration.)
5. **Set the recipient**: `supabase secrets set PORTRAIT_NOTIFY_TO=arnaudcallier@pm.me` (defaults to that if unset). Needs `RESEND_API_KEY` (already set for the other email functions).
6. Optional: repoint some "Join the Circle" CTAs for logged-in/returning members from `/circle` (anon demand-map) → `/portrait`.

## Notes / decisions
- `/circle` (anon demand-map → launch_waitlist) and `/survey` are **untouched** — this is additive.
- The letter is **private to Arnaud** (founder decision). No member-facing sharing.
- Trust lock honored: every craft name is a live Atlas discipline; no prices/booking; promise copy stays name-safe ("Barcelona this autumn").
