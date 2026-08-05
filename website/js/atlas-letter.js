/* ════════════════════════════════════════════════════════════════════
   The letter box — the one thing you can do on a craft that isn't open yet.

   Write to Arnaud about a craft, leave a name and an email, and three things
   happen: the letter lands on his desk, you're in the Circle, and a note comes
   back to you asking who you are. Nothing is sold, nothing is booked.

   It writes ONE launch_waitlist row. Two database triggers do the rest:
     notify-lead    -> Arnaud's sheet, with the letter in it (kind:'dream'.text)
     circle-welcome -> the reply to the writer

   The interests shape below is the one supabase/functions/notify-lead already
   parses — kind:'profile'.name, kind:'discipline'.discipline, kind:'dream'.text.
   Don't rename those keys without changing that function; the letter would
   silently stop reaching him, and "I read every one myself" would become false.

   The `slug` on the discipline item is what scripts/refresh-unlocked.mjs reads to
   decide the craft is now open. Every other surface writes a display name and
   makes the refresher guess; this one doesn't.

   INSTALL  <script src="/js/atlas-letter.js" defer></script>  (short sheets only —
   built in by scripts/build-atlas-pages.py). Binds form.et-letter, never
   form.intent, so intent-capture.js and skill-save.js keep their own surfaces.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var PENDING_KEY = "et_letter_pending";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // Already a member? Send them to sign in rather than making a second lead of
  // them. Fails OPEN on any hiccup — a slow probe must never block a real letter.
  function emailHasAccount(email) {
    var sb = window.supabaseClient;
    if (!sb || !sb.functions) return Promise.resolve(false);
    var probe = sb.functions.invoke("check-email", { body: { email: email } })
      .then(function (res) { return !!(res && !res.error && res.data && res.data.member); })
      .catch(function () { return false; });
    var timeout = new Promise(function (r) { setTimeout(function () { r(false); }, 8000); });
    return Promise.race([probe, timeout]);
  }

  function payloadFor(form, name, email, letter) {
    var slug = form.dataset.slug || "";
    var craft = form.dataset.craft || slug;
    return {
      email: email,
      source: "atlas-letter:" + slug,
      interests: [
        { kind: "profile", name: name },
        { kind: "discipline", discipline: craft, slug: slug, label: craft },
        { kind: "dream", text: letter }
      ]
    };
  }

  function stash(p) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch (e) {} }
  function unstash() { try { localStorage.removeItem(PENDING_KEY); } catch (e) {} }

  // A letter lost to a network blip is a letter Arnaud never sees. If a previous
  // visit failed to save, retry once the client is up. `flushing` matters: this runs
  // twice (once at DOM-ready, once when a cold client has connected), and the retry
  // exists precisely because the connection was bad — without the guard a slow insert
  // gets sent twice, and one letter becomes two rows, two notifications, two replies.
  var flushing = false;
  function flushPending() {
    var sb = window.supabaseClient;
    if (!sb || flushing) return;
    var raw;
    try { raw = localStorage.getItem(PENDING_KEY); } catch (e) { return; }
    if (!raw) return;
    var p;
    try { p = JSON.parse(raw); } catch (e) { unstash(); return; }
    if (!p || !p.email) { unstash(); return; }
    flushing = true;
    sb.from("launch_waitlist").insert(p).then(function (res) {
      flushing = false;
      if (!res.error) {
        unstash();
        if (window.plausible) window.plausible("AtlasLetterRecovered", { props: { source: p.source } });
      }
    }).catch(function () { flushing = false; });
  }

  var THANKS = "Thank you — it's with me. I read every one of these myself, and this is " +
    "what decides which craft I open next. There's an email on its way to you now; if it hasn't " +
    "landed in a minute, check spam. ";

  function sent(form, tailHtml) {
    var msg = form.querySelector(".letter-msg");
    [".letter-note", ".letter-row", ".letter-go", ".letter-q", ".letter-fine"].forEach(function (s) {
      var el = form.querySelector(s);
      if (el) el.hidden = true;
    });
    msg.innerHTML = THANKS + tailHtml;
    msg.className = "letter-msg ok";
    msg.hidden = false;
  }

  ready(function () {
    var forms = document.querySelectorAll("form.et-letter");
    if (!forms.length) return;
    flushPending();
    setTimeout(flushPending, 2500);

    forms.forEach(function (form) {
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        var btn = form.querySelector(".letter-go");
        var msg = form.querySelector(".letter-msg");
        var letter = (form.querySelector('[name="letter"]').value || "").trim();
        var name = (form.querySelector('[name="name"]').value || "").trim();
        var email = (form.querySelector('[name="email"]').value || "").trim();

        msg.hidden = true;
        msg.className = "letter-msg";
        if (!letter || !name || email.indexOf("@") < 1) {
          msg.textContent = "I need the letter, your name, and somewhere to reach you.";
          msg.className = "letter-msg err";
          msg.hidden = false;
          return;
        }

        btn.disabled = true;
        btn.textContent = "Sending…";

        var already = false;
        try { already = await emailHasAccount(email); } catch (e) { already = false; }
        // Being a member is not a reason to swallow the letter — send it either way,
        // and just don't invite them into a Circle they're already in.
        var payload = payloadFor(form, name, email, letter);
        var tail = already
          ? "You're already in the Circle with this email — " +
            '<a href="/join?tab=signin&email=' + encodeURIComponent(email) +
            '" style="color:var(--sea)">sign in to your account &rarr;</a>'
          : "You're in the Circle.";
        try {
          var sb = window.supabaseClient;
          if (!sb) throw new Error("offline");
          // supabase-js resolves rather than rejects, and turns network failures into
          // res.error. Not reading it would let the page say "it's with me" over a
          // letter that was never written anywhere.
          var res = await sb.from("launch_waitlist").insert(payload);
          if (res.error) throw res.error;
          unstash();
          sent(form, tail);
          if (window.plausible) {
            window.plausible(already ? "AtlasLetterExistingMember" : "AtlasLetter",
              { props: { source: form.dataset.slug } });
          }
        } catch (err) {
          stash(payload);   // so "your letter is safe on this device" is TRUE
          btn.disabled = false;
          btn.textContent = "Send the letter →";
          msg.textContent = "That didn't send — your letter is safe on this screen. " +
            "Try again in a moment.";
          msg.className = "letter-msg err";
          msg.hidden = false;
        }
      });
    });
  });
})();
