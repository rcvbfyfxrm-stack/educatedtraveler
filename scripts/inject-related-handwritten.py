#!/usr/bin/env python3
"""Put the generator's shared blocks on the hand-written craft sheets.

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

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_hub

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "atlas"
DRY = "--dry" in sys.argv
OPEN_MARK, CLOSE_MARK = "<!-- et:related-crafts -->", "<!-- /et:related-crafts -->"
SWEEP_OPEN, SWEEP_CLOSE = "<!-- et:sweep -->", "<!-- /et:sweep -->"
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
        place = f'{e(m["place"])}, {e(m["country"])}' if (m["place"] and c in OPEN) else ""
        state = "<b>open</b> &middot; where to learn it" if c in OPEN else "not open yet"
        cards.append(atlas_hub.rail_cards(
            [(f"/atlas/{c}", e(label), e(m["name"]), place, state)]))
    nav = ('<div class="crail-nav"><button data-cr="prev" aria-label="Previous">&#8249;</button>'
           '<button data-cr="next" aria-label="Next">&#8250;</button></div>') if len(cards) > 2 else ""
    return (f'{OPEN_MARK}\n<style>{atlas_hub.RAIL_CSS}</style>'
            '<section><div class="wrap"><div class="crail-wrap">'
            '<div class="crail-head"><div><div class="eyebrow">If this one pulls you</div>'
            '<h2 class="serif" style="margin:6px 0 0">Close to this on the map</h2></div>'
            f'{nav}</div>'
            '<p style="font-size:13px;color:var(--muted);margin:6px 0 14px">Grouped by hand, not by '
            'an algorithm — same hands, same instinct, a different craft. Drag, or use the arrows.</p>'
            f'<div class="crail">{"".join(cards)}</div>'
            f'</div></div></section><script>{atlas_hub.RAIL_JS}</script>\n{CLOSE_MARK}\n')


DISC_BY_ID = {d["id"]: d for d in DISC}


def sweep_block(craft_id):
    """"Checked and not listed", for a preserved sheet.

    The lesson this file was written to record, applied to itself: every time the
    generator grows a convention, ask what it does to the hand-written sheets, because
    they are invisible to it BY DESIGN and they are the deepest pages on the Atlas. The
    worldwide sweep is the newest such convention, and the craft with the most thorough
    sweep on the map — New culinary techniques & technologies — is a preserved sheet.
    Without this, the one page that most needed to publish what it turned down would
    have been the only page that could not.
    """
    d = DISC_BY_ID.get(craft_id)
    sw = (d or {}).get("sweep")
    if not sw:
        return ""
    rows = ""
    for r in sw.get("rejected") or []:
        nm = e(r["name"])
        if r.get("url"):
            nm = (f'<a href="{e(r["url"])}" target="_blank" rel="nofollow noopener" '
                  f'style="color:var(--sea);text-decoration:none">{nm} \u2197</a>')
        where = (f' <span style="color:var(--muted);font-size:13px">{e(r["place"])}</span>'
                 if r.get("place") else "")
        rows += ('<li style="padding:10px 0;border-bottom:1px solid var(--line)">'
                 f'<strong style="font-weight:500">{nm}</strong>{where}'
                 f'<div style="font-size:14px;color:var(--muted);margin-top:4px">{e(r["why"])}</div></li>')
    bounded = atlas_hub.sweep_bounded(sw)
    scope = (f'Searched on {e(sw["date"])}. {e(bounded)}' if bounded else
             f'Searched in {len(sw.get("regions") or [])} of {len(atlas_hub.SWEEP_REGIONS)} '
             f'regions of the world, on {e(sw["date"])}.')
    gaps = atlas_hub.sweep_gaps(sw)
    gap = (f'<p style="font-size:13px;color:var(--muted);margin-top:12px">Not searched yet: '
           f'{e(", ".join(gaps))}. If you know this craft in one of those, write and say so — '
           'that is how the next sweep gets pointed.</p>') if gaps else ""
    nrej = len(sw.get("rejected") or [])
    return (f'{SWEEP_OPEN}\n<section><div class="wrap"><details class="fold"><summary>'
            '<span class="eyebrow" style="display:block">Checked and not listed</span>'
            f'<h2 class="serif" style="margin:6px 0 0">What did not clear'
            f'<span style="opacity:.45;font-weight:300"> &middot; {nrej}</span></h2>'
            '</summary><div class="foldbody">'
            f'<p style="font-size:13px;color:var(--muted);margin:6px 0 14px;max-width:62ch">{scope} '
            'Everything below is real, and none of it is on this map. The reason sits next to each '
            'one, because a place left off without a reason is just an opinion.</p>'
            f'<ul style="list-style:none;padding:0;margin:0">{rows}</ul>{gap}'
            f'</div></details></div></section>\n{SWEEP_CLOSE}\n')


# The craft sheets in `preserve` — the redirect stubs and place pages are not craft pages.
sheets = sorted(s for s in PRESERVE
                if s.endswith(".html") and "--" not in s and s[:-5] in META)
changed, skipped = [], []
for name in sheets:
    p = OUT / name
    if not p.exists():
        skipped.append((name, "file missing"))
        continue
    t = t2 = p.read_text()
    new_block = block(name[:-5])
    if not new_block:
        skipped.append((name, "no family"))
        continue

    for om, cm, blk in ((OPEN_MARK, CLOSE_MARK, new_block),
                        (SWEEP_OPEN, SWEEP_CLOSE, sweep_block(name[:-5]))):
        if not blk:
            continue
        if om in t2:                         # re-run: replace in place
            t2 = re.sub(re.escape(om) + r".*?" + re.escape(cm) + r"\n?", blk, t2, flags=re.S)
            continue
        anchor = '<section class="trust"' if '<section class="trust"' in t2 else "<footer"
        if anchor not in t2:
            skipped.append((name, "no anchor"))
            continue
        i = t2.index(anchor)
        t2 = t2[:i] + blk + t2[i:]
    if t2 != t:
        if not DRY:
            p.write_text(t2)
        changed.append(name)

print(f"inject-related: {len(changed)} sheet(s) {'would change' if DRY else 'updated'}")
for c in changed:
    print("   ", c, "->", ", ".join(META[x]["name"] for x, _ in related(c[:-5])))
for s, why in skipped:
    print("    SKIP", s, "—", why)
