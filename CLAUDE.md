# CLAUDE.md — EducatedTraveler

**Read this file, then read only what your task needs. Nothing else here is required reading.**

---

## What this is

**A free record of where crafts are still taught at the source — with a name and a date on every line — and an introduction to the teacher when you want to go.**

- **The Atlas** — what's alive, where, and the people keeping it alive. Free. Nobody can pay to be on it or to be left off it, ever.
- **The Circle** — the people, and *what they want to learn*. Free. **Not a mailing list** — it decides which week gets built and which Atlas entry gets checked next.
- **The Lab Week** — the only paid thing. A week designed for the people of the Circle.

*A place, a person, your people. Earned, not bought. At the source, not the simulation. Skills last, tans fade.*

---

## Where to look — read the row, not the shelf

| If you are… | Read |
|---|---|
| new to this project | `marketing/EducatedTraveler.pdf` — one page, 60 seconds |
| asking "where is this going, and what's next" | **`DIRECTION.md`** — the single current answer (12 Aug 2026). Replaces `roadmap.md`, `BUSINESS-STRATEGY.md`, `IMPLEMENTATION-PLAN.md`, which describe the retired certification thesis and must never be used again |
| deciding anything strategic | `marketing/The-Base.pdf` (definition + decision rules) |
| judging whether a place/master belongs | `marketing/The-Standard.pdf` (the ten rules) |
| writing an Atlas skill sheet | `marketing/The-Skill-Sheet.pdf` |
| writing copy, a letter, a post, an offer | **`keel`** — ALWAYS, automatic (Arnaud 2026-08-12) |
| handling one live conversation with a chef | **`hail`** — ALWAYS, automatic (Arnaud 2026-08-12) |
| working on the October week | `weeks/01-barcelona-lippo/LabWeek01-MartinLippo.pdf` |
| working with a teacher | `instructors/<person>/` — one folder per person, plus `_standard/`, `_playbooks/`, `_pipeline/` |
| working on a Lab Week | `weeks/01-barcelona-lippo/` (Martín, 22–26 Oct) · `weeks/_template/` for the next |
| looking for video, photos, IG, QR | `media/` — **except site images, which stay in `website/images/`** |
| writing anything public | `GUIDELINE.md` — the editorial law, esp. *The source ladder* |
| citing a craft body or register | `NEXUS/Knowledge/Sources - Institutional Register…md` |
| wondering why the site looks/works as it does | `docs/HISTORY.md` |

**Private and gitignored — never commit, never quote publicly:** `FOUNDING-CANON/`, `marketing/`, `DIRECTION.md`, `MASTERPLAN.md`, `VISION.md`, `VISION-LOG.md`, `PLAYBOOK.md`, `ideas.md`.

⚠ **`.gitignore` does not protect a file git already tracks.** Check `git ls-files <path>`, never the ignore list. `ideas.md` was tracked until 12 Aug 2026 despite everyone assuming otherwise.

⚠ **The retired thesis left `main` on 2026-08-12** — `roadmap.md`, `BUSINESS-STRATEGY.md`, `IMPLEMENTATION-PLAN.md`, the old `WARP.md`, the pre-pivot `os/` stack and the retired pages now live in `_archive/2026-08-12-cleanup/` (manifest inside). They are superseded by `DIRECTION.md` — **never quote, revive or "update" them.**

## The shape of the repo

Filed by **the work**, not by artefact type. One instructor used to live in six directories.

| | |
|---|---|
| `instructors/` | one folder per teacher · `_standard` the bar · `_playbooks` how to approach and onboard · `_pipeline` not-yet-people |
| `weeks/` | one folder per Lab Week · `_template` for the next |
| `media/` | video, photo, IG, QR, daily drop. **Site images stay in `website/images/`** |
| `marketing/` | the doctrine — what the company is, and how it is said |
| `website/` | the deployed site. Nothing else. |

**All of `instructors/`, `weeks/`, `media/` and `live-experiences/` are private and gitignored** — they
name third parties, carry commercial terms and hold unreleased media. Each has a README explaining itself.

---

## Current state — 10 August 2026

- **Atlas:** 100 crafts · 335 places · **118 with a named teacher · 217 blank on purpose · 0 checked and dated · 0 stood in.** 847 school entries. 56 countries (the `63` figure counts label strings, not countries).
- **Atlas standard v1.0 applied in data**, not deployed. Every destination carries `standard{check, enrolment, vitality, designations, directRoute, bar{10 rules}}`; counts live in `ET_ATLAS.standardMeta`.
- **Lab Week 01:** Martín Lippo / Vakuum, Barcelona, 22–26 Oct 2026. Signed 29 July. €1,500/seat VAT incl., cap 15, confirms at 10, ET keeps 22%. **Full payment by 15 September.** Break-even is 8 paid strangers to cover the ~€11,700 owed; **9** once travel counts.
- **Circle:** 32 rows in `launch_waitlist`. **Two letters sent** — 31 of 32 rows carry `last_issue = letter-02a` (verified against Supabase 11 Aug 2026; filenames are not a send log, the column is). **Zero paid seats. Zero alumni** — so nobody has yet learned anything together.
- **Uncommitted on `feat/circle-onboarding`:** the Atlas standard, the Telluride/Ascona fix, the 56-country correction, the retired-URL redirect map.

---

## Non-negotiables

**TRUST AT ALL LEVELS, ALWAYS — the first rule.** The moat and the honesty rule are the same object. Never fabricate a review, rating, master, credential, scarcity number, counter, alumnus or market size. Cite it or mark it *provisional, verifying*. Omission beats fabrication.

**Never claim** that a week gives you the craft (deliberate practice explains under 1% of variance in professions; no study shows master-taught beats self-taught at equal hours) · that a master is a shortcut · that five days confers membership · that ET is the first or only unbought guide (Homo Faber has run a larger free one for eight years).

**Never take** money from anyone ET judges, or anyone with an interest in the judgment — no listing fee, placement, commission, sponsorship or tourist-board budget, **on the map or on a week**.

**ET sells no advertising — law, at any size.** Nothing on the record, in the letter or on any page is there because it was bought, including from a brand with no stake in the judgment. A bought box beside unbought lines makes a reader ask which of the others were paid for, and that question never stops. Every offer is dated and logged with the answer given.

**ET does not buy reach — but that is standing policy, not law, and the reason is arithmetic.** ET keeps 22% of a €1,500 seat = **€330**; a cold stranger acquired by paid placement for a purchase that size costs a multiple of it, and a stranger who arrives by advert does not believe a judgment. Recompute if the numbers change; do not treat it as a vow. ⚠ *Deliberately not in the immutable canon — a company whose asset is a man who keeps his written rules cannot afford rules he will predictably want to break.* **One door, disclosed:** money may go behind a piece two named people actually made together, marked paid.

**Collaboration is the growth channel — two asked for every month, logged whether they land.** Work done together and published together. Money may move for the work; never for a place on the record, a position on it, or a kind word, and **a collaborator already on the record gets no better line for collaborating**. If working together would change what the record says about them, it is a payment — refuse it and log it. *The count is the clause: without it, "we grow by collaboration" is what a quiet stall says while stalling.*

**Built by the communities, for the communities — directed by them, for now built by one man.** What the Circle wants to learn decides which week gets built; what it asks about decides which line gets checked next. The record extends by **adding names** — a second checker signs the lines he checked, an alumnus says in public what a week actually was — and never by removing one. The gate opens **on evidence, not a date**: the first person who stood in a room ET sent them to can sign what they saw, under their own name, beside the date. ⚠ **"For the communities" never means ET holds them** — no members' area, no alumni product, nothing sold back. The link in a chain is a **shared interest**, not an acquaintance. **Zero alumni today, so this is intent — never say it as a record, never with counts.**

**The implicature test.** The danger is no longer falsehood but two true things arranged into a false one. *"My list is 25 and the week has 10 seats"* — both provable, and together a lie. Audit juxtapositions, not just claims.

**The checking sentence.** Write the line, then silently add *"…and here's how you could check that."* If it doesn't exist, cut the line.

**Strategy lock.** Community/Atlas first. The old selling machinery — price tiers, Quest selector, XP/badges/confetti, Stripe/PayPal checkout, enrollment flows — is **dormant, not deleted**. Do not re-surface it. No open marketplace. No on-site checkout. **No more Atlas pages** — it is done at 436; the only permitted additions are fields the standard requires.

**Cohorts 8–12.** Instructors 5+ years and certified. No sitting block over 90 minutes. One rest day a week minimum.

---

## Voice

**Everything that goes out in ET's voice — any post, mail, letter, page, offer, marketing strategy — obeys the twelve laws of L'Essence** (private; compact copy in `marketing/MASTER-META-PROMPT.md` §1, canonical in `NEXUS/Knowledge/PDF ideas EducatedTraveler/`). Arnaud's ruling, 2026-08-12: a draft that violates one does not ship.

**And nothing for the public or for outreach is produced bare-handed (Arnaud, 2026-08-12): anything public-facing goes through `keel`; any outreach or live conversation goes through `hail` — automatically, every time, not on request.**

Warm, plain, founder-led. Short sentences. The verb is **introduce / connect / bridge** — never sell, book, enroll, checkout. First line says plainly what the thing is; at most one poetic line, at the end.

**Banned:** transformation, transformational, life-changing, vacation, holiday, luxury, easy, journey, curated, unlock, elevate, empower, immersive-as-filler, "seats are going", "there's real interest", present tense for what has never happened. No decorative emoji.

**⚠ The Atlas never talks about Arnaud.** Sheets speak as *we*. Voice means register, not biography — no credentials, no years on the water, not even the true ones. **The one exception is the locked-catalogue letter invitation**, which stays first person and must never be swept: *"Write me a letter about X… I read every one myself."* **The test: credentials go, invitations stay.**

---

## Commands

```bash
python3 -m http.server 8000 --directory website   # serve the site
python3 scripts/build-atlas-pages.py              # rebuild the 436 Atlas pages + sitemap + robots
bash scripts/build-guideline-pdf.sh               # regenerate the Guideline PDF
supabase functions deploy send-welcome-email      # edge functions
```

**Deploy:** push to `main` → GitHub Pages → `educatedtraveler.app`. **Push is the deploy.** Always deploy from a **fresh `gh` clone** in `/private/tmp`, never from this CloudStorage working tree.

---

## Architecture, in brief

**`website/`** — static, no build step. Tailwind via CDN, fonts via Google. Key pages: `index.html`, `repertoire.html` (The Atlas), `circle.html`, `portrait.html`, `barcelona.html`, `atlas/` (436 generated pages), `studio.html`, `join.html`, `dashboard.html`.

**`website/js/`** — `repertoire.js` (`window.ET_ATLAS`, the Atlas data + `standardMeta`) · `atlas-ratings.js` (cited public ratings) · `supabase-config.js` · `auth.js` · `database.js`.

⚠ **Atlas pages have TWO generators and one data root.** `scripts/build-atlas-pages.py` (bulk, reads `data/repertoire.js` + `data/atlas-ratings.js`) and `scripts/atlas-page.mjs` (single-sheet) both emit page copy, and decorative strings also live in `data/repertoire.js` itself. Any wording change must land in **both generators AND the data file**, or the next rebuild silently reverts it — grep all three before calling a copy fix done (learned 2026-08-20: three retired-vocabulary blurbs kept resurrecting from the data).

**Supabase** — auth with RLS everywhere. Tables: `profiles`, `launch_waitlist` (the Circle), `user_preferences`, `saved_adventures`, `instructors`, `cohorts`, `enrollments`, `experience_interests`, `survey_responses`, `prior_experiences`, `cohort_messages`. **The ordered migrations in `supabase/migrations/` are the authoritative schema** — not any snapshot. Edge functions: `send-welcome-email`, `send-followup-emails`, `handle-interest`, `circle-broadcast`.

**Design lock — Warm-Dark Editorial.** Ink `#0d0b09` · surface `#14110d` · paper `#f3ede2` (never pure white) · sea `#7fa8a5` · ember `#d28a52`. Fraunces (display) + Inter (body) + IBM Plex Mono (labels). Cores: wellness `#94ad86` · adventure `#6fa3a0` · creative `#cf8f6e` · culinary `#c9a24a`. Copy the head tokens and `tailwind.config` verbatim from `index.html` for any new page. The cold blue/glass/gamified look is retired forever, and Littoralicious CSS is never borrowed.

---

*History, deploy archaeology and the email-config method: `docs/HISTORY.md`.*

## Rendering a skill on the Atlas

**Check the whole market before you write the sheet, and write down where you looked.**
A missing school leaves no trace on the page — that is how Le Cordon Bleu Madrid stayed
off Modernist Spanish Cuisine while it carried a star, four places and verified prices.
`docs/ATLAS-SWEEP.md` is the standard: the `sweep` block, what the build refuses, and
what the nightly re-check does. The rejections are not an appendix — published, they are
the one thing the Standard says no rival will print.
