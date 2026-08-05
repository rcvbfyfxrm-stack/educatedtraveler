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
     the rosette drawn as a circle rather than a rounded box.

The letter, and the letter alone, is also shared with the short craft sheets —
LETTER_CSS / LETTER_JS / letter_section() below. One letter on the site.
"""
import html
import re
from pathlib import Path

e = html.escape

TEMPLATE = Path(__file__).resolve().parent / "atlas-hub-template.html"


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
.lfield input{width:100%;background:rgba(243,237,226,.04);border:1px solid rgba(243,237,226,.16);border-radius:12px;color:var(--paper);font-family:inherit;font-size:14.5px;padding:12px 14px;outline:none;transition:border-color .2s}
.lfield input:focus{border-color:rgba(127,168,165,.6)}
.lfield input::placeholder{color:rgba(243,237,226,.3)}
.sheet{position:relative;background:linear-gradient(180deg,var(--sheet) 0%,#ece1cc 100%);border-radius:5px;padding:30px 30px 26px;color:var(--sheet-ink);border:1px solid var(--sheet-edge);box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 30px 60px -24px rgba(0,0,0,.6),0 2px 10px rgba(0,0,0,.35)}
.sheet::after{content:"";position:absolute;left:14px;right:14px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.1),transparent)}
.sheet .to{font-family:'Fraunces',Georgia,serif;font-size:19px;margin-bottom:2px}
.sheet .date{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--sheet-faint);margin-bottom:16px}
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
      <div class="to">Dear Arnaud,</div>
      <div class="date" id="l_date"></div>
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
      <p class="sp">Your letter goes straight to my inbox, and sending it puts you in the Circle — that's how I stay in touch when I find a master worth your time. No selling, ever. Unsubscribe in one click.</p>
      <div class="sotwo">
        <div class="lfield" style="margin:0"><label for="l_name">First name</label><input id="l_name" placeholder="Marie" autocomplete="given-name"></div>
        <div class="lfield" style="margin:0"><label for="l_email">Email</label><input id="l_email" type="email" placeholder="you@example.com" autocomplete="email"></div>
      </div>
      <div class="lrow"><button class="btn" id="l_confirm" type="button">Send it to Arnaud &rarr;</button></div>
      <div class="lerr" id="l_err"></div>
      <div class="lfine">I'm the only one who reads it.</div>
    </div>
  </div>
  <div class="ldone" id="l_done">
    <div class="eyebrow">Sent</div>
    <h3 class="serif" id="l_donehead">Your letter is with me.</h3>
    <p id="l_donebody">I read every one myself, and I answer. You're in the Circle now — I'll write when I find the master, the place and the moment that fit what you just told me.</p>
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
        : "I read every one myself, and I answer. You're in the Circle now — I'll write when I find the master, the place and the moment that fit what you just told me.";
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
# quieter, and the rotating ticker under the rosette is a circle, echoing the
# five rings above it instead of sitting under them as a box.
HUB_EXTRA_CSS = """
/* a craft nobody has asked for yet — same card, quieter */
.dcard.shut,.gcard.shut{background:rgba(20,17,13,.55)}
.dcard.shut::before,.gcard.shut::before{opacity:.24}
.dcard.shut .cred-eyebrow,.gcard.shut .cred-eyebrow{color:var(--ember);opacity:.9}
.dcard.shut .craftname,.gcard.shut .craftname{opacity:.9}
.askline{color:var(--sea)!important;letter-spacing:.06em}

/* the ticker: a circle under the rings, echoing them, not a box beneath them */
.cam-tick{width:min(56vw,204px);height:min(56vw,204px);margin:2px auto 0;padding:20px 22px;
  border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;background:radial-gradient(circle at 50% 34%,rgba(20,17,13,.96),rgba(13,11,9,.96) 72%);
  border:1px solid var(--line);box-shadow:0 14px 38px rgba(0,0,0,.5),inset 0 0 34px rgba(127,168,165,.05)}
.cam-tick:hover{border-color:var(--sea);background:radial-gradient(circle at 50% 34%,rgba(28,24,19,.98),rgba(13,11,9,.98) 72%)}
.cam-tick .lab{margin-bottom:8px;max-width:16ch;line-height:1.5}
.cam-tick .craft{font-size:clamp(14px,1.9vw,17px);line-height:1.18}
.cam-tick .place{margin-top:5px;font-size:10.5px}
"""


def build(analytics, site, total, n_open, generated_at):
    """Turn the live /browse file into /atlas/index.html.

    Everything that makes the page what it is comes from the template. Only the
    address, the data source and the two rules above are ours.
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
               f'<meta property="og:description" content="{total} crafts, five worlds. '
               f'{n_open} are open — the full sheet, every place, the schools — because a member '
               f'asked for them. Write me a letter and that is what opens the rest.">', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="The EducatedTraveler Atlas: all {total} crafts '
               f'across five worlds. {n_open} are open, with the school and the teacher we\'d send '
               f'you to. The rest show what the craft is and where it\'s most alive — write a '
               f'letter and I open it.">', t, count=1)

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
    return t
