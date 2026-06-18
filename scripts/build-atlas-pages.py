#!/usr/bin/env python3
"""Build static, indexable Atlas pages from website/js/repertoire.js.

Emits:
  website/atlas/index.html                    — hub (all disciplines by core)
  website/atlas/<discipline-id>.html          — one per discipline (99)
  website/atlas/<destination-id>.html         — one per discipline x destination (324)
  website/sitemap.xml, website/robots.txt

Strategy lock (CLAUDE.md): NO prices, NO booking. Every page CTA -> the Circle (/#circle).
Re-run after regenerating repertoire.js. Idempotent: wipes website/atlas/ first.
"""
import json, html, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://educatedtraveler.app"
OUT = ROOT / "website" / "atlas"

# Privacy-light, cookieless analytics (no consent banner needed). Keep in sync with the
# hand-built pages — see scripts/add-analytics.py.
ANALYTICS = '<script defer data-domain="educatedtraveler.app" src="https://plausible.io/js/script.js"></script>'

src = (ROOT / "website/js/repertoire.js").read_text()
DATA = json.loads(src[src.index("{", src.index("window.ET_ATLAS")):src.rindex("}") + 1])
DISC = DATA["disciplines"]

# Real, cited public ratings (window.ET_RATINGS) — the trust layer. Keyed by discipline id;
# each entry names the matched school + destId. We show a star NUMBER only for clean
# first-party sources with a working link; self-flagged aggregated/indirect sources render
# as the qualitative reason only. Never fabricated; always linked so readers can verify.
RSRC = ROOT / "website/js/atlas-ratings.js"
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
    line = ""
    if r.get("stars") and r.get("url") and _clean_source(r.get("source")):
        cnt = f' · {r["count"]} reviews' if r.get("count") else ""
        line = (f'<p style="margin-bottom:12px"><span class="dots">★</span> '
                f'<strong style="font-weight:500">{e(str(r["stars"]))}/5</strong>{e(cnt)} on '
                f'<a class="school-url" rel="nofollow noopener" target="_blank" href="{e(r["url"])}">{e(r["source"])} ↗</a> '
                f'<span class="meta">— don\'t take my word, check it yourself</span></p>')
    if not (line or why):
        return ""
    head = "Why this school — real and cited, not my opinion dressed up"
    return (f'<section><div class="wrap" style="max-width:720px"><div class="mono">{head}</div>'
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
}
ROLE_LABELS = {"source": "Birthplace of the discipline", "scene": "Strong living community", "both": "Birthplace & living capital"}

e = html.escape

# Founder-voice trust block — appears small at the bottom of every Atlas page.
# Voice: Arnaud, first person, plain, no hype. No fabricated ratings — only what
# we can stand behind. The reader's 5 questions sit in <details> to stay compact.
TRUST_HTML = """<section style="border-top:1px solid var(--line);background:var(--ink2)">
<div class="wrap" style="max-width:720px">
<div class="mono">Why you can trust this map</div>
<h2 style="font-size:20px;margin:8px 0 14px">What I check before I send you anywhere</h2>
<p style="opacity:.82;font-size:15px;margin-bottom:16px">I'm Arnaud. I left school at 18 to find out what the world was really about, and I've been crossing it by sea and by land ever since — cooking for a living, and learning from the masters I met along the way. So I know the difference between a real school and a good-looking website. Nobody pays to be on the Atlas: no commission, no selling the trip. The order is the strength of the community, never the size of the wallet. Most pages I've checked by hand; the few I'm still verifying say so. And if I wouldn't send a friend, it isn't on the map.</strong></li>
</ul>
<details style="margin-top:18px">
<summary style="cursor:pointer;color:var(--sea);font-size:14px">Before you trust any school — mine or anyone else's — ask these five things</summary>
<ol style="font-size:14px;opacity:.84;margin:14px 0 0 18px;line-height:1.75">
<li>Who actually teaches it? Can you find them by name, with a track record you can check yourself?</li>
<li>Is the craft alive in that place, or is the school the only thing there? A real scene has more than one good option.</li>
<li>What exactly do you walk away with — a recognised qualification, or a certificate they printed themselves? Ask which.</li>
<li>Can you speak to someone who did the course? A real person, not a testimonial on their own page.</li>
<li>What happens on a bad day — weather, an injury, a teacher who doesn't show? A serious place has an honest answer.</li>
</ol>
<p style="font-size:13px;opacity:.6;margin-top:12px">If a place dodges these, that's your answer. It costs you nothing to ask, and it tells you everything.</p>
</details>
</div>
</section>"""

def page(title, desc, canonical_path, body, breadcrumbs=None, jsonld=None):
    crumbs = ""
    if breadcrumbs:
        items = [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(breadcrumbs)]
        crumbs = '<script type="application/ld+json">%s</script>' % json.dumps(
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})
    extra = '<script type="application/ld+json">%s</script>' % json.dumps(jsonld) if jsonld else ""
    return f"""<!DOCTYPE html>
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
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
{crumbs}{extra}
{ANALYTICS}
<style>
:root {{ --ink:#0d0b09; --ink2:#14110d; --paper:#f3ede2; --sea:#7fa8a5; --ember:#d28a52; --line:rgba(243,237,226,0.09); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family:'Inter',system-ui,sans-serif; background:var(--ink); color:var(--paper); font-weight:300; line-height:1.65; -webkit-font-smoothing:antialiased; }}
.serif {{ font-family:'Fraunces',Georgia,serif; }}
.mono {{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--sea); }}
a {{ color:inherit; }}
.wrap {{ max-width:880px; margin:0 auto; padding:0 24px; }}
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
.badge {{ display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.06em; border:1px solid rgba(243,237,226,.18); border-radius:99px; padding:3px 10px; margin:0 6px 6px 0; opacity:.85; }}
.dots {{ color:var(--sea); letter-spacing:3px; }}
.meta {{ font-size:13px; opacity:.6; }}
ul.clean {{ list-style:none; }} ul.clean li {{ padding:10px 0; border-bottom:1px solid var(--line); }}
ul.clean li:last-child {{ border-bottom:none; }}
.school-url {{ font-size:13px; color:var(--sea); text-decoration:none; word-break:break-all; }} .school-url:hover {{ text-decoration:underline; }}
.cta {{ display:inline-block; margin-top:18px; padding:13px 26px; border-radius:99px; text-decoration:none; color:var(--paper); font-size:14px; font-weight:400; background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%); }}
.cta:hover {{ opacity:.92; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:12px; }}
footer {{ padding:40px 0 60px; font-size:13px; opacity:.5; }}
footer a {{ color:var(--sea); }}
</style>
</head>
<body>
<nav class="top"><div class="wrap">
<a class="brand" href="/">EDUCATEDTRAVELER</a>
<div style="display:flex;gap:22px"><a href="/atlas/">Atlas</a><a href="/about">About</a><a href="/journal/">Journal</a><a href="/#circle">The Circle</a></div>
</div></nav>
{body}
{TRUST_HTML}
<footer><div class="wrap">EducatedTraveler — a bridge, not a shop. We connect you to the place, the person, and your people — then get out of the way. <a href="/#circle">Join the Circle</a>.<br><span style="opacity:.75">We use privacy-light, cookieless analytics — no personal data, no tracking cookies.</span></div></footer>
</body>
</html>"""

def circle_cta(line):
    return (f'<p style="margin-top:8px;opacity:.78;max-width:60ch">{e(line)}</p>'
            '<a class="cta" href="/#circle">Tell us this pulls you — join the Circle</a>'
            '<p class="meta" style="margin-top:10px">No prices, no checkout, no spam. We introduce; you decide.</p>')

def dest_card(d, x, link=True):
    dots = "●" * x["communityRank"] + "○" * (5 - x["communityRank"])
    badges = "".join(f'<span class="badge">{e(BADGE_LABELS.get(b, b))}</span>' for b in x["badges"])
    title = f'{e(x["place"])}, {e(x["country"])}'
    if link:
        title = f'<a class="t" href="/atlas/{x["id"]}">{title}</a>'
    return (f'<div class="card"><div class="mono">{e(ROLE_LABELS[x["role"]])}</div>'
            f'<h2 style="margin:6px 0 4px">{title}</h2>'
            f'<div class="meta" style="margin-bottom:10px"><span class="dots">{dots}</span> {e(x["communityLabel"])} community'
            f' · Season: {e(x["bestSeason"])} · {e(x["level"])}</div>'
            f'<p style="opacity:.82;margin-bottom:12px">{e(x["why"])}</p>{badges}</div>')

shutil.rmtree(OUT, ignore_errors=True)
OUT.mkdir(parents=True)
urls = ["/atlas/"]

# ---------- destination pages ----------
for d in DISC:
    for x in d["destinations"]:
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
            if s.get("course"): inner += f'<div class="meta">{e(s["course"])}</div>'
            if s.get("blurb"): inner += f'<div style="font-size:14px;opacity:.75;margin-top:4px">{e(s["blurb"])}</div>'
            if s.get("url"): inner += f'<div style="margin-top:4px"><a class="school-url" rel="nofollow noopener" target="_blank" href="{e(s["url"])}">{e(s["url"])}</a></div>'
            rows.append(f"<li>{inner}</li>")
        if rows:
            feat = d.get("featured") or {}
            if feat.get("confidence") == "low":
                vnote = ('<p class="meta" style="margin-bottom:12px;color:var(--ember);opacity:.85">'
                         'Honest note: this one is still provisional — I\'m verifying it. Treat it as a lead worth checking, not a verdict.</p>')
            else:
                vnote = ('<p class="meta" style="margin-bottom:12px">'
                         'Checked by hand against each school\'s own course pages. No school paid to be listed.</p>')
            schools_html = f'<section><div class="wrap"><div class="mono">Where it is taught — hand-verified</div><h2>Schools in {e(x["place"])}</h2>{vnote}<ul class="clean">{"".join(rows)}</ul></div></section>'

        masters_html = ""
        if x["masters"]:
            masters_html = ('<section><div class="wrap"><div class="mono">The lineage</div><h2>Masters & lineage</h2><ul class="clean">'
                            + "".join(f"<li>{e(m)}</li>" for m in x["masters"]) + "</ul></div></section>")

        siblings = [s for s in d["destinations"] if s["id"] != x["id"]]
        sib_html = ""
        if siblings:
            links = "".join(f'<div class="card" style="padding:14px 18px"><a class="t" style="text-decoration:none" href="/atlas/{s["id"]}">{e(s["place"])}, {e(s["country"])}</a><div class="meta"><span class="dots">{"●"*s["communityRank"]}{"○"*(5-s["communityRank"])}</span> {e(s["communityLabel"])}</div></div>' for s in sorted(siblings, key=lambda s: -s["communityRank"]))
            sib_html = f'<section><div class="wrap"><div class="mono">Same discipline, other sources</div><h2>Also for {e(d["discipline"])}</h2><div class="grid">{links}</div></div></section>'

        cred = ""
        if d.get("goldCredential"):
            cred = f'<p class="meta" style="margin-top:10px">Gold credential: <strong style="opacity:.9">{e(d["goldCredential"])}</strong>{" · Certifying body: " + e(d["certBody"]) if d.get("certBody") else ""}</p>'

        jsonld = {"@context": "https://schema.org", "@type": "Place",
                  "name": f'{x["place"]}, {x["country"]}',
                  "description": x["why"],
                  "url": SITE + path,
                  "containedInPlace": {"@type": "Country", "name": x["country"]}}

        body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a> / <a href="/atlas/{d['id']}" style="text-decoration:none">{e(d['discipline'])}</a></div>
<h1>Learn {e(d['discipline'])} in {e(x['place'])}</h1>
<p class="lead">{e(x['why'])}</p>{cred}
</div></header>
<section><div class="wrap">{dest_card(d, x, link=False)}{circle_cta(f"We are mapping the strongest communities on earth for {d['discipline']}. If {x['place']} pulls you, raise your hand — we will introduce you to the school and the people going.")}</div></section>
{rating_block(d, x)}{schools_html}{masters_html}{sib_html}"""
        (OUT / f'{x["id"]}.html').write_text(page(title, desc, path, body,
            breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], f'/atlas/{d["id"]}'), (x["place"], path)], jsonld=jsonld))

# ---------- discipline pages ----------
for d in DISC:
    title = f'{d["discipline"]} — where to learn it at the source ({len(d["destinations"])} destinations)'
    desc = (d["blurb"][:155] + "…") if len(d["blurb"]) > 156 else d["blurb"]
    path = f'/atlas/{d["id"]}'
    urls.append(path)
    cards = "".join(dest_card(d, x) for x in sorted(d["destinations"], key=lambda x: -x["communityRank"]))
    cred = f'<p class="meta" style="margin-top:10px">Gold credential: <strong style="opacity:.9">{e(d.get("goldCredential",""))}</strong>{" · " + e(d["certBody"]) if d.get("certBody") else ""}</p>' if d.get("goldCredential") else ""
    body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a> / {e(CORES[d['category']][0])}</div>
<h1>{e(d['discipline'])}</h1>
<p class="lead">{e(d['blurb'])}</p>{cred}
</div></header>
<section><div class="wrap"><div class="mono">Ranked by community strength — not by who pays</div><h2 style="margin-bottom:18px">Where the community gathers</h2>{cards}{circle_cta(f"Tell us {d['discipline']} pulls you and we will introduce you to the right place and the right people.")}</div></section>"""
    (OUT / f'{d["id"]}.html').write_text(page(title, desc, path, body,
        breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], path)]))

# ---------- hub ----------
sections = ""
for core, (label, tag) in CORES.items():
    ds = sorted([d for d in DISC if d["category"] == core], key=lambda d: d["discipline"])
    links = "".join(f'<div class="card" style="padding:14px 18px"><a class="t" style="text-decoration:none" href="/atlas/{d["id"]}">{e(d["discipline"])}</a><div class="meta">{len(d["destinations"])} destinations</div></div>' for d in ds)
    sections += f'<section><div class="wrap"><div class="mono">{e(label)} — {e(tag)}</div><div class="grid" style="margin-top:16px">{links}</div></div></section>'
n_dest = sum(len(d["destinations"]) for d in DISC)
hub_body = f"""<header class="hero"><div class="wrap">
<div class="mono">The Atlas</div>
<h1>{len(DISC)} disciplines. {n_dest} places where they are truly alive.</h1>
<p class="lead">A living map of real skills and the destinations whose communities carry them — ranked by the strength of the community that gathers there, never by who pays. Hand-verified schools, named lineages, no prices, no checkout.</p>
</div></header>{sections}
<section><div class="wrap">{circle_cta("The Atlas grows every month. Join the Circle and we will tell you when your discipline or destination lands.")}</div></section>"""
(OUT / "index.html").write_text(page(
    f"The Atlas — {len(DISC)} disciplines x {n_dest} destinations to learn at the source | EducatedTraveler",
    "A community-ranked atlas of real skills and the places where they live: verified schools, masters and lineages across the world. No prices, no checkout — a map.",
    "/atlas/", hub_body, breadcrumbs=[("Atlas", "/atlas/")]))

# ---------- sitemap + robots ----------
static_urls = ["/", "/about", "/community"]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in static_urls + urls:
    sm.append(f"<url><loc>{SITE}{u}</loc></url>")
sm.append("</urlset>")
(ROOT / "website/sitemap.xml").write_text("\n".join(sm))
(ROOT / "website/robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cmd\nSitemap: {SITE}/sitemap.xml\n")

print(f"Built {len(DISC)} discipline pages + {n_dest} destination pages + hub -> {OUT}")
print(f"sitemap.xml: {len(static_urls) + len(urls)} URLs · robots.txt written")
