#!/usr/bin/env python3
"""Build static, indexable Atlas pages from website/js/repertoire.js.

Emits:
  website/atlas/index.html                    — hub (all disciplines by core)
  website/atlas/<discipline-id>.html          — one per discipline (99)
  website/atlas/<destination-id>.html         — one per discipline x destination (324)
  website/sitemap.xml, website/robots.txt

Prices (2026-06-19 owner override): the Atlas now shows a verified, cited price-START for the
best course + cheaper/shorter "Other ways in" alternatives. Still no on-site booking; every CTA
-> the Circle (/#circle). Prices are research-verified or "price on request" — never fabricated.
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
<p style="opacity:.82;font-size:15px;margin-bottom:16px">I'm Arnaud. I cook for a living, and I've spent fifteen years on the water — so I know the difference between a real school and a good-looking website. I built the Atlas because I got tired of the second kind. Here is what a place has to clear before it goes on here, and what I'll tell you straight when it doesn't.</p>
<ul class="clean" style="font-size:14.5px">
<li><strong style="font-weight:500">The craft is actually alive there.</strong> A working scene, with people who do this every day — not a demo put on for visitors.</li>
<li><strong style="font-weight:500">There's a real teacher behind it.</strong> Named, still practising, and certified where the craft has certificates.</li>
<li><strong style="font-weight:500">The credential is what it claims to be.</strong> A state diploma and a certificate a school prints itself are not the same thing. I check which, and I say which.</li>
<li><strong style="font-weight:500">I tell you how sure I am.</strong> Most pages here are verified by hand. A few say "still checking" — I'd rather admit that than pretend.</li>
<li><strong style="font-weight:500">Nobody pays to be here.</strong> No commission, no selling the trip. The order on this map is the strength of the community, never the size of the wallet.</li>
<li><strong style="font-weight:500">If I wouldn't send a friend, it isn't on the map.</strong></li>
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
<p style="font-size:13px;opacity:.6;margin-top:10px">This is the short version. <a href="/journal/how-to-find-the-best-school-online" style="color:var(--sea)">The full method is here</a> — the six questions, in order, for any craft anywhere.</p>
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
.intent {{ border:1px solid var(--line); border-radius:12px; padding:20px 22px; background:rgba(243,237,226,0.02); margin:18px 0 0; }}
.intent-q {{ font-size:15px; opacity:.82; margin-bottom:12px; max-width:56ch; }}
.intent-row {{ display:flex; gap:8px; flex-wrap:wrap; }}
.intent-input {{ flex:1 1 220px; background:rgba(243,237,226,0.04); border:1px solid rgba(243,237,226,0.16); border-radius:99px; padding:11px 16px; color:var(--paper); font-size:14px; }}
.intent-input:focus {{ outline:none; border-color:var(--sea); }}
.intent-go {{ border:none; border-radius:99px; padding:11px 22px; font-size:14px; font-weight:500; color:#14110d; cursor:pointer; background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%); }}
.intent-go:hover {{ filter:brightness(1.05); }} .intent-go:disabled {{ opacity:.5; cursor:default; }}
.intent-msg {{ font-size:13.5px; margin-top:10px; }} .intent-msg.ok {{ color:var(--sea); }} .intent-msg.err {{ color:#e0915f; }}
.intent-fine {{ font-size:12px; opacity:.5; margin-top:8px; }}
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
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/supabase-config.js"></script>
<script src="/js/intent-capture.js" defer></script>
<footer><div class="wrap">EducatedTraveler — a bridge, not a shop. We connect you to the place, the person, and your people — then get out of the way. <a href="/#circle">Join the Circle</a>.<br><span style="opacity:.75">We use privacy-light, cookieless analytics — no personal data, no tracking cookies.</span></div></footer>
</body>
</html>"""

def circle_cta(line):
    return (f'<p style="margin-top:8px;opacity:.78;max-width:60ch">{e(line)}</p>'
            '<a class="cta" href="/#circle">Tell us this pulls you — join the Circle</a>'
            '<p class="meta" style="margin-top:10px">Prices are a verified starting point — no checkout, no hard sell. We introduce; you decide.</p>')

def intent_form(prompt, source, discipline=None, place=None, label=None):
    data = f' data-discipline="{e(discipline)}"' if discipline else ""
    data += f' data-place="{e(place)}"' if place else ""
    data += f' data-label="{e(label)}"' if label else ""
    return (f'<form class="intent"{data} data-source="{e(source)}">'
            f'<p class="intent-q">{e(prompt)}</p>'
            '<div class="intent-row">'
            '<input type="email" name="email" required placeholder="you@email.com" class="intent-input">'
            '<button type="submit" class="intent-go">Raise your hand</button></div>'
            '<p class="intent-msg" hidden></p>'
            '<p class="intent-fine">Prices are a verified starting point — no checkout, no hard sell. We introduce; you decide.</p>'
            '</form>'
            '<noscript><a class="cta" href="/#circle">Join the Circle</a></noscript>')

def ceiling_line(x, d=None):
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

def credential_section(d):
    if not d.get("goldCredential"):
        return ""
    body = (f'<p style="opacity:.82;font-size:15px;max-width:62ch"><strong style="font-weight:500">{e(d["goldCredential"])}</strong>'
            + (f' · Certifying body: {e(d["certBody"])}' if d.get("certBody") else "") + '</p>'
            '<p class="meta" style="margin-top:10px">A recognised qualification an outside body stands behind is not the same as a certificate a school prints itself. We name which it is — you should ask the school the same.</p>')
    return f'<section><div class="wrap" style="max-width:720px"><div class="mono">What you walk away with</div><h2>The credential</h2>{body}</div></section>'

COMMUNITY_TIER = {
    "Legendary":  ("#f0c27a", "Legendary living community"),
    "Thriving":   ("#a3cdc9", "Thriving living community"),
    "Strong":     ("rgba(243,237,226,.78)", "Strong living community"),
    "Growing":    ("rgba(243,237,226,.55)", "Growing community"),
    "Hidden-gem": ("rgba(243,237,226,.55)", "Hidden-gem community"),
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
    return None

def best_dest_id(d):
    f = d.get("featured") or {}
    if f.get("id"):
        for x in d["destinations"]:
            if x["id"] == f["id"]:
                return x["id"]
    if f.get("place"):
        for x in d["destinations"]:
            if x["place"] == f["place"]:
                return x["id"]
    best = max(d["destinations"], key=lambda x: x["communityRank"], default=None)
    return best["id"] if best else None

def dest_card(d, x, link=True, is_best=False):
    badges = "".join(f'<span class="badge">{e(BADGE_LABELS.get(b, b))}</span>' for b in x["badges"])
    title = f'{e(x["place"])}, {e(x["country"])}'
    if link:
        title = f'<a class="t" href="/atlas/{x["id"]}">{title}</a>'
    ribbon = ('<div style="display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:10px;'
              'letter-spacing:.14em;text-transform:uppercase;color:#14110d;font-weight:600;'
              'background:linear-gradient(135deg,#d28a52,#e0a877);border-radius:6px;padding:3px 9px;'
              'margin-bottom:10px">★ Best place to go</div>') if is_best else ""
    border = 'border-left:3px solid #d28a52;' if is_best else ""
    return (f'<div class="card" style="{border}">{ribbon}<div class="mono">{e(ROLE_LABELS[x["role"]])}</div>'
            f'<h2 style="margin:6px 0 4px">{title}</h2>'
            f'<div class="meta" style="margin-bottom:10px">{community_pill(x)}'
            f' · Season: {e(x["bestSeason"])} · {e(x["level"])}</div>'
            f'<p style="opacity:.82;margin-bottom:12px">{e(x["why"])}</p>{badges}</div>')

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
        price = ("from " + e(ps)) if ps and ps != "Donation-based" else (e(ps) if ps else "price on request")
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

def featured_block(d, x):
    f = d.get("featured") or {}
    if not f.get("course"):
        return ""
    if not (f.get("id") == x["id"] or f.get("place") == x["place"]):
        return ""
    ps = price_start(f)
    if ps and ps != "Donation-based":
        price_html = f'<span style="font-family:\'Fraunces\',Georgia,serif;font-size:22px;color:#f0c27a">from {e(ps)}</span>'
    elif ps == "Donation-based":
        price_html = '<span style="color:#f0c27a">Donation-based</span>'
    else:
        price_html = '<span style="opacity:.6;font-style:italic">Price on request</span>'
    chips = " ".join(f'<span class="badge">{e(c)}</span>' for c in
                     [f.get("duration"), f.get("format"),
                      (f.get("certification") if f.get("certification") not in (None, "—") else None)] if c)
    desc = f'<p style="opacity:.82;margin-top:10px">{e(f["description"])}</p>' if f.get("description") else ""
    sessions = ('<p class="meta" style="margin-top:8px">Next sessions: ' + e(" · ".join(f["sessions"][:4])) + '</p>') if f.get("sessions") else ""
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
            if s.get("rating"):
                rcnt = f' · {s["ratingCount"]} reviews' if s.get("ratingCount") else ""
                rurl = s.get("ratingUrl") or s.get("url")
                src = s.get("ratingSource", "")
                cited = f'<a class="school-url" rel="nofollow noopener" target="_blank" href="{e(rurl)}">{e(src)} ↗</a>' if rurl else e(src)
                inner += (f'<div class="meta" style="margin-top:5px"><span class="dots">★</span> '
                          f'<strong style="font-weight:500">{e(str(s["rating"]))}/5</strong>{e(rcnt)} on {cited} '
                          f'<span style="opacity:.7">— verify it yourself</span></div>')
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

        jsonld = {"@context": "https://schema.org", "@type": "Place",
                  "name": f'{x["place"]}, {x["country"]}',
                  "description": x["why"],
                  "url": SITE + path,
                  "containedInPlace": {"@type": "Country", "name": x["country"]}}

        intent = intent_form(
            f"{x['place']} pulls you? Leave an email — we'll introduce you to the school and the "
            f"people going as the map grows toward it.",
            source=f'atlas:{x["id"]}', discipline=d["id"], place=x["id"],
            label=f'{d["discipline"]} · {x["place"]}')
        body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a> / <a href="/atlas/{d['id']}" style="text-decoration:none">{e(d['discipline'])}</a></div>
<h1>Learn {e(d['discipline'])} in {e(x['place'])}</h1>
<p class="lead">{e(x['why'])}</p>
</div></header>
<section><div class="wrap">{dest_card(d, x, link=False, is_best=(x["id"] == best_dest_id(d)))}{ceiling_line(x, d)}</div></section>
{featured_block(d, x)}
{masters_html}
{rating_block(d, x)}{schools_html}
{room_block(x, d)}
{credential_section(d)}
<section><div class="wrap">{intent}</div></section>
{sib_html}"""
        (OUT / f'{x["id"]}.html').write_text(page(title, desc, path, body,
            breadcrumbs=[("Atlas", "/atlas/"), (d["discipline"], f'/atlas/{d["id"]}'), (x["place"], path)], jsonld=jsonld))

# ---------- discipline pages ----------
for d in DISC:
    title = f'{d["discipline"]} — where to learn it at the source ({len(d["destinations"])} destinations)'
    desc = (d["blurb"][:155] + "…") if len(d["blurb"]) > 156 else d["blurb"]
    path = f'/atlas/{d["id"]}'
    urls.append(path)
    _bid = best_dest_id(d)
    cards = "".join(dest_card(d, x, is_best=(x["id"] == _bid)) for x in sorted(d["destinations"], key=lambda x: -x["communityRank"]))
    cred = f'<p class="meta" style="margin-top:10px">Gold credential: <strong style="opacity:.9">{e(d.get("goldCredential",""))}</strong>{" · " + e(d["certBody"]) if d.get("certBody") else ""}</p>' if d.get("goldCredential") else ""
    body = f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a> / {e(CORES[d['category']][0])}</div>
<h1>{e(d['discipline'])}</h1>
<p class="lead">{e(d['blurb'])}</p>{cred}
</div></header>
<section><div class="wrap"><div class="mono">Ranked by community strength — not by who pays</div><h2 style="margin-bottom:18px">Where the community gathers</h2>{cards}{intent_form(f"{d['discipline']} pulls you? Leave an email — we'll introduce you to the right place and the right people as the map grows.", source=f'atlas:{d["id"]}', discipline=d["id"], label=d["discipline"])}</div></section>"""
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
