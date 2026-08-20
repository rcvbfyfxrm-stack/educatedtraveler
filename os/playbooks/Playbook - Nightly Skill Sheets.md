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

## RULE ZERO — a sheet is public-facing production, so it is not written bare-handed

A skill sheet is a page in EducatedTraveler's voice. Everything below follows from that, and it is Arnaud's standing instruction (2026-08-12), not a preference.

- **The twelve laws of L'Essence govern every line.** A draft that violates one does not ship — fix it, and say which law forced the change. The laws are private: compact copy in `marketing/MASTER-META-PROMPT.md` §1, canonical under `NEXUS/Knowledge/`. Point at them, never quote them into this file or into a sheet — this playbook and this repo are public.
- **Route through `keel` when you can reach it.** Anything public-facing goes through the `keel` agent automatically, every time, not on request — it holds The Base (what the company is), The Standard (the ten rules to belong), and the register of what may never be claimed. It gates the draft from the start; drafting first and routing afterwards is how a false claim gets in. **The unattended nightly builder cannot do this** — keel lives outside this repo and the cloud run only has this checkout. So the rules keel would enforce are written out below, in full, and the builder applies them itself. If you are a session that *can* summon keel, summon it; the list below is the floor, not the ceiling.
- **A sheet that touches a Lab Week is outreach, and the outreach gate applies.** Some sheets carry a week block naming a master (`modern-new-technique-cuisine` carries Martin Lippo's). That is `hail`'s territory: until a master has given his written yes on dates and terms, his name tied to the offer, the price, and the payment mechanics stay off anything recordable — and a public web page is the most recordable surface there is. **If a sheet you are building would add or change a week block, do not guess the gate state: leave the block exactly as you found it and say so in the PR body.**

### What may never be claimed on a sheet

Established by research, not opinion. Each one has been reached for before.

- **No promise of skill.** "You come home able to do it" is banned, and so is "a master is a shortcut." Deliberate practice explains under 1% of performance variance in professions.
- **No membership or mastery implied by a short stay.** A seven-day guest is a guest. Never "alumnus" for a week.
- **Never first, never only.** Free, panel-curated, older and larger guides to craft already exist. "Nobody pays to be here" is a fact about us and stays; "the only honest map" is a claim about them and goes.
- **No market-size figures.** The numbers in circulation contradict each other by roughly 70x.
- **No invented anything** — review, rating, master, quote, scarcity number or credential. An honest blank outranks a good guess.
- **Print the way around us.** Wherever a sheet names a school, it names how to go direct and what that costs, even when going direct is cheaper. That rule is the reason the pick can be trusted at all.

### THE PICK — best by a distance, or no pick at all

Arnaud's ruling, 2026-08-16: **trust is the anchor of EducatedTraveler.** Two things follow, and they bind harder than the urge to finish a sheet.

**A pick is published only when one place is better than the alternatives by a clear distance.** Not "good". Not "the best we found in an evening". If the field is close, or the front-runner is merely fine, **the sheet ships with no pick** — a "Where we'd send you" section that says openly that nothing has cleared the bar yet, and invites a letter. A blank slot costs one sheet. A mediocre recommendation costs the reason anyone believes the next one.

This is a **selection** bar, and it does not become page copy. Never write "the best school in the world" — that is an unverifiable superlative, and keel bans those for the same reason it bans every other claim nobody can check. **The page gives the reasons, not the ranking:** who stands in the room, whose room it is, what the guest's hands actually get to ruin, who else is at the bench, what it costs to go direct. A reader who can check each reason will reach "this is the best one" without us asserting it — and if they can't reach it, we did not earn the pick.

**When there is no standout, say which way the field failed.** "Three schools teach this well and we cannot separate them" and "everything we found is a demonstration dressed as a workshop" are different facts, and both are more useful than silence.

**A check has a date, and checks go stale.** Cross-checking is not a thing done once at build time — decay is the whole reason this Atlas exists rather than a panel's list. So:
- Every pick carries the date it was last checked and, per the standard, a named checker.
- Before a sheet is cited in a letter, re-shipped, or otherwise pushed at people, **re-verify it** — every outbound link resolves, the named teacher still stands in that room, the enrolment door still opens, the price is still the price.
- Any check older than **six months** is stale: re-verify or mark it stale on the page. (Six months is the working default — Arnaud's to change.)
- **If re-verification fails, the pick comes down.** It is never softened, hedged, or left up with a caveat. A place that closed is a blank, and the blank is the honest state.
- **But prove the failure before you act on it.** A wrongly-declared death is its own dishonesty: it deletes something true and tells the reader we checked when we mis-checked. One bad response is not evidence. Before calling anything dead: retry two or three times with a gap (OpenLibrary returns 503 under load and 200 a minute later; UKSA answered 403 once and 200 on retry), and confirm the network itself is up — if a control request to a site you know is healthy also fails, the fault is yours, not theirs. Distinguish the three cases and write which one it is: **dead** (a real 404 — the claim comes down), **unreachable** (host refuses from here, DNS fine — say "unconfirmed" on the page and leave the claim standing), and **transient** (retry until it settles). Never record a check whose result you could not reproduce.

### Two habits that catch what a fact-check misses

- **The checking sentence.** After writing a factual line, silently add *"…and here's how you could check that."* If that sentence exists, put it in. If it doesn't exist, the line is smuggling — cut it.
- **The implicature audit.** The dangerous sentences are the ones that are about 90% true. Two provable facts placed side by side can assemble a third thing that is false, and no per-claim check will catch it because every claim passes. Audit the juxtapositions, not only the claims.

---

## Each run, in order

### 1. Fresh clone
Clone `main` fresh into a scratch dir (never work from a stale or dehydrated checkout). Branch `auto/skill-sheets` off `main` (or fast-forward it to `main` first so each night starts from what's live).

### 2. Pick what to build — the letters, then the Circle, then the trends
**`os/playbooks/skill-sheet-priority.md` is the build order.** Read it every run — it is the authority, and
Arnaud edits it. It runs in four tiers, worked top-down, finishing a tier before starting the next:

1. **The letters** — the skills already featured in the Circle letters (`marketing/circle/`). Those readers
   were sent to that exact Atlas URL, so they are the warmest traffic we have. Before building one, **read
   its letter** and make the sheet agree with it: every fact the letter stated must hold on the sheet, and
   the letter's place is the pick unless research overturns it (in which case say so, in the open).
2. **Live Circle demand** — the `launch_waitlist` table in Supabase. The Circle onboarding, `/circle`,
   `/portrait` and every "raise your hand" form write rows whose `interests` array holds
   `{kind:'discipline', discipline, …}`. Aggregate `interests[].discipline` across all rows and rank by
   count; **a named member with a specific dream outranks a raw count** — build that sheet for them and name
   them in the PR body so Arnaud can write to them. Read the table with a **service-role key from the
   environment** (`SUPABASE_SERVICE_KEY`), server-side only — the anon key cannot read it (RLS) and must not
   be tried. No key this run: log that tier 2 was skipped for lack of credentials and fall through. Never
   guess at demand.
3. **Most trendy worldwide** — the ranked list in the priority file.
4. **Most trendy for yacht people** — the crew list in the priority file. This is the audience Arnaud
   actually stands next to.

- **Skip skills that already have a deep sheet.** A sheet is "deep" if it has the standard's spine + multiple `<section>` blocks (rule of thumb: file has `class="spine"` and ≥ 6 `<section>`; the thin template has 1–2 sections and a `class="card"` ranked list). Check `main` rather than trusting the skip-list — it goes stale as PRs merge.

### 3. Build 1–3 sheets to the standard
Default batch = **2** (max 3) fully-verified sheets per run. Quality over count — a run that ships one true sheet beats one that ships three shaky ones.

**Reference implementations (copy their CSS/structure verbatim):** `website/atlas/modern-new-technique-cuisine.html`, `website/atlas/freediving.html`, `website/atlas/lymphatic-drainage.html`. Match one of these exactly, then swap content. Change only the per-world `--accent`.

**Sections, in order:**
1. **Hero** — breadcrumb (Atlas / World), skill name, the **spine** in one line (the craft's single ownable truth), an honest sub-line. Open on a hook, never a definition.
2. **What it actually is** — the honest read. First paragraph gets `class="dropcap"`.
3. **The wonders** — "N things nobody tells you about X": 3–4 verified, genuinely surprising facts.
4. **Origin / founder** — the human story, told honestly; debunk an inflated myth if there is one; a real, attributed pull-quote (never invent a quote).
5. **Where it's alive now** — the living community; emphasise WHY THIS PLACE — the scene, "your people."
6. **What's true vs what's sold** — the Real-vs-Sold ledger + "the con" beat; deep citations folded into `<details>`.
7. **Where we'd send you** — one **source-first pick**, and only if it clears the bar above by a clear distance; otherwise no pick, stated openly. The **gate shown honestly**; the **date it was last checked**; the **English pathway** (put English-taught forward, but still name the best even if it's another language, labelled); **"What it opens"** (concrete doors — jobs, workplaces — honest, never a promised job); a `<details>` "how you'd start"; alternatives labelled by language; and what it costs to go direct.
8. **Go deeper** — up to one embedded video + one book + one podcast, each the most reputable *and* genuinely good, **all verified to resolve/embed**. Ship fewer if you can't verify one. Books via OpenLibrary work keys are a reliable, checkable link.
9. **Trust** — "What **we** check before we send you anywhere." The section stays; the person goes. Arnaud set this on 2026-08-06 and it **supersedes the older "first person, Arnaud's voice" instruction that used to sit on this line**: the Atlas never talks about Arnaud. No "I'm Arnaud," no credentials, no years on the water, no "this isn't my craft" — **not even the true ones.** Sheets speak as EducatedTraveler. "Nobody pays to be here" stays verbatim: that is a fact about the company, not a claim about a person. If a draft seems to need a personal story, that material belongs in a letter — say so in the PR, never write it into the sheet.
   **The one carve-out:** a locked catalogue page's first-person **letter invitation** ("I open a craft on the Atlas when a member writes to me about it… I'm the only one who reads it") is never swept. The test is *credential or invitation?* — credentials go, invitations stay, and "we read every one" would break a promise that "I read every one myself" makes.
10. **Close** — one memorable line.
11. **CTA** — the intent form (`class="intent" data-discipline="<id>" data-label="<Label>" data-source="atlas:<id>"`) **AND** a "Join the Circle →" link to `/circle`.

Also include: the reading-progress bar (`<div class="progress" id="progress">` + its script), and a media-ready comment where a licensed photo can drop in later. Do **not** invent or hotlink images — leave the slot until a real, openly-licensed, hosted, attributed image exists.

**Save-this-skill wiring (every sheet):** load the account stack so the "Save this skill" button works — after `<script src="/js/supabase-config.js">` add `/js/auth.js` and `/js/database.js`, and after `/js/intent-capture.js` add `/js/skill-save.js` (defer). `skill-save.js` auto-injects the button above the intent form from its `data-discipline`/`data-label`, so no extra markup is needed. Copying `freediving.html` verbatim already gives you all of this.

**Voice:** plain, concrete, specific numbers, short sentences — the register of Arnaud's letters, never his biography (see the Trust rule above: the Atlas speaks as "we"). The first line says plainly what the thing IS; at most one poetic line, and only at the end. A working chef should be able to repeat the spine correctly after reading it once.

It must **not read as AI-generated.** Banned outright: elevate, unlock, dive in, "in a world where", transformation, transformational, life-changing, curated, empower, journey, luxury, immersive as filler, and any present tense for something that has never happened. No hype, no hedging filler, no decorative emoji. Match the existing sheets.

### 4. Keep the URL working
Overwrite the existing thin `website/atlas/<id>.html` in place (same URL, same `data-discipline`, so intent-capture and the `--<destination>` redirect pages keep working). Don't rename.

### 5. Commit, push branch, PR, log
- One commit per sheet, on `auto/skill-sheets`. Message: what was built + that every fact was crosschecked + the demand rank that chose it.
- Push `auto/skill-sheets`. Open a PR to `main` (or update the day's existing PR) titled `Nightly skill sheets — <date>`, body listing each sheet, its demand rank, and any claim that was dropped for lack of verification.
- Append a line to `logs/skill-sheets.log` (date, skills built, demand source used).
- **Never merge the PR yourself.** Arnaud is the gate.

---

## Pre-ship checklist (every sheet)
- [ ] routed through `keel` if this session can reach it; otherwise the rule-zero list applied by hand
- [ ] no week block added or changed without the gate state confirmed (left as found, noted in the PR)
- [ ] no line violates one of the twelve laws; if one was fixed, the PR body names the law
- [ ] one spine, hook open, one-line close
- [ ] every fact / link / media crosschecked at content depth; unverifiable dropped
- [ ] every factual line has its checking sentence — nothing smuggled
- [ ] juxtapositions audited: no two true things arranged into a false one
- [ ] no promise of skill, no membership from a short stay, no first/only, no market-size figure
- [ ] the Atlas speaks as "we" — no first-person claim about Arnaud anywhere on the sheet
- [ ] the way to go direct is printed wherever a school is named, even when it is cheaper
- [ ] English-forward (pick's language stated + English path; alts labelled)
- [ ] source-first pick + gate shown honestly
- [ ] the pick is better than the field by a clear distance — or there is no pick, and the sheet says why
- [ ] the pick's reasons are on the page; the word "best" is not
- [ ] every pick carries its checked-on date; nothing cited is older than six months unverified
- [ ] living scene / why-here emphasised
- [ ] "what it opens" beat (honest, no promised job)
- [ ] no invented or hotlinked images; media-ready slot left for later
- [ ] go-deeper items all verified to resolve
- [ ] intent form + Join-the-Circle link present
- [ ] built on `auto/skill-sheets`, PR opened, **main untouched**
