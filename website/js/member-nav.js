/* member-nav.js — quiet masthead for visitors, real navigation for members.
 * Visitors see the clean wordmark (+ a Join CTA). Once someone is CONNECTED to
 * the Circle (a Supabase session), the top nav reveals the way around the house:
 * The Atlas, The Story, and their own portrait. No session → nothing changes.
 * Needs supabase-config.js loaded on the page (window.supabaseClient).
 * Pure builder exposed as window.ET_MEMBER_NAV_TEST for node tests.
 */
(function () {
  "use strict";

  // the links a connected member gets in the top nav
  var MEMBER_LINKS = [
    ["/browse", "The Atlas"],
    ["/about", "The Story"],
    ["/portrait", "Your portrait"],
  ];

  function buildLinks(doc) {
    var wrap = doc.createElement("div");
    wrap.className = "member-nav";
    wrap.style.cssText = "display:flex;gap:22px;align-items:center;flex-wrap:wrap;";
    MEMBER_LINKS.forEach(function (p) {
      var a = doc.createElement("a");
      a.href = p[0];
      a.textContent = p[1];
      a.className = "member-nav-link";
      a.style.cssText = "color:var(--paper,#f3ede2);opacity:.72;text-decoration:none;font-size:14px;white-space:nowrap;transition:opacity .2s,color .2s;";
      a.addEventListener("mouseover", function () { a.style.opacity = "1"; a.style.color = "var(--sea,#7fa8a5)"; });
      a.addEventListener("mouseout", function () { a.style.opacity = ".72"; a.style.color = "var(--paper,#f3ede2)"; });
      wrap.appendChild(a);
    });
    return wrap;
  }

  // apply to a nav element: hide "Join the Circle" (they're already in), add member links.
  // Pure + DOM-only so node can unit-test the decision.
  function applyMemberNav(nav, doc) {
    if (!nav || nav.querySelector(".member-nav")) return false; // idempotent
    // a member doesn't need "Join the Circle"
    Array.prototype.forEach.call(nav.querySelectorAll('a[href="/circle"], a[href="/circle "], button'), function (el) {
      if (/join the circle/i.test(el.textContent || "")) el.style.display = "none";
    });
    // append the links into the nav's main row (the flex container next to the wordmark)
    var row = nav.querySelector(".nav-in, .row, .wrap, .links") ||
      (nav.firstElementChild && nav.firstElementChild.tagName === "DIV" ? nav.firstElementChild : nav);
    row.appendChild(buildLinks(doc));
    return true;
  }

  function waitForClient(cb, n) {
    n = n || 0;
    if (window.supabaseClient) return cb(window.supabaseClient);
    if (window.supabaseError || n > 80) return cb(null);
    setTimeout(function () { waitForClient(cb, n + 1); }, 50);
  }

  function run() {
    waitForClient(function (client) {
      if (!client) return;
      client.auth.getSession().then(function (res) {
        var session = res && res.data ? res.data.session : null;
        if (!session) return; // visitor: leave the clean nav untouched
        var nav = document.querySelector("nav");
        if (nav) applyMemberNav(nav, document);
      }).catch(function () {});
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();

  window.ET_MEMBER_NAV_TEST = { applyMemberNav, buildLinks };
})();
