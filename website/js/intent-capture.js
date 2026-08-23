// THE LETTER, EVERYWHERE (2026-08-22).
//
// This file used to render a two-field box — a craft and an email, "raise your
// hand" — on every Atlas craft page and on /lab-weeks. Arnaud's ruling: the
// letter is the joining, everywhere, so the box is now the same sheet of paper
// /circle, /teach and the Atlas hub use. It is done from here rather than in the
// pages themselves because that markup is baked into 123 generated files: one
// script, and every one of them becomes a letter.
//
// It keeps the old contract where the contract matters:
//   · the form element and its data-* attributes are untouched, so the craft,
//     the place and the source still come from the page;
//   · `kind:'discipline'` is still emitted — it is the ONLY shape
//     refresh-unlocked.mjs counts as a hand for an Atlas craft;
//   · `.intent-msg` and `.intent-go` class names survive, so the generated CSS
//     in build-atlas-pages.py still styles the message and the button.
// And it changes the source on a craft page to `atlas-letter:<slug>`, because
// circle-welcome answers that with a letter about THAT craft instead of the
// Mashiko welcome, which is written to someone deciding what to learn.
(function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  // Sentence starters, not topics: the hard part of a blank page is the first
  // six words. Each one writes them and leaves the cursor mid-thought.
  var STARTERS = [
    ["I've always wanted to learn ", "I've always wanted to learn…"],
    ["There's a craft I want to get further in: ", "Where I want to get to…"],
    ["Where I am with it today: ", "Where I am with it today…"],
    ["If it were up to me, I'd learn it ", "How I'd want to learn it…"]
  ];

  var CSS = [
    // text-align:left is not cosmetic — /lab-weeks centres its whole section, and a
    // centred letterhead reads as a greeting card rather than a letter.
    '.etl{--sheet:#efe6d3;--sheet-edge:#e2d6bd;--sheet-ink:#2c231a;--sheet-faint:#6f6350;text-align:left;}',
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
    '.etl textarea.etl-paper{width:100%;min-height:150px;background:transparent;border:none;outline:none;resize:vertical;color:#2c231a;',
    '  font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:16px;line-height:32px;padding:0;box-shadow:none;',
    '  background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(44,35,26,.14) 31px,rgba(44,35,26,.14) 32px);}',
    '.etl textarea.etl-paper::placeholder{color:rgba(44,35,26,.34);font-style:italic;}',
    '.etl-signrow{margin-top:14px;text-align:right;}',
    '.etl-yours{font-family:"Fraunces",Georgia,serif;font-style:italic;font-size:14px;color:#6f6350;}',
    '.etl input.etl-signline{font-family:"Caveat","Fraunces",cursive;font-size:26px;line-height:1.1;color:#3a2c1e;margin-top:2px;background:transparent;',
    '  border:none;border-bottom:1px dashed rgba(44,35,26,.3);border-radius:0;outline:none;text-align:right;width:min(240px,70%);padding:0 2px 3px;box-shadow:none;}',
    '.etl input.etl-signline::placeholder{color:rgba(44,35,26,.3);font-size:19px;}',
    '.etl input.etl-signline:focus{border-bottom-color:rgba(44,35,26,.62);}',
    '.etl-prompts{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;}',
    '.etl-prompts button{font-family:inherit;font-size:12px;color:var(--muted,rgba(243,237,226,.62));background:rgba(243,237,226,.03);',
    '  border:1px solid rgba(243,237,226,.15);border-radius:10px;padding:7px 11px;cursor:pointer;}',
    '.etl-prompts button:hover{border-color:var(--sea,#7fa8a5);color:var(--paper,#f3ede2);}',
    '.etl-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;}',
    '.etl input.etl-email{flex:1 1 220px;background:rgba(243,237,226,.04);border:1px solid rgba(243,237,226,.16);border-radius:99px;',
    '  padding:11px 16px;color:var(--paper,#f3ede2);font-family:inherit;font-size:16px;outline:none;}',
    '.etl input.etl-email:focus{border-color:var(--sea,#7fa8a5);}',
    '.etl-fine{font-size:12px;opacity:.55;margin-top:9px;line-height:1.55;}',
    '.etl-sent{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:17px;line-height:1.5;color:var(--paper,#f3ede2);}',
    '.etl-sent span{color:var(--sea,#7fa8a5);}'
  ].join('');

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

  // Ask the server (read-only, service role) whether this email already has an
  // account, so a member is sent to their own door instead of joining twice.
  // Fails OPEN — a slow or unavailable probe must never lose a letter.
  function emailHasAccount(email) {
    var sb = window.supabaseClient;
    if (!sb || !sb.functions) return Promise.resolve(false);
    var probe = sb.functions.invoke('check-email', { body: { email: email } })
      .then(function (res) { return !!(res && !res.error && res.data && res.data.member); })
      .catch(function () { return false; });
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, 8000); });
    return Promise.race([probe, timeout]);
  }

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function build(form) {
    var craft = (form.dataset.label || form.dataset.discipline || '').trim();
    var slug = atlasSlug();
    var uid = 'etl' + Math.random().toString(36).slice(2, 8);

    form.classList.add('etl');
    form.innerHTML = '';

    var sheet = el('div', 'etl-sheet');

    var to = el('div', 'etl-to'); to.textContent = 'Arnaud,';
    var date = el('div', 'etl-date');
    try { var d = new Date(); date.textContent = MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); } catch (e) {}

    var subject = el('div', 'etl-subject');
    var sk = el('span', 'etl-sk'); sk.textContent = 'About';
    var subline = el('input', 'etl-subline', {
      type: 'text', maxlength: '80', id: uid + '-craft',
      'aria-label': 'The craft this letter is about',
      placeholder: 'the craft you keep coming back to'
    });
    // On a craft page the letter opens already knowing what it is about — which
    // is also what opens that craft's page when the letter lands.
    if (craft) subline.value = craft;
    subject.appendChild(sk); subject.appendChild(subline);

    var paper = el('textarea', 'etl-paper', {
      id: uid + '-letter', 'aria-label': 'Your letter to Arnaud',
      placeholder: "Why it pulls at you, and where you are with it today. And how you'd want to learn it, if it were up to you — beside whom, where in the world, how long you could give it."
    });

    var signrow = el('div', 'etl-signrow');
    var yours = el('div', 'etl-yours'); yours.textContent = 'Talk soon,';
    var sign = el('input', 'etl-signline', {
      type: 'text', maxlength: '80', autocomplete: 'given-name',
      id: uid + '-name', 'aria-label': 'Sign your name', placeholder: 'sign your name'
    });
    signrow.appendChild(yours); signrow.appendChild(sign);

    sheet.appendChild(to); sheet.appendChild(date); sheet.appendChild(subject);
    sheet.appendChild(paper); sheet.appendChild(signrow);

    var prompts = el('div', 'etl-prompts');
    STARTERS.forEach(function (pair) {
      var b = el('button', null, { type: 'button' });
      b.textContent = pair[1];
      b.addEventListener('click', function () {
        var cur = paper.value;
        paper.value = cur ? (cur.replace(/\s*$/, '') + '\n\n' + pair[0]) : pair[0];
        paper.focus();
        paper.setSelectionRange(paper.value.length, paper.value.length);
      });
      prompts.appendChild(b);
    });

    var row = el('div', 'etl-row');
    var email = el('input', 'etl-email', {
      type: 'email', autocomplete: 'email', id: uid + '-email',
      'aria-label': 'Your email', placeholder: 'you@wherever.com'
    });
    var go = el('button', 'intent-go etl-go', { type: 'submit' });
    go.textContent = 'Send my letter →';
    row.appendChild(email); row.appendChild(go);

    var fine = el('p', 'etl-fine');
    fine.textContent = 'Your letter comes straight to me and I read every one myself. Sending it puts you in the Circle — one letter when something is real, never a drip, one click to leave.';

    var msg = el('p', 'intent-msg', { hidden: 'hidden' });

    form.appendChild(sheet);
    form.appendChild(prompts);
    form.appendChild(row);
    form.appendChild(fine);
    form.appendChild(msg);

    function say(text, kind) {
      msg.innerHTML = text;
      msg.className = 'intent-msg' + (kind ? ' ' + kind : '');
      msg.hidden = false;
    }

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var letter = paper.value.trim();
      var name = sign.value.trim();
      var addr = email.value.trim();
      var namedCraft = subline.value.trim();

      if (letter.length < 2) { say('Write me a line or two first — that is the joining.', 'err'); paper.focus(); return; }
      if (!name) { say('Sign it, so I know who I am answering.', 'err'); sign.focus(); return; }
      if (!validEmail(addr)) { say('I need a real address to write back to.', 'err'); email.focus(); return; }
      msg.hidden = true;

      var label = go.textContent;
      go.disabled = true; go.textContent = 'One moment…';

      var already = false;
      try { already = await emailHasAccount(addr); } catch (e) { already = false; }

      var interests = [{ kind: 'profile', name: name, region: null },
                       { kind: 'dream', text: letter }];
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
      // An existing member's letter is still kept — as a trigger-silent carrier
      // row, so nobody is welcomed to the Circle twice.
      if (already) payload.is_carrier = true;

      try {
        var sb = window.supabaseClient;
        if (!sb) throw new Error('offline');
        var res = await sb.from('launch_waitlist').insert(payload);
        if (res && res.error) throw res.error;
        if (window.plausible) window.plausible('Letter', { props: { source: payload.source, member: already ? 'yes' : 'no' } });
      } catch (err) {
        go.disabled = false; go.textContent = label;
        say('Couldn’t save that just now — try again, or send it straight to <a href="mailto:arnaudcallier@pm.me" style="color:var(--sea,#7fa8a5)">arnaudcallier@pm.me</a>.', 'err');
        return;
      }

      if (already) {
        finish(name, addr, true, false);
        return;
      }

      // The letter is safe. Now found their place — the link in their inbox is
      // what carries them in. Its failure is never fatal: a letter that reached
      // him is worth more than an account.
      var linked = true;
      try {
        var otp = await window.supabaseClient.auth.signInWithOtp({
          email: addr,
          options: { emailRedirectTo: window.location.origin + '/portrait', shouldCreateUser: true }
        });
        if (otp && otp.error) throw otp.error;
      } catch (e) { linked = false; }

      finish(name, addr, false, linked);
    });

    function finish(name, addr, member, linked) {
      var safeName = document.createElement('div');
      safeName.textContent = name;
      var nameHtml = safeName.innerHTML;
      var safeAddr = document.createElement('div');
      safeAddr.textContent = addr;
      var addrHtml = safeAddr.innerHTML;

      sheet.remove(); prompts.remove(); row.remove(); fine.remove();
      var done = el('p', 'etl-sent');
      if (member) {
        done.innerHTML = 'You\'re already in the Circle with this address, ' + nameHtml +
          ' — I\'ve kept your letter and it\'s waiting in your portrait. ' +
          '<a href="/portrait" style="color:var(--sea,#7fa8a5)">Open your portrait →</a>';
      } else if (linked) {
        done.innerHTML = 'Your letter\'s with me, ' + nameHtml + '. I\'ve sent a sign-in link to <span>' +
          addrHtml + '</span> — open it and you\'re in, your letter already on the wall. ' +
          'I read every one myself, so give me a day or two.';
      } else {
        done.innerHTML = 'Your letter\'s with me, ' + nameHtml + ', and I read every one myself. ' +
          'I couldn\'t send your sign-in link just now — ' +
          '<a href="/join?tab=signin&email=' + encodeURIComponent(addr) + '" style="color:var(--sea,#7fa8a5)">ask for it again here</a> ' +
          'whenever you like, and your letter will already be there.';
      }
      form.insertBefore(done, msg);
      msg.hidden = true;
    }
  }

  ready(function () {
    var forms = document.querySelectorAll('form.intent');
    if (!forms.length) return;
    injectCss();
    Array.prototype.forEach.call(forms, build);
  });
})();
