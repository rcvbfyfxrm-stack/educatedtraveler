#!/usr/bin/env python3
"""Move a drafted Measure into the published one, under a person's name.

Arnaud, 2026-09-01, asked for every open craft to carry a Measure, and chose the
slower half of the only honest way to do it: "I draft, you sign."

So a drafted grade lives in data/atlas-measure-drafts.json, which the BUILD NEVER
READS. It cannot reach the site by accident, it cannot be picked up by a rebuild, and
it cannot be signed by a script — the checker name is supplied here, by the person
whose name it is, one craft at a time. That is the whole point: a grade is a
judgement, and an unsigned judgement published in a house voice is the thing rule 10
was written to forbid.

    python3 scripts/sign-measure.py --list
    python3 scripts/sign-measure.py <craft-id> --as "Arnaud Callier"
    python3 scripts/sign-measure.py <craft-id> --as "Arnaud Callier" --date 2026-09-02
    python3 scripts/sign-measure.py <craft-id> --reject      # throw the draft away

Signing only moves the object and stamps the name and the day. Everything it asserts
was written and researched beforehand, and is yours to disagree with before you run it
— read the draft first; that is what the reading is for.
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRAFTS = ROOT / "data/atlas-measure-drafts.json"
MANIFEST = ROOT / "data/atlas-extra-sheets.json"


def load(p, default):
    return json.loads(p.read_text()) if p.exists() else default


def save(p, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


def show(craft, m):
    on = sum(1 for c in m["conditions"] if c.get("on"))
    print(f"\n  {craft}  —  {on} of 5, ceiling {m.get('ceiling', '?')}")
    print(f"  verdict : {m['verdict']}")
    print(f"  state   : {m['state']}")
    for c in m["conditions"]:
        print(f"    {'●' if c.get('on') else '○'} {c['n']}: {c['t'][:120]}")
    if m.get("ceilingNote"):
        print(f"  ceiling : {m['ceilingNote']}")
    print(f"  basis   : {m.get('check', '')[:200]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("craft", nargs="?")
    ap.add_argument("--as", dest="who")
    ap.add_argument("--date")
    ap.add_argument("--reject", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    drafts = load(DRAFTS, {"drafts": {}}).get("drafts", {})
    manifest = load(MANIFEST, {})
    live = manifest.setdefault("measure", {})

    if a.list or not a.craft:
        if not drafts:
            print("No drafted Measures waiting.")
            return 0
        print(f"{len(drafts)} drafted Measure(s) waiting for a signature:")
        for craft in sorted(drafts):
            show(craft, drafts[craft])
        print('\nSign one with:  python3 scripts/sign-measure.py <craft> --as "Your Name"')
        return 0

    if a.craft not in drafts:
        print(f"No draft for {a.craft!r}. Waiting: {', '.join(sorted(drafts)) or 'none'}")
        return 1

    if a.reject:
        drafts.pop(a.craft)
        save(DRAFTS, {"drafts": drafts})
        print(f"Draft for {a.craft} thrown away. Nothing was published.")
        return 0

    if not a.who:
        show(a.craft, drafts[a.craft])
        print('\nRead it, then sign:  --as "Your Name"   (or --reject)')
        return 1

    m = dict(drafts.pop(a.craft))
    m["checker"] = a.who
    m["date"] = a.date or dt.date.today().strftime("%-d %B %Y")
    if a.craft in live:
        print(f"note: {a.craft} already had a published Measure; it is being replaced.")
    live[a.craft] = m
    save(MANIFEST, manifest)
    save(DRAFTS, {"drafts": drafts})
    print(f"Signed {a.craft} as {m['checker']} · {m['date']}.")
    print("Now run:  python3 scripts/build-atlas-pages.py")
    print(f"{len(drafts)} draft(s) still waiting.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
