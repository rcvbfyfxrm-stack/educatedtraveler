# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian vault containing planning and documentation materials for **EducatedTraveler**, an educational travel startup building a gamified quest system for extended immersion education (3-6 months). The platform combines real-world certifications (PADI, RYA, Yoga Alliance, WSET) with blockchain-verified credentials.

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
- **Foundation Journeys**: 7-21 day programs earning entry-level certifications (100-200 XP)
- **Mastery Quests**: 30-60 day programs earning advanced certifications (400-500 XP)
- **Immersion Sagas**: 90-180 day multi-certification transformations (1,200-2,000 XP)
- **Soul-Bound Tokens (SBTs)**: Non-transferable NFTs representing real-world certifications
- **Cohorts**: Small groups of 8-12 people completing journeys together

## Blockchain Architecture (Planned)

- Polygon network for smart contracts
- ERC-721 for Soul-Bound certification tokens
- ERC-1155 for transferable achievement NFTs
- $EDUTRAV governance token for alumni voting
- IPFS for NFT metadata storage
