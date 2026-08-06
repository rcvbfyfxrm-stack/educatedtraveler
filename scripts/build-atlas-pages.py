#!/usr/bin/env python3
"""Build the Atlas — every craft listed, the asked-for ones open, the rest short.

/atlas/ is the one place you browse. Every craft has a page. A craft is OPEN when
somebody in the Circle asked for it (data/atlas-unlocked.json, written by
scripts/refresh-unlocked.mjs): the full sheet, every place, every school. A craft
nobody has asked for yet gets a SHORT sheet — what the craft is, where it is most
alive, and a box to write Arnaud a letter. The research is not on that page and
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
import json, html, re, sys
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
    "master-lab": "Enrol with the master",
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
            '<a href="/profile" id="et-nav-profile" class="cta" '
            'style="margin:0;padding:8px 18px;font-size:13px;display:none;">Your Profile</a></div>')

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


def page(title, desc, canonical_path, body, breadcrumbs=None, jsonld=None,
         saveable=True, extra_head="", extra_scripts="", body_attrs=""):
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
    if saveable:
        tail.append(SKILL_SAVE)
    if extra_scripts:
        tail.append(extra_scripts)
    tail_scripts = "\n".join(tail)
    fonts = (atlas_hub.LETTER_FONTS if extra_head else
             "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap")
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
<link href="{fonts}" rel="stylesheet">
{crumbs}{extra}
{ANALYTICS}{extra_head}
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
<footer><div class="wrap"><p style="opacity:.82;margin:0 0 16px;max-width:60ch;line-height:1.7;">One page of a larger map. <a href="/atlas/" style="color:var(--sea);">Wander the rest of the Atlas</a> for the other crafts and where they're alive, read the longer stories in the <a href="/journal/" style="color:var(--sea);">Journal</a>, and when a week takes shape near what pulls you, <a href="/circle" style="color:var(--sea);">the Circle</a> is how I open the door.</p><div class="et-foot-nav" style="display:flex;gap:20px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px;"><a href="/atlas/" style="color:var(--sea);text-decoration:none;">Atlas</a><a href="/journal/" style="color:var(--sea);text-decoration:none;">Journal</a><a href="/lab-weeks" style="color:var(--sea);text-decoration:none;">Lab Weeks</a><a href="/about" style="color:var(--sea);text-decoration:none;">Meet the founder of EducatedTraveler</a><a href="/circle" style="color:var(--sea);text-decoration:none;">The Circle</a></div>EducatedTraveler — a bridge, not a shop. We connect you to the place, the person, and your people — then get out of the way. <a href="/#circle">Join the Circle</a>.<br><span style="opacity:.75">We use privacy-light, cookieless analytics — no personal data, no tracking cookies.</span></div></footer>
{CUR_TOGGLE}
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



# The few rules a short sheet needs that the shared Atlas stylesheet doesn't carry:
# the state badge, the "most alive" line, and the letter's button (the hub calls it
# .btn; these pages only define .cta).
SHORT_CSS = """
.notyet { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ember); border:1px solid rgba(210,138,82,.34); border-radius:99px; padding:4px 11px; }
.alive { font-size:15px; opacity:.82; margin-top:14px; }
.alive b { font-weight:500; opacity:1; }
.btn { display:inline-block; padding:13px 26px; border-radius:99px; font-size:14px; font-weight:500; color:#14110d; cursor:pointer; font-family:inherit; border:none; background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%); transition:filter .2s,transform .2s; }
.btn:hover { filter:brightness(1.05); transform:translateY(-1px); }
.btn:disabled { opacity:.5; cursor:default; transform:none; }
.eyebrow { font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--sea); }
.serif { font-family:'Fraunces',Georgia,serif; }
"""


def short_sheet(d, total):
    """A craft nobody has asked for yet: what it is, where it's most alive, and the letter box.

    Everything else — the places, the schools, the teachers, the credential, the
    prices — is deliberately absent from this page and from its source.
    """
    top = max(d["destinations"], key=lambda x: x["communityRank"], default=None)
    alive = (f'<p class="alive">Where the community around it is strongest: '
             f'<b>{e(top["place"])}, {e(top["country"])}</b>.</p>') if top else ""
    return f"""<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a> / {e(CORES[d['category']][0])}</div>
<p style="margin:16px 0 0"><span class="notyet">Not open yet</span></p>
<h1>{e(d['discipline'])}</h1>
<p class="lead">{e(d['blurb'])}</p>{alive}
</div></header>
<section><div class="wrap" style="max-width:720px">
<div class="mono">Why there's nothing more on this page</div>
<h2 style="margin:6px 0 14px">The map grows where someone is actually going</h2>
<p style="opacity:.82;font-size:15px;max-width:62ch">That's all I'll put up for now. The rest of it — every place, the schools, the teachers, what the credential is actually worth — is researched and sitting in my files. I open a craft on the Atlas when a member writes to me about it, and not before.</p>
<p style="opacity:.82;font-size:15px;max-width:62ch;margin-top:14px">That isn't a tease. It's how I keep this honest: I publish a sheet when someone is genuinely going to use it, so I can check it properly before you read it, instead of checking {total} things badly.</p>
</div></section>
{atlas_hub.letter_section(
    "Write me a letter about " + e(d["discipline"]) + ".",
    "Not a form — a letter, and I read every one myself. Tell me why this one pulls at you, "
    "how you\'d want to learn it, and who you\'d want to be in it a year from now. "
    "A letter about a craft is what opens it.",
    skill_field=False, prefill=d["discipline"])}"""


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
<p>{e(parent_name)} isn't open on the Atlas yet, so there's no sheet for {e(place)}, {e(country)} — but you can ask me to open it.</p>
<p><a href="{url}" style="color:#7fa8a5">Go to {e(parent_name)} &rarr;</a></p>
</body>
</html>"""


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

def featured_block(d, x):
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
            saveable=False, extra_head="<style>" + atlas_hub.LETTER_CSS + SHORT_CSS + "</style>",
            extra_scripts='<script defer src="/js/atlas-circle-interest.js"></script>'
                          '<script>' + atlas_hub.LETTER_JS + '</script>',
            body_attrs=f' data-craft-slug="{e(d["id"])}"'))
        continue

    title = f'{d["discipline"]} — where to learn it at the source ({len(d["destinations"])} destinations)'
    desc = (d["blurb"][:155] + "…") if len(d["blurb"]) > 156 else d["blurb"]
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


def world_of(name, category, disc_id=""):
    if disc_id in MOVEMENT_IDS or MOVEMENT_RE.search(name or ""):
        return "movement"
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
            "school": ((x.get("schoolsInfo") or [{}])[0]).get("name", ""),
            "nSchools": len(x.get("schoolsInfo") or x.get("schools") or []),
        } for x in d["destinations"]]
    else:
        card["dests"] = ([{"id": d["id"], "place": best.get("place", ""),
                           "country": best.get("country", ""), "region": "",
                           "rank": best.get("communityRank", 0), "rankLabel": "",
                           "season": "", "role": "", "level": "", "tripTier": 0,
                           "tripType": "", "tripLength": "", "english": False, "lang": "",
                           "badges": [], "master": "", "why": "", "school": "", "nSchools": 0}]
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
                  "dests": [{"id": hc["id"], "place": hc.get("place", ""),
                             "country": hc.get("country", ""), "region": "",
                             "rank": hc.get("communityRank", 0),
                             "rankLabel": hc.get("communityLabel", ""), "season": "",
                             "role": "", "level": "", "tripTier": 0, "tripType": "",
                             "tripLength": "", "english": False, "lang": "", "badges": [],
                             "master": "", "why": "", "school": "", "nSchools": 0}]})
CARDS.sort(key=lambda c: c["name"].lower())
N_OPEN = sum(1 for c in CARDS if c["open"])

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
(OUT / "index.html").write_text(atlas_hub.build(
    analytics=ANALYTICS, site=SITE, total=len(CARDS), n_open=N_OPEN,
    generated_at=UNLOCK_DATE))

# ---------- sitemap + robots ----------
# Hand-added statics used to be wiped by every rebuild — they live here now.
# /browse is deliberately absent: it is a redirect, and a redirect has no business
# in a sitemap. The place stubs of a craft that isn't open are absent for the same
# reason; they carry noindex and exist only so shared URLs still land somewhere true.
static_urls = ["/", "/about", "/community", "/lab-weeks", "/circle", "/barcelona", "/instructors"]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
seen_url = set()
for u in static_urls + urls:
    if u in seen_url:
        continue
    seen_url.add(u)
    sm.append(f"<url><loc>{SITE}{u}</loc></url>")
sm.append("</urlset>")
(ROOT / "website/sitemap.xml").write_text("\n".join(sm))
(ROOT / "website/robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cmd\nSitemap: {SITE}/sitemap.xml\n")

n_short = len(CARDS) - N_OPEN
n_dest_full = sum(len(d["destinations"]) for d in DISC if is_open(d["id"]) and f'{d["id"]}.html' not in PRESERVE)
n_dest_stub = sum(len(d["destinations"]) for d in DISC if not is_open(d["id"]))
print(f"{len(CARDS)} crafts — {N_OPEN} open, {n_short} short (unlock file dated {UNLOCK_DATE or 'unknown'})")
print(f"  {n_dest_full} place pages · {n_dest_stub} place stubs · {_kept} pages preserved · browse home rebuilt")
print(f"  website/js/atlas-index.js written · sitemap.xml: {len(seen_url)} URLs · robots.txt written")
if ASSUME_ALL_OPEN:
    print("  !! --assume-all-open: this output is for diffing only. Do not commit it.")
