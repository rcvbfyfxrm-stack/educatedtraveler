# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standing rules (current — 2026-07, override anything below that conflicts)

1. **Trust at all levels, always** (the first rule). Never fabricate a review, count, credential, or claim; every public line must be checkable. Attribute verbal claims to their speaker ("Martin will tell you…").
2. **The future-use rule.** Every EducatedTraveler skill/course surface must answer, concretely: *"How will you use this skill in your future?"* — a required section on every commercial page, framed around career-specific situations, never promised outcomes.
3. **Positioning = THE OPEN DOOR** — serious, not shiny. Banned words in public copy: exclusive, elite, club, premium, luxury, transformation, life-changing, easy. No price justification on sales pages: state the price once, plainly, and sell what the buyer walks out with.
4. **Nothing is sold until it's real.** Add-ons and future weeks are "in development" until booked; counts show real paid seats only.

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

**Supabase Edge Functions** (in `supabase/functions/`):
```bash
supabase functions serve    # Local dev
supabase functions deploy send-welcome-email
supabase functions deploy send-followup-emails
```

**Deployment**: Pushes to `main` auto-deploy via **GitHub Pages** → `educatedtraveler.app`. Workflow at `.github/workflows/deploy-pages.yml` publishes `website/` with no build step. CNAME is `website/CNAME`. (`netlify.toml` is dormant legacy config — GitHub Pages does not read it; pretty URLs work because GH Pages auto-resolves extensionless paths to their `.html` file.)

## Architecture

### Website (`website/`)

Production static site. No build step — Tailwind loaded from CDN, Inter font via Google Fonts.

**Pages** (active): `index.html` (homepage + Quest selector), `offerings.html` (adventures catalog), `about.html` (founder story), `community.html` (waitlist + conversion hub), `instructors.html` (partner applications), `dashboard.html` (auth-gated, profile setup lives here), `instructor-dashboard.html` (cohort management), `profile.html` (public profile view), `join.html` (auth entry), `admin.html` (admin console), `survey.html` (research survey), `auth-callback.html` (magic link handler), `sushi-mastery.html` + `modernist-barcelona.html` (flagship experience landing pages), `cohort-chat.html` (auth-gated, paid-member-only cohort group chat — opens via `?cohort=<id>` from the dashboard), `vision.html` (three-flagship hero — Sushi Mastery, Yoga Pilgrimage, Ocean Sailing — with personal photos at `/images/vision/`).

**JS modules** (`website/js/`):
- `supabase-config.js` — Loads the Supabase JS v2 CDN, initializes `window.supabaseClient`, shows a non-intrusive banner on auth pages if the SDK fails to load
- `auth.js` — Email+password, magic link (`signInWithOtp`), password reset. Auto-claims pre-seeded instructor rows by email. Migrates `pendingQuest` sessionStorage and legacy localStorage profiles into Supabase on sign-in. Exposed as `window.auth`
- `database.js` — All DB operations: profiles, preferences, saved adventures, badges, interests, cohorts, enrollments, instructor admin. Exposed as `window.db`
- `community-sidebar.js` — Renders the community wall via the `get_community_for_adventure` RPC (migration 004)
- `whatsapp-widget.js` — WhatsApp opt-in UX

**Homepage (`index.html`)** is ~1,600 lines and contains the core product logic:
- **Quest selector** — 4-question interactive tool scoring against 22 hardcoded experience objects
- **Persona system** — 6 personas (Ocean Tactician, Blue Depth Seeker, Quiet Storm, Kitchen Alchemist, Edgewalker, Wild Guide)
- **Gamification** — XP popups, confetti, achievement toasts, badge system
- **Dual forms** — Netlify Forms (backup) + Supabase for signed-in users

### Supabase Backend

Auth via email+password with passwordless magic links as fallback (and password-reset flow). RLS everywhere.

Tables:
- `profiles` — user data, XP, level, plus the full profile form (first_name, age, location, about, interests JSONB, profession, skills, credentials JSONB, fitness, comfort_zone, languages, visibility, etc.)
- `user_preferences` — quest selections (elements, desires, time_preference, intensity)
- `saved_adventures` — bookmarked experiences
- `user_badges` — earned achievements
- `instructors` — instructor profiles (status: pending/approved/rejected)
- `cohorts` — class instances linked to an instructor and an `adventure_id` from `experiences.js`
- `enrollments` — student-to-cohort links (enrolled/waitlisted/cancelled/completed); plus payment_status (unpaid/pending/paid/refunded/failed) from `006_stripe.sql`
- `experience_interests` — pre-cohort interest signal with `token` for auth-less cancel links
- `survey_responses` — anonymous survey (no auth, insert-only RLS)
- `prior_experiences` — self-declared past classes with our instructors (from `013_cohort_community.sql`). Public read, owner write.
- `cohort_messages` — group chat for paid cohort members (from `013_cohort_community.sql`). RLS gated by `is_cohort_member()` helper; realtime-enabled.

Views & RPCs:
- `user_enrollment_timeline` (view) — derived Planning / Doing / Completed status from enrollment + cohort dates. Used by `dashboard.html` and `db.getMyTimeline()`.
- `get_cohort_members(cohort_id)` — roster for the cohort-chat sidebar; refuses to return rows unless the caller is a member.
- `get_community_for_adventure(adventure_id)` — pre-cohort community wall.

Edge Functions (Deno + Resend):
- `send-welcome-email` — database-webhook on `profiles` INSERT
- `send-followup-emails` — daily cron, Day 3 + Day 7 nurture
- `send-whatsapp`, `send-followup-whatsapp` — WhatsApp equivalents
- `handle-interest` — token-authenticated interest confirm/cancel

Schema: authoritative snapshot in `website/supabase-schema.sql`. Incremental migrations in `supabase/migrations/` (001 → 005). Run migrations in order; `005_profile_extended_columns.sql` is the one that adds the extended profile columns that were previously ad-hoc in the dashboard.

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

## Brand Voice — The Three Pillars

Everything must evoke **Freedom** (the open sea, the life you chose) + **Adventure** (real stakes, earned exhilaration) + **Immersion** (deep in craft, culture, cohort). The rhythm: *Surf in Hawaii. Sail the open sea. Cook in Tokyo.* No YouTube video at 2 AM. Real immersion.

**Say:** "Freedom" · "Adventure" · "Immersion" · "The open sea" · "Earned" · "Skill adventures at the source" · "Choose your depth" · "Certified" · "Cohort"

**Don't say:** "Transformation" (passive) · "Vacation" / "holiday" · "Life-changing" (overused) · "Journey" alone · "Luxury" · "Easy"

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

## Hosting & Pretty URLs

Hosted on **GitHub Pages** (workflow: `.github/workflows/deploy-pages.yml`, publish dir: `website/`). GH Pages serves `/foo` by automatically resolving to `/foo.html`, so adding a new HTML file in `website/` gives you the pretty URL for free — no redirect config needed.

`netlify.toml` exists in the repo as legacy config from when the site was Netlify-hosted; it is **not read by GitHub Pages**. Leave it alone unless we migrate back.
