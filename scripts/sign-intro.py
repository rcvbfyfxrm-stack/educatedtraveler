#!/usr/bin/env python3
"""Move a drafted place intro into the published ones, under a person's name.

Same arrangement as the Measure, for the same reason: I draft, you sign.

A drafted intro lives in data/atlas-intro-drafts.json, which THE BUILD NEVER READS.
It cannot reach the site by accident, it cannot be picked up by a rebuild, and it
cannot be signed by a script — the checker name is supplied here, by the person whose
name it is, one place at a time. The build refuses an intro with no checker, so an
unsigned paragraph is not merely unpublished, it is unpublishable.

That matters more here than it looks. A Measure is a judgement and obviously wants a
signature. An intro reads like description, which is exactly why it needs one: it is
the only prose on this map allowed to introduce facts the craft record does not hold.

    python3 scripts/sign-intro.py --list
    python3 scripts/sign-intro.py <destination-id> --as "Arnaud Callier"
    python3 scripts/sign-intro.py <destination-id> --as "Arnaud Callier" --date 2026-09-13
    python3 scripts/sign-intro.py <destination-id> --reject      # throw the draft away

Read the draft first. Signing only moves the object and stamps the name and the day;
everything it asserts was written beforehand and is yours to disagree with before you
run this.
"""
import argparse
import datetime as dt
import json
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRAFTS = ROOT / "data/atlas-intro-drafts.json"
MANIFEST = ROOT / "data/atlas-extra-sheets.json"


def load(p, default):
    return json.loads(p.read_text()) if p.exists() else default


def save(p, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


def show(did, p):
    words = len(str(p.get("text", "")).split())
    print(f"\n  {did}  —  {words} words, {len(p.get('sources') or [])} sources")
    for line in textwrap.wrap(str(p.get("text", "")), 92):
        print(f"    {line}")
    print()
    for s in p.get("sources") or []:
        print(f"    · {s.get('url','')}")
        print(f"      says: {s.get('what','')}")
        print(f"      read: {s.get('read','')}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dest", nargs="?")
    ap.add_argument("--as", dest="who")
    ap.add_argument("--date")
    ap.add_argument("--reject", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    drafts = load(DRAFTS, {"drafts": {}}).get("drafts", {})
    manifest = load(MANIFEST, {})
    live = manifest.setdefault("placeIntros", {})

    if a.list or not a.dest:
        if not drafts:
            print("No drafted place intros waiting.")
            return 0
        print(f"{len(drafts)} drafted place intro(s) waiting for a signature:")
        for did in sorted(drafts):
            show(did, drafts[did])
        print('\nSign one with:  python3 scripts/sign-intro.py <destination-id> --as "Your Name"')
        return 0

    if a.dest not in drafts:
        print(f"No draft for {a.dest!r}. Waiting: {', '.join(sorted(drafts)) or 'none'}")
        return 1

    if a.reject:
        drafts.pop(a.dest)
        save(DRAFTS, {"drafts": drafts})
        print(f"Draft for {a.dest} thrown away. Nothing was published.")
        return 0

    if not a.who:
        show(a.dest, drafts[a.dest])
        print('\nRead it, then sign:  --as "Your Name"   (or --reject)')
        return 1

    p = dict(drafts.pop(a.dest))
    p["checker"] = a.who
    p["date"] = a.date or dt.date.today().strftime("%-d %B %Y")
    if a.dest in live:
        print(f"note: {a.dest} already had a published intro; it is being replaced.")
    live[a.dest] = p
    save(MANIFEST, manifest)
    save(DRAFTS, {"drafts": drafts})
    print(f"Signed {a.dest} as {p['checker']} · {p['date']}.")
    print("Now run:  python3 scripts/build-atlas-pages.py")
    print(f"{len(drafts)} draft(s) still waiting.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
