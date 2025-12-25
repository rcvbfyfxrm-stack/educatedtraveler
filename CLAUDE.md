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

All commands run from the `prototype/` directory:

```bash
cd prototype

# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Type-check and build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Repository Structure

```
├── prototype/              # React + Vite + TypeScript application
│   ├── src/
│   │   ├── App.tsx        # Main application entry (currently Vite boilerplate)
│   │   └── main.tsx       # React DOM mounting
│   └── educated-traveler-quest.tsx  # Quest map UI component (not yet integrated)
├── strategy/               # Core business documents (markdown)
│   ├── whitepaper.md      # Full quest system architecture
│   ├── partner-brief.md   # Partnership opportunities
│   ├── survey.md          # Market research survey
│   └── roadmap.md         # Development roadmap
├── top-experiences/        # Curated adventure catalog by category
│   └── README.md          # Adventure, Sailing, Wellness, Culinary, Creative
├── business/               # Formal business documents (PDFs)
├── website/                # Static landing page
└── changelog/              # Session changelogs
```

## Prototype Architecture

The `prototype/` directory contains a Vite + React 19 + TypeScript application:

- **Build tool**: Vite 7.x with React plugin
- **Framework**: React 19 with TypeScript 5.9
- **Styling**: Currently uses CSS modules; quest component uses Tailwind classes (Tailwind not yet installed)
- **Icons**: Quest component expects lucide-react (not yet installed)

The `educated-traveler-quest.tsx` component is a standalone prototype that demonstrates:
- Quest progression (Foundation → Mastery → Saga)
- XP/leveling system (500 XP per level)
- Certification tracking with prerequisite-based unlocking
- Persona card showing progress

**Note**: This component is not yet integrated into the main App.tsx and requires Tailwind CSS and lucide-react to be installed.

## Business Domain Context

Key concepts for understanding the codebase:

**Duration Spectrum** (always lead with shorter options):
| Duration | Name | XP | Positioning |
|----------|------|-----|-------------|
| 7-21 days | **Skill Immersions** | 100-200 | Entry point—get certified |
| 1 month | **Mastery Quests** | 300-400 | Go deeper |
| 3 months | **Extended Mastery** | 600-800 | Advanced commitment |
| 6 months | **Life Transformation** | 1,200-2,000 | Change your life |

**Other Concepts**:
- **Soul-Bound Tokens (SBTs)**: Non-transferable NFTs representing real-world certifications
- **Cohorts**: Small groups of 8-12 people completing journeys together

## Top Experiences Reference

When describing adventures, use exciting examples from `top-experiences/README.md`:

**Adventure**: Wingsuit flying (Interlaken), Freediving (Dahab), Whitewater kayaking (Patagonia), Arctic sailing (Svalbard), Falconry (UAE), Wilderness tracking (Kalahari)

**Sailing**: Atlantic crossing, America's Cup training (NZ), Celestial navigation, Classic yacht restoration, Regatta circuit (Fastnet)

**Culinary**: Sushi mastery (Tokyo), Le Cordon Bleu (Paris), Molecular gastronomy (Basque), Whisky (Scotland/Japan), Zellige tilework (Fez)

**Creative**: Magnum Photos workshop, Japanese pottery (Bizen), Italian fresco painting, Literary mentorship (Tuscany)

**Wellness**: Yoga pilgrimage (Delhi→Rishikesh→Dharamsala), Alchemy of Breath (Bali), Vipassana silent retreat, Muay Thai (Thailand)

## Vault Folder Structure Guidelines

When organizing content in this Obsidian vault:

```
├── Skill Immersions/       # PRIMARY: 7-21 day certified programs
│   ├── Bali Wellness/      # Yoga Alliance, meditation retreats
│   ├── Italy Culinary/     # Sommelier, culinary certifications
│   ├── Greece Sailing/     # RYA certifications
│   └── Dive Destinations/  # PADI programs
├── Extended Options/       # OPTIONAL: 6-month deep dives
│   └── (Label clearly as optional for advanced adventurers)
├── Documentation Add-ons/  # Premium photo/video packages (not core)
├── strategy/               # Core business documents
├── business/               # Formal business documents
├── prototype/              # React application
└── website/                # Static landing page
```

**Content Guidelines**:
- Always lead with 7-21 day options as the entry point
- Present duration as a spectrum: "One week to get certified. 6 months to change your life."
- Use "Skill Adventures at Source" for adventurous, certification-focused branding
- Never position 6-month programs as the primary offering—they're the deepest option on a spectrum
- All durations are valid; let users choose their depth

## Blockchain Architecture (Planned)

- Polygon network for smart contracts
- ERC-721 for Soul-Bound certification tokens
- ERC-1155 for transferable achievement NFTs
- $EDUTRAV governance token for alumni voting
- IPFS for NFT metadata storage
