# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian vault containing planning and documentation materials for **EducatedTraveler**, an educational travel startup offering **Skill Adventures at Source**—certified skill immersions at premium destinations worldwide. The platform combines real-world certifications (PADI, RYA, Yoga Alliance, WSET) with blockchain-verified credentials and gamified progression.

**Product Spectrum**:
- **7-21 days**: Get certified (PADI diving, RYA sailing, culinary arts, yoga credentials)
- **1-3 months**: Go deeper with advanced mastery
- **6 months**: Change your life with full transformation

*"One week to get certified. 6 months to change your life."*

The website leads with accessible 7-21 day adventures—the entry point. Longer options (1, 3, 6 months) are available for those ready to go deeper. Always position short immersions as the gateway, not the 6-month commitment.

## Development Commands

### Prototype (React App)

All commands run from the `prototype/` directory:

```bash
cd prototype
npm install          # Install dependencies
npm run dev          # Start dev server with HMR
npm run build        # Type-check and build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Website (Static HTML)

The `website/` directory contains static HTML pages. Open directly in browser or serve locally:

```bash
# From repository root
open website/index.html                    # Main landing page
open website/instructors.html              # Instructors page
python3 -m http.server 8000 --directory website  # Local server
```

## Repository Structure

```
├── os/                     # CORE OPERATING SYSTEM — Single source of truth
│   ├── daemon.md          # Mission, principles, brand voice, non-negotiables
│   ├── products.md        # Complete product catalog with pricing
│   ├── economics.md       # Unit economics, metrics, instructor compensation
│   ├── playbooks/         # Operational templates
│   │   ├── partner-onboarding.md   # Partner recruitment
│   │   └── revenue-calculator.md   # Financial modeling
│   └── brand/             # Design system and copy
│       ├── design-system.md        # Colors, typography, components
│       └── landing-pages.md        # Proven copy patterns
├── prototype/              # React + Vite + TypeScript application
├── website/                # Static landing pages (production HTML)
├── business/               # Formal business documents (PDFs)
└── _archive/               # Legacy documents (deprecated)
```

## Core OS (`os/`)

The `os/` folder is the single source of truth for company fundamentals. **Start here for any new work.**

| File | When to Reference |
|------|-------------------|
| `daemon.md` | Mission alignment, brand voice, non-negotiables |
| `products.md` | Program details, pricing, certifications, cohort structure |
| `economics.md` | Financial modeling, instructor compensation |
| `playbooks/partner-onboarding.md` | Recruiting instructors, venues, cert bodies |
| `playbooks/revenue-calculator.md` | Modeling new programs |
| `brand/design-system.md` | Colors, typography, component patterns |
| `brand/landing-pages.md` | Copy templates, proven patterns |

## Prototype Architecture

The `prototype/` directory contains a Vite + React 19 + TypeScript application:

- **Build tool**: Vite 7.x with React plugin
- **Framework**: React 19 with TypeScript 5.9
- **Styling**: CSS modules (no Tailwind yet)

The `educated-traveler-quest.tsx` component is a standalone prototype demonstrating:
- Quest progression (Foundation → Mastery → Saga)
- XP/leveling system (500 XP per level)
- Certification tracking with prerequisite-based unlocking

**Note**: This component requires Tailwind CSS and lucide-react to be integrated.

## Website Architecture

The `website/` directory contains production static HTML pages:

- `index.html` — Main landing page
- `instructors.html` — Instructor recruitment page
- `SETUP-FORMS.md` — Form integration instructions

These pages follow the design system in `os/brand/design-system.md`:
- Dark theme (black backgrounds, glass effects)
- Inter font family
- Netflix-style adventure cards
- Mobile-first responsive design

## Business Domain Context

**Duration Spectrum** (always lead with shorter options):
| Duration | Name | Price | Positioning |
|----------|------|-------|-------------|
| 7-21 days | **Foundation** | $3,500-$6,500 | Get certified |
| 30-60 days | **Mastery** | $9,500-$12,000 | Go deeper |
| 90-180 days | **Saga** | $25,000-$40,000 | Change your life |

**Key Concepts**:
- **Cohorts**: 8-12 max (6-8 for sailing)
- **Source**: Learn where the skill originated
- **Soul-Bound Tokens (SBTs)**: Non-transferable NFTs for certifications (planned)

**Non-Negotiables** (from `os/daemon.md`):
- Cohort size: 8-12 maximum
- Instructor quality: 5+ years experience, certified
- No sitting blocks > 90 minutes
- Rest days: 1/week minimum

## Brand Voice

**Use:**
- "Skill adventures at the source"
- "One week to get certified. 6 months to change your life."
- "Choose your depth"
- "Certified" (not just "learning")
- "Cohort" (not "group" or "class")

**Avoid:**
- "Life-changing" (overused)
- "Journey" alone (too generic)
- "Luxury" (we're premium, not indulgent)
- "Easy" or "effortless" (dishonest)

## Design Principles

From `os/brand/design-system.md`:

```
Primary bg:     #000000 (pure black)
Glass surface:  rgba(255,255,255,0.03)
Text primary:   #FFFFFF
Text secondary: rgba(255,255,255,0.60)
Accent cyan:    #06B6D4 (sailing, primary action)
Accent amber:   #F59E0B (culinary)
Accent orange:  #F97316 (wellness)
```

Philosophy: Apple glass meets Netflix minimal. Darkness as canvas, content glows.
