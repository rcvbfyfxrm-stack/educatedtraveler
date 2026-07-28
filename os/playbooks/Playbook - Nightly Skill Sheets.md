# Playbook — Nightly Skill Sheets

**Purpose.** Turn the Atlas's thin skill pages into deep, honest reads — a few every night — prioritised by what Circle joiners actually ask for. This is the engine behind "the skill pages are the most interesting read on the skills."

This file is the spec a scheduled agent follows. It is public (no secrets here). The agent gets any credentials from its environment, never from this file.

---

## THE ONE HARD GATE — never deploy

- **Never push to `main`. Never deploy.** GitHub Pages builds from `main`; a push there goes live with no human in the loop. That is forbidden.
- Every night's work lands on the branch **`auto/skill-sheets`** and is offered to Arnaud as **one pull request**. Arnaud reviews and merges. Merging is the only way anything reaches the site. No exceptions.
- If you cannot push a branch or open a PR, stop and log — do not "work around" it onto main.

## THE OTHER HARD RULE — the truth, always

Every fact, link, image licence and media item on a sheet must be **crosschecked at content depth** before it ships. A charming-but-false "fun fact" is a fabricated trust signal — the worst thing we can do. If a claim can't be verified, **drop it**; never soften it, never guess. Never embed a video or image you haven't confirmed resolves and is licensed/embeddable. Better a short, true sheet than a rich, wrong one. (See the freediving sheet's honest "we'd rather show two books we've checked than a film we haven't" note — that is the standard.)

---

## Each run, in order

### 1. Fresh clone
Clone `main` fresh into a scratch dir (never work from a stale or dehydrated checkout). Branch `auto/skill-sheets` off `main` (or fast-forward it to `main` first so each night starts from what's live).

### 2. Pick what to build — Circle demand first
Build the skills **people are asking for**, highest demand first.

- **Demand signal:** the `launch_waitlist` table in Supabase. Every "Raise your hand" form and the Circle onboarding write rows whose `interests` array holds `{kind:'discipline', discipline, …}`. Aggregate `interests[].discipline` across all rows and rank by count. That ranking is the build order.
- Read it with a **service-role key from the environment** (`SUPABASE_SERVICE_KEY`), server-side only. The anon key cannot read this table (RLS) and must not be used to try. If no service key is available this run, fall back to the **priority list** below.
- **Skip skills that already have a deep sheet.** A sheet is "deep" if it has the standard's spine + multiple `<section>` blocks (rule of thumb: file has `class="spine"` and ≥ 6 `<section>`; the thin template has 1–2 sections and a `class="card"` ranked list). Deep already (do not rebuild): `avant-garde-and-modernist-technique`, `lymphatic-drainage`, `lifestyle-medicine`, `freediving`.
- **Fallback order** (used whenever the demand query is unavailable): follow `os/playbooks/skill-sheet-priority.md` top-down — a "most interesting × most trendy × crew-relevant" ranking — skipping anything already deep. Then continue by Atlas community-rank.

### 3. Build 1–3 sheets to the standard
Default batch = **2** (max 3) fully-verified sheets per run. Quality over count — a run that ships one true sheet beats one that ships three shaky ones.

**Reference implementations (copy their CSS/structure verbatim):** `website/atlas/avant-garde-and-modernist-technique.html`, `website/atlas/freediving.html`, `website/atlas/lymphatic-drainage.html`. Match one of these exactly, then swap content. Change only the per-world `--accent`.

**Sections, in order:**
1. **Hero** — breadcrumb (Atlas / World), skill name, the **spine** in one line (the craft's single ownable truth), an honest sub-line. Open on a hook, never a definition.
2. **What it actually is** — the honest read. First paragraph gets `class="dropcap"`.
3. **The wonders** — "N things nobody tells you about X": 3–4 verified, genuinely surprising facts.
4. **Origin / founder** — the human story, told honestly; debunk an inflated myth if there is one; a real, attributed pull-quote (never invent a quote).
5. **Where it's alive now** — the living community; emphasise WHY THIS PLACE — the scene, "your people."
6. **What's true vs what's sold** — the Real-vs-Sold ledger + "the con" beat; deep citations folded into `<details>`.
7. **Where we'd send you** — one **source-first pick**; the **gate shown honestly**; the **English pathway** (put English-taught forward, but still name the best even if it's another language, labelled); **"What it opens"** (concrete doors — jobs, workplaces — honest, never a promised job); a `<details>` "how you'd start"; alternatives labelled by language.
8. **Go deeper** — up to one embedded video + one book + one podcast, each the most reputable *and* genuinely good, **all verified to resolve/embed**. Ship fewer if you can't verify one. Books via OpenLibrary work keys are a reliable, checkable link.
9. **Trust** — first-person "What I check before I send you anywhere" (Arnaud's voice).
10. **Close** — one memorable line.
11. **CTA** — the intent form (`class="intent" data-discipline="<id>" data-label="<Label>" data-source="atlas:<id>"`) **AND** a "Join the Circle →" link to `/circle`.

Also include: the reading-progress bar (`<div class="progress" id="progress">` + its script), and a media-ready comment where a licensed photo can drop in later. Do **not** invent or hotlink images — leave the slot until a real, openly-licensed, hosted, attributed image exists.

**Voice:** plain, concrete, first-person where it fits, specific numbers, short sentences. It must **not read as AI-generated** — no "elevate/unlock/dive in/in a world where," no hype, no hedging filler. Match the existing sheets.

### 4. Keep the URL working
Overwrite the existing thin `website/atlas/<id>.html` in place (same URL, same `data-discipline`, so intent-capture and the `--<destination>` redirect pages keep working). Don't rename.

### 5. Commit, push branch, PR, log
- One commit per sheet, on `auto/skill-sheets`. Message: what was built + that every fact was crosschecked + the demand rank that chose it.
- Push `auto/skill-sheets`. Open a PR to `main` (or update the day's existing PR) titled `Nightly skill sheets — <date>`, body listing each sheet, its demand rank, and any claim that was dropped for lack of verification.
- Append a line to `logs/skill-sheets.log` (date, skills built, demand source used).
- **Never merge the PR yourself.** Arnaud is the gate.

---

## Pre-ship checklist (every sheet)
- [ ] one spine, hook open, one-line close
- [ ] every fact / link / media crosschecked at content depth; unverifiable dropped
- [ ] English-forward (pick's language stated + English path; alts labelled)
- [ ] source-first pick + gate shown honestly
- [ ] living scene / why-here emphasised
- [ ] "what it opens" beat (honest, no promised job)
- [ ] no invented or hotlinked images; media-ready slot left for later
- [ ] go-deeper items all verified to resolve
- [ ] intent form + Join-the-Circle link present
- [ ] built on `auto/skill-sheets`, PR opened, **main untouched**
