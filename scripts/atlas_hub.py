"""The Atlas browse home — website/atlas/index.html.

This is /browse. Not a rebuild of it, not something inspired by it: the file
itself, taken from the live page (scripts/atlas-hub-template.html) and moved to
the /atlas address, because that is where everything lives now. The rosette, the
rails, the card design, the filters, the note, the ✎ buttons — all untouched.

What the build changes, and nothing else:
  1. the head — canonical, og:url and title point at /atlas/, and the craft
     count in the description is computed rather than typed (the old one had
     already rotted from 99 to 112);
  2. the data source — repertoire.js and atlas-ratings.js are no longer served,
     so the page loads atlas-index.js + atlas-index-shim.js instead. The shim
     rebuilds window.ET_ATLAS / window.ET_RATINGS, so the page's own script runs
     exactly as it did;
  3. a short rule set for cards whose craft isn't open yet, and the ticker under
     the rosette drawn as a circle rather than a rounded box;
  4. the band above the browse — the crafts the Circle opened, newest first,
     each with the day its ask landed (opened_band() below).

The note is one thing everywhere: website/js/intent-capture.js draws it, on this
page and on every craft sheet. What lives here is only the frame around it —
NOTE_CSS and note_section() below. One note on the site.
"""
import html
import re
from pathlib import Path

e = html.escape

TEMPLATE = Path(__file__).resolve().parent / "atlas-hub-template.html"

# The five worlds, by the colour the page already draws them in. Mirror of the WORLDS
# map in atlas-hub-template.html — a card in the band must be the same colour as the
# same card in the grid below it. Checked by scripts/check-atlas-hub.py.
def _stack(first, rest):
    return ('<span class="sl on">' + first + "</span>"
            + "".join(f'<span class="sl">{x}</span>' for x in rest))


WORLD_COLOR = {
    "adventure": "#6fa3a0",
    "culinary": "#c9a24a",
    "creative": "#cf8f6e",
    "movement": "#bf8088",
    "wellness": "#94ad86",
}


# ── the worldwide sweep: what was looked at, and what did not clear ─────────
# Arnaud, 2026-09-01: "make sure you check all the market worldwide when rendering a
# skill, so nothing is forgotten."
#
# The failure this exists to stop is not a wrong fact. It is a MISSING one, and a
# missing one leaves no trace: Modernist Spanish Cuisine shipped with a pick, a star
# and four destinations, and Le Cordon Bleu Madrid — the only room on the craft where
# a non-Spanish speaker can follow the lesson live — was simply not in the file.
# Nothing on the page was false. Nothing on the page could have told you.
#
# So a craft records where it LOOKED, not only what it found, and it records what it
# turned down. The rejections are the part that matters twice over: they stop the next
# session re-deriving the same four dead ends, and published, they are the one thing
# the Standard says no rival will print — a public count of what was checked and did
# not clear. A sweep with an empty rejected list is not a sweep that found everything
# worthy; it is a sweep that was not written down. The gate says so.
SWEEP_REGIONS = [
    "Western Europe", "Southern Europe & Mediterranean", "Nordic & Baltic",
    "Eastern Europe & Central Asia", "North America", "Latin America & Caribbean",
    "Sub-Saharan Africa", "Middle East & North Africa", "South & Southeast Asia",
    "East Asia", "Oceania",
]
# A craft may be genuinely concentrated — Argentine tango is not under-swept for having
# no Oceania entry. What is checked is that somebody LOOKED, in every region, on a day.
SWEEP_STALE_DAYS = 365


def sweep_problems(craft_id, sweep, today):
    """[] when the record is usable, else one line per thing wrong with it.

    Hard problems only — a malformed sweep is worse than none, because it looks like
    diligence. Staleness is reported separately by sweep_stale(); an old sweep is
    still a real one.
    """
    out = []
    if not isinstance(sweep, dict):
        return [f"{craft_id}: sweep must be an object"]
    d = (sweep.get("date") or "").strip()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
        out.append(f"{craft_id}: sweep.date must be YYYY-MM-DD, got {d!r}")
    elif d > today:
        out.append(f"{craft_id}: sweep.date {d} is in the future")
    regions = sweep.get("regions") or []
    if not regions:
        out.append(f"{craft_id}: sweep.regions is empty — name the regions you searched")
    unknown = [r for r in regions if r not in SWEEP_REGIONS]
    if unknown:
        out.append(f"{craft_id}: sweep.regions has names that are not regions: {unknown}")
    if len(set(regions)) != len(regions):
        out.append(f"{craft_id}: sweep.regions repeats a region")
    rejected = sweep.get("rejected") or []
    if not rejected:
        out.append(f"{craft_id}: sweep.rejected is empty. A worldwide look that turned "
                   "nothing down was not written down — record what you found and why "
                   "it is not on the map.")
    for r in rejected:
        if not (r.get("name") or "").strip():
            out.append(f"{craft_id}: a rejected entry has no name")
        if not (r.get("why") or "").strip():
            out.append(f"{craft_id}: rejected {r.get('name','?')!r} with no reason — "
                       "an unexplained rejection is a private opinion, not a record")
        u = (r.get("url") or "").strip()
        if u and not u.startswith(("http://", "https://")):
            out.append(f"{craft_id}: rejected {r.get('name','?')!r} has a malformed url")
    return out


def sweep_bounded(sweep):
    """A craft that is regional by its own name is not under-swept for being so.

    "Modernist SPANISH Cuisine" searched in one region is a complete sweep, and
    printing "1 of 11" against it would be a false alarm that teaches everyone to
    ignore the real ones. The escape hatch is a SENTENCE, not a flag: say why the
    search stops where it does, and the reader can disagree with the reasoning.
    """
    return ((sweep or {}).get("bounded") or "").strip()


def sweep_gaps(sweep):
    """Regions this craft has not been searched in yet.

    Reported and PUBLISHED, never fatal. A craft swept in five regions of eleven is a
    true statement about an unfinished job; a craft with all eleven typed in because
    the build demanded them is a false one, and the second is the failure mode a gate
    like this actually creates. So the gap is carried in the open, on the page, the
    way the Atlas already carries "nothing here has been stood in yet".
    """
    if sweep_bounded(sweep):
        return []
    have = set((sweep or {}).get("regions") or [])
    return [r for r in SWEEP_REGIONS if r not in have]


def sweep_stale(sweep, today, days=SWEEP_STALE_DAYS):
    """True when the sweep is older than `days`. Decay is the wedge; a sweep decays too."""
    import datetime as _dt
    d = (sweep or {}).get("date") or ""
    try:
        then = _dt.date.fromisoformat(d)
    except ValueError:
        return True
    return (_dt.date.fromisoformat(today) - then).days > days


# ── provenance: an immersive line may not out-claim its own research ────────
# learnLines (data/atlas-extra-sheets.json) are hand-written above the `why` they
# summarise, and the failure mode is not a typo — it is DRIFT. Arnaud's own worked
# example for this feature turned "the most photographed big-cat ground on earth"
# into "where the most big cats are", which is a different and unverified claim.
# So: every number and every proper noun in a line must already appear in that
# destination's own research. It cannot judge prose, but it catches the thing that
# actually goes wrong — a name or a figure that came from nowhere.
#
# Shared by the build (which WARNS, so an unattended nightly never dies on it) and
# by check-atlas-hub.py (which FAILS, because that one runs before anything ships).
import unicodedata

_PROV_STOP = set(
    "learn learning stand start sail watch the a an and or in on at of to for from with by "
    "is are was were be been it its their his her you your they them where when which who "
    "that this these those as into out up down over under one two three four five six seven "
    "eight nine ten first only every each all both no not never own same other more most less "
    "least like than then so if but while during after before between among around through "
    "across against without within".split())


def _prov_norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'").replace(",", "")


def learn_line_drift(learn_lines, disciplines):
    """[(dest_id, kind, token, line)] for every token a line asserts and its own
    research does not. Empty list = every line stays inside what is already verified."""
    by_id = {x["id"]: (d, x) for d in disciplines for x in d["destinations"]}
    out = []
    for did, line in (learn_lines or {}).items():
        if did not in by_id or not (line or "").strip():
            continue
        d, x = by_id[did]
        hay = _prov_norm(" ".join([
            x.get("why", ""), d.get("blurb", ""), x.get("place", ""), x.get("country", ""),
            " ".join(x.get("masters") or []),
            " ".join((s.get("course") or "") + " " + (s.get("blurb") or "")
                     for s in (x.get("schoolsInfo") or [])),
            d.get("goldCredential", ""), d.get("certBody", ""),
            x.get("level", ""), x.get("bestSeason", "")]))
        for n in re.findall(r"\d[\d,\u2013-]*", line):
            tok = _prov_norm(n).strip("-")
            if tok and tok not in hay:
                out.append((did, "number", n, line))
        for w in re.findall(r"\b[A-Z][\w'\u2019\u00C0-\u024F-]{2,}", line):
            nw = _prov_norm(w)
            if nw in _PROV_STOP:
                continue
            if nw.endswith("'s"):
                nw = nw[:-2]
            if nw not in hay and nw.rstrip("s") not in hay:
                out.append((did, "name", w, line))
    return out


_THE = re.compile(r"\b(States|Kingdom|Islands|Netherlands|Republic|Emirates|Philippines"
                  r"|Bahamas|Maldives|Gambia)\b")


def the_country(c):
    """"the United States", not "United States". A rule and not a list, so a craft that
    opens overnight on a country nobody has typed here yet still reads as English."""
    return "the " + c if c in ("UK", "USA") or _THE.search(c or "") else c


def place_line(place, country):
    """"United States, United States" and "Kyoto, Kyoto" are data, not sentences."""
    if not place:
        return country or ""
    if not country or place == country or country in place:
        return place
    return f"{place}, {country}"


def walk_places(dests):
    """[(say, where)] for the places a card walks, strongest community first — the same
    order and the same two strings the browse template builds, because the band card is
    a .gcard and the walk picks it up off the class exactly as it does a grid one.

    `where` is the country alone: the sentence above it is already specific, and "in
    Kenya" is the half a reader needs. But a craft taught twice in ONE country would
    count "2 / 3" against a line that never moved, so that craft keeps its towns.
    Disambiguation, not a claim — both strings are already published either way."""
    ds = sorted([x for x in dests if x.get("place")],
                key=lambda x: -(x.get("rank") or 0))
    seen, dupe = set(), False
    for x in ds:
        c = x.get("country") or ""
        if c in seen:
            dupe = True
        seen.add(c)
    return [((x.get("say") or "").strip(),
             place_line(x["place"], x.get("country") or "") if (dupe or not x.get("country"))
             else the_country(x["country"])) for x in ds]


# ── the note, shared with every short craft sheet ─────────────────────────
NOTE_CSS = """
/* The frame around the note — the heading, the sub, and the width it sits in.
   The sheet, the signature, the button and the dialog are drawn by
   /js/intent-capture.js, which is the one note on the site. */
.letter{margin:52px 0 18px;scroll-margin-top:74px}
.letter .lhead{text-align:center;max-width:60ch;margin:0 auto 24px}
.letter h2{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(25px,3.8vw,38px);line-height:1.1;margin:12px 0 14px;letter-spacing:-.01em}
.letter .lsub{color:var(--muted);font-size:15px;line-height:1.65}
.letter .lsub b{color:var(--paper);font-weight:400}
.lbox{max-width:660px;margin:0 auto}
.cint{font-size:11.5px;color:var(--sea);margin-top:9px;padding-top:9px;border-top:1px solid var(--line);line-height:1.45}
.cint:empty{display:none}
.cint .cint-dot{font-size:7px;vertical-align:2px;margin-right:6px;opacity:.85}
"""

LETTER_FONTS = ("https://fonts.googleapis.com/css2?family=Caveat:wght@400;600"
                "&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500"
                "&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap")


def note_section(heading, sub, discipline="", label=""):
    """The note on a craft sheet: a heading, a line, and the note itself.

    The form is an empty shell on purpose — /js/intent-capture.js replaces what is
    inside it with the sheet, the signature and the one button, and asks for the
    address afterwards in a dialog. What the page contributes is the craft, through
    the data-* attributes, so the note already knows what it is about and never has
    to ask. id="letter" is a DOM id and stays: every "write me about this one" jump
    link on the Atlas lands on it (scripts/check-vocabulary.py enforces it).
    """
    data = f' data-discipline="{e(discipline)}"' if discipline else ""
    data += f' data-label="{e(label)}"' if label else ""
    source = f"atlas:{e(discipline)}" if discipline else "atlas-note"
    return f"""<div class="wrap"><section class="letter reveal" id="letter" aria-labelledby="letter-h">
  <div class="lhead">
    <div class="eyebrow">Write to me</div>
    <h2 class="serif" id="letter-h">{heading}</h2>
    <p class="lsub">{sub}</p>
  </div>
  <div class="lbox">
    <form class="intent"{data} data-source="{source}">
      <p class="intent-q">Write me a note about this one &mdash; how you&#39;d love to learn it, and where.
      It comes to my own inbox and I read every one myself.</p>
      <p class="intent-fine">If this box never loads, the same note reaches me at
      <a href="mailto:arnaudcallier@pm.me" style="color:var(--sea)">arnaudcallier@pm.me</a>.</p>
    </form>
  </div>
</section></div>"""


# The only visual rules the move adds: a card whose craft isn't open yet reads
# quieter, and the line it carries instead names what actually opens it.
HUB_EXTRA_CSS = """
/* a craft nobody has asked for yet — same card, quieter */
.dcard.shut,.gcard.shut{background:rgba(20,17,13,.55)}
.dcard.shut::before,.gcard.shut::before{opacity:.24}
.dcard.shut .cardsay,.gcard.shut .cardsay{opacity:.9}
.dcard.shut .wherealive,.gcard.shut .wherealive{opacity:.8}
/* the one line a locked card carries. It names the person, because the thing that
   opens the craft is a note to him and nothing else — not a sign-up, not a fee. */
.askline{color:var(--ember)!important;letter-spacing:.04em}

/* the band above the browse — what the Circle opened, newest first */
.newopen{padding:36px 0 6px}
.newopen .nohead{max-width:62ch;margin-bottom:20px}
.newopen h2{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(23px,3.2vw,34px);line-height:1.1;letter-spacing:-.01em;margin:11px 0 12px}
/* A RAIL, NOT A ROW OF FOUR (2026-08-25, Arnaud's ask).
   The band used to be a four-card grid and the other twenty-four crafts the Circle
   opened were simply not on the page — the section claimed "the crafts someone asked
   for" and showed a seventh of them. It scrolls now, and every one of them is in it.
   Same .rail mechanics as the catalogue shelves below, so there is one horizontal
   card behaviour on this page and not a second one to keep in step. */
.norail{display:flex;gap:13px;overflow-x:auto;scroll-snap-type:x proximity;scroll-behavior:smooth;padding:4px 2px 14px;scrollbar-width:none;cursor:grab}
.norail::-webkit-scrollbar{display:none}
.norail.drag{cursor:grabbing;scroll-behavior:auto}
.norail>.gcard{scroll-snap-align:start;flex:0 0 auto;width:clamp(228px,25vw,262px)}
.nowrap-rail{position:relative}
.openedon{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);margin-bottom:7px}
.openedon b{color:var(--sc);font-weight:400}
/* how far along the band you are — the answer to "is that all of them?", which a
   scrolling row has to give in words because it cannot give it by being full */
.nocount{display:flex;align-items:center;gap:12px;margin:2px 0 12px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.nocount .track{flex:1;max-width:230px;height:2px;border-radius:2px;background:rgba(243,237,226,.12);overflow:hidden}
.nocount .track i{display:block;height:100%;width:20%;border-radius:2px;background:var(--sea);transition:width .25s,margin-left .25s}
.nomore{margin:16px 0 0;font-size:13.5px}
.nomore a{color:var(--sea);text-decoration:none;border-bottom:1px solid rgba(127,168,165,.3)}
.nomore a:hover{color:var(--paper)}
"""

# The band's arrows and drag. The catalogue rails below get theirs from the page's
# own script, which only ever walks #results — the band is outside it, so it needs
# its own. Kept to the same gestures (arrows, drag, wheel-free) so the two rails
# feel like one thing, and it degrades to a plain scrolling row without JS.
HUB_EXTRA_JS = """
(function(){
  var rail=document.getElementById("norail");if(!rail)return;
  var wrap=rail.parentNode,fill=document.getElementById("nofill"),seen=document.getElementById("noseen");
  var n=rail.children.length,l,r;
  ["l","r"].forEach(function(sd){
    var b=document.createElement("button");b.className="arrow "+sd;
    b.setAttribute("aria-label",sd==="l"?"Earlier crafts":"More crafts the Circle opened");
    b.innerHTML=sd==="l"?"\\u2039":"\\u203a";
    b.onclick=function(){rail.scrollBy({left:(sd==="l"?-1:1)*rail.clientWidth*0.85,behavior:"smooth"});};
    wrap.appendChild(b);if(sd==="l")l=b;else r=b;});
  function sync(){
    var max=rail.scrollWidth-rail.clientWidth-2;
    l.classList.toggle("show",rail.scrollLeft>4);
    r.classList.toggle("show",max>4&&rail.scrollLeft<max);
    if(!fill||!n)return;
    var frac=rail.clientWidth/rail.scrollWidth,pos=max>0?rail.scrollLeft/(rail.scrollWidth-rail.clientWidth):0;
    fill.style.width=Math.min(100,frac*100).toFixed(1)+"%";
    fill.style.marginLeft=(pos*(100-Math.min(100,frac*100))).toFixed(1)+"%";
    if(seen){
      var first=Math.round(pos*Math.max(0,n-Math.round(n*frac)))+1;
      var last=Math.min(n,first+Math.round(n*frac)-1);
      seen.textContent=first+"\\u2013"+last+" of "+n;
    }
  }
  rail.addEventListener("scroll",sync);
  window.addEventListener("resize",sync);
  var down=false,sx=0,sl=0,mv=0;
  rail.addEventListener("pointerdown",function(e){down=true;mv=0;sx=e.clientX;sl=rail.scrollLeft;rail.classList.add("drag");try{rail.setPointerCapture(e.pointerId);}catch(_){}});
  rail.addEventListener("pointermove",function(e){if(!down)return;var dx=e.clientX-sx;mv=Math.max(mv,Math.abs(dx));rail.scrollLeft=sl-dx;});
  function up(){down=false;rail.classList.remove("drag");}
  rail.addEventListener("pointerup",up);rail.addEventListener("pointercancel",up);rail.addEventListener("pointerleave",up);
  rail.addEventListener("click",function(e){if(mv>6)e.preventDefault();},true);
  sync();setTimeout(sync,400);
})();
"""


def opened_band(items):
    """The crafts the Circle opened, newest first — the band above the browse.

    Static HTML, not drawn by JavaScript: it is the first thing on the page after
    the hero, so it has to be there for a reader with JS off and for a crawler.
    Every card is the same .gcard the grid below uses, so there is one card design
    on this page and no second one to keep in step.

    No per-card count, deliberately. Two sources hold one: data/atlas-unlocked.json
    (distinct people across the waitlist, the concierge queue and profiles) and the
    public atlas_interest() RPC, which is drawn from fewer tables and does not carry
    every craft this band shows — Safari & Wildlife Guiding opened off a profile and
    the RPC has no row for it. Either would print a number beside some cards and
    nothing beside others, and "opened because someone asked" next to a blank reads
    as nobody asked. The heading says what the section is; the card says the day.

    Every craft the Circle opened is in here, not the first four (2026-08-25). It is
    a rail rather than a grid because "the crafts someone asked for" showing four of
    twenty-eight is a claim the section does not keep, and cutting the sentence is
    worse than making the row scroll.

    No standfirst under the heading (2026-08-31, Arnaud's ask). It explained the
    mechanism — how a craft goes from an entry to an open sheet, and how many got
    here that way — and the heading plus the dates on the cards already say it. The
    two counts it carried are still printed, in the hero facts, where the gate now
    reads them.

    items: [{id, name, place, country, color, opened, why, blurb}] in display order.
    """
    if not items:
        return ""
    cards = []
    for it in items:
        where = it["place"]
        if it["country"] and it["country"] not in where:
            where = f"{where}, {it['country']}"
        # The same body lines the browse cards below carry, in the same order and from
        # the same source: the craft and its place as one title, then what the craft
        # is, then why there. A band card is a .gcard, so if it were ordered
        # differently from the card beside it there would be two card designs on one
        # page again. This mirrors cardInner() in the template exactly — change one
        # and you change both, or the page lies. `walks` + the cue are the same deal:
        # placeWalk() picks a band card up off the class, exactly as it does a grid one.
        # Every line the card can ever say is in the card, one visible — see the stack()
        # note in the template. The band builds it here so the two card builders put the
        # same DOM on the same page; check 10 fails if they stop agreeing.
        def say_stack(it):
            me = f'Learn <span class="craftname">{e(it["name"])}</span>'
            rest = [(e(sy) if sy else me) for sy, _ in (it.get("walk") or [])]
            return '<p class="cardsay">' + _stack(me, rest) + "</p>"

        def where_stack(it, where):
            In = '<span class="in">in</span> '
            rest = [In + e(w) for _, w in (it.get("walk") or [])]
            return '<div class="wherealive">' + _stack(In + e(where), rest) + "</div>"

        blurb = (it.get("blurb") or "").strip()
        # Under the place: the hand-written immersive line for that place when there
        # is one, the researched reason-to-go when there is not. Same rule and same
        # order of preference as PLACES in the template, so the card does not change
        # what it says the instant the pointer touches it.
        hook = (it.get("learn") or "").strip() or (it.get("why") or "").strip()
        nplaces = int(it.get("nplaces") or 1)
        # No published reason to go: the shim puts the craft's own blurb in that slot,
        # so without this the same sentence prints twice in two different greys.
        if hook == blurb:
            hook = ""
        # A sheet that never carried a blurb: the reason-to-go takes the full-size
        # line instead, so every card still has exactly one.
        if not blurb:
            blurb, hook = hook, ""
        cards.append(
            f'<article class="gcard{" walks" if nplaces > 1 else ""}" style="--sc:{e(it["color"])}"'
            f' data-craft="{e(it["name"])}">'
            f'<a class="cardlink" href="/atlas/{e(it["id"])}" aria-label="Open the '
            f'{e(it["name"])} skill sheet"></a>'
            f'<div class="openedon">Opened <b>{e(it["opened"])}</b></div>'
            + say_stack(it) + (where_stack(it, where) if where else "")
            + (f'<p class="craftblurb">{e(blurb)}</p>' if blurb else "")
            + (f'<p class="cardhook">{e(hook)}</p>' if hook else "")
            + (f'<button class="placecue" type="button">{nplaces} places →</button>'
               if nplaces > 1 else "")
            + "</article>")
    n = len(items)
    return (
        '<section class="newopen" id="opened" aria-labelledby="opened-h"><div class="wrap">'
        '<div class="nohead">'
        '<div class="eyebrow">Opened by the Circle</div>'
        '<h2 class="serif" id="opened-h">The crafts someone asked for, newest first.</h2>'
        '</div>'
        f'<div class="nocount"><span id="noseen">1 of {n}</span>'
        f'<span class="track"><i id="nofill"></i></span>'
        f'<span>all {n} — scroll</span></div>'
        f'<div class="nowrap-rail"><div class="norail" id="norail">{"".join(cards)}</div></div>'
        '<p class="nomore"><a href="#letter">Write me about a craft that isn’t open yet '
        '→</a></p>'
        '</div></section>')


def build(analytics, site, total, n_open, generated_at, craft_nav="", opened=(),
          n_asked=0):
    """Turn the live /browse file into /atlas/index.html.

    Everything that makes the page what it is comes from the template. Only the
    address, the data source, the two rules above and the band are ours.
    """
    t = TEMPLATE.read_text()

    # 1. the address
    t = t.replace('href="https://educatedtraveler.app/browse"', 'href="https://educatedtraveler.app/atlas/"')
    t = t.replace('content="https://educatedtraveler.app/browse"', 'content="https://educatedtraveler.app/atlas/"')
    t = t.replace('<a href="/browse"', '<a href="/atlas/"')
    t = t.replace('href="/browse"', 'href="/atlas/"')
    t = t.replace("/browse?skill=", "/atlas/?skill=")

    # 2. the counts — computed, never typed. The old ones had rotted to 99.
    t = re.sub(r'<meta property="og:description" content="[^"]*">',
               f'<meta property="og:description" content="{total} hands-on skills you can go and '
               f'learn, each with the one place on earth its community is most alive. {n_open} are '
               f'open in full. A note to Arnaud opens the rest.">', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="The EducatedTraveler Atlas: {total} hands-on '
               f'skills you can go and learn worldwide — learn tango in Buenos Aires, watchmaking '
               f'in the Vallee de Joux, pottery in Mashiko. {n_open} are open in full, with the '
               f'school we\'d send you to. A note to Arnaud opens the rest.">', t, count=1)

    # 2b. the hero. One sentence saying what this page IS, then the three numbers the
    #     whole claim rests on — shown, not buried in the fifth clause of a paragraph
    #     nobody finishes. Counted, never typed: the prose version had already rotted
    #     from 99 crafts to 112 before anybody noticed.
    #
    #     The middle number is the one no rival prints. A marketplace cannot say how
    #     much of its own catalogue it has not checked; this page says it in the first
    #     screen, beside the number it HAS checked, which is the only reason the first
    #     number is worth anything. Dropping it would leave a reader to take all
    #     {total} as vetted — true parts, false picture.
    n_short = total - n_open
    t = re.sub(r'<p class="sub">[^<]*</p>',
               f'<p class="sub">{total} crafts you can go and learn, each with the one place '
               f'its community is most alive — and, where it is open, the school I would send '
               f'you to and why.</p>'
               f'<ul class="herofacts">'
               f'<li><b>{n_open}</b><span>open in full</span></li>'
               f'<li><b>{n_short}</b><span>catalogued, not checked yet</span></li>'
               f'<li><b>{n_asked}</b><span>opened because someone asked</span></li>'
               f'</ul>', t, count=1)

    # 3. the data source. repertoire.js (1.2 MB of research) and atlas-ratings.js
    #    are not served any more; the shim rebuilds what the page reads.
    t = t.replace('<script src="/js/repertoire.js"></script>\n<script src="/js/atlas-ratings.js"></script>',
                  '<script src="/js/atlas-index.js"></script>\n'
                  '<script src="/js/atlas-index-shim.js"></script>')

    # 4. the two rules the move adds
    t = t.replace("</style>\n</head>", HUB_EXTRA_CSS + "</style>\n</head>", 1)

    # 5. built-on stamp, so staleness is visible in view-source
    t = t.replace("<body>", f"<body>\n<!-- built {e(generated_at)} · {n_open} of {total} crafts open "
                            f"· states from data/atlas-unlocked.json -->", 1)
    # 6. the crawlable entrance. The results grid is filled by JS, so without this
    #    a crawler (or anyone with JS off) sees /atlas/ and no way to any sheet.
    #    Real <a href> to all 112 craft pages; each craft page already links its
    #    own places statically, so this completes the graph.
    t = t.replace("<!--ATLAS_CRAFT_NAV-->", craft_nav)

    # 7. the band. It sits between the hero and the browse, because the answer to
    #    "who decides what opens here" belongs above the thing it decides. Asserted,
    #    not attempted: if the anchor ever moves in the template the build stops
    #    rather than shipping a page that quietly lost its band.
    anchor = '<main class="studio" id="studio">'
    band = opened_band(list(opened))
    if band:
        if anchor not in t:
            raise SystemExit("atlas_hub: the <main class=\"studio\"> anchor is gone from "
                             "scripts/atlas-hub-template.html — the opened band has nowhere "
                             "to go. Fix the anchor; do not ship the page without it.")
        t = t.replace(anchor, band + "\n\n" + anchor, 1)
        # 8. the band's own arrows and drag. Asserted like the anchor above: a band
        #    that silently lost its controls scrolls on desktop only by trackpad, and
        #    looks like a row of four again to anyone who never tries.
        if "</body>" not in t:
            raise SystemExit("atlas_hub: no </body> in scripts/atlas-hub-template.html — "
                             "the band's rail script has nowhere to go.")
        t = t.replace("</body>", "<script>" + HUB_EXTRA_JS + "</script>\n</body>", 1)

    return t
