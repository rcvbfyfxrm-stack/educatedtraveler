# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian vault containing planning and documentation materials for **EducatedTraveler**, an educational travel startup building a gamified quest system for extended immersion education (3-6 months). The platform combines real-world certifications (PADI, RYA, Yoga Alliance, WSET) with blockchain-verified credentials.

## Repository Structure

- **Markdown files**: Business documentation (whitepaper, partner brief, market research survey)
- **PDF files**: Formal business documents, presentations, and market analysis
- **`educated-traveler-quest.tsx`**: React prototype component demonstrating the quest/persona UI

## React Component (`educated-traveler-quest.tsx`)

A standalone React component prototype using:
- React with hooks (useState)
- Lucide React icons
- Tailwind CSS for styling

The component demonstrates:
- Quest progression system (Foundation → Mastery → Saga)
- XP/leveling mechanics
- Certification tracking
- Prerequisite-based quest unlocking

No build system exists - this is a UI prototype only.

## Business Domain Context

Key concepts for understanding the codebase:
- **Foundation Journeys**: 7-21 day programs earning entry-level certifications (100-200 XP)
- **Mastery Quests**: 30-60 day programs earning advanced certifications (400-500 XP)
- **Immersion Sagas**: 90-180 day multi-certification transformations (1,200-2,000 XP)
- **Soul-Bound Tokens (SBTs)**: Non-transferable NFTs representing real-world certifications
- **Cohorts**: Small groups of 8-12 people completing journeys together

## Blockchain Architecture

The platform plans to use:
- Polygon network for smart contracts
- ERC-721 for Soul-Bound certification tokens
- ERC-1155 for transferable achievement NFTs
- $EDUTRAV governance token for alumni voting
