#!/usr/bin/env python3
"""Unlisted validation pages — one per candidate the Hunt has found.

WHY THIS EXISTS. The sweep of 10 September found a butcher whose own site sells no
class, a cheesemaker credited with a course his farm does not run, a teacher named
on our page who died in 2016, and four dead URLs. Publishing first and correcting
later is how a record loses the only thing it has. So a candidate is now shown to
the school BEFORE it is published, and (Arnaud, 10 Sept) only a validated one is
published at all.

THE RULES BUILT IN, each one a ruling rather than a preference:

  * NOT LINKED FROM ANYWHERE. No craft page, no hub, no sitemap points here. The
    school does not appear on the public Atlas until it validates. The only way in
    is the link we send.
  * THE URL NEVER MOVES. The token is a deterministic hash of the candidate id, so
    a rebuild produces the same address and anyone we already wrote to keeps access
    for good. Never re-salt this.
  * UNLISTED, NOT SECRET, AND WE SAY SO ON THE PAGE. The repo is public: a URL
    committed to git is readable by anyone who opens it. So the page carries no
    contact details, no correspondence, nothing that is not already ours to publish
    — and it never claims to be private.
  * noindex,nofollow — and deliberately NOT a robots.txt disallow, which would stop
    a crawler reading the noindex and is the classic way to get an unlisted page
    indexed anyway.
  * WE KEEP THE PEN. There is no edit box. They confirm, or they flag a line and
    tell us why, and we write the correction. Every fact theirs; every sentence
    ours.
  * WHAT WE COULD NOT ANSWER IS PRINTED. The questions are the point: a school
    reading its own blanks answers them faster than any letter we could write.
"""
import hashlib, json, pathlib, html, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "v"
TO = "founder@educatedtraveler.app"

def token(cid: str) -> str:
    # Deterministic and permanent. Changing this string breaks every link ever sent.
    return hashlib.sha256(("et-validate-v1:" + cid).encode()).hexdigest()[:16]


def fingerprint(c) -> str:
    """A hash of WHAT WE CLAIM, not of the markup.

    Restyling a page must not trip the freeze; changing a sentence a school has
    already read must. So this covers only the substance: who we say teaches, what
    we say we would publish, what we admit we could not work out, and the sources
    we say we read it in.
    """
    payload = json.dumps({
        "craft": c["craft"], "place": c["place"], "school": c["school"],
        "teacher": c.get("teacher"),
        "weWouldPublish": c["weWouldPublish"],
        "weCouldNotAnswer": c.get("weCouldNotAnswer", []),
        "sources": c.get("sources", []),
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def freeze_check(c, data_path):
    """ONCE A LINK HAS BEEN SENT, THE PAGE IT POINTS AT IS FROZEN.

    Arnaud, 10 Sept 2026: "dont modify the one you already sent!" — and he is right
    in a way that goes past courtesy. A school validates a specific set of sentences.
    If those sentences can be rewritten afterwards, the validation refers to nothing,
    and a page somebody vouched for is no longer the page they saw.

    So: set `sent` on a candidate the day the link goes out. From that moment the
    substance is locked. Editing it does not silently republish — THE BUILD STOPS and
    names the candidate. To change it anyway you must add an `amendments` entry whose
    `fingerprint` is the new one, which puts a dated notice ON the page telling the
    reader it changed since they saw it. You may still correct a page; you may never
    correct one quietly.
    """
    sent = (c.get("sent") or "").strip()
    if not sent:
        return None                      # not sent yet: edit freely
    fp = fingerprint(c)
    if not c.get("sentFingerprint"):     # first build after it went out: record it
        c["sentFingerprint"] = fp
        print(f"  · recorded the sent state of {c['school']} ({fp}) — it is frozen from here")
        return None
    if fp == c["sentFingerprint"]:
        return None                      # unchanged
    amend = [a for a in (c.get("amendments") or []) if a.get("fingerprint") == fp]
    if not amend:
        raise SystemExit(
            f"\nbuild-validation-pages: {c['school']} has been sent, and what it says has changed.\n"
            f"  candidate : {c['id']}\n"
            f"  sent      : {sent}\n"
            f"  was       : {c['sentFingerprint']}\n"
            f"  now       : {fp}\n"
            "  A school validates sentences, not a URL. Rewriting them after the link went out\n"
            "  makes their answer refer to something that no longer exists.\n"
            "  Either put the wording back, or amend it in the open by adding to this candidate:\n"
            f'      "amendments": [{{"on": "<today>", "what": "<what changed, plainly>", "fingerprint": "{fp}"}}]\n'
            f"  in {data_path}. The page will then say so, dated, above everything else.")
    return amend[-1]

def e(s): return html.escape(str(s or ""))

CSS = """*{box-sizing:border-box}body{margin:0;background:#0d0b09;color:#f3ede2;
font-family:Inter,-apple-system,system-ui,sans-serif;line-height:1.55;font-size:16px}
.wrap{max-width:720px;margin:0 auto;padding:44px 22px 80px}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.14em;
text-transform:uppercase;color:rgba(243,237,226,.55)}
h1{font-family:Fraunces,Georgia,serif;font-size:30px;line-height:1.18;margin:10px 0 6px;font-weight:600}
h2{font-family:Fraunces,Georgia,serif;font-size:19px;margin:34px 0 10px;font-weight:600}
.sub{color:#7fa8a5;font-size:17px;margin:0 0 26px}
.card{background:#14110d;border:1px solid rgba(243,237,226,.13);border-radius:10px;padding:20px 22px;margin:14px 0}
ul{margin:10px 0;padding-left:20px}li{margin:8px 0}
.q li{color:#d28a52}
a{color:#7fa8a5}
.btn{display:inline-block;border:1px solid rgba(243,237,226,.3);border-radius:8px;
padding:13px 20px;margin:8px 10px 8px 0;text-decoration:none;color:#f3ede2;font-size:15px}
.btn.yes{border-color:#7fa8a5}.btn.no{border-color:#d28a52}
.src{font-size:13.5px;color:rgba(243,237,226,.7)}
footer{margin-top:44px;border-top:1px solid rgba(243,237,226,.13);padding-top:18px;
font-size:13px;color:rgba(243,237,226,.55)}"""

def mailto(subject, body):
    from urllib.parse import quote
    return f"mailto:{TO}?subject={quote(subject)}&body={quote(body)}"

def page(c, amend=None):
    name = c["school"]; craft = c["craft"]; place = c["place"]
    lines = "".join(f"<li>{e(x)}</li>" for x in c["weWouldPublish"])
    qs = "".join(f"<li>{e(x)}</li>" for x in c.get("weCouldNotAnswer", []))
    srcs = "".join(f'<li class="src">{e(s["what"])} — <a href="{e(s["url"])}">{e(s["url"])}</a>, read {e(s["read"])}</li>'
                   for s in c.get("sources", []))
    teacher = f'<p class="mono">Teacher we would name: {e(c["teacher"])}</p>' if c.get("teacher") else \
              '<p class="mono">We name no teacher — we could not establish one</p>'
    yes = mailto(f"Correct — {name}",
        f"About the EducatedTraveler entry for {name}.\n\nThe page is right as written.\n\n"
        "If you would like anything added, put it below and we will consider it.\n\n")
    no = mailto(f"A correction — {name}",
        f"About the EducatedTraveler entry for {name}.\n\n"
        "This line is wrong:\n\n  (paste the line)\n\nWhat is actually true:\n\n\n"
        "And, if you have a moment, the things we could not work out:\n\n"
        + "".join(f"  - {q}\n" for q in c.get("weCouldNotAnswer", [])) + "\n")
    photo_html = ""
    if c.get("photoWeWouldAskFor"):
        pm = mailto(f"Photographs — {name}",
            f"About the EducatedTraveler entry for {name}.\n\n"
            "You are welcome to use these:\n\n  (attach them, or send a link)\n\n"
            "  [ ] the place\n  [ ] whoever teaches\n  [ ] the technique\n"
            "  [ ] people learning - everyone in shot has agreed\n  [ ] the one move\n\n"
            "Or: you may use what we have already posted publicly.  [ ] yes\n\n"
            "Credit them to:\n\n  (the name you would like under them)\n\n")
        photo_html = ('<h2>And photographs, if you would</h2><div class="card">'
                      f'<p style="margin-top:0">{e(c["photoWeWouldAskFor"])}</p>'
                      '<p>If you have others, these are the five that would let a chef see what the '
                      'week actually is — one of each is plenty:</p>'
                      '<ul>'
                      '<li><strong>The place.</strong> The building, the room, the town it sits in.</li>'
                      '<li><strong>Whoever teaches.</strong> At work rather than posed, if there is a choice.</li>'
                      '<li><strong>The technique.</strong> Hands doing the thing, close.</li>'
                      '<li><strong>People learning.</strong> The bench with somebody at it. '
                      '<em>Only if the people in it have agreed</em> — we would rather have no '
                      'picture than one somebody did not consent to.</li>'
                      '<li><strong>The one move.</strong> The gesture that <em>is</em> the craft — '
                      'the thing a stranger would recognise it by.</li>'
                      '</ul>'
                      '<p class="src">We will not take one off your website. Photographs are yours, '
                      'and the only ones on our record are the ones a school chose and sent. You pick '
                      'them, you tell us how to credit them, and you see where they go before they go '
                      'anywhere. <strong>Sending them does not move you up the record</strong> — '
                      'nothing does.</p>'
                      '<p class="src">If it is easier: tell us we may use what you have already '
                      'posted, and we will credit it to you and link back. That costs you nothing to '
                      'find.</p>'
                      f'<p><a class="btn" href="{pm}">Send photographs</a></p></div>')
    amend_html = ""
    if amend:
        amend_html = ('<div class="card" style="border-left:3px solid #d28a52">'
                      '<p class="mono">Changed since you last saw this</p>'
                      f'<p style="margin:8px 0 0">{e(amend.get("what"))}'
                      f'<br><span class="src">Amended {e(amend.get("on"))}.</span></p></div>')
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>{e(name)} — what EducatedTraveler would publish</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body><div class="wrap">
{amend_html}<p class="mono">EducatedTraveler · before we publish</p>
<h1>{e(name)}</h1>
<p class="sub">{e(craft)} · {e(place)}</p>

<p>We keep a free record of where crafts are still taught at the source. We would like to
put you on it, and we would rather you saw it first. <strong>Nothing below is published yet.</strong></p>
<p>Nobody pays to be on the record — no advertising, no commission, no booking fee — and
sending us a correction will not move you up it.</p>

<h2>What we would publish</h2>
<div class="card">{teacher}<ul>{lines}</ul></div>

<h2>What we could not work out</h2>
<div class="card"><ul class="q">{qs}</ul>
<p class="src">These are printed because they are the honest state of what we know. If you
answer them we will say so, with the date.</p></div>

<h2>Where we read it</h2>
<div class="card"><ul>{srcs}</ul></div>

{photo_html}<h2>Is it right?</h2>
<p><a class="btn yes" href="{yes}">This is right</a>
<a class="btn no" href="{no}">Something here is wrong</a></p>
<p class="src">There is no edit box on purpose. You tell us what is true and we write the
line — every fact yours, every sentence ours. That is what keeps the record a record
rather than a page of self-descriptions.</p>

<footer>
<p>This page is <strong>unlisted, not secret</strong>: nothing on our site links to it, and search
engines are asked not to index it — but the address is readable by anyone you forward it to,
so we have kept every name, address and message off it.</p>
<p>The link does not expire. It will still work whenever you come back to it.</p>
</footer></div></body></html>"""

def main():
    dp = ROOT / "data" / "atlas-candidates.json"
    data = json.loads(dp.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    pending = published = 0
    before = json.dumps(data, ensure_ascii=False, sort_keys=True)
    print("validation pages — nothing here is linked from the site")
    for c in data["candidates"]:
        amend = freeze_check(c, dp)
        t = token(c["id"])
        (OUT / f"{t}.html").write_text(page(c, amend), encoding="utf-8")
        v = c.get("validated") or {}
        state = "VALIDATED" if v.get("on") else "awaiting"
        if v.get("on"): published += 1
        else: pending += 1
        print(f"  {state:9s} /v/{t}  {c['school']}")
    print(f"  {published} validated (publishable) · {pending} awaiting the school")
    after = json.dumps(data, ensure_ascii=False, sort_keys=True)
    if after != before:                  # a first-send fingerprint was recorded
        dp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Prune pages whose candidate is gone — but NEVER one that was sent. A link
    # already in somebody's inbox must not start 404ing because we changed our mind;
    # a candidate that was sent and then set aside keeps its page and gets a
    # withdrawal note instead. Nothing has been sent yet, so this only tidies drafts.
    live = {token(c["id"]) for c in data["candidates"]}
    ever_sent = {token(a["id"]) for a in data.get("setAside", []) if (a.get("sent") or "").strip()}
    for f in sorted(OUT.glob("*.html")):
        if f.stem in live or f.stem in ever_sent:
            continue
        f.unlink()
        print(f"  pruned    /v/{f.stem}  (set aside, never sent)")
    for a in data.get("setAside", []):
        if (a.get("sent") or "").strip():
            print(f"  ⚠ KEPT     /v/{token(a['id'])}  {a['school']} — set aside AFTER it was sent; "
                  "the page stays and owes a withdrawal note")
    sent = sum(1 for c in data["candidates"] if (c.get("sent") or "").strip())
    if sent:
        print(f"  {sent} page(s) frozen because the link has gone out")
    if published == 0:
        print("  · nothing is publishable yet, which is the point: only a validated entry goes on the Atlas")

if __name__ == "__main__":
    main()
