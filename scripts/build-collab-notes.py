#!/usr/bin/env python3
"""Fills the collaboration-notes blocks in the pages from scripts/collab-notes/*.json.

A note is shown only because its writer ticked "you can show my note, my moment, my
sticker and my Instagram" on /barcelona-notes. To add one: add it to the JSON, put its
photo under website/images/collab/<week>/, run this, ship the pages.

  python3 scripts/build-collab-notes.py            rewrite the blocks
  python3 scripts/build-collab-notes.py --check    exit 1 if a page is out of date

Blocks sit between <!--collab-notes:NAME--> and <!--/collab-notes:NAME-->:
  tally   the five figures (no page shows them: Arnaud, 4 Nov 2026)
  cards   every note in full (the /barcelona page)
  pull    the three opening lines, each a verbatim excerpt ("pull" in the JSON)
  faces   every writer's sticker, no words (the room, on /barcelona)
  strip   every note as a small sticker with one line (the landing page)
  voices  every note in full, alternating sides, then the tally (/collaborations)

A note may come without a photo ("photo": ""): its sticker then shows the
writer's initial on the film, never a stand-in picture.
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "website"
DATA = ROOT / "scripts/collab-notes/lab-week-01.json"
PAGES = {
    "barcelona.html": ("pull", "faces", "cards"),
    "collaborations.html": ("voices",),
    "index.html": ("strip",),
}
e = lambda s: html.escape(s or "", quote=True)


def load():
    d = json.loads(DATA.read_text())
    for n in d["notes"]:
        assert re.fullmatch(r"[A-Za-z0-9._]{1,30}", n["handle"]), n["id"]
        assert not n["photo"] or (SITE / n["photo"].lstrip("/")).is_file(), "photo missing: " + n["photo"]
        assert not n["photo"] or n["alt"].strip(), n["id"] + ": a photo needs its alt"
        assert n["line"] in (n["note"] or n["moment"]) or n["line"] in n["moment"], \
            f'{n["id"]}: "line" must be a verbatim excerpt'
        assert n["moment"].strip() or n["note"].strip(), n["id"]
    ids = {n["id"]: n for n in d["notes"]}
    for q in d.get("pull", []):
        n = ids[q["id"]]
        assert q["text"] in n["note"] or q["text"] in n["moment"], q["id"] + ': "pull" must be a verbatim excerpt'
    return d


def pull(d):
    ids = {n["id"]: n for n in d["notes"]}
    out = []
    for q in d["pull"]:
        n = ids[q["id"]]
        who = f' &middot; {e(n["who"])}' if n["who"].strip() else ""
        face = (f'<img src="{e(n["photo"])}" alt="" loading="lazy">' if n["photo"]
                else f'<span class="pq-i" aria-hidden="true">{e(n["name"].strip()[:1])}</span>')
        out.append(f'<figure class="pq"><blockquote><p>{e(q["text"])}</p></blockquote>'
                   f'<figcaption>{face}<span><b>{e(n["name"])}</b>{who}</span></figcaption></figure>')
    return '<div class="pq-list">' + "".join(out) + "</div>"


def sticker(n, extra=""):
    who = f'<i>{e(n["who"])}</i>' if n["who"].strip() else ""
    film = (f'<div class="cn-film"><img src="{e(n["photo"])}" alt="{e(n["alt"])}" loading="lazy"></div>' if n["photo"]
            else f'<div class="cn-film cn-none" aria-hidden="true"><span>{e(n["name"].strip()[:1])}</span></div>')
    return (f'<figure class="cn-sticker{extra}">'
            f'{film}'
            f'<figcaption><b>{e(n["name"])}</b>'
            f'<small><a href="https://www.instagram.com/{e(n["handle"])}/" rel="noopener">@{e(n["handle"])}</a></small>'
            f'{who}<span class="cn-foot">Collaboration 01 · Vakuum, Barcelona · October 2026</span></figcaption></figure>')


def paras(text):
    return "".join(f"<p>{e(p)}</p>" for p in text.split("\n") if p.strip())


def words(n, label=True):
    if not n["note"].strip():
        return f'<p class="cn-k">In their words</p><blockquote class="cn-only">{paras(n["moment"])}</blockquote>'
    k = '<p class="cn-k">Their note</p>' if label else ""
    return (f'<p class="cn-k">What they will remember</p><p class="cn-moment">{e(n["moment"])}</p>'
            f'{k}<blockquote>{paras(n["note"])}</blockquote>')


def card(n):
    return f'<article class="cn-card">{sticker(n)}<div class="cn-words">{words(n)}</div></article>'


def voice(i, n):
    a, b = ("from-right", "from-left") if i % 2 else ("from-left", "from-right")
    return (f'<article class="cx-voice{" flip" if i % 2 else ""}">{sticker(n, " reveal " + a)}'
            f'<div class="cn-words cx-words reveal {b}">{words(n, label=False)}</div></article>')


def mini(n):
    return f'<figure class="cn-mini">{sticker(n)}<p class="cn-line">&ldquo;{e(n["line"])}&rdquo;</p></figure>'


def tally(d, style=""):
    ns = d["notes"]; N = len(ns)
    a = lambda k, *v: sum(1 for n in ns if n["answers"].get(k) in v)
    figs = [
        (a("person", "all", "most"), "said most or all of the teaching came from Martin himself"),
        (a("place", "a-lot"), "said learning in his own lab changed the week a lot"),
        (a("people", "friends"), "call the room friends they will keep"),
        (a("bubble", "completely", "mostly"), "said everything else dropped away, completely or mostly"),
        (a("again", "yes-first"), "want another collaboration, and want to hear first"),
    ]
    cells = "".join(f"<div><b>{k} of {N}</b><span>{e(t)}</span></div>" for k, t in figs)
    r = " reveal" if style else ""
    return (f'<div class="cn-tally{r}"{style}>{cells}</div>'
            f'<p class="cn-count{r}">{N} notes in so far &middot; {d["invited"]} chefs were asked to write one &middot; '
            'this page grows as the rest arrive</p>')


def blocks(d):
    return {"tally": tally(d),
            "cards": '<div class="cn-list">' + "".join(card(n) for n in d["notes"]) + "</div>",
            "voices": "".join(voice(i, n) for i, n in enumerate(d["notes"])),
            "pull": pull(d),
            "faces": '<div class="cn-faces">' + "".join(sticker(n) for n in d["notes"]) + "</div>",
            "strip": '<div class="cn-strip">' + "".join(mini(n) for n in d["notes"]) + "</div>"}


def fill(text, name, body):
    pat = re.compile(rf"(<!--collab-notes:{name}-->)(.*?)(<!--/collab-notes:{name}-->)", re.S)
    if not pat.search(text):
        raise SystemExit(f"marker collab-notes:{name} missing")
    return pat.sub(lambda m: m.group(1) + "\n" + body + "\n" + m.group(3), text, count=1)


def main():
    d = load(); b = blocks(d); stale = []
    for page, names in PAGES.items():
        p = SITE / page; t = old = p.read_text()
        for name in names:
            t = fill(t, name, b[name])
        if t != old:
            stale.append(page)
            if "--check" not in sys.argv:
                p.write_text(t)
    if "--check" in sys.argv:
        print("out of date: " + ", ".join(stale) if stale else "collab-notes: pages are current")
        sys.exit(1 if stale else 0)
    print("collab-notes: wrote " + (", ".join(stale) if stale else "nothing (already current)"))


main()
