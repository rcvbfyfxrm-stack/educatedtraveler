# Dashboard Audit & Architecture v2

**Date:** 2026-05-12
**Subject:** The `/cmd` private command center
**Verdict on v1:** Shipped, useful as a strategy reference, **not yet the cockpit a yacht-chef solo founder needs.**

---

## 1. The Real Job Of This Dashboard

Strip the polite framing. The dashboard exists to do **three things** every time it opens, in this order:

1. **Tell Arnaud what to do RIGHT NOW** — given founder bandwidth = scarce, the dashboard must collapse 100 possible moves into the 1–3 that compound today.
2. **Honestly mirror the funnel** — deposits paid vs. 12 needed by July 5, where the leak is, what to fix this week.
3. **Capture incoming signals fast** — new signup, hot survey lead, partner reply, DM, voice memo on a walk — all into one inbox, triaged in <30 seconds.

Everything else (strategy reference, IG kanban, year-view checklist) is **support material**, not the core loop.

The v1 buried the core loop under support material. The v2 inverts it.

---

## 2. Honest Audit Of v1

### What v1 got right
- Auth-gated · same is_admin pattern as `/admin`
- Live signups feed (real Supabase data, click-to-expand)
- Progressive 9-phase year-long checklist (locked future unveils)
- IG kanban with drag-drop and localStorage
- Strategy reference cards (marketing + dev)
- Race-condition fix for window.auth load timing
- Mobile responsive (Tailwind grid)
- Sealed visual identity (BMW glass)

### What v1 gets wrong

| # | Issue | Cost |
|---|-------|------|
| 1 | **"Mission of the Week" deposits 2/12 is hardcoded HTML** — the single most important number in the business is hand-typed | The dashboard lies to you the moment a real deposit arrives |
| 2 | **No live funnel** — signup→quest→interest→app→deposit cascade with real conversion rates is missing | Can't diagnose where the leak is |
| 3 | **No "Today" view** — everything is at the same elevation, scrollable wall of stuff | Founder has to scan + decide what's important each visit |
| 4 | **No quick capture** — a voice memo on a walk has no destination | Best ideas die in WhatsApp drafts or worse, in your head |
| 5 | **Strategy cards are read-only docs embedded in HTML** | Reference, not action — you re-read the same paragraph 50 times |
| 6 | **IG tracker is disconnected from reality** — doesn't know if you actually published, doesn't track saves/shares/DMs | Vanity workspace |
| 7 | **No applicant queue** — once $500 deposits arrive, where do new applicants surface? | The whole point of the campaign has no inbox |
| 8 | **Survey hot leads** (`booking_intent: deposit_now` / `very_likely`) are not surfaced anywhere | High-intent leads sit in `survey_responses` invisible to you |
| 9 | **No diagnostic intelligence** — just raw numbers, no "biggest leak is X" interpretation | Dashboard tells you the score, not the strategy |
| 10 | **No mobile-first navigation** — long-scroll page, no bottom tab bar, no thumb-reachable primary actions | A chef checking this on iPhone in a yacht galley fights it |
| 11 | **Checklist completion doesn't connect to real-world signal** — checking "ship the deposit page" doesn't verify a real deposit arrived | Self-deception risk |
| 12 | **No anti-pattern guard** — the agent §12 lists what to refuse; the UI doesn't warn when you're about to do it | The moat erodes silently |
| 13 | **No decision-filter prompt** — the 5-question filter from agent §16 should fire when you add a task | Friction-free yes to wrong things |
| 14 | **No prompt library access** — agent §11 has Reel/carousel/sales-page prompts; you have to open the .md file separately | Generators are 4 clicks away from where you actually work |
| 15 | **Brand-voice lint missing** — IG drafts can include "transformation" / "vacation" / "luxury" and ship anyway | Brand drift compounds |
| 16 | **No cohort-specific operational view** for Sep–Oct execution — student WhatsApp pulse, photo shot list, daily check-ins have no UI | The hardest weeks have no instrument |
| 17 | **No founder energy check** — solo founders burn out invisibly | Operational psych blind spot |
| 18 | **Vanity metrics (signups, quest completions) get top billing** equal to real ones (deposits, applications) | Mixes the score with the noise |
| 19 | **No "what shipped this week"** retrospective | Every Friday should close the week with a 30-second written look back |
| 20 | **No goal/north star bar** that's always visible | The North Star metric should never be more than a glance away |

---

## 3. Architecture v2 — The Cockpit

### Principles

1. **Mobile-first, thumb-reachable.** Primary use case = iPhone in a galley or on a walk.
2. **One screen for "Today"** — the default view answers "what now?" in <5 seconds.
3. **Live > hand-toggled.** Auto-derive state from Supabase/Stripe/PayPal wherever possible.
4. **Three numbers only.** Deposits paid · applications open · days to cohort. Everything else is on demand.
5. **Capture > organize.** Quick-capture box always one tap away. Triage is later, capture is now.
6. **Time-aware.** T-minus drives priority. Sunday surfaces the batch. Friday surfaces the look-back.
7. **Decision filter built in.** The 5-question agent filter fires when adding a task or starting a new thread.
8. **Anti-noise.** Vanity metrics hidden by default. Only the two metrics that matter (§14 of Growth Engine 2026) are top-billed.
9. **Voice over text.** A "🎙 capture" button beats any form on a phone.
10. **Sealed visual identity.** BMW glass stays. No design drift.

### View Map (hash-routed, no SPA framework)

```
/cmd  →  TODAY (default)
/cmd#funnel
/cmd#people
/cmd#content
/cmd#year
/cmd#playbook
/cmd#log
```

Bottom tab bar (mobile sticky):
```
[ TODAY ]  [ FUNNEL ]  [ PEOPLE ]  [ CONTENT ]  [ MORE → ]
```
`MORE` opens overflow menu to YEAR / PLAYBOOK / LOG.

Top sticky bar (always visible):
```
DEPOSITS X/12  ·  APPS Y  ·  T-N days  ·  ◆ today's priority chip
```

### View 1 — TODAY (the cockpit)

The 90% view. What loads when you tap the home-screen icon. Five blocks, top to bottom:

1. **Today's 3** — auto-derived top three open tasks from the earliest unlocked phase (priority cascade: now > ongoing daily > soon > cohort > execute …). Tap to check.
2. **Quick capture** — single text input + a 🎙 voice button (records → transcribes → stored in inbox). Goes to LOG view.
3. **Inbox (5 items max)** — newest signal needing 30-sec triage:
   - New signups (last 7 days) with their quest interests
   - Hot survey leads (`booking_intent` = `deposit_now` or `very_likely`)
   - Recent applications (when the deposit page goes live)
   - Each: one-tap email, one-tap mark-handled
4. **Sunday batch** (appears Fri/Sat/Sun only) — auto-suggested 3 Reel hooks + 2 carousel topics from the prompt library, ready to copy into Claude.
5. **Pulse** — three real numbers (NOT five):
   - **Deposits paid** (live from `enrollments` where payment_status='paid')
   - **Applications open** (interests with status='interested', awaiting call)
   - **Open tasks this week** (count of unchecked in `now` + ongoing)

### View 2 — FUNNEL (live diagnostic)

The honest mirror. Cascading widths show conversion rates, not just counts.

```
   SIGNUPS         150  ████████████████████████  
   QUEST DONE       40  ████████  (27%)
   SAVED ADV        22  ████  (15%)
   INTERESTS        14  ███  (9%)
   HOT SURVEYS       8  ██  (5%)
   APPLICATIONS      3  █  (2%)
   DEPOSITS PAID     2  ▌  (1.3%)
   ENROLLED          2  ▌  (1.3%)
```

Below: a **diagnostic line** generated client-side based on rate ratios:
- "Biggest leak: signup → quest. Push the quest from welcome email."
- "Funnel is healthy. Push more top-of-funnel."
- "Hot leads not converting to deposit. Discovery call cadence broken."

Right side: **goal trajectory** — "At current rate you hit 6/12 by July 5. Need +1.2 deposits/week."

### View 3 — PEOPLE (the CRM-lite)

Filter chips: **NEW** · **HOT** · **APPLICANTS** · **COHORT** · **PARTNERS** · **ALUMNI**

Each row: avatar · name · primary interest · age of signal · next-action button.

Tap row → drawer with full quest profile + saved adventures + interests + emails sent (if HubSpot-linked) + one-tap actions:
- Email compose (subject pre-filled with cohort context)
- Copy email
- Mark "contacted"
- Move to next-stage (interested → applied → deposited)

Hot detection rules (client-side):
- Survey: booking_intent in (deposit_now, very_likely)
- 3+ saved adventures in 7 days
- Quest intensity = high + completed in last 14 days
- 2+ experience_interests rows

### View 4 — CONTENT (the Sunday Batch + IG)

Three sections:

1. **This Sunday's batch** — pre-generated:
   - 3 Reel hook seeds (different pillars: Galley / Curriculum / Founder)
   - 2 Carousel skeletons (8-slide outlines)
   - 1 Long-form bullet for Salt & Saltwater
   - "Copy to Claude" button per prompt (includes brand-voice constraint)
2. **IG Kanban** (preserved from v1, enhanced):
   - Each card has a brand-voice lint badge (green=clean / amber=warning)
   - Banned-words check fires on save
   - Published cards prompt for actual IG URL + engagement metrics
3. **Prompt library shortcuts** — one-tap copy to clipboard:
   - Reel hook generator
   - Carousel skeleton
   - Sales page block
   - DM opener
   - Day-3 nurture email
   - Salt & Saltwater long-form

### View 5 — YEAR (the full checklist, preserved)

The existing 9-phase progressive-unveil checklist. No regression — keep what works.

Enhancements:
- **Auto-complete signals** — when payment_status='paid' first appears, auto-check "Ship the $500 deposit page" task.
- **Phase progress bars** — visual completion %
- **Locked phase teasers** show one peek-task to motivate

### View 6 — PLAYBOOK (the strategy reference, distilled)

The marketing + dev strategy from v1, but reorganized as **action snippets**:
- **The Premise** (one sentence, big type)
- **The Six Moves of May** (compact)
- **The Reverse Cohort Calendar** (one-row timeline)
- **The IG Pillar Mix**
- **The Price Ladder** with state per rung (LIVE / TODO / 2027)
- **The Decision Filter** (5 questions) — invocable when adding a task
- **The Anti-Patterns** — collapsed list, expands on click

Voices to steal section stays as a quick reference.

### View 7 — LOG (the founder journal)

The thing v1 doesn't have. The audit trail of running a company.

Sections:
- **Captured items** (from quick capture) — chronological, with transcripts for voice memos
- **Friday reflection** — single prompt each Friday: "What compounded? What to refuse next week?"
- **Decision log** — every Type-1 (irreversible) decision with reasoning, dated
- **Anti-patterns blocked** — moments you almost said yes and didn't

This view is the founder's memory. In 12 months it's worth more than the dashboard itself.

---

## 4. Data Connections

### Live Supabase (read-only via RLS / admin)
| Source | What surfaces |
|--------|--------------|
| `profiles` | Signups, names, locations, joined date |
| `user_preferences` | Quest answers, intensity, time pref |
| `saved_adventures` | Which experiences each user bookmarked |
| `experience_interests` | Pre-cohort interest with status flow |
| `survey_responses` | Hot leads (booking_intent), price tolerance, barriers |
| `enrollments` | Deposit/payment status, amounts, paid_at |
| `cohorts` | Capacity, dates, status — for goal calculation |

### LocalStorage (founder-private)
| Key | What it stores | Versioning |
|-----|----------------|-----------|
| `et_cmd_checklist_v3` | Year-long tasks (preserved from v1) | v3 |
| `et_cmd_ig_v2` | IG kanban cards (preserved from v1) | v2 |
| `et_cmd_inbox_v1` | Quick-captured items pre-triage | NEW |
| `et_cmd_log_v1` | Friday reflections, decision log | NEW |
| `et_cmd_view_v1` | Last visited view (so refresh keeps context) | NEW |
| `et_cmd_handled_v1` | Inbox items marked handled (don't re-surface) | NEW |

### Future integrations (post-v2)
- HubSpot (contacts, pipeline state) via Trigger.dev
- Notion (content calendar, partner tracker) via API
- Stripe webhooks → real-time deposit signals → dashboard pings
- IG Graph API (post engagement, DMs received)

---

## 5. The Mobile Discipline

Tested on iPhone 15 viewport (393×852):
- Top bar: 56px
- North Star bar: 48px
- Main content: ~700px scrollable
- Bottom tab bar: 64px (with safe-area inset)

Primary actions reachable with right thumb. Quick capture is always within thumb arc on every view.

---

## 6. The Eight Behaviors That Make v2 Different

| Behavior | Why it matters |
|----------|----------------|
| **Today's 3 auto-derived** | No daily "what should I do" decision-fatigue |
| **Quick capture in every view** | Best ideas never escape to WhatsApp drafts |
| **Live deposit count** | The score is the truth, not the wish |
| **Diagnostic line on funnel** | Tells you where to act, not just what's broken |
| **Hot leads surface to top** | Survey gold doesn't sit in a table you never query |
| **Sunday batch generator** | The single most important weekly habit is one tap away |
| **Brand-voice lint on IG** | The moat (voice) is protected at write time, not after |
| **Decision filter on new tasks** | The 5-question filter from agent §16 fires inline |

---

## 7. The Commit Plan

v2 ships as a **clean rewrite** of `website/cmd.html`. Same URL. Same auth gate. Same localStorage keys (no data loss). Same visual identity. New cockpit architecture inside.

After v2, the next moves (NOT in this rewrite — listed for transparency):
- Stripe webhook → real-time deposit ping into the dashboard
- HubSpot contact pipeline pulled into PEOPLE view
- Notion API integration for content calendar
- IG Graph API for actual engagement metrics
- Push notifications on hot signals
- iPhone home-screen PWA install instructions

But all of those are 2027 work. v2 today is the cockpit that makes shipping Sep 21 possible.

---

**Version:** 2.0 (this audit + architecture)
**Companion:** `Agent - EducatedTraveler - Growth Engine 2026.md`
**Companion site:** `educatedtraveler.app/cmd`

> *Strategy without instruments is hope. Instruments without strategy is noise. The dashboard is the bridge.*
