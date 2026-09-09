#!/usr/bin/env python3
"""Re-check every claim on an open craft, overnight, against the source it came from.

Arnaud, 2026-09-01: "automatically double check each skill added by night."

WHY THIS IS NOT A CHECK, AND MUST NEVER PRETEND TO BE ONE
---------------------------------------------------------
The Standard's rule 10 wants a name and a date on the check itself. This script has
neither: it is a machine reading a web page. So it writes nothing to the site, signs
nothing, and removes nothing. It fetches, compares, and reports — and the only thing
it changes in the repo is its own state file and its own report. What it produces is
EVIDENCE FOR ARNAUD, and the decision stays his. A script that quietly edited a claim
would be the exact fabrication the whole company is built to refuse.

WHAT IT ACTUALLY TESTS
----------------------
Two things, in order of value:

  1. Does the URL still resolve?  A 404 on a school's own course page is the single
     most common way an Atlas entry rots, and it is invisible from inside the repo.
     Decay is the wedge; this is the part of decay a machine can watch.

  2. Do the strings we PUBLISHED still appear on that page?  Every schoolsInfo and
     featured entry may carry `verify`: literal fragments taken from what we wrote —
     a price, a course name, a date. If we print "3,320 EUR" and the page stops
     saying 3.320, the entry is stale whether or not it still returns 200. This turns
     each published claim into a test, which is the only honest way to keep 249 of
     them current without re-reading all of them by hand.

A missing `verify` is legal and is reported as thin coverage, not as a failure: a
claim nobody wrote a test for is simply a claim nobody is watching.

⚠ A verify string must be readable ON THE URL THE ENTRY CITES. Quoting a school's
about page while linking its course page fails every night for a difference that is
not one — the sentence is true, it is just not there. If the fact and the link live on
different pages, cite the page carrying the fact you are leaning on.

TRANSIENTS
----------
One bad night is not decay — a site is down, a WAF is grumpy, a runner has no DNS.
So failures are COUNTED, in data/atlas-verify-state.json, and only a claim that has
failed on 3 separate nights is treated as real. build-atlas-pages.py reads that file
and prints those loudly. Nothing is auto-removed: taking a school down on a transient
504 would replace a stale entry with a false blank, which is worse.

WHOSE FAILURE IS IT
-------------------
A request that never became a response used to be one bucket, printed as "HTTP 0",
counted like a 404 and escalated after three nights into the section that says
"re-verify by hand and either re-date the entry or take it down". On 7 September 2026
that section held two entries and BOTH were wrong: Pokhara Yoga School had timed out on
the runner's own network and answers 200 by hand, and Innerfire's server answers 200 on
every host — its certificate is issued for `vps.innerfire.nl`, so `www.` throws a
browser warning. One was our network, one was their certificate, and neither was a
school that closed. Two schools had already been taken down on this machinery's word.

So a transport failure is now classified by WHOSE it is, and neither kind can escalate:

  unreachable — timed out, no DNS, connection refused or reset. This is as much a
      statement about the runner as about the site, and on a night when the runner
      cannot reach a fifth of the internet it is a statement about nothing at all
      (see NETWORK_SUSPECT below, which makes such a night count nothing).
  insecure — the server answered and its certificate did not match. That IS about
      their site, and a real visitor meets a full-page warning, so it is worth
      reporting every night — but the door is open, not walled up, and which of the
      two it is, is an editorial call with a name on it. Never a death.

Only the server saying the page is gone — 404, 410, or a page that no longer carries
what we published — counts towards a takedown, because only that is evidence about it.

    python3 scripts/night-check.py [--craft <id>] [--limit N] [--timeout S]

Exit 1 if any claim has now failed 3+ nights running, or if a page that used to be
fine has started 404ing. Exit 0 otherwise, so a single flaky night is not a red run.
"""
import argparse
import concurrent.futures as cf
import html as _html
import datetime as dt
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "data/atlas-verify-state.json"
REPORT = ROOT / "docs/ATLAS-NIGHTCHECK.md"
UA = ("Mozilla/5.0 (compatible; EducatedTravelerAtlasBot/1.0; "
      "+https://educatedtraveler.app/atlas/) re-checking our own citations")
FAIL_AFTER = 3
# A wall, not a grave. Thirty of the first full run's 290 claims came back 403 — a WAF
# refusing a script, not a school that closed. Counting those as failures would have
# put 30 false alarms in the first report, and a report that cries wolf is a report
# that gets muted, which costs more than the check is worth. They are listed as
# unreadable and never escalated. 404 and 410 are the opposite: the page is gone, and
# that is the decay this exists to catch.
BLOCKED = {401, 403, 429, 451}
# The server saying the page does not exist. A 5xx is the server having a bad night and
# says nothing about the entry — it still counts, so three of them in a row is still a
# finding, but it does not raise the alarm on the first evening. A 503 did exactly that
# on 9 September 2026 and the page was fine an hour later.
GONE = {404, 410}
# A night where the runner could not reach this share of the internet is not evidence
# about anybody's school, so it counts nothing at all. Both numbers have to be met: a
# short --limit run of four claims where two time out is not a broken network.
NETWORK_SUSPECT = (0.2, 8)
# The certificate errors, which are the server's. Everything else that never became a
# response — timeouts, DNS, refused and reset connections — is ours until proven
# otherwise, and that asymmetry is deliberate: the cost of calling our own bad night
# somebody's closed school is a school taken off the map, and the cost the other way is
# one line in a report that nobody had to act on.
_INSECURE = ("SSLCertVerificationError", "CERTIFICATE_VERIFY_FAILED", "certificate verify failed",
             "SSLError", "SSLEOFError", "SSLV3_ALERT", "TLSV1_ALERT", "WRONG_VERSION_NUMBER",
             "UNSAFE_LEGACY_RENEGOTIATION")


def transport_kind(note):
    """Which side of the wire the failure is on. Only called when nothing came back."""
    return "insecure" if any(m.lower() in (note or "").lower() for m in _INSECURE) else "unreachable"


# ── the data ────────────────────────────────────────────────────────────────
def load():
    src = (ROOT / "data/repertoire.js").read_text()
    disc = json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1])["disciplines"]
    unlocked = json.loads((ROOT / "data/atlas-unlocked.json").read_text())
    manifest = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text())
    open_ids = set(unlocked.get("open") or {}) | set(manifest.get("pinnedOpen") or [])
    return disc, open_ids, manifest


def manifest_claims(manifest, open_ids, only=None):
    """The claims that live in the manifest rather than the catalogue.

    A ticked skill is the strongest kind of claim on this map: we are saying a named
    school teaches a named thing, on the strength of a sentence on their page. So every
    tick carries that sentence and it is re-read here with everything else. The ladder
    itself is watched the same way — a body that renames its levels quietly rewrites
    what our whole checklist means.
    """
    out = []
    for cid, lad in (manifest.get("skillLadders") or {}).items():
        if cid not in open_ids or (only and cid != only):
            continue
        if lad.get("url"):
            out.append({"craft": cid, "where": "", "what": "ladder",
                        "name": lad.get("standard", ""), "url": lad["url"],
                        "verify": lad.get("verify") or []})
        # One row per rung as well: the body's own page for that level is where the
        # skills under it were copied from, and a level quietly renamed or dropped is
        # the way this whole checklist goes wrong without anybody noticing.
        for r in lad.get("rungs", []):
            if r.get("url"):
                out.append({"craft": cid, "where": "", "what": "rung",
                            "name": f'{lad.get("standard", "")} — {r["name"]}',
                            "url": r["url"], "verify": r.get("verify") or []})
    for cid, places in (manifest.get("courseCoverage") or {}).items():
        if cid not in open_ids or (only and cid != only):
            continue
        for place, schools in places.items():
            for school, cov in schools.items():
                if not cov.get("url"):
                    continue
                out.append({"craft": cid, "where": place, "what": "coverage",
                            "name": f'{school} — what it covers', "url": cov["url"],
                            "verify": [c["verify"] for c in cov.get("covers", [])
                                       if c.get("verify")]})
    # ── the Measure's own evidence ────────────────────────────────────────────
    # The fourth answer only lights on a URL from somebody with nothing to sell you,
    # and the build refuses the dot without one. Twenty-six of those links carry a
    # lit dot across twenty of the thirty-one graded crafts — and until now not one
    # of them was ever re-read. A festival page can 404 for a year while the dot it
    # unlocked stays full. Decay is the wedge; this is the claim class the
    # decay-catcher was pointed away from.
    #
    # `what` carries the question number so the report says which answer is at risk,
    # and `verify` is the evidence's own `what` string — the thing we said that page
    # showed. If the page no longer says it, the dot no longer stands.
    for cid, mm in (manifest.get("measure") or {}).items():
        if cid not in open_ids or (only and cid != only):
            continue
        for i, cond in enumerate(mm.get("conditions") or [], 1):
            for ev in cond.get("evidence") or []:
                if not (ev.get("url") or "").startswith(("http://", "https://")):
                    continue
                out.append({"craft": cid, "where": "", "what": f"measure q{i}",
                            "name": ev.get("what", "") or f"evidence for answer {i}",
                            "url": ev["url"],
                            "verify": [ev["what"]] if ev.get("what") else []})
    return out


def claims(disc, open_ids, only=None):
    """One row per thing we published that names a URL, on an OPEN craft only.

    A short sheet shows no schools and no prices, so nothing on it can rot in public.
    Checking all 903 URLs nightly would spend the budget on pages nobody is shown.
    """
    out = []
    for d in disc:
        if d["id"] not in open_ids or (only and d["id"] != only):
            continue
        f = d.get("featured") or {}
        if f.get("url"):
            out.append({"craft": d["id"], "where": f.get("place", ""), "what": "featured",
                        "name": f.get("school") or f.get("course", ""),
                        "url": f["url"], "verify": f.get("verify") or []})
        for a in f.get("alternatives") or []:
            if a.get("url"):
                out.append({"craft": d["id"], "where": f.get("place", ""), "what": "alternative",
                            "name": a.get("course", ""), "url": a["url"],
                            "verify": a.get("verify") or []})
        for x in d["destinations"]:
            for sch in x.get("schoolsInfo") or []:
                if sch.get("url"):
                    out.append({"craft": d["id"], "where": x["place"], "what": "school",
                                "name": sch["name"], "url": sch["url"],
                                "verify": sch.get("verify") or []})
        for r in (d.get("sweep") or {}).get("rejected") or []:
            if r.get("url"):
                out.append({"craft": d["id"], "where": r.get("place", ""), "what": "rejected",
                            "name": r["name"], "url": r["url"], "verify": r.get("verify") or []})
    out = [c for c in out if str(c["url"]).startswith(("http://", "https://"))]
    seen, uniq = set(), []
    for c in out:
        k = (c["craft"], c["url"], c["name"])
        if k not in seen:
            seen.add(k)
            uniq.append(c)
    return uniq


# ── the fetch ───────────────────────────────────────────────────────────────
_TAGS = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
# Every remaining tag becomes a space. Without this the haystack is raw HTML, so a
# phrase the page splits across two elements — "<span>Max 8</span> <span>Students</span>"
# — never matches the phrase we published, and the claim reports as broken every night
# for a difference that is not one. A check that cries wolf is a check that gets turned
# off, which is worse than not having it.
_ANYTAG = re.compile(r"<[^>]+>")


def norm(s):
    """Fold so a published string still matches a page that renders it differently.

    Accents, curly quotes, the thin and non-breaking spaces a price sits in, and the
    dot/comma a European site groups thousands with — none of those are the claim
    changing, and every one of them would fake a failure.
    """
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
                 ("–", "-"), ("—", "-"), (" ", " "), (" ", " "),
                 (" ", " "), ("€", "eur"), (".", ""), (",", "")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()


def fetch(url, timeout):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en,es,fr"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read(3_000_000)
            enc = (r.headers.get_content_charset() or "utf-8")
            return r.status, r.geturl(), raw.decode(enc, "replace")
    except urllib.error.HTTPError as ex:
        return ex.code, url, ""
    except Exception as ex:                       # DNS, TLS, timeout, redirect loop
        return 0, url, f"__ERR__{type(ex).__name__}: {ex}"


def check_one(c, timeout):
    status, final, body = fetch(c["url"], timeout)
    r = dict(c, status=status, final=final, missing=[], note="", blocked=False, kind="")
    if status == 0:
        r["note"] = body.replace("__ERR__", "")
        r["kind"] = transport_kind(r["note"])
        r["ok"] = False
        return r
    if status in BLOCKED:
        r["ok"], r["blocked"] = False, True
        return r
    if status >= 400:
        r["ok"] = False
        return r
    text = norm(_html.unescape(_ANYTAG.sub(" ", _TAGS.sub(" ", body))))
    r["missing"] = [v for v in c["verify"] if norm(v) not in text]
    r["ok"] = not r["missing"]
    return r


# ── the run ─────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--craft")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--timeout", type=float, default=25.0)
    ap.add_argument("--workers", type=int, default=8)
    a = ap.parse_args()

    disc, open_ids, manifest = load()
    rows = claims(disc, open_ids, a.craft) + manifest_claims(manifest, open_ids, a.craft)
    if a.limit:
        rows = rows[:a.limit]
    if not rows:
        print("night-check: nothing to check.")
        return 0

    today = dt.date.today().isoformat()
    state = json.loads(STATE.read_text()) if STATE.exists() else {"entries": {}}
    entries = state.setdefault("entries", {})

    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        results = list(ex.map(lambda c: check_one(c, a.timeout), rows))

    newly_dead, chronic, recovered, thin, rejects, blocked = [], [], [], [], [], []
    unreachable, insecure = [], []
    # Before any of it is believed: a night when nothing could be reached is a night
    # about the runner. The share is taken over the whole run, so one craft's --craft
    # spot check cannot trip it on two flaky links.
    _out = [r for r in results if r["kind"] == "unreachable"]
    share, floor = NETWORK_SUSPECT
    network_suspect = len(_out) >= floor and len(_out) >= share * len(results)
    for r in results:
        if r["what"] == "rejected":
            if not r["ok"]:
                rejects.append(r)
            continue
        if r.get("blocked"):
            blocked.append(r)
            continue
        key = f'{r["craft"]}|{r["name"]}'
        st = entries.setdefault(key, {"failing": 0, "url": r["url"]})
        st["url"], st["last_seen"], st["last_status"] = r["url"], today, r["status"]
        if not r["verify"]:
            # Recorded before the transport branch below returns: whether we wrote a test
            # for this claim is a fact about our own data, and stays true on a night when
            # nothing could be fetched at all.
            thin.append(r)
        if r["kind"]:
            # Counted on its own line, never against the entry. `failing` is the count
            # that can take a school off the map, and nothing on this branch is allowed
            # to touch it — a count already sitting there was made by the older check,
            # which could not tell these apart, so it is moved aside under its own name
            # rather than deleted. The record of the wrong call is the evidence the check
            # was wrong, and it stays readable.
            (insecure if r["kind"] == "insecure" else unreachable).append(r)
            if st.get("failing"):
                st["misfiled"] = {"nights": st["failing"], "as": st.get("why", ""),
                                  "note": "counted as a failing claim before this check told "
                                          "a transport error from a page that moved",
                                  "moved": today}
            st["failing"], st["why"] = 0, r["note"]
            if not network_suspect:
                st[r["kind"]] = st.get(r["kind"], 0) + 1
            continue
        # A row that answered has nothing left to say about the wire.
        st.pop("unreachable", None)
        st.pop("insecure", None)
        if r["ok"]:
            if st.get("failing"):
                recovered.append(r)
            st["failing"] = 0
            st.pop("why", None)
        else:
            was = st.get("failing", 0)
            st["failing"] = was + 1
            st["why"] = (r["note"] or (f'HTTP {r["status"]}' if r["status"] >= 400 else
                                       "no longer says: " + "; ".join(r["missing"])))
            if was == 0 and r["status"] in GONE:
                newly_dead.append(r)
            if st["failing"] >= FAIL_AFTER:
                chronic.append((r, st["failing"]))

    state["checked_at"] = today
    state["checked"] = len(results)
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(report(today, results, chronic, newly_dead, recovered, thin, rejects,
                             blocked, unreachable, insecure, network_suspect, entries))

    bad = [r for r in results if not r["ok"] and not r.get("blocked") and not r["kind"]
           and r["what"] != "rejected"]
    print(f"night-check {today}: {len(results)} claims on {len({r['craft'] for r in results})} "
          f"open crafts · {len(bad)} not confirmed · {len(chronic)} failing {FAIL_AFTER}+ nights "
          f"· {len(blocked)} unreadable (bot-blocked) · {len(thin)} with nothing to verify against")
    if unreachable or insecure:
        print(f"  · {len(unreachable)} we could not reach · {len(insecure)} whose certificate "
              "does not match — neither is a school closing, and neither escalates")
    if network_suspect:
        print(f"  ⚠ {len(unreachable)} of {len(results)} claims never answered: tonight's run is "
              "about this machine's network, so nothing was counted against any entry.")
    for r, nfail in chronic:
        print(f"  ⚠⚠ {r['craft']} — {r['name']}: {entries[f'{r['craft']}|{r['name']}']['why']} "
              f"({nfail} nights)")
    for r in newly_dead:
        print(f"  ⚠ {r['craft']} — {r['name']}: HTTP {r['status']} (first failure)")
    print(f"  report → {REPORT.relative_to(ROOT)}")
    # A flaky night is not news. A claim that has failed three nights, or a page that
    # has just started 404ing, is — and it should reach a phone, which a red run does.
    return 1 if (chronic or newly_dead) else 0


def report(today, results, chronic, newly_dead, recovered, thin, rejects, blocked,
           unreachable=(), insecure=(), network_suspect=False, entries=None):
    def rows_for(rs, fn):
        return "\n".join(fn(r) for r in rs) or "_none._"

    def _nights(r):
        """How long this has been the answer, and what the older check made of it."""
        st = (entries or {}).get(f'{r["craft"]}|{r["name"]}') or {}
        n = st.get(r["kind"], 0)
        was = (st.get("misfiled") or {}).get("nights")
        out = f"{n} night{'s' if n != 1 else ''}" if n else ""
        if was:
            out += f"{', ' if out else ''}after {was} counted as failing by the older check"
        return f"{out} — " if out else ""
    crafts = sorted({r["craft"] for r in results})
    out = [
        "# Atlas night check",
        "",
        f"_{today} — {len(results)} published claims re-read against the pages they came "
        f"from, across {len(crafts)} open crafts._",
        "",
        *(["> **Tonight's run reached almost nothing, so nothing was counted.** "
           f"{len([r for r in results if r['kind'] == 'unreachable'])} of {len(results)} "
           "claims never got a response, which is a statement about the machine that ran "
           "this, not about the pages. Read nothing below as decay.", ""]
          if network_suspect else []),
        "This file is written by `scripts/night-check.py`. It is **not a check** in the "
        "sense rule 10 means: no name, no visit, no judgement. It is a machine noticing "
        "that a page moved. Nothing here has been changed on the site — that is Arnaud's "
        "call, every time.",
        "",
        f"## Failing {FAIL_AFTER} nights or more — decide on these",
        "",
        "Three nights is past a bad evening. Re-verify by hand and either re-date the "
        "entry or take it down. The Standard does not allow a third option: an entry "
        "that cannot be confirmed is not softened, it comes off.",
        "",
        "**Only the server's own answer reaches this list** — a 404, a 410, or a page "
        "that no longer carries what we published. A request that never became a "
        "response is two sections down and is not a takedown: on 7 September 2026 this "
        "section held two entries and both were wrong, one a timeout on our own runner "
        "and one a certificate that did not match a hostname.",
        "",
        rows_for([c[0] for c in chronic],
                 lambda r: f"- **{r['craft']} · {r['name']}** — {r['url']}"
                           + (f"\n  - page no longer says: {'; '.join(r['missing'])}" if r["missing"]
                              else f"\n  - HTTP {r['status']} {r['note']}".rstrip())),
        "",
        "## Gone tonight — the server says the page does not exist",
        "",
        "A 404 or a 410 on the first evening, which is the one failure worth waking up "
        "for: the others are counted and wait for the third night.",
        "",
        rows_for(newly_dead, lambda r: f"- {r['craft']} · {r['name']} — HTTP {r['status']} — {r['url']}"),
        "",
        "## We could not reach these — as much about us as about them",
        "",
        "Timed out, no DNS, or the connection was refused. Nothing came back, so there "
        "is nothing here about the school: the runner's own network fails this way, and "
        "has. Never escalated, never a reason to take an entry down. Open one in a "
        "browser — that is the only thing that settles it.",
        "",
        rows_for(unreachable, lambda r: f"- {r['craft']} · {r['name']} — {_nights(r)}{r['note']}"
                                        f"\n  - {r['url']}"),
        "",
        "## Their certificate does not match — an editorial call, not a death",
        "",
        "The server answered; its certificate is issued for another name, so a visitor "
        "meets a full-page browser warning before they meet the school. The door is "
        "open and the sign on it is broken. Whether an entry can stand behind a wall a "
        "reader has to click through is a judgement with a name on it, and it is not "
        "this script's.",
        "",
        rows_for(insecure, lambda r: f"- **{r['craft']} · {r['name']}** — {_nights(r)}{r['url']}"
                                     f"\n  - {r['note']}"),
        "",
        "## Back to normal",
        "",
        rows_for(recovered, lambda r: f"- {r['craft']} · {r['name']}"),
        "",
        "## Unreadable, not gone",
        "",
        "These answered with a 401, 403, 429 or 451 — a firewall refusing a script, not a "
        "school that closed. Never escalated, because a check that cries wolf gets muted. "
        "If one matters, open it in a browser; that is the only way to know.",
        "",
        rows_for(blocked[:40], lambda r: f"- {r['craft']} · {r['name']} — HTTP {r['status']}"),
        "",
        (f"_{len(blocked)} in total._" if len(blocked) > 40 else ""),
        "",
        "## Places we turned down, whose page did not answer",
        "",
        "Informational, never escalated. A rejected place going offline is usually the "
        "reason it was rejected. What would matter here is the opposite — one coming back "
        "— and no status code can tell you that.",
        "",
        rows_for(rejects, lambda r: f"- {r['craft']} · {r['name']} — {r['note'] or ('HTTP ' + str(r['status']))}"),
        "",
        "## Claims with nothing to verify against",
        "",
        "These resolve, and that is all we know: no `verify` strings, so the page could "
        "have replaced the course, the price and the dates and this would still pass. "
        "Adding two or three literal fragments from what we published is what turns an "
        "entry into something a machine can keep honest.",
        "",
        rows_for(thin[:60], lambda r: f"- {r['craft']} · {r['where']} · {r['name']}"),
        "",
        f"_{len(thin)} in total._" if len(thin) > 60 else "",
    ]
    return "\n".join(out).rstrip() + "\n"


if __name__ == "__main__":
    sys.exit(main())
