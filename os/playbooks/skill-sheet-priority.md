# Skill-sheet build order

The order the nightly builder works through. **Four tiers, worked top-down.** Finish a tier before
starting the next one; inside a tier, work the list in order. Skip anything that already has a deep sheet.

Set by Arnaud, 2026-07-29 — replacing the old single "most interesting × most trendy" list.

**Already deep — skip:** `modern-new-technique-cuisine` (and its old alias `avant-garde-and-modernist-technique`) ·
`lymphatic-drainage` · `lifestyle-medicine` · `freediving` · `self-sufficiency` · `japanese-knife-making` ·
`sailing-and-yachtmaster` · `cold-exposure-wim-hof-method` and `spearfishing` *(the last two land when PR #7 merges —
check `main` before you rebuild them)*.

---

## TIER 1 — THE SKILLS IN THE LETTERS

**Build these first.** Every Circle letter sends readers to one Atlas page by name. Those readers are the
warmest traffic the Atlas gets — they were told a real story and then clicked to see more. Right now most of
them land on the thin template, which makes the letter look better than the site. Close that gap first.

| # | Skill | Letter | What the letter already told them |
|---|-------|--------|-----------------------------------|
| 1 | `pottery-and-ceramics` | Welcome (Nº 0) | Mashiko; Shōji Hamada settled 1924; plain useful handmade things; the climbing kilns; the families who never left. **Pick must be Mashiko** — the letter names it. |
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

## TIER 2 — LIVE CIRCLE DEMAND

**Then build what Circle members actually asked for**, highest count first.

- Signal: the `launch_waitlist` table in Supabase. The Circle onboarding, `/circle`, `/portrait` and every
  "raise your hand" form write rows whose `interests` array holds `{kind:'discipline', discipline, …}`.
  Aggregate `interests[].discipline` across all rows, rank by count, build down the ranking.
- Read it with the **service-role key from the environment** (`SUPABASE_SERVICE_KEY`), server-side only.
  The anon key cannot read this table (RLS) and must not be tried.
- **A named member beats a raw count.** Where a row carries a person and a specific dream, that skill goes to
  the top of the tier and the sheet gets built *for them* — that is how `self-sufficiency` (Joana),
  `japanese-knife-making` (Cam) and `sailing-and-yachtmaster` (Kate) were built. Note the member in the PR body
  so Arnaud can write to them.
- If the service key isn't in the environment this run, log that tier 2 was skipped for lack of credentials
  and fall through to tier 3. Do **not** guess at demand.

## TIER 3 — MOST TRENDY WORLDWIDE

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

## TIER 4 — MOST TRENDY FOR YACHT PEOPLE

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

Everything else on the Atlas, in descending community-strength rank (the `★ Best place to go` /
"Legendary living community" signal already on each thin sheet).

*Editable. Reorder freely — but keep the tier order: the letters are a promise already made, Circle demand is
a real person waiting, and the two trend tiers are educated guesses about strangers. Promises first.*
