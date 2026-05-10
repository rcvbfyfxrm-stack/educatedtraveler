# EducatedTraveler — Implementation Plan

Created 2026-04-23. Companion plan for Littoralicious lives in `../littoralicious/IMPLEMENTATION-PLAN.md`.

## Why this plan exists

Audit on 2026-04-23 found:
- **39 partners in the CSV, zero outreach emails sent.** Infrastructure (playbooks, templates, HubSpot, Notion) has been ready since Feb 2026 and is bleeding time-to-market weekly.
- `website/js/experiences.js` has ~24 hand-curated experience objects that duplicate content in `os/products.md`, `os/experiences/*.md`, and `setup/notion-experiences.csv`. Guaranteed drift.
- Cohort syllabus lives in `live-experiences/*.md` AND partially in the Supabase `cohorts` table. Dual-entry.
- A 12,000-line `.claude/agents/marketing.md` exists but is never invoked on a schedule — output stays in chat.
- Prototype (`prototype/`) is still the default Vite counter scaffold, costing mental overhead.
- Known RLS bug: policy references `profiles.visible` which is not in the schema.

Top-line fix: stop treating markdown docs as data, and activate the outreach engine that's already 95% built.

## Priority tiers

### Tier 1 — Build first

| ID | Name | Status | Files |
|----|------|--------|-------|
| E1 | Partner outreach engine | scaffolded 2026-04-23 | `.claude/skills/partner-outreach.md`, `.claude/agents/partner-scout.md`, `scripts/next-outreach-batch.py` |
| E2 | `experiences.js` ↔ `products.md` sync | deferred (large) | planned: `os/experiences/*.yaml` → `scripts/build-experiences.mjs` → `website/js/experiences.js` |
| E3 | Cohort syllabus in Supabase | deferred (migration) | planned: `supabase/migrations/007_cohort_syllabus.sql` + dashboard editor |
| E4 | Marketing draft pipeline | scaffolded 2026-04-23 | `.claude/skills/draft-ig-post.md` |

### Tier 2 — Strong ROI

| ID | Name | Status | Notes / Files |
|----|------|--------|---------------|
| E5 | Notion ↔ markdown mirror agent | planned | Uses existing Notion MCP. Nightly. Markdown wins on conflict. |
| E6 | Supabase migration lint + preview deploys | planned | GitHub Action: `supabase db lint` on PR + Netlify deploy previews + Playwright smoke. |
| E7 | Student interview intake form | planned | `interview.html` + Edge function `send-interview-request`. Funnels to HubSpot via Zapier. |
| E8 | First-cohort ops dashboard | planned | Sushi Academy kicks off Sep 21 with 2 students. New `cohort_tasks` table. |
| E12 | Follow-up detector | **live** — first run flagged FERRANDI Paris at 13d + 3 Antibes partners at 9d | `scripts/find-followups.py` |
| E13 | `/partner-followup` skill | **live** | `.claude/skills/partner-followup.md` |
| E14 | 4 follow-up drafts saved on-the-side (2026-04-23) | **pending your approval** — FERRANDI (FR Paris), Ocean Wave Monaco, Seascope France, Secrets de Cuisine (FR) | `logs/outreach-drafts/2026-04-23-followup-*.md` |
| E15 | IG voice lint | **live** — tested: catches banned phrases, missing credentials, frontmatter gaps | `scripts/ig-lint.py` |
| E16 | Daily outreach digest | **live** — first run: 🟢4 🟡5 🔴12 ⚪30, 5 drafts pending | `scripts/outreach-digest.py` |
| E17 | Outreach digest cron | **scaffolded 2026-04-23** — install plist to enable weekday 09:00 | `NEXUS/scripts/automations/com.arnaud.et-outreach-digest.plist` |
| E18 | Supabase schema snapshot | **scaffolded** — run after linking CLI to project | `scripts/snapshot-schema.sh` |

### Tier 3 — Polish

| ID | Name | Notes |
|----|------|-------|
| E9  | ~~Kill-or-commit prototype~~ | **Done 2026-05-09** — `prototype/` deleted (was default Vite counter). React revisit deferred until website becomes a true bottleneck. |
| E10 | Email templates in repo | Move from Resend dashboard to `supabase/email-templates/*.mjml`, sync via Resend API on deploy. |
| E11 | Quest selector instrumentation | `quest_events` Supabase table. Weekly cohort analysis of which persona→experience paths convert. |

## E1 — Partner outreach engine (detail)

The single highest-leverage build. Components:

1. **`.claude/agents/partner-scout.md`** — invoked daily. Reads `os/partners/outreach-tracker.md` + the relevant country guide + `Playbook - Partner Outreach Email.md`. Drafts a personalized email for the next ⚪ Not Contacted partner. Stops before sending.
2. **`.claude/skills/partner-outreach.md`** — user-invoked (`/partner-outreach`). Surfaces the drafted email for approval. On approval: send via mail MCP, update tracker (⚪ → 🔴, set First Contact date, set Next Action = "Follow up 2026-MM-DD +7"), create HubSpot deal via Zapier.
3. **`scripts/next-outreach-batch.py`** — picks the next N partners to contact, prioritized by flagship alignment and country/city where cohorts already exist. Writes a batch file to `logs/outreach-batch-YYYY-MM-DD.md`.

### Guardrails

- **Never send without explicit human approval.** Skill presents full draft, waits for "yes" (matches existing `feedback_review_emails.md` rule in memory).
- Rate limit: max 5 new outreaches per day.
- Follow-up cadence: +7 days for first ping, +14 for second, then close as ❌ Declined.

## Non-goals (explicit)

- No full CRM rewrite. HubSpot and Notion stay as-is.
- No React prototype work until E9 decided.
- No Supabase schema work inside E1 (leave E3/E6 for later).

## Success metric

- **Week 1 post-E1**: 10 outreach emails sent (vs. 0 today).
- **Month 1**: outreach-tracker.md reflects real pipeline state without manual editing.
- **Month 3**: 5+ partners in 🟡 In Progress or 🟢 Confirmed (currently 2).
