# The six-stage journey on the Atlas page

**Status:** shipped to `scripts/build-atlas-pages.py` 2026-06-19 → regenerates all Atlas pages.
**Do NOT hand-edit the pages — they are generated** (the build does `shutil.rmtree(OUT)` first).

A person hunting for the best school moves through six questions in a fixed order (see the
cornerstone article `/journal/how-to-find-the-best-school-online`). An Atlas place page now
answers them **in that same order**, so reading top-to-bottom *is* the decision.

## The mapping

| # | Buyer's question | Section on the page |
|---|------------------|---------------------|
| 1 | **Be honest about the ceiling** | `ceiling_line()` under the place card (falls back to the `level` string — never fabricates a ceiling) |
| 2 | **Lineage, not logo** | `masters_html` ("The lineage"), **moved up** near the top |
| 3 | **School vs. funnel** | `rating_block` (cited ratings) + `schools_html` (hand-verified) + the `TRUST_HTML` block |
| 4 | **Picture the room** | `room_block()` (group size / a normal day / who comes) — omitted when no data |
| 5 | **What you walk away with** | `credential_section()`, **promoted** out of the hero meta into its own section |
| 6 | **Trust the proof** | cited ratings ("verify it yourself") + `TRUST_HTML` `<details>` five questions |

The intent-capture form (see `intent-capture-flow.md`) sits after the credential — capture
once the visitor has seen the proof, not before.

## New page order (place pages)

```
hero (lead = why)
 1. place card + ceiling line
 2. lineage
 3. why-this-school (cited) + schools (hand-verified)
 4. the room            (only when we have real data)
 5. the credential + intent form
 6. siblings + TRUST_HTML  (proof + how to verify anywhere, links to the full method article)
```

## Two optional data fields (graceful when absent)

Add to destinations in `repertoire.js` where verified; pages render the section only when present:

```json
"ceiling": "In a week you'll centre clay, pull a wall and trim a foot — enough to keep going at home. You won't yet glaze or fire your own work; that's the season after.",
"room": { "ratio": "max 6 to one teacher", "day": "mornings at the wheel, afternoons hand-building, fired on the last day", "who": "mixed levels, mostly first-timers, 20s–60s" }
```

Until the data exists, Question 1 falls back to an honest `level` prompt and Question 4 is
simply omitted — better than an empty claim.

## Why this was one change, not 400

Everything lives in `build-atlas-pages.py` (the body f-string, `ceiling_line`, `room_block`,
`credential_section`, `intent_form`, the `TRUST_HTML` link). Edit the generator, run it, every
page rebuilds. The generator wipes `website/atlas/` first, so a hand-patched page would be lost.
