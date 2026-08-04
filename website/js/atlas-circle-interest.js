/* ════════════════════════════════════════════════════════════════════
   Atlas × Circle — "who from the Circle wants this craft".

   Reads the public, privacy-capped RPC public.atlas_interest() (migration
   033): craft → how many people raised a hand, plus up to three FIRST names.
   Never an email, never a surname, never a letter.

   TRUST LOCK: this line is only ever drawn from real rows. No craft is
   seeded, rounded up, or invented — a craft nobody has asked for shows
   nothing at all, and that silence is the honest answer.

   FAILS SOFT: if the RPC isn't deployed yet, or Supabase is down, or the
   table is empty, every card simply renders as it did before.

   INSTALL  <script defer src="/js/atlas-circle-interest.js"></script>
   MARKUP   the page renders an empty <div class="cint" data-craft="…"></div>
            inside each card and fires document→'et:atlas-render' after every
            re-render. This file fills those slots.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.ETInterest) return;

  var MAP = null;      // normalised craft name → {n:Number, names:[String]}
  var LOADED = false;  // the fetch has settled (either way)

  function norm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* The sentence. Every shape of it has to be literally true of the count. */
  function sentence(rec) {
    var n = rec.n, names = (rec.names || []).filter(Boolean);
    if (!n) return "";
    var who;
    if (!names.length) {
      who = n === 1 ? "One person in the Circle" : n + " people in the Circle";
      return who + (n === 1 ? " is" : " are") + " already after this one";
    }
    var parts = names.slice(0, 3);
    var rest = n - parts.length;
    if (rest > 0) parts.push(rest + " more");
    who = parts.length === 1 ? parts[0]
        : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
    return who + (parts.length > 1 ? " are" : " is") + " in the Circle for this";
  }

  function paint(root) {
    if (!MAP) return;
    var slots = (root || document).querySelectorAll(".cint:not([data-cint-done])");
    for (var i = 0; i < slots.length; i++) {
      var el = slots[i];
      el.setAttribute("data-cint-done", "1");
      var rec = MAP[norm(el.getAttribute("data-craft"))];
      if (!rec) continue;
      var txt = sentence(rec);
      if (!txt) continue;
      el.innerHTML = '<span class="cint-dot" aria-hidden="true">●</span>' + esc(txt);
      el.setAttribute("title", "Real people who joined the Circle and named this craft");
    }
  }

  function load() {
    var sb = window.supabaseClient;
    if (!sb || !sb.rpc) return Promise.resolve(false);
    return sb.rpc("atlas_interest").then(function (res) {
      if (!res || res.error || !Array.isArray(res.data)) {
        if (res && res.error) console.log("[Atlas interest] not available:", res.error.message);
        return false;
      }
      MAP = {};
      res.data.forEach(function (r) {
        var k = norm(r.discipline);
        if (!k) return;
        var n = Number(r.learners) || 0;
        if (!n) return;
        if (MAP[k]) { MAP[k].n += n; MAP[k].names = MAP[k].names.concat(r.names || []); }
        else MAP[k] = { n: n, names: (r.names || []).slice() };
      });
      return true;
    }).catch(function (e) {
      console.log("[Atlas interest] skipped:", e && e.message);
      return false;
    });
  }

  /* Supabase boots asynchronously (supabase-config.js polls for the SDK), so
     retry briefly rather than giving up on the first tick. */
  function boot(attempt) {
    attempt = attempt || 0;
    if (window.supabaseClient) {
      load().then(function (ok) { LOADED = true; if (ok) paint(document); });
      return;
    }
    if (attempt > 60) { LOADED = true; return; }   // ~6s, then stop asking
    setTimeout(function () { boot(attempt + 1); }, 100);
  }

  document.addEventListener("et:atlas-render", function () { paint(document); });
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", function () { boot(); });

  window.ETInterest = {
    paint: paint,
    get: function (craft) { return MAP ? MAP[norm(craft)] || null : null; },
    ready: function () { return LOADED; }
  };
})();
