/* ════════════════════════════════════════════════════════════════════
   The Circle — conversational onboarding (self-injecting, additive).
   Reads window.ET_ATLAS (repertoire.js) + window.supabaseClient.
   Saves to launch_waitlist (anon insert) — no migration.
   STRATEGY LOCK: no prices, no booking — we introduce.
   TRUST LOCK: every claim must be literally true of the data.

   Flow: the TURN (which life-moment is yours — warm mirror, founder-truth,
   NO fabricated science) → (intro = what ET is) → what pulls you (worlds,
   multi) → where you're starting from (experience) → how far → when → pick
   your skills (multi, up to 9) → keep them → the story + the Atlas.
   The turn derives a hidden motivation bias for scoring (o.motiv).
   Experience is a general starting-point signal (saved to the profile);
   the fine-grained level stays per-skill, refined later in the profile.
   No "solo vs group" question (the Circle IS the people).

   INSTALL  <script defer src="/js/circle-onboarding.js"></script>
   FIRST-THING  set window.ET_CIRCLE_AUTOOPEN = true before this loads to
     auto-open once on first visit (e.g. the homepage). Gated by the cap.
   TRIGGERS  orb launcher · .join / a[href="/#circle"] · timed nudge ·
     window.ETCircle.open(world). Namespaced .etc-*. Fully reversible.
═══════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.ETCircle) return;                       // singleton

  var CONFIG={
    timedNudge:true, nudgeAfterMs:20000, nudgeAfterScrollPct:35,
    capKey:"et_circle_state", showPrices:false,
    waitlistTable:"launch_waitlist", saveSource:"circle-onboarding",
    autoOpen:false, autoOpenDelayMs:1100, atlasUrl:"/browse", storyUrl:"/about"
  };
  var isMobile=matchMedia("(max-width:600px)").matches;
  function capState(){try{return JSON.parse(localStorage.getItem(CONFIG.capKey))||{};}catch(e){return{};}}
  function setCap(o){try{localStorage.setItem(CONFIG.capKey,JSON.stringify(Object.assign(capState(),o)));}catch(e){}}

  /* ── worlds ── */
  var WORLD_COLOR={wild:"#6fa3a0",kitchen:"#c9a24a",craft:"#cf8f6e",movement:"#bf8088",body:"#94ad86"};
  var WORLD_LABEL={wild:"The Wild",kitchen:"Kitchen & Cellar",craft:"Craft & Art",movement:"Movement",body:"Body & Spirit"};
  var CAT_WORLD={wellness:"body",adventure:"wild",culinary:"kitchen",creative:"craft"};
  var MOVEMENT_RE=/(dance|tango|flamenco|capoeira|salsa|ballet|samba|kizomba|bachata|rhythm|drum)/i;
  var EU_REGIONS=/(europe|mediterran|balkan|iberia|scandinav|nordic|alps|aegean)/i;

  /* ── data adapter: ET_ATLAS → scoreable crafts (keeps all destinations) ── */
  function worldOfDisc(d){if(MOVEMENT_RE.test(d.discipline))return"movement";return CAT_WORLD[d.category]||"craft";}
  function destOf(x){
    return {
      place:x.place+(x.country?", "+x.country:""),
      cont:EU_REGIONS.test(x.region||"")?"europe":"far",
      season:(x.bestSeason||"").toLowerCase().indexOf("year")>=0?"year-round":(x.bestSeason||"seasonal"),
      rank:x.communityRank||0, rankLabel:x.communityLabel||"", role:x.role||"",
      certified:(x.badges||[]).indexOf("gold-cred")>=0,
      hasSchool:!!((x.schoolsInfo||x.schools||[]).length)
    };
  }
  function adaptAtlas(atlas){
    var out=[];
    (atlas.disciplines||[]).forEach(function(d){
      var dests=(d.destinations||[]).map(destOf);
      if(!dests.length)return;
      var topId=null,topRank=-1;(d.destinations||[]).forEach(function(x){if((x.communityRank||0)>topRank){topRank=(x.communityRank||0);topId=x.id;}});
      out.push({
        id:topId||(d.discipline).toLowerCase().replace(/[^a-z0-9]+/g,"-"),
        world:worldOfDisc(d), craft:d.discipline, discipline:d.discipline,
        cred:d.goldCredential||d.certBody||"Hand-verified",
        dests:dests
      });
    });
    return out;
  }
  function sampleToCraft(c){
    return {id:c.id,world:c.world,craft:c.craft,discipline:c.discipline,cred:c.cred,
      dests:[{place:c.place,cont:c.cont,season:c.season,rank:c.rank,rankLabel:c.rankLabel,role:c.role,certified:!!c.certified,hasSchool:!!c.hasSchool}]};
  }

  /* sample fallback so the module is demoable without ET_ATLAS */
  var SAMPLE=[
   {id:"vermut",world:"kitchen",craft:"Vermut & Conserva",discipline:"Vermut & Conserva",cred:"Hand-verified",place:"Barcelona, Spain",cont:"europe",season:"year-round",rank:4,rankLabel:"Thriving",role:"both",hasSchool:true},
   {id:"murano",world:"craft",craft:"Murano Glassblowing",discipline:"Murano Glassblowing",cred:"Maestro Artigiano",place:"Venice, Italy",cont:"europe",season:"year-round",rank:5,rankLabel:"Legendary",role:"source",hasSchool:true,certified:true},
   {id:"flamenco",world:"movement",craft:"Flamenco Compás",discipline:"Flamenco Compás",cred:"Hand-verified",place:"Seville, Spain",cont:"europe",season:"year-round",rank:5,rankLabel:"Legendary",role:"source",hasSchool:true},
   {id:"ashtanga",world:"body",craft:"Ashtanga Mysore",discipline:"Ashtanga Mysore",cred:"Yoga Alliance RYT",place:"Mysore, India",cont:"far",season:"winter",rank:5,rankLabel:"Legendary",role:"both",hasSchool:true,certified:true},
   {id:"alpine",world:"wild",craft:"Alpine Mountaineering",discipline:"Alpine Mountaineering",cred:"Mountain Guide UIAGM",place:"Chamonix, France",cont:"europe",season:"summer",rank:5,rankLabel:"Legendary",role:"source",hasSchool:true,certified:true},
   {id:"pasta",world:"kitchen",craft:"Hand-rolled Pasta",discipline:"Hand-rolled Pasta",cred:"Hand-verified",place:"Bologna, Italy",cont:"europe",season:"year-round",rank:4,rankLabel:"Thriving",role:"source",hasSchool:true},
   {id:"ceramics",world:"craft",craft:"Wheel-thrown Ceramics",discipline:"Wheel-thrown Ceramics",cred:"Studio-led",place:"Sintra, Portugal",cont:"europe",season:"year-round",rank:3,rankLabel:"Growing",role:"scene",hasSchool:true},
   {id:"freedive",world:"wild",craft:"Freediving",discipline:"Freediving",cred:"AIDA / PADI",place:"Dahab, Egypt",cont:"far",season:"year-round",rank:4,rankLabel:"Thriving",role:"source",hasSchool:true,certified:true}
  ];
  var PROD=!!(window.ET_ATLAS&&window.ET_ATLAS.disciplines&&window.ET_ATLAS.disciplines.length);
  var CRAFTS=PROD?adaptAtlas(window.ET_ATLAS):SAMPLE.map(sampleToCraft);

  /* ── scoring: world + reach + timing + community strength ──
     pickDest honours reach (closest strong venue), then community rank.   */
  function pickDest(c){
    var ds=c.dests,pool=ds;
    if(profile.reach==="region"||profile.reach==="europe"){var eu=ds.filter(function(x){return x.cont==="europe";});if(eu.length)pool=eu;}
    return pool.slice().sort(function(a,b){return (b.rank||0)-(a.rank||0);})[0]||ds[0];
  }
  function scoreCraft(c){
    var d=pickDest(c),s=0,why=[];
    if(profile.worlds&&profile.worlds.indexOf(c.world)>=0)s+=5;else s-=3;
    if(profile.reach==="region"||profile.reach==="europe"){if(d.cont==="europe"){s+=2;if(profile.reach==="region")why.push("close to home");}else s-=2;}
    else if(profile.reach==="world")s+=1;
    if(profile.timing==="soon"&&d.season==="year-round"){s+=1;why.push("open now");}
    // motivation: a gentle, honest nudge toward strong communities for "deeper"/"people"
    if((profile.motivation==="deeper"||profile.motivation==="people")&&d.rank>=4)s+=0.5;
    s+=(d.rank||0)*0.2;                              // community-strength gradient
    if(d.rank>=5)why.push("legendary scene");else if(d.rank>=4)why.push("thriving scene");
    return{c:c,d:d,s:s,why:why};
  }
  function curate(){
    var ranked=CRAFTS.map(scoreCraft).sort(function(a,b){return b.s-a.s;});
    var picked=(profile.worlds&&profile.worlds.length>1)?profile.worlds:null;
    var t;
    if(picked){                                     // multi-world: round-robin so each picked world contributes its best
      var byW={};ranked.forEach(function(r){(byW[r.c.world]=byW[r.c.world]||[]).push(r);});
      t=[];var idx={},added=true;
      while(t.length<9&&added){added=false;
        picked.forEach(function(w){if(t.length>=9)return;var list=byW[w]||[],k=idx[w]||0;if(list[k]&&list[k].s>=4){t.push(list[k]);idx[w]=k+1;added=true;}});
      }
      if(t.length<3)ranked.forEach(function(r){if(t.length<4&&t.indexOf(r)<0)t.push(r);});
    }else{
      t=ranked.filter(function(x){return x.s>=4;}).slice(0,9);
      if(t.length<3)t=ranked.slice(0,4);
    }
    t.forEach(function(x){x.c._dest=x.d;});         // remember the chosen venue for the card + save
    return t;
  }

  /* ── conversation (every claim verified TRUE of the data) ── */
  var Q={
   worlds:{type:"multi",key:"worlds",hint:"Pick all that fit",say:"What pulls you?",reflect:"More than one is fine — most of us are a mix.",
    options:[{label:"The Wild",sub:"mountains, sea, open",em:"⛰",value:"wild"},{label:"Kitchen & Cellar",sub:"food, wine, ferment",em:"🍷",value:"kitchen"},{label:"Craft & Art",sub:"hands, material, making",em:"✦",value:"craft"},{label:"Movement",sub:"dance, rhythm, body",em:"♫",value:"movement"},{label:"Body & Spirit",sub:"yoga, breath, stillness",em:"☯",value:"body"}],
    afterMulti:function(v){return v.length===1?({wild:"The wild it is — every guide here is one we've vetted ourselves.",kitchen:"A person of the table. Every host here is a working maker.",craft:"The slow crafts. We look for a real teacher behind each one, never just a logo.",movement:"We'll point you to where the form is most alive.",body:"We check the teacher before we ever list a place."})[v[0]]:"A wide appetite — good. I'll pull the best from each.";}},
   turn:{type:"single",key:"turn",say:"Most people arrive here at a <em>turn</em>. Which one is yours?",reflect:"No wrong answer — it just helps me understand you.",
    options:[
     {label:"I picked a path before I knew myself",sub:"chosen too early",em:"○",value:"lost",motiv:"change"},
     {label:"I've taken all this one had to give",sub:"ready for the next thing",em:"◐",value:"spent",motiv:"deeper"},
     {label:"I just want to learn something real",sub:"a new craft, by hand",em:"✦",value:"learn",motiv:"new"}
    ],
    after:{
     lost:"Most of us did — you choose at eighteen, for reasons that were never really yours. Wanting out isn't failure; it's information. Let's find what you'd have chosen.",
     spent:"That restlessness is a sign you're ready, not a flaw. The trick is to point it at something real — with your hands, at the source.",
     learn:"The healthiest reason there is. A new skill doesn't just fill time; it reminds you that you're still becoming. Let's find one worth your hands."}},
   motivation:{type:"single",key:"motivation",say:"What are you really after?",reflect:"No wrong answer — it just helps me choose.",
    options:[{label:"A brand-new craft",sub:"start from zero",em:"○",value:"new"},{label:"Go deeper in one I love",sub:"real depth",em:"●",value:"deeper"},{label:"Find my people",sub:"a circle that gets it",em:"◇",value:"people"},{label:"A real change",sub:"a doorway out",em:"✦",value:"change"}],
    after:{new:"Then we'll start you somewhere a true beginner is welcome.",deeper:"Good — we'll point you at the places known for real depth.",people:"That's the whole idea — a place is only as good as its circle.",change:"Sometimes the craft is just the doorway. Let's find the place."}},
   experience:{type:"single",key:"experience",say:"And where are you <em>starting from</em>?",reflect:"Be honest — no level is too low here. It just helps me pitch this right.",
    options:[{label:"Total beginner",sub:"never really tried",em:"○",value:"beginner"},{label:"I've dabbled",sub:"a little under my belt",em:"◐",value:"some"},{label:"Real grounding",sub:"years in something",em:"●",value:"seasoned"}],
    after:{beginner:"Perfect — the best teachers love a true beginner, and we only list places that welcome one.",some:"Good base. We'll aim you where you actually level up — not start over.",seasoned:"Then we'll point you at the masters worth a seasoned hand's time."}},
   reach:{type:"single",key:"reach",say:"How far would you go?",reflect:"Mastery rarely needs a passport — but sometimes it's worth one.",options:[{label:"Close to home",sub:"my region",em:"⌂",value:"region"},{label:"Anywhere in Europe",sub:"a short hop",em:"✈",value:"europe"},{label:"Anywhere on earth",sub:"to the source",em:"⊕",value:"world"}],after:{region:"Beautiful — I'll lean toward the closest strong place for each.",europe:"Plenty within reach.",world:"Then I'll point you straight at the source."}},
   timing:{type:"single",key:"timing",say:"And when does this happen?",reflect:"Last one — then your skills.",options:[{label:"Soon, I'm itching",sub:"next 3 months",em:"▲",value:"soon"},{label:"This year",sub:"no rush",em:"◆",value:"year"},{label:"Just dreaming",sub:"for now",em:"☁",value:"dreaming"}],after:{soon:"Then let's not waste a day.",year:"The best immersions are worth planning toward.",dreaming:"Dreaming is how every trip starts."}},
   shelf:{type:"shelf",say:"Then <em>these</em> are yours.",reflect:"Tap every skill you'd love to learn — pick as many as call you."},
   acct:{type:"acct",say:"Want me to <em>keep</em> them for you?",reflect:"Your profile's already built. Just say where to send it."}
  };
  function buildFlow(seed){
    var intro,qs;
    if(seed&&WORLD_LABEL[seed]){
      profile.worlds=[seed];
      intro={type:"cta",say:"That's exactly what this is for. EducatedTraveler isn't a shop — it's a <em>bridge</em>: to a real skill, the master who teaches it, and the people learning beside you.",reflect:"A few taps about you, then the crafts that are yours. About a minute.",cta:"Show me →"};
      qs=[Q.experience,Q.reach,Q.timing];
    }else{
      intro={type:"cta",say:"That's exactly what this is for. EducatedTraveler isn't a shop — it's a <em>bridge</em>: to a real skill, the master who teaches it, and the people learning beside you.",reflect:"Tell me a little more and I'll lay out the crafts that are yours — from "+CRAFTS.length+" we've vetted by hand. About a minute.",cta:"Show me →"};
      qs=[Q.worlds,Q.experience,Q.reach,Q.timing];
    }
    var flow=[Q.turn,intro].concat(qs,[Q.shelf,Q.acct]);
    var qn=0;flow.forEach(function(s){if(s.type==="single"||s.type==="multi")s.progress=++qn;});
    TOTAL=qn;Q.shelf.progress=qn;
    return flow;
  }

  /* ── styles (namespaced) ── */
  var CSS=
  ".etc-scrim,.etc-scrim *,.etc-launcher,.etc-launcher *{box-sizing:border-box}"+
  ".etc-launcher{position:fixed;bottom:24px;right:24px;z-index:9000;display:flex;align-items:center;cursor:pointer;font-family:Inter,system-ui,sans-serif}"+
  ".etc-launcher:focus-visible{outline:2px solid #7fa8a5;outline-offset:4px;border-radius:99px}"+
  ".etc-lorb{width:58px;height:58px;border-radius:50%;position:relative;flex:0 0 auto;background:radial-gradient(circle at 50% 38%,rgba(127,168,165,.65),rgba(210,138,82,.3) 70%,rgba(20,17,13,.9) 73%);box-shadow:0 8px 30px rgba(0,0,0,.5);animation:etc-breathe 4.5s ease-in-out infinite;transition:transform .3s}"+
  ".etc-lorb::after{content:'';position:absolute;inset:0;border-radius:50%;border:1px solid rgba(127,168,165,.5);animation:etc-halo 4.5s ease-in-out infinite}"+
  ".etc-launcher:hover .etc-lorb{transform:scale(1.08)}"+
  ".etc-llabel{max-width:0;overflow:hidden;white-space:nowrap;font-size:13.5px;color:#f3ede2;background:rgba(20,17,13,.95);border:1px solid rgba(243,237,226,.12);border-radius:99px;height:40px;display:flex;align-items:center;opacity:0;transition:max-width .4s,opacity .3s,padding .4s,margin .4s;order:-1;padding:0;margin-right:-29px;padding-left:38px}"+
  ".etc-launcher:hover .etc-llabel,.etc-launcher.etc-nudge .etc-llabel{max-width:260px;opacity:1;padding:0 44px 0 16px;margin-right:-30px}"+
  ".etc-launcher.etc-nudge .etc-lorb{animation:etc-breathe 4.5s ease-in-out infinite,etc-bob 1.2s ease 1}"+
  ".etc-launcher.etc-hidden{display:none}"+
  "@keyframes etc-bob{0%,100%{transform:translateY(0)}30%{transform:translateY(-9px)}60%{transform:translateY(-3px)}}"+
  "@keyframes etc-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}"+
  "@keyframes etc-halo{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.5);opacity:0}}"+
  ".etc-scrim{position:fixed;inset:0;z-index:9001;background:rgba(8,7,5,.74);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .5s;font-family:Inter,system-ui,sans-serif}"+
  ".etc-scrim.etc-on{opacity:1;pointer-events:auto}"+
  ".etc-panel{width:min(94vw,480px);max-height:92vh;overflow-y:auto;overflow-x:hidden;background:linear-gradient(180deg,#14110d,#0d0b09);border:1px solid rgba(243,237,226,.09);border-radius:24px;box-shadow:0 40px 100px rgba(0,0,0,.6);transform:translateY(22px) scale(.98);transition:transform .5s cubic-bezier(.2,.8,.2,1);color:#f3ede2;font-weight:300;line-height:1.6}"+
  ".etc-panel:focus{outline:none}"+
  ".etc-scrim.etc-on .etc-panel{transform:none}"+
  ".etc-head{display:flex;align-items:center;gap:13px;padding:20px 22px 0;position:sticky;top:0;background:linear-gradient(180deg,#14110d 70%,transparent);z-index:2}"+
  ".etc-brand{font-family:Fraunces,Georgia,serif;font-size:14px;letter-spacing:.12em}.etc-brand b{color:#7fa8a5;font-weight:400}"+
  ".etc-skip{margin-left:auto;font-size:12px;color:rgba(243,237,226,.34);background:none;border:none;cursor:pointer}.etc-skip:hover{color:rgba(243,237,226,.56)}"+
  ".etc-ring{position:relative;width:40px;height:40px;flex:0 0 auto}.etc-ring svg{transform:rotate(-90deg)}.etc-ring .etc-pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#7fa8a5}"+
  ".etc-stage{padding:8px 22px 0;text-align:center}"+
  ".etc-orb{width:84px;height:84px;margin:10px auto 6px;border-radius:50%;position:relative;background:radial-gradient(circle at 50% 34%,rgba(190,224,220,.98),rgba(127,168,165,.82) 44%,rgba(210,138,82,.5) 72%,transparent 78%);box-shadow:0 0 42px rgba(127,168,165,.34),0 0 14px rgba(210,138,82,.18);animation:etc-breathe 4.5s ease-in-out infinite}"+
  ".etc-orb::after{content:'';position:absolute;inset:0;border-radius:50%;border:1px solid rgba(127,168,165,.4);animation:etc-halo 4.5s ease-in-out infinite}.etc-orb.etc-think{animation:etc-breathe 1.1s ease-in-out infinite}"+
  ".etc-say{min-height:54px;font-family:Fraunces,Georgia,serif;font-weight:300;font-size:clamp(19px,4.4vw,23px);line-height:1.3;margin:6px 0 4px;transition:opacity .35s;overflow-wrap:break-word;max-width:100%}.etc-say em{font-style:italic;color:#7fa8a5}.etc-fade{opacity:0}"+
  ".etc-reflect{font-size:13.5px;color:rgba(243,237,226,.56);min-height:20px;margin-bottom:6px;transition:opacity .35s;overflow-wrap:break-word;max-width:100%}"+
  ".etc-hint{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(243,237,226,.34);margin-bottom:2px}"+
  ".etc-answers{padding:12px 22px 6px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}"+
  ".etc-opt{font-size:14px;padding:10px 15px;border-radius:99px;border:1px solid rgba(243,237,226,.09);color:#f3ede2;background:rgba(243,237,226,.03);transition:all .2s;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit}"+
  ".etc-opt:hover{border-color:#7fa8a5;background:rgba(127,168,165,.08);transform:translateY(-2px)}.etc-opt.etc-sel{border-color:#7fa8a5;background:rgba(127,168,165,.16)}"+
  ".etc-opt:focus-visible,.etc-card:focus-visible,.etc-cta:focus-visible,.etc-skip:focus-visible{outline:2px solid #7fa8a5;outline-offset:2px}"+
  ".etc-opt.etc-sel .etc-tick{opacity:1;width:auto}.etc-tick{opacity:0;width:0;overflow:hidden;color:#7fa8a5;transition:opacity .2s}"+
  ".etc-osub{display:block;font-size:11px;color:rgba(243,237,226,.34);margin-top:1px;font-weight:300}"+
  ".etc-opt.etc-col{flex-direction:column;align-items:flex-start;text-align:left;border-radius:12px;width:100%;max-width:400px}"+
  ".etc-bar{padding:8px 22px 22px;display:flex;justify-content:center}"+
  ".etc-cta{display:inline-block;padding:12px 26px;border-radius:99px;font-size:15px;font-weight:500;background:linear-gradient(135deg,#7fa8a5,#d28a52 130%);color:#14110d;transition:transform .25s,box-shadow .25s,opacity .25s;cursor:pointer;border:none;font-family:inherit}"+
  ".etc-cta:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(127,168,165,.22)}.etc-cta.etc-dim{opacity:.4;pointer-events:none;transform:none;box-shadow:none}"+
  ".etc-shelf{padding:2px 22px 6px}"+
  ".etc-grp{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7fa8a5;margin:14px 2px 8px;display:flex;align-items:center;gap:8px}.etc-grp .etc-ln{flex:1;height:1px;background:rgba(243,237,226,.09)}"+
  ".etc-grp-wide{color:rgba(243,237,226,.52);margin-top:20px}"+
  ".etc-more{font-size:12px;color:rgba(243,237,226,.5);text-align:center;padding:16px 10px 4px;line-height:1.65}.etc-more b{color:#7fa8a5;font-weight:500}"+
  ".etc-card{background:#1c1813;border:1px solid rgba(243,237,226,.09);border-radius:14px;padding:14px 15px;position:relative;overflow:hidden;margin-bottom:9px;cursor:pointer;transition:border-color .25s,transform .25s,background .25s;animation:etc-rise .5s cubic-bezier(.2,.8,.2,1) both}"+
  ".etc-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--sc)}.etc-card:hover{transform:translateY(-2px)}.etc-card.etc-sel{border-color:#7fa8a5;background:rgba(127,168,165,.09)}"+
  "@keyframes etc-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}"+
  ".etc-ctop{display:flex;align-items:flex-start;gap:10px}.etc-heart{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:1px solid rgba(243,237,226,.09);display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(243,237,226,.34);transition:all .2s}.etc-card.etc-sel .etc-heart{background:#7fa8a5;border-color:#7fa8a5;color:#14110d}"+
  ".etc-cred{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:#e7b54e;margin-bottom:4px}"+
  ".etc-ctitle{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:18px;line-height:1.1}.etc-cplace{font-size:12px;color:rgba(243,237,226,.56);margin-top:3px}"+
  ".etc-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;font-size:10.5px;font-family:'IBM Plex Mono',monospace}"+
  ".etc-tag{padding:3px 8px;border-radius:99px;border:1px solid rgba(243,237,226,.09);color:rgba(243,237,226,.56)}.etc-tag.etc-why{color:#7fa8a5;border-color:rgba(127,168,165,.3)}"+
  ".etc-verified{font-size:11px;color:#7fa8a5;margin-top:8px}"+
  ".etc-selcount{text-align:center;font-size:12.5px;color:rgba(243,237,226,.56);padding:6px 22px 0}.etc-selcount b{color:#f3ede2}"+
  ".etc-acct{padding:6px 22px 24px}.etc-acct input{width:100%;background:rgba(243,237,226,.05);border:1px solid rgba(243,237,226,.09);border-radius:12px;padding:13px 14px;color:#f3ede2;font-size:15px;font-family:inherit;margin-bottom:9px}.etc-acct input:focus{outline:none;border-color:rgba(127,168,165,.5)}"+
  ".etc-fine{font-size:11.5px;color:rgba(243,237,226,.34);text-align:center;margin-top:9px;line-height:1.5}"+
  ".etc-built{font-size:12px;color:rgba(243,237,226,.56);text-align:center;margin-bottom:12px;line-height:1.7}.etc-built b{color:#7fa8a5;font-weight:500}"+
  ".etc-chosen{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px}.etc-pill{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#f3ede2;border:1px solid rgba(127,168,165,.4);background:rgba(127,168,165,.1);border-radius:99px;padding:5px 11px}"+
  ".etc-done{text-align:center;padding:30px 26px 40px}.etc-done .etc-orb{margin-bottom:14px}.etc-done h2{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:26px;margin-bottom:10px}.etc-done p{color:rgba(243,237,226,.56);font-size:14px;max-width:36ch;margin:0 auto 18px}.etc-recap{font-family:'IBM Plex Mono',monospace;font-size:11px;color:rgba(243,237,226,.34);margin:0 auto 18px;max-width:32ch;line-height:1.9}"+
  ".etc-story{display:inline-block;margin-top:16px;font-size:12.5px;color:rgba(243,237,226,.56);text-decoration:underline;text-underline-offset:3px;transition:color .2s}.etc-story:hover{color:#7fa8a5}.etc-story:focus-visible{outline:2px solid #7fa8a5;outline-offset:2px}"+
  "@media(max-width:600px){.etc-panel{width:100vw;max-height:100vh;height:100vh;border-radius:0}.etc-scrim{padding:0}}"+
  "@media(prefers-reduced-motion:reduce){.etc-lorb,.etc-lorb::after,.etc-orb,.etc-orb::after,.etc-card,.etc-launcher.etc-nudge .etc-lorb{animation:none!important}.etc-scrim,.etc-panel,.etc-say,.etc-reflect,.etc-opt,.etc-cta,.etc-lorb{transition:none!important}}";

  var PANEL_INNER='<div class="etc-head"><span class="etc-brand">EDUCATED<b>TRAVELER</b></span>'+
    '<div class="etc-ring" style="display:none"><svg width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(243,237,226,.1)" stroke-width="3"/><circle class="etc-ringc" cx="20" cy="20" r="16" fill="none" stroke="#7fa8a5" stroke-width="3" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg><span class="etc-pct">0%</span></div>'+
    '<button class="etc-skip" type="button">Later</button></div>'+
    '<div class="etc-stage"><div class="etc-orb" aria-hidden="true"></div><div class="etc-hint"></div><div class="etc-say"></div><div class="etc-reflect" aria-live="polite"></div></div>'+
    '<div class="etc-answers"></div><div class="etc-shelf" style="display:none"></div><div class="etc-selcount" style="display:none" aria-live="polite"></div><div class="etc-bar" style="display:none"></div><div class="etc-acct" style="display:none"></div>';

  /* ── inject DOM ── */
  var profile={},flow=[],i=0,multiSel=[],chosen=[],TOTAL=5,els={},styleInjected=false,lastFocus=null;
  function injectStyle(){if(styleInjected)return;var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);styleInjected=true;}
  function buildUI(){
    injectStyle();
    var L=document.createElement("div");L.className="etc-launcher";L.setAttribute("role","button");L.setAttribute("tabindex","0");L.setAttribute("aria-label","Find the crafts that are yours");
    L.innerHTML='<span class="etc-llabel">Find the crafts that are yours →</span><div class="etc-lorb" aria-hidden="true"></div>';
    document.body.appendChild(L);
    var S=document.createElement("div");S.className="etc-scrim";
    S.innerHTML='<div class="etc-panel" role="dialog" aria-modal="true" aria-label="Join the Circle" tabindex="-1">'+PANEL_INNER+'</div>';
    document.body.appendChild(S);
    els.launcher=L; els.scrim=S; els.panel=S.querySelector(".etc-panel");
    L.addEventListener("click",function(){open(null);});
    L.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open(null);}});
    S.addEventListener("click",function(e){if(e.target===S)close();});
    bindSkip();
  }
  function bindSkip(){var sk=els.panel.querySelector(".etc-skip");if(sk)sk.addEventListener("click",close);}
  function q(sel){return els.panel.querySelector(sel);}
  function cache(){els.say=q(".etc-say");els.reflect=q(".etc-reflect");els.hint=q(".etc-hint");els.ans=q(".etc-answers");els.bar=q(".etc-bar");els.orb=q(".etc-orb");els.shelf=q(".etc-shelf");els.selc=q(".etc-selcount");els.acct=q(".etc-acct");els.ringwrap=q(".etc-ring");els.ringc=q(".etc-ringc");els.pct=q(".etc-pct");}

  function setProgress(n){if(n==null)return;els.ringwrap.style.display="block";var c=2*Math.PI*16;els.ringc.setAttribute("stroke-dasharray",c.toFixed(1));els.ringc.setAttribute("stroke-dashoffset",(c*(1-n/TOTAL)).toFixed(1));els.pct.textContent=Math.round(n/TOTAL*100)+"%";}
  function think(ms,cb){els.orb.classList.add("etc-think");setTimeout(function(){els.orb.classList.remove("etc-think");cb();},ms);}
  function hexA(h,a){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

  function render(){
    var s=flow[i];
    els.say.classList.add("etc-fade");els.reflect.classList.add("etc-fade");
    els.ans.innerHTML="";els.bar.style.display="none";els.bar.innerHTML="";
    els.shelf.style.display="none";els.shelf.innerHTML="";els.selc.style.display="none";els.acct.style.display="none";
    els.hint.textContent=s.hint||"";multiSel=[];
    setTimeout(function(){
      els.say.innerHTML=s.say;els.reflect.innerHTML=s.reflect||"";
      els.say.classList.remove("etc-fade");els.reflect.classList.remove("etc-fade");setProgress(s.progress);
      if(s.type==="shelf")return renderShelf();
      if(s.type==="acct")return renderAcct();
      if(s.type==="cta"){els.bar.style.display="flex";els.bar.innerHTML='<button class="etc-cta" type="button">'+s.cta+'</button>';els.bar.querySelector("button").onclick=function(){think(500,next);};return;}
      s.options.forEach(function(o){var b=document.createElement("button");b.type="button";b.className="etc-opt"+(s.options.length>3?" etc-col":"");b.setAttribute("aria-pressed","false");b.innerHTML='<span class="etc-tick" aria-hidden="true">✓</span>'+(o.em?'<span aria-hidden="true">'+o.em+'</span>':'')+'<span>'+o.label+(o.sub?'<span class="etc-osub">'+o.sub+'</span>':'')+'</span>';b.onclick=function(){s.type==="multi"?toggleMulti(s,o,b):chooseSingle(s,o);};els.ans.appendChild(b);});
      if(s.type==="multi"){els.bar.style.display="flex";els.bar.innerHTML='<button class="etc-cta etc-dim etc-cont" type="button">Continue</button>';els.bar.querySelector(".etc-cont").onclick=function(){if(multiSel.length)confirmMulti(s);};}
    },360);
  }
  function chooseSingle(s,o){profile[s.key]=o.value;if(o.motiv)profile.motivation=o.motiv;tint(s,o.value);els.ans.innerHTML="";reflectAfter(s.after&&s.after[o.value],next);}
  function toggleMulti(s,o,b){var x=multiSel.indexOf(o.value);if(x>=0){multiSel.splice(x,1);b.classList.remove("etc-sel");b.setAttribute("aria-pressed","false");}else{multiSel.push(o.value);b.classList.add("etc-sel");b.setAttribute("aria-pressed","true");}if(s.key==="worlds"&&multiSel.length)tint(s,multiSel[0]);els.bar.querySelector(".etc-cont").classList.toggle("etc-dim",multiSel.length===0);}
  function confirmMulti(s){profile[s.key]=multiSel.slice();els.ans.innerHTML="";els.bar.style.display="none";reflectAfter(s.afterMulti?s.afterMulti(multiSel):null,next);}
  // Show the reflection, then let the reader advance on THEIR tap — never a timer
  // (a fixed dwell always left someone short on time to read). Full control.
  function reflectAfter(txt,done){
    if(!txt){think(900,done);return;}
    els.reflect.classList.add("etc-fade");
    setTimeout(function(){
      els.reflect.innerHTML='<span style="color:#7fa8a5">'+esc(txt)+'</span>';
      els.reflect.classList.remove("etc-fade");
      els.bar.style.display="flex";
      els.bar.innerHTML='<button class="etc-cta etc-next" type="button">Continue →</button>';
      var b=els.bar.querySelector(".etc-next");
      b.onclick=function(){els.bar.style.display="none";els.bar.innerHTML="";think(360,done);};
      setTimeout(function(){try{b.focus();}catch(e){}},40);
    },300);
  }
  function tint(s,v){var c=(s.key==="worlds")?WORLD_COLOR[v]:null;if(c)els.orb.style.background="radial-gradient(circle at 50% 34%,"+hexA(c,.98)+","+hexA(c,.62)+" 46%,rgba(210,138,82,.42) 72%,transparent 78%)";}
  function next(){i++;if(i<flow.length)render();}

  function rankWhy(dst){var a=[];if(dst.rank>=5)a.push("legendary scene");else if(dst.rank>=4)a.push("thriving scene");return a;}
  function shelfCard(c,dst,w,sel,whys,d){
    var roleTag=dst.role?'<span class="etc-tag">'+({source:"at the source",scene:"a strong scene",both:"source & scene"}[dst.role]||"")+'</span>':'';
    var proof=dst.rankLabel?dst.rankLabel+" community":"Hand-verified";
    proof+=dst.certified?" · certified credential":(dst.hasSchool?" · school listed":"");
    var whyHtml=(whys||[]).slice(0,2).map(function(t){return'<span class="etc-tag etc-why">'+esc(t)+'</span>';}).join("");
    return '<div class="etc-card'+(sel?' etc-sel':'')+'" role="button" tabindex="0" aria-pressed="'+(sel?"true":"false")+'" data-id="'+esc(c.id)+'" style="--sc:'+WORLD_COLOR[w]+';animation-delay:'+(d*55)+'ms"><div class="etc-ctop"><div style="flex:1"><div class="etc-cred">◆ '+esc(c.cred)+'</div><div class="etc-ctitle">'+esc(c.craft)+'</div><div class="etc-cplace">'+esc(dst.place)+'</div><div class="etc-meta">'+whyHtml+roleTag+'</div><div class="etc-verified">✓ '+esc(proof)+'</div></div><div class="etc-heart" aria-hidden="true">♥</div></div></div>';
  }
  // Broad spectrum: a diverse cross-world sample drawn from the rest of the Atlas,
  // leaning to worlds they did NOT pick, strongest community first — things to start with.
  function widerPicks(shownIds,maxN){
    var pool=CRAFTS.filter(function(c){return shownIds.indexOf(c.id)<0;}).map(function(c){return{c:c,d:pickDest(c)};});
    var byW={};pool.forEach(function(p){(byW[p.c.world]=byW[p.c.world]||[]).push(p);});
    Object.keys(byW).forEach(function(w){byW[w].sort(function(a,b){return (b.d.rank||0)-(a.d.rank||0);});});
    var worldsOrder=Object.keys(byW).sort(function(a,b){var pa=(profile.worlds||[]).indexOf(a)>=0,pb=(profile.worlds||[]).indexOf(b)>=0;return (pa===pb)?0:(pa?1:-1);});
    var out=[],idx={},added=true;
    while(out.length<maxN&&added){added=false;
      worldsOrder.forEach(function(w){if(out.length>=maxN)return;var list=byW[w]||[],k=idx[w]||0;if(list[k]){out.push(list[k]);idx[w]=k+1;added=true;}});
    }
    out.forEach(function(p){p.c._dest=p.d;});
    return out;
  }
  function renderShelf(){
    var picks=curate();chosen=picks.slice(0,Math.min(3,picks.length)).map(function(r){return r.c.id;});
    els.shelf.style.display="block";
    var order=(profile.worlds||[]).slice();CRAFTS.forEach(function(c){if(order.indexOf(c.world)<0)order.push(c.world);});
    var byW={};picks.forEach(function(r){(byW[r.c.world]=byW[r.c.world]||[]).push(r);});
    var html="",d=0;
    order.forEach(function(w){if(!byW[w])return;
      html+='<div class="etc-grp"><span style="color:'+WORLD_COLOR[w]+'" aria-hidden="true">●</span> '+esc(WORLD_LABEL[w])+'<span class="etc-ln"></span></div>';
      byW[w].forEach(function(r){html+=shelfCard(r.c,r.d,w,chosen.indexOf(r.c.id)>=0,r.why,d);d++;});
    });
    var wider=widerPicks(picks.map(function(r){return r.c.id;}),5);
    if(wider.length){
      html+='<div class="etc-grp etc-grp-wide"><span aria-hidden="true">✦</span> A wider world — worth starting too<span class="etc-ln"></span></div>';
      wider.forEach(function(p){html+=shelfCard(p.c,p.d,p.c.world,false,rankWhy(p.d),d);d++;});
    }
    html+='<div class="etc-more">Not enough here? This is only a handful — the full Atlas holds <b>'+CRAFTS.length+'</b> crafts, and there\'s more waiting for whatever pulls you. You\'ll see it all next.</div>';
    els.shelf.innerHTML=html;
    els.shelf.querySelectorAll(".etc-card").forEach(function(card){
      function toggle(){var id=card.dataset.id,x=chosen.indexOf(id);if(x>=0){chosen.splice(x,1);card.classList.remove("etc-sel");card.setAttribute("aria-pressed","false");}else{chosen.push(id);card.classList.add("etc-sel");card.setAttribute("aria-pressed","true");}selCount();}
      card.onclick=toggle;
      card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle();}});
    });
    els.selc.style.display="block";selCount();
    els.bar.style.display="flex";els.bar.innerHTML='<button class="etc-cta etc-keep" type="button">Keep these for me →</button>';
    els.bar.querySelector(".etc-keep").onclick=function(){if(chosen.length){profile.crafts=chosen.slice();next();}};
  }
  function selCount(){var n=chosen.length;els.selc.innerHTML=n?('<b>'+n+'</b> skill'+(n>1?"s":"")+' selected — tap to add or remove'):'Tap at least one to continue';var k=els.bar.querySelector(".etc-keep");if(k)k.classList.toggle("etc-dim",n===0);}

  function renderAcct(){
    els.acct.style.display="block";els.bar.style.display="none";
    var names=chosen.map(function(id){var c=byId(id);return c?c.craft:"";}).filter(Boolean);
    els.acct.innerHTML='<div class="etc-chosen">'+names.map(function(n){return'<span class="etc-pill">'+esc(n)+'</span>';}).join("")+'</div><div class="etc-built">'+recap()+'</div><input class="etc-fn" placeholder="First name" autocomplete="given-name" aria-label="First name"><input class="etc-em" type="email" placeholder="Email" autocomplete="email" aria-label="Email"><button class="etc-cta etc-finish" type="button" style="width:100%">Save my '+names.length+' skill'+(names.length>1?"s":"")+'</button><div class="etc-fine">No spam. Finish your profile whenever — it\'s already built from your answers.</div>';
    var fn=els.acct.querySelector(".etc-fn");if(fn)setTimeout(function(){fn.focus();},30);
    els.acct.querySelector(".etc-finish").onclick=function(){
      profile.fname=(els.acct.querySelector(".etc-fn").value||"friend").trim();
      var em=(els.acct.querySelector(".etc-em").value||"").trim();
      if(!em||em.indexOf("@")<1){var ei=els.acct.querySelector(".etc-em");ei.focus();ei.style.borderColor="#d28a52";return;}
      profile.email=em;var btn=els.acct.querySelector(".etc-finish");btn.textContent="Saving…";btn.classList.add("etc-dim");
      saveProfile().then(renderDone);
    };
  }
  function byId(id){return CRAFTS.filter(function(x){return x.id===id;})[0];}
  function recap(){var w=(profile.worlds||[]).map(function(x){return WORLD_LABEL[x];}).join(", ");var parts=[({lost:"ready for a change",spent:"outgrew the last thing",learn:"here to learn"}[profile.turn]||{new:"after a new craft",deeper:"going deeper",people:"here for the people",change:"after a change"}[profile.motivation]||""),({beginner:"starting fresh",some:"some grounding",seasoned:"seasoned hand"}[profile.experience]||""),({region:"close to home",europe:"open to Europe",world:"goes anywhere"}[profile.reach]||""),({soon:"ready soon",year:"this year",dreaming:"dreaming"}[profile.timing]||"")].filter(Boolean);return'Saved: <b>'+esc(w)+'</b><br>'+parts.join(' · ');}

  /* ── persist (reuses launch_waitlist) ── */
  function buildInterests(){
    var crafts=chosen.map(function(id){var c=byId(id);if(!c)return null;var place=(c._dest&&c._dest.place)||(c.dests&&c.dests[0]&&c.dests[0].place)||null;return{kind:"discipline",discipline:c.discipline||c.craft,place:place,label:c.craft};}).filter(Boolean);
    var pref={kind:"profile",turn:profile.turn||null,worlds:profile.worlds||[],motivation:profile.motivation||null,experience:profile.experience||null,reach:profile.reach||null,timing:profile.timing||null,name:profile.fname||null};
    return[pref].concat(crafts);
  }
  function saveProfile(){
    var payload={email:profile.email,interests:buildInterests(),source:CONFIG.saveSource};
    var sb=window.supabaseClient;
    if(!sb){console.log("[Circle] offline →",payload);return Promise.resolve(false);}
    return sb.from(CONFIG.waitlistTable).insert(payload).then(function(res){
      if(res.error){console.warn("[Circle] insert failed:",res.error);return false;}
      if(window.plausible)window.plausible("CircleSignup",{props:{source:CONFIG.saveSource,crafts:chosen.length}});
      return true;
    }).catch(function(e){console.warn("[Circle] insert threw:",e);return false;});
  }
  function renderDone(saved){
    setCap({completed:true});
    var line=saved===false?"We couldn't reach the server just now — your picks are noted on this device. Try again and we'll keep them properly.":"Your skills are saved. We'll only ever write when there's a real master worth your time.";
    els.panel.innerHTML='<div class="etc-done"><div class="etc-orb" aria-hidden="true"></div><h2>Welcome to the Circle, '+esc(profile.fname)+'.</h2><p>'+esc(line)+'</p><div class="etc-recap">'+recap().replace(/<b>|<\/b>/g,"")+'</div><button class="etc-cta etc-explore" type="button">See your Atlas →</button><a class="etc-story" href="'+CONFIG.storyUrl+'">First, the story of why I built this →</a></div>';
    els.panel.querySelector(".etc-explore").onclick=goAtlas;
    setTimeout(function(){var e=els.panel.querySelector(".etc-explore");if(e)e.focus();},30);
    console.log("[Circle] profile →",JSON.parse(JSON.stringify(profile)),"saved:",saved);
  }

  /* ── open / close (focus + ESC) ── */
  function onKey(e){if(e.key==="Escape")close();}
  function open(seed){
    if(els.scrim.classList.contains("etc-on"))return;
    if(!els.panel.querySelector(".etc-stage")){els.panel.innerHTML=PANEL_INNER;bindSkip();}
    lastFocus=document.activeElement;
    profile={};i=0;multiSel=[];chosen=[];flow=buildFlow(seed);cache();
    els.orb.style.background="";els.launcher.classList.add("etc-hidden");
    els.scrim.classList.add("etc-on");render();
    document.addEventListener("keydown",onKey);
    setTimeout(function(){try{els.panel.focus();}catch(e){}},60);
    if(window.plausible)window.plausible("CircleOpen",{props:{seed:seed||"cold"}});
  }
  function close(){
    els.scrim.classList.remove("etc-on");setCap({dismissed:true});
    els.launcher.classList.remove("etc-hidden","etc-nudge");
    document.removeEventListener("keydown",onKey);
    try{(lastFocus&&lastFocus.focus)?lastFocus.focus():els.launcher.focus();}catch(e){}
  }
  // The Atlas IS the destination — already there → reveal it; elsewhere → go to it.
  function goAtlas(){var p=location.pathname||"";if(/\/browse|browse\.html/.test(p)){close();}else{try{location.href=CONFIG.atlasUrl;}catch(e){close();}}}

  /* ── wire triggers + nudge ── */
  function ready(fn){if(document.readyState!=="loading")fn();else document.addEventListener("DOMContentLoaded",fn);}
  ready(function(){
    buildUI();
    document.querySelectorAll('.join,a[href="/#circle"],a[href="#circle"],[data-circle]').forEach(function(el){
      el.addEventListener("click",function(e){var seed=el.getAttribute("data-circle-world");e.preventDefault();open(seed||null);});
    });
    // First-thing: auto-open once on a welcome page (set window.ET_CIRCLE_AUTOOPEN).
    if(CONFIG.autoOpen||window.ET_CIRCLE_AUTOOPEN){
      var sa=capState();
      if(!(sa.completed||sa.dismissed)){
        setTimeout(function(){if(!els.scrim.classList.contains("etc-on"))open(null);},CONFIG.autoOpenDelayMs);
      }
    }
    if(CONFIG.timedNudge&&!isMobile){
      var st=capState();
      if(!(st.completed||st.dismissed||st.nudged)){
        var maxS=0,t0=Date.now(),fired=false;
        function pct(){var h=document.documentElement;return h.scrollTop/((h.scrollHeight-h.clientHeight)||1)*100;}
        window.addEventListener("scroll",function(){maxS=Math.max(maxS,pct());},{passive:true});
        var iv=setInterval(function(){
          if(fired||els.scrim.classList.contains("etc-on")){clearInterval(iv);return;}
          if(Date.now()-t0>=CONFIG.nudgeAfterMs&&maxS>=CONFIG.nudgeAfterScrollPct){
            fired=true;clearInterval(iv);setCap({nudged:true});
            els.launcher.classList.add("etc-nudge");setTimeout(function(){els.launcher.classList.remove("etc-nudge");},6000);
          }
        },1000);
      }
    }
  });

  window.ETCircle={open:open,close:close,config:CONFIG,__test:{adaptAtlas:adaptAtlas,scoreCraft:scoreCraft,curate:curate,pickDest:pickDest,setProfile:function(p){profile=p;},getCrafts:function(){return CRAFTS;}}};
})();
