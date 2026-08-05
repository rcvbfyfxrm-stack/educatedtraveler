#!/usr/bin/env python3
"""Generate the daily-drop social calendar from data/repertoire.js.

Step 2 of the 90-day plan (market-benchmark 2026-06-11): ONE locked format,
posted daily to TikTok + Reels + Shorts, every clip pointing at one atlas page.

Output: marketing/daily-drop/calendar-<n>d.md + calendar.json
Selection: highest communityRank first, round-robin across the 4 cores,
one destination per discipline until exhausted (no repeats).

Voice lock: connect/introduce/bridge — never sell/book/enroll.
Banned: transformation, life-changing, vacation, luxury, easy. No prices. No emoji.
"""
import json, sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 30
SITE = "https://educatedtraveler.app"

src = (ROOT / "data/repertoire.js").read_text()
DATA = json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1])

BANNED = re.compile(r"transformation|life-changing|vacation|luxur|\beasy\b", re.I)

HOOKS = {
    "source": "This is where {disc} was born.",
    "both": "{place} is both the birthplace of {disc} and its living capital.",
    "scene": "The strongest {disc} community on earth gathers in {place}.",
}
CORE_TAGS = {
    "wellness": "#breathwork #yogatok #learnbydoing",
    "adventure": "#adventuretravel #skillsnotsouvenirs #learnbydoing",
    "creative": "#crafttok #processvideo #handmade",
    "culinary": "#foodtok #cookingclass #learnbydoing",
}

# Only crafts that are OPEN on the Atlas. A clip has to land on a page with something
# on it: a craft nobody has asked for yet has a short sheet and its place URLs are
# stubs, so scheduling one would send every viewer through a redirect to a page that
# doesn't answer the clip. See marketing/daily-drop/FORMAT-LOCK.md — one clip, one page.
_ul = json.loads((ROOT / "data/atlas-unlocked.json").read_text())
_mf = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text())
OPEN = set(_ul.get("open") or {}) | set(_mf.get("pinnedOpen") or [])
if not OPEN:
    raise SystemExit("build-daily-drop: no open crafts — run scripts/refresh-unlocked.mjs first.")

# pick: round-robin cores, best rank first, one dest per discipline
pools = {}
_skipped = 0
for d in DATA["disciplines"]:
    if d["id"] not in OPEN:
        _skipped += 1
        continue
    best = max(d["destinations"], key=lambda x: (x["communityRank"], x["role"] == "both"))
    pools.setdefault(d["category"], []).append((d, best))
print(f"{_skipped} craft(s) skipped — not open on the Atlas yet")
for c in pools:
    pools[c].sort(key=lambda t: -t[1]["communityRank"])

order, cores = [], list(pools)
i = 0
while len(order) < DAYS and any(pools.values()):
    c = cores[i % len(cores)]; i += 1
    if pools[c]: order.append(pools[c].pop(0))

def clip_target(d, x):
    """Where the clip points. Normally the place page — but two open crafts had their
    single place collapsed into the craft sheet by hand, and pointing a posted caption
    at a redirect wastes the click."""
    page = ROOT / "website/atlas" / f'{x["id"]}.html'
    if page.exists() and 'http-equiv="refresh"' in page.read_text(errors="ignore"):
        return f'/atlas/{d["id"]}'
    return f'/atlas/{x["id"]}'


entries = []
for day, (d, x) in enumerate(order, 1):
    target = SITE + clip_target(d, x)
    hook = HOOKS[x["role"]].format(disc=d["discipline"], place=x["place"])
    school = (x.get("schoolsInfo") or [{}])[0]
    cap = (f"{hook}\n\n{x['why']}\n\n"
           f"Community strength: {x['communityLabel']}. Season: {x['bestSeason']}.\n"
           f"We map where every craft is truly alive — and introduce you to the school and the people going.\n"
           f"The full page: {target}\n\n"
           f"{CORE_TAGS[d['category']]} #{re.sub(r'[^a-z]', '', x['place'].lower())} #{re.sub(r'[^a-z]', '', d['discipline'].lower())[:24]}")
    assert not BANNED.search(cap), f"banned word in day {day}"
    entries.append({
        "day": day, "core": d["category"], "discipline": d["discipline"],
        "place": f'{x["place"]}, {x["country"]}', "atlasUrl": target,
        "clipBrief": f"30-60s wordless process: hands + material of {d['discipline']}, "
                     f"cut to the most tactile seconds, END on the finished object / the moment of competence. "
                     f"Ambient sound only. No talking, no text walls; one caption card max.",
        "footageSource": school.get("name", (x["schools"] or ["—"])[0]),
        "footageUrl": school.get("url", ""),
        "caption": cap,
    })

out = ROOT / "marketing/daily-drop"
out.mkdir(parents=True, exist_ok=True)
(out / "calendar.json").write_text(json.dumps(entries, indent=2, ensure_ascii=False))

md = [f"# Daily Drop — {DAYS}-day calendar", "",
      "One clip a day. Same format every day. Every clip points at one atlas page.", ""]
for e in entries:
    md += [f"## Day {e['day']} — {e['discipline']} · {e['place']}  `[{e['core']}]`",
           f"- **Atlas page:** {e['atlasUrl']}",
           f"- **Footage:** {e['footageSource']}" + (f" — {e['footageUrl']}" if e['footageUrl'] else "") + " (licensed/reposted with credit — see OUTREACH.md)",
           f"- **Clip:** {e['clipBrief']}",
           "- **Caption:**", "", "```", e["caption"], "```", ""]
(out / f"calendar-{DAYS}d.md").write_text("\n".join(md))

# The Studio reads a copy of this that used to be transcribed by hand, so it drifted:
# it still held closed crafts, complete with the school, its enrolment URL and the
# `why` prose — publicly fetchable at /js/studio-calendar.js, which made the short
# sheets' "sitting in my files" untrue. Written from the same data now, every build.
(ROOT / "website/js/studio-calendar.js").write_text(
    "/* Auto-generated from marketing/daily-drop/calendar.json by scripts/build-daily-drop.py.\n"
    "   Do NOT hand-edit: it is served publicly, so a stale copy leaks research for crafts\n"
    "   that are no longer open on the Atlas. Re-run the script instead. */\n"
    "window.ET_DAILY_DROP = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n")

print(f"{len(entries)} days -> {out}/calendar-{DAYS}d.md + calendar.json + website/js/studio-calendar.js")
print("cores:", {c: sum(1 for e in entries if e['core'] == c) for c in pools})
