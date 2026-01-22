# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What We're Building

**EducatedTraveler** offers certified skill immersions at premium destinations worldwide. Learn diving in Thailand, sailing in Greece, yoga in Bali—and leave with real credentials (PADI, RYA, Yoga Alliance, WSET).

*"One week to get certified. 6 months to change your life."*

**The spectrum:**
- **7-21 days** ($3,500-$6,500) — Get certified. This is the entry point.
- **1-3 months** ($9,500-$12,000) — Go deeper.
- **6 months** ($25,000-$40,000) — Transform your life.

Always lead with shorter options. The 7-day certification is the gateway, not the 6-month commitment.

## Commands

**Prototype** (React app in `prototype/`):
```bash
cd prototype && npm install
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```

**Website** (static HTML in `website/`):
```bash
python3 -m http.server 8000 --directory website
```

**Deployment**: Pushes to main auto-deploy via Netlify (`educatedtraveler.app`).

## Key Directories

- **`os/`** — Single source of truth. Start here for any new work.
  - `daemon.md` — Mission, principles, non-negotiables
  - `products.md` — Full product catalog with pricing
  - `brand/design-system.md` — Colors, typography, components
  - `brand/landing-pages.md` — Copy patterns
- **`website/`** — Production static HTML (forms → Google Sheets via Apps Script)
- **`prototype/`** — React + Vite + TypeScript (work in progress)

## Non-Negotiables

- Cohorts: 8-12 max
- Instructors: 5+ years, certified
- No sitting blocks over 90 minutes
- Rest days: 1/week minimum

## Brand Voice

**Say:** "Skill adventures at the source" · "Choose your depth" · "Certified" · "Cohort"

**Don't say:** "Life-changing" (overused) · "Journey" alone · "Luxury" · "Easy"

## Design

Apple glass meets Netflix minimal. Darkness as canvas, content glows.

```
Background:      #000000
Glass:           rgba(255,255,255,0.03)
Text:            #FFFFFF / rgba(255,255,255,0.60)
Cyan (sailing):  #06B6D4
Amber (culinary): #F59E0B
Orange (wellness): #F97316
```

Font: Inter. Mobile-first. Netflix-style cards.
