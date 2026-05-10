# EducatedTraveler — Business Strategy

**Last updated:** 2026-05-09
**Companion docs:** `IMPLEMENTATION-PLAN.md` (engineering), `os/products.md` (catalog), `os/partners/outreach-tracker.md` (pipeline state)

---

## 1. Thesis

**Certified skill immersion at the source.** Travel is the surface; certification is the spine. We sell the one thing that the experience-economy still can't fake: a real credential earned in the place the craft was born.

The wedge: shortest tier ($3,500–$6,500, 7–21 days) gets the student in the door with a globally-recognized certificate (PADI, RYA, Yoga Alliance, WSET, Le Cordon Bleu, Worldchefs). The longer tiers (Mastery 30–60 days, Saga 90–180 days) compound from there.

**Why this wins:**
- *Experience economy* sells memories. We sell capabilities. Capabilities transfer to careers, hobbies, identity. Memories don't.
- *Online courses* sell information. We sell muscle memory. You can't ferment koji or land a roll-tack on YouTube.
- *Boutique travel* sells access. We sell mastery. Access is rented; mastery is owned.

---

## 2. Three growth levers (sequenced)

| Lever | Window | Owner question | Output |
|-------|--------|----------------|--------|
| **A. Partner pipeline** | Now → Aug 2026 | Who teaches? | 5+ confirmed flagship instructors across 3 verticals |
| **B. First cohort execution** | Sep–Oct 2026 | Does it deliver? | Sushi Academy case study + testimonials + photo/video |
| **C. Demand engine** | Oct 2026 → Q1 2027 | Who shows up? | 50 deposits, 8–12 paying students for next 3 cohorts |

Each lever feeds the next. Skipping A means selling a promise we can't keep. Skipping B means scaling unverified product. Skipping C means a great cohort with no encore.

---

## 3. Lever A — Partner pipeline (Now → Aug 2026)

### Current state

- **39 partners** sit in `os/partners/outreach-tracker.md`.
- **2 confirmed** (Hiroko Ishii — Tokyo sushi; Martin Lippo — Barcelona modernist).
- **0 outreach emails sent.** Infrastructure (HubSpot, Notion, Resend, drafts skill, scout agent) ready since Feb 2026.
- This is the highest-leverage unblock in the entire business. (See `IMPLEMENTATION-PLAN.md` E1.)

### Targets — concentric ring strategy

**Ring 1: Already-warm flagships (10 partners, 60 days).**
Tokyo sushi, Paris pastry, Barcelona modernist, Antibes (3 partners), Monaco, Ferrandi, Basque Culinary Center, Mimo. These have either prior contact, geographic clustering with confirmed instructors, or named individuals. Convert ≥3.

**Ring 2: Country-led (15 partners, 90 days).**
Use the existing 15 country guides (`os/partners/countries/*.md`) — Japan, Spain, Italy, France, Greece, Portugal, Indonesia, Thailand, Mexico, Costa Rica, Iceland, Tanzania/Kenya, Vietnam, Morocco, New Zealand, Colombia. One flagship instructor per country, prioritized by:
1. Existing diaspora / English fluency
2. Vertical balance (culinary heavy — diversify into sailing/diving/wellness)
3. Cohort economics (≥8 students × $4k ≥ $32k revenue)

**Ring 3: Cold-call vertical builds (Q4).**
Diving (PADI 5-Star centers Thailand/Egypt), Sailing (RYA schools Greece/Croatia), Wine (WSET providers Bordeaux/Tuscany), Yoga (Yoga Alliance RYS-200 Bali/Rishikesh). Each of these unlocks an entire vertical with one anchor partner.

### Operating cadence

- **Daily:** `partner-scout` agent drafts next email. Founder reviews. Send max 5/day.
- **Weekly:** `outreach-digest.py` cron at 09:00 weekdays. Track 🟢🟡🔴⚪❌ funnel state.
- **Monthly:** Promote one Ring-2 country to Ring-1 once first response lands.
- **Hard rule:** No follow-ups beyond +14 days. Close as ❌, archive learnings, move on.

### Partnership filter (non-negotiable)

From `os/core/partnership-filter.md` — every partner must clear:
1. **5+ years certified** in their craft
2. **Active practitioner** (not just teacher)
3. **English-capable** OR translator built into program cost
4. **Insurance + permits** for foreign students
5. **Aligns with cohort size 8–12** and our rest-day rule

If a partner can't clear these, they don't get a contract. The filter is the moat.

### Success metrics

| Metric | Today | 30 days | 90 days |
|--------|-------|---------|---------|
| Outreach sent | 0 | 30 | 80 |
| Replies received | 0 | 8 | 24 |
| 🟡 In Progress | 0 | 4 | 8 |
| 🟢 Confirmed | 2 | 4 | 6 |
| Verticals covered | 1 (culinary) | 2 | 3 |

---

## 4. Lever B — First cohort execution (Sep–Oct 2026)

### Why this is the bet

The first paid cohort is not a revenue event. It is a **case-study factory.** Two students × six weeks × Hiroko Ishii in Tokyo produces:

1. A flagship landing page rebuilt with real photo/video/quotes (replaces aspirational copy with proof)
2. A founder-narrated long-form post documenting the cohort (yacht-chef voice, see `NEXUS/OS/Ma-Voix-Litteraire.md`)
3. A short-form video pack (5× IG Reels + 1× YouTube cut)
4. Two named alumni who become Ring-1 referrers for future cohorts
5. A repeatable cohort-ops playbook the next instructor can ship against

If we don't capture this, we waste the strongest demand catalyst we'll have in 2026.

### Schedule

- **Sep 21 – Oct 2** — Basic (Week 1–2)
- **Oct 5 – Oct 16** — Intermediate (Week 3–4)
- **Oct 19 – Oct 30** — Advanced (Week 5–6)
- **2 students confirmed** (deposit-held)

### Pre-cohort (now → Sep 14)

- **Visa, insurance, accommodation** confirmed in writing for both students.
- **Pre-arrival kit** mailed: knife (deposit applied to final price), Tokyo SIM, JR Pass, reading list, language phrasebook.
- **Day-1 dossier** for Hiroko: student profiles, allergy info, fitness level, prior knife experience.
- **Photo/video brief** signed with local Tokyo videographer (budget: $4k for full 6 weeks).
- **Insurance:** General liability ($2M aggregate) + foreign student health rider.
- **Refund policy locked** in writing — see `os/playbooks/Playbook - Operations Stack.md`.

### During-cohort ops

- **Weekly check-in call** — founder ↔ Hiroko, Friday 18:00 JST.
- **Daily student WhatsApp pulse** — one-tap mood/energy reading.
- **Mid-cohort pivot point** (end of Week 2) — Are pacing/intensity right? Adjust before Week 3.
- **Documentation rule:** every key technique is filmed + photographed (Toyosu visit, knife sharpening, omakase final, etc.).

### Post-cohort (Nov 2026)

- **Exit interview** with each student (90 min recorded, structured per `Playbook - Student Interview.md`).
- **NPS + 30/60/90-day follow-up** to track durable skill use ("did you actually make sushi at home / for clients?").
- **Case-study landing page** ships within 21 days of cohort end.
- **Hiroko debrief:** what worked, what to change, contract for 2027.

### Success metrics

| Metric | Target |
|--------|--------|
| Student satisfaction (post-cohort NPS) | ≥9/10 |
| 90-day skill retention | Both students still cooking sushi monthly |
| Case-study published | ≤21 days post-cohort |
| Hiroko 2027 contract signed | ≤45 days post-cohort |
| Word-of-mouth referrals | ≥3 inbound from these 2 students within 6 months |

---

## 5. Lever C — Demand engine (Oct 2026 → Q1 2027)

### The funnel (current state)

```
IG / Word-of-mouth → Quest selector (4-question tool) → Persona match
        → Saved adventure → Email capture → Magic-link signup
                → Profile completion → Cohort enrollment
                       → Deposit → Confirmed seat
```

Every page is built. The funnel works. **What's missing is fuel at the top.**

### Channel mix

**Primary: Instagram (organic + founder-led).**
- Voice: Three pillars from CLAUDE.md — Freedom · Adventure · Immersion. Yacht-chef directness.
- Cadence: 5 posts/week (3 Reels, 2 carousels). Run through `ig-lint.py` before publish (banned-phrase + credentials check).
- Cohort engine: every cohort produces ≥30 days of organic content (see Lever B).
- KPI: 5,000 → 15,000 followers in 6 months. Story-driven, not aesthetic-driven.

**Secondary: Founder narrative (LinkedIn + long-form).**
- Arnaud's positioning — yacht chef who builds the platform he wishes existed for fellow professionals — is the differentiator. No one else can credibly claim it.
- Cadence: 1 long-form post/month + 1 podcast appearance/month.
- Goal: become the named founder of "skill immersion" as a category.

**Tertiary: Partnerships.**
- Yacht/sailing community: Littoralicious cross-promotion when craft overlaps (sushi for chefs, modernist for chefs). Editorial firewall preserved (see memory `feedback_littoralicious_worldaffair_firewall.md`).
- Niche communities: PADI dive forums, Yoga Alliance directories, WSET alumni groups. Trade access for early-cohort discounts.

**Reserved (not yet): paid ads.**
We don't run paid until LTV is measurable. That's a 2027 question.

### Conversion infrastructure (already built — verify works)

- **Quest selector:** 4 questions × 22 experiences × 6 personas → ranked match. (`index.html`, ~1,600 lines.)
- **Email nurture:** Welcome + Day 3 + Day 7 (`send-welcome-email`, `send-followup-emails` Edge Functions).
- **WhatsApp opt-in:** parallel nurture for high-intent leads (`send-whatsapp`, `send-followup-whatsapp`).
- **Survey:** anonymous research signal (`survey.html`).
- **Stripe checkout:** deposits + final payment (`stripe-checkout` Edge Function, mig 006_stripe).

### Pricing & ladders

- **Foundation tier ($3,500–$6,500, 7–21 days)** — the doorway. ≥80% of first-time students enter here.
- **Mastery tier ($9,500–$12,000, 30–60 days)** — second cohort upgrade. Sushi Academy lives here.
- **Saga tier ($25,000–$40,000, 90–180 days)** — for alumni only, by application. Don't market publicly until 2027.

**Deposit:** $500 non-refundable, locks seat. Final payment due 60 days pre-cohort.
**Cohort cap:** 8–12. Hard. No exceptions. The cap *is* the product.

### Success metrics

| Metric | Today | Q4 2026 | Q1 2027 |
|--------|-------|---------|---------|
| IG followers | (current) | 5k | 15k |
| Email list | (current) | 500 | 2k |
| Quest completions / week | (current) | 50 | 200 |
| Quest → deposit rate | (current) | 2% | 4% |
| Confirmed seats next cohort | 2 | 12 | 24 |

---

## 6. Verticals — sequencing

| Quarter | Add | Why |
|---------|-----|-----|
| Q3 2026 | Culinary (live) | Already 2 confirmed. Highest founder credibility (yacht-chef domain). |
| Q4 2026 | Wellness (yoga/meditation) | Lowest equipment cost, highest cohort density. Bali / Rishikesh anchors. |
| Q1 2027 | Maritime (sailing/diving) | Yacht-chef adjacency. RYA Greece + PADI Thailand. Big-ticket Mastery-tier. |
| Q2 2027 | Wine & coffee | Lowest physical risk, highest LTV (alumni travel for tastings). Bordeaux WSET, Yirgacheffe origin. |
| H2 2027 | Crafts (ceramics/leather/woodworking) | Slow-burn, high-margin. Kyoto, Florence, Oaxaca. |

Five verticals × two flagships each = ten anchor experiences = a credible global catalog by end of 2027.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Founder bandwidth (yacht-chef job ↔ EducatedTraveler) | Daily cron + agents handle outreach drafts; founder approves only. Outreach engine is force multiplier. |
| First-cohort failure | Conservative N=2. Photo/video budget is fully funded regardless. Hiroko vetted in person. |
| Partner ghosting | Concentric-ring strategy. Hard +14d cutoff. No emotional attachment to any one partner. |
| Insurance / liability gap | General liability + per-cohort rider. No cohort starts without `os/playbooks/Playbook - Partner Onboarding.md` clearance. |
| Refund / chargeback | $500 non-refundable deposit + 60-day pre-cohort full payment. Stripe Connect routes per-cohort. |
| Brand drift (vacation vs. immersion) | Sacred-words / banned-words list (CLAUDE.md). `ig-lint.py` enforces on every post. |
| Pricing race-to-bottom | Cohort cap of 12 + named instructors + certifications = price ceiling we set, not market. |

---

## 8. North star

**By end of 2027:**
- 5 verticals × 2 flagships = 10 anchor experiences live
- 200+ certified alumni (avg $7k revenue/alum = $1.4M cumulative)
- 30+ vetted partner instructors across 15 countries
- Founder no longer in critical path of any single cohort
- One alum has cited the cohort as the inflection point of a career change. (This is the qualitative proof the brand exists.)

**By end of 2026 (the year that matters now):**
- Lever A: 6 confirmed instructors, 3 verticals
- Lever B: Sushi cohort delivered, case study published
- Lever C: 24 confirmed seats for Q1–Q2 2027
- Revenue floor: ~$70k (sushi cohort + 2 Foundation cohorts at 50% sell-through)

---

## 9. The single decision rule

For every new opportunity, ask in order:

1. Does it credibly deliver a real certification at the source?
2. Does it pass the partnership filter (5+ years, active, insured, English, cohort 8–12)?
3. Does it ladder into Foundation → Mastery → Saga?
4. Does it produce content the next cohort can sell against?

If any answer is no, decline. The brand's price-power comes entirely from saying no.
