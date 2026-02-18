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

**Website** (static HTML in `website/` — this is the live production site):
```bash
python3 -m http.server 8000 --directory website
```

**Prototype** (React scaffold in `prototype/` — not yet built out):
```bash
cd prototype && npm install
npm run dev      # Dev server on localhost:5173
npm run build    # Production build
npm run lint     # ESLint
```

**Supabase Edge Functions** (in `supabase/functions/`):
```bash
supabase functions serve    # Local dev
supabase functions deploy send-welcome-email
supabase functions deploy send-followup-emails
```

**Deployment**: Pushes to `main` auto-deploy via Netlify → `educatedtraveler.app`. Netlify publishes `website/` with no build step.

## Architecture

### Website (`website/`)

Production static site. No build step — Tailwind loaded from CDN, Inter font via Google Fonts.

**Pages**: `index.html` (homepage), `vision.html`, `offerings.html`, `about.html`, `instructors.html`, `survey.html`, `community.html`, `dashboard.html` (auth-gated), `auth-callback.html` (magic link handler).

**JS modules** (`website/js/`):
- `supabase-config.js` — Initializes Supabase client on `window.supabaseClient`
- `auth.js` — Magic link auth (`signInWithOtp`), session management, modal UI. Exposed as `window.auth`
- `database.js` — All DB operations (profiles, preferences, saved adventures, badges, XP). Exposed as `window.db`

**Homepage (`index.html`)** is ~1,600 lines and contains the core product logic:
- **Quest selector** — 4-question interactive tool scoring against 22 hardcoded experience objects
- **Persona system** — 6 personas (Ocean Tactician, Blue Depth Seeker, Quiet Storm, Kitchen Alchemist, Edgewalker, Wild Guide)
- **Gamification** — XP popups, confetti, achievement toasts, badge system
- **Dual forms** — Netlify Forms (backup) + Supabase for signed-in users

### Supabase Backend

Auth via passwordless magic links. Four tables (all with RLS):
- `profiles` — user data, XP, level
- `user_preferences` — quest selections (elements, desires, time, intensity)
- `saved_adventures` — bookmarked experiences
- `user_badges` — earned achievements

Edge Functions (Deno, using Resend for email):
- `send-welcome-email` — triggered by webhook on profile creation
- `send-followup-emails` — daily cron: Day 3 and Day 7 nurture emails

Schema defined in `website/supabase-schema.sql`. Migration in `supabase/migrations/`.

### Prototype (`prototype/`)

React 19 + Vite + TypeScript scaffold. Currently still the default Vite starter — `src/App.tsx` is the counter demo. `educated-traveler-quest.tsx` sits loose in the prototype root as a design exploration, not wired into the app.

### Operating System (`os/`)

Single source of truth for all strategy, brand, and product decisions. **Start here for any new work.**

- `Daemon - EducatedTraveler.md` — Mission, principles, non-negotiables, 12 Commandments
- `Agent - EducatedTraveler.md` — Full AI decision framework (500+ principles)
- `products.md` — Product catalog with pricing (Foundation/Mastery/Saga tiers)
- `brand/design-system.md` — Colors, typography, components, animations
- `brand/brand-guardrails.md` — Voice and messaging rules
- `core/` — Instructor manifesto, customer archetypes, partnership filter
- `playbooks/` — Operational playbooks (partner onboarding, outreach, interviews)
- `partners/` — 15 country guides, partner evaluations, outreach tracker

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

Font: Inter. Mobile-first. Netflix-style cards. Custom `.glass` and `.cta-button` classes in per-page `<style>` blocks.

## Netlify Config

Pretty URLs configured for `/about` → `about.html` and `/instructors` → `instructors.html` in `netlify.toml`. Add new redirects there when creating new pages.
