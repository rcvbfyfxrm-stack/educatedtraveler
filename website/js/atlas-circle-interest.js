/* ════════════════════════════════════════════════════════════════════
   Atlas × Circle — how many members of the Circle are interested in a craft.

   Reads the public, privacy-capped RPC public.atlas_interest() (migration
   033): craft → how many people raised a hand. Nothing else. No name, no
   email, no surname, no letter — the count is the whole payload.

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

  var MAP = null;      // normalised craft name → {n:Number}
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

  /* The sentence. Every shape of it has to be literally true of the count.
     Anonymous by design: the RPC returns no names (migration 033, SHOW_NAMES
     off), and nothing here would print one if it did. With one person per craft
     a first name isn't a crowd — it's a public statement about somebody who
     only ever joined a mailing list. The number says the true thing on its own. */
  function sentence(rec) {
    var n = rec.n;
    if (!n) return "";
    return n === 1
      ? "1 member of the Circle is interested in this skill"
      : n + " members of the Circle are interested in this skill";
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
      el.setAttribute("title", "Members of the Circle who named this craft when they joined — counted, never named");
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
        if (MAP[k]) MAP[k].n += n;
        else MAP[k] = { n: n };
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
