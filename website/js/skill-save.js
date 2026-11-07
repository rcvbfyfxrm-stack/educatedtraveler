// skill-save.js — "Save this skill" on Atlas skill pages.
//
// Saving is a Circle member's benefit. "Circle member" is narrow on purpose:
// signed in AND their portrait is complete (profiles.portrait_complete === true) —
// i.e. they actually went through the Circle → portrait. A bare account (an
// instructor, a half-finished signup) is NOT a member here.
//
//   • member:     click toggles save/un-save in their profile.
//   • not a member (visitor OR signed-in-but-no-portrait): the button reads
//     "I'm interested" and the click opens the address dialog on this page
//     (intent-capture.js → ETNote.interest), with no note in front of it and no
//     trip to /circle. Arnaud, 4 Nov 2026: "so it's easy for people to reach me."
//     Until 4 Nov 2026 the click stashed the skill and sent them to /circle; the
//     stash is still flushed for anyone it was left with, and then it is gone.
//
// The page prints the button itself — an <a data-save-skill …> under the title whose
// href is the note's own id — so a reader with no script still lands on the note.
// This file takes it over when it arrives.
//
// Storage reuses `saved_adventures` (id "skill:<discipline>") — no migration;
// owner-only RLS keeps saves private. Needs auth.js + database.js on the page.

(function () {
  'use strict';

  var PENDING_KEY = 'et_pending_saved_skill';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function sb() { return window.supabaseClient; }
  function signedIn() { return !!(window.auth && window.auth.isSignedIn && window.auth.isSignedIn()); }
  function currentUser() { return window.auth && window.auth.getCurrentUser ? window.auth.getCurrentUser() : null; }

  // Signed in AND portrait complete === a Circle member.
  async function isMember(uid) {
    try {
      if (!sb() || !uid) return false;
      var res = await sb().from('profiles').select('portrait_complete').eq('id', uid).maybeSingle();
      return !!(res && res.data && res.data.portrait_complete);
    } catch (e) { return false; }
  }

  // Complete a save the visitor asked for before they were a member.
  async function flushPending(uid) {
    var raw;
    try { raw = localStorage.getItem(PENDING_KEY); } catch (e) { raw = null; }
    if (!raw) return null;
    try {
      var s = JSON.parse(raw);
      if (s && s.id && window.db && window.db.saveAdventure) {
        await window.db.saveAdventure(uid, { id: 'skill:' + s.id, name: s.name || s.id });
      }
      localStorage.removeItem(PENDING_KEY);
      return s && s.id ? s.id : null;
    } catch (e) { return null; }
  }

  function injectCss() {
    if (document.getElementById('skill-save-css')) return;
    var s = document.createElement('style');
    s.id = 'skill-save-css';
    s.textContent =
      '.skill-save-wrap{display:flex;justify-content:center;margin:0 0 18px}' +
      '.skill-save-btn{display:inline-flex;align-items:center;gap:.5em;font-family:"IBM Plex Mono",ui-monospace,monospace;' +
        'font-size:12.5px;letter-spacing:.06em;color:#0e1615;background:rgba(14,22,21,.04);' +
        'border:1px solid rgba(78,123,120,.5);border-radius:99px;padding:11px 22px;cursor:pointer;' +
        'transition:border-color .2s,background .2s,transform .2s,color .2s}' +
      '.skill-save-btn:hover{border-color:#4e7b78;background:rgba(78,123,120,.10);transform:translateY(-1px)}' +
      '.skill-save-btn .ss-i{font-size:14px;line-height:1}' +
      '.skill-save-btn.is-saved{border-color:#4e7b78;background:linear-gradient(135deg,rgba(78,123,120,.22),rgba(78,123,120,.16));color:#0e1615}' +
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

  ready(function () {
    var btn = document.querySelector('[data-save-skill]');
    var info = skillInfo(btn);
    if (!info) return; // not a skill page

    injectCss();

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
    var member = false;
    var resolved = false;

    function paint() {
      if (!member) {
        // the page's own words, until a member is recognised
        btn.innerHTML = 'I’m interested';
        btn.classList.remove('is-saved');
        btn.removeAttribute('aria-pressed');
        return;
      }
      btn.innerHTML = isSaved
        ? '<span class="ss-i" aria-hidden="true">✓</span> Saved to your profile'
        : '<span class="ss-i" aria-hidden="true">+</span> Save this skill';
      btn.classList.toggle('is-saved', isSaved);
      btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
    }
    paint();

    async function refreshSaved(uid) {
      try {
        if (!window.db || !window.db.getSavedAdventures) return;
        var rows = await window.db.getSavedAdventures(uid);
        isSaved = !!(rows || []).some(function (r) { return r.adventure_id === savedId; });
        paint();
      } catch (e) { /* keep default */ }
    }

    // Work out membership, and for members: complete any pending save + reflect state.
    async function resolveMember() {
      resolved = false;
      var u = signedIn() ? currentUser() : null;
      member = u ? await isMember(u.id) : false;
      resolved = true;
      paint();
      if (member && u) {
        await flushPending(u.id);   // fallback completion for a returning member
        await refreshSaved(u.id);
      }
    }

    if (window.auth && window.auth.onAuthStateChange) {
      window.auth.onAuthStateChange(function () { resolveMember(); });
    }
    setTimeout(resolveMember, 700);

    // The page's button is an <a>, which has no `disabled`; say it both ways.
    function busy(on) {
      btn.disabled = on;
      if (on) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    }

    btn.addEventListener('click', async function (ev) {
      // The static link jumps to the note; from here the script answers instead.
      if (ev && ev.preventDefault) ev.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      busy(true);
      if (!resolved) await resolveMember();

      if (!member) {
        busy(false);
        if (window.ETNote && window.ETNote.interest) {
          window.ETNote.interest({ craft: info.name, slug: info.id, label: info.name }, btn);
        } else {
          window.location.hash = 'letter';   // the link's own target: the note
        }
        return;
      }

      var u = currentUser();
      if (!u || !window.db) { busy(false); return; }
      var wanted = !isSaved;
      try {
        if (wanted) await window.db.saveAdventure(u.id, { id: savedId, name: info.name });
        else await window.db.removeAdventure(u.id, savedId);
        isSaved = wanted;
        paint();
      } catch (e) { /* leave state as-is */ }
      busy(false);
    });
  });
})();
