"""The Atlas browse home — website/atlas/index.html.

This is /browse, moved to the place it belongs and taught the difference between a
craft that's open and a craft nobody has asked for yet. Every craft is on it. The
open ones carry the school and the reason to go; the rest carry what the craft is
and the one place it's most alive, and their card leads to the letter box.

It reads window.ET_ATLAS_INDEX (website/js/atlas-index.js, generated alongside this
page) — NOT repertoire.js, which is 1.2 MB of research and is no longer served.

Called by scripts/build-atlas-pages.py, which owns the counts: nothing here is typed.
"""
import html

e = html.escape

import html as _html

# ── The letter ──────────────────────────────────────────────────────────────
# Ported from the /browse letter (commit ab3e00d) rather than rebuilt: a sheet of
# ruled paper, not a form. Shared with the short craft sheets via LETTER_CSS so
# there is one letter on the site, in one voice, writing one shape of row.
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
/* who from the Circle already wants this craft — drawn only from real rows */
.cint{font-size:11.5px;color:var(--sea);margin-top:9px;padding-top:9px;border-top:1px solid var(--line);line-height:1.45}
.cint:empty{display:none}
.cint .cint-dot{font-size:7px;vertical-align:2px;margin-right:6px;opacity:.85}
"""

LETTER_FONTS = ("https://fonts.googleapis.com/css2?family=Caveat:wght@400;600"
                "&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500"
                "&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap")


def letter_section(heading, sub, skill_field=True, prefill=""):
    """The letter itself. skill_field=False on a craft sheet, where the craft is
    already known and asking again would be a form pretending to be a letter."""
    pre = _html.escape(prefill, quote=True)
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
      <div class="sign"><div class="yours">Yours,</div><div class="name" id="l_sign"></div></div>
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


# The letter's behaviour. One copy, used by the browse home and by every craft
# sheet that isn't open yet. Writes ONE launch_waitlist row in exactly the shape
# /circle writes — {kind:profile,name} · {kind:discipline,discipline,slug} ·
# {kind:dream,text} — so notify-lead puts it in Arnaud's inbox and circle-welcome
# answers it. Sending the letter IS joining; there is no second step to forget.
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

  // openers, not scripts — they put the cursor where the honest answer goes
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

  // arriving from a card's ✎ Write, or from an /atlas/?skill=… link
  function openLetter(craft){
    if(craft&&skillIn)skillIn.value=craft;
    var sec=$("letter");
    if(sec)sec.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(function(){try{body.focus();}catch(e){}},520);
  }
  document.addEventListener("click",function(e){
    var b=e.target.closest?e.target.closest(".writebtn"):null;
    if(!b||e.defaultPrevented)return;
    e.preventDefault();e.stopPropagation();
    openLetter(b.getAttribute("data-write-craft"));
  });
  try{
    var qp=new URLSearchParams(location.search).get("skill");
    if(qp)setTimeout(function(){openLetter(qp);},300);
  }catch(e){}

  $("l_send").onclick=function(){
    // backgroundColor, not the background shorthand — the shorthand would wipe
    // the ruled-paper background-image and never bring it back
    if(words()<3){body.focus();body.style.backgroundColor="rgba(210,138,82,.12)";
      setTimeout(function(){body.style.backgroundColor="";},900);return;}
    var so=$("l_signoff");so.classList.add("on");
    setTimeout(function(){try{nameIn.focus();}catch(e){}so.scrollIntoView({behavior:"smooth",block:"nearest"});},120);
  };

  function flag(el){el.focus();el.style.borderColor="#d28a52";setTimeout(function(){el.style.borderColor="";},1600);}

  // A letter lost to a network blip is a letter Arnaud never sees, so a failed
  // send is stashed and retried — and never reported as sent.
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
    // slug when we know it (a craft sheet), so refresh-unlocked never has to guess
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
      $("l_donehead").textContent="Your letter is with me, "+nm+".";
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

CSS = """
:root{--ink:#0d0b09;--ink2:#14110d;--ink3:#1c1813;--paper:#f3ede2;--muted:rgba(243,237,226,.56);--faint:rgba(243,237,226,.34);--sea:#7fa8a5;--ember:#d28a52;--gold:#e7b54e;--line:rgba(243,237,226,.09)}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:var(--ink);color:var(--paper);font-weight:300;line-height:1.6;overflow-x:hidden}
::selection{background:rgba(210,138,82,.3)}
a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;color:inherit;background:none;border:none}
.serif{font-family:'Fraunces',Georgia,serif}.mono{font-family:'IBM Plex Mono',monospace}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--sea)}
.wrap{max-width:1320px;margin:0 auto;padding:0 clamp(16px,3.4vw,38px)}
nav.top{position:fixed;top:0;left:0;right:0;z-index:80;background:rgba(13,11,9,.66);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
nav.top .row{max-width:1320px;margin:0 auto;padding:0 clamp(16px,3.4vw,38px);height:60px;display:flex;align-items:center;justify-content:space-between}
nav.top .brand{font-family:'Fraunces',Georgia,serif;font-size:17px;letter-spacing:.14em}.brand b{color:var(--sea);font-weight:400}
nav.top .links{display:flex;gap:24px;align-items:center}.links a{font-size:14px;opacity:.62;transition:opacity .25s,color .25s}.links a:hover{opacity:1;color:var(--sea)}
nav.top .join{opacity:1!important;border:1px solid rgba(243,237,226,.2);padding:7px 15px;border-radius:99px}.join:hover{border-color:var(--sea)}
@media(max-width:820px){nav.top .links a:not(.join){display:none}}

.hero{padding:84px 0 22px;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0;transition:background 1.4s ease}
.hero .wrap{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:34px;align-items:center}
.hero-copy h1{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(31px,4.4vw,52px);line-height:1.06;letter-spacing:-.02em;margin:14px 0 14px}.hero-copy h1 em{font-style:italic;color:var(--sea)}
.hero-copy .sub{color:var(--muted);max-width:52ch;font-size:clamp(14px,1.5vw,16px)}
.hero-copy .sub b{color:var(--paper);font-weight:500}
.hero-copy .tag{margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.cues{margin-top:20px;display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 22px;border-radius:99px;font-size:14px;font-weight:500;background:linear-gradient(135deg,var(--sea),var(--ember) 130%);color:#14110d;transition:transform .25s,box-shadow .25s,filter .25s}.btn:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(127,168,165,.22);filter:brightness(1.05)}
.btn-ghost{display:inline-block;padding:12px 20px;border-radius:99px;font-size:14px;border:1px solid rgba(243,237,226,.2);transition:border-color .25s,background .25s}.btn-ghost:hover{border-color:var(--sea);background:rgba(243,237,226,.04)}

.cam-wrap{position:relative;width:min(88vw,430px);margin:0 auto}
.cam{width:100%;display:block;overflow:visible;filter:drop-shadow(0 24px 50px rgba(0,0,0,.5))}
.petal{fill-opacity:.22;cursor:pointer;transition:fill-opacity .3s}
.petal:hover,.petal.hov{fill-opacity:.5}.petal.active{fill-opacity:.62}
.hit{cursor:pointer}
.petal:focus{outline:none}.petal:focus-visible{outline:1px dashed rgba(243,237,226,.6);outline-offset:2px}
.ring{fill:none;stroke-width:2.3;stroke-opacity:.68;pointer-events:none;transition:stroke-opacity .3s,stroke-width .3s}
.ring.active{stroke-opacity:1;stroke-width:3.2}
.heart{fill:var(--ink);stroke:rgba(243,237,226,.24);stroke-width:.9;pointer-events:none}
.wlabel{font-family:'Fraunces',Georgia,serif;font-size:11.5px;fill:var(--paper);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--ink);stroke-width:2.6;stroke-linejoin:round}
.wcount{font-family:'IBM Plex Mono',monospace;font-size:7.5px;fill:rgba(243,237,226,.55);text-anchor:middle;pointer-events:none;letter-spacing:.05em;paint-order:stroke;stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round}
.cam-tick{display:block;width:100%;margin-top:14px;padding:11px 16px;border:1px solid var(--line);border-radius:14px;background:rgba(20,17,13,.5);text-align:center;transition:border-color .25s,background .25s}
.cam-tick:hover{border-color:var(--sea);background:rgba(20,17,13,.85)}
.cam-tick .lab{display:block;font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--faint);margin-bottom:5px}
.cam-tick .rot{display:block;opacity:0;transition:opacity .5s}.cam-tick .rot.on{opacity:1}
.cam-tick .craft{font-family:'Fraunces',Georgia,serif;font-size:clamp(14px,1.9vw,17px);line-height:1.15}
.cam-tick .place{font-size:11px;color:var(--ember);margin-top:3px;display:inline-block}
.legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}
.legend button{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted);padding:5px 11px;border:1px solid var(--line);border-radius:99px;transition:all .2s}
.legend button:hover{color:var(--paper)}.legend button.on{color:var(--paper);border-color:var(--lc)}
.legend .d{width:9px;height:9px;border-radius:2px;background:var(--lc)}
@media(max-width:880px){.hero .wrap{grid-template-columns:1fr;gap:18px}.hero-copy{text-align:center}.cues{justify-content:center}}

.studio{padding:12px 0 30px}.studio .grid{display:grid;grid-template-columns:272px minmax(0,1fr);gap:26px;align-items:start}
@media(max-width:880px){.studio .grid{grid-template-columns:minmax(0,1fr)}}
.side{position:sticky;top:74px;border:1px solid var(--line);border-radius:16px;background:var(--ink2);padding:16px 16px 8px;max-height:calc(100vh - 90px);overflow:auto}
@media(max-width:880px){.side{position:static;max-height:none}}
.side h4{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--sea);margin:16px 0 8px}.side h4:first-child{margin-top:2px}
.fin{width:100%;background:rgba(243,237,226,.05);border:1px solid var(--line);border-radius:10px;padding:9px 11px;color:var(--paper);font-size:13.5px;font-family:inherit}.fin:focus{outline:none;border-color:rgba(127,168,165,.5)}
select.fin option{background:var(--ink2)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.03em;padding:6px 10px;border-radius:99px;border:1px solid var(--line);color:var(--muted);transition:all .2s;white-space:nowrap}
.chip:hover{color:var(--paper);border-color:rgba(243,237,226,.3)}.chip.on{color:#14110d;background:var(--cc,var(--sea));border-color:transparent;font-weight:500}
.chip .wd{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cc);margin-right:6px;vertical-align:middle}.chip.on .wd{background:#14110d}
.staterow{display:flex;gap:6px}.staterow .chip{flex:1;text-align:center}
.reset{width:100%;margin:14px 0 10px;padding:9px;border:1px solid var(--line);border-radius:10px;font-size:13px;color:var(--muted)}.reset:hover{border-color:var(--ember);color:var(--paper)}
.sidenote{font-size:11.5px;color:var(--faint);line-height:1.55;margin:10px 2px 4px}

.results{min-height:60vh;min-width:0}
.rhead{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin:2px 2px 18px;flex-wrap:wrap}
.rhead .count{font-family:'Fraunces',Georgia,serif;font-size:clamp(20px,2.6vw,26px)}.rhead .count b{color:var(--sea);font-weight:400}
.rhead .sortby{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--faint)}
.shelf{margin-bottom:30px}.shelf-h{display:flex;align-items:center;gap:12px;margin:0 2px 12px;cursor:pointer;border-radius:10px;padding:4px 6px;transition:background .2s}.shelf-h:hover{background:rgba(243,237,226,.04)}.shelf-h:hover h3{color:var(--sc)}
.shelf-h .bar{width:30px;height:3px;border-radius:3px;background:var(--sc)}.shelf-h h3{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:clamp(19px,2.4vw,25px);transition:color .2s}.shelf-h .n{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--faint)}.shelf-h .more{margin-left:auto;font-size:12.5px;color:var(--muted)}.shelf-h:hover .more{color:var(--sc)}
.cathead{margin:2px 2px 22px;position:relative}.cathead .backcat{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:16px;display:inline-flex;align-items:center;gap:6px}.cathead .backcat:hover{color:var(--sea)}.cathead .catbar{width:46px;height:4px;border-radius:4px;background:var(--sc);margin-bottom:13px}.cathead .catttl{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(28px,4.2vw,46px);line-height:1.04;letter-spacing:-.01em}.cathead .catsub{color:var(--muted);max-width:56ch;margin-top:9px;font-size:14.5px}
.railwrap{position:relative}.rail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;scroll-behavior:smooth;padding:4px 2px 14px;scrollbar-width:none;cursor:grab}.rail::-webkit-scrollbar{display:none}.rail.drag{cursor:grabbing;scroll-behavior:auto}
.arrow{position:absolute;top:34%;z-index:5;width:42px;height:42px;border-radius:50%;background:rgba(28,24,19,.96);border:1px solid rgba(243,237,226,.28);color:var(--paper);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s,border-color .25s,background .25s,transform .2s;font-size:20px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.55)}.arrow.show{opacity:.95;pointer-events:auto}.railwrap:hover .arrow.show{opacity:1}.arrow:hover{border-color:var(--sea);background:var(--sea);color:#14110d;transform:scale(1.06)}.arrow.l{left:6px}.arrow.r{right:6px}
@media(max-width:820px){.arrow{display:none}}

.dcard,.gcard{background:var(--ink2);border:1px solid var(--line);border-radius:14px;padding:17px;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s,box-shadow .3s;display:block}
/* the whole card opens the craft sheet — a stretched link under the content, so
   the one real button on the card (write to Arnaud) still gets its own clicks */
.cardlink{position:absolute;inset:0;z-index:1;border-radius:inherit}
.cardlink:focus-visible{outline:1px dashed rgba(243,237,226,.6);outline-offset:-3px}
.writebtn{position:absolute;top:10px;right:10px;z-index:3;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:99px;padding:4px 9px;background:rgba(13,11,9,.92);transition:color .2s,border-color .2s,opacity .25s;line-height:1.3}
.writebtn:hover{color:var(--paper);border-color:var(--sea)}
@media(hover:hover){.writebtn{opacity:0}.dcard:hover .writebtn,.gcard:hover .writebtn,.dcard:focus-within .writebtn,.gcard:focus-within .writebtn,.writebtn:focus-visible{opacity:1}}
.dcard{scroll-snap-align:start;flex:0 0 auto;width:clamp(228px,25vw,262px)}
.dcard::before,.gcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--sc);opacity:.5;transition:opacity .3s}
.dcard:hover,.gcard:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--sc) 45%,var(--line));box-shadow:0 18px 40px rgba(0,0,0,.45)}.dcard:hover::before,.gcard:hover::before{opacity:1}
.dcard.shut,.gcard.shut{background:rgba(20,17,13,.55)}
.dcard.shut::before,.gcard.shut::before{opacity:.24}
.pick{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.shutflag{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ember);border:1px solid rgba(210,138,82,.3);border-radius:99px;padding:2px 8px;margin-bottom:9px}
.openflag{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#14110d;font-weight:600;background:linear-gradient(135deg,#7fa8a5,#a3cdc9);border-radius:5px;padding:2px 8px;margin-bottom:9px}
.cred-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:6px}
.crafthead{display:flex;align-items:baseline;gap:9px;margin-bottom:8px}
.cglyph{font-size:13px;color:var(--faint);flex:0 0 auto;line-height:1}
.craftname{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:20px;line-height:1.12;color:var(--paper)}
.tradition{font-size:12px;color:var(--muted);font-style:italic;margin:-2px 0 10px;line-height:1.4}
.why-rest{font-size:14px;color:var(--paper);opacity:.86;line-height:1.5;margin:0 0 11px;padding-left:10px;border-left:2px solid rgba(210,138,82,.55);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.blurb-rest{font-size:13.5px;color:var(--paper);opacity:.72;line-height:1.5;margin:0 0 11px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.trustline{font-size:12.5px;color:var(--muted);margin-bottom:9px;line-height:1.45}
.trustline .school{color:rgba(243,237,226,.78)}
.goldstar{color:var(--gold);font-family:'IBM Plex Mono',monospace;font-size:11px;white-space:nowrap}
.placeline{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:rgba(243,237,226,.82);margin-bottom:9px}
.placeline .cdots{color:var(--sea);letter-spacing:2px;font-size:11px;flex:0 0 auto}
.cfoot{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.03em;color:var(--faint);line-height:1.55}
.askline{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:var(--sea);line-height:1.55}
.gridwrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(238px,1fr));gap:13px}
.empty{padding:60px 10px;text-align:center;color:var(--muted)}.empty .btn-ghost{margin-top:16px}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}.reveal.in{opacity:1;transform:none}
/* the quiet alternative to the letter — one door, not a second sales block */
.circle-alt{text-align:center;margin:34px 0 10px}
.circle-alt p{color:var(--faint);font-size:13.5px}
.circle-alt a{color:var(--sea);text-decoration:underline;text-underline-offset:3px}
.circle-alt a:hover{color:var(--paper)}
footer{border-top:1px solid var(--line);padding:34px 0 60px;font-size:13px;color:var(--faint)}footer a{color:var(--sea)}.frow{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
"""

SCRIPT = r"""
(function(){
"use strict";
var IDX=window.ET_ATLAS_INDEX||{crafts:[]};
var A=IDX.crafts||[];
var WORLDS={
  adventure:{label:"The Wild",short:"Wild",color:"#6fa3a0"},
  culinary:{label:"Kitchen & Cellar",short:"Kitchen",color:"#c9a24a"},
  creative:{label:"Craft & Art",short:"Craft",color:"#cf8f6e"},
  movement:{label:"Movement & Rhythm",short:"Movement",color:"#bf8088"},
  wellness:{label:"Body & Spirit",short:"Body",color:"#94ad86"}
};
var ORDER=["adventure","culinary","creative","movement","wellness"];
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function dots(n){n=n||0;return "●●●●●".slice(0,n)+"○○○○○".slice(0,5-n);}
function worldOf(c){return WORLDS[c.world]?c.world:"creative";}

var byWorld={};ORDER.forEach(function(w){byWorld[w]=[];});
A.forEach(function(c){byWorld[worldOf(c)].push(c);});
// Open crafts first inside each world, then by how strong the community is: what
// you can read right now sits in front of what you can ask for.
ORDER.forEach(function(w){byWorld[w].sort(function(a,b){return (b.open-a.open)||((b.rank||0)-(a.rank||0))||a.name.localeCompare(b.name);});});

/* the rosette — five rings, one per world, each passing through the heart */
var cam=document.getElementById("cam"),hub=document.getElementById("hub"),rot=document.getElementById("rot"),bg=document.getElementById("hero-bg"),legend=document.getElementById("legend");
var CX=120,CY=120,RR=56,PHI=2*Math.cos(Math.PI/5),LAB=1.42;
function pt(ang,r){var a=(ang-90)*Math.PI/180;return [CX+r*Math.cos(a),CY+r*Math.sin(a)];}
function f(p){return p[0].toFixed(2)+","+p[1].toFixed(2);}
function svgEl(n,a){var el=document.createElementNS("http://www.w3.org/2000/svg",n);for(var k in a)el.setAttribute(k,a[k]);return el;}
function petalPath(i){var P=pt(i*72-36,PHI*RR),Q=pt(i*72+36,PHI*RR);
  return "M"+f(P)+" A"+RR+","+RR+" 0 0 1 "+f(Q)+" A"+RR+","+RR+" 0 0 0 "+CX+","+CY+" A"+RR+","+RR+" 0 0 0 "+f(P)+" Z";}
var defs=svgEl("defs",{}),gHit=svgEl("g",{}),gFill=svgEl("g",{}),gRing=svgEl("g",{}),gLab=svgEl("g",{});
[defs,gHit,gFill,gRing,gLab].forEach(function(g){cam.appendChild(g);});
ORDER.forEach(function(w,i){var m=WORLDS[w],n=byWorld[w].length;
  var mk=svgEl("mask",{id:"weave"+i,maskUnits:"userSpaceOnUse"});
  mk.appendChild(svgEl("rect",{x:-20,y:-20,width:280,height:280,fill:"#fff"}));
  [pt(i*72-36,PHI*RR),pt(i*72-72,(PHI-1)*RR)].forEach(function(u){
    mk.appendChild(svgEl("circle",{cx:u[0].toFixed(2),cy:u[1].toFixed(2),r:2.4,fill:"#000"}));});
  defs.appendChild(mk);
  var pet=svgEl("path",{d:petalPath(i),"class":"petal",fill:m.color,"data-w":w,role:"button",tabindex:"0","aria-label":m.label+" — "+n+" crafts"});
  pet.addEventListener("click",function(){toggleWorld(w);});
  pet.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();toggleWorld(w);}});
  gFill.appendChild(pet);
  var c=pt(i*72,RR);
  gRing.appendChild(svgEl("circle",{cx:c[0].toFixed(2),cy:c[1].toFixed(2),r:RR,"class":"ring",stroke:m.color,mask:"url(#weave"+i+")","data-w":w}));
  var hit=svgEl("circle",{cx:c[0].toFixed(2),cy:c[1].toFixed(2),r:RR,"class":"hit",fill:"transparent"});
  hit.addEventListener("click",function(){toggleWorld(w);});
  hit.addEventListener("pointerenter",function(){pet.classList.add("hov");});
  hit.addEventListener("pointerleave",function(){pet.classList.remove("hov");});
  gHit.appendChild(hit);
  var pl=pt(i*72,LAB*RR);
  var t=svgEl("text",{"class":"wlabel",x:pl[0].toFixed(1),y:(pl[1]-2).toFixed(1)});t.textContent=m.short;gLab.appendChild(t);
  var q=svgEl("text",{"class":"wcount",x:pl[0].toFixed(1),y:(pl[1]+9).toFixed(1)});q.textContent=n+" crafts";gLab.appendChild(q);
  var lb=document.createElement("button");lb.style.setProperty("--lc",m.color);lb.dataset.w=w;lb.innerHTML='<span class="d"></span>'+esc(m.label)+' <span style="opacity:.5">'+n+'</span>';
  lb.onclick=function(){toggleWorld(w);};legend.appendChild(lb);
});
gLab.appendChild(svgEl("circle",{cx:CX,cy:CY,r:3.4,"class":"heart"}));
function syncWorld(){cam.querySelectorAll(".petal,.ring").forEach(function(p){p.classList.toggle("active",!!F.worlds[p.getAttribute("data-w")]);});legend.querySelectorAll("button").forEach(function(b){b.classList.toggle("on",!!F.worlds[b.dataset.w]);});}
function hexA(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}

/* the centre cycles OPEN crafts only — never advertise a page that isn't there yet */
var feats=[];
A.forEach(function(c){if(c.open&&c.place)feats.push({craft:c.name,place:c.place,color:WORLDS[worldOf(c)].color,id:c.id});});
feats.sort(function(a,b){return a.craft.localeCompare(b.craft);});
var ri=0,curFeat=null;
function tick(){if(!feats.length)return;var x=feats[ri%feats.length];curFeat=x;rot.classList.remove("on");
  setTimeout(function(){rot.innerHTML='<span class="craft">'+esc(x.craft)+'</span><br><span class="place">'+esc(x.place)+' <span style="opacity:.7">↗</span></span>';rot.classList.add("on");},280);
  bg.style.background="radial-gradient(800px 560px at 74% 26%,"+hexA(x.color,.15)+",transparent 60%),linear-gradient(180deg,var(--ink),var(--ink2))";ri++;}
if(feats.length){tick();setInterval(tick,2700);}else{document.querySelector(".cam-tick").style.display="none";}
hub.onclick=function(){if(curFeat&&curFeat.id){location.href="/atlas/"+curFeat.id;}};

/* ── filters ── */
var F={worlds:{},craft:"",q:"",state:""};
function anyFilter(){return Object.keys(F.worlds).length||F.craft||F.q||F.state;}
function toggleWorld(w){if(F.worlds[w])delete F.worlds[w];else F.worlds[w]=1;F.craft="";renderSide();render();syncWorld();document.getElementById("studio").scrollIntoView({behavior:"smooth"});}

var side=document.getElementById("side");
function craftOptions(){
  var ws=Object.keys(F.worlds);var ds=A.filter(function(c){return !ws.length||F.worlds[worldOf(c)];});
  ds=ds.slice().sort(function(a,b){return a.name.localeCompare(b.name);});
  return '<option value="">All crafts'+(ws.length?" in selection":"")+'</option>'+ds.map(function(c){return '<option value="'+esc(c.id)+'"'+(F.craft===c.id?" selected":"")+'>'+esc(c.name)+(c.open?"":" — not open yet")+'</option>';}).join("");
}
function renderSide(){
  var h="";
  h+='<h4>Search</h4><input class="fin" id="q" placeholder="skill, place, country…" value="'+esc(F.q)+'">';
  h+='<h4>World</h4><div class="chips">'+ORDER.map(function(w){return '<button class="chip world '+(F.worlds[w]?"on":"")+'" data-w="'+w+'" style="--cc:'+WORLDS[w].color+'"><span class="wd"></span>'+esc(WORLDS[w].short)+'</button>';}).join("")+'</div>';
  h+='<h4>Show</h4><div class="staterow">'
    +'<button class="chip st '+(F.state===""?"on":"")+'" data-s="">Everything</button>'
    +'<button class="chip st '+(F.state==="open"?"on":"")+'" data-s="open">Open</button>'
    +'<button class="chip st '+(F.state==="shut"?"on":"")+'" data-s="shut">Not open yet</button></div>';
  h+='<p class="sidenote">A craft opens when a member writes in about it. Anything not open still tells you what it is and where it’s most alive — and lets you ask.</p>';
  h+='<h4>Skill</h4><select class="fin" id="craft">'+craftOptions()+'</select>';
  h+='<button class="reset" id="reset">Clear</button>';
  side.innerHTML=h;
  side.querySelector("#q").oninput=function(){F.q=this.value;render();};
  side.querySelector("#craft").onchange=function(){F.craft=this.value;render();};
  side.querySelectorAll(".world").forEach(function(b){b.onclick=function(){toggleWorld(b.dataset.w);};});
  side.querySelectorAll(".st").forEach(function(b){b.onclick=function(){F.state=b.dataset.s;renderSide();render();};});
  side.querySelector("#reset").onclick=function(){F={worlds:{},craft:"",q:"",state:""};renderSide();render();syncWorld();};
}
function match(c){
  if(Object.keys(F.worlds).length&&!F.worlds[worldOf(c)])return false;
  if(F.craft&&c.id!==F.craft)return false;
  if(F.state==="open"&&!c.open)return false;
  if(F.state==="shut"&&c.open)return false;
  if(F.q){var q=F.q.toLowerCase();
    if((c.name+" "+(c.place||"")+" "+(c.country||"")+" "+(c.blurb||"")).toLowerCase().indexOf(q)<0)return false;}
  return true;
}

/* ── cards ── */
var GLYPH={adventure:"△",culinary:"◇",creative:"□",movement:"▽",wellness:"○"};
var NAMED=/google|tripadvisor|yelp|trustpilot|facebook/i;
function star(c){var s=c.star;if(s&&s.v&&s.n&&Number(s.n)>=30&&NAMED.test(s.src||""))return '<span class="goldstar">'+esc(String(s.v))+'★ · '+Number(s.n).toLocaleString()+' · '+esc(s.src)+'</span>';return "";}
function tradition(m){if(!m)return "";var t=/^lineage of\s+/i.test(m)?("in the lineage of "+m.replace(/^lineage of\s+/i,"")):("in the tradition of "+m);return '<div class="tradition">'+esc(t)+'</div>';}
function levelCue(lv){lv=(lv||"").toLowerCase().split("->")[0];return /intermediate|advanced|experienced|expert/.test(lv)?"For practitioners":"Open to beginners";}
function cardInner(c){
  var g=GLYPH[worldOf(c)]||"○";
  var head='<div class="crafthead"><span class="cglyph">'+g+'</span><span class="craftname">'+esc(c.name)+'</span></div>';
  var place='<div class="placeline"><span>'+esc(c.place)+(c.country?', '+esc(c.country):'')+'</span>'+(c.rank?'<span class="cdots">'+dots(c.rank)+'</span>':'')+'</div>';
  // the Circle line — filled in by atlas-circle-interest.js from real rows only,
  // and left empty (and invisible) when nobody has asked
  var cint='<div class="cint" data-craft="'+esc(c.name)+'"></div>';
  if(!c.open){
    return '<div class="shutflag">Not open yet</div>'+head
      +(c.blurb?'<div class="blurb-rest">'+esc(c.blurb)+'</div>':'')
      +place
      +'<div class="askline">Ask me to open this one →</div>'+cint;
  }
  var st=star(c);
  return '<div class="openflag">Open</div>'
    +(c.cred?'<div class="cred-eyebrow">'+esc(c.cred)+'</div>':'')
    +head+tradition(c.master)
    +(c.why?'<div class="why-rest">'+esc(c.why)+'</div>':'')
    +((c.school||st)?'<div class="trustline">'+(c.school?'<span class="school">at '+esc(c.school)+'</span>':'')+(st?(c.school?' · ':'')+st:'')+'</div>':'')
    +place
    +'<div class="cfoot">'+esc(levelCue(c.level))+(c.nDest>1?' · '+c.nDest+' places':'')+'</div>'+cint;
}
// An <article> with a stretched link, not an <a>: the card still opens the craft
// sheet anywhere you click, and the ✎ button keeps its own clicks.
function card(c,cls){
  var col=WORLDS[worldOf(c)].color;
  return '<article class="'+cls+(c.open?'':' shut')+'" style="--sc:'+col+'">'
    +'<a class="cardlink" href="/atlas/'+esc(c.id)+'" aria-label="'+esc(c.name)+'"></a>'
    +'<button class="writebtn" type="button" data-write-craft="'+esc(c.name)+'">✎ Write</button>'
    +cardInner(c)+'</article>';
}
function signalRender(){try{document.dispatchEvent(new CustomEvent("et:atlas-render"));}catch(e){}}

/* ── render ── */
var results=document.getElementById("results");
function render(){
  if(!anyFilter()){renderRails();return;}
  var list=A.filter(match).sort(function(a,b){return (b.open-a.open)||((b.rank||0)-(a.rank||0))||a.name.localeCompare(b.name);});
  var nOpen=list.filter(function(c){return c.open;}).length;
  var h='<div class="rhead"><div class="count"><b>'+list.length+'</b> craft'+(list.length===1?"":"s")+'</div><div class="sortby">'+nOpen+' open · '+(list.length-nOpen)+' waiting to be asked for</div></div>';
  if(!list.length){results.innerHTML='<div class="empty">Nothing matches that yet.<br><button class="btn-ghost" id="clr">Loosen the filters</button></div>';document.getElementById("clr").onclick=function(){F={worlds:{},craft:"",q:"",state:""};renderSide();render();syncWorld();};return;}
  h+='<div class="gridwrap">'+list.map(function(c){return card(c,"gcard");}).join("")+'</div>';
  results.innerHTML=h;
  signalRender();
}
function renderRails(){
  results.innerHTML='<div class="rhead"><div class="count">Browse <b>five worlds</b></div><div class="sortby">pick a ring, or search →</div></div>';
  ORDER.forEach(function(w){var m=WORLDS[w],list=byWorld[w];if(!list.length)return;
    var nOpen=list.filter(function(c){return c.open;}).length;
    var sec=document.createElement("div");sec.className="shelf";sec.style.setProperty("--sc",m.color);
    sec.innerHTML='<div class="shelf-h" role="button" tabindex="0" aria-label="Open the '+esc(m.label)+' catalogue"><span class="bar"></span><h3 class="serif">'+esc(m.label)+'</h3><span class="n">'+nOpen+' of '+list.length+' open</span><span class="more">See all '+list.length+' crafts →</span></div>';
    var rw=document.createElement("div");rw.className="railwrap";var rail=document.createElement("div");rail.className="rail";
    rail.innerHTML=list.map(function(c){return card(c,"dcard");}).join("");
    rw.appendChild(rail);
    var larrow,rarrow;
    ["l","r"].forEach(function(sd){var b=document.createElement("button");b.className="arrow "+sd;b.setAttribute("aria-label",sd==="l"?"Scroll back":"See more crafts");b.innerHTML=sd==="l"?"‹":"›";b.onclick=function(){rail.scrollBy({left:(sd==="l"?-1:1)*rail.clientWidth*0.85,behavior:"smooth"});};rw.appendChild(b);if(sd==="l")larrow=b;else rarrow=b;});
    function updateArrows(){var max=rail.scrollWidth-rail.clientWidth-2;larrow.classList.toggle("show",rail.scrollLeft>4);rarrow.classList.toggle("show",max>4&&rail.scrollLeft<max);}
    rail.addEventListener("scroll",updateArrows);
    sec.appendChild(rw);results.appendChild(sec);signalRender();
    var sh=sec.querySelector(".shelf-h");sh.onclick=function(){openCatalogue(w);};sh.onkeydown=function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();openCatalogue(w);}};
    enableDrag(rail);updateArrows();setTimeout(updateArrows,400);
  });
}
function openCatalogue(w){renderCatalogue(w);document.getElementById("studio").scrollIntoView({behavior:"smooth"});}
function renderCatalogue(w){var m=WORLDS[w],list=byWorld[w];
  var nOpen=list.filter(function(c){return c.open;}).length;
  var h='<div class="cathead" style="--sc:'+m.color+'"><button class="backcat" id="backcat">‹ All categories</button><div class="catbar"></div><h2 class="serif catttl">'+esc(m.label)+'</h2><p class="catsub"><b style="color:var(--paper);font-weight:500">'+list.length+' crafts</b> — '+nOpen+' open now, the rest waiting for someone to ask.</p></div>';
  h+='<div class="gridwrap">'+list.map(function(c){return card(c,"gcard");}).join("")+'</div>';
  results.innerHTML=h;
  signalRender();
  document.getElementById("backcat").onclick=function(){renderRails();document.getElementById("studio").scrollIntoView({behavior:"smooth"});};
}
function enableDrag(rail){var down=false,sx=0,sl=0,mv=0;
  rail.addEventListener("pointerdown",function(ev){down=true;mv=0;sx=ev.clientX;sl=rail.scrollLeft;rail.classList.add("drag");try{rail.setPointerCapture(ev.pointerId);}catch(_){}});
  rail.addEventListener("pointermove",function(ev){if(!down)return;var dx=ev.clientX-sx;mv=Math.max(mv,Math.abs(dx));rail.scrollLeft=sl-dx;});
  function up(){down=false;rail.classList.remove("drag");}rail.addEventListener("pointerup",up);rail.addEventListener("pointercancel",up);rail.addEventListener("pointerleave",up);
  rail.addEventListener("click",function(ev){if(mv>6)ev.preventDefault();},true);}
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});},{threshold:.1});
document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});

// /browse?core=culinary has been sending people here for months and the old page
// never read it. It does now.
(function(){try{
  var p=new URLSearchParams(location.search),w=p.get("world")||p.get("core");
  if(w&&WORLDS[w]){F.worlds[w]=1;}
  var q=p.get("q");if(q)F.q=q;
}catch(_){}})();

if(!A.length){results.innerHTML='<div class="empty">The Atlas didn’t load. <a href="/circle" style="color:var(--sea)">Tell me what you want to learn</a> and I’ll take it from there.</div>';}
else{renderSide();render();syncWorld();}
})();
"""


def build(nav_auth, nav_auth_toggle, analytics, site, total, n_open, generated_at):
    """Render the browse home. Every number is passed in — none is typed here."""
    letter = letter_section(
        "Found a skill you keep coming back to? Write me a letter about it.",
        "Not a form — a letter, and I read every one myself. Tell me <b>which craft</b> you're "
        "circling, <b>how</b> you'd want to learn it, and <b>who you'd want to be in it</b> a year "
        "from now. That last one is the one I care about most: how will you actually use this in "
        "your future?")
    title = "The Atlas — every craft, and where it's still alive | EducatedTraveler"
    desc = (f"All {total} crafts we've mapped, in one place. {n_open} are open — the full sheet, "
            f"every place, the schools, the teachers — because a member asked for them. The rest "
            f"show what the craft is and where it's most alive; ask, and that's what opens them.")
    jsonld = ('<script type="application/ld+json">{"@context": "https://schema.org", "@type": '
              '"BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": '
              f'"Atlas", "item": "{site}/atlas/"}}]}}</script>')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{site}/atlas/">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{site}/atlas/">
<meta property="og:image" content="{site}/images/logo-et-full.png">
<meta property="og:site_name" content="EducatedTraveler">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{LETTER_FONTS}" rel="stylesheet">
{jsonld}
{analytics}
<style>{CSS}{LETTER_CSS}</style>
</head>
<body>
<!-- built {e(generated_at)} — craft states come from data/atlas-unlocked.json -->
<nav class="top"><div class="row">
  <a class="brand" href="/">EDUCATED<b>TRAVELER</b></a>
  {nav_auth}
</div></nav>

<header class="hero">
  <div class="hero-bg" id="hero-bg"></div>
  <div class="wrap">
    <div class="hero-copy">
      <div class="eyebrow">The Atlas</div>
      <h1 class="serif">Every craft I've mapped,<br>and where it's <em>still alive</em>.</h1>
      <p class="sub">All <b>{total}</b> crafts are listed here, and <b>{n_open}</b> of them are open — the full sheet, every place, the schools, the teachers, the credential — because someone in the Circle wrote to me and asked for it. The rest show what the craft is and the one place it's most alive; write me a letter on any of them and that is what opens it.</p>
      <div class="tag">★ nobody pays to be listed · I introduce, you decide</div>
      <div class="cues"><a class="btn" href="#studio">Browse every craft</a><a class="btn-ghost" href="/circle">Join the Circle</a></div>
    </div>
    <div class="cam-wrap">
      <svg class="cam" id="cam" viewBox="0 0 240 240" role="group" aria-label="Choose a world"></svg>
      <button class="cam-tick" id="hub" aria-label="Open the highlighted craft"><span class="lab">tap a ring — or take this one</span><span class="rot on" id="rot"></span></button>
    </div>
  </div>
  <div class="wrap"><div class="legend" id="legend"></div></div>
</header>

<main class="studio" id="studio"><div class="wrap"><div class="grid">
  <aside class="side" id="side"></aside>
  <section class="results" id="results"></section>
</div></div></main>

{letter}

<div class="wrap"><div class="circle-alt reveal">
  <p>Rather answer a few questions than write? <a href="/circle">Join the Circle here</a> instead.</p>
</div></div>

<footer><div class="wrap frow">
  <span>EducatedTraveler — a place, a person, your people. <a href="/circle">Join the Circle</a> · <a href="/about">The Story</a> · <a href="/lab-weeks">Lab Weeks</a> · <a href="/journal/">Journal</a></span>
  <span style="opacity:.7">Privacy-light, cookieless analytics.</span>
</div></footer>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/supabase-config.js"></script>
{nav_auth_toggle}
<script src="/js/auth.js"></script>
<script src="/js/database.js"></script>
<script src="/js/atlas-index.js"></script>
<script defer src="/js/atlas-circle-interest.js"></script>
<!-- No circle-onboarding.js: the orb was a second front door with its own
     questionnaire. One door now — the letter below, or /circle. -->
<script>{SCRIPT}
{LETTER_JS}</script>
</body>
</html>"""
