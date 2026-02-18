# EducatedTraveler Agent Index

All AI agents that serve the EducatedTraveler project. The local agents in `os/` are the comprehensive references that live with the project. The NEXUS agents in the agent library are focused tools optimized for specific task domains.

---

## Local Agents (os/)

These live inside the EducatedTraveler repository and are the primary references for anyone working on the project.

### Daemon - EducatedTraveler.md
- **Location:** `os/Daemon - EducatedTraveler.md`
- **Purpose:** The soul of the machine. Defines mission, non-negotiables, brand voice, operating rhythm, success metrics, and the 12 commandments. Everything flows from here.
- **When to use:** Before any strategic decision, when checking for mission drift, when onboarding anyone to the project, or when you need to remember why this exists.

### Agent - EducatedTraveler.md (Ultimate Agent)
- **Location:** `os/Agent - EducatedTraveler.md`
- **Purpose:** The complete operating system -- 500+ ideas synthesized into a single agent covering all domains: vision, marketing, sales, copy, product, UX, finance, operations, psychology, community, content, and mindset.
- **When to use:** When you need a comprehensive reference that spans multiple domains, or when a question does not fit neatly into one focused agent below.

---

## NEXUS Focused Agents (agent-library/)

These are decomposed from the Ultimate Agent into domain-specific tools. Each is optimized for a narrower scope and faster, more targeted responses.

### Brand & Marketing
- **Location:** `NEXUS/agent-library/Agent - ET - Brand & Marketing.md`
- **Query format:** `Agent: Brand [Challenge]`
- **Purpose:** Brand positioning, copywriting, content strategy, marketing systems, sales psychology, and partnership development.
- **When to use:** Writing copy, planning campaigns, evaluating brand consistency, developing content calendars, crafting sales messaging, or assessing partnership opportunities.

### Product & Experience
- **Location:** `NEXUS/agent-library/Agent - ET - Product & Experience.md`
- **Query format:** `Agent: Product [Challenge]`
- **Purpose:** Instructional design, experience architecture, travel business logistics, community building, and cohort dynamics.
- **When to use:** Designing new experiences, structuring curricula, vetting instructors or venues, planning cohort logistics, or building community features.

### Operations & Finance
- **Location:** `NEXUS/agent-library/Agent - ET - Operations & Finance.md`
- **Query format:** `Agent: Operations [Challenge]`
- **Purpose:** Business operations, financial planning, decision frameworks, founder psychology, productivity systems, and strategic protocols.
- **When to use:** Financial modeling, pricing decisions, operational planning, founder mindset coaching, or strategic prioritization.

### Website & Code
- **Location:** `NEXUS/agent-library/Agent - ET - Website & Code.md`
- **Query format:** `Agent: Code [Challenge]`
- **Purpose:** Coding standards, website architecture, UX implementation, code review, performance, accessibility, and the cross-module integration matrix.
- **When to use:** Building or reviewing website code, implementing design system components, auditing performance or accessibility, or making architectural decisions.

### Experience Enhancement
- **Location:** `NEXUS/agent-library/Agent - ET - Experience Enhancement.md`
- **Purpose:** Auto-generates tailored enhancement suggestions when a new experience or partner is added, based on activity type, location, instructor, duration, and certification level.
- **When to use:** Adding a new experience to the catalog, onboarding a new partner or instructor, or brainstorming ways to elevate an existing experience.

### Founder CEO
- **Location:** `NEXUS/agent-library/Agent - ET - Founder CEO.md`
- **Purpose:** Guardian of vision, first salesperson, and ultimate filter against mission drift. Defines the founder's role, decision protocols, and personal operating system.
- **When to use:** Strategic direction decisions, investor conversations, mission drift checks, or when the founder needs a structured framework for a high-stakes choice.

---

## How They Relate

```
                    DAEMON
              (Soul & Non-Negotiables)
                       |
              ULTIMATE AGENT (os/)
           (Complete reference — all domains)
                       |
        ┌──────┬───────┼───────┬──────┬──────┐
        |      |       |       |      |      |
     Brand  Product  Ops &  Website  Exp.  Founder
       &       &    Finance   &     Enhance  CEO
     Mktg   Exper.          Code    ment
        (NEXUS focused agents)
```

- The **Daemon** is the constitution. It does not answer questions -- it defines the rules.
- The **Ultimate Agent** is the encyclopedic reference that spans all domains.
- The **NEXUS focused agents** are specialist tools decomposed from the Ultimate Agent for faster, more targeted work.
- All agents inherit from and must align with the Daemon's non-negotiables and brand voice.

---

**Last updated:** February 2026
