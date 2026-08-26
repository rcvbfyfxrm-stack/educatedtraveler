#!/usr/bin/env python3
"""Gate on the built /atlas home. Run it after scripts/build-atlas-pages.py.

    python3 scripts/check-atlas-hub.py

Every check here is one that would otherwise fail silently — the page still 200s,
still looks finished, and is wrong. That is the failure mode this file exists for.

  1. the band is in the HTML at all, above the browse, with cards in it, and it is
     a rail that carries EVERY craft somebody asked for — not the first few;
  2. every craft in the band is one somebody actually asked for — a slug in
     data/atlas-unlocked.json, never a pinned sheet Arnaud wrote himself;
  3. the band is in date order, newest first, and every date is the one in
     data/atlas-opened.json — printed, not invented;
  4. the counts in the copy equal the counts in the data;
  5. the five world colours in atlas_hub.WORLD_COLOR still match the WORLDS map
     the page itself draws with, so a band card is the colour of its world;
  6. every card links to a craft page that exists on disk;
  7. every immersive learnLines sentence stays inside the research it sits above —
     no number and no proper noun that destination's own row does not already carry;
  8. a card that says "N places" is a card with N places to walk. The cue is
     rendered from one field and placeWalk() builds its list from another; if they
     drift, the card counts off "3 / 5" against a list of four and nothing else
     ever complains;
  9. the line a resting band card prints under its place is the written line for
     THAT place. The band is static HTML from Python and the walk is JS reading
     ET_ATLAS; if the two ever disagree the card changes its sentence the instant a
     pointer touches it, which reads as a lie and looks like a bug.

Exit 0 = all clear. Exit 1 = do not ship it.
"""
import html as html_mod
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_hub

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "website/atlas/index.html"
fails = []


def bad(msg):
    fails.append(msg)


if not PAGE.exists():
    sys.exit("check-atlas-hub: website/atlas/index.html is missing — build first.")

html = PAGE.read_text()
hands = json.loads((ROOT / "data/atlas-unlocked.json").read_text())["open"]
opened = json.loads((ROOT / "data/atlas-opened.json").read_text())["opened"]

# ── 1. the band exists, above the browse ───────────────────────────────────
band = re.search(r'<section class="newopen".*?</section>', html, re.S)
if not band:
    sys.exit("check-atlas-hub: FAIL — no band on the page. The Circle's crafts are not shown.")
band = band.group(0)
if html.index(band) > html.index('<main class="studio"'):
    bad("the band is below the browse, not above it")

cards = re.findall(r'<article class="gcard[^"]*" style="--sc:(#[0-9a-f]{6})">.*?'
                   r'href="/atlas/([a-z0-9-]+)".*?'
                   r'<div class="openedon">Opened <b>([^<]+)</b></div>', band, re.S)
if not cards:
    sys.exit("check-atlas-hub: FAIL — the band has no cards.")
if len(cards) != band.count("<article"):
    bad(f"{band.count('<article')} cards in the band but only {len(cards)} parse — "
        "the card markup changed and this check no longer reads it")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def iso(pretty):
    m = re.fullmatch(r"(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})", pretty.strip())
    return f"{m[3]}-{MONTHS.index(m[2]) + 1:02d}-{int(m[1]):02d}" if m and m[2] in MONTHS else None


# ── 2 + 3 + 6. every card, one at a time ───────────────────────────────────
seen = []
for color, slug, date in cards:
    if slug not in hands:
        bad(f"{slug} is in the band but not in data/atlas-unlocked.json — the band would be "
            "claiming an ask that never happened")
    d = iso(date)
    if not d:
        bad(f"{slug}: date '{date}' is not a date this check can read")
    elif opened.get(slug) != d:
        bad(f"{slug}: the page says {d}, data/atlas-opened.json says {opened.get(slug)}")
    else:
        seen.append(d)
    if not (ROOT / f"website/atlas/{slug}.html").exists():
        bad(f"{slug}: the card links to /atlas/{slug}, which is not on disk")

if seen != sorted(seen, reverse=True):
    bad(f"the band is not newest-first: {seen}")

# ── 3b. it carries ALL of them ─────────────────────────────────────────────
# The band used to print the first four and say "the crafts someone asked for".
# It is a rail now and shows every one, which is a promise the page can only keep
# while nothing caps the list again — so the cap is what this checks for. Compared
# against the crafts that COULD be in it: asked for, open, and with a date on file.
in_band = {slug for _, slug, _ in cards}
should = {s for s in hands if s in opened and (ROOT / f"website/atlas/{s}.html").exists()}
if should - in_band:
    bad(f"{len(should - in_band)} craft(s) somebody asked for are missing from the band: "
        f"{', '.join(sorted(should - in_band))} — the section claims all of them")
if not re.search(r'<div class="norail"', band):
    bad("the band is not a rail any more — with every craft in it and no rail, the "
        "section is a wall of cards rather than something a reader can scan")
m = re.search(r"all (\d+) — scroll", band)
if not m:
    bad("the band no longer says how many crafts are in it, so a reader has no way "
        "to know whether the row they can see is all of them")
elif int(m[1]) != len(cards):
    bad(f"the band says 'all {m[1]}' but carries {len(cards)} cards")

# ── 4. the counts in the copy are the counts in the data ───────────────────
idx = (ROOT / "website/js/atlas-index.js").read_text()
crafts = json.loads(idx[idx.index("{"):idx.rindex("}") + 1])["crafts"]
n_open = sum(1 for c in crafts if c["open"])
n_asked = sum(1 for c in crafts if c["open"] and c["id"] in hands)

m = re.search(r"<b>(\d+) of the (\d+) open crafts</b>", band)
if not m:
    bad("the band no longer prints the two counts — nothing to check, which is worse")
elif (int(m[1]), int(m[2])) != (n_asked, n_open):
    bad(f"the band says {m[1]} of {m[2]}; the data says {n_asked} of {n_open}")

m = re.search(r"The other (\d+|one) I opened myself", band)
n_mine = n_open - n_asked
if n_mine and not m:
    bad(f"{n_mine} crafts were opened by hand and the band does not say so")
elif m and (1 if m[1] == "one" else int(m[1])) != n_mine:
    bad(f"the band claims {m[1]} hand-opened crafts; the data says {n_mine}")

# ── 8. the number on the card is the length of the list it walks ───────────
# The cue is written by build-atlas-pages (dests carrying a place); placeWalk()
# rebuilds that list at runtime from ET_ATLAS by the same rule. Two code paths, one
# number, and a mismatch stays invisible until somebody watches "3 / 5" walk four.
_by_slug = {c["id"]: c for c in crafts}
for _, _slug, _ in cards:
    m = re.search(r'href="/atlas/' + re.escape(_slug) + r'"(.*?)</article>', band, re.S)
    cue = re.search(r'<div class="placecue">(\d+) places</div>', m[1]) if m else None
    real = sum(1 for d in _by_slug.get(_slug, {}).get("dests", []) if d.get("place"))
    if cue and int(cue[1]) != real:
        bad(f"{_slug}: the card says {cue[1]} places, the index holds {real}")
    elif real > 1 and not cue:
        bad(f"{_slug} is taught in {real} places and its card never says so")
    elif real > 1 and m and 'walks' not in (band[max(0, band.index(m[0]) - 120):band.index(m[0])]):
        bad(f"{_slug} counts {real} places but its card is not marked to walk them")

# ── 9. the resting line is the written line for the place it sits under ────
learn_lines = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text()).get("learnLines", {})
for _, _slug, _ in cards:
    c = _by_slug.get(_slug)
    if not c:
        continue
    want = (learn_lines.get(c.get("destId", "")) or "").strip() or (c.get("why") or "").strip()
    m = re.search(r'href="/atlas/' + re.escape(_slug) + r'"(.*?)</article>', band, re.S)
    got = re.search(r'<p class="cardhook">(.*?)</p>', m[1], re.S) if m else None
    if want and not got:
        bad(f"{_slug}: the band card prints no line under its place")
    elif got and html_mod.unescape(got[1]) != want:
        bad(f"{_slug}: the band card's line is not the written line for its place\n"
            f"      card:    {html_mod.unescape(got[1])[:90]}\n"
            f"      written: {want[:90]}")

# ── 5. the colours still mirror the page's own map ─────────────────────────
tpl = (ROOT / "scripts/atlas-hub-template.html").read_text()
live = dict(re.findall(r'(\w+):\{label:"[^"]*",short:"[^"]*",color:"(#[0-9a-f]{6})"\}',
                       tpl[tpl.index("var WORLDS={"):tpl.index("var ORDER=")]))
if not live:
    bad("could not read the WORLDS map out of the template — the colour mirror is unchecked")
elif live != atlas_hub.WORLD_COLOR:
    bad(f"atlas_hub.WORLD_COLOR has drifted from the template: {atlas_hub.WORLD_COLOR} vs {live}")

# ── 7. the immersive lines say nothing their own research does not ─────────
# The line sits directly above the `why` it summarises, so drift here is not a
# cosmetic bug: it is the Atlas making a claim it has not checked. See
# atlas_hub.learn_line_drift for what it can and cannot catch.
_rep = (ROOT / "data/repertoire.js").read_text()
_disc = json.loads(_rep[_rep.index("{", _rep.index("window.ET_ATLAS")):_rep.rindex("}") + 1])["disciplines"]
_lines = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text()).get("learnLines", {})
for _did, _kind, _tok, _line in atlas_hub.learn_line_drift(_lines, _disc):
    bad(f"learnLines[{_did}] asserts {_kind} {_tok!r}, which is nowhere in that "
        f"destination's own research: {_line!r}")

# ── verdict ────────────────────────────────────────────────────────────────
if fails:
    print("check-atlas-hub: FAIL")
    for f in fails:
        print("  · " + f)
    sys.exit(1)
print(f"check-atlas-hub: OK — {len(cards)} crafts in the band, newest {cards[0][2]}, "
      f"{n_asked} of {n_open} open crafts asked for.")
