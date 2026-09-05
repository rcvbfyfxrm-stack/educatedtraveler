#!/usr/bin/env python3
"""Build the Atlas — every craft listed, the asked-for ones open, the rest short.

/atlas/ is the one place you browse. Every craft has a page. A craft is OPEN when
somebody in the Circle asked for it (data/atlas-unlocked.json, written by
scripts/refresh-unlocked.mjs): the full sheet, every place, every school. A craft
nobody has asked for yet gets a SHORT sheet — what the craft is, where it is most
alive, and a box to write Arnaud a note. The research is not on that page and
not in the page source: the branch happens here, at build time, so the short sheet
is genuinely short rather than a full page with something hidden over it.

Emits:
  website/atlas/index.html            — the browse home (all crafts, open + short)
  website/atlas/<craft>.html          — one per craft: full sheet, or short sheet
  website/atlas/<craft>--<place>.html — one per place of an OPEN craft;
                                        a short craft's places become noindex
                                        stubs back to the craft, so no URL breaks
  website/js/atlas-index.js           — the thin card data the browse home reads
  website/sitemap.xml, website/robots.txt

Reads data/repertoire.js and data/atlas-ratings.js. Those live OUTSIDE website/ on
purpose: repertoire.js is 1.2 MB of every school, master, price and URL we hold, and
a locked page means nothing if anyone can fetch the research directly.

Prices (2026-06-19 owner override): an open sheet shows a verified, cited price-START
for the best course + cheaper/shorter "Other ways in". Still no on-site booking; every
CTA -> the Circle. Prices are research-verified or "price on request" — never fabricated.

Files listed in data/atlas-extra-sheets.json are NEVER deleted or overwritten — the
hand-written sheets and the redirect stubs that keep already-shared URLs alive.

  python3 scripts/build-atlas-pages.py [--assume-all-open]

--assume-all-open builds every craft full, ignoring the unlock file. It exists so a
regen can be diffed against the live site to prove the fold-in is faithful; never
commit its output.
"""
import datetime as _dt
import json, html, re, sys
from urllib.parse import quote as _q
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_hub

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://educatedtraveler.app"
OUT = ROOT / "website" / "atlas"
ASSUME_ALL_OPEN = "--assume-all-open" in sys.argv

# Privacy-light, cookieless analytics (no consent banner needed). Keep in sync with the
# hand-built pages — see scripts/add-analytics.py.
ANALYTICS = '<script defer data-domain="educatedtraveler.app" src="https://plausible.io/js/script.js"></script>'

src = (ROOT / "data/repertoire.js").read_text()
DATA = json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1])
DISC = DATA["disciplines"]

# A duplicate key in JSON is not an error — the last one silently wins. Four rewritten
# blurbs sat in this file, and in git, and on nobody's screen, because an older `blurb`
# followed them in the same object. Nothing failed. Nothing looked wrong. The only
# symptom was a page that did not say what the file said.
#
# So the file is parsed a second time, refusing duplicates. This is the cheapest gate
# on the project and it guards the most expensive failure mode there is: work that is
# committed, reported as done, and not there.
_dups = []
def _no_dup_keys(pairs):
    seen = {}
    for k, v in pairs:
        if k in seen:
            _dups.append((k, str(seen.get("name") or seen.get("id") or "")[:60]))
        seen[k] = v
    return seen


json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1],
           object_pairs_hook=_no_dup_keys)
if _dups:
    raise SystemExit(
        "build-atlas-pages: data/repertoire.js has duplicate keys. JSON keeps the LAST one "
        "silently, so the other is invisible work:\n  "
        + "\n  ".join(f"{k!r} in {ctx!r}" for k, ctx in _dups))

# ---------- which crafts are open ----------
# The build must never quietly decide that nothing is open. That would publish 112
# short sheets — a site that looks finished and is empty — and delete the real
# research from the working tree in a single commit. Missing or empty file = stop.
MANIFEST = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text())
PRESERVE = set(MANIFEST["preserve"])
PINNED_OPEN = set(MANIFEST.get("pinnedOpen", []))
HUB_CARDS = MANIFEST.get("hubCards", [])

UNLOCK_PATH = ROOT / "data/atlas-unlocked.json"
if not UNLOCK_PATH.exists():
    raise SystemExit("build-atlas-pages: data/atlas-unlocked.json is missing.\n"
                     "  Run `node scripts/refresh-unlocked.mjs` first. Refusing to build:\n"
                     "  assuming nothing is open would close every craft on the site.")
_unlock = json.loads(UNLOCK_PATH.read_text())
HANDS = _unlock.get("open") or {}
if not HANDS:
    raise SystemExit("build-atlas-pages: data/atlas-unlocked.json has no open crafts.\n"
                     "  That is a bad refresh, not an answer. Refusing to build.")

# A hand-written sheet is pinned open: it already carries the full research, so
# printing "not open yet" on it would be a lie on the page itself.
OPEN = set(HANDS) | PINNED_OPEN
UNLOCK_DATE = _unlock.get("generated_at", "")
# The hand-written sheets that are crafts in their own right (not redirect stubs),
# so the craft count includes them.
PRESERVE_SHEET_SLUGS = {s for s in PINNED_OPEN if f"{s}.html" in PRESERVE
                        and not any(d["id"] == s for d in DISC)}


def is_open(disc_id):
    return True if ASSUME_ALL_OPEN else disc_id in OPEN


# ---------- crafts close to this one ----------
# Somebody who opens one craft is rarely after only that craft, so every craft page
# ends with a few neighbours. The grouping is CURATED, in data/atlas-extra-sheets.json,
# and it is curated on purpose: a scored-similarity pass over name/blurb/world/country
# was tried first and paired Muay Thai with Thai MASSAGE on the word "Thai", and
# Self-Sufficiency with Watchmaking on the word "creative". A wrong neighbour is not a
# false claim, but it reads as a machine talking, and nothing on the Atlas may.
CRAFT_FAMILIES = MANIFEST.get("craftFamilies", {})
CRAFT_META = {}
for _d in DISC:
    _top = max(_d["destinations"], key=lambda x: x["communityRank"], default=None) or {}
    CRAFT_META[_d["id"]] = {"name": _d["discipline"], "place": _top.get("place", ""),
                            "country": _top.get("country", ""),
                            "rank": _top.get("communityRank", 0)}
for _h in HUB_CARDS:                        # crafts that live only as a hand-written sheet
    CRAFT_META[_h["id"]] = {"name": _h["discipline"], "place": _h.get("place", ""),
                            "country": _h.get("country", ""),
                            "rank": _h.get("communityRank", 0)}

_named = {c for ids in CRAFT_FAMILIES.values() for c in ids}
if _named - set(CRAFT_META):
    raise SystemExit("build-atlas-pages: craftFamilies names crafts that do not exist: "
                     + ", ".join(sorted(_named - set(CRAFT_META))))
# A craft with no family gets no neighbours and quietly loses the block. Adding a craft
# and forgetting to place it is exactly the kind of miss that ships unnoticed.
if CRAFT_FAMILIES and set(CRAFT_META) - _named:
    raise SystemExit("build-atlas-pages: these crafts are in no family, so they would have "
                     "no neighbours — add them to craftFamilies in data/atlas-extra-sheets.json:\n  "
                     + ", ".join(sorted(set(CRAFT_META) - _named)))


# ---------- the immersive line on a place card ----------
# "Learn to work a one-way glass hide, where the technique was invented." — the line
# that makes a card worth reading rather than scanning (Arnaud, 2026-08-26: "things
# like that that make it more immersive just to read it").
#
# CURATED, in data/atlas-extra-sheets.json -> learnLines, keyed by DESTINATION id, for
# the same reason craftFamilies is curated: the obvious build was to compose it from
# the craft blurb plus the destination's `why`, and every version of that reads as a
# machine talking. Worse, compressing a researched sentence is where a claim quietly
# changes — "the most photographed big-cat ground on earth" is not "where the most big
# cats are", and only one of those is true. Each line here is written by hand against
# the `why` it sits above, and says nothing that sentence does not already say.
#
# NOT a hard failure when one is missing, deliberately: a craft opens the moment
# somebody asks for it, unattended, and a refusal here would take the whole nightly
# Atlas build down on the night that happened. A place with no line simply shows none.
# Checks signed by people who actually went, written by scripts/refresh-vouches.mjs
# out of the approved rows in Supabase. Merged onto the destination so the whole
# rule-10 machinery (check_line, _evidence_cap) picks them up unchanged.
# A `check` hand-written in repertoire.js WINS: that is Arnaud's own visit, and a
# member's vouch never overwrites the house's own check of the same room.
_VOUCH_PATH = ROOT / "data/atlas-vouches.json"
VOUCHES_SIGNED = json.loads(_VOUCH_PATH.read_text()) if _VOUCH_PATH.exists() else {}
_applied = 0
for _d in DISC:
    for _x in _d["destinations"]:
        _v = VOUCHES_SIGNED.get(_x["id"])
        if _v and not _x.get("check"):
            _x["check"] = _v
            _applied += 1
if VOUCHES_SIGNED:
    print(f"  {_applied} place(s) carry a check signed by somebody who went")

MEASURE = MANIFEST.get("measure", {})
MEASURE_CAPS = MANIFEST.get("measureCaps", {})
_craft_ids = {d["id"] for d in DISC}
_stray_m = set(MEASURE) - _craft_ids
if _stray_m:
    raise SystemExit("build-atlas-pages: measure names crafts that do not exist: "
                     + ", ".join(sorted(_stray_m)))

LEARN_LINES = MANIFEST.get("learnLines", {})
_dest_ids = {x["id"] for d in DISC for x in d["destinations"]}
_stray = set(LEARN_LINES) - _dest_ids
if _stray:
    raise SystemExit("build-atlas-pages: learnLines names destinations that do not exist: "
                     + ", ".join(sorted(_stray)))

# ── the ladder, and what one course covers of it ──────────────────────────
# The ladder belongs to a body that publishes it, and the coverage belongs to a school
# that publishes its own syllabus. Neither is ours, so both are refused unless they say
# whose they are and where they were read. See atlas_hub.ladder_html for the doctrine.
SKILL_LADDERS = MANIFEST.get("skillLadders", {})
COURSE_COVERAGE = MANIFEST.get("courseCoverage", {})

_stray_l = set(SKILL_LADDERS) - _craft_ids
if _stray_l:
    raise SystemExit("build-atlas-pages: skillLadders names crafts that do not exist: "
                     + ", ".join(sorted(_stray_l)))

for _cid, _lad in SKILL_LADDERS.items():
    _miss = [k for k in ("standard", "body", "url", "read", "rungs") if not _lad.get(k)]
    if _miss:
        raise SystemExit(
            f"build-atlas-pages: the ladder on {_cid} is missing {_miss}.\n"
            "  A ladder is somebody else's published standard, adopted: it ships with the "
            "body's name, the page it was read on, and the day.\n"
            "  If no body publishes one for this craft, it gets no ladder — an invented "
            "rung is this map awarding itself an authority it does not have.")
    for _r in _lad["rungs"]:
        if not (_r.get("id") and _r.get("name") and _r.get("skills")):
            raise SystemExit(f"build-atlas-pages: a rung on {_cid}'s ladder is missing id, "
                             "name or skills. A rung with no skills under it is a label, and "
                             "the skills are the whole point: they say what the rung means.")
    _ids = [r["id"] for r in _lad["rungs"]]
    if len(_ids) != len(set(_ids)):
        _dupe = sorted({i for i in _ids if _ids.count(i) > 1})
        raise SystemExit(f"build-atlas-pages: the ladder on {_cid} repeats rung id(s) "
                         f"{_dupe}. Coverage is keyed on the id, so a repeat silently ticks "
                         "two rungs at once.")

_stray_c = set(COURSE_COVERAGE) - _craft_ids
if _stray_c:
    raise SystemExit("build-atlas-pages: courseCoverage names crafts that do not exist: "
                     + ", ".join(sorted(_stray_c)))

for _cid, _places in COURSE_COVERAGE.items():
    _d = next(d for d in DISC if d["id"] == _cid)
    if _cid not in SKILL_LADDERS:
        raise SystemExit(f"build-atlas-pages: courseCoverage on {_cid} has no ladder to tick "
                         "against. Coverage is a reading of somebody's standard, so the "
                         "standard comes first.")
    _known = {r["id"] for r in SKILL_LADDERS[_cid]["rungs"]}
    _real_places = {x["place"]: x for x in _d["destinations"]}
    for _place, _schools in _places.items():
        if _place not in _real_places:
            raise SystemExit(f"build-atlas-pages: courseCoverage on {_cid} names the place "
                             f"{_place!r}, which is not on this craft. Places here: "
                             + ", ".join(sorted(_real_places)))
        _names = {s["name"] for s in _real_places[_place].get("schoolsInfo") or []}
        for _school, _cov in _schools.items():
            if _school not in _names:
                raise SystemExit(f"build-atlas-pages: courseCoverage on {_cid}/{_place} names "
                                 f"the school {_school!r}, which is not listed there. "
                                 "Schools here: " + ", ".join(sorted(_names)))
            if not (_cov.get("url") and _cov.get("read")):
                raise SystemExit(f"build-atlas-pages: coverage for {_school} ({_cid}/{_place}) "
                                 "needs the url it was read on and the day it was read.")
            for _c in _cov.get("covers", []):
                if _c["id"] not in _known:
                    raise SystemExit(f"build-atlas-pages: coverage for {_school} ticks "
                                     f"{_c['id']!r}, which is not on {_cid}'s ladder.")
                # The tick is not our sentence — it is theirs, and night-check.py re-reads
                # it. A tick nobody is watching is a claim nobody can catch going stale,
                # which is the exact rot this map exists to chase.
                if not _c.get("verify"):
                    raise SystemExit(
                        f"build-atlas-pages: coverage for {_school} ticks {_c['id']!r} with "
                        "no `verify` string. Every tick carries the school's own wording, "
                        "readable on the url above, so the nightly check can watch it.")
            for _m in _cov.get("missing", []):
                if _m["id"] not in _known:
                    raise SystemExit(f"build-atlas-pages: coverage for {_school} marks "
                                     f"{_m['id']!r} missing, which is not on {_cid}'s ladder.")
                if _m.get("why") not in atlas_hub.LADDER_WHY:
                    raise SystemExit(
                        f"build-atlas-pages: coverage for {_school} gives {_m['id']!r} the "
                        f"reason {_m.get('why')!r}. An empty circle always says which it is: "
                        + ", ".join(sorted(atlas_hub.LADDER_WHY)))
            # Every rung is accounted for, or the checklist is telling half a story: a
            # course that quietly drops the rungs it does not reach reads as if the ladder
            # ended where the course did. Same law as the Measure's — the number and the
            # legend have to be the same statement.
            _said = [c["id"] for c in _cov.get("covers", [])] + \
                    [m["id"] for m in _cov.get("missing", [])]
            if sorted(_said) != sorted(_known) or len(_said) != len(set(_said)):
                raise SystemExit(
                    f"build-atlas-pages: coverage for {_school} ({_cid}/{_place}) accounts for "
                    f"{len(set(_said))} rung(s) and the ladder has {len(_known)}.\n"
                    f"  Missing from the list: {sorted(set(_known) - set(_said)) or 'none'}\n"
                    "  Every rung is ticked or given a reason. A rung left out reads as though "
                    "the ladder stopped where the course did.")


# ---------- the first line a card says ----------
# "Learn to photograph big cats" — the card's own title, sitting straight above "in
# Maasai Mara Conservancies, Kenya" (Arnaud, 2026-08-31: "always show what you will
# learn and where... then the specificity of each place, straight simple, clear to
# the point").
#
# At rest a card names the craft: "Learn Wildlife Photography in Pusztaszer, Hungary".
# While it walks its places, the say line takes that slot and the craft's name gives
# way to what you would actually be doing in THAT one. So this is the biggest words on
# the card, which is exactly why it is CURATED and not composed: the same rule as
# LEARN_LINES above, held harder. A say line may say nothing its own `why` does not
# already say, and it is gated by the same learn_line_drift().
#
# It never carries the place — the card prints that on the next line and would say it
# twice. Missing is fine, and is the state 111 of the 116 crafts are in: the card goes
# on naming the craft, which is what it said before any of this existed.
SAY_LINES = MANIFEST.get("sayLines", {})
_stray_say = set(SAY_LINES) - _dest_ids
if _stray_say:
    raise SystemExit("build-atlas-pages: sayLines names destinations that do not exist: "
                     + ", ".join(sorted(_stray_say)))


# ---------- the closed cell: on the record, not a place to learn ----------
# The Standard asks two questions of every place — is the craft alive there, and can a
# serious stranger get in — and the CLOSED cell (alive, unreachable) is what proves this
# map is a record rather than a shop. Roses / Cala Montjoi is the case that forced the
# flag: elBulli shut in 2011 and the cove now holds elBulli1846, a museum you buy a
# ticket for. The page still said "Learn Modernist Spanish Cuisine in Roses", starred it
# "Best place to go", promised "who teaches", and filed a Basque Culinary Center course
# 450 km away under "Schools in Roses". Every one of those was assembled out of true
# parts, and the picture they made was false.
#
# A destination marked closedToLearners keeps its research and loses every verb that
# promises teaching: no "Learn ... in" title, no star, no featured course, no credential,
# no honest-level line, no "the course and what it costs" or "who teaches" on its door.
# In exchange it owes the reader one thing — closedNote, what is actually there and where
# to go instead — and the build refuses to run without it.
def is_closed(x):
    return bool(x.get("closedToLearners"))


for _d in DISC:
    for _x in _d["destinations"]:
        if is_closed(_x) and not (_x.get("closedNote") or "").strip():
            raise SystemExit(f'build-atlas-pages: {_x["id"]} is closedToLearners and needs a '
                             "closedNote — what is actually there, and where to go instead.")
    _fid = (_d.get("featured") or {}).get("id")
    if _fid and any(is_closed(_x) for _x in _d["destinations"] if _x["id"] == _fid):
        raise SystemExit(f'build-atlas-pages: the featured course of {_d["id"]} is filed under '
                         f"{_fid}, which is closedToLearners. A pick has to be somewhere you can go.")

# ---------- saying it when we are not a neutral party ----------
# Rule 9 of the Standard prints the way around EducatedTraveler on the entry itself.
# Where we ALSO have a commercial relationship with a school, that belongs above the
# recommendation, not in a footnote under it. Marking a school etRelationship:true
# without writing the craft's disclosure fails the build, so a conflict cannot ship by
# being forgotten.
for _d in DISC:
    _rel = sorted({s_["name"] for _x in _d["destinations"]
                   for s_ in (_x.get("schoolsInfo") or []) if s_.get("etRelationship")})
    if _rel and not (_d.get("disclosure") or "").strip():
        raise SystemExit(f'build-atlas-pages: {_d["id"]} names a school we have a relationship '
                         f'with ({", ".join(_rel)}) and carries no disclosure.')


TODAY = _dt.date.today().isoformat()

# A malformed sweep is worse than no sweep: it reads as diligence and is not. So a
# sweep that exists must be well-formed or the build stops. A craft with NO sweep is
# a backlog item, not an error — 34 crafts opened before this rule existed and
# failing on all of them would just mean the rule gets deleted. The backlog is
# printed instead, the way rule 10's is, so it stays visible until it is empty.
_sweep_bad, SWEEP_MISSING, SWEEP_STALE = [], [], []
for _d in DISC:
    _sw = _d.get("sweep")
    if _sw is None:
        if is_open(_d["id"]):
            SWEEP_MISSING.append(_d["id"])
        continue
    _sweep_bad += atlas_hub.sweep_problems(_d["id"], _sw, TODAY)
    if atlas_hub.sweep_stale(_sw, TODAY):
        SWEEP_STALE.append(_d["id"])
if _sweep_bad:
    raise SystemExit("build-atlas-pages: the worldwide sweep on these crafts is not "
                     "usable —\n  " + "\n  ".join(_sweep_bad))


def sibling_line(d):
    """The neighbouring craft this one is most often confused with, and the difference.

    Modernist Spanish Cuisine and New culinary techniques share a toolkit, an origin
    story and a city, and a reader who lands on one has no way to know the other
    exists or why. Curated per craft — a machine cannot say what the difference is,
    only that two pages look alike.
    """
    sib = d.get("sibling")
    if not sib:
        return ""
    return ('<p class="meta" style="margin-top:14px;padding-top:12px;'
            'border-top:1px solid var(--line);max-width:62ch">'
            f'{e(sib["line"])} <a href="/atlas/{e(sib["id"])}" style="color:var(--sea);'
            'text-decoration:none;border-bottom:1px solid rgba(127,168,165,.32)">'
            f'{e(sib["label"])} &rarr;</a></p>')




def _vouches(d):
    """Every check on this craft's places where somebody was actually in the room."""
    out = []
    for x in d["destinations"]:
        c = x.get("check") or {}
        if c.get("state") in CHECKED_STATES:
            out.append((x, c))
    return out


def _host(u):
    m = re.match(r"https?://([^/]+)", str(u or ""), re.I)
    return m.group(1).lower().removeprefix("www.") if m else ""


def _selling_hosts(d):
    """Every host that is selling a course on this craft.

    Nothing published on one of these can be third-party evidence that the craft is
    alive in the town: a school's own page saying the place lives and breathes this is
    the brochure sentence the cap exists to refuse. A festival's own site, a guild
    register, a trade body or a public listing is a different kind of witness — it is
    not selling you the week.
    """
    hosts = set()
    for x in d["destinations"]:
        for s in x.get("schoolsInfo") or []:
            hosts.add(_host(s.get("url")))
    f = d.get("featured") or {}
    hosts.add(_host(f.get("url")))
    for a in f.get("alternatives") or []:
        hosts.add(_host(a.get("url")))
    return {h for h in hosts if h}


def _public_evidence(d, mm):
    """Is the fourth question carried by somebody who is not selling the course?

    Arnaud, 2026-09-03: "most of the places the craft is alive their." He is right, and
    the old cap over-applied — it held the fourth dot dark on the grounds that only a
    visit could settle it, when a guild register, a world-tour stop, a weekly market or
    a UNESCO listing settles it in public and from a desk. So THIS one dot can now be
    filled without going. The fifth cannot: a ceiling is not a fact anybody publishes.
    """
    if not mm:
        return False
    q4 = mm["conditions"][3]
    if not q4.get("on"):
        return False
    return any(_host(ev.get("url")) and _host(ev.get("url")) not in _selling_hosts(d)
               for ev in q4.get("evidence") or [])


def _evidence_cap(d, mm=None):
    """How far the evidence lets this craft's dots go, and why.

    A craft is held at the desk cap until a person has stood in one of its rooms, with
    the one exception above: public evidence about the town, from somebody with nothing
    to sell, lifts the desk cap by one. Two visitors — or somebody who went back — is
    what a place holding up looks like, and only that reaches five.
    Returns (cap, reason-or-empty).
    """
    v = _vouches(d)
    if not v:
        cap = MEASURE_CAPS.get("researched, not checked", 3)
        if _public_evidence(d, mm):
            cap = max(cap, MEASURE_CAPS.get("public evidence on the place", cap))
        return cap, ""
    if len(v) >= 2:
        return MEASURE_CAPS.get("twoOrReturn", 5), ""
    x, c = v[0]
    cap = MEASURE_CAPS.get(c["state"], 4)
    return cap, (f'{e(c["by"])} stood in the room at {e(x["place"])} on {e(c["date"])}. '
                 'One visit is one week and one cohort, so the last dot waits for a second.')


def _vouch_line(d):
    """Who has been — split by route, because the gap between the two is the finding."""
    v = _vouches(d)
    if not v:
        return ""
    mine = [c for _, c in v if c.get("route") == "with-us"]
    alone = [c for _, c in v if c.get("route") == "direct"]
    bits = []
    if mine:
        bits.append(f'{atlas_hub._WORD.get(len(mine), len(mine)).lower()} on a week we sold')
    if alone:
        bits.append(f'{atlas_hub._WORD.get(len(alone), len(alone)).lower()} who went on their own')
    tail = (" &mdash; " + ", ".join(bits)) if bits else ""
    n = atlas_hub._WORD.get(len(v), len(v))
    who = "chef has" if len(v) == 1 else "chefs have"
    return (f'<p style="margin:0 0 14px;color:var(--muted)">{n} working {who} stood in a room '
            f'on this craft and signed what they saw{tail}. Their words are on the place\'s '
            'own page.</p>')



# ── where else the craft lives: named, and nothing more ────────────────────
# Arnaud, 2026-09-05: "add all the places possible that could be interested. even if
# its in one line."
#
# He is right about the failure. A craft sheet that lists five places implies the craft
# happens in five places, and for rock climbing or surfing that is simply false — the
# Atlas was reading as a map of the world when it was a map of what we had got round to.
#
# ⛔ SO THE ENTRY IS A PLACE, NEVER A BUSINESS, AND THE GATE ENFORCES IT. No url, no
# school name, no price, no dates. The reason is not tidiness: a place does not close.
# Espai Sucre was listed here as "operating and enrollable" for two years after it shut,
# and Revere Academy — closed since 2017 — was paired with another school's address by a
# scrape. Both were BUSINESS facts rotting inside a listing. "Kalymnos is a sport-climbing
# island" does not rot, which is what makes a one-line place entry safe to publish at a
# volume no one could keep checked.
#
# The label is the Atlas's own lowest evidence state, not a new one: `measureCaps` already
# says "catalogued, not checked" earns NO meter at all — an absence, not a zero. These are
# that, and the page says so above them rather than in a footnote.
def also_here_block(d):
    """Delegates to atlas_hub, so the generated pages and the hand-written sheets
    draw the identical block from one function rather than two that drift.
    """
    return atlas_hub.also_here_html(d)

def measure_block(d):
    """The Measure for a craft, if one has been graded AND signed.

    A craft with no entry shows NO meter — that is an absence, not a zero, and the
    difference is the whole honesty of the mark. The rendering itself lives in
    atlas_hub.measure_html() so that scripts/preview-measure.py shows a drafted grade
    exactly as it would ship, rather than a lookalike of it.
    """
    mm = MEASURE.get(d["id"])
    if not mm:
        return ""
    dots = int(mm["dots"])
    cap = _evidence_cap(d, mm)[0]
    if dots > cap:
        raise SystemExit(
            f'build-atlas-pages: measure on {d["id"]} claims {dots} dots but the evidence '
            f'only carries {cap}. Nobody has stood in a room here yet, and whether the craft is '
            'alive in its place and whether there is enough there to keep you going are exactly '
            'what a brochure claims. Lower the dots or add the check.')
    return atlas_hub.measure_html(mm, dots, _vouch_line(d))

def in_depth_block(d):
    """The craft itself, at length. A different thing from the overall, and mostly not
    written yet.

    Arnaud, 2026-09-01, pointing at /atlas/modern-new-technique-cuisine: "this is the
    in depth... 'Read the craft in depth' — it's actually the overall. Add the in-depth
    after the overall." He is right, and most of the fix is the rename above: what the
    generated pages called "in depth" is `ceiling` + `room`, a summary of what a trip
    gives you. That is the overall, and it now says so.

    The real in-depth is what the hand-written sheets carry — what the craft actually
    is, where it came from, what is technique and what is theatre. No generated craft
    holds a word of it, so this renders only where the prose exists and prints NOTHING
    where it does not. No heading over a blank, and nothing assembled by machine to
    fill the space: a composed in-depth would be the Atlas talking without having read
    anything, which is the one voice it may never use.
    """
    dp = d.get("inDepth")
    if not dp:
        return ""
    body = ""
    for sec in dp["sections"]:
        body += (f'<h3 style="font-family:\'Fraunces\',Georgia,serif;font-weight:400;'
                 f'font-size:19px;margin:24px 0 8px">{e(sec["h"])}</h3>')
        body += "".join(f'<p style="opacity:.82;font-size:15px;margin-bottom:12px">{e(t)}</p>'
                        for t in sec["p"])
    src = (f'<p class="meta" style="margin-top:18px">Sources: {e(dp["sources"])}</p>'
           if dp.get("sources") else "")
    return ('<section id="in-depth-long"><div class="wrap prose">'
            '<details class="fold"><summary>'
            '<span class="mono" style="color:var(--sea)">The long way round</span>'
            f'<h2 style="margin:6px 0 0">{e(d["discipline"])} in depth</h2>'
            f'</summary><div class="foldbody">{body}{src}</div></details></div></section>')


def sweep_block(d):
    """What we looked at and did not list — the Standard's own wedge, printed.

    Rivals publish what cleared. A panel cannot chase decay and a marketplace will not
    print the route around itself, and neither will print the places that failed: the
    count of what was checked and did not clear is the one thing only a record can
    say. It sits under the destinations, in plain type, with the day it was done.
    """
    sw = d.get("sweep")
    if not sw:
        return ""
    rows = ""
    for r in sw.get("rejected") or []:
        nm = e(r["name"])
        if r.get("url"):
            nm = (f'<a class="school-url" rel="nofollow noopener" target="_blank" '
                  f'href="{e(r["url"])}">{nm} \u2197</a>')
        where = f' <span class="meta">{e(r["place"])}</span>' if r.get("place") else ""
        rows += (f'<li><strong style="font-weight:500">{nm}</strong>{where}'
                 f'<div style="font-size:14px;opacity:.75;margin-top:4px">{e(r["why"])}</div></li>')
    nreg = len(sw.get("regions") or [])
    bounded = atlas_hub.sweep_bounded(sw)
    scope = (f'Searched on {e(sw["date"])}. {e(bounded)}' if bounded else
             f'Searched in {nreg} of {len(atlas_hub.SWEEP_REGIONS)} regions of the world, '
             f'on {e(sw["date"])}.')
    gaps = atlas_hub.sweep_gaps(sw)
    gap_html = (f'<p class="meta" style="margin-top:12px">Not searched yet: '
                f'{e(", ".join(gaps))}. If you know this craft in one of those, '
                'write and say so — that is how the next sweep gets pointed.</p>'
                ) if gaps else ""
    stale = ('<p class="meta" style="margin-top:10px;color:var(--ember)">This sweep is over a '
             'year old. Treat it as a record of what was true then, not of what is true now.</p>'
             ) if atlas_hub.sweep_stale(sw, TODAY) else ""
    nrej = len(sw.get("rejected") or [])
    return ('<section><div class="wrap prose">'
            '<details class="fold"><summary>'
            '<span class="mono" style="color:var(--sea)">Checked and not listed</span>'
            f'<h2 style="margin:6px 0 0">What did not clear'
            f'<span style="opacity:.45;font-weight:300"> &middot; {nrej}</span></h2>'
            '</summary><div class="foldbody">'
            f'<p class="meta" style="margin-bottom:14px">{scope} Everything below is real, and '
            'none of it is on this map. The reason sits next to each one, because a place left '
            'off without a reason is just an opinion.</p>'
            f'<ul class="clean" style="font-size:14.5px">{rows}</ul>{gap_html}{stale}'
            "</div></details></div></section>")


# ── rising star: a room too new to have a record, said as a category ──────
# Arnaud, 2026-09-02, on JCMA opening in June: "that's why you can tag it as rising
# star". He is right, and it is the better shape. Burying "it has no alumni" in prose
# reads as a hedge on a recommendation; naming the category turns the same fact into
# the reason to look — a new room with a named teacher is interesting BECAUSE nobody
# has been yet, and the reader can price that themselves.
#
# THE ONE PROPERTY IT MUST HAVE IS AN EXPIRY. A "new" badge that never comes off is a
# lie with a delay on it, and decay is this map's whole wedge. So the tag carries the
# month the room opened, the build works out how new that still is, and past
# RISING_MONTHS it REFUSES TO BUILD until somebody takes the tag off or the school has
# earned a real entry. Nothing here ages quietly.
RISING_MONTHS = 24


def rising_star(s_):
    """The chip, or "" — and a hard stop once the tag has outlived its truth."""
    r = s_.get("risingStar")
    if not r:
        return ""
    since = (r.get("since") or "").strip()
    if not re.fullmatch(r"\d{4}-\d{2}", since):
        raise SystemExit(f'build-atlas-pages: {s_["name"]!r} is tagged risingStar and needs '
                         "`since` as YYYY-MM, the month it opened. \"New\" without a date is "
                         "just an adjective.")
    y, m = (int(v) for v in since.split("-"))
    months = (int(TODAY[:4]) - y) * 12 + (int(TODAY[5:7]) - m)
    if months < 0:
        raise SystemExit(f'build-atlas-pages: {s_["name"]!r} says it opened {since}, in the future.')
    if months > RISING_MONTHS:
        raise SystemExit(
            f'build-atlas-pages: {s_["name"]!r} has been "rising" for {months} months. Past '
            f"{RISING_MONTHS} it is not new — it is unproven, or it is established. Take the tag "
            "off and say which. A badge that never expires is a lie with a delay on it.")
    age = ("opened this month" if months < 1 else
           "open one month" if months == 1 else f"open {months} months")
    return ('<div style="margin-top:6px"><span style="display:inline-block;'
            "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;"
            'text-transform:uppercase;color:var(--ember);border:1px solid rgba(210,138,82,.45);'
            f'border-radius:99px;padding:2px 9px">Rising star &middot; {e(age)}</span>'
            '<div style="font-size:13.5px;color:var(--muted);margin-top:6px;max-width:62ch">'
            f'{e(r["why"])}</div></div>')


# ── who teaches now, and where it comes from: two different questions ─────
# `masters` is what makes a place page say "who teaches" and a card say "With <name>".
# Across the open Atlas it held 19 entries that are not teachers at all: Pattabhi Jois
# (d. 2009), Sivananda (d. 1963), Krishnamacharya (d. 1989), Duke Kahanamoku (d. 1968),
# Bernard Leach (d. 1979), Pellegrino Artusi (d. 1911), Jacques Mayol, Emil Vodder.
# The same error that put Ferran Adrià on a museum sheet, Jiro Ono on a sushi school
# and Dabiz Muñoz on Madrid — nineteen more times, and nobody could see it because a
# lineage in a "who teaches" field reads like an answer.
#
# So the two questions are two fields. `masters` = people alive and in the room, and
# only that drives the promise. `lineage` = where the craft comes from, which is worth
# printing and is never a teacher. The guard refuses the mixture, because the whole
# failure was that the mixture looked fine.
# ⚠ 2026-09-05: the pattern had `founding` but not `movement`, `est.` or `memorial`,
# and it let four entries through that grading the crafts then found by hand — the
# Compagnie des Guides de Chamonix (a company, on three separate crafts) and
# "Dean Ornish (lifestyle-medicine movement)". `founder` is deliberately NOT in here:
# a living founder who still teaches is a legitimate answer to "who teaches", and
# Lotta Ericson, Tony Moniz and Alan Cadiz are all exactly that. Founder is ambiguity,
# not evidence — it needs a person to judge it, which is what the Measure is for.
#
# ⛔ AND NO REGEX CAN SEE A DEATH. Tatsuzo Shimaoka (d. 2007) and Asokananda (d. 2005)
# sat in `masters` as bare names and this guard was blind to both by construction.
# The only thing that catches those is somebody asking, of each name, "is this person
# alive and will they be in the room" — question one of the Measure.
_LINEAGE_SHAPED = re.compile(r"lineage|school of|tradition|^the\b|founding|formerly|"
                             r"living national treasure|movement|est\.|memorial", re.I)


def lineage_guard(disc):
    bad = []
    for d in disc:
        for x in d["destinations"]:
            for m in x.get("masters") or []:
                if _LINEAGE_SHAPED.search(m):
                    bad.append(f'{d["id"]} / {x["place"]}: {m!r}')
    if bad:
        raise SystemExit(
            "build-atlas-pages: these sit in `masters`, which is the field that makes a page "
            "say WHO TEACHES, and they are lineages rather than people in the room. Move them "
            "to `lineage` on the same destination:\n  " + "\n  ".join(bad))


lineage_guard(DISC)


def has_relationship(x):
    return any(s.get("etRelationship") for s in (x.get("schoolsInfo") or []))


def disclosure_block(d, section=True):
    """Where we stand with a school, said before the reader forms a view."""
    t = (d.get("disclosure") or "").strip()
    if not t:
        return ""
    card = ('<div class="card" style="border-left:3px solid var(--sea)">'
            '<div class="mono">Where we stand with them</div>'
            f'<p style="opacity:.86;margin-top:8px;max-width:62ch">{e(t)}</p></div>')
    return f'<section><div class="wrap">{card}</div></section>' if section else card


def learn_line(x):
    """The immersive line, under the place name. Absent until somebody writes it."""
    line = (LEARN_LINES.get(x["id"]) or "").strip()
    if not line:
        return ""
    return ('<p style="font-family:\'Fraunces\',Georgia,serif;font-size:17px;line-height:1.4;'
            'color:var(--sea);margin:8px 0 10px;max-width:54ch">' + e(line) + "</p>")


def with_whom(d, x):
    """Who you would actually be with, and for how long — both already published on the
    sheet this card opens, neither of them previously anywhere on the craft page.

    Craft page only (link=True). The place's own sheet already carries a Masters &
    lineage section a few centimetres below, and this would just say it twice."""
    if is_closed(x):
        return ""          # you would be with nobody, for as long as the tour lasts
    bits = []
    ms = [m for m in (x.get("masters") or []) if m]
    if ms:
        bits.append("With <strong style=\"font-weight:500\">" + e(ms[0]) + "</strong>"
                    + (f" and {len(ms) - 1} more" if len(ms) > 1 else ""))
    if x.get("tripLength"):
        # "Starter — about a week": the tripType reads as a label, so it keeps its capital.
        bits.append(e(str(x.get("tripType") or "").strip() or "A trip") + " — " + e(x["tripLength"]))
    if not bits:
        return ""
    return ('<p class="meta" style="margin:10px 0 0">' + " &middot; ".join(bits) + "</p>")


def related_crafts(craft_id, n=4):
    """Up to n neighbours, taken one at a time from each family the craft belongs to.

    Round-robin rather than family-by-family: a craft in two families should show both,
    not four from the first one. Open crafts come first — they are the ones with
    somewhere to go today.
    """
    pools = []
    for label, ids in CRAFT_FAMILIES.items():
        if craft_id not in ids:
            continue
        sibs = [c for c in ids if c != craft_id and c in CRAFT_META]
        sibs.sort(key=lambda c: (0 if is_open(c) else 1, -CRAFT_META[c]["rank"],
                                 CRAFT_META[c]["name"]))
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


def related_block(craft_id):
    rel = related_crafts(craft_id)
    if not rel:
        return ""
    items = []
    for c, label in rel:
        m = CRAFT_META[c]
        # Only an OPEN craft names its place here. A locked neighbour printing its
        # town on this card would publish exactly what its own page withholds.
        place = f'{e(m["place"])}, {e(m["country"])}' if (m["place"] and is_open(c)) else ""
        state = "<b>open</b> &middot; where to learn it" if is_open(c) else "not open yet"
        items.append((f"/atlas/{c}", e(label), e(m["name"]), place, state))
    return atlas_hub.rail_section(
        "If this one pulls you", "Close to this on the map",
        "Grouped by hand, not by an algorithm — same hands, same instinct, a different craft. "
        "Drag, or use the arrows.",
        atlas_hub.rail_cards(items), len(items))


# ---------- the day each craft opened ----------
# data/atlas-unlocked.json holds WHICH crafts are open and off how many hands; it does
# not hold WHEN, and it is rewritten in full on every refresh. So the dates live here,
# in their own append-only file: seeded from `git log data/atlas-unlocked.json` (the
# record refresh-unlocked.mjs was written to leave) and grown by this build, which
# stamps a craft the first time it turns up open. A date, once written, is never
# rewritten — it is the day it happened, and /atlas prints it.
#
# Missing file is not fatal: the band simply has nothing to show and the rest of the
# Atlas builds exactly as before. Wrong dates would be worse than no band.
OPENED_PATH = ROOT / "data/atlas-opened.json"
_opened_doc = json.loads(OPENED_PATH.read_text()) if OPENED_PATH.exists() else {"opened": {}}
OPENED = dict(_opened_doc.get("opened") or {})
_fresh = [s for s in HANDS if s not in OPENED]
if _fresh and UNLOCK_DATE and not ASSUME_ALL_OPEN:
    for s in _fresh:
        OPENED[s] = UNLOCK_DATE
    _opened_doc["opened"] = {k: OPENED[k] for k in sorted(OPENED, key=lambda s: (OPENED[s], s))}
    OPENED_PATH.write_text(json.dumps(_opened_doc, indent=2, ensure_ascii=False) + "\n")
    print(f"atlas-opened.json: {len(_fresh)} craft(s) stamped {UNLOCK_DATE} — "
          + ", ".join(sorted(_fresh)))

_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def pretty_date(iso):
    """2026-08-23 -> 23 Aug 2026. Anything unexpected comes back as it went in."""
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", iso or "")
    if not m:
        return iso or ""
    y, mo, d = int(m[1]), int(m[2]), int(m[3])
    return f"{d} {_MONTHS[mo - 1]} {y}" if 1 <= mo <= 12 else iso

# Real, cited public ratings (window.ET_RATINGS) — the trust layer. Keyed by discipline id;
# each entry names the matched school + destId. We show a star NUMBER only for clean
# first-party sources with a working link; self-flagged aggregated/indirect sources render
# as the qualitative reason only. Never fabricated; always linked so readers can verify.
RSRC = ROOT / "data/atlas-ratings.js"
RATINGS = {}
if RSRC.exists():
    _rt = RSRC.read_text()
    RATINGS = json.loads(_rt[_rt.index("{", _rt.index("ET_RATINGS")):_rt.rindex("}") + 1])

def _clean_source(s):
    s = (s or "").lower()
    return bool(s) and not any(w in s for w in ["via", "aggreg", "not ", "company-wide", "directory", "syncs"])

def rating_block(d, x):
    r = RATINGS.get(d["id"])
    if not r or r.get("destId") != x["id"]:
        return ""
    why = r.get("whyPick") or ""
    school = r.get("school") or "this school"
    # Multiple cited sources per school (TripAdvisor + Google + craft-respected).
    # Back-compat: synthesize from legacy single fields if no sources[].
    srcs = r.get("sources")
    if srcs is None:
        srcs = ([{"source": r["source"], "stars": r["stars"], "count": r.get("count"), "url": r["url"]}]
                if r.get("stars") and r.get("url") and _clean_source(r.get("source")) else [])
    rows = []
    for s in srcs:
        if not (s.get("stars") and s.get("url")):
            continue
        cnt = f' · {s["count"]} reviews' if s.get("count") else ""
        rows.append(f'<li><span class="dots">★</span> <strong style="font-weight:500">{e(str(s["stars"]))}/5</strong>{e(cnt)} on '
                    f'<a class="school-url" rel="nofollow noopener" target="_blank" href="{e(s["url"])}">{e(s["source"])} ↗</a></li>')
    line = ""
    if rows:
        verify = "— don't take my word, check them yourself" if len(rows) > 1 else "— don't take my word, check it yourself"
        line = f'<ul class="clean" style="margin-bottom:12px">{"".join(rows)}</ul><p class="meta" style="margin:-4px 0 12px">{verify}</p>'
    if not (line or why):
        return ""
    head = "Why this school — real and cited, not my opinion dressed up"
    return (f'<section><div class="wrap prose"><div class="mono">{head}</div>'
            f'<h2 style="margin:6px 0 10px">Why {e(school)}</h2>{line}'
            f'<p style="opacity:.82">{e(why)}</p></div></section>')

CORES = {
    "wellness": ("Wellness", "Breath, stillness, the body as instrument"),
    "adventure": ("Adventure", "Wind, water, rock, snow — competence outdoors"),
    "creative": ("Creative", "Hands, material, lineage — the maker crafts"),
    "culinary": ("Culinary", "Fire, ferment, knife — cooking at the source"),
}
BADGE_LABELS = {
    "source": "Birthplace", "scene": "Living scene", "mecca": "Mecca",
    "master": "Named masters", "school": "Verified schools", "gold-cred": "Gold credential",
    "heritage": "Heritage", "record": "Record holder", "lineage": "Unbroken lineage",
    "master-lab": "Enrol with the master",
}
ROLE_LABELS = {"source": "Birthplace of the discipline", "scene": "Strong living community", "both": "Birthplace & living capital"}

e = html.escape

# Founder-voice trust block — appears small at the bottom of every Atlas page.
# Voice: Arnaud, first person, plain, no hype. No fabricated ratings — only what
# we can stand behind. The reader's 5 questions sit in <details> to stay compact.
TRUST_HTML = ("""<section style="border-top:1px solid var(--line);background:var(--ink2)">
<div class="wrap prose">
<details class="fold">
<summary>
<span class="mono" style="color:var(--sea)">Why you can trust this map</span>
<h2 style="font-size:20px;margin:6px 0 0">How a place gets on here, and what we do when it stops being true</h2>
</summary>
<div class="foldbody">
<p style="opacity:.82;font-size:15px;margin-bottom:16px">There is a real difference between a school that teaches you and a good-looking website, and too much of the internet is the second kind. Four instruments do the work, and every one of them is visible on the page you are already on.</p>
<ul class="clean" style="font-size:14.5px">"""
+ "".join(f'<li><strong style="font-weight:500">{h}</strong> {b}</li>'
          for h, b in atlas_hub.TRUST_ITEMS)
+ """__BLANK_LI__
</ul>
<details style="margin-top:18px">
<summary style="cursor:pointer;color:var(--sea);font-size:14px">Before you trust any school — mine or anyone else's — ask these five things</summary>
<ol style="font-size:14px;opacity:.84;margin:14px 0 0 18px;line-height:1.75">"""
+ "".join(f"<li>{q}</li>" for q in atlas_hub.TRUST_ASK)
+ """</ol>
<p style="font-size:13px;opacity:.6;margin-top:12px">If a place dodges these, that's your answer. It costs you nothing to ask, and it tells you everything.</p>
<p style="font-size:13px;opacity:.6;margin-top:10px">This is the short version. <a href="/journal/how-to-find-the-best-school-online" style="color:var(--sea)">The full method is here</a> — the six questions, in order, for any craft anywhere.</p>
</details>
</div>
</details>
</div>
</section>""")

# Currency switcher (Original / EUR / USD principally) — converts every .price[data-amt]
# span client-side at fixed approximate rates; the original price stays the source of truth.
CUR_TOGGLE = """<div class="cur-toggle" id="cur-toggle" hidden title="Show prices in your currency — converted at live ECB rates; the original is the source of truth">
<span class="lab">Prices</span><button data-c="orig">Original</button><button data-c="EUR">€ EUR</button><button data-c="USD">$ USD</button></div>
<script>
(function(){
  var R={USD:1,EUR:0.92,GBP:0.79,CAD:1.37,JPY:150,CHF:0.88,AUD:1.52,NZD:1.66,THB:36,SGD:1.34,INR:84,MXN:18};
  var SYM={USD:"$",EUR:"€",GBP:"£",CAD:"CA$",JPY:"¥",CHF:"CHF ",AUD:"A$",NZD:"NZ$",THB:"฿",SGD:"S$",INR:"₹",MXN:"MX$"};
  var prices=document.querySelectorAll(".price[data-amt]");
  var bar=document.getElementById("cur-toggle");
  if(!prices.length){ if(bar) bar.remove(); return; }
  bar.hidden=false;
  function fmt(cur,amt){ var n=Math.round(amt); return (SYM[cur]||cur+" ")+n.toLocaleString("en-US"); }
  var sel=localStorage.getItem("et_cur")||"orig";
  function apply(){
    prices.forEach(function(el){
      var cur=el.getAttribute("data-cur"), amt=parseFloat(el.getAttribute("data-amt")), orig=el.getAttribute("data-orig");
      if(sel==="orig"||sel===cur||!R[cur]||!R[sel]||isNaN(amt)){ el.textContent=orig; return; }
      el.textContent="≈ "+fmt(sel, amt/R[cur]*R[sel]);
    });
    bar.querySelectorAll("button").forEach(function(b){ b.classList.toggle("on", b.dataset.c===sel); });
  }
  bar.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b)return; sel=b.dataset.c; localStorage.setItem("et_cur",sel); apply(); });
  // Live FX (ECB via Frankfurter, no key, CORS). Cache 6h; fall back to the fixed table above if offline/down.
  function setRates(r,date){ R=r; if(date) bar.title="Prices shown at live ECB rates as of "+date+" — converted, the original is the source of truth"; apply(); }
  function useRates(rates,date){ rates.USD=rates.USD||1; localStorage.setItem("et_fx",JSON.stringify({r:rates,t:Date.now(),date:date})); setRates(rates,date); }
  (function loadFX(){
    try{ var c=JSON.parse(localStorage.getItem("et_fx")||"null"); if(c&&c.r&&c.t&&(Date.now()-c.t<21600000)){ setRates(c.r,c.date); return; } }catch(e){}
    fetch("https://api.frankfurter.dev/v1/latest?base=USD").then(function(x){return x.json();}).then(function(d){
      if(d&&d.rates){ useRates(d.rates,d.date); } else { throw 0; }
    }).catch(function(){
      fetch("https://open.er-api.com/v6/latest/USD").then(function(x){return x.json();}).then(function(d){
        if(d&&d.rates){ useRates(d.rates,(d.time_last_update_utc||"").slice(0,16)); }
      }).catch(function(){});
    });
  })();
  apply();
})();
</script>"""

# ---------- markup every live page carries ----------
# These four blocks were added to the 480 built pages by hand after a build, so every
# regeneration silently stripped the sign-in state and the save button off the whole
# Atlas. They live here now: the generator owns the page again.
NAV_AUTH = ('<div id="et-nav-auth"><a href="/circle" id="et-nav-join" class="cta" '
            'style="margin:0;padding:8px 18px;font-size:13px;">Join the Circle</a>'
            '<a href="/you" id="et-nav-profile" class="cta" '
            'style="margin:0;padding:8px 18px;font-size:13px;display:none;">Your place</a></div>')

NAV_AUTH_TOGGLE = """<!-- et-nav-auth-toggle -->
<script>
(function(){
  function reflect(session){
    var j=document.getElementById('et-nav-join'), p=document.getElementById('et-nav-profile');
    if(!j||!p) return;
    if(session){ j.style.display='none'; p.style.display='inline-block'; }
    else { j.style.display='inline-block'; p.style.display='none'; }
  }
  function wait(n){
    if(window.supabaseClient){
      window.supabaseClient.auth.getSession().then(function(r){reflect(r.data.session);});
      window.supabaseClient.auth.onAuthStateChange(function(_e,s){reflect(s);});
    } else if(n<120){ setTimeout(function(){wait(n+1);},50); }
  }
  wait(0);
})();
</script>"""

# skill-save.js needs auth.js + database.js, and hooks form.intent[data-discipline].
# Only an open craft page has one — a short sheet must not grow a "save this skill"
# button for a craft that has no sheet behind it yet.
AUTH_SCRIPTS = '<script src="/js/auth.js"></script>\n<script src="/js/database.js"></script>'
SKILL_SAVE = '<script src="/js/skill-save.js" defer></script>'


RAIL_CSS = atlas_hub.RAIL_CSS
RAIL_JS = atlas_hub.RAIL_JS


def page(title, desc, canonical_path, body, breadcrumbs=None, jsonld=None,
         saveable=True, extra_head="", extra_scripts="", body_attrs=""):
    # A quiet way to tell me a sheet has gone stale. The subject carries the page
    # so a report is triaged before I open it — "something is wrong" with no URL
    # is unusable. mailto, not a form: no table, no policy, no moderation queue,
    # and it still works with JavaScript off.
    _clean = title.split(" — ")[0].replace("Learn ", "", 1)
    report_link = (
        '<p style="margin:0 0 14px"><a href="mailto:arnaudcallier@pm.me'
        '?subject=' + _q("Atlas — " + _clean) +
        '&amp;body=' + _q("What looked wrong:\n\n\n(page: " + SITE + canonical_path + ")") +
        '" style="color:var(--sea);text-decoration:none;border-bottom:1px solid rgba(127,168,165,.3)">'
        'Something here out of date? Tell me &mdash; corrections go straight to my inbox.</a></p>'
    )
    crumbs = ""
    if breadcrumbs:
        items = [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(breadcrumbs)]
        crumbs = '<script type="application/ld+json">%s</script>' % json.dumps(
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})
    extra = '<script type="application/ld+json">%s</script>' % json.dumps(jsonld) if jsonld else ""
    # NAV_AUTH_TOGGLE only swaps the HEADER pair. Every open craft sheet also closes
    # on a "Join the Circle" button, and a member reading it was still being asked to
    # join something they are already in — member-nav.js turns that one into "Your
    # portrait". It touches nothing else and no-ops for a visitor.
    tail = ['<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
            '<script src="/js/supabase-config.js"></script>',
            '<script src="/js/member-nav.js" defer></script>',
            NAV_AUTH_TOGGLE]
    if saveable:
        tail.append(AUTH_SCRIPTS)
    tail.append('<script src="/js/intent-capture.js" defer></script>')
    # The comment box on each school. It no-ops on any page with no li[data-school],
    # so it costs a craft page nothing and only does work on a place page.
    tail.append('<script src="/js/school-note.js" defer></script>')
    if saveable:
        tail.append(SKILL_SAVE)
    if extra_scripts:
        tail.append(extra_scripts)
    tail_scripts = "\n".join(tail)
    fonts = (atlas_hub.LETTER_FONTS if extra_head else
             "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap")
    _page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{SITE}{canonical_path}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{canonical_path}">
<meta property="og:image" content="{SITE}/images/logo-et-full.png">
<meta property="og:site_name" content="EducatedTraveler">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{fonts}" rel="stylesheet">
{crumbs}{extra}
{ANALYTICS}{extra_head}
<style>
:root {{ --ink:#0d0b09; --ink2:#14110d; --paper:#f3ede2; --sea:#7fa8a5; --ember:#d28a52; --line:rgba(243,237,226,0.09);
         --muted:rgba(243,237,226,0.56); --faint:rgba(243,237,226,0.34); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family:'Inter',system-ui,sans-serif; background:var(--ink); color:var(--paper); font-weight:300; line-height:1.65; -webkit-font-smoothing:antialiased; }}
.serif {{ font-family:'Fraunces',Georgia,serif; }}
.mono {{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--sea); }}
a {{ color:inherit; }}
/* Folded sections. The marker is ours, on the left, so a summary can carry a heading
   without the browser's triangle landing in the middle of it. */
details.fold > summary {{ cursor:pointer; list-style:none; position:relative; padding-left:26px; }}
details.fold > summary::-webkit-details-marker {{ display:none; }}
details.fold > summary::before {{ content:"+"; position:absolute; left:0; top:1px;
  font-family:'IBM Plex Mono',monospace; font-size:17px; line-height:1.2; color:var(--sea); opacity:.8; }}
details.fold[open] > summary::before {{ content:"\2212"; }}
details.fold > summary:hover::before {{ opacity:1; }}
details.fold .foldbody {{ margin-top:16px; padding-left:26px; }}
{RAIL_CSS}
@media(max-width:560px){{ details.fold .foldbody {{ padding-left:0; }} }}
.wrap {{ max-width:880px; margin:0 auto; padding:0 24px; }}
/* Prose sections keep the page's one spine (880px) and cap the READING MEASURE
   instead of the container — same 62ch as .lead. Narrowing the container is what
   used to jog the left edge 80px mid-scroll. */
.wrap.prose > * {{ max-width:62ch; }}
nav.top {{ position:sticky; top:0; background:rgba(13,11,9,.85); backdrop-filter:blur(14px); border-bottom:1px solid var(--line); z-index:50; }}
nav.top .wrap {{ display:flex; justify-content:space-between; align-items:center; height:60px; }}
nav.top a {{ text-decoration:none; opacity:.7; font-size:14px; }} nav.top a:hover {{ opacity:1; color:var(--sea); }}
.brand {{ font-family:'IBM Plex Mono',monospace; letter-spacing:.14em; font-size:13px; opacity:1 !important; }}
header.hero {{ padding:72px 0 40px; border-bottom:1px solid var(--line); }}
h1 {{ font-family:'Fraunces',Georgia,serif; font-weight:400; font-size:clamp(30px,5vw,46px); line-height:1.12; margin:14px 0 18px; }}
h2 {{ font-family:'Fraunces',Georgia,serif; font-weight:400; font-size:24px; margin-bottom:14px; }}
.lead {{ font-size:17px; opacity:.78; max-width:62ch; }}
section {{ padding:44px 0; border-bottom:1px solid var(--line); }}
.card {{ background:var(--ink2); border:1px solid var(--line); border-radius:10px; padding:22px 24px; margin-bottom:14px; }}
.card a.t {{ text-decoration:none; }} .card a.t:hover {{ color:var(--sea); }}
.dwhere {{ font-size:17px; font-weight:500; color:var(--sea); line-height:1.3; margin:2px 0 10px; }}
.dwhere .in {{ font-size:13px; font-weight:400; opacity:.62; }}
.badge {{ display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.06em; border:1px solid rgba(243,237,226,.18); border-radius:99px; padding:3px 10px; margin:0 6px 6px 0; opacity:.85; }}
.dots {{ color:var(--sea); letter-spacing:3px; }}
.meta {{ font-size:13px; opacity:.6; }}
ul.clean {{ list-style:none; }} ul.clean li {{ padding:10px 0; border-bottom:1px solid var(--line); }}
ul.clean li:last-child {{ border-bottom:none; }}
.school-url {{ font-size:13px; color:var(--sea); text-decoration:none; word-break:break-all; }} .school-url:hover {{ text-decoration:underline; }}
.cta {{ display:inline-block; margin-top:18px; padding:13px 26px; border-radius:99px; text-decoration:none; color:var(--ink2); font-size:14px; font-weight:400; background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%); }}
.cta:hover {{ opacity:.92; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:12px; }}
.shots {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:18px 14px; align-items:start; }}
.shots figure {{ margin:0; }}
.shots figure.wide {{ grid-column:1/-1; }}
.shots img {{ width:100%; height:auto; display:block; border-radius:10px; border:1px solid var(--line); background:var(--ink2); }}
.shots figcaption {{ font-size:13px; opacity:.6; margin-top:8px; line-height:1.55; }}
.intent {{ border:1px solid var(--line); border-radius:12px; padding:20px 22px; background:rgba(243,237,226,0.02); margin:18px 0 0; }}
.intent-q {{ font-size:15px; opacity:.82; margin-bottom:12px; max-width:56ch; }}
.intent-go {{ border:none; border-radius:99px; padding:11px 22px; font-size:14px; font-weight:500; color:#14110d; cursor:pointer; background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%); }}
.intent-go:hover {{ filter:brightness(1.05); }} .intent-go:disabled {{ opacity:.5; cursor:default; }}
.intent-msg {{ font-size:13.5px; margin-top:10px; }} .intent-msg.ok {{ color:var(--sea); }} .intent-msg.err {{ color:#e0915f; }}
.intent-fine {{ font-size:12px; opacity:.5; margin-top:8px; }}
footer {{ padding:40px 0 60px; font-size:13px; color:rgba(243,237,226,.62); }}
footer a {{ color:var(--sea); }}
.cur-toggle {{ position:fixed; right:14px; bottom:14px; z-index:60; display:flex; align-items:center; gap:6px;
  background:rgba(20,17,13,.92); backdrop-filter:blur(10px); border:1px solid var(--line); border-radius:99px; padding:5px 7px 5px 12px; box-shadow:0 8px 24px rgba(0,0,0,.4); }}
.cur-toggle .lab {{ font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; opacity:.5; }}
.cur-toggle button {{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--paper); opacity:.6; background:none; border:none; cursor:pointer; border-radius:99px; padding:4px 9px; transition:all .18s; }}
.cur-toggle button:hover {{ opacity:1; }}
.cur-toggle button.on {{ opacity:1; background:linear-gradient(135deg,var(--sea),var(--ember) 130%); color:#14110d; font-weight:500; }}
.price[data-amt] {{ cursor:default; }}
@media(max-width:560px) {{ .cur-toggle .lab {{ display:none; }} .cur-toggle {{ right:10px; bottom:10px; }} }}
</style>
</head>
<body{body_attrs}>
<nav class="top"><div class="wrap">
<a class="brand" href="/">EDUCATEDTRAVELER</a>
{NAV_AUTH}
</div></nav>
{body}
{TRUST_HTML}
{tail_scripts}
<footer><div class="wrap">{report_link}<p style="opacity:.82;margin:0 0 16px;max-width:60ch;line-height:1.7;">One page of a larger map. <a href="/atlas/" style="color:var(--sea);">Wander the rest of the Atlas</a> for the other crafts and where they're alive, read the notes I write in <a href="/letters/" style="color:var(--sea);">Founder&#39;s Notes</a>, and when a week takes shape near what pulls you, <a href="/circle" style="color:var(--sea);">the Circle</a> is how I open the door.</p><div class="et-foot-nav" style="display:flex;gap:20px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px;"><a href="/atlas/" style="color:var(--sea);text-decoration:none;">Catalogue of Skills</a><a href="/letters/" style="color:var(--sea);text-decoration:none;">Founder&#39;s Notes</a><a href="/lab-weeks" style="color:var(--sea);text-decoration:none;">Lab Weeks</a><a href="/about" style="color:var(--sea);text-decoration:none;">Meet the founder of EducatedTraveler</a><a href="/circle" style="color:var(--sea);text-decoration:none;">The Circle</a><a href="/you" data-visitor-only style="color:var(--sea);text-decoration:none;">Already in? Sign in</a></div>EducatedTraveler — we connect you to the skill, the place, the person, and your people — then get out of the way. <a href="/#circle">Join the Circle</a>.<br><span style="opacity:.75">We use privacy-light, cookieless analytics — no personal data, no tracking cookies.</span></div></footer>
{CUR_TOGGLE}
<script>{RAIL_JS}</script>
</body>
</html>"""
    # The blank-line credo belongs only where there IS a blank — the not-open sheets.
    _blank = ('<li><strong style="font-weight:500">An honest blank outranks a plausible name.</strong></li>'
              if 'class="notyet"' in body else '')
    return _page_html.replace("__BLANK_LI__", _blank)

def circle_cta(line):
    return (f'<p style="margin-top:8px;opacity:.78;max-width:60ch">{e(line)}</p>'
            '<a class="cta" href="/#circle">Tell us this pulls you — join the Circle</a>'
            '<p class="meta" style="margin-top:10px">Prices are a verified starting point — no checkout, no hard sell. We introduce; you decide.</p>')

def intent_form(source, discipline=None, place=None, label=None):
    """The note, on a craft or a place sheet.

    An empty shell on purpose: /js/intent-capture.js replaces what is inside it with
    the sheet, the signature and one button, and asks for the address afterwards in a
    dialog — the note first, the form never. What the page contributes is the craft
    and the place, through the data-* attributes, so the note already knows what it
    is about. What is written here is only what a reader whose scripts never arrived
    would see, and it has to reach me too: a mailto does, with nothing in the way.
    """
    data = f' data-discipline="{e(discipline)}"' if discipline else ""
    data += f' data-place="{e(place)}"' if place else ""
    data += f' data-label="{e(label)}"' if label else ""
    return (f'<form class="intent"{data} data-source="{e(source)}">'
            '<p class="intent-q">Write me a note about this one &mdash; how you&#39;d love to learn '
            'it, and where. It comes to my own inbox and I read every one myself.</p>'
            '<p class="intent-fine">If this box never loads, the same note reaches me at '
            '<a href="mailto:arnaudcallier@pm.me" style="color:var(--sea)">arnaudcallier@pm.me</a>.</p>'
            '</form>')



# The few rules a short sheet needs that the shared Atlas stylesheet doesn't carry:
# the state badge and the "most alive" line. The note's own button is drawn by
# /js/intent-capture.js, so there is no .btn here to keep in step with it.
SHORT_CSS = """
.notyet { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ember); border:1px solid rgba(210,138,82,.34); border-radius:99px; padding:4px 11px; }
.opensby { font-size:13.5px; opacity:.62; white-space:nowrap; }
@media (max-width:520px) { .opensby { display:block; margin-top:8px; white-space:normal; } }
.alive { font-size:15px; opacity:.82; margin-top:14px; }
.alive b { font-weight:500; opacity:1; }
.eyebrow { font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--sea); }
.serif { font-family:'Fraunces',Georgia,serif; }
"""


def short_sheet(d, total):
    """A craft nobody has asked for yet: what it is, and the note box.

    Everything else — the places, the schools, the teachers, the credential, the
    prices, and since 1 Sep 2026 the place itself — is deliberately absent from
    this page and from its source.
    """
    # Arnaud, 1 Sep 2026: a locked craft says WHAT it is and nothing about WHERE.
    # This page used to name the strongest community and its country, which is the
    # single most valuable line of the research and was being given away on the one
    # page that exists because the research is not published yet.
    alive = ""
    return f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Catalogue of Skills</a> / {e(CORES[d['category']][0])}</div>
<p style="margin:16px 0 0"><span class="notyet">Not open yet</span> <span class="opensby">&mdash; a note to Arnaud opens it</span></p>
<h1>{e(d['discipline'])}</h1>
<p class="lead">{e(d['blurb'])}</p>{alive}
</div></header>
<section><div class="wrap prose">
<div class="mono">Why there's nothing more on this page</div>
<h2 style="margin:6px 0 14px">The map grows where someone is actually going</h2>
<p style="opacity:.82;font-size:15px;max-width:62ch">That's all I'll put up for now. The rest of it — every place, the schools, the teachers, what the credential is actually worth — is researched and sitting in my files. I open a craft on the Atlas when a member writes to me about it &mdash; or, now and then, when one pulls at me hard enough that I go and check it myself.</p>
<p style="opacity:.82;font-size:15px;max-width:62ch;margin-top:14px">That isn't a tease. It's how I keep this honest: I publish a sheet when someone is genuinely going to use it, so I can check it properly before you read it, instead of checking {total} things badly.</p>
<p style="opacity:.82;font-size:15px;max-width:62ch;margin-top:14px">So the key to this one is a note, and the note comes to me — Arnaud. Not a form and not a team inbox: my own, and I'm the only one who reads it. Write it below and I'll answer you.</p>
</div></section>
{atlas_hub.note_section(
    "Write me a note about " + e(d["discipline"]) + ".",
    "A note to <b>Arnaud</b> &mdash; me &mdash; is what opens this craft. "
    "Not a form: it lands in my inbox and I read every one myself. Tell me why this one pulls at "
    "you, how you\'d want to learn it, and who you\'d want to be in it a year from now.",
    discipline=d["id"], label=d["discipline"])}
{related_block(d["id"])}"""


# Lets the next build recognise its own place stubs. Without it the preserve sweep
# treats all 310 of them as pages somebody else wrote, and the one warning that
# matters — a real hand-written sheet missing from the manifest — is buried.
STUB_MARK = "<!-- et:place-stub -->"


def dest_stub(dest_id, parent_id, parent_name, place, country):
    """A place page for a craft that isn't open yet.

    It carries no research — just a way back to the craft. It exists so that the
    375 place URLs already in inboxes, captions and search results keep landing
    somewhere true instead of 404ing.
    """
    url = f"/atlas/{parent_id}"
    return f"""<!DOCTYPE html>
<html lang="en">
{STUB_MARK}
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(parent_name)} in {e(place)} — EducatedTraveler</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{SITE}{url}">
<meta http-equiv="refresh" content="0; url={url}">
<script>window.location.replace({json.dumps(url)});</script>
</head>
<body style="background:#0d0b09;color:#f3ede2;font-family:system-ui,sans-serif;padding:40px">
<p>{e(parent_name)} isn't open on the Atlas yet, so there's no sheet for {e(place)}, {e(country)} — a note to me, Arnaud, is what opens it.</p>
<p><a href="{url}" style="color:#7fa8a5">Go to {e(parent_name)} &rarr;</a></p>
</body>
</html>"""


def ceiling_line(x, d=None):
    if is_closed(x):
        return ""          # "how far can you get" has no answer where nothing is taught
    c = x.get("ceiling") or (d.get("ceiling") if d else None)
    if c:
        return f'<p style="opacity:.82;font-size:15px;margin:14px 0 0;max-width:62ch"><strong style="font-weight:500">What you can realistically reach:</strong> {e(c)}</p>'
    if x.get("level"):
        return f'<p class="meta" style="margin:14px 0 0">Honest level: {e(x["level"])} — ask the school exactly how far that goes in the time you have.</p>'
    return ""

def room_block(x, d=None):
    r = x.get("room") or (d.get("room") if d else None) or {}
    items = []
    if r.get("ratio"): items.append(f'<li><strong style="font-weight:500">Group</strong> — {e(r["ratio"])}</li>')
    if r.get("day"):   items.append(f'<li><strong style="font-weight:500">A normal day</strong> — {e(r["day"])}</li>')
    if r.get("who"):   items.append(f'<li><strong style="font-weight:500">Who comes</strong> — {e(r["who"])}</li>')
    if not items:
        return ""
    return ('<section><div class="wrap"><div class="mono">What the days are like</div>'
            f'<h2>The room</h2><ul class="clean" style="font-size:14.5px">{"".join(items)}</ul>'
            '<p class="meta" style="margin-top:10px">Want the rest — a normal day, first hour to last? '
            'Ask the school; a serious one answers in two minutes.</p></div></section>')

# ── photographs a school sent us, credited to it ──────────────────────────
# The wave-one and wave-two letters asked every school two things: is this page
# right, and do you have footage. Matos Tarifa answered both on 4 September 2026.
# Publishing what a school sends creates an obvious hazard — the page starts to
# look like a favour returned — so the block says the opposite out loud, in the
# same words the email used: sending pictures does not move a school up the page.
# It is also an open offer, printed where the other schools on the page can read
# it, which is what keeps this a record rather than a shop window.
#
# The pictures hang off the SCHOOL, never off the place, so the credit cannot
# drift onto somebody else's work when a destination is re-sorted.
def photo_block(x):
    """Photographs supplied by the schools on this place page, credited to each."""
    blocks = []
    for s_ in x.get("schoolsInfo") or []:
        ph = s_.get("photos") or {}
        items = ph.get("items") or []
        if not items:
            continue
        figs = ""
        for im in items:
            # A caption is optional. A file that is not there, and alt text that is
            # not written, are both build stoppers: a broken image on a page whose
            # whole claim is that it was checked by hand is worse than no picture.
            f = ROOT / "website" / im["src"].lstrip("/")
            if not f.exists():
                raise SystemExit(f'build-atlas-pages: {s_["name"]!r} lists a photograph '
                                 f'that is not in the repo: {im["src"]}')
            if not (im.get("alt") or "").strip():
                raise SystemExit(f'build-atlas-pages: {im["src"]} has no alt text. Someone '
                                 "reading this page with their eyes shut gets nothing. "
                                 "Describe what is in the frame.")
            cls = ' class="wide"' if im.get("wide") else ""
            cap = (f'<figcaption>{e(im["caption"])}</figcaption>'
                   if im.get("caption") else "")
            figs += (f'<figure{cls}><img src="{e(im["src"])}" alt="{e(im["alt"])}" '
                     f'width="{int(im["w"])}" height="{int(im["h"])}" loading="lazy" '
                     f'decoding="async">{cap}</figure>')
        name = e(s_["name"])
        credit = (f'<a class="school-url" rel="nofollow noopener" target="_blank" '
                  f'href="{e(s_["url"])}">{name}</a>') if s_.get("url") else name
        given = f', {e(pretty_date(ph["given"]))}' if ph.get("given") else ""
        blocks.append(
            f'<div class="mono">Sent by the school</div>'
            f'<h2>What a lesson here looks like</h2>'
            f'<p class="meta" style="margin-bottom:18px;max-width:62ch">{name} sent these when '
            "I wrote to ask whether this page described the school correctly. They are the "
            "school's own photographs, published with its permission and credited to it — and "
            "they do not move it up the page: where it sits was decided from its own course "
            "pages, before I wrote. Any school on this page can have the same space, on the "
            "same terms.</p>"
            f'<div class="shots">{figs}</div>'
            f'<p class="meta" style="margin-top:14px">Photographs: {credit}{given}. '
            "Used with permission; all rights remain theirs.</p>")
    if not blocks:
        return ""
    return "".join(f'<section><div class="wrap">{b}</div></section>' for b in blocks)


def craft_depth(d):
    """The craft itself, past the one-line lead — what a trip can honestly give you,
    and what the days are actually like.

    A craft page led with a sentence and then went straight to the places, so the
    only in-depth reading on the Atlas was buried one click further down, on a place
    sheet (Arnaud, 2026-08-25: "I don't see the in-depth description"). This is the
    craft-level research we already hold, at the level it was written for. It sits
    BELOW the places on purpose: where the craft is most alive stays the point of
    the page, and this is what you read once that has pulled you.

    Renders only from rows that exist. 12 of the 34 open crafts carry it today; the
    rest get no section and no link to one, rather than a heading over a blank.
    """
    ceiling, room = d.get("ceiling"), d.get("room") or {}
    lad = SKILL_LADDERS.get(d["id"])
    if not ceiling and not room and not lad:
        return ""
    out = ('<section id="in-depth"><div class="wrap prose">'
           '<div class="mono">If this one pulls you</div>'
           f'<h2>{e(d["discipline"])} &mdash; the overall</h2>')
    if ceiling:
        out += ('<p style="opacity:.82;font-size:15px;margin-bottom:16px">'
                '<strong style="font-weight:500">What you can realistically reach:</strong> '
                f'{e(ceiling)}</p>')
    rows = [(lbl, room[k]) for k, lbl in
            (("ratio", "Group"), ("day", "A normal day"), ("who", "Who comes")) if room.get(k)]
    if rows:
        out += ('<ul class="clean" style="font-size:14.5px">'
                + "".join(f'<li><strong style="font-weight:500">{lbl}</strong> — {e(v)}</li>'
                          for lbl, v in rows) + "</ul>")
    out += atlas_hub.ladder_html(lad)
    return out + ('<p class="meta" style="margin-top:12px">This is the craft, not one school\'s '
                  'version of it. What each place does with it is on that place\'s own sheet.</p>'
                  "</div></section>")


def depth_link(d):
    """The way down to it, under the lead. Only ever printed when the section exists."""
    if not craft_depth(d):
        return ""
    return ('<p style="margin-top:16px"><a href="#in-depth" style="text-decoration:none;'
            'font-size:14px;color:var(--sea);border-bottom:1px solid rgba(127,168,165,.32);'
            'padding-bottom:2px">The overall on this craft &darr;</a>'
            '<span class="meta" style="display:block;margin-top:7px">What a trip can honestly '
            'give you, and what the days are like. The places come first.</span></p>')


def credential_section(d, x=None):
    # goldCredential is a CRAFT field printed on every destination page of that craft,
    # so a page where nothing is taught must not print "what you walk away with".
    if x is not None and is_closed(x):
        return ""
    if not d.get("goldCredential"):
        return ""
    body = (f'<p style="opacity:.82;font-size:15px;max-width:62ch"><strong style="font-weight:500">{e(d["goldCredential"])}</strong>'
            + (f' · Certifying body: {e(d["certBody"])}' if d.get("certBody") else "") + '</p>'
            '<p class="meta" style="margin-top:10px">A recognised qualification an outside body stands behind is not the same as a certificate a school prints itself. We name which it is — you should ask the school the same.</p>')
    return f'<section><div class="wrap prose"><div class="mono">What you walk away with</div><h2>The credential</h2>{body}</div></section>'

def coverage_block(d, x):
    """What each course here says it covers, against the craft's ladder.

    Under the credential, which answers the other half of the same question: that one
    says what you walk away holding, this one says what you would actually do. A place
    with no coverage read yet shows nothing — the same rule as the Measure, because a
    heading over an empty list is a promise the page has not kept.

    ⛔ The order is the order the schools are already listed in, and there is no total
    and no comparison between them. Sorting these by how many ticks each has is the one
    edit that would turn a record into a ranking.
    """
    if is_closed(x):
        return ""
    lad = SKILL_LADDERS.get(d["id"])
    covs = (COURSE_COVERAGE.get(d["id"], {}) or {}).get(x["place"], {})
    if not lad or not covs:
        return ""
    blocks = ""
    for s in x.get("schoolsInfo") or []:
        cov = covs.get(s["name"])
        if cov:
            blocks += atlas_hub.coverage_html(cov, lad, s["name"])
    if not blocks:
        return ""
    n_read, n_all = len(covs), len(x.get("schoolsInfo") or [])
    rest = ("" if n_read >= n_all else
            f' The other {atlas_hub.num_word(n_all - n_read)} '
            f'{"school on this page" if n_all - n_read == 1 else "schools on this page"} had '
            'nothing we could read on the day we looked, so nothing is said about them here.')
    return ('<section><div class="wrap prose">'
            '<div class="mono">What you would actually do</div>'
            '<h2>What these schools teach</h2>'
            f'<p class="meta" style="margin-bottom:16px">Read off each school\'s own pages '
            f'against {e(lad["standard"])} &mdash; not our list, and not a score. '
            '<strong style="font-weight:500">A school that publishes its syllabus in detail '
            'looks fuller here than one that does not, and that is a fact about their website '
            'rather than their teaching.</strong> A short course is not a worse course, so '
            f'every empty circle says which kind of empty it is. Nobody of ours has been, so '
            f'all of this is what they publish, not what we watched happen.{rest}</p>'
            f'{atlas_hub.ladder_html(lad, compact=True)}'
            '<p class="meta" style="margin:18px 0 14px">And here is who says they teach '
            'which:</p>'
            f'{blocks}</div></section>')


COMMUNITY_TIER = {
    "Legendary":  ("#f0c27a", "Legendary living community"),
    "Thriving":   ("#a3cdc9", "Thriving living community"),
    "Strong":     ("rgba(243,237,226,.78)", "Strong living community"),
    "Growing":    ("rgba(243,237,226,.55)", "Growing community"),
    "Hidden-gem": ("rgba(243,237,226,.55)", "Hidden-gem community"),
    # the closed cell — see is_closed(). Not a weak community: no community.
    "Gone":       ("rgba(243,237,226,.45)", "The community is gone"),
}

def community_pill(x):
    col, text = COMMUNITY_TIER.get(x.get("communityLabel"), ("rgba(243,237,226,.78)", (x.get("communityLabel") or "") + " community"))
    dots = "●" * x["communityRank"] + "○" * (5 - x["communityRank"])
    return (f'<span style="color:{col};letter-spacing:3px">{dots}</span> '
            f'<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.1em;'
            f'text-transform:uppercase;color:{col};font-weight:500">{e(text)}</span>')

def price_start(f):
    if not f:
        return None
    pf = f.get("priceFrom")
    if pf:
        return pf.strip()
    n = f.get("priceNote") or ""
    if not n or n == "—":
        return None
    if re.search(r"donation", n, re.I):
        return "Donation-based"
    m = re.search(r"(?:from\s*)?(?:~|approx\.?\s*)?(€|£|\$|¥|USD|EUR|GBP|CHF|AUD|CAD|NZD|JPY)\s?~?\s?(\d[\d.,]*)", n, re.I)
    if m:
        cur = m.group(1).upper()
        return cur + ("" if cur in "€£$¥" else " ") + m.group(2)
    # "3,320 EUR" and "2.310 EUR" — the order a European school writes it in.
    m = re.search(r"(?:~|approx\.?\s*)?(\d[\d.,]*)\s?(€|£|\$|¥|USD|EUR|GBP|CHF|AUD|CAD|NZD|JPY)\b", n, re.I)
    if m:
        cur = m.group(2).upper()
        return cur + ("" if cur in "€£$¥" else " ") + m.group(1)
    return None

_SYM2ISO = {"€": "EUR", "£": "GBP", "$": "USD", "¥": "JPY"}

def parse_money(text):
    """Extract (iso_currency, amount) from a price-start string, or None.
    Handles symbol-prefix ($5,995 / €600), code-prefix (USD 2,100) and code-suffix (529 CAD)."""
    if not text:
        return None
    t = str(text)
    cur = None
    cm = re.search(r"\b(USD|EUR|GBP|CHF|AUD|CAD|NZD|JPY|THB|SGD|INR|MXN)\b", t, re.I)
    if cm:
        cur = cm.group(1).upper()
    else:
        sm = re.search(r"[€£$¥]", t)
        if sm:
            cur = _SYM2ISO[sm.group(0)]
    if not cur:
        return None
    nm = re.search(r"(\d[\d,]*(?:\.\d+)?)", t)
    if not nm:
        return None
    try:
        amt = float(nm.group(1).replace(",", ""))
    except ValueError:
        return None
    return (cur, amt)

def money_html(text, style=""):
    """A price span carrying data-amt/data-cur so the client-side currency toggle can convert it."""
    p = parse_money(text)
    if p:
        iso, amt = p
        amt_s = ("%g" % amt)
        return f'<span class="price" data-amt="{amt_s}" data-cur="{iso}" data-orig="{e(text)}" style="{style}">{e(text)}</span>'
    return f'<span class="price" style="{style}">{e(text)}</span>'

def best_dest_id(d):
    # A closed destination is never the pick, however strong its community: the ribbon
    # reads "best place to go" and there is nothing there to go and do.
    dests = [x for x in d["destinations"] if not is_closed(x)]
    f = d.get("featured") or {}
    if f.get("id"):
        for x in dests:
            if x["id"] == f["id"]:
                return x["id"]
    if f.get("place"):
        for x in dests:
            if x["place"] == f["place"]:
                return x["id"]
    best = max(dests, key=lambda x: x["communityRank"], default=None)
    return best["id"] if best else None

# Rule 10 of the Standard: a name and a date on the check itself — "who checked this,
# what they actually did, and when. No house voice. If nobody will put their name on
# it, it does not go up." The `state` must be one of the Standard's sanctioned strings
# (18 Aug 2026 amendment): "catalogued, not checked" · "researched, not checked" · a
# CHECKED form. Anything else is a label climbing, which is what the amendment exists
# to stop — desk research is NOT a check, however carefully it was done.
# The three CHECKED forms were missing here until 2 Sept 2026, so rule 10 could not
# actually be written down: the builder could only ever say "not checked". A vouch
# carries the witness's TRADE, because a named yacht chef's word is what another
# yacht chef can weigh — membership of anything is not evidence (Arnaud, 2 Sept).
CHECK_STATES = {"catalogued, not checked", "researched, not checked"}
CHECKED_STATES = {"stood in it", "checked it", "a named person vouched"}
ROUTES = {"with-us": "came on a week we sold",
          "direct":  "went on their own, nothing through us"}

# A Measure is a GRADE with a name on it, so the fields that make it one are not
# optional. The checker especially: an unsigned grade is a house voice, which rule 10
# exists to forbid, and it is the one field a script must never fill in for a person.
# So a draft grade simply cannot ship — the build stops until a human signs it.
for _mid, _mm in MEASURE.items():
    _missing = [k for k in ("dots", "verdict", "state", "checker", "date", "conditions")
                if not _mm.get(k)]
    if _missing:
        raise SystemExit(f"build-atlas-pages: the Measure on {_mid} is missing {_missing}. "
                         "A grade ships with a name and a date on it, or it does not ship.")
    if len(_mm["conditions"]) != 5:
        raise SystemExit(f'build-atlas-pages: the Measure on {_mid} has '
                         f'{len(_mm["conditions"])} conditions; the meter is five questions.')
    # The five are a legend, and a legend only works if it is the same five, in the same
    # words, in the same order, on every craft — a reader learns it once on the first sheet
    # they open and never again. It is also where the old nouns would grow back one grade at
    # a time, which is what put "The stretch." on a live page above a paragraph that never
    # said what a stretch was. So the wording is not a grader's choice.
    if tuple(_c["n"] for _c in _mm["conditions"]) != atlas_hub.MEASURE_QUESTIONS:
        raise SystemExit(
            f'build-atlas-pages: the Measure on {_mid} asks its own questions.\n'
            '  The five are fixed, in this order, and a traveller reads them, so they are '
            'plain English and never the instrument\'s shorthand:\n'
            + "".join(f"    {_q}\n" for _q in atlas_hub.MEASURE_QUESTIONS)
            + '  Found:\n' + "".join(f'    {_c["n"]}\n' for _c in _mm["conditions"]))
    if int(_mm["dots"]) != sum(1 for _c in _mm["conditions"] if _c.get("on")):
        raise SystemExit(f'build-atlas-pages: the Measure on {_mid} says {_mm["dots"]} dots but '
                         f'{sum(1 for _c in _mm["conditions"] if _c.get("on"))} conditions are on. '
                         "The number and the legend have to be the same statement.")
    # The two questions a desk cannot answer on its own, each with its own way out.
    _dd = next(d for d in DISC if d["id"] == _mid)
    if _mm["conditions"][3].get("on") and not _public_evidence(_dd, _mm):
        raise SystemExit(
            f"build-atlas-pages: the Measure on {_mid} says the craft is alive in the place, "
            "with no evidence from anybody who is not selling the course.\n"
            "  Give the fourth condition an `evidence` list — a festival, a guild register, a "
            "market, a trade body, a listing — each with its url and the day it was read.\n"
            "  A school's own page is not evidence about its town: every host that sells a "
            "course on this craft is refused here.")
    if _mm["conditions"][4].get("on") and not _vouches(_dd):
        raise SystemExit(
            f"build-atlas-pages: the Measure on {_mid} says there is enough here to keep you "
            "learning for years, and nobody has been.\n"
            "  A published ladder shows the rungs exist; only somebody who climbed part of it "
            "can say the room above you is real. This one waits for a check.")



def check_line(x):
    c = x.get("check") or {}
    if not c:
        return ""
    if not (c.get("by") and c.get("date") and c.get("state")):
        raise SystemExit(f'build-atlas-pages: check on {x["id"]} needs by + date + state.')
    st = c["state"]
    if (st not in CHECK_STATES and st not in CHECKED_STATES
            and not st.lower().startswith("checked ")):
        raise SystemExit(
            f'build-atlas-pages: check state {st!r} on {x["id"]} is not a sanctioned string.\n'
            '  Use "catalogued, not checked", "researched, not checked", '
            '"stood in it", "checked it", "a named person vouched", or a "Checked <date>" form.')
    if st in CHECKED_STATES and not c.get("trade"):
        raise SystemExit(
            f'build-atlas-pages: the check on {x["id"]} says somebody was there, so it needs '
            'a `trade` — a name alone is not weighable by a reader who does the same job.')
    route = c.get("route")
    if route and route not in ROUTES:
        raise SystemExit(f'build-atlas-pages: route {route!r} on {x["id"]} is not with-us or direct.')
    who = e(c["by"]) + (f', {e(c["trade"])}' if c.get("trade") else "")
    what = f' &mdash; {e(c["what"])}' if c.get("what") else ""
    # The interest goes at the point of the judgement, never in a log.
    disc = (f'<br><span style="color:var(--ember)">&#9888; {e(ROUTES[route])}. '
            'Read it knowing that.</span>') if route == "with-us" else (
           f'<br>{e(ROUTES[route])}.' if route else "")
    return ('<p style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;line-height:1.65;'
            'letter-spacing:.02em;color:rgba(243,237,226,.62);margin:14px 0 0;padding-top:10px;'
            'border-top:1px dashed rgba(127,168,165,.28)">'
            f'{e(st)} &middot; {who} &middot; {e(c["date"])}{what}{disc}</p>')


def sheet_link(d, x):
    """The door to a place's own sheet, written as a door.

    The place name in the card heading has always been a link and nothing about it
    said there was a whole page behind it, so the reason-to-go read as the end of
    the story instead of the first line of it (Arnaud, 2026-08-25: "have the link
    somewhere where it reads nice"). Same href, said out loud.

    It names only what that page actually carries, off the row rather than off a
    template: a sheet with no named master must not promise one.
    """
    has = []
    n = len(x.get("schoolsInfo") or x.get("schools") or [])
    if n:
        has.append(("what is there" if is_closed(x) else "the school") if n == 1
                   else f"all {n} schools")
    if not is_closed(x):
        if any(s.get("course") for s in (x.get("schoolsInfo") or [])):
            has.append("the course and what it costs")
        if x.get("masters"):
            has.append("who teaches")
    if x.get("room") or d.get("room"):
        has.append("how the days run")
    if not has:
        return ""
    if len(has) > 1:
        has[-1] = "and " + has[-1]
    what = (", " if len(has) > 2 else " ").join(has)
    return ('<p style="margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(243,237,226,.09)">'
            f'<a href="/atlas/{x["id"]}" style="text-decoration:none;font-size:14px;color:var(--sea);'
            'border-bottom:1px solid rgba(127,168,165,.32);padding-bottom:2px">'
            f'The full sheet on {e(x["place"])} &rarr;</a>'
            f'<span class="meta" style="display:block;margin-top:7px">{what.capitalize()}.</span></p>')


def dest_card(d, x, link=True, is_best=False):
    badges = "".join(f'<span class="badge">{e(BADGE_LABELS.get(b, b))}</span>' for b in x["badges"])
    place = f'{e(x["place"])}, {e(x["country"])}'
    if link:
        place = f'<a class="t" href="/atlas/{x["id"]}">{place}</a>'
    # THE SENTENCE LEADS, and the place goes on the line under it (Arnaud, 2026-08-31:
    # "instead of putting Pusztaszer, Hungaria put first: Learn to work a one-way glass
    # hide, on the farm where the technique was invented"). Under it, and not folded
    # into it: 43 of the 87 written lines already carry their own "in..." or "here", and
    # a second one collides — "...every authorised Ashtanga teacher on earth traces home
    # in Mysore (Gokulam), India." One shape holds all 87, and it is the shape the
    # browse card and the places panel now use too.
    #
    # A craft that opened unattended has no written line yet, so it keeps the old head:
    # the place as the title, with nothing pretending to be a sentence above it.
    # THE SHORT LINE WHEN THERE IS ONE. `learn` is `say` plus a clause, and the `why`
    # printed four lines below already carries both — "Learn to work a one-way glass
    # hide, on the farm where the technique was invented." over "One-way glass hide
    # photography was invented here. Bence Máté... built over 25 hides on the family
    # farm". Three tiers, one fact. The say line and the untouched `why` say everything
    # the middle tier said, in less, so the middle tier goes (Arnaud, 2026-08-31: "more
    # concise without losing substance"). Verified place by place before cutting: every
    # one of the five is a compression of the `why` beneath it.
    written = (SAY_LINES.get(x["id"]) or "").strip() or (LEARN_LINES.get(x["id"]) or "").strip()
    if written and link:
        # a sentence, not a place name: it needs a headline's leading, not the body's
        head = (f'<h2 style="margin:6px 0 4px;line-height:1.24">{e(written)}</h2>'
                f'<div class="dwhere"><span class="in">in</span> {place}</div>')
    else:
        head = f'<h2 style="margin:6px 0 4px">{place}</h2>{learn_line(x)}'
    ribbon = ('<div style="display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:10px;'
              'letter-spacing:.14em;text-transform:uppercase;color:#14110d;font-weight:600;'
              'background:linear-gradient(135deg,#d28a52,#e0a877);border-radius:6px;padding:3px 9px;'
              'margin-bottom:10px">★ Best place to go</div>') if is_best else ""
    border = 'border-left:3px solid #d28a52;' if is_best else ""
    # A closed place gets the opposite of a ribbon: the plainest possible label, and the
    # honest note sits ABOVE the badges so nobody reads "Birthplace · Mecca · Heritage"
    # and arrives at a school that is not there.
    # link=False is the place's own page, whose hero already carries the note a few
    # centimetres above. Only the craft page, where the card is all a reader gets, needs it.
    note = ""
    if is_closed(x):
        ribbon = ('<div style="display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:10px;'
                  'letter-spacing:.14em;text-transform:uppercase;color:var(--muted);'
                  'border:1px solid var(--line);border-radius:6px;padding:3px 9px;'
                  'margin-bottom:10px">Where it started · nothing is taught here</div>')
        border = ""
        if link:
            note = ('<p style="opacity:.9;margin:0 0 12px;color:var(--ember);max-width:62ch">'
                    f'{e(x["closedNote"])}</p>')
    meta = f'{community_pill(x)} · Season: {e(x["bestSeason"])}'
    if not is_closed(x):
        meta += f' · {e(x["level"])}'
    return (f'<div class="card" style="{border}">{ribbon}<div class="mono">{e(ROLE_LABELS[x["role"]])}</div>'
            f'{head}'
            f'<div class="meta" style="margin-bottom:10px">{meta}</div>'
            f'<p style="opacity:.82;margin-bottom:12px">{e(x["why"])}</p>{note}{badges}'
            + (f'{with_whom(d, x)}{sheet_link(d, x)}' if link else "")
            + f'{check_line(x)}</div>')

def alts_block(f):
    alts = f.get("alternatives") or []
    rows = []
    for a in alts:
        if not a.get("course"):
            continue
        name = (f'<a class="school-url" target="_blank" rel="noopener" href="{e(a["url"])}">{e(a["course"])} ↗</a>'
                if a.get("url") else e(a["course"]))
        meta = " · ".join(e(v) for v in [a.get("duration"), a.get("format"), a.get("school"), a.get("place")] if v)
        ps = price_start(a)
        price = ("from " + money_html(ps)) if ps and ps != "Donation-based" else (money_html(ps) if ps else "price on request")
        fit = f'<span class="badge">{e(a["fit"])}</span>' if a.get("fit") else ""
        note = f'<div style="font-size:13px;opacity:.6;font-style:italic;margin-top:3px">{e(a["note"])}</div>' if a.get("note") else ""
        rows.append('<li><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">'
                    f'<div><strong style="font-weight:500">{name}</strong>'
                    + ((' <span class="meta">' + meta + '</span>') if meta else "") + note + '</div>'
                    f'<div style="text-align:right;white-space:nowrap"><div class="meta">{price}</div>{fit}</div></div></li>')
    if not rows:
        return ""
    return ('<div style="margin-top:24px"><div class="mono">Other ways in</div>'
            '<p class="meta" style="margin:6px 0 10px">Shorter or cheaper options — a lighter immersion, so they fit the '
            'EducatedTraveler philosophy less, but a real first step.</p>'
            f'<ul class="clean">{"".join(rows)}</ul></div>')

_DATEISH = re.compile(r"(\d{4})-(\d{2})(?:-(\d{2}))?")


def future_sessions(f):
    """The sessions that have not already happened, and the count that had.

    "Next sessions: 2026-05-25" printed on the first of September is not a small
    slip — it is the page telling a reader to turn up to something that finished in
    June. Eight open crafts were doing it. A session whose date cannot be parsed is
    KEPT, not hidden: the free-text ones ("19 April 2027 - 9 July 2027") are real, and
    guessing is how you delete a true line.
    """
    keep, gone = [], 0
    for sess in f.get("sessions") or []:
        ms = _DATEISH.findall(str(sess))
        if not ms:
            keep.append(sess)
            continue
        y, mo, dd = ms[-1]                       # the LAST date in a range is its end
        if f"{y}-{mo}-{dd or '28'}" < TODAY:
            gone += 1
        else:
            keep.append(sess)
    return keep, gone


def featured_block(d, x):
    if is_closed(x):
        return ""
    f = d.get("featured") or {}
    if not f.get("course"):
        return ""
    if not (f.get("id") == x["id"] or f.get("place") == x["place"]):
        return ""
    ps = price_start(f)
    if ps and ps != "Donation-based":
        price_html = ('<span style="font-family:\'Fraunces\',Georgia,serif;font-size:22px;color:#f0c27a">from </span>'
                      + money_html(ps, style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#f0c27a"))
    elif ps == "Donation-based":
        price_html = '<span style="color:#f0c27a">Donation-based</span>'
    else:
        price_html = '<span style="opacity:.6;font-style:italic">Price on request</span>'
    chips = " ".join(f'<span class="badge">{e(c)}</span>' for c in
                     [f.get("duration"), f.get("format"),
                      (f.get("certification") if f.get("certification") not in (None, "—") else None)] if c)
    desc = f'<p style="opacity:.82;margin-top:10px">{e(f["description"])}</p>' if f.get("description") else ""
    _future, _gone = future_sessions(f)
    if _future:
        sessions = '<p class="meta" style="margin-top:8px">Next sessions: ' + e(" · ".join(_future[:4])) + "</p>"
    elif _gone:
        # Every date we hold has passed. Say that, rather than print a finished one or
        # silently drop the line as though we never had any.
        sessions = ('<p class="meta" style="margin-top:8px">The dates we hold for this one have '
                    'all run. Ask the school for the next intake — and tell me what they say.</p>')
    else:
        sessions = ""
    fit = f'<p style="font-style:italic;opacity:.72;margin-top:10px">{e(f["fitsBecause"])}</p>' if f.get("fitsBecause") else ""
    link = (f'<a class="school-url" target="_blank" rel="noopener" href="{e(f["url"])}">Visit {e(f.get("school",""))} ↗</a>'
            if f.get("url") else "")
    note = f'<p class="meta" style="margin-top:8px">{e(f["priceNote"])}</p>' if f.get("priceNote") and f.get("priceNote") != "—" else ""
    tag = "Best course · provisional, verifying" if f.get("confidence") == "low" else "Best course for this craft"
    return (f'<section><div class="wrap"><div class="mono" style="color:#f0c27a">★ {e(tag)}</div>'
            f'<h2 style="margin:8px 0 4px">{e(f["course"])}</h2>'
            f'<div class="meta">{e(f.get("school",""))} — {e(f.get("place",""))}'
            f'{", " + e(f["country"]) if f.get("country") else ""}</div>{desc}'
            f'<div style="margin-top:12px">{chips}</div>{sessions}{fit}'
            f'<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:14px">{price_html}{link}</div>'
            f'{note}{alts_block(f)}</div></section>')

# ---------- clear the pages we own, keep the ones we don't ----------
# This used to be shutil.rmtree(OUT). It isn't any more: seven Atlas sheets in here
# were written by hand and exist in no data file, and nine small stubs keep URLs that
# have already been shared alive. A rebuild used to delete all sixteen.
OUT.mkdir(parents=True, exist_ok=True)
# The filenames this script is responsible for: one per craft, one per place.
OWNED = ({f'{d["id"]}.html' for d in DISC}
         | {f'{x["id"]}.html' for d in DISC for x in d["destinations"]}
         | {"index.html"})
_kept, _unknown = 0, []
for f in sorted(OUT.glob("*.html")):
    if f.name in PRESERVE:
        _kept += 1
        continue
    txt = f.read_text(errors="ignore")
    # Our own place stub, from this run's marker or simply by sitting at a slug we own.
    if STUB_MARK in txt or ('http-equiv="refresh"' in txt and 'class="spine"' not in txt
                            and f.name in OWNED):
        f.unlink()
        continue
    if 'class="spine"' in txt or 'http-equiv="refresh"' in txt:
        # Hand-written, or a redirect somebody added deliberately, and nobody recorded
        # it in the manifest — most likely a sheet merged from a skill-sheet PR or
        # published by the nightly concierge. Keep it, AND refuse to overwrite it below.
        _unknown.append(f.name)
        _kept += 1
        continue
    f.unlink()
# Anything we decided to keep is also off-limits to the generators further down. Keeping
# a hand-written sheet and then regenerating over it a hundred lines later would stamp
# "Not open yet" across a page that IS the research.
KEEP = PRESERVE | set(_unknown)
if _unknown:
    print("! kept " + str(len(_unknown)) + " hand-written page(s) missing from data/atlas-extra-sheets.json.")
    print("  They were NOT regenerated. Add them to the manifest so it stays deliberate:")
    for n in _unknown:
        print("    " + n)

urls = ["/atlas/"]

# ---------- destination pages ----------
for d in DISC:
    for x in d["destinations"]:
        if f'{x["id"]}.html' in KEEP:
            continue
        # A craft nobody has asked for keeps its place URLs alive as stubs, and out
        # of the sitemap. The research on those pages is the whole point of the gate.
        if not is_open(d["id"]):
            (OUT / f'{x["id"]}.html').write_text(
                dest_stub(x["id"], d["id"], d["discipline"], x["place"], x["country"]))
            continue
        if is_closed(x):
            title = (f'{d["discipline"]} in {x["place"]}, {x["country"]} — where it started, '
                     "and what is actually there")
        else:
            title = f'Learn {d["discipline"]} in {x["place"]}, {x["country"]} — schools, masters & the community'
        desc = (x["why"][:155] + "…") if len(x["why"]) > 156 else x["why"]
        path = f'/atlas/{x["id"]}'
        urls.append(path)

        schools_html = ""
        infos = {s["name"]: s for s in x.get("schoolsInfo", [])}
        rows = []
        seen = set()
        for s in x.get("schoolsInfo", []) or [{"name": n} for n in x["schools"]]:
            if s["name"].lower() in seen: continue
            seen.add(s["name"].lower())
            inner = f'<strong style="font-weight:500">{e(s["name"])}</strong>'
            inner += rising_star(s)
            if s.get("course"): inner += f'<div class="meta">{e(s["course"])}</div>'
            if s.get("blurb"): inner += f'<div style="font-size:14px;opacity:.75;margin-top:4px">{e(s["blurb"])}</div>'
            if s.get("rating"):
                rcnt = f' · {s["ratingCount"]} reviews' if s.get("ratingCount") else ""
                rurl = s.get("ratingUrl") or s.get("url")
                src = s.get("ratingSource", "")
                cited = f'<a class="school-url" rel="nofollow noopener" target="_blank" href="{e(rurl)}">{e(src)} ↗</a>' if rurl else e(src)
                inner += (f'<div class="meta" style="margin-top:5px"><span class="dots">★</span> '
                          f'<strong style="font-weight:500">{e(str(s["rating"]))}/5</strong>{e(rcnt)} on {cited} '
                          f'<span style="opacity:.7">— verify it yourself</span></div>')
            if s.get("url"): inner += f'<div style="margin-top:4px"><a class="school-url" rel="nofollow noopener" target="_blank" href="{e(s["url"])}">{e(s["url"])}</a></div>'
            # data-school is the key a comment is filed under, and it is the school's
            # NAME — the only stable handle a school has here. Rename a school in the
            # data and its comments are orphaned, so rename by editing, never by
            # deleting and re-adding.
            rows.append(f'<li data-school="{e(s["name"])}" data-craft="{e(d["id"])}" '
                        f'data-dest="{e(x["id"])}">{inner}</li>')
        if rows:
            feat = d.get("featured") or {}
            if feat.get("confidence") == "low":
                vnote = ('<p class="meta" style="margin-bottom:12px;color:var(--ember);opacity:.85">'
                         'Honest note: this one is still provisional — I\'m verifying it. Treat it as a lead worth checking, not a verdict.</p>')
            else:
                vnote = ('<p class="meta" style="margin-bottom:12px">'
                         'Checked by hand against each school\'s own course pages. No school paid to be listed.</p>')
            if is_closed(x):
                vnote = ('<p class="meta" style="margin-bottom:12px">'
                         "Checked by hand against each place's own pages. Nothing below is a course "
                         "you can book, and nothing here paid to be listed.</p>")
                schools_html = ('<section><div class="wrap"><div class="mono">What is actually there</div>'
                                f'<h2>On the site today</h2>{vnote}'
                                f'<ul class="clean">{"".join(rows)}</ul></div></section>')
            else:
                schools_html = f'<section><div class="wrap"><div class="mono">Where it is taught — hand-verified</div><h2>Schools in {e(x["place"])}</h2>{vnote}<ul class="clean">{"".join(rows)}</ul></div></section>'

        # Two questions, two sections. A destination with a lineage and no living teacher
        # now says exactly that, instead of printing a dead man under a heading the reader
        # will take for a staff list.
        lin = x.get("lineage") or []
        lineage_html = ""
        if lin:
            tailnote = ('A lineage, not a staff list. Nobody on it is teaching today — for who '
                        "is, look just above." if x["masters"] else
                        "A lineage, not a staff list. We have not been able to name anyone "
                        "currently teaching here, which is a gap in our work — ask the school "
                        "who will be in the room.")
            lineage_html = ('<section><div class="wrap"><div class="mono">Where it comes from</div>'
                            '<h2>The names this craft came through</h2><ul class="clean">'
                            + "".join(f"<li>{e(m)}</li>" for m in lin)
                            + f'</ul><p class="meta" style="margin-top:10px">{tailnote}</p>'
                            "</div></section>")
        masters_html = ""
        if x["masters"]:
            # On a closed page these are the people the craft came from, and the heading
            # has to say so: "Masters & lineage" on a page with no teaching reads as a
            # staff list.
            head = ("Who teaches now", "The people in the room")
            tail = ""
            if is_closed(x):
                head = ("Who it came from", "The names this place gave the craft")
                tail = ('<p class="meta" style="margin-top:10px">Named for the lineage, not as '
                        "teachers — nobody on this list teaches here.</p>")
            masters_html = (f'<section><div class="wrap"><div class="mono">{head[0]}</div>'
                            f'<h2>{head[1]}</h2><ul class="clean">'
                            + "".join(f"<li>{e(m)}</li>" for m in x["masters"])
                            + f"</ul>{tail}</div></section>")

        siblings = [s for s in d["destinations"] if s["id"] != x["id"]]
        sib_html = ""
        if siblings:
            links = "".join(f'<div class="card" style="padding:14px 18px"><a class="t" style="text-decoration:none" href="/atlas/{s["id"]}">{e(s["place"])}, {e(s["country"])}</a><div class="meta"><span class="dots">{"●"*s["communityRank"]}{"○"*(5-s["communityRank"])}</span> {e(s["communityLabel"])}</div></div>' for s in sorted(siblings, key=lambda s: -s["communityRank"]))
            sib_html = f'<section><div class="wrap"><div class="mono">Same discipline, other sources</div><h2>Also for {e(d["discipline"])}</h2><div class="grid">{links}</div></div></section>'

        jsonld = {"@context": "https://schema.org", "@type": "Place",
                  "name": f'{x["place"]}, {x["country"]}',
                  "description": x["why"],
                  "url": SITE + path,
                  "containedInPlace": {"@type": "Country", "name": x["country"]}}

        _h1 = (f"{e(d['discipline'])} in {e(x['place'])}" if is_closed(x)
               else f"Learn {e(d['discipline'])} in {e(x['place'])}")
        _closed_band = ('<p style="margin:18px 0 0;padding:14px 18px;border:1px solid var(--line);'
                        'border-left:3px solid var(--ember);border-radius:10px;background:var(--ink2);'
                        f'max-width:62ch;color:var(--paper);opacity:.92">{e(x["closedNote"])}</p>'
                        ) if is_closed(x) else ""

        intent = intent_form(
            source=f'atlas:{x["id"]}', discipline=d["id"], place=x["id"],
            label=f'{d["discipline"]} · {x["place"]}')
        body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Catalogue of Skills</a> / <a href="/atlas/{d['id']}" style="text-decoration:none">{e(d['discipline'])}</a></div>
<h1>{_h1}</h1>
<p class="lead">{e(x['why'])}</p>{_closed_band}
</div></header>
<section><div class="wrap">{dest_card(d, x, link=False, is_best=(x["id"] == best_dest_id(d)))}{ceiling_line(x, d)}</div></section>
{disclosure_block(d) if has_relationship(x) else ""}{featured_block(d, x)}
{masters_html}{lineage_html}
{rating_block(d, x)}{schools_html}{photo_block(x)}
{room_block(x, d)}
{credential_section(d, x)}{coverage_block(d, x)}
<section><div class="wrap">{intent}</div></section>
{sib_html}"""
        # saveable=False: skill-save.js hooks form.intent[data-discipline], which only
        # a craft page carries. A place page has never had the save button.
        (OUT / f'{x["id"]}.html').write_text(page(title, desc, path, body,
            breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], f'/atlas/{d["id"]}'), (x["place"], path)],
            jsonld=jsonld, saveable=False))

# ---------- discipline pages ----------
# Every craft gets a page and a place in the sitemap — a short sheet is a real page,
# not a holding screen. Only the depth behind it is gated.
# Every craft page on disk: the generated ones plus the hand-written sheets that
# have no data record. The hand-written ones are already live and already indexed.
N_CRAFTS = len(DISC) + len(PRESERVE_SHEET_SLUGS)
for _s in sorted(PRESERVE_SHEET_SLUGS):
    urls.append(f"/atlas/{_s}")

for d in DISC:
    path = f'/atlas/{d["id"]}'
    urls.append(path)
    if f'{d["id"]}.html' in KEEP:
        continue

    if not is_open(d["id"]):
        desc = (d["blurb"][:155] + "…") if len(d["blurb"]) > 156 else d["blurb"]
        (OUT / f'{d["id"]}.html').write_text(page(
            f'{d["discipline"]} — what it is, and where it\'s most alive',
            desc, path, short_sheet(d, N_CRAFTS),
            breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], path)],
            saveable=False, extra_head="<style>" + atlas_hub.NOTE_CSS + SHORT_CSS + "</style>",
            extra_scripts='<script defer src="/js/atlas-circle-interest.js"></script>'))
        continue

    title = f'{d["discipline"]} — where to learn it at the source ({len(d["destinations"])} destinations)'
    desc = (d["blurb"][:155] + "…") if len(d["blurb"]) > 156 else d["blurb"]
    _bid = best_dest_id(d)
    cards = "".join(dest_card(d, x, is_best=(x["id"] == _bid)) for x in sorted(d["destinations"], key=lambda x: -x["communityRank"]))
    cred = f'<p class="meta" style="margin-top:10px">Gold credential: <strong style="opacity:.9">{e(d.get("goldCredential",""))}</strong>{" · " + e(d["certBody"]) if d.get("certBody") else ""}</p>' if d.get("goldCredential") else ""
    body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Catalogue of Skills</a> / {e(CORES[d['category']][0])}</div>
<h1>{e(d['discipline'])}</h1>
<p class="lead">{e(d['blurb'])}</p>{cred}{sibling_line(d)}{depth_link(d)}
</div></header>
<section><div class="wrap"><div class="mono">Ranked by community strength — not by who pays</div><h2 style="margin-bottom:18px">Where the community gathers</h2>{cards}{disclosure_block(d, section=False)}{intent_form(source=f'atlas:{d["id"]}', discipline=d["id"], label=d["discipline"])}</div></section>{also_here_block(d)}{measure_block(d)}{sweep_block(d)}
{craft_depth(d)}{in_depth_block(d)}
{related_block(d["id"])}"""
    (OUT / f'{d["id"]}.html').write_text(page(title, desc, path, body,
        breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], path)]))

# ---------- the card data the browse home reads ----------
# Thin on purpose. A short craft contributes what its own page shows and nothing
# more: name, what it is, where it's most alive, how strong that community is. No
# schools, no teachers, no courses, no prices — those ship only for an open craft.
# This is what replaced serving the 1.2 MB repertoire.js to every visitor.
MOVEMENT_RE = re.compile(r"(dance|tango|flamenco|capoeira|salsa|bharatanatyam)", re.I)
# Named one by one, exactly as /browse did: the fighting arts read as Movement to a
# person choosing, whatever category the data files them under. Drop this and Karate
# and Brazilian Jiu-Jitsu turn up under "The Wild — mountains, sea, open".
MOVEMENT_IDS = {"muay-thai", "brazilian-jiu-jitsu", "karate", "kung-fu", "capoeira",
                "flamenco-and-dance", "argentine-tango", "salsa",
                "bharatanatyam-indian-classical-dance", "ecstatic-dance-and-movement"}
WORLD_OF = {"wellness": "wellness", "adventure": "adventure", "creative": "creative", "culinary": "culinary"}
# Same rule as MOVEMENT_IDS, pointing the other way. Wildlife Photography belongs in
# Creative in the data — it is photography, and it sits beside Photography — but nobody
# hunting it browses "Craft & Making". They open The Wild. The breadcrumb still reads
# Creative; only the world a person filters by changes.
ADVENTURE_IDS = {"wildlife-photography"}


def world_of(name, category, disc_id=""):
    if disc_id in MOVEMENT_IDS or MOVEMENT_RE.search(name or ""):
        return "movement"
    if disc_id in ADVENTURE_IDS:
        return "adventure"
    return WORLD_OF.get(category, "creative")


def index_card(d):
    top = max(d["destinations"], key=lambda x: x["communityRank"], default=None) or {}
    bid = best_dest_id(d)
    # An OPEN craft's card names our pick, because its page leads with "Best place to
    # go". A SHORT craft's card must name the same place its page does — the strongest
    # community — or the card says Paris and the page you land on says New York.
    best = next((x for x in d["destinations"] if x["id"] == bid), top) if is_open(d["id"]) else top
    card = {"id": d["id"], "name": d["discipline"], "cat": d["category"],
            "world": world_of(d["discipline"], d["category"], d["id"]),
            "blurb": d.get("blurb", ""),
            "place": best.get("place", ""), "country": best.get("country", ""),
            "rank": best.get("communityRank", 0), "rankLabel": best.get("communityLabel", ""),
            "nDest": len(d["destinations"]), "open": 1 if is_open(d["id"]) else 0}

    # Places. An OPEN craft ships every place with everything its card shows — the
    # same page already publishes all of it. A craft nobody has asked for ships ONE
    # place, name and country only: exactly what its short sheet says, and no more.
    # Its place id is the craft id, so a card click lands on the craft, not a stub.
    if card["open"]:
        card["dests"] = [{
            "id": x["id"], "place": x["place"], "country": x["country"],
            "region": x.get("region", ""), "rank": x.get("communityRank", 0),
            "rankLabel": x.get("communityLabel", ""), "season": x.get("bestSeason", ""),
            "role": x.get("role", ""), "level": x.get("level", ""),
            "tripTier": x.get("tripTier", 0), "tripType": x.get("tripType", ""),
            "tripLength": x.get("tripLength", ""), "english": x.get("englishTaught") is True,
            "lang": x.get("instructionLanguage", ""), "badges": x.get("badges", []),
            "master": (x.get("masters") or [""])[0], "why": x.get("why", ""),
            # the hand-written immersive line for THIS place — the sentence a card
            # shows while it walks. Written above the `why` beside it and gated by
            # learn_line_drift(); the browse page shows it, it never composes one.
            "learn": (LEARN_LINES.get(x["id"]) or "").strip(),
            # what the card SAYS while it is standing on this place — the title
            # line, above the place, not under it. Same gate, same hand.
            "say": (SAY_LINES.get(x["id"]) or "").strip(),
            "school": ((x.get("schoolsInfo") or [{}])[0]).get("name", ""),
            "nSchools": len(x.get("schoolsInfo") or x.get("schools") or []),
        } for x in d["destinations"]]
    else:
        card["dests"] = ([{"id": d["id"], "place": best.get("place", ""),
                           "country": best.get("country", ""), "region": "",
                           "rank": best.get("communityRank", 0), "rankLabel": "",
                           "season": "", "role": "", "level": "", "tripTier": 0,
                           "tripType": "", "tripLength": "", "english": False, "lang": "",
                           "badges": [], "master": "", "why": "", "learn": "", "say": "",
                           "school": "", "nSchools": 0}]
                        if best else [])
        return card

    r = RATINGS.get(d["id"])
    card.update({
        "destId": best.get("id", ""),
        "cred": d.get("goldCredential") or d.get("certBody") or "",
        "certShort": d.get("certShort", ""),
        "role": best.get("role", ""), "level": best.get("level", ""),
        "season": best.get("bestSeason", ""),
        "why": best.get("why", ""),
        "learn": (LEARN_LINES.get(best.get("id", "")) or "").strip(),
        "say": (SAY_LINES.get(best.get("id", "")) or "").strip(),
        "master": (best.get("masters") or [""])[0],
        "school": ((best.get("schoolsInfo") or [{}])[0]).get("name", ""),
        "tripType": best.get("tripType", ""), "tripLength": best.get("tripLength", ""),
        "lang": best.get("instructionLanguage", ""), "english": best.get("englishTaught") is True,
        "badges": best.get("badges", []),
    })
    if r and r.get("destId") == best.get("id") and r.get("stars"):
        card["star"] = {"v": r["stars"], "n": r.get("count"), "src": r.get("source", ""),
                        "school": r.get("school", ""), "whyPick": r.get("whyPick", "")}
    return card


CARDS = [index_card(d) for d in DISC]
for hc in HUB_CARDS:                       # crafts that live only as a hand-written sheet
    CARDS.append({"id": hc["id"], "name": hc["discipline"], "cat": hc["category"],
                  "world": world_of(hc["discipline"], hc["category"], hc["id"]),
                  "blurb": hc.get("blurb", ""), "place": hc.get("place", ""),
                  "country": hc.get("country", ""), "rank": hc.get("communityRank", 0),
                  "rankLabel": hc.get("communityLabel", ""), "nDest": hc.get("nDest", 1),
                  "open": 1 if is_open(hc["id"]) else 0,
                  # A hand-written sheet IS open, so its card prints the open layout —
                  # "Our pick for this craft", the reason to go, the school. Those fields
                  # have no repertoire.js row to come from, so they are transcribed into
                  # the manifest from the sheet itself and carried through here. Before
                  # this they were hard-coded empty, and the card claimed a pick while
                  # showing neither a reason nor a place to go.
                  "dests": [{"id": hc["id"], "place": hc.get("place", ""),
                             "country": hc.get("country", ""), "region": "",
                             "rank": hc.get("communityRank", 0),
                             "rankLabel": hc.get("communityLabel", ""), "season": "",
                             "role": "", "level": hc.get("level", ""), "tripTier": 0,
                             "tripType": hc.get("tripType", ""),
                             "tripLength": hc.get("tripLength", ""),
                             "english": bool(hc.get("english")), "lang": hc.get("lang", ""),
                             "badges": [], "master": hc.get("master", ""),
                             "why": hc.get("why", ""), "school": hc.get("school", ""),
                             "nSchools": 1 if hc.get("school") else 0}]})
CARDS.sort(key=lambda c: c["name"].lower())
N_OPEN = sum(1 for c in CARDS if c["open"])

# ---------- the band: what the Circle opened, newest first ----------
# Only crafts in data/atlas-unlocked.json get in here. The pinned-open sheets are
# open too, but nobody asked for them — Arnaud wrote them — and a band that mixed
# the two would be claiming an ask that never happened.
# EVERY craft that got here by an ask — not the first four. The band is a rail now
# (.norail in atlas_hub.py), so the row scrolls rather than the list being cut: a
# section headed "the crafts someone asked for" that showed 4 of 28 was not telling
# the truth about its own subject. There is no cap here on purpose; if this list ever
# grows past what a rail can carry, that is a design problem to solve on the page and
# not a reason to quietly stop showing people the craft they asked for.
_by_id = {c["id"]: c for c in CARDS}
_asked = [c for c in CARDS if c["open"] and c["id"] in HANDS]
N_ASKED = len(_asked)
# Newest first; same-day ties read alphabetically, because 26 crafts share the day
# the ledger started and an arbitrary order there would look like a ranking.
_band_slugs = sorted((c["id"] for c in _asked if c["id"] in OPENED),
                     key=lambda s: (_by_id[s]["name"].lower(),))
_band_slugs.sort(key=lambda s: OPENED[s], reverse=True)
# why + blurb: the same two lines the browse cards carry, from the same fields, so a
# band card reads like the card it is. Every craft in this band is open, so `why` is
# always a published reason-to-go — nothing here can print a sentence the craft's own
# sheet does not.
OPENED_BAND = [{"id": s, "name": _by_id[s]["name"], "place": _by_id[s]["place"],
                "country": _by_id[s]["country"],
                "color": atlas_hub.WORLD_COLOR.get(_by_id[s]["world"], "#7fa8a5"),
                "why": _by_id[s].get("why", ""), "blurb": _by_id[s].get("blurb", ""),
                # the written line for this craft's strongest place, so the band card
                # at rest says exactly what the first step of its walk says
                "learn": _by_id[s].get("learn", ""),
                # how many places the craft is taught in — the card says so, and walks
                # them under the pointer. Counted off the same dests the index ships,
                # so the number on the card and the list it walks cannot disagree.
                "nplaces": sum(1 for x in _by_id[s].get("dests", []) if x.get("place")),
                # the say line and the short where for each of those places, in walk
                # order — so the band card carries the same stack the grid builds and
                # cannot change height, or its words, differently from its neighbour
                "walk": atlas_hub.walk_places(_by_id[s].get("dests", [])),
                "opened": pretty_date(OPENED[s])} for s in _band_slugs]

# ---------- a locked craft publishes a description, and nothing else ----------
# Arnaud, 1 Sep 2026. Locking the PAGE was never enough: the browse card reads this
# file, so all 82 closed crafts were still printing "in <town>" and a "N places →"
# walk, with the whole destination list sitting in view-source. The card template
# guards on `o.place` and on `PLACES[o.did]`, and the shim builds PLACES out of
# `dests` — so a record with neither renders as name + description, which is the
# whole intent. Values are blanked rather than deleted: the shim reads these keys
# positionally and a missing one is a different class of bug from an empty one.
_n_locked = 0
for _c in CARDS:
    if not _c.get("open"):
        _n_locked += 1
        _c["place"] = ""
        _c["country"] = ""
        _c["dests"] = []
        _c["nDest"] = 0
        _c["rank"] = 0
        _c["rankLabel"] = ""
print(f"  {_n_locked} locked craft(s) carry a description only — no place, no destinations")

(ROOT / "website/js/atlas-index.js").write_text(
    "// EducatedTraveler — the Atlas browse index. GENERATED by scripts/build-atlas-pages.py.\n"
    "// Deliberately thin: a craft nobody has asked for yet contributes only what its own\n"
    "// page shows. The full research lives in data/repertoire.js, which is NOT served.\n"
    "window.ET_ATLAS_INDEX = " + json.dumps(
        {"generatedAt": UNLOCK_DATE, "total": len(CARDS), "open": N_OPEN, "crafts": CARDS},
        ensure_ascii=False, separators=(",", ":")) + ";\n")

# ---------- the browse home ----------
# /atlas/ is where you browse now. It used to be a flat list of links while the real
# browsing lived at /browse; that page has moved here and /browse redirects to it.
# The hub renders its results with JavaScript, so a crawler that does not run JS
# sees /atlas/ and nothing beyond it — verified: the built page carried exactly one
# /atlas/ href, its own. This is a real <a href> to every craft, always in the HTML.
# A generated craft page already links its own place sheets, so craft links alone
# complete the crawl graph. Kept in a <details> so it is a quiet index rather than
# 112 links of visual noise; <details> content is in the DOM and is crawled.
_nav_items = "".join(
    '<li><a href="/atlas/{sl}">{nm}</a>{shut}</li>'.format(
        sl=c["id"], nm=html.escape(c["name"]),
        shut="" if c.get("open") else ' <span class="shut">· not open yet</span>')
    for c in sorted(CARDS, key=lambda c: c["name"].lower()))
CRAFT_NAV = (
    '<div class="wrap"><details class="craftnav">'
    '<summary>Every craft on the Atlas, A\u2013Z ({n})</summary>'
    '<ul>{items}</ul></details></div>'
).format(n=len(CARDS), items=_nav_items)

(OUT / "index.html").write_text(atlas_hub.build(
    analytics=ANALYTICS, site=SITE, total=len(CARDS), n_open=N_OPEN,
    generated_at=UNLOCK_DATE, craft_nav=CRAFT_NAV,
    opened=OPENED_BAND, n_asked=N_ASKED))

# ---------- sitemap + robots ----------
# Hand-added statics used to be wiped by every rebuild — they live here now.
# /browse is deliberately absent: it is a redirect, and a redirect has no business
# in a sitemap. The place stubs of a craft that isn't open are absent for the same
# reason; they carry noindex and exist only so shared URLs still land somewhere true.
static_urls = ["/", "/about", "/community", "/lab-weeks", "/circle", "/barcelona", "/instructors", "/letters/", "/teach", "/privacy"]

# The journal was written, published, and then invisible: no note has ever been in
# this sitemap. Discover them instead of listing slugs, so publishing the next one is
# one file and no edit here. A note still in review carries noindex — that is the
# gate, and a page that asks not to be indexed does not go in the sitemap.
journal_dir = ROOT / "website/journal"
if journal_dir.is_dir():
    static_urls.append("/journal/")
    for f in sorted(journal_dir.glob("*.html")):
        if f.name == "index.html":
            continue
        if re.search(r'name="robots"[^>]*noindex', f.read_text(encoding="utf-8")):
            continue
        static_urls.append(f"/journal/{f.stem}")

sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
seen_url = set()
for u in static_urls + urls:
    if u in seen_url:
        continue
    seen_url.add(u)
    sm.append(f"<url><loc>{SITE}{u}</loc></url>")
sm.append("</urlset>")
(ROOT / "website/sitemap.xml").write_text("\n".join(sm))
# This file is GENERATED, so a rule hand-added to website/robots.txt is silently
# clobbered by the next rebuild — that is how /_archive/ nearly went back into
# search. Add new rules HERE, never to the output.
(ROOT / "website/robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cmd\nDisallow: /_archive/\nSitemap: {SITE}/sitemap.xml\n")

n_short = len(CARDS) - N_OPEN
n_dest_full = sum(len(d["destinations"]) for d in DISC if is_open(d["id"]) and f'{d["id"]}.html' not in PRESERVE)
n_dest_stub = sum(len(d["destinations"]) for d in DISC if not is_open(d["id"]))
print(f"{len(CARDS)} crafts — {N_OPEN} open, {n_short} short (unlock file dated {UNLOCK_DATE or 'unknown'})")
print(f"  {n_dest_full} place pages · {n_dest_stub} place stubs · {_kept} pages preserved · browse home rebuilt")
print(f"  website/js/atlas-index.js written · sitemap.xml: {len(seen_url)} URLs · robots.txt written")

# Rule 10 debt, said out loud on every build. An open sheet with no name and no date on
# it does not meet the Standard, and a count that nobody prints is a count nobody fixes.
_open_disc = [d for d in DISC if is_open(d["id"])]
_no_check = sorted(d["id"] for d in _open_disc
                   if not any(x.get("check") for x in d["destinations"]))
if _no_check:
    print(f"  ⚠ rule 10 — {len(_no_check)} of {len(_open_disc)} open crafts carry no name-and-date "
          f"check line yet: {', '.join(_no_check[:6])}"
          + (f", +{len(_no_check) - 6} more" if len(_no_check) > 6 else ""))

# ── the gate on `alsoHere` ────────────────────────────────────────────────
# Three refusals, and the middle one is the whole point of the field.
for _d in DISC:
    _seen = {x["place"].lower() for x in _d["destinations"]}
    for _r in _d.get("alsoHere") or []:
        for _k in ("place", "country", "note"):
            if not (_r.get(_k) or "").strip():
                raise SystemExit(f'build-atlas-pages: alsoHere on {_d["id"]} has an entry with no '
                                 f'{_k}. A place with no line about it is a name, not an entry.')
        # ⛔ A one-line entry may never become a recommendation. Nothing here is checked,
        # so a link would be us pointing at a business we have not looked at — which is
        # exactly what the rest of this file spends its gates refusing to do.
        if any(k in _r for k in ("url", "school", "schools", "price")):
            raise SystemExit(f'build-atlas-pages: alsoHere on {_d["id"]} carries a url, a school or '
                             f'a price on {_r.get("place")!r}. These places are catalogued and NOT '
                             'checked; naming a business here would recommend something nobody has '
                             'looked at. Put it in `destinations` and research it, or leave the line.')
        if _r["place"].lower() in _seen:
            raise SystemExit(f'build-atlas-pages: alsoHere on {_d["id"]} repeats {_r["place"]!r}, '
                             'which is already a checked destination on this craft.')
_n_also = sum(len(_d.get("alsoHere") or []) for _d in DISC)
if _n_also:
    print(f"  · {_n_also} place(s) catalogued but not checked, across "
          f"{sum(1 for _d in DISC if _d.get('alsoHere'))} craft(s)")

# ── THE MEASURE IS THE STANDARD NOW (Arnaud, 2 Sept 2026) ────────────────────
# "make it the standard of ET any skill sheet that comes out."
#
# Failing on the crafts that opened before the Measure existed would just mean the
# rule gets deleted, which is how every good rule dies here. So the backlog is
# printed like rule 10's — and the DEBT MAY NOT GROW. A new sheet without a grade
# raises the count and stops the build; grading one lowers it and the floor can be
# tightened. That is what makes it the standard for what comes out, without
# pretending the archive is already there.
_no_measure = sorted(d["id"] for d in _open_disc if d["id"] not in MEASURE)
_floor = MANIFEST.get("measureDebtFloor")
if _no_measure:
    print(f"  ⚠ the Measure — {len(_no_measure)} of {len(_open_disc)} open crafts carry no grade "
          f"yet: {', '.join(_no_measure[:6])}"
          + (f", +{len(_no_measure) - 6} more" if len(_no_measure) > 6 else ""))
if _floor is not None:
    if len(_no_measure) > _floor:
        _new = [c for c in _no_measure if c not in set(MANIFEST.get("measureDebtKnown", []))]
        raise SystemExit(
            f'build-atlas-pages: {len(_no_measure)} open crafts have no Measure, and the floor is '
            f'{_floor}. Every sheet that comes out carries one — that is the standard.\n'
            + (f'  New without a grade: {", ".join(_new)}\n' if _new else "")
            + '  Add it to data/atlas-extra-sheets.json -> measure, or preview one first with '
              'scripts/preview-measure.py.')
    if len(_no_measure) < _floor:
        print(f"  ✓ the Measure debt fell to {len(_no_measure)} — tighten measureDebtFloor in "
              "data/atlas-extra-sheets.json so it cannot drift back up")

# ── the ladder debt, on the same ratchet ─────────────────────────────────────
# Same shape as the Measure's and for the same reason: a craft whose body publishes a
# ladder and whose sheet does not carry it is telling a reader less than the school's
# own homepage does. The archive is printed, not fatal; the debt may not grow.
#
# ⚠ A craft with NO published ladder is not debt — photography's own certBody says
# "no universal body", and inventing rungs for it is the failure, not the gap. Those
# are declared in laddersNotPublished and counted as done.
_none_published = set(MANIFEST.get("laddersNotPublished", []))
_no_ladder = sorted(d["id"] for d in _open_disc
                    if d["id"] not in SKILL_LADDERS and d["id"] not in _none_published)
_lfloor = MANIFEST.get("ladderDebtFloor")
if _no_ladder:
    print(f"  ⚠ the ladder — {len(_no_ladder)} of {len(_open_disc)} open crafts carry no skill "
          f"ladder yet: {', '.join(_no_ladder[:6])}"
          + (f", +{len(_no_ladder) - 6} more" if len(_no_ladder) > 6 else ""))
if _lfloor is not None:
    if len(_no_ladder) > _lfloor:
        _newl = [c for c in _no_ladder if c not in set(MANIFEST.get("ladderDebtKnown", []))]
        raise SystemExit(
            f"build-atlas-pages: {len(_no_ladder)} open crafts have no ladder, and the floor is "
            f"{_lfloor}.\n"
            + (f'  New without one: {", ".join(_newl)}\n' if _newl else "")
            + "  Add the body's published ladder to data/atlas-extra-sheets.json -> "
              "skillLadders, or — if no body publishes one — say so in laddersNotPublished.")
    if len(_no_ladder) < _lfloor:
        print(f"  ✓ the ladder debt fell to {len(_no_ladder)} — tighten ladderDebtFloor in "
              "data/atlas-extra-sheets.json so it cannot drift back up")
_n_cov = sum(len(s) for p in COURSE_COVERAGE.values() for s in p.values())
if SKILL_LADDERS:
    print(f"  · the ladder: {len(SKILL_LADDERS)} craft(s) carry one, {_n_cov} course(s) read "
          f"against it")

# Which place cards are still missing their immersive line. Printed rather than
# raised: a craft opens unattended the moment somebody asks for it, and a refusal
# here would take the nightly build down on exactly that night. Visible, not fatal.
_want_line = [x["id"] for d in DISC if is_open(d["id"]) and f'{d["id"]}.html' not in PRESERVE
              for x in d["destinations"]]
_no_line = [i for i in _want_line if not (LEARN_LINES.get(i) or "").strip()]
if _no_line:
    print(f"  ⚠ {len(_no_line)} of {len(_want_line)} open place cards have no learnLines entry "
          f"yet: {', '.join(_no_line[:5])}"
          + (f", +{len(_no_line) - 5} more" if len(_no_line) > 5 else ""))
else:
    print(f"  ✓ all {len(_want_line)} open place cards carry an immersive line")
# Drift, not typos: a line that names something its own research does not. Warned
# here (the nightly must survive it) and FAILED in scripts/check-atlas-hub.py.
_drift = atlas_hub.learn_line_drift(LEARN_LINES, DISC)
if _drift:
    print(f"  ⚠ {len(_drift)} learnLines token(s) not traceable to the research they sit above:")
    for _did, _kind, _tok, _ in _drift[:6]:
        print(f"      {_did}: {_kind} {_tok!r}")
# The say line is the card's title, so it is held to the same standard by the same
# gate — a title that overclaims is worse than a caption that does.
_drift_say = atlas_hub.learn_line_drift(SAY_LINES, DISC)
if _drift_say:
    print(f"  ⚠ {len(_drift_say)} sayLines token(s) not traceable to the research they sit above:")
    for _did, _kind, _tok, _ in _drift_say[:6]:
        print(f"      {_did}: {_kind} {_tok!r}")
if SAY_LINES:
    print(f"  ✓ {len(SAY_LINES)} place(s) say what you would be doing there, not just where it is")
# The worldwide-sweep backlog. An open craft with no sweep is one where nobody has
# written down where they looked — which is exactly how Le Cordon Bleu Madrid stayed
# off Modernist Spanish Cuisine while the sheet carried a star and four places.
_swept = [d["id"] for d in DISC if is_open(d["id"]) and d.get("sweep")]
if SWEEP_MISSING:
    print(f"  ⚠ worldwide sweep — {len(SWEEP_MISSING)} of {len(SWEEP_MISSING) + len(_swept)} open "
          f"crafts have no record of where they were searched: {', '.join(sorted(SWEEP_MISSING)[:5])}"
          + (f", +{len(SWEEP_MISSING) - 5} more" if len(SWEEP_MISSING) > 5 else ""))
if _swept:
    print(f"  ✓ {len(_swept)} craft(s) publish what they checked and did not list")
if SWEEP_STALE:
    print(f"  ⚠ {len(SWEEP_STALE)} sweep(s) older than a year, re-sweep due: {', '.join(sorted(SWEEP_STALE))}")

# What the night check found and could not resolve. Read from disk rather than
# fetched: the build must never depend on the network, and it must never quietly
# publish a claim the night has been failing to confirm.
_vstate = ROOT / "data/atlas-verify-state.json"
if _vstate.exists():
    _vs = json.loads(_vstate.read_text()).get("entries", {})
    _sick = sorted(k for k, v in _vs.items() if v.get("failing", 0) >= 3)
    if _sick:
        print(f"  ⚠⚠ {len(_sick)} claim(s) the night check has failed to confirm 3+ times running "
              f"— re-verify or take them down: {', '.join(_sick[:4])}"
              + (f", +{len(_sick) - 4} more" if len(_sick) > 4 else ""))

_stale_sessions = []
for _d in DISC:
    if not is_open(_d["id"]):
        continue
    _f = _d.get("featured") or {}
    _k, _g = future_sessions(_f)
    if _g:
        _stale_sessions.append((_d["id"], _g, len(_k)))
if _stale_sessions:
    print(f"  ⚠ {len(_stale_sessions)} open craft(s) hold session dates that have already run "
          "(hidden from the page, still in the data — replace them): "
          + ", ".join(f"{i} ({g} past" + (f", {k} to come)" if k else ", none left)")
                      for i, g, k in _stale_sessions[:5]))

# Drafted grades waiting for a signature. Counted, never read: the build must be able
# to say how many are pending without being able to publish one.
_dpath = ROOT / "data/atlas-measure-drafts.json"
if _dpath.exists():
    _drafts = json.loads(_dpath.read_text()).get("drafts", {})
    if _drafts:
        print(f"  ⚠ {len(_drafts)} Measure(s) drafted and unsigned — not on the site. "
              f"Read and sign with scripts/sign-measure.py: {', '.join(sorted(_drafts)[:4])}"
              + (f", +{len(_drafts) - 4} more" if len(_drafts) > 4 else ""))
_graded = len(MEASURE)
_openn = sum(1 for d in DISC if is_open(d["id"]))
print(f"  · the Measure: {_graded} of {_openn} open crafts graded and signed")

if ASSUME_ALL_OPEN:
    print("  !! --assume-all-open: this output is for diffing only. Do not commit it.")
