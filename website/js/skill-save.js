// skill-save.js — "Save this skill" on Atlas skill pages.
//
// Signed-in Circle members save the skill to their profile. Visitors who aren't
// in the Circle yet are sent to join it; the skill is remembered and saved the
// moment they're in (auth.js -> migratePendingSavedSkill).
//
// Storage reuses the existing `saved_adventures` table (no migration): a saved
// skill is a row with adventure_id = "skill:<discipline-id>". The profile reads
// those back under its owner-only RLS, so saves stay private to the member.
//
// Wiring: any page that loads this script picks up either an explicit
//   <button data-save-skill data-skill-id="freediving" data-skill-name="Freediving">
// or, failing that, the page's <form class="intent" data-discipline data-label>,
// and injects the button just above it. Needs auth.js + database.js on the page.

(function () {
  'use strict';

  var PENDING_KEY = 'et_pending_saved_skill';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function injectCss() {
    if (document.getElementById('skill-save-css')) return;
    var s = document.createElement('style');
    s.id = 'skill-save-css';
    s.textContent =
      '.skill-save-wrap{display:flex;justify-content:center;margin:0 0 18px}' +
      '.skill-save-btn{display:inline-flex;align-items:center;gap:.5em;font-family:"IBM Plex Mono",ui-monospace,monospace;' +
        'font-size:12.5px;letter-spacing:.06em;color:#f3ede2;background:rgba(243,237,226,.04);' +
        'border:1px solid rgba(127,168,165,.5);border-radius:99px;padding:11px 22px;cursor:pointer;' +
        'transition:border-color .2s,background .2s,transform .2s,color .2s}' +
      '.skill-save-btn:hover{border-color:#7fa8a5;background:rgba(127,168,165,.10);transform:translateY(-1px)}' +
      '.skill-save-btn .ss-i{font-size:14px;line-height:1}' +
      '.skill-save-btn.is-saved{border-color:#7fa8a5;background:linear-gradient(135deg,rgba(127,168,165,.22),rgba(210,138,82,.16));color:#f3ede2}' +
      '.skill-save-btn[disabled]{opacity:.55;cursor:default}';
    document.head.appendChild(s);
  }

  function skillInfo(btn) {
    var id = btn && btn.getAttribute('data-skill-id');
    var name = btn && btn.getAttribute('data-skill-name');
    if (!id) {
      var f = document.querySelector('form.intent[data-discipline]');
      if (f) { id = f.getAttribute('data-discipline'); name = f.getAttribute('data-label') || name; }
    }
    if (!id) return null;
    return { id: id, name: name || id };
  }

  function signedIn() { return !!(window.auth && window.auth.isSignedIn && window.auth.isSignedIn()); }
  function currentUser() { return window.auth && window.auth.getCurrentUser ? window.auth.getCurrentUser() : null; }

  ready(function () {
    var btn = document.querySelector('[data-save-skill]');
    var info = skillInfo(btn);
    if (!info) return; // not a skill page

    injectCss();

    // Auto-inject the button above the intent form if the page didn't place one.
    if (!btn) {
      var form = document.querySelector('form.intent[data-discipline]');
      if (!form) return;
      var wrap = document.createElement('div');
      wrap.className = 'skill-save-wrap';
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill-save-btn';
      btn.setAttribute('data-save-skill', '');
      wrap.appendChild(btn);
      form.parentNode.insertBefore(wrap, form);
    } else if (!btn.classList.contains('skill-save-btn')) {
      btn.classList.add('skill-save-btn');
    }

    var savedId = 'skill:' + info.id;
    var isSaved = false;

    function paint() {
      btn.innerHTML = isSaved
        ? '<span class="ss-i" aria-hidden="true">✓</span> Saved to your profile'
        : '<span class="ss-i" aria-hidden="true">+</span> Save this skill';
      btn.classList.toggle('is-saved', isSaved);
      btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
    }
    paint();

    async function refresh() {
      try {
        var u = currentUser();
        if (!u || !window.db || !window.db.getSavedAdventures) return;
        var rows = await window.db.getSavedAdventures(u.id);
        isSaved = !!(rows || []).some(function (r) { return r.adventure_id === savedId; });
        paint();
      } catch (e) { /* stay in default (unsaved) state */ }
    }

    // Reflect the true state once auth resolves, and on any auth change.
    if (window.auth && window.auth.onAuthStateChange) window.auth.onAuthStateChange(function () { refresh(); });
    setTimeout(refresh, 700);

    btn.addEventListener('click', async function () {
      if (!signedIn()) {
        // Remember the intent, then send them to join the Circle. Once they're
        // in (and signed in), auth.js saves it automatically.
        try { localStorage.setItem(PENDING_KEY, JSON.stringify({ id: info.id, name: info.name })); } catch (e) {}
        window.location.href = '/circle?save=' + encodeURIComponent(info.id);
        return;
      }
      var u = currentUser();
      if (!u || !window.db) return;
      btn.disabled = true;
      var wanted = !isSaved;
      try {
        if (wanted) await window.db.saveAdventure(u.id, { id: savedId, name: info.name });
        else await window.db.removeAdventure(u.id, savedId);
        isSaved = wanted;
        paint();
      } catch (e) { /* leave state as-is on error */ }
      btn.disabled = false;
    });
  });
})();
