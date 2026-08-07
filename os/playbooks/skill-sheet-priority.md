# Skill-sheet build order

The order the nightly builder works through. **Tiers, worked top-down — except Tier 2 and Tier 3 run
alongside each other, not one after the other (see below).** Inside a tier, work the list in order. Skip
anything that already has a deep sheet.

Set by Arnaud, 2026-07-29 — replacing the old single "most interesting × most trendy" list.
**Reprioritized 2026-08-04:** everything built from here on is for the Circle, full stop. Tier 2 (Arnaud's
own — sailing, windsurf, freediving, every culinary discipline) is new and sits right under the letters.
Trend tiers 4 and 5 are ON HOLD — see the note at the bottom of this file before touching either.

**Already deep — skip:** `modern-new-technique-cuisine` (and its old alias `avant-garde-and-modernist-technique`) ·
`lymphatic-drainage` · `lifestyle-medicine` · `freediving` · `self-sufficiency` · `japanese-knife-making` ·
`sailing-and-yachtmaster` · `cold-exposure-wim-hof-method` and `spearfishing` *(the last two land when PR #7 merges —
check `main` before you rebuild them)*.

---

## TIER 1 — THE SKILLS IN THE LETTERS

**Build these first.** Every Circle letter sends readers to one Atlas page by name. Those readers are the
warmest traffic the Atlas gets — they were told a real story and then clicked to see more. Right now most of
them land on the thin template, which makes the letter look better than the site. Close that gap first.

**⚠ IN FLIGHT — do not rebuild:** a sheet sitting in an open PR is NOT on `main`, so the "is it already deep?" check will say no and you will duplicate someone's work. Before building anything, run `gh pr list --state open` and skip any skill whose sheet is already in an open PR.

**Currently in flight, in addition to the Tier 1 four below:** `wine-and-sommellerie` (Tier 2 #10) and `french-pastry-and-patisserie` (Tier 2 #3) → **PR #10**. Tier 2 rows already built and on PR #7: `windsurfing-and-wing-foil` (#1), `classical-french-cuisine` (#2). **So the next unbuilt Tier 2 row is #4 `bread-and-boulangerie`.**

**✅ TIER 1 IS COMPLETE — all four are built and waiting on Arnaud's merge, none are on `main` yet.**
`pottery-and-ceramics` → **PR #9**. `new-basque-cuisine`, `italian-cuisine-and-pasta`, `chocolate-and-confectionery` → **PR #7**. Do not rebuild any of them. Until those PRs merge, every one of them will keep *looking* thin on `main` — that is the whole reason this block exists.

| # | Skill | Letter | What the letter already told them |
|---|-------|--------|-----------------------------------|
| 1 | `pottery-and-ceramics` | Welcome (Nº 0) | ⚠ **BUILT — in PR #9, skip.** Mashiko; Shōji Hamada settled 1924; plain useful handmade things; the climbing kilns; the families who never left. **Pick must be Mashiko** — the letter names it. |
| 2 | `new-basque-cuisine` | Nº 2 | San Sebastián; the Gilda at Casa Vallés (mid-1940s, named for the Rita Hayworth film); *pintxo* ← *pincho*; the txikiteo; txakoli poured from height; the **txokos**; most Michelin stars per capita; Arzak + Subijana and Nueva Cocina Vasca; the Basque Culinary Center. |
| 3 | `italian-cuisine-and-pasta` | Nº 3 | Bologna; **Alessandra Spisni**, *sfoglina*, metre-long rolling pin; her school since 1993 — the one school in the world training sfogline; single day or full professional course. |
| 4 | `chocolate-and-confectionery` | Nº 3 | Caracas; **María Fernanda Di Giacobbe**; Venezuelan *criollo* cacao at the source; first-ever Basque Culinary World Prize (2016); Cacao de Origen trains makers where the bean grows. |

Already deep, nothing owed: **freediving** (Letter Nº 1, Dahab) and **modern new-technique cuisine**
(Letter Nº 3, Martín Lippo / Vakuum).

**Two hard rules for tier 1:**
- **The sheet must agree with the letter.** Read the letter in `marketing/circle/` before you build. Every fact
  the letter states must appear on the sheet, unchanged and still true — a reader who spots the site
  contradicting the letter has caught us being careless, and that costs more than a thin page ever did.
- **The letter's place is the pick**, unless verification proves it wrong. The letters already committed us
  to Mashiko, San Sebastián, Bologna, Caracas. If research genuinely overturns one, say so on the sheet and
  flag it in the PR — don't quietly send readers somewhere else.

## TIER 2 — ARNAUD'S OWN

**Sailing, windsurfing, freediving, and the whole of the culinary world.** Not because a Circle member
named them — because Arnaud can write every one of these in his own voice, first-hand, without waiting on
outside verification for the parts he already knows cold: fifteen years on the water, and cooking for a
living. This is still building for the Circle — it's the founder half of "everything I build is for the
Circle," same as the letters are the promise-keeping half.

**Already deep, nothing owed:** `sailing-and-yachtmaster` (Kate's letter/ask, see Tier 3 note below) and
`freediving` (Letter Nº 1, Dahab — see Tier 1). `modern-new-technique-cuisine`, `new-basque-cuisine`,
`italian-cuisine-and-pasta`, `chocolate-and-confectionery` are the four culinary letters, already built —
see Tier 1.

**To build — one sheet a night, quality over count, same standard as tier 1:**
1. `windsurfing-and-wing-foil` — the wing-foil boom; Arnaud's own water-toy world
2. `classical-french-cuisine` — the foundation his whole training sits on
3. `french-pastry-and-patisserie`
4. `bread-and-boulangerie`
5. `cheese-and-fermentation`
6. `asado-and-open-fire-cooking`
7. `viennoiserie`
8. `coffee-and-barista`
9. `mixology-and-bartending`
10. `wine-and-sommellerie`
11. `whisky-and-distilling`
12. `sake-and-sommellerie-of-sake`
13. `sushi-and-washoku`
14. `modernist-spanish-cuisine`
15. `korean-cuisine-hansik`
16. `sichuan-and-chinese-cuisine`
17. `thai-cuisine`
18. `vietnamese-cuisine`
19. `north-indian-cuisine`
20. `oaxacan-and-mexican-cuisine`
21. `peruvian-cuisine`
22. `tea-and-tea-ceremony`

That's all 25 culinary disciplines plus windsurfing (the 4 letters + 2 already-deep are done; 22 left).
Order above is a starting guess (closest to Arnaud's own training first) — reorder freely, it isn't sacred
the way the letters' order is.

**One hard rule, same as tier 1: never fabricate.** "Arnaud's own" means he can write the voice and the
technique honestly — it does NOT mean skip verifying the schools, named teachers, and credentials on the
sheet. Every claim still needs a real, checkable source. If a fact can't be verified, say so on the sheet
rather than asserting it because it "sounds right" for the craft.

### ⭐⭐ VOICE — SET BY ARNAUD, 2026-08-06. THE ATLAS NEVER TALKS ABOUT ARNAUD.

His words: *"claim nothing about me — the skills are for the Circle. I would always talk about me in the
letters, not in the Atlas, nor skill sheets."*

**This supersedes the older "Trust — first person, Arnaud's voice" line in the locked standard, and it
applies to EVERY sheet, every tier.** A skill sheet exists to serve the reader deciding where to go. The
founder's story is the *letters'* job. Keeping them separate is the point: the letters earn trust by being
personal, the Atlas earns it by being checkable.

**Two different things, do not confuse them:**

- **Register — KEEP.** Plain, concrete, short sentences; direct address to "you"; no hype, no
  AI-polish, no brochure. The cadence of the letters in `marketing/circle/` is still the model. That is
  what "his voice" means here.
- **Biography — REMOVE ENTIRELY.** No "I'm Arnaud." No credentials, no years on the water, no "I cook for
  a living," no "this isn't my craft," no first-person experience of any kind. **Not even the true ones.**

**Write the sheet as EducatedTraveler — "we".** "We check." "We'd send you." "We introduce; you decide."
Already the house voice everywhere else on the site.

**The Trust section stays** — it is one of the most valuable blocks on the page — it just stops being a
bio. Rewrite its heading to **"What we check before we send you anywhere"** and its intro to the standard
being applied, not the person applying it. Example of the target:

> Every place on this Atlas is checked by hand before it goes on the map. Here's the bar it has to clear —
> and what we'll tell you straight when it doesn't.

Keep every existing bullet, converted to "we". **"Nobody pays to be here"** stays exactly as it is: that is
a fact about EducatedTraveler, not a claim about a person.

**And the old fabrication guardrail now has nothing to bite on, which is the point:** with no first-person
experience on the page there is no biography to invent. If a draft ever seems to *need* a personal story to
land, that is a signal the material belongs in a letter — say so in the PR rather than writing it in.

## TIER 3 — LIVE CIRCLE DEMAND — RUNS ALONGSIDE TIER 2, NEVER BEHIND IT

**Build what Circle members actually asked for**, highest count first. This tier does not wait for Tier 2
to finish — a real person's ask jumps in front of a founder-pick sheet the very next run. If Tier 2 and
Tier 3 both have something ready, build the Tier 3 (real person) sheet first.

- Signal: the `launch_waitlist` table in Supabase. The Circle onboarding, `/circle`, `/portrait` and every
  "raise your hand" form write rows whose `interests` array holds `{kind:'discipline', discipline, …}`.
  Aggregate `interests[].discipline` across all rows, rank by count, build down the ranking.
- Read it with the **service-role key from the environment** (`SUPABASE_SERVICE_KEY`), server-side only.
  The anon key cannot read this table (RLS) and must not be tried.
- **A named member beats a raw count.** Where a row carries a person and a specific dream, that skill goes to
  the top of the tier and the sheet gets built *for them* — that is how `self-sufficiency` (Joana),
  `japanese-knife-making` (Cam) and `sailing-and-yachtmaster` (Kate) were built. Note the member in the PR body
  so Arnaud can write to them.
- If the service key isn't in the environment this run, fall through to tier 2 (Arnaud's own) — but
  **do not let the skip be quiet.** Do not guess at demand either.

**⚠ AS OF 2026-08-04 THIS TIER HAS NEVER ONCE RUN.** Every night since the tier order was set, the log reads
*"tier 2 launch_waitlist skipped for lack of credentials"* (that log line predates this file's 2026-08-04
renumbering — it means this tier, live Circle demand) — `SUPABASE_SERVICE_KEY` is not in the nightly
routine's environment. Arnaud has been given the exact fix (add it to environment `env_0195TdEf1NoVLSgHqnpogAnW`
via https://claude.ai/code); check whether it's landed before assuming this warning still applies. If it's
still missing, the builder has been spending every night on guesses about strangers while the tier of
**real people who actually asked** is stepped straight over. That is backwards, and it went unnoticed for a
week because the skip was buried in a log file.

**So: when you cannot read demand, make it impossible to miss.**
- Prefix the PR **title** with `[TIER 3 SKIPPED]`.
- Make the **first line of the PR body**: `⚠ Circle demand was NOT consulted this run — no SUPABASE_SERVICE_KEY in the environment. These sheets are tier-2 founder picks, not what members asked for.`
- Keep logging it as well.

**The fix, for whoever reads this:** add `SUPABASE_SERVICE_KEY` (the service-role key, from the ET project
`.env` / the Supabase dashboard → Project Settings → API) to the nightly routine's environment
`env_0195TdEf1NoVLSgHqnpogAnW`. It's a server-side secret: it belongs in the environment, never in this file,
never in the repo, never in a commit.

## TIER 4 — MOST TRENDY WORLDWIDE — ON HOLD

**Do not build from this tier.** These are educated guesses about strangers, not the Circle — the opposite
of "everything I build is for the Circle." Only come back to this list once Tier 2 (Arnaud's own) and
Tier 3 (live Circle demand) are both genuinely exhausted, i.e. Tier 3 is running (the service key is fixed)
and has caught up, and Tier 2's 22 sheets are built. Left in place as a record of the research, not a queue.

What the wider world is actually booking right now. Anchored in the 2026 "skillcation" reporting — workshop
bookings up 58% year on year, 76% of travellers saying a skill is more appealing than ever, nearly a third of
Gen Z preferring to come home with a skill over a souvenir; the named hot spots being Japanese traditional
crafts, Italian cooking, pottery, mixology and dance
([GetYourGuide](https://www.getyourguide.com/explorer/travel-inspiration/hidden-travel-trends-skill-seekers/),
[Travel And Tour World](https://www.travelandtourworld.com/news/article/skillcations-2026-how-to-travel-while-mastering-new-hobbies-and-skills/)).

1. `kintsugi-japanese-gold-repair` — the Japanese-craft wave, and a real true-vs-sold story
2. `mixology-and-bartending` — named in the trend reporting; doubles as tier-4 crew
3. `glassblowing` — pulled mainstream by television; Murano at the source
4. `brazilian-jiu-jitsu` — among the fastest-growing disciplines on earth
5. `surfing` — evergreen and still climbing; Duke Kahanamoku at the source
6. `tattooing` — irezumi lineage; strong true-vs-sold
7. `muay-thai` — the train-in-Thailand pilgrimage
8. `pranayama-and-breathwork` — breathwork's moment, with verifiable physiology
9. `sound-healing` — trending hard; needs an honest read more than any other skill here
10. `argentine-tango` — dance lessons are a named trend driver; Buenos Aires
11. `flamenco-and-dance` — Seville / Jerez; compás, not costume
12. `falconry` — named explicitly in the 2026 trend coverage (Scotland)
13. `tea-and-tea-ceremony` — Japanese craft wave
14. `bread-and-boulangerie` — the sourdough decade, still going
15. `wilderness-survival-and-bushcraft` — bushcraft's mainstream moment
16. `kung-fu` — Shaolin / Wudang; iconic source story
17. `perfumery` — Grasse; the niche-fragrance surge
18. `natural-dyeing` · `textiles-and-weaving` — the slow-textile revival
19. `woodworking-and-joinery` — the hand-tool revival
20. `traditional-spa-and-hydrotherapy` — the Nordic sauna and bathing trend

## TIER 5 — MOST TRENDY FOR YACHT PEOPLE — ON HOLD

**Do not build from this tier** — same hold as tier 4, same reason. Left in place as a record of the
research, not a queue.

The audience Arnaud actually stands next to. Ranked by what the 2026 crew market pays for and what charter
guests ask for. Grounded in what the crew academies themselves teach and what the salary guides list as
value-adds: interior training covers **wine appreciation, bartending, floristry, silver service**; deckhands
are told **SCUBA, videography, photography, carpentry and watersports** make them more employable
([Flying Fish](https://www.flyingfishonline.com/news/superyacht-crew-salary-guide/),
[Superyacht Crew Academy](https://www.superyacht-crew-academy.com/courses/professional-superyacht-interior-crew-deckhand-package/),
[Lighthouse Careers](https://www.lighthouse-careers.com/blog/essential-yacht-chef-skills-required-complete-guide-for-2026/)).

1. `wine-and-sommellerie` — the single biggest interior value-add; the WSET-vs-terroir honest read is ours to write
2. `french-pastry-and-patisserie` — the chef skill charter guests notice first
3. `sushi-and-washoku` — charter-menu staple; itamae prestige and its myths
4. `scuba-diving` — named by the academies as a deckhand employability lift
5. `photography` — same; and the one crew skill that outlives the job
6. `classical-french-cuisine` — the foundation every yacht galley is still built on
7. `windsurfing-and-wing-foil` — the wing-foil boom; toys are deck's job
8. `kitesurfing` — same water-toy demand
9. `coffee-and-barista` — interior, daily, and judged constantly
10. `asado-and-open-fire-cooking` — the beach barbecue is a charter set piece
11. `cheese-and-fermentation` — provisioning and the cheese course
12. `viennoiserie` — breakfast service is where a chef is made or unmade
13. `whisky-and-distilling` — guest service; a great origin story
14. `sake-and-sommellerie-of-sake` — rising on charter drinks lists
15. `filmmaking` — the "videography" line in every deckhand advert
16. `thai-massage` · `reflexology-and-shiatsu` — interior wellness beside `lymphatic-drainage`
17. `wooden-boatbuilding` — the carpentry line, done properly
18. `cigar-rolling` — small, specific, and asked for more than you'd think
19. `mixology-and-bartending` — if tier 3 hasn't already taken it

**Known gap, not a skill we hold yet:** *floristry* is in every interior-crew curriculum and has **no Atlas
discipline**. Worth adding to `repertoire.js` rather than faking a sheet for it.

---

## Then

Everything else on the Atlas stays exactly as it is: visible in the catalogue, marked as not yet unlocked,
and ranked by community strength (the `★ Best place to go` / "Legendary living community" signal already on
each thin sheet) for whenever a Circle member does ask. Nothing gets hidden or removed from `/atlas/` for
being thin — the map stays whole, it just tells the truth about what's been asked for.

*Editable. Reorder freely within tiers 2 and 3 — but keep the shape: the letters are a promise already made,
Arnaud's own is the founder half of building for the Circle, live Circle demand is a real person waiting and
runs alongside it rather than behind it, and tiers 4/5 are educated guesses about strangers — on hold until
both real-Circle tiers are exhausted.*
