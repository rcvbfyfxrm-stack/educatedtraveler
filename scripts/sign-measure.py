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

STAGING, and why it exists
--------------------------
The move from five questions to six is one change to one instrument, and it may not
land craft by craft: for as long as half the grades carried a fifth answer opening
"Nobody of ours has been" while the page also asked, separately, whether one of us had
been, the block would have said the same thing twice on some crafts and once on others.
A legend a reader has to relearn between two sheets is not a legend.

But the signing cannot be batched — Arnaud reads them in threes and fours, over days,
and that pace is the point. So --stage puts a signed grade in `measureStaged`, which
the build never reads, and --publish-all moves the whole set into `measure` at once,
refusing while a single published craft is still unstaged. The signature and the day
are stamped at --stage, when the reading happened; publishing moves the object and
nothing else.

    python3 scripts/sign-measure.py <craft-id> --as "Arnaud Callier" --stage
    python3 scripts/sign-measure.py --staged        # what is waiting, and what is missing
    python3 scripts/sign-measure.py --publish-all   # all of it, in one commit

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
    print(f"\n  {craft}  —  {on} of 5")
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
    ap.add_argument("--stage", action="store_true",
                    help="sign into measureStaged instead of publishing")
    ap.add_argument("--staged", action="store_true", help="what is staged, and what is missing")
    ap.add_argument("--publish-all", dest="publish_all", action="store_true",
                    help="move every staged grade into measure at once")
    a = ap.parse_args()

    drafts = load(DRAFTS, {"drafts": {}}).get("drafts", {})
    manifest = load(MANIFEST, {})
    live = manifest.setdefault("measure", {})

    staged = manifest.setdefault("measureStaged", {})

    if a.staged or a.publish_all:
        missing = sorted(set(live) - set(staged))
        extra = sorted(set(staged) - set(live))
        print(f"{len(staged)} grade(s) staged, {len(live)} published.")
        for craft in sorted(staged):
            m = staged[craft]
            print(f"  ✓ {craft:32} {sum(1 for c in m['conditions'] if c.get('on'))} of 5 "
                  f"· {m['checker']} · {m['date']}")
        if missing:
            print(f"\n  still on the old shape, unstaged: {', '.join(missing)}")
        if extra:
            print(f"  staged but not published anywhere yet: {', '.join(extra)}")
        if not a.publish_all:
            return 0
        if not staged:
            print("\nNothing staged. Nothing to publish.")
            return 1
        if missing:
            # The whole reason staging exists. Publishing half of a migration puts two
            # different instruments on one map, and the reader who learns the legend on
            # one sheet meets a different one on the next.
            print(f"\nRefusing: {len(missing)} published grade(s) have not been staged, and "
                  "publishing now would leave the map with two instruments on it.\n"
                  "  Sign the rest with --stage first, or take them out of `measure` on purpose.")
            return 1
        live.update(staged)
        manifest["measureStaged"] = {}
        save(MANIFEST, manifest)
        print(f"\n{len(staged)} grade(s) published. Now run:  "
              "python3 scripts/build-atlas-pages.py")
        return 0

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
    (staged if a.stage else live)[a.craft] = m
    save(MANIFEST, manifest)
    save(DRAFTS, {"drafts": drafts})
    print(f"Signed {a.craft} as {m['checker']} · {m['date']}"
          + (", and STAGED — it is not on the site yet." if a.stage else "."))
    print("Now run:  python3 scripts/sign-measure.py --staged" if a.stage
          else "Now run:  python3 scripts/build-atlas-pages.py")
    print(f"{len(drafts)} draft(s) still waiting.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
