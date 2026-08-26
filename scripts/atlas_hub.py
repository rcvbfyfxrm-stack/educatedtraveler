"""The Atlas browse home — website/atlas/index.html.

This is /browse. Not a rebuild of it, not something inspired by it: the file
itself, taken from the live page (scripts/atlas-hub-template.html) and moved to
the /atlas address, because that is where everything lives now. The rosette, the
rails, the card design, the filters, the letter, the ✎ buttons — all untouched.

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

The letter, and the letter alone, is also shared with the short craft sheets —
LETTER_CSS / LETTER_JS / letter_section() below. One letter on the site.
"""
import html
import re
from pathlib import Path

e = html.escape

TEMPLATE = Path(__file__).resolve().parent / "atlas-hub-template.html"

# The five worlds, by the colour the page already draws them in. Mirror of the WORLDS
# map in atlas-hub-template.html — a card in the band must be the same colour as the
# same card in the grid below it. Checked by scripts/check-atlas-hub.py.
WORLD_COLOR = {
    "adventure": "#6fa3a0",
    "culinary": "#c9a24a",
    "creative": "#cf8f6e",
    "movement": "#bf8088",
    "wellness": "#94ad86",
}


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


# ── the letter, shared with every short craft sheet ─────────────────────────
LETTER_CSS = """
:root{--sheet:#f6efe0;--sheet-ink:#2c231a;--sheet-edge:#d9cdb4;--sheet-faint:rgba(44,35,26,.5)}
.letter{margin:52px 0 18px;scroll-margin-top:74px}
.letter .lhead{text-align:center;max-width:60ch;margin:0 auto 24px}
.letter h2{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(25px,3.8vw,38px);line-height:1.1;margin:12px 0 14px;letter-spacing:-.01em}
.letter .lsub{color:var(--muted);font-size:15px;line-height:1.65}
.letter .lsub b{color:var(--paper);font-weight:400}
.lbox{max-width:660px;margin:0 auto}
.lfield{margin-bottom:16px}
.lfield label{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--sea);margin-bottom:7px}
.lfield input{width:100%;background:rgba(243,237,226,.04);border:1px solid rgba(243,237,226,.16);border-radius:12px;color:var(--paper);font-family:inherit;font-size:16px;padding:12px 14px;outline:none;transition:border-color .2s}
.lfield input:focus{border-color:rgba(127,168,165,.6)}
.lfield input::placeholder{color:rgba(243,237,226,.3)}
.sheet{position:relative;background:linear-gradient(180deg,var(--sheet) 0%,#ece1cc 100%);border-radius:5px;padding:30px 30px 26px;color:var(--sheet-ink);border:1px solid var(--sheet-edge);box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 30px 60px -24px rgba(0,0,0,.6),0 2px 10px rgba(0,0,0,.35)}
.sheet::after{content:"";position:absolute;left:14px;right:14px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.1),transparent)}
.sheet .lhd{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:1px solid rgba(44,35,26,.18);padding-bottom:8px;margin-bottom:15px}
.sheet .to{font-family:'Caveat','Fraunces',cursive;font-size:clamp(28px,4.4vw,36px);line-height:1;color:#3a2c1e}
.sheet .date{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--sheet-faint);margin:0 0 4px}
.sheet textarea{width:100%;min-height:210px;background:transparent;border:none;outline:none;resize:vertical;color:var(--sheet-ink);font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:17px;line-height:34px;background-image:repeating-linear-gradient(transparent,transparent 33px,rgba(44,35,26,.14) 33px,rgba(44,35,26,.14) 34px);padding:0}
.sheet textarea::placeholder{color:rgba(44,35,26,.34);font-style:italic}
.sheet .sign{margin-top:18px;text-align:right}
.sheet .sign .yours{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:15px;color:var(--sheet-faint)}
.sheet .sign .name{font-family:'Caveat','Fraunces',cursive;font-size:30px;line-height:1;color:#3a2c1e;margin-top:2px;min-height:30px}
.prompts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.prompts button{font-family:inherit;font-size:12.5px;color:var(--muted);background:rgba(243,237,226,.03);border:1px solid rgba(243,237,226,.15);border-radius:11px;padding:8px 12px;transition:all .18s}
.prompts button:hover{border-color:rgba(127,168,165,.5);color:var(--paper)}
.lrow{display:flex;align-items:center;gap:18px;margin-top:22px;flex-wrap:wrap}
.lcount{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--faint)}
.sign-off{display:none;margin-top:22px;padding:22px 22px 20px;border:1px solid var(--line);border-left:2px solid var(--sea);border-radius:14px;background:rgba(127,168,165,.05)}
.sign-off.on{display:block;animation:lrise .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes lrise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.sign-off .sh{font-family:'Fraunces',Georgia,serif;font-size:19px;margin-bottom:6px}
.sign-off .sp{color:var(--muted);font-size:13.5px;line-height:1.6;margin-bottom:16px}
.sotwo{display:grid;grid-template-columns:1fr 1.35fr;gap:10px}
@media(max-width:560px){.sotwo{grid-template-columns:1fr}}
.lerr{display:none;color:#f0a58a;font-size:13px;margin-top:14px;line-height:1.55}
.lerr a{color:var(--sea);text-decoration:underline}
.lfine{font-size:11.5px;color:var(--faint);margin-top:12px;line-height:1.6}
.ldone{display:none;text-align:center;padding:34px 24px 30px;border:1px solid var(--line);border-radius:18px;background:rgba(243,237,226,.02)}
.ldone.on{display:block;animation:lrise .5s cubic-bezier(.2,.8,.2,1) both}
.ldone h3{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(23px,3.2vw,31px);margin:12px 0 12px}
.ldone p{color:var(--muted);max-width:48ch;margin:0 auto 10px;font-size:14.5px;line-height:1.65}
.ldone .lpoem{color:var(--sea);font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:15.5px;margin-top:18px}
.ldone .lback{display:inline-block;margin-top:20px;font-size:12.5px;color:var(--muted);text-decoration:underline;text-underline-offset:3px}
.ldone .lback:hover{color:var(--sea)}
.cint{font-size:11.5px;color:var(--sea);margin-top:9px;padding-top:9px;border-top:1px solid var(--line);line-height:1.45}
.cint:empty{display:none}
.cint .cint-dot{font-size:7px;vertical-align:2px;margin-right:6px;opacity:.85}
"""

LETTER_FONTS = ("https://fonts.googleapis.com/css2?family=Caveat:wght@400;600"
                "&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500"
                "&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap")


def letter_section(heading, sub, skill_field=True, prefill=""):
    """The letter. skill_field=False on a craft sheet, where the craft is already
    known and asking again would be a form pretending to be a letter."""
    pre = e(prefill, quote=True)
    skill = ('<div class="lfield"><label for="l_skill">The skill</label>'
             '<input id="l_skill" list="l_skills" placeholder="Start typing — or name one that isn\'t in the Atlas yet" autocomplete="off">'
             '<datalist id="l_skills"></datalist></div>') if skill_field else (
             f'<input type="hidden" id="l_skill" value="{pre}">')
    return f"""<div class="wrap"><section class="letter reveal" id="letter" aria-labelledby="letter-h">
  <div class="lhead">
    <div class="eyebrow">Write to me</div>
    <h2 class="serif" id="letter-h">{heading}</h2>
    <p class="lsub">{sub}</p>
  </div>
  <div class="lbox" id="lbox">
    {skill}
    <div class="sheet">
      <div class="lhd"><div class="to">Dear Arnaud,</div><div class="date" id="l_date"></div></div>
      <label for="l_body" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your letter</label>
      <textarea id="l_body" placeholder="The skill I keep coming back to is… Tell me why it pulls at you, how you'd want to learn it, and what you'd want to be able to do with it."></textarea>
      <div class="sign"><div class="yours">Talk soon,</div><div class="name" id="l_sign"></div></div>
    </div>
    <div class="prompts" id="l_prompts"></div>
    <div class="lrow">
      <button class="btn" id="l_send" type="button">Send this letter &rarr;</button>
      <span class="lcount" id="l_count">0 words</span>
    </div>
    <div class="sign-off" id="l_signoff">
      <div class="sh serif">Sign it, so I know who I'm writing back to.</div>
      <p class="sp">Your letter goes straight to my inbox, and sending it puts you in the Circle — that's how I stay in touch when I find a master worth your time. Never a drip. Unsubscribe in one click.</p>
      <div class="sotwo">
        <div class="lfield" style="margin:0"><label for="l_name">First name</label><input id="l_name" placeholder="Marie" autocomplete="given-name"></div>
        <div class="lfield" style="margin:0"><label for="l_email">Email</label><input id="l_email" type="email" placeholder="you@example.com" autocomplete="email"></div>
      </div>
      <div class="lrow"><button class="btn" id="l_confirm" type="button">Send it to Arnaud &rarr;</button></div>
      <div class="lerr" id="l_err"></div>
      <div class="lfine">It goes to me, Arnaud. I'm the only one who reads it.</div>
    </div>
  </div>
  <div class="ldone" id="l_done">
    <div class="eyebrow">Sent</div>
    <h3 class="serif" id="l_donehead">Your letter is with me.</h3>
    <p id="l_donebody">I read every one myself, and I answer.</p>
    <p class="lpoem">Every craft on this map started with somebody saying it out loud.</p>
    <a class="lback" href="/about">The story of why I built this &rarr;</a>
  </div>
</section></div>"""


# The letter's behaviour, shared with the short craft sheets. On the browse home
# the page's own copy runs; a craft sheet gets this one, and knows its slug.
LETTER_JS = r"""
(function(){
  var $=function(id){return document.getElementById(id);};
  var skillIn=$("l_skill"),body=$("l_body"),nameIn=$("l_name"),emailIn=$("l_email");
  if(!skillIn||!body) return;
  var SLUG=(document.body.getAttribute("data-craft-slug")||"");

  var dl=$("l_skills");
  if(dl&&window.ET_ATLAS_INDEX){
    (window.ET_ATLAS_INDEX.crafts||[]).map(function(c){return c.name;})
      .sort(function(a,b){return a.localeCompare(b);})
      .forEach(function(n){var o=document.createElement("option");o.value=n;dl.appendChild(o);});
  }

  var MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var now=new Date();$("l_date").textContent=MN[now.getMonth()]+" "+now.getDate()+", "+now.getFullYear();

  function words(){var t=body.value.trim();return t?t.split(/\s+/).length:0;}
  function syncCount(){var n=words();$("l_count").textContent=n+" word"+(n===1?"":"s");}
  function syncSign(){$("l_sign").textContent=(nameIn&&nameIn.value.trim())||"";}
  body.addEventListener("input",syncCount);
  if(nameIn)nameIn.addEventListener("input",syncSign);
  syncCount();

  var PROMPTS=[
    ["The craft","The skill I keep coming back to is "],
    ["Why it pulls","What pulls me to it is "],
    ["How I'd learn it","I'd want to learn it by "],
    ["A year from now","A year from now I'd want to be able to "],
    ["What stops me","What stops me right now is "]
  ];
  var pbox=$("l_prompts");
  PROMPTS.forEach(function(p){
    var b=document.createElement("button");b.type="button";b.textContent=p[0];
    b.onclick=function(){
      var v=body.value, pad=(v && !/\n\s*$/.test(v))?"\n\n":"";
      body.value=v+pad+p[1];body.focus();
      try{body.selectionStart=body.selectionEnd=body.value.length;}catch(e){}
      syncCount();
    };
    pbox.appendChild(b);
  });

  $("l_send").onclick=function(){
    if(words()<3){body.focus();body.style.backgroundColor="rgba(210,138,82,.12)";
      setTimeout(function(){body.style.backgroundColor="";},900);return;}
    var so=$("l_signoff");so.classList.add("on");
    setTimeout(function(){try{nameIn.focus();}catch(e){}so.scrollIntoView({behavior:"smooth",block:"nearest"});},120);
  };

  function flag(el){el.focus();el.style.borderColor="#d28a52";setTimeout(function(){el.style.borderColor="";},1600);}

  var PK="et_letter_pending";
  function stash(p){try{localStorage.setItem(PK,JSON.stringify(p));}catch(e){}}
  function unstash(){try{localStorage.removeItem(PK);}catch(e){}}
  var flushing=false;
  function flush(){
    var sb=window.supabaseClient;if(!sb||flushing)return;
    var raw;try{raw=localStorage.getItem(PK);}catch(e){return;}
    if(!raw)return;
    var p;try{p=JSON.parse(raw);}catch(e){unstash();return;}
    if(!p||!p.email){unstash();return;}
    flushing=true;
    sb.from("launch_waitlist").insert(p).then(function(res){
      flushing=false;
      if(!res.error){unstash();if(window.plausible)window.plausible("AtlasLetterRecovered",{props:{source:p.source}});}
    }).catch(function(){flushing=false;});
  }
  flush();setTimeout(flush,2500);

  $("l_confirm").onclick=async function(){
    var btn=this,err=$("l_err");err.style.display="none";
    var nm=(nameIn.value||"").trim(), em=(emailIn.value||"").trim(), txt=body.value.trim(), sk=(skillIn.value||"").trim();
    if(!nm)return flag(nameIn);
    if(!em||em.indexOf("@")<1||em.indexOf(".")<0)return flag(emailIn);

    btn.disabled=true;btn.textContent="Sending…";
    var interests=[{kind:"profile",name:nm}];
    if(sk)interests.push(SLUG?{kind:"discipline",discipline:sk,slug:SLUG,label:sk}
                             :{kind:"discipline",discipline:sk});
    interests.push({kind:"dream",text:txt});
    var payload={email:em,interests:interests,source:SLUG?("atlas-letter:"+SLUG):"atlas-letter"};

    try{
      var sb=window.supabaseClient;
      if(!sb)throw new Error("offline");
      var res=await sb.from("launch_waitlist").insert(payload);
      if(res&&res.error)throw res.error;
      unstash();
      if(window.plausible)window.plausible("AtlasLetter",{props:{skill:sk||"unnamed"}});

      // The letter is already on its way to Arnaud — the insert fires notify-lead.
      // Now found their account, the same way /circle's seal does: a magic link,
      // no password, ever. This is deliberately AFTER the insert and its failure
      // is not fatal — a letter that reached him is worth more than an account,
      // and we must never lose the letter because auth had a bad minute.
      var acct=false;
      try{
        var otp=await sb.auth.signInWithOtp({email:em,
          options:{emailRedirectTo:window.location.origin+"/portrait",shouldCreateUser:true}});
        acct=!(otp&&otp.error);
        if(!acct)console.warn("[Letter] account link failed:",otp&&otp.error);
        if(acct&&window.plausible)window.plausible("AtlasLetterAccountLink");
      }catch(ae){console.warn("[Letter] account link threw:",ae);}

      $("l_donehead").textContent="Your letter is with me, "+nm+".";
      $("l_donebody").textContent=acct
        ? "I read every one myself, and I answer. You're in the Circle now — and I've sent a sign-in link to "+em+". One click and this letter, and the crafts you pick from here, live on a page that's yours. No password, ever."
        : "I read every one myself, and I answer. Your letter is safe with me — but the sign-in link didn't go out just now, so there's no account waiting yet. Ask for a fresh one at educatedtraveler.app/you, or just write to me at arnaudcallier@pm.me. Either way I'll write when I find the master, the place and the moment that fit what you just told me.";
      $("lbox").style.display="none";
      $("l_done").classList.add("on");
      $("letter").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(e){
      console.error("[Letter] insert failed:",e);
      stash(payload);
      btn.disabled=false;btn.textContent="Send it to Arnaud →";
      err.innerHTML='That didn’t go through just now — your letter is safe on this screen. Try once more, or send it straight to <a href="mailto:arnaudcallier@pm.me">arnaudcallier@pm.me</a>, which reaches the same inbox.';
      err.style.display="block";
    }
  };
})();
"""


# The only visual rules the move adds: a card whose craft isn't open yet reads
# quieter, and the line it carries instead names what actually opens it.
HUB_EXTRA_CSS = """
/* a craft nobody has asked for yet — same card, quieter */
.dcard.shut,.gcard.shut{background:rgba(20,17,13,.55)}
.dcard.shut::before,.gcard.shut::before{opacity:.24}
.dcard.shut .craftname,.gcard.shut .craftname{opacity:.9}
.dcard.shut .wherealive,.gcard.shut .wherealive{opacity:.8}
/* the one line a locked card carries. It names the person, because the thing that
   opens the craft is a letter to him and nothing else — not a sign-up, not a fee. */
.askline{color:var(--ember)!important;letter-spacing:.04em}

/* the band above the browse — what the Circle opened, newest first */
.newopen{padding:36px 0 6px}
.newopen .nohead{max-width:62ch;margin-bottom:20px}
.newopen h2{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(23px,3.2vw,34px);line-height:1.1;letter-spacing:-.01em;margin:11px 0 12px}
.newopen .nosub{color:var(--muted);font-size:14.5px;line-height:1.7}
.newopen .nosub b{color:var(--paper);font-weight:400}
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


def opened_band(items, n_asked, n_open):
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
    as nobody asked. The section says the mechanism once; the card says the day.

    Every craft the Circle opened is in here, not the first four (2026-08-25). It is
    a rail rather than a grid because "the crafts someone asked for" showing four of
    twenty-eight is a claim the section does not keep, and cutting the sentence is
    worse than making the row scroll.

    items: [{id, name, place, country, color, opened, why, blurb}] in display order.
    n_asked / n_open: real, derived, and printed rather than typed.
    """
    if not items:
        return ""
    n_mine = n_open - n_asked
    # The second half of the sentence only exists while there are sheets Arnaud
    # wrote himself. If that ever goes to zero the line must not still claim them.
    mine = (f" The other {n_mine} I opened myself." if n_mine > 1 else
            " The other one I opened myself." if n_mine == 1 else "")
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
            f'<article class="gcard{" walks" if nplaces > 1 else ""}" style="--sc:{e(it["color"])}">'
            f'<a class="cardlink" href="/atlas/{e(it["id"])}" aria-label="Open the '
            f'{e(it["name"])} skill sheet"></a>'
            f'<div class="openedon">Opened <b>{e(it["opened"])}</b></div>'
            f'<span class="craftname">{e(it["name"])}</span>'
            + (f'<div class="wherealive"><span class="in">in</span> {e(where)}</div>' if where else "")
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
        '<p class="nosub">Every craft here starts as a short entry. When a real person names '
        'one — in a letter, on a raise-your-hand form, or on the way into the Circle — I do '
        'the work behind it: the places, the schools, the reason to go. Then it opens. '
        f'<b>{n_asked} of the {n_open} open crafts</b> got here that way.{mine} Each date is '
        'the day the ask landed.</p>'
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
               f'open in full. A letter to Arnaud opens the rest.">', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="The EducatedTraveler Atlas: {total} hands-on '
               f'skills you can go and learn worldwide — learn tango in Buenos Aires, watchmaking '
               f'in the Vallee de Joux, pottery in Mashiko. {n_open} are open in full, with the '
               f'school we\'d send you to. A letter to Arnaud opens the rest.">', t, count=1)

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
    band = opened_band(list(opened), n_asked, n_open)
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
