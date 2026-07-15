// Inline intent capture -> launch_waitlist. Additive; reuses window.supabaseClient.
// Captures the SPECIFIC craft/place the visitor is looking at, at full resolution,
// instead of a broad core bucket. RLS allows anon INSERT (migration 019). See
// docs/intent-capture-flow.md. Strategy lock: no prices, no booking — we introduce.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Ask the server (read-only, service role) whether this email already has an
  // account, so we send returning members to sign in instead of making a second
  // lead. Mirrors circle.html; fails OPEN — a slow/unavailable probe never blocks
  // a real join (4.5s timeout race).
  function emailHasAccount(email) {
    var sb = window.supabaseClient;
    if (!sb || !sb.functions) return Promise.resolve(false);
    var probe = sb.functions.invoke('check-email', { body: { email: email } })
      .then(function (res) { return !!(res && !res.error && res.data && res.data.member); })
      .catch(function () { return false; });
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, 4500); });
    return Promise.race([probe, timeout]);
  }
  ready(function () {
    var forms = document.querySelectorAll('form.intent');
    if (!forms.length) return;
    forms.forEach(function (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = form.querySelector('.intent-go');
        var msg = form.querySelector('.intent-msg');
        var emailEl = form.querySelector('input[name="email"]');
        var craftEl = form.querySelector('input[name="craft"]'); // free-text variant only
        var email = (emailEl && emailEl.value || '').trim();
        if (!email) return;
        var intent = {
          kind: 'discipline',
          discipline: form.dataset.discipline || null,
          place: form.dataset.place || null,
          label: form.dataset.label || (craftEl && craftEl.value || '').trim() || null
        };
        var source = form.dataset.source || ('intent:' + location.pathname);
        btn.disabled = true;
        msg.hidden = true;
        msg.className = 'intent-msg';

        // Already a member? Don't create a duplicate lead — send them to sign in.
        var already = false;
        try { already = await emailHasAccount(email); } catch (e) { already = false; }
        if (already) {
          btn.disabled = false;
          msg.innerHTML = "You're already in the Circle with this email — no need to sign up again. " +
            '<a href="/join?tab=signin&email=' + encodeURIComponent(email) +
            '" style="color:var(--sea)">Sign in to your account &rarr;</a>';
          msg.className = 'intent-msg ok';
          msg.hidden = false;
          if (window.plausible) window.plausible('IntentExistingMember', { props: { source: source } });
          return;
        }

        try {
          var sb = window.supabaseClient;
          if (!sb) throw new Error('offline');
          var res = await sb.from('launch_waitlist').insert({
            email: email, interests: [intent], source: source
          });
          if (res.error) throw res.error;
          var row = form.querySelector('.intent-row');
          var fine = form.querySelector('.intent-fine');
          if (row) row.hidden = true;
          if (fine) fine.hidden = true;
          msg.textContent = "You're in. We'll introduce you when " +
            (intent.label ? intent.label : 'this craft') +
            " is ready. Welcome to the Circle.";
          msg.className = 'intent-msg ok';
          msg.hidden = false;
          if (window.plausible) window.plausible('Intent', { props: { source: source } });
        } catch (err) {
          btn.disabled = false;
          msg.innerHTML = 'Couldn’t save that — try again, or ' +
            '<a href="/#circle" style="color:var(--sea)">join the Circle here</a>.';
          msg.className = 'intent-msg err';
          msg.hidden = false;
        }
      });
    });
  });
})();
