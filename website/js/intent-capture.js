// THE NOTE (2026-08-31, Arnaud's ruling). One note on the site.
//
// A skill page asks for a note and nothing else: a small line saying who I am,
// the sheet, and one button. Nothing between them — no subject line, no prompt
// buttons, no address field sitting there before a word has been written.
//
// The address is asked for AFTER the note, in a dialog, and that order is the
// whole point. A page that asks who you are before you have said anything is a
// form; a page that takes what you wrote and then asks where to write back is a
// note. Consent is a tick inside that dialog, in the sender's own voice, because
// pressing send is not permission to keep somebody's details.
//
// It renders into `form.intent`, which is baked into hundreds of generated files,
// and it keeps the contract where the contract matters:
//   · the form element and its data-* attributes are untouched, so the craft, the
//     place and the source still come from the page;
//   · `kind:'discipline'` is still emitted — the ONLY shape refresh-unlocked.mjs
//     counts as a hand for an Atlas craft;
//   · the source on a craft page stays `atlas-letter:<slug>`, a stored routing key
//     circle-welcome reads to answer about THAT craft. A key, not a word: the word
//     is note, everywhere a reader can see it.
//   · `.intent-msg` and `.intent-go` survive, so the generated CSS still styles the
//     message and the button.
//
// Where the page cannot tell us the craft (/lab-weeks, the catalogue home), one
// line asks which one — and the page's own heading stands in for the intro.
(function () {
  'use strict';
  if (window.ETNote) return;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  // Yes, verbatim, and in the sender's voice. It says what is kept, what comes
  // back, and how to stop — the three things a tick has to mean.
  var CONSENT = 'Yes — keep my name and address so you can write back. '
              + 'One note when something is real, nothing else, and I can leave from any of them.';

  var CSS = [
    // text-align:left is not cosmetic — /lab-weeks centres its whole section, and a
    // centred sheet reads as a greeting card rather than something written.
    '.etl{--sheet:#efe6d3;--sheet-edge:#e2d6bd;--sheet-ink:#2c231a;--sheet-faint:#6f6350;text-align:left;}',
    '.etl-intro{font-size:14.5px;line-height:1.7;color:var(--muted,rgba(243,237,226,.72));max-width:60ch;margin:0 0 16px;}',
    '.etl-intro b{color:var(--paper,#f3ede2);font-weight:400;}',
    '.etl-sheet{position:relative;background:linear-gradient(180deg,#efe6d3 0%,#ece1cc 100%);border:1px solid #e2d6bd;',
    '  border-radius:5px;padding:24px 24px 20px;color:#2c231a;box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 24px 50px -24px rgba(0,0,0,.6);}',
    '.etl-to{font-family:"Fraunces",Georgia,serif;font-size:18px;color:#2c231a;margin-bottom:2px;}',
    '.etl-date{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6f6350;margin-bottom:14px;}',
    '.etl-subject{display:flex;align-items:baseline;gap:9px;margin:-4px 0 14px;}',
    '.etl-sk{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6f6350;flex:0 0 auto;}',
    '.etl input.etl-subline{flex:1 1 auto;min-width:0;background:transparent;border:none;border-bottom:1px dotted rgba(44,35,26,.32);',
    '  border-radius:0;outline:none;font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:15.5px;color:#2c231a;padding:0 2px 4px;box-shadow:none;}',
    '.etl input.etl-subline:focus{border-bottom-color:rgba(44,35,26,.62);border-bottom-style:solid;}',
    '.etl input.etl-subline::placeholder{color:rgba(44,35,26,.32);font-style:italic;}',
    '.etl textarea.etl-paper{width:100%;min-height:190px;background:transparent;border:none;outline:none;resize:vertical;color:#2c231a;',
    '  font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:16px;line-height:32px;padding:0;box-shadow:none;',
    '  background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(44,35,26,.14) 31px,rgba(44,35,26,.14) 32px);}',
    '.etl textarea.etl-paper::placeholder{color:rgba(44,35,26,.34);font-style:italic;}',
    '.etl-signrow{margin-top:14px;text-align:right;}',
    '.etl-yours{font-family:"Fraunces",Georgia,serif;font-style:italic;font-size:14px;color:#6f6350;}',
    '.etl input.etl-signline{font-family:"Caveat","Fraunces",cursive;font-size:26px;line-height:1.1;color:#3a2c1e;margin-top:2px;background:transparent;',
    '  border:none;border-bottom:1px dashed rgba(44,35,26,.3);border-radius:0;outline:none;text-align:right;width:min(240px,70%);padding:0 2px 3px;box-shadow:none;}',
    '.etl input.etl-signline::placeholder{color:rgba(44,35,26,.3);font-size:19px;}',
    '.etl input.etl-signline:focus{border-bottom-color:rgba(44,35,26,.62);}',
    '.etl-row{margin-top:16px;}',
    // The button, drawn here rather than borrowed: /lab-weeks is a Tailwind page and
    // defines no .intent-go, so a button styled only by the Atlas stylesheet came out
    // as a raw browser button there.
    '.etl button.etl-go{border:none;border-radius:99px;padding:12px 24px;font-family:inherit;font-size:14px;font-weight:500;',
    '  color:#14110d;cursor:pointer;background:linear-gradient(135deg,var(--sea,#7fa8a5) 0%,var(--ember,#d28a52) 130%);transition:filter .2s;}',
    '.etl button.etl-go:hover{filter:brightness(1.05);}',
    '.etl button.etl-go:disabled{opacity:.5;cursor:default;}',
    '.etl-sent{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:17px;line-height:1.5;color:var(--paper,#f3ede2);}',
    '.etl-sent span{color:var(--sea,#7fa8a5);}',
    '.etl .intent-msg{font-size:13.5px;line-height:1.6;margin-top:11px;color:var(--ember,#d28a52);}',

    // ── the dialog: where do I write back ──────────────────────────────────
    '.etn-back{position:fixed;inset:0;z-index:2400;display:flex;align-items:center;justify-content:center;padding:22px;',
    '  background:rgba(13,11,9,.74);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}',
    '.etn-back[hidden]{display:none;}',
    '.etn-card{position:relative;width:min(430px,100%);max-height:calc(100vh - 44px);overflow:auto;overscroll-behavior:contain;text-align:left;',
    '  background:var(--surface,#14110d);border:1px solid var(--line,rgba(243,237,226,.14));border-radius:16px;',
    '  padding:26px 24px 22px;box-shadow:0 30px 70px -20px rgba(0,0,0,.75);animation:etn-rise .28s cubic-bezier(.2,.8,.2,1) both;}',
    '@keyframes etn-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.etn-x{position:absolute;top:10px;right:12px;background:none;border:none;cursor:pointer;font-size:20px;line-height:1;',
    '  color:var(--muted,rgba(243,237,226,.62));padding:6px;}',
    '.etn-x:hover{color:var(--paper,#f3ede2);}',
    '.etn-h{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:23px;line-height:1.2;margin:0 0 8px;color:var(--paper,#f3ede2);}',
    '.etn-sub{font-size:13.5px;line-height:1.6;color:var(--muted,rgba(243,237,226,.66));margin:0 0 16px;}',
    '.etn-card input.etn-email{width:100%;background:rgba(243,237,226,.04);border:1px solid rgba(243,237,226,.16);border-radius:99px;',
    '  padding:12px 16px;color:var(--paper,#f3ede2);font-family:inherit;font-size:16px;outline:none;box-shadow:none;}',
    '.etn-card input.etn-email:focus{border-color:var(--sea,#7fa8a5);}',
    '.etn-ok{display:flex;gap:10px;align-items:flex-start;margin:15px 0 4px;cursor:pointer;}',
    '.etn-ok input{flex:0 0 auto;width:18px;height:18px;margin-top:1px;accent-color:var(--ember,#d28a52);cursor:pointer;}',
    '.etn-ok span{font-size:12.5px;line-height:1.55;color:var(--muted,rgba(243,237,226,.72));}',
    '.etn-go{display:block;width:100%;margin-top:14px;padding:13px 22px;border:none;border-radius:99px;cursor:pointer;',
    '  font-family:inherit;font-size:14px;font-weight:500;color:#14110d;',
    '  background:linear-gradient(135deg,var(--sea,#7fa8a5) 0%,var(--ember,#d28a52) 130%);transition:filter .2s;}',
    '.etn-go:hover{filter:brightness(1.05);}',
    '.etn-go:disabled{opacity:.55;cursor:default;}',
    '.etn-err{font-size:13px;line-height:1.6;color:var(--ember,#d28a52);margin:11px 0 0;}',
    '.etn-err a{color:var(--sea,#7fa8a5);}',
    '.etn-fine{font-size:11.5px;line-height:1.6;color:var(--faint,rgba(243,237,226,.45));margin:13px 0 0;}',
    '.etn-fine a{color:var(--sea,#7fa8a5);}',
    '.etn-sub span{color:var(--sea,#7fa8a5);}',
    '.etn-card[data-done] .etn-email,.etn-card[data-done] .etn-ok,.etn-card[data-done] .etn-go.etn-send,.etn-card[data-done] .etn-fine{display:none;}',
    '.etsu .etn-card{padding:22px 24px 22px;}',
    '.etsu-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 30px 14px 0;}',
    '.etsu-what{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--sea,#7fa8a5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.etsu-top[hidden]{display:none;}',
    '.etsu-dots{display:flex;gap:6px;flex:0 0 auto;}',
    '.etsu-dots i{width:22px;height:3px;border-radius:3px;background:rgba(243,237,226,.16);transition:background .3s;}',
    '.etsu-dots i.on{background:linear-gradient(90deg,var(--sea,#7fa8a5),var(--ember,#d28a52));}',
    '.etsu-step{animation:etsu-in .32s cubic-bezier(.2,.8,.2,1) both;}',
    '@keyframes etsu-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}',
    '.etsu .etn-h{font-size:25px;}',
    '.etsu-chips{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 4px;}',
    '.etsu-chip{border:1px solid rgba(243,237,226,.18);background:rgba(243,237,226,.03);color:var(--paper,#f3ede2);border-radius:99px;padding:9px 14px;font:inherit;font-size:13.5px;cursor:pointer;transition:border-color .2s,background .2s;}',
    '.etsu-chip:hover{border-color:rgba(127,168,165,.6);}',
    '.etsu-chip[aria-checked=true]{border-color:var(--ember,#d28a52);background:rgba(210,138,82,.14);}',
    '.etsu .etsu-other{margin-top:10px;}',
    '.etsu-back{display:block;margin:12px auto 0;background:none;border:none;color:var(--muted,rgba(243,237,226,.6));font:inherit;font-size:13px;cursor:pointer;}',
    '.etsu-back:hover{color:var(--paper,#f3ede2);}',
    '.etsu-seal{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:21px;color:#14110d;margin:4px 0 14px;background:linear-gradient(135deg,var(--sea,#7fa8a5),var(--ember,#d28a52));animation:etsu-pop .45s cubic-bezier(.2,1.4,.4,1) both;}',
    '@keyframes etsu-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}',
    '.etsu-done .etn-sub span{color:var(--sea,#7fa8a5);}',
    '.etsu-grow{margin-top:16px;padding:16px;border:1px solid rgba(210,138,82,.35);border-radius:12px;background:rgba(210,138,82,.06);}',
    '.etsu-k{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ember,#d28a52);}',
    '.etsu-share{display:flex;gap:8px;flex-wrap:wrap;}',
    '.etsu-share .etn-go{flex:1 1 170px;margin:0;text-align:center;text-decoration:none;white-space:nowrap;}',
    '.etsu-copy{flex:1 1 120px;border:1px solid rgba(243,237,226,.22);background:none;color:var(--paper,#f3ede2);border-radius:99px;padding:12px 16px;font:inherit;font-size:14px;cursor:pointer;}',
    '@media (max-width:520px){.etsu.etn-back{align-items:flex-end;padding:0;}.etsu .etn-card{width:100%;border-radius:18px 18px 0 0;max-height:92vh;}}',
    '@media (prefers-reduced-motion:reduce){.etsu-step,.etsu-seal{animation:none;}}'
  ].join('');

  // What the dialog says over a note, and over a bare tap. The tick is the same.
  var NOTE_COPY = {
    h: 'Where do I write back?',
    sub: 'Your note is written. Leave me an address and it goes.',
    go: 'Send my note →',
    fine: 'Your note comes straight to me and I read every one myself. What you write, '
      + 'your name and your address are kept for that and nothing else — never sold, never passed '
      + 'on. Write to <a href="mailto:arnaudcallier@pm.me">arnaudcallier@pm.me</a> to be removed '
      + 'and it is done. &middot; <a href="/privacy">What I keep</a>'
  };

  function injectCss() {
    if (document.getElementById('etl-css')) return;
    var s = document.createElement('style');
    s.id = 'etl-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // /atlas/<slug> or /atlas/<slug>.html — the slug decides which reply is sent.
  function atlasSlug() {
    var m = String(location.pathname).match(/\/atlas\/([^\/]+?)(?:\.html)?\/?$/);
    return m && m[1] !== 'index' ? m[1] : '';
  }

  function validEmail(e) { return /.+@.+\..+/.test(e); }

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  // Ask the server (read-only, service role) whether this email already has an
  // account, so a member is sent to their own door instead of joining twice.
  // Fails OPEN — a slow or unavailable probe must never lose a note.
  function emailHasAccount(email) {
    var sb = window.supabaseClient;
    if (!sb || !sb.functions) return Promise.resolve(false);
    var probe = sb.functions.invoke('check-email', { body: { email: email } })
      .then(function (res) { return !!(res && !res.error && res.data && res.data.member); })
      .catch(function () { return false; });
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, 8000); });
    return Promise.race([probe, timeout]);
  }

  // ── a note that could not be saved is kept and retried, not lost ──────────
  // Same key the short sheets used before this file took them over, so anything
  // already stranded in somebody's browser still flushes on their next visit.
  var PK = 'et_letter_pending';
  var flushing = false;
  function stash(p) { try { localStorage.setItem(PK, JSON.stringify(p)); } catch (e) {} }
  function unstash() { try { localStorage.removeItem(PK); } catch (e) {} }
  function flush() {
    var sb = window.supabaseClient;
    if (!sb || flushing) return;
    var raw; try { raw = localStorage.getItem(PK); } catch (e) { return; }
    if (!raw) return;
    var p; try { p = JSON.parse(raw); } catch (e) { unstash(); return; }
    if (!p || !p.email) { unstash(); return; }
    flushing = true;
    sb.from('launch_waitlist').insert(p).then(function (res) {
      flushing = false;
      if (res && !res.error) {
        unstash();
        if (window.plausible) window.plausible('NoteRecovered', { props: { source: p.source } });
      }
    }).catch(function () { flushing = false; });
  }

  // ── the dialog ────────────────────────────────────────────────────────────
  // One per page, built once, borrowed by whichever sheet asked for it.
  var DLG = null;
  function dialog() {
    if (DLG) return DLG;

    var back = el('div', 'etn-back', { hidden: 'hidden' });
    var card = el('div', 'etn-card', {
      role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'etn-h', tabindex: '-1'
    });

    var x = el('button', 'etn-x', { type: 'button', 'aria-label': 'Close' });
    x.innerHTML = '&times;';

    var h = el('h3', 'etn-h', { id: 'etn-h' });
    h.textContent = NOTE_COPY.h;

    var sub = el('p', 'etn-sub');
    sub.textContent = NOTE_COPY.sub;

    var email = el('input', 'etn-email', {
      type: 'email', autocomplete: 'email', id: 'etn-email', spellcheck: 'false',
      'aria-label': 'Your email', placeholder: 'you@wherever.com'
    });

    var okwrap = el('label', 'etn-ok');
    var okbox = el('input', null, { type: 'checkbox', id: 'etn-ok' });
    var oktxt = el('span');
    oktxt.textContent = CONSENT;
    okwrap.appendChild(okbox); okwrap.appendChild(oktxt);

    var go = el('button', 'etn-go etn-send', { type: 'button' });
    go.textContent = NOTE_COPY.go;

    var err = el('p', 'etn-err', { role: 'alert' });
    err.hidden = true;

    var fine = el('p', 'etn-fine');
    // innerHTML, not textContent, only because of the links — every character of it
    // is written here and none of it comes from the reader.
    fine.innerHTML = NOTE_COPY.fine;

    // What a bare tap gets once it has landed: a line, and the note a tap away.
    var done = el('div', 'etn-done', { 'aria-live': 'polite' });
    done.hidden = true;

    card.appendChild(x); card.appendChild(h); card.appendChild(sub);
    card.appendChild(email); card.appendChild(okwrap); card.appendChild(go);
    card.appendChild(err); card.appendChild(done); card.appendChild(fine);
    back.appendChild(card);
    document.body.appendChild(back);

    var opener = null, onSend = null;

    function close() {
      back.hidden = true;
      document.documentElement.style.overflow = '';
      if (opener) { try { opener.focus(); } catch (e) {} }
    }
    function say(html) { err.innerHTML = html; err.hidden = false; }
    function setCopy(c) {
      c = c || NOTE_COPY;
      h.textContent = c.h || NOTE_COPY.h;
      sub.textContent = c.sub || NOTE_COPY.sub;
      go.textContent = c.go || NOTE_COPY.go;
      fine.innerHTML = c.fine || NOTE_COPY.fine;
    }

    x.addEventListener('click', close);
    back.addEventListener('mousedown', function (ev) { if (ev.target === back) close(); });
    document.addEventListener('keydown', function (ev) {
      if (back.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
      // Keep Tab inside the dialog — behind it sits a page the reader has already
      // finished with, and a focus ring that wanders off it is a dead end.
      if (ev.key !== 'Tab') return;
      var f = card.querySelectorAll('button,input,a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    email.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); go.click(); } });

    go.addEventListener('click', function () {
      var addr = email.value.trim();
      if (!validEmail(addr)) { say('I need a real address to write back to.'); email.focus(); return; }
      // No tick, no row. Consent has to be given, not assumed from a button press.
      if (!okbox.checked) { say('Tick the box first — I will not keep your details without it.'); okbox.focus(); return; }
      err.hidden = true;
      if (onSend) onSend(addr, go, say, close);
    });

    DLG = {
      // `copy` is optional: a note opens it as it always did, a tap with its own lines.
      open: function (from, handler, copy) {
        opener = from; onSend = handler;
        setCopy(copy);
        err.hidden = true; done.hidden = true; done.innerHTML = '';
        card.removeAttribute('data-done');
        go.disabled = false;
        back.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        setTimeout(function () { try { email.focus(); } catch (e) {} }, 40);
      },
      // The dialog stays open and says what happened; the address and the tick go.
      done: function (heading, html) {
        h.textContent = heading;
        sub.textContent = '';
        done.innerHTML = html;
        done.hidden = false;
        err.hidden = true;
        card.setAttribute('data-done', '');
        setTimeout(function () { try { x.focus(); } catch (e) {} }, 40);
      },
      close: close
    };
    return DLG;
  }

  // ── one tap: "I'm interested", on a skill or on a school ───────────────────
  // The same dialog with no note in front of it. The address and the tick are the
  // whole ask, and a note stays one tap away afterwards (Arnaud, 4 Nov 2026: "make
  // the 'I'm interested by this skill' or 'I'm interested by this school' easier, so
  // it's easy for people to reach me"). The row it writes carries the same
  // kind:'discipline' a note writes — the one shape refresh-unlocked.mjs counts as a
  // hand — and, for a school, the school by name. Its source is atlas-interest:<slug>,
  // a routing key circle-welcome answers with a reply written for a tap, never with
  // "your note reached me" over a note nobody wrote.
  //
  // info: { craft (display name), slug (craft id), label, place (dest id),
  //         placeName, school, dest (the slug the source names) }
  function interest(info, opener) {
    info = info || {};
    var craft = String(info.craft || '').trim();
    var school = String(info.school || '').trim();
    var what = school || craft || 'this one';
    var pageSlug = atlasSlug();
    signup().open(opener, what, function (who, addr, btn, warn) {
      return sendInterest(who, addr, btn, warn);
    });

    // who: { name, profession }. Resolves true when the row landed.
    async function sendInterest(who, addr, btn, warn) {
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'One moment…';

      var already = false;
      try { already = await emailHasAccount(addr); } catch (e) { already = false; }

      // The person first, in the shape every Circle surface writes: circle-welcome
      // greets them by this name, notify-lead prints it and what they do.
      var interests = [{ kind: 'profile', name: who.name, region: null, profession: who.profession }];
      if (craft) {
        var disc = { kind: 'discipline', discipline: craft, label: info.label || craft };
        if (info.slug || pageSlug) disc.slug = info.slug || pageSlug;
        if (info.place) disc.place = info.place;
        interests.push(disc);
      }
      if (school) {
        interests.push({ kind: 'school-interest', school: school,
                         place: String(info.placeName || info.place || '').trim(), craft: craft });
      }
      var payload = {
        email: addr,
        interests: interests,
        source: 'atlas-interest:' + (info.dest || pageSlug || info.slug || 'atlas')
      };
      // A member's tap is kept as a trigger-silent carrier row, same as a member's
      // note, so nobody is welcomed to the Circle twice.
      if (already) payload.is_carrier = true;

      try {
        var sb = window.supabaseClient;
        if (!sb) throw new Error('offline');
        var res = await sb.from('launch_waitlist').insert(payload);
        if (res && res.error) throw res.error;
        unstash();
        if (window.plausible) window.plausible('Interest', { props: { source: payload.source, school: school ? 'yes' : 'no', member: already ? 'yes' : 'no', steps: 'name-trade-email' } });
      } catch (err) {
        stash(payload);
        btn.disabled = false; btn.textContent = label;
        warn('Couldn’t save that just now — try once more, or write to '
           + '<a href="mailto:arnaudcallier@pm.me">arnaudcallier@pm.me</a>.');
        return false;
      }
      signup().done(who.name, what, addr, already);
      return true;
    }
  }

  // ── the sign-up behind every "I'm interested" ─────────────────────────────
  // Arnaud, 4 Nov 2026: "make a cool design sign up. where first ask their name, and
  // what their experience for example yacht chefs etc.. then done then ask for their
  // email and enlarge the circle!" Three short questions, one per screen, then a
  // last one that is not a question: send it to somebody. A name and a trade are what
  // make a Circle a set of people rather than a list of addresses, and the trade is
  // what another member can weigh ("a yacht chef wants this").
  var TRADES = ['Yacht chef', 'Yacht crew', 'Chef or cook', 'I already do this craft',
                'Curious, just starting'];
  var OTHER = 'Something else';
  var SU = null;
  function signup() {
    if (SU) return SU;
    var back = el('div', 'etn-back etsu', { hidden: 'hidden' });
    var card = el('div', 'etn-card', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'etsu-h', tabindex: '-1' });
    card.innerHTML =
        '<button class="etn-x" type="button" aria-label="Close">&times;</button>'
      + '<div class="etsu-top"><span class="etsu-what"></span><span class="etsu-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>'
      + '<div class="etsu-step" data-s="1">'
      +   '<h3 class="etn-h" id="etsu-h">First, what’s your name?</h3>'
      +   '<p class="etn-sub">So I know who I’m writing to.</p>'
      +   '<input class="etn-email etsu-name" type="text" autocomplete="given-name" aria-label="Your name" placeholder="Your first name" maxlength="60">'
      +   '<button class="etn-go" type="button" data-next>Next →</button>'
      + '</div>'
      + '<div class="etsu-step" data-s="2" hidden>'
      +   '<h3 class="etn-h etsu-h2"></h3>'
      +   '<p class="etn-sub">It tells me who the Circle is made of.</p>'
      +   '<div class="etsu-chips" role="radiogroup" aria-label="What you do"></div>'
      +   '<input class="etn-email etsu-other" type="text" aria-label="What you do" placeholder="In your own words" maxlength="80" hidden>'
      +   '<button class="etn-go" type="button" data-next>Next →</button>'
      +   '<button class="etsu-back" type="button" data-prev>← Back</button>'
      + '</div>'
      + '<div class="etsu-step" data-s="3" hidden>'
      +   '<h3 class="etn-h etsu-h3"></h3>'
      +   '<p class="etn-sub etsu-sub3"></p>'
      +   '<input class="etn-email etsu-mail" type="email" autocomplete="email" spellcheck="false" aria-label="Your email" placeholder="you@wherever.com">'
      +   '<label class="etn-ok"><input type="checkbox" class="etsu-ok"><span></span></label>'
      +   '<button class="etn-go" type="button" data-send>Enlarge the Circle →</button>'
      +   '<button class="etsu-back" type="button" data-prev>← Back</button>'
      +   '<p class="etn-fine">Your name and address come straight to me — never sold, never passed on. '
      +   'Write to <a href="mailto:arnaudcallier@pm.me">arnaudcallier@pm.me</a> to be removed and it is done. '
      +   '&middot; <a href="/privacy">What I keep</a></p>'
      + '</div>'
      + '<div class="etsu-step etsu-done" data-s="4" hidden aria-live="polite"></div>'
      + '<p class="etn-err" role="alert" hidden></p>';
    back.appendChild(card);
    document.body.appendChild(back);
    card.querySelector('.etn-ok span').textContent = CONSENT;

    var $ = function (s) { return card.querySelector(s); };
    var err = $('.etn-err'), nameIn = $('.etsu-name'), other = $('.etsu-other'),
        mail = $('.etsu-mail'), ok = $('.etsu-ok'), chips = $('.etsu-chips');
    var who = { name: '', profession: '' }, step = 1, opener = null, onSend = null, what = '';

    TRADES.concat([OTHER]).forEach(function (t) {
      var b = el('button', 'etsu-chip', { type: 'button', role: 'radio', 'aria-checked': 'false' });
      b.textContent = t;
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true');
        other.hidden = t !== OTHER;
        if (t === OTHER) { other.focus(); who.profession = other.value.trim(); }
        else { who.profession = t; other.value = ''; }
        err.hidden = true;
      });
      chips.appendChild(b);
    });
    other.addEventListener('input', function () { who.profession = other.value.trim(); });
    ok.addEventListener('change', function () { if (ok.checked) err.hidden = true; });

    function say(html) { err.innerHTML = html; err.hidden = false; }
    function show(n) {
      step = n; err.hidden = true;
      Array.prototype.forEach.call(card.querySelectorAll('.etsu-step'), function (s) {
        s.hidden = Number(s.getAttribute('data-s')) !== n;
      });
      Array.prototype.forEach.call(card.querySelectorAll('.etsu-dots i'), function (d, i) {
        d.className = i < n ? 'on' : '';
      });
      $('.etsu-top').hidden = n === 4;
      if (n === 2) $('.etsu-h2').textContent = 'Nice to meet you, ' + who.name + '. What do you do?';
      if (n === 3) {
        $('.etsu-h3').textContent = 'Where do I write, ' + who.name + '?';
        $('.etsu-sub3').textContent = 'I’ll write when there’s something real about ' + what + ' — nothing else.';
      }
      var f = { 1: nameIn, 2: chips.querySelector('[aria-checked="true"]') || chips.firstChild, 3: mail }[n] || $('.etn-x');
      setTimeout(function () { try { f.focus(); } catch (e) {} }, 40);
    }
    function next() {
      if (step === 1) {
        who.name = nameIn.value.trim();
        if (!who.name) { say('Just a first name is fine.'); nameIn.focus(); return; }
        show(2);
      } else if (step === 2) {
        show(3);
      }
    }
    function close() {
      back.hidden = true;
      document.documentElement.style.overflow = '';
      if (opener) { try { opener.focus(); } catch (e) {} }
    }

    Array.prototype.forEach.call(card.querySelectorAll('[data-next]'), function (b) { b.addEventListener('click', next); });
    Array.prototype.forEach.call(card.querySelectorAll('[data-prev]'), function (b) { b.addEventListener('click', function () { show(step - 1); }); });
    nameIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); next(); } });
    other.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); next(); } });
    mail.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('[data-send]').click(); } });
    $('[data-send]').addEventListener('click', function () {
      var addr = mail.value.trim();
      if (!validEmail(addr)) { say('I need a real address to write back to.'); mail.focus(); return; }
      if (!ok.checked) { say('Tick the box first — I will not keep your details without it.'); ok.focus(); return; }
      err.hidden = true;
      if (onSend) onSend({ name: who.name, profession: who.profession }, addr, $('[data-send]'), say);
    });
    $('.etn-x').addEventListener('click', close);
    back.addEventListener('mousedown', function (ev) { if (ev.target === back) close(); });
    document.addEventListener('keydown', function (ev) {
      if (back.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
      if (ev.key !== 'Tab') return;
      var f = Array.prototype.filter.call(card.querySelectorAll('button,input,a[href]'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });

    SU = {
      open: function (from, w, handler) {
        opener = from; onSend = handler; what = w;
        $('.etsu-what').textContent = w;
        var s = $('[data-send]'); s.disabled = false; s.textContent = 'Enlarge the Circle →';
        back.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        show(who.name ? (who.profession ? 3 : 2) : 1);
      },
      done: function (name, w, addr, already) {
        var url = location.origin + location.pathname;
        var msg = 'I just joined the EducatedTraveler Circle for ' + w + ' — where you can learn a craft from the people who do it. ' + url;
        var d = $('.etsu-done');
        d.innerHTML =
            '<div class="etsu-seal" aria-hidden="true">✓</div>'
          + '<h3 class="etn-h">You’re in, ' + esc(name) + '.</h3>'
          + '<p class="etn-sub">' + esc(w) + ' is noted against <span>' + esc(addr) + '</span>'
          + (already ? ', and you were already in the Circle with this address' : '') + '. '
          + 'The Circle is the people who tell me what they want to learn: what it asks for decides '
          + 'which craft I open next, and which week I build.</p>'
          + '<div class="etsu-grow"><div class="etsu-k">Tell a friend</div>'
          + '<p class="etn-sub" style="margin:4px 0 12px">Know somebody who would want this? Send it to them.</p>'
          + '<div class="etsu-share">'
          + '<a class="etn-go etsu-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">Send on WhatsApp</a>'
          + '<button class="etsu-copy" type="button">' + (navigator.share ? 'Share it another way' : 'Copy the link') + '</button>'
          + '</div></div>'
          + '<button class="etsu-back" type="button" data-etn-note>Or write me a note about it →</button>';
        d.querySelector('.etsu-copy').addEventListener('click', function () {
          var b = this;
          var fin = function () { b.textContent = 'Copied ✓'; };
          if (navigator.share) { navigator.share({ text: msg }).catch(function () {}); return; }
          if (navigator.clipboard) navigator.clipboard.writeText(url).then(fin, fin); else fin();
        });
        d.querySelector('.etsu-wa').addEventListener('click', function () {
          if (window.plausible) window.plausible('CircleShare', { props: { via: 'whatsapp' } });
        });
        d.querySelector('[data-etn-note]').addEventListener('click', function () {
          close(); if (window.ETNote) window.ETNote.open();
        });
        show(4);
      },
      close: close
    };
    return SU;
  }

  // The school links the page prints. The craft and the place come off the note's
  // own form (its data-* is what the page knows), the school off the card's li.
  function wireInterestLinks() {
    var links = document.querySelectorAll('[data-interest]:not([data-save-skill])');
    if (!links.length) return;
    var f = FORMS[0];
    var label = f ? String(f.dataset.label || '') : '';
    var craft = label.indexOf(' · ') > 0 ? label.split(' · ')[0] : label;
    var placeName = label.indexOf(' · ') > 0 ? label.split(' · ').slice(1).join(' · ') : '';
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (ev) {
        var li = a.closest ? a.closest('li[data-school]') : null;
        var school = li ? li.getAttribute('data-school') : '';
        if (!school && !craft) return;          // nothing to say: the link's own jump stands
        ev.preventDefault();
        interest({
          craft: craft, slug: f ? f.dataset.discipline : '', label: label,
          place: f ? f.dataset.place : '', placeName: placeName,
          school: school, dest: li ? li.getAttribute('data-dest') : ''
        }, a);
      });
    });
  }

  // ── the sheet ─────────────────────────────────────────────────────────────
  function build(form) {
    var craft = (form.dataset.label || form.dataset.discipline || '').trim();
    var slug = atlasSlug();
    var uid = 'etl' + Math.random().toString(36).slice(2, 8);

    form.classList.add('etl');
    form.innerHTML = '';

    // The intro belongs to a page that knows its craft. /lab-weeks and the
    // catalogue home say it in their own heading and would say it twice.
    var subline = null;
    if (craft) {
      // A place sheet labels itself "Freediving · Dahab (Red Sea)" — a separator that
      // reads fine on a card and not at all in a sentence. Said out loud it is "in".
      var said = craft.indexOf(' · ') > 0 ? craft.split(' · ').join(' in ') : craft;
      var intro = el('p', 'etl-intro');
      intro.innerHTML = 'I\'m <b>Arnaud</b> — I founded EducatedTraveler. If ' + esc(said)
        + ' is the one you want, write me a note saying so: how you\'d love to learn it, and where. '
        + 'That note is how you join the Circle — the people who have told me which craft they want to learn. '
        + 'What they ask for decides which craft I open on the Atlas next, and which week I build; none has been built that way yet.';
      form.appendChild(intro);
    }

    var sheet = el('div', 'etl-sheet');
    var to = el('div', 'etl-to'); to.textContent = 'Arnaud,';
    var date = el('div', 'etl-date');
    try { var d = new Date(); date.textContent = MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); } catch (e) {}
    sheet.appendChild(to); sheet.appendChild(date);

    if (!craft) {
      var subject = el('div', 'etl-subject');
      var sk = el('span', 'etl-sk'); sk.textContent = 'About';
      subline = el('input', 'etl-subline', {
        type: 'text', maxlength: '80', id: uid + '-craft',
        'aria-label': 'The craft this note is about',
        placeholder: 'the craft you keep coming back to'
      });
      // The catalogue home can offer the crafts it already knows; naming one it
      // has never heard of is still the point, so it is a list, not a menu.
      var idx = window.ET_ATLAS_INDEX;
      if (idx && idx.crafts && idx.crafts.length) {
        var dl = el('datalist', null, { id: uid + '-crafts' });
        idx.crafts.map(function (c) { return c.name; })
          .sort(function (a, b) { return String(a).localeCompare(String(b)); })
          .forEach(function (n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
        subline.setAttribute('list', uid + '-crafts');
        subject.appendChild(dl);
      }
      subject.appendChild(sk); subject.appendChild(subline);
      sheet.appendChild(subject);
    }

    var paper = el('textarea', 'etl-paper', {
      id: uid + '-note', 'aria-label': 'Your note to Arnaud',
      placeholder: "How you'd love to learn it, and where in the world — and why it pulls at you."
    });

    var signrow = el('div', 'etl-signrow');
    var yours = el('div', 'etl-yours'); yours.textContent = 'Talk soon,';
    var sign = el('input', 'etl-signline', {
      type: 'text', maxlength: '80', autocomplete: 'given-name',
      id: uid + '-name', 'aria-label': 'Sign your name', placeholder: 'sign your name'
    });
    signrow.appendChild(yours); signrow.appendChild(sign);

    sheet.appendChild(paper); sheet.appendChild(signrow);

    // One button. Nothing else stands between the note and sending it.
    var row = el('div', 'etl-row');
    var go = el('button', 'intent-go etl-go', { type: 'submit' });
    go.textContent = 'Send my note →';
    row.appendChild(go);

    var msg = el('p', 'intent-msg', { hidden: 'hidden' });

    form.appendChild(sheet);
    form.appendChild(row);
    form.appendChild(msg);

    function say(text, kind) {
      msg.innerHTML = text;
      msg.className = 'intent-msg' + (kind ? ' ' + kind : '');
      msg.hidden = false;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var note = paper.value.trim();
      var name = sign.value.trim();

      if (note.length < 2) { say('Write me a line or two first — that is the joining.', 'err'); paper.focus(); return; }
      if (!name) { say('Sign it, so I know who I am answering.', 'err'); sign.focus(); return; }
      msg.hidden = true;

      dialog().open(go, function (addr, btn, warn, close) {
        send(addr, note, name, btn, warn, close);
      });
    });

    async function send(addr, note, name, btn, warn, close) {
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'One moment…';

      var already = false;
      try { already = await emailHasAccount(addr); } catch (e) { already = false; }

      var namedCraft = craft || (subline ? subline.value.trim() : '');
      var interests = [{ kind: 'profile', name: name, region: null },
                       { kind: 'dream', text: note }];
      // The unlock signal. Unmatched text is ignored by the index, so a typo can
      // never open the wrong craft page.
      if (namedCraft) {
        var disc = { kind: 'discipline', discipline: namedCraft, label: form.dataset.label || namedCraft };
        if (slug) disc.slug = slug;
        if (form.dataset.place) disc.place = form.dataset.place;
        interests.push(disc);
      }

      var payload = {
        email: addr,
        interests: interests,
        source: slug ? ('atlas-letter:' + slug) : (form.dataset.source || 'atlas-letter')
      };
      // An existing member's note is still kept — as a trigger-silent carrier row,
      // so nobody is welcomed to the Circle twice.
      if (already) payload.is_carrier = true;

      try {
        var sb = window.supabaseClient;
        if (!sb) throw new Error('offline');
        var res = await sb.from('launch_waitlist').insert(payload);
        if (res && res.error) throw res.error;
        unstash();
        if (window.plausible) window.plausible('Note', { props: { source: payload.source, member: already ? 'yes' : 'no' } });
      } catch (err) {
        // Kept, not lost: it flushes on the next page this reader opens.
        stash(payload);
        btn.disabled = false; btn.textContent = label;
        warn('Couldn’t save that just now — your note is safe on this screen. Try once more, '
           + 'or send it straight to <a href="mailto:arnaudcallier@pm.me">arnaudcallier@pm.me</a>.');
        return;
      }

      if (already) { close(); finish(name, addr, true, false); return; }

      // The note is safe. Now found their place — the link in their inbox is what
      // carries them in. Its failure is never fatal: a note that reached him is
      // worth more than an account.
      var linked = true;
      try {
        var otp = await window.supabaseClient.auth.signInWithOtp({
          email: addr,
          options: { emailRedirectTo: window.location.origin + '/portrait', shouldCreateUser: true }
        });
        if (otp && otp.error) throw otp.error;
      } catch (e) { linked = false; }

      close();
      finish(name, addr, false, linked);
    }

    function finish(name, addr, member, linked) {
      var nameHtml = esc(name), addrHtml = esc(addr);
      form.innerHTML = '';
      var done = el('p', 'etl-sent');
      if (member) {
        done.innerHTML = 'You\'re already in the Circle with this address, ' + nameHtml +
          ' — I\'ve kept your note and it\'s waiting in your portrait. ' +
          '<a href="/portrait" style="color:var(--sea,#7fa8a5)">Open your portrait →</a>';
      } else if (linked) {
        done.innerHTML = 'Your note\'s with me, ' + nameHtml + '. I\'ve sent a sign-in link to <span>' +
          addrHtml + '</span> — open it and you\'re in the Circle. Your note is already in front of me. ' +
          'I read every one myself, so give me a day or two.';
      } else {
        done.innerHTML = 'Your note\'s with me, ' + nameHtml + ', and I read every one myself. ' +
          'I couldn\'t send your sign-in link just now — ' +
          '<a href="/you?email=' + encodeURIComponent(addr) + '" style="color:var(--sea,#7fa8a5)">ask for it again here</a> ' +
          'whenever you like, and your note will already be there.';
      }
      form.appendChild(done);
      try { form.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    }

    // What the catalogue's ✎ buttons and a ?skill=… link reach for.
    form.etnOpen = function (name) {
      if (name && subline) subline.value = name;
      try { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      setTimeout(function () { try { paper.focus(); } catch (e) {} }, 480);
    };
  }

  var FORMS = [];

  ready(function () {
    var forms = document.querySelectorAll('form.intent');
    if (!forms.length) return;
    injectCss();
    Array.prototype.forEach.call(forms, function (f) { build(f); FORMS.push(f); });
    wireInterestLinks();
    flush(); setTimeout(flush, 2500);
  });

  window.ETNote = {
    open: function (craft) { if (FORMS[0] && FORMS[0].etnOpen) FORMS[0].etnOpen(craft); },
    // skill-save.js hands the skill tap here for anyone who is not a Circle member.
    interest: function (info, opener) { injectCss(); interest(info, opener); }
  };
})();
