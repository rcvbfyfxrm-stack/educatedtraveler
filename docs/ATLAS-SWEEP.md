# The worldwide sweep

_How a craft gets rendered on the Atlas, and what has to be written down before it can be._

Arnaud, 1 September 2026: *"make sure you check all the market worldwide when rendering
a skill, so nothing is forgotten. Automatically double check each skill added by night."*

## Why

The failure this exists to stop is not a wrong fact. It is a **missing** one, and a
missing one leaves no trace.

Modernist Spanish Cuisine shipped with a pick, a star, four destinations and a page of
verified prices. Le Cordon Bleu Madrid — the only room on that craft where a
non-Spanish speaker follows the lesson live, through simultaneous translation — was
simply not in the file. Nothing on the page was false. Nothing on the page could have
told you. It took Arnaud saying *"le cordon bleu is doing a modern cuisine course as
well!!"* for anyone to look.

So a craft now records **where it looked**, not only what it found.

## The record

One `sweep` block per craft in `data/repertoire.js`:

```json
"sweep": {
  "date": "2026-09-01",
  "regions": ["Western Europe", "North America", "..."],
  "bounded": "optional — why this craft's search stops where it does",
  "rejected": [
    { "name": "...", "place": "...", "url": "...", "why": "..." }
  ]
}
```

- **`regions`** — from the eleven in `atlas_hub.SWEEP_REGIONS`. Naming a region means
  somebody searched it, not that anything was found there. Most crafts are genuinely
  concentrated; that is not a failure.
- **`bounded`** — a *sentence*, not a flag. Modernist **Spanish** Cuisine searched in
  one region is a complete sweep. Say why the search stops, and let the reader
  disagree with the reasoning.
- **`rejected`** — what was looked at and turned down, each with its reason. This is
  the part that earns its keep twice: it stops the next session re-deriving the same
  dead ends, and published it is the one thing the Standard says no rival will print —
  *a public count of what was checked and did not clear.*

## What the build enforces

Hard failure (`scripts/build-atlas-pages.py`):

- a malformed date, or one in the future;
- a region name that is not one of the eleven, or a repeat;
- **an empty `rejected` list** — a worldwide look that turned nothing down was not a
  sweep that found everything worthy, it was a sweep nobody wrote down;
- **a rejection with no reason** — an unexplained rejection is a private opinion.

Printed, never fatal:

- open crafts with no sweep at all (the backlog — 29 of 31 as of 1 Sept 2026);
- regions not yet searched, **on the page itself**;
- sweeps older than a year.

An unsearched region is deliberately *not* a build failure. Making completeness fatal
would teach the next person to type eleven region names in, which is exactly the lie
the record exists to prevent. A half-swept craft says so, in public.

## What the night does

`scripts/night-check.py`, every night at 02:40 (`.github/workflows/atlas-nightcheck.yml`),
reads every published claim on an open craft back against the page it came from:

1. **does the URL still resolve** — the commonest way an entry rots, and invisible from
   inside the repo;
2. **does the page still say what we printed** — via `verify`, literal fragments of our
   own copy attached to a school or a featured course. If we publish "3,320 EUR" and
   the page stops saying it, the entry is stale whether or not it returns 200.

It found something on its first run: **Espai Sucre**, listed on two crafts as
*"operating and enrollable"*, shut on 31 July 2024. Its broken TLS certificate was the
tell. It also found a dead link in the sweep written the same afternoon.

**It will never edit a claim, sign a check, or take an entry down.** Rule 10 wants a
name and a date on a check and a CI runner has neither. Failures are counted, not
acted on; three nights running turns the workflow red and makes the next morning's
build print it. The decision is Arnaud's, every time.

## Adding a sweep

1. Search each region you can honestly say you searched. Name real things.
2. Write every candidate you turned down into `rejected`, with the reason in plain
   words — the reason is the record.
3. Add `verify` to the schools you checked: two or three literal fragments of what you
   published. Without them the night check only knows the page exists.
4. `python3 scripts/build-atlas-pages.py` — it will refuse the sweep if it is not usable.
5. For a hand-written sheet, `python3 scripts/inject-related-handwritten.py` too: the
   preserved sheets are invisible to the generator by design, and the craft with the
   most thorough sweep on the map is one of them.
