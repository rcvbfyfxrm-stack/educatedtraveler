# Playbook — Circle Concierge Drafting

**What it is.** The content half of the Circle Concierge. `scripts/concierge-draft.mjs`
scans hands raised and drops skeleton `concierge_queue` rows at `status='draft'`
(who, what craft, whether the Atlas already covers it). This routine turns each
skeleton into a real, **source-verified** draft — a surprising fact, Arnaud's personal
reply, and (for a craft the Atlas doesn't cover yet) a full Atlas skill sheet — and
leaves it at `status='draft'` for Arnaud to judge in the Studio.

**The one rule that governs everything here: NEVER FABRICATE.** Every fact, school,
teacher, and credential must be literally true and attributable. Where you cannot verify
something, say so plainly and leave it out — a thin honest draft beats a rich invented one.
This is ET's first principle; a single made-up detail poisons the whole map.

**Nothing this routine does is public.** It only writes drafts. Publishing an Atlas page
and sending a message both require Arnaud flipping status in the Studio. Never set
`approved`, `published`, or `sent`.

---

## When it runs
Nightly, right after `concierge-draft.mjs` (the scanner) and before
`concierge-publish.yml` (03:42) — so drafts exist before Arnaud's morning review, and
anything he approves overnight publishes on the next run.

## Inputs
Rows in `concierge_queue` where `status='draft'` and content is still missing:
`message_md IS NULL` OR `fact_md IS NULL` OR (`atlas_action='create'` AND `skill_sheet_md IS NULL`).
Read them with the service key; write them back with the service key (bypasses RLS).

## For each row, produce:

1. **`fact_md` + `fact_source`** — ONE genuinely surprising, genuinely TRUE thing about
   the craft. `fact_source` is a real, citable URL you actually checked. If you can't
   verify a fact you'd stand behind, leave both null and say why in `claude_notes_md`.
   Do not reach for a fact you're unsure of.

2. **`message_md` (+ `message_subject`)** — Arnaud's personal reply, first person, in ET
   voice: warm, literary, unhurried, specific to *this* person and *this* craft. No sell,
   no hype, no urgency; the price is never justified. Short. If `atlas_action='exists'`,
   point them at `atlas_url` (the real page) and ask where they are with the craft. If
   `atlas_action='create'`, tell them you're opening a page for it because they asked —
   honest, not a promise of a product.

3. **If `atlas_action='create'`: `skill_sheet_md` (+ `world`)** — the full Atlas skill
   sheet in Markdown, to the SKILL-SHEET STANDARD:
   - what the craft *really* is (the thing under the tourist version);
   - where it is **genuinely alive** — real schools with **named** teachers, the credential
     stated for what it actually is, no pay-to-play; where you're still verifying, write
     "still verifying" rather than assert;
   - how you'd actually use it / why it lasts;
   - honest gaps — say what you don't yet know.
   Set `world` to the Atlas world it belongs to. `page_html` is rendered from
   `skill_sheet_md` by `scripts/atlas-page.mjs` (the overnight build / publish step does
   this), so you do not have to write HTML — write a clean sheet.
   - If the "craft" named in someone's own words is **not a real, teachable discipline**,
     set `atlas_action='none'`, explain in `claude_notes_md`, and build no page.

4. **`claude_notes_md`** — a short note FOR ARNAUD: what you verified, the source, what's
   uncertain, and anything he should decide. This is where you're honest about the edges.

5. Leave `status='draft'`. **Never** approve, publish, or send.

## Guardrails (ET DNA — non-negotiable)
- Never invent a school, teacher, credential, price, date, or statistic.
- Every claim in a sheet must be attributable; when unsure, write that you're verifying.
- Source-first: the craft has to be genuinely alive where you send people.
- English-forward, plain, no marketing gloss. "If I wouldn't send a friend, it isn't here."
- One draft per (person × craft); the scanner's `ext_id` already dedupes.

## How the loop actually runs (Claude-in-the-loop — chosen 2026-07-28)
Enrichment is NOT an unsupervised cron (a cloud agent can't safely hold the service
key, and source-claims shouldn't be written unwatched). Instead:
1. Nightly, the scanner (`concierge-draft.mjs`, GitHub Action, needs the
   `SUPABASE_SERVICE_ROLE_KEY` repo secret) drops skeleton rows at `status='draft'`.
2. Arnaud pings Claude ("draft the concierge queue"). Claude pulls the skeletons:
   `node scripts/concierge-queue.mjs --pending > /tmp/pending.json`
3. Claude researches each craft and writes the verified content — fact + `fact_source`,
   the reply, and (for a `create`) the skill sheet — into an enriched JSON, following
   the rules above. Arnaud sees the sources before it is even a draft.
4. Apply it back (page_html is rendered for `create` rows automatically):
   `node scripts/concierge-queue.mjs --apply /tmp/enriched.json`  (rows stay `draft`)
5. Arnaud judges each in the Studio and approves — publish/send follow, both gated.
Both scripts need `SUPABASE_SERVICE_ROLE_KEY` in env and touch ONLY draft/changes_requested rows.

## Downstream (already built — do not rebuild)
- Arnaud reviews every draft in the Studio "What's Hot" tab: edits the message/sheet,
  requests changes, parks, or **Approves**.
- Approving a `create` row → `concierge-publish.mjs` writes the live `/atlas/<slug>.html`
  and stamps `published`; then the **Send** button emails the person (gated).
- For `exists` / `none` rows there is no page to publish — Approve makes them sendable directly.
