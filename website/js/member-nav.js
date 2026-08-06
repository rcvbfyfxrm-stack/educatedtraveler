/* member-nav.js — recognise someone who already has an account.
 *
 * The rule that killed the previous version still holds: The Atlas, Lab Weeks and
 * The Story must NEVER be injected into the header/nav, for visitors OR members.
 * Nothing here adds a destination to the header. It answers one question — is this
 * person already in? — and stops the site from asking a member to join again.
 *
 * A session is restored by supabase-js from localStorage on every page that loads
 * supabase-config.js, whichever path founded the account: /join, /circle's
 * continuation, /portrait's own magic link, or a link mailed by hand. So "already
 * has an account" here means "has signed in on this browser and the refresh token
 * is still good" — that is the only thing a static site can honestly know.
 *
 *   signed in  → every "Join the Circle" call-to-action becomes "Your portrait",
 *                pointing at /portrait, and the "already have an account" line is
 *                removed (they are signed in; it is noise).
 *   signed out → nothing is touched.
 *
 * Deliberately fail-quiet and fail-visitor: the markup ships correct for a visitor,
 * so a blocked CDN, a dead SDK or a thrown error leaves the page in its honest
 * default state rather than a half-rewritten one.
 */
(function () {
  'use strict';

  var MEMBER_LABEL = 'Your portrait';
  var MEMBER_HREF = '/portrait';
  var POLL_MS = 50;
  var MAX_TRIES = 100; // ~5s, same budget supabase-config gives the SDK

  function whenClient(cb, tries) {
    tries = tries || 0;
    if (window.supabaseClient && window.supabaseClient.auth) return cb(window.supabaseClient);
    if (window.supabaseError || tries >= MAX_TRIES) return; // stay a visitor
    setTimeout(function () { whenClient(cb, tries + 1); }, POLL_MS);
  }

  // A join call-to-action is any link or button that says "Join the Circle" AND
  // actually points at the join flow — text alone would catch prose, and target
  // alone would catch the discreet footer links we must leave be.
  function joinCtas() {
    var out = [];
    var nodes = document.querySelectorAll('a[href], button[onclick], button');
    Array.prototype.forEach.call(nodes, function (el) {
      if (!/join the circle/i.test(el.textContent || '')) return;
      var href = el.getAttribute('href') || '';
      var onclick = el.getAttribute('onclick') || '';
      if (href.indexOf('/circle') === 0 || /goCircle/.test(onclick)) out.push(el);
    });
    return out;
  }

  // Replace the words without touching anything else inside the element — the
  // hero button carries an inline arrow SVG that must survive.
  function relabel(el, label) {
    var replaced = false;
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType !== 3) return;
      if (!/join the circle/i.test(node.nodeValue)) return;
      node.nodeValue = node.nodeValue.replace(/join the circle/i, label);
      replaced = true;
    });
    if (!replaced) el.textContent = label;
  }

  function asMember(els) {
    els.forEach(function (el) {
      relabel(el, MEMBER_LABEL);
      if (el.tagName === 'A') {
        el.setAttribute('href', MEMBER_HREF);
      } else {
        // The inline handler would fire first and send them to /circle.
        el.removeAttribute('onclick');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          window.location.href = MEMBER_HREF;
        });
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-visitor-only]'), function (el) {
      el.style.display = 'none';
    });
    document.documentElement.setAttribute('data-member', 'true');
  }

  whenClient(function (sb) {
    var els = joinCtas();
    if (!els.length && !document.querySelector('[data-visitor-only]')) return;
    sb.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      if (session && session.user) asMember(els);
    }).catch(function () { /* stay a visitor */ });
  });
})();
