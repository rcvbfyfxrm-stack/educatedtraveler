/* EducatedTraveler: the bar, reveal-on-scroll, sheets, the Circle door, the founder film. */
(function(){
  "use strict";
  var nav=document.getElementById('nav'), stage=document.getElementById('stage');
  (function(){
    var rv=[].slice.call(document.querySelectorAll('.rv')), queued=false;
    function reveal(){ if(!rv.length) return; var line=window.innerHeight*0.88, keep=[]; for(var i=0;i<rv.length;i++){ if(rv[i].getBoundingClientRect().top<line) rv[i].classList.add('in'); else keep.push(rv[i]); } rv=keep; }
    function bar(){ if(!nav||!stage) return; nav.classList.toggle('solid', stage.getBoundingClientRect().bottom < 70); }
    function tick(){ queued=false; reveal(); bar(); }
    function onScroll(){ if(!queued){ queued=true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll',onScroll,{passive:true}); window.addEventListener('resize',onScroll); window.addEventListener('load',onScroll); tick();
  })();
  window.goCircle=function(){ window.location.href='/circle'; };

  /* sheets: one open at a time, Escape closes, Tab stays inside */
  var open=null, lastFocus=null;
  window.openSheet=function(id){ if(open) closeSheet(); lastFocus=document.activeElement; open=document.getElementById(id); if(!open) return; open.classList.add('show'); document.documentElement.style.overflow='hidden'; if(id==='founder') go(0); var c=open.querySelector('.close'); if(c) c.focus(); document.addEventListener('keydown',key); };
  window.closeSheet=function(){ if(!open) return; open.classList.remove('show'); open=null; document.documentElement.style.overflow=''; document.removeEventListener('keydown',key); if(lastFocus&&lastFocus.focus) lastFocus.focus(); };
  window.openFounder=function(){ openSheet('founder'); }; window.closeFounder=window.closeSheet;
  function key(e){
    if(e.key==='Escape'){ closeSheet(); return; }
    if(open&&open.id==='founder'){ if(e.key==='ArrowRight'){ go(cur+1); return; } if(e.key==='ArrowLeft'){ go(cur-1); return; } }
    if(e.key==='Tab'&&open){ var f=open.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"])'); if(!f.length) return; var first=f[0], last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); } }
  }
  if(!document.getElementById('film')) return;
  var ROMAN=['I','II','III','IV','V','VI'];
  var slides=[].slice.call(document.querySelectorAll('.slide')), dotsWrap=document.getElementById('fdots'), fcount=document.getElementById('fcount'), film=document.getElementById('film'), cur=0, N=slides.length;
  slides.forEach(function(_,i){ var b=document.createElement('button'); b.className='fdot'+(i===0?' on':''); b.type='button'; b.setAttribute('aria-label','Photo '+(i+1)+' of '+N); b.addEventListener('click',function(){go(i);}); dotsWrap.appendChild(b); });
  var dots=[].slice.call(dotsWrap.children);
  function go(i){ cur=(i+N)%N; slides.forEach(function(s,k){s.classList.toggle('on',k===cur);}); dots.forEach(function(d,k){d.classList.toggle('on',k===cur);}); if(fcount) fcount.textContent=ROMAN[cur]+' / '+ROMAN[N-1]; }
  document.getElementById('fnext').addEventListener('click',function(){go(cur+1);});
  document.getElementById('fprev').addEventListener('click',function(){go(cur-1);});
  var x0=null;
  film.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
  film.addEventListener('touchend',function(e){ if(x0===null)return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40){ go(cur+(dx<0?1:-1)); } x0=null; },{passive:true});
})();
