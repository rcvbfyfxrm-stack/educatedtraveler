#!/usr/bin/env python3
"""Put the "Close to this on the map" block on the hand-written craft sheets.

build-atlas-pages.py adds that block to every craft page it generates, but the nine
hand-written sheets in data/atlas-extra-sheets.json's `preserve` list are — correctly —
never regenerated, so they would be the only craft pages on the Atlas without
neighbours. They are also the deepest sheets and the ones people actually land on.

This is a one-time, re-runnable injector: the block is wrapped in an et:related-crafts
marker, so running it again replaces the block rather than stacking a second one.
It reads the same curated `craftFamilies` the generator reads, so the two agree.

Styling is written against the design tokens the sheets already define (--line,
--ink2, --sea, --muted) so it inherits each sheet's own palette rather than imposing
one; the only classes used are `wrap`, `eyebrow` and `serif`, which all nine carry.

  python3 scripts/inject-related-handwritten.py [--dry]
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "atlas"
DRY = "--dry" in sys.argv
OPEN_MARK, CLOSE_MARK = "<!-- et:related-crafts -->", "<!-- /et:related-crafts -->"
e = html.escape

MANIFEST = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text())
FAMILIES = MANIFEST.get("craftFamilies", {})
HUB_CARDS = MANIFEST.get("hubCards", [])
PRESERVE = set(MANIFEST["preserve"])
PINNED = set(MANIFEST.get("pinnedOpen", []))

src = (ROOT / "data/repertoire.js").read_text()
DISC = json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1])["disciplines"]
UNLOCK = json.loads((ROOT / "data/atlas-unlocked.json").read_text()).get("open") or {}
OPEN = set(UNLOCK) | PINNED

META = {}
for d in DISC:
    top = max(d["destinations"], key=lambda x: x["communityRank"], default=None) or {}
    META[d["id"]] = {"name": d["discipline"], "place": top.get("place", ""),
                     "country": top.get("country", ""), "rank": top.get("communityRank", 0)}
for h in HUB_CARDS:
    META[h["id"]] = {"name": h["discipline"], "place": h.get("place", ""),
                     "country": h.get("country", ""), "rank": h.get("communityRank", 0)}


def related(craft_id, n=4):
    pools = []
    for label, ids in FAMILIES.items():
        if craft_id not in ids:
            continue
        sibs = [c for c in ids if c != craft_id and c in META]
        sibs.sort(key=lambda c: (0 if c in OPEN else 1, -META[c]["rank"], META[c]["name"]))
        if sibs:
            pools.append([label, sibs])
    out, seen = [], {craft_id}
    while pools and len(out) < n:
        for pool in list(pools):
            label, sibs = pool
            while sibs and sibs[0] in seen:
                sibs.pop(0)
            if not sibs:
                pools.remove(pool)
                continue
            c = sibs.pop(0)
            seen.add(c)
            out.append((c, label))
            if len(out) >= n:
                break
    return out


def block(craft_id):
    rel = related(craft_id)
    if not rel:
        return ""
    cards = []
    for c, label in rel:
        m = META[c]
        bits = [e(label)]
        if m["place"]:
            bits.append(f'{e(m["place"])}, {e(m["country"])}')
        if c not in OPEN:
            bits.append('<span style="opacity:.7">not open yet</span>')
        cards.append(
            '<div style="background:var(--ink2);border:1px solid var(--line);border-radius:10px;'
            'padding:14px 18px">'
            f'<a href="/atlas/{c}" style="text-decoration:none;color:inherit;font-family:\'Fraunces\','
            f'Georgia,serif;font-size:17px">{e(m["name"])}</a>'
            f'<div style="font-size:13px;color:var(--muted);margin-top:4px">{" · ".join(bits)}</div>'
            "</div>")
    return (f'{OPEN_MARK}\n<section><div class="wrap">'
            '<div class="eyebrow">If this one pulls you</div>'
            '<h2 class="serif">Close to this on the map</h2>'
            '<p style="font-size:13px;color:var(--muted);margin:6px 0 14px">Grouped by hand, not by '
            'an algorithm — same hands, same instinct, a different craft.</p>'
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));'
            f'gap:12px">{"".join(cards)}</div>'
            f'</div></section>\n{CLOSE_MARK}\n')


# The craft sheets in `preserve` — the redirect stubs and place pages are not craft pages.
sheets = sorted(s for s in PRESERVE
                if s.endswith(".html") and "--" not in s and s[:-5] in META)
changed, skipped = [], []
for name in sheets:
    p = OUT / name
    if not p.exists():
        skipped.append((name, "file missing"))
        continue
    t = p.read_text()
    new_block = block(name[:-5])
    if not new_block:
        skipped.append((name, "no family"))
        continue

    if OPEN_MARK in t:                       # re-run: replace in place
        t2 = re.sub(re.escape(OPEN_MARK) + r".*?" + re.escape(CLOSE_MARK) + r"\n?",
                    new_block, t, flags=re.S)
    else:
        anchor = '<section class="trust"' if '<section class="trust"' in t else "<footer"
        if anchor not in t:
            skipped.append((name, "no anchor"))
            continue
        i = t.index(anchor)
        t2 = t[:i] + new_block + t[i:]
    if t2 != t:
        if not DRY:
            p.write_text(t2)
        changed.append(name)

print(f"inject-related: {len(changed)} sheet(s) {'would change' if DRY else 'updated'}")
for c in changed:
    print("   ", c, "->", ", ".join(META[x]["name"] for x, _ in related(c[:-5])))
for s, why in skipped:
    print("    SKIP", s, "—", why)
