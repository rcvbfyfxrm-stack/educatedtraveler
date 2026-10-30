#!/usr/bin/env python3
"""Fills the collaboration-notes blocks in the pages from scripts/collab-notes/*.json.

A note is shown only because its writer ticked "you can show my note, my moment, my
sticker and my Instagram" on /barcelona-notes. To add one: add it to the JSON, put its
photo under website/images/collab/<week>/, run this, ship the pages.

  python3 scripts/build-collab-notes.py            rewrite the blocks
  python3 scripts/build-collab-notes.py --check    exit 1 if a page is out of date

Blocks sit between <!--collab-notes:NAME--> and <!--/collab-notes:NAME-->:
  tally   the five figures and the "N notes in so far" line
  cards   every note in full (the /barcelona page)
  strip   every note as a small sticker with one line (landing and /collaborations)
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "website"
DATA = ROOT / "scripts/collab-notes/lab-week-01.json"
PAGES = {
    "barcelona.html": ("tally", "cards"),
    "collaborations.html": ("strip",),
    "index.html": ("strip",),
}
e = lambda s: html.escape(s or "", quote=True)


def load():
    d = json.loads(DATA.read_text())
    for n in d["notes"]:
        assert re.fullmatch(r"[A-Za-z0-9._]{1,30}", n["handle"]), n["id"]
        assert (SITE / n["photo"].lstrip("/")).is_file(), "photo missing: " + n["photo"]
        assert n["line"] in (n["note"] or n["moment"]) or n["line"] in n["moment"], \
            f'{n["id"]}: "line" must be a verbatim excerpt'
        assert n["moment"].strip() or n["note"].strip(), n["id"]
    return d


def sticker(n):
    who = f'<i>{e(n["who"])}</i>' if n["who"].strip() else ""
    return ('<figure class="cn-sticker">'
            f'<div class="cn-film"><img src="{e(n["photo"])}" alt="{e(n["alt"])}" loading="lazy"></div>'
            f'<figcaption><b>{e(n["name"])}</b>'
            f'<small><a href="https://www.instagram.com/{e(n["handle"])}/" rel="noopener">@{e(n["handle"])}</a></small>'
            f'{who}<span class="cn-foot">Collaboration 01 · Vakuum, Barcelona · October 2026</span></figcaption></figure>')


def paras(text):
    return "".join(f"<p>{e(p)}</p>" for p in text.split("\n") if p.strip())


def card(n):
    if n["note"].strip():
        words = (f'<p class="cn-k">What they will remember</p><p class="cn-moment">{e(n["moment"])}</p>'
                 f'<p class="cn-k">Their note</p><blockquote>{paras(n["note"])}</blockquote>')
    else:
        words = f'<p class="cn-k">In their words</p><blockquote class="cn-only">{paras(n["moment"])}</blockquote>'
    return f'<article class="cn-card">{sticker(n)}<div class="cn-words">{words}</div></article>'


def mini(n):
    return f'<figure class="cn-mini">{sticker(n)}<p class="cn-line">&ldquo;{e(n["line"])}&rdquo;</p></figure>'


def tally(d):
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
    return (f'<div class="cn-tally">{cells}</div>'
            f'<p class="cn-count">{N} notes in so far &middot; {d["invited"]} chefs were asked to write one &middot; '
            'this page grows as the rest arrive</p>')


def blocks(d):
    return {"tally": tally(d),
            "cards": '<div class="cn-list">' + "".join(card(n) for n in d["notes"]) + "</div>",
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
