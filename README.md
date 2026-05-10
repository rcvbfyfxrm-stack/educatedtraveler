# EducatedTraveler

**Certified skill immersions at the source.**
Learn diving in Thailand, sailing in Greece, sushi in Tokyo — and leave with real credentials (PADI, RYA, Yoga Alliance, WSET, Le Cordon Bleu).

> *"One week to get certified. Six months to change your life."*

## The Tiers

| Tier | Duration | Price | Cohort |
|------|----------|-------|--------|
| **Foundation** | 7–21 days | $3,500–$6,500 | 8–12 |
| **Mastery** | 30–60 days | $9,500–$12,000 | 8–12 |
| **Saga** | 90–180 days | $25,000–$40,000 | 8–12 |

Always lead with shorter options. The 7-day certification is the gateway.

## Repo Layout

```
website/              Production static site (Netlify → educatedtraveler.app)
  ├─ *.html           Pages (see CLAUDE.md for full list)
  ├─ js/              supabase-config, auth, database, whatsapp-widget
  ├─ images/          Logo + page imagery
  └─ supabase-schema.sql   Authoritative schema snapshot

supabase/
  ├─ functions/       Edge functions (Deno + Resend): welcome, follow-up, WhatsApp, interest, Stripe
  └─ migrations/      Incremental SQL (run in order)

src/trigger/          Trigger.dev jobs (granola-meeting, new-signup)
live-experiences/     Real instructor cohort notes (hiroko-ishii, martin-lippo)
os/                   Strategy, brand, product, playbooks — single source of truth
docs/                 Ops docs: outreach, partner & influencer templates, roadmap
setup/                CRM / Notion imports (HubSpot, Notion CSVs, workflows)
marketing/            QR codes + IG asset HTML
scripts/              Outreach + audit + lint automation (Python + mjs)
photo/                Raw source photos (instructor / cohort) — staging, not site assets
logs/                 Decision log, ideas, outreach drafts
tests/                Playwright smoke tests
_archive/             Legacy strategy/business docs (frozen 2026-02)
```

**Key plans:**
- `BUSINESS-STRATEGY.md` — 3-lever growth playbook (Pipeline · Cohort · Demand)
- `IMPLEMENTATION-PLAN.md` — engineering priorities

## Quick Start

**Run the site locally:**
```bash
python3 -m http.server 8000 --directory website
```

**Deploy:** Push to `main` — Netlify auto-deploys from `website/`.

**Edge functions:**
```bash
supabase functions deploy send-welcome-email
supabase functions deploy send-followup-emails
```

**Database:** Apply `supabase/migrations/*.sql` in order, then the base `website/supabase-schema.sql` for reference.

## Brand

Apple glass meets Netflix minimal. Darkness as canvas, content glows.

- **Sacred words:** Immersion · At the source · Cohort · Choose your depth · Earned, not bought · Certified
- **Banned:** Transformation · Life-changing · Journey · Luxury · Easy

See `os/` for the full product and brand system. See `CLAUDE.md` for AI-agent guidance.

## Contact

- **Web:** [educatedtraveler.app](https://educatedtraveler.app)
- **Email:** hello@educatedtraveler.app
