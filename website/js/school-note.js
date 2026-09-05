/* school-note.js — a comment on a school, written from the school itself.
 *
 * Migration 044 built `vouches` for a signed-in member and it was used exactly
 * zero times. The form was not bad; it was in the wrong place. It sat on /you,
 * behind a sign-in, findable only by somebody already looking at their own
 * account page — while the person with something to say about a school is
 * standing on that school's page, usually with no account at all.
 *
 * So this is the same table, reached from the school, open to anyone.
 *
 * The order is the doctrine from intent-capture.js, and it is not decoration:
 *   "A page that asks who you are before you have said anything is a form; a
 *    page that takes what you wrote and then asks where to write back is a note."
 * The comment is written first. The address is asked afterwards, in a dialog,
 * with consent as a tick inside it — because pressing post is not permission to
 * publish somebody's name or to keep their details.
 *
 * What this file may NOT do:
 *   · It never publishes. The row lands `pending`; the anon INSERT policy in
 *     migration 045 makes any other status impossible, so nothing here relies on
 *     us remembering to be careful.
 *   · It never says Arnaud has read it. At submit time he has not. The tense is
 *     the whole tell.
 *   · It never renders a comment that is not both `approved` and consented — and
 *     it does not enforce that itself. The SELECT policy does, so a bug here
 *     cannot leak a pending row.
 */
(function () {
    'use strict';

    var MIN = 40, MAX = 2000;

    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function css() {
        if ($('sn-css')) return;
        var st = document.createElement('style');
        st.id = 'sn-css';
        st.textContent = [
            '.sn-open{background:none;border:none;padding:6px 0;margin-top:6px;cursor:pointer;',
            '  font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;',
            '  text-transform:uppercase;color:var(--sea);border-bottom:1px solid rgba(127,168,165,.32)}',
            '.sn-open:hover{color:var(--paper)}',
            '.sn-panel{margin:12px 0 4px;padding:14px;border:1px solid var(--line);',
            '  border-left:2px solid var(--sea);border-radius:10px;background:rgba(127,168,165,.05)}',
            '.sn-panel p.sn-q{font-size:14px;margin:0 0 10px;color:var(--paper)}',
            '.sn-panel textarea,.sn-panel input{width:100%;background:rgba(0,0,0,.25);color:var(--paper);',
            '  border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;font-size:14px}',
            '.sn-panel textarea{min-height:110px;resize:vertical;line-height:1.6}',
            '.sn-row{display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap}',
            '.sn-go{background:var(--sea);color:#0d0b09;border:none;border-radius:999px;padding:9px 18px;',
            '  font:500 13px/1 inherit;cursor:pointer}',
            '.sn-go[disabled]{opacity:.55;cursor:default}',
            '.sn-cancel{background:none;border:none;color:var(--faint);font-size:12px;cursor:pointer}',
            '.sn-pick{background:none;border:1px solid var(--line);border-radius:999px;padding:7px 14px;',
            '  color:var(--muted);font:inherit;font-size:13px;cursor:pointer}',
            '.sn-pick:hover{color:var(--paper)}',
            '.sn-pick.on{border-color:var(--sea);color:var(--sea);background:rgba(127,168,165,.10)}',
            '.sn-lab{display:block;margin:12px 0 0;font-size:12.5px;color:var(--muted)}',
            '.sn-lab input{margin-top:5px}',
            '.sn-count{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--faint);margin-left:auto}',
            '.sn-msg{font-size:13px;margin-top:10px;line-height:1.6}',
            '.sn-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
            '.sn-note{margin:10px 0 0;padding:10px 12px;border-left:2px solid rgba(127,168,165,.45);',
            '  background:rgba(243,237,226,.03);border-radius:0 6px 6px 0}',
            '.sn-note q{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:15px;line-height:1.6;',
            '  color:var(--paper);quotes:"\\201C" "\\201D"}',
            '.sn-by{display:block;margin-top:6px;font-family:"IBM Plex Mono",monospace;font-size:10.5px;',
            '  letter-spacing:.08em;color:var(--faint)}',
            '.sn-dlg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;',
            '  justify-content:center;padding:20px;background:rgba(0,0,0,.72)}',
            '.sn-card{max-width:460px;width:100%;background:#14110d;border:1px solid var(--line);',
            '  border-radius:16px;padding:22px}',
            '.sn-card h3{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:21px;margin:0 0 6px;color:var(--paper)}',
            '.sn-card p{font-size:13.5px;color:var(--muted);margin:0 0 14px;line-height:1.6}',
            '.sn-card label.sn-tick{display:flex;gap:9px;align-items:flex-start;margin-top:12px;',
            '  font-size:13px;color:var(--muted);line-height:1.5;cursor:pointer}',
            '.sn-card label.sn-tick input{width:auto;margin-top:2px;flex:0 0 auto}',
            '.sn-card label.sn-field{display:block;margin-top:12px}',
            '.sn-card label.sn-field span{display:block;font-family:"IBM Plex Mono",monospace;',
            '  font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin-bottom:5px}'
        ].join('');
        document.head.appendChild(st);
    }

    function sb() { return window.supabaseClient; }

    // ── the dialog: asked only once there is something to send ───────────────
    // `kind` only swaps two lines of copy. A note about a place nobody has checked is
    // not going on a school's page, because there is no school and no page — offering
    // that tick would be asking consent for something that cannot happen.
    function askAddress(onSend, kind) {
        var isPlace = kind === 'place';
        var wrap = document.createElement('div');
        wrap.className = 'sn-dlg';
        wrap.innerHTML =
            '<div class="sn-card" role="dialog" aria-modal="true" aria-label="Where I write back">' +
              '<h3>Where do I write back?</h3>' +
              '<p>Your ' + (isPlace ? 'note' : 'comment') + ' is written. This is only so Arnaud can answer it, and so you can be ' +
              'credited if you want to be. He reads every one himself before anything appears.</p>' +
              '<input type="email" id="sn-email" placeholder="you@wherever.com" autocomplete="email">' +
              '<label class="sn-tick"><input type="checkbox" id="sn-pub" checked>' +
                '<span>' + (isPlace ? 'Quote me if this place ever gets a page of its own. I understand that would be public.'
                                    : 'Put it on the school’s page. I understand it is public.') + '</span></label>' +
              '<label class="sn-field"><span>The name to put on it</span>' +
                '<input type="text" id="sn-name" placeholder="Kate M. is plenty — or leave it blank" maxlength="60"></label>' +
              '<label class="sn-tick"><input type="checkbox" id="sn-circle">' +
                '<span>And send me the Circle note — one note when there is a real week to tell you about.</span></label>' +
              '<p class="sn-msg" id="sn-dlg-err" style="display:none;color:#f0a58a"></p>' +
              '<div class="sn-row"><button class="sn-go" id="sn-send">Send it →</button>' +
                '<button class="sn-cancel" id="sn-back">Back to what I wrote</button></div>' +
            '</div>';
        document.body.appendChild(wrap);
        $('sn-email').focus();

        function close() {
            document.removeEventListener('keydown', onKey);
            wrap.remove();
        }
        function onKey(e) { if (e.key === 'Escape') close(); }
        document.addEventListener('keydown', onKey);

        $('sn-back').addEventListener('click', close);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
        $('sn-send').addEventListener('click', function () {
            var email = ($('sn-email').value || '').trim();
            if (email && email.indexOf('@') < 1) {
                $('sn-dlg-err').textContent = 'That address does not look right — or leave it blank.';
                $('sn-dlg-err').style.display = 'block';
                return;
            }
            var circle = $('sn-circle').checked;
            if (circle && !email) {
                $('sn-dlg-err').textContent = 'The Circle needs an address to write to.';
                $('sn-dlg-err').style.display = 'block';
                return;
            }
            this.disabled = true; this.textContent = 'Sending…';
            onSend({ email: email, publish: $('sn-pub').checked,
                     name: ($('sn-name').value || '').trim(), circle: circle },
                   function () { close(); });
        });
    }

    // ── one school's box ─────────────────────────────────────────────────────
    function wire(li) {
        var school = li.getAttribute('data-school');
        var craft = li.getAttribute('data-craft');
        var dest = li.getAttribute('data-dest');
        if (!school || !craft || !dest) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sn-open';
        btn.textContent = 'Been here? Write a comment →';
        li.appendChild(btn);

        btn.addEventListener('click', function () {
            if (li.querySelector('.sn-panel')) return;
            btn.style.display = 'none';
            var panel = document.createElement('div');
            panel.className = 'sn-panel';
            panel.innerHTML =
                '<p class="sn-q">What was it actually like at <b>' + esc(school) + '</b>?</p>' +
                '<textarea maxlength="' + MAX + '" placeholder="Who was in the room. What your hands were ' +
                  'allowed to do. What you would tell the next person before they booked."></textarea>' +
                '<div class="sn-hp"><label>Leave this empty<input type="text" tabindex="-1" autocomplete="off"></label></div>' +
                '<div class="sn-row"><button class="sn-go" disabled>Post it →</button>' +
                  '<button class="sn-cancel">Not now</button>' +
                  '<span class="sn-count">0 / ' + MIN + '</span></div>' +
                '<p class="sn-msg" style="display:none"></p>';
            li.appendChild(panel);

            var ta = panel.querySelector('textarea');
            var go = panel.querySelector('.sn-go');
            var count = panel.querySelector('.sn-count');
            var msg = panel.querySelector('.sn-msg');
            var hp = panel.querySelector('.sn-hp input');
            ta.focus();

            ta.addEventListener('input', function () {
                var n = ta.value.trim().length;
                count.textContent = n < MIN ? n + ' / ' + MIN : n + ' / ' + MAX;
                go.disabled = n < MIN;
            });
            panel.querySelector('.sn-cancel').addEventListener('click', function () {
                panel.remove(); btn.style.display = '';
            });

            go.addEventListener('click', function () {
                var what = ta.value.trim();
                if (what.length < MIN) return;
                // A bot fills every field it finds. A person never sees this one.
                if (hp.value) { panel.remove(); btn.style.display = ''; return; }

                askAddress(function (a, done) {
                    send({ craft: craft, destination: dest, school: school, what: what,
                           email: a.email, display_name: a.name, publish: a.publish,
                           circle: a.circle },
                         function (ok, text) {
                             done(ok);
                             if (!ok) {
                                 // Their words stay on the screen. A failed send that
                                 // also eats what somebody wrote is two losses, and the
                                 // second one is ours.
                                 msg.innerHTML = text;
                                 msg.style.display = 'block';
                                 msg.style.color = '#f0a58a';
                                 go.disabled = false;
                                 return;
                             }
                             panel.innerHTML = '<p class="sn-msg" style="display:block">' + text + '</p>';
                             if (a.publish) reload(dest);
                         });
                });
            });
        });
    }

    // ── the same box, on a place nobody has checked ──────────────────────────
    // Arnaud, 2026-09-05: "people can tell me if they have been and if its belong to
    // educatedtraveler ... you think of another school/instructor that belong here
    // write me a note!"
    //
    // The 308 lines under "Where else this craft lives" are the only part of the Atlas
    // that admits it has not been looked at. That makes them the one place where a
    // reader knows something we do not — so the box belongs there more than anywhere
    // else on the site, and it asks the two questions the line cannot answer itself:
    // have you been, and is there somebody here who should be on this map.
    //
    // ⛔ IT CARRIES A state ONLY WHEN THEY SAY THEY WENT, and is keyed
    // `<craft>--also--<place>`, which matches no destination id. Neither is what stops
    // it moving a grade — refresh-vouches.mjs does that at the query, by taking only
    // rows with no school and a real user_id. These are belt to that braces, and the
    // comment above the filter in that file is the one to read.
    function slugify(s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    }

    function wirePlace(li) {
        var place = li.getAttribute('data-place');
        var country = li.getAttribute('data-country') || '';
        var craft = li.getAttribute('data-craft');
        if (!place || !craft || li.querySelector('.sn-open')) return;

        var btn = document.createElement('button');
        btn.className = 'sn-open';
        btn.type = 'button';
        btn.textContent = 'Been here? Know someone who teaches here?';
        li.appendChild(btn);

        btn.addEventListener('click', function () {
            btn.style.display = 'none';
            var panel = document.createElement('div');
            panel.className = 'sn-panel';
            panel.innerHTML =
                '<p class="sn-q">Nobody from EducatedTraveler has been to <b>' + esc(place) + '</b>. ' +
                  'You may know better than the line above.</p>' +
                '<div class="sn-row" role="group" aria-label="Have you been there?">' +
                  '<button class="sn-pick" data-been="1" type="button">I have been</button>' +
                  '<button class="sn-pick" data-been="0" type="button">Not been, but I know it</button>' +
                '</div>' +
                '<label class="sn-lab">A school or an instructor here, if you know one' +
                  '<input class="sn-school" maxlength="120" placeholder="A name — that is the part we cannot research from a desk"></label>' +
                '<textarea maxlength="' + MAX + '" placeholder="What is actually there. Who teaches, ' +
                  'and whether you think it belongs on this map."></textarea>' +
                '<div class="sn-hp"><label>Leave this empty<input type="text" tabindex="-1" autocomplete="off"></label></div>' +
                '<div class="sn-row"><button class="sn-go" disabled>Send it to Arnaud →</button>' +
                  '<button class="sn-cancel">Not now</button>' +
                  '<span class="sn-count">0 / ' + MIN + '</span></div>' +
                '<p class="sn-msg" style="display:none"></p>';
            li.appendChild(panel);

            var been = null;
            var picks = panel.querySelectorAll('.sn-pick');
            Array.prototype.forEach.call(picks, function (b) {
                b.addEventListener('click', function () {
                    been = b.getAttribute('data-been') === '1';
                    Array.prototype.forEach.call(picks, function (o) { o.classList.remove('on'); });
                    b.classList.add('on');
                });
            });

            var ta = panel.querySelector('textarea');
            var school = panel.querySelector('.sn-school');
            var go = panel.querySelector('.sn-go');
            var count = panel.querySelector('.sn-count');
            var msg = panel.querySelector('.sn-msg');
            var hp = panel.querySelector('.sn-hp input');
            ta.focus();

            ta.addEventListener('input', function () {
                var n = ta.value.trim().length;
                count.textContent = n < MIN ? n + ' / ' + MIN : n + ' / ' + MAX;
                go.disabled = n < MIN;
            });
            panel.querySelector('.sn-cancel').addEventListener('click', function () {
                panel.remove(); btn.style.display = '';
            });

            go.addEventListener('click', function () {
                var what = ta.value.trim();
                if (what.length < MIN) return;
                if (hp.value) { panel.remove(); btn.style.display = ''; return; }
                // The two answers are not columns on this table, and inventing columns
                // for them would need a migration nobody has run. They are the first
                // line of the note instead, where the person reading it will see them.
                var stamp = (been === true ? 'Has been there.'
                          : been === false ? 'Has not been — writing from what they know.'
                          : 'Did not say whether they have been.');
                askAddress(function (a, done) {
                    send({ craft: craft,
                           destination: craft + '--also--' + slugify(place),
                           // The policy requires a school. When they name none, the row is
                           // about the place, and it says so rather than inventing a school.
                           school: school.value.trim() || (place + (country ? ', ' + country : '')),
                           what: stamp + '\n\n' + what,
                           been: been === true,
                           email: a.email, display_name: a.name, publish: a.publish,
                           circle: a.circle },
                         function (ok, text) {
                             done(ok);
                             if (!ok) {
                                 // Their words stay on the screen — the same rule the
                                 // school box follows, and for the same reason.
                                 msg.innerHTML = text;
                                 msg.style.display = 'block';
                                 msg.style.color = '#f0a58a';
                                 go.disabled = false;
                                 return;
                             }
                             panel.innerHTML = '<p class="sn-msg" style="display:block">' + text + '</p>';
                         });
                }, 'place');
            });
        });
    }

    function send(row, cb) {
        var client = sb();
        if (!client) return cb(false, 'Could not reach the site just now — try again in a minute.');
        if (window.etCanWrite && !window.etCanWrite()) {
            return cb(false, 'Preview host — nothing was written. Add ?live=1 to post for real.');
        }
        var payload = {
            user_id: null,
            craft: row.craft,
            destination: row.destination,
            school: row.school,
            what: row.what,
            // ⛔ A state is a claim about evidence. A school comment is written by
            // somebody who was there; a note on a catalogued place may not be — so it
            // carries a state only when they said they went. refresh-vouches.mjs is
            // what actually keeps either of them out of a grade.
            state: row.been === false ? null : 'stood in it',
            display_name: row.display_name || null,
            email: row.email || null,
            consent_public: !!row.publish,
            wants_circle: !!row.circle,
            status: 'pending'
        };
        client.from('vouches').insert(payload).then(function (res) {
            if (res && res.error) throw res.error;
            if (window.plausible) window.plausible('SchoolComment', { props: { craft: row.craft } });

            // The Circle is a separate act with its own consent, so it is a separate
            // row in the table that has always held it — never a side effect of
            // having commented.
            if (row.circle && row.email) {
                client.from('launch_waitlist').insert({
                    email: row.email,
                    source: 'school-comment:' + row.destination,
                    interests: [{ kind: 'discipline', discipline: row.craft }]
                }).then(function () {}, function () {});
            }
            cb(true, 'Thank you — that is exactly the kind of thing this map is missing. ' +
                     'Nothing goes on the page until Arnaud has read it himself, and he reads every one.');
        }, function (e) {
            var m = (e && (e.message || e.details)) || '';
            cb(false, /duplicate|unique/i.test(m)
                ? 'You have already written about this school. Write to Arnaud directly if there is more to say.'
                : 'That did not save. Try again, or write to <a href="mailto:arnaudcallier@pm.me" ' +
                  'style="color:var(--sea)">arnaudcallier@pm.me</a> and he will add it by hand.');
        });
    }

    // ── what is already approved ─────────────────────────────────────────────
    // The SELECT policy is what guarantees these are approved and consented; this
    // only has to draw them. If it returns nothing, the page is exactly as it was.
    function reload(dest) {
        var client = sb();
        if (!client) return;
        client.from('vouches')
            .select('school,what,display_name,trade,visited_on,created_at')
            .eq('destination', dest)
            .then(function (res) {
                if (!res || res.error || !res.data) return;
                var by = {};
                res.data.forEach(function (r) {
                    if (!r.school) return;
                    (by[r.school] = by[r.school] || []).push(r);
                });
                document.querySelectorAll('li[data-school]').forEach(function (li) {
                    var rows = by[li.getAttribute('data-school')];
                    li.querySelectorAll('.sn-note').forEach(function (n) { n.remove(); });
                    if (!rows || !rows.length) return;
                    var frag = document.createDocumentFragment();
                    rows.forEach(function (r) {
                        var when = r.visited_on || r.created_at || '';
                        var d = when ? new Date(when) : null;
                        var stamp = d && !isNaN(d) ? d.toLocaleDateString('en-GB',
                            { month: 'long', year: 'numeric' }) : '';
                        var who = [r.display_name, r.trade].filter(Boolean).join(', ');
                        var el = document.createElement('div');
                        el.className = 'sn-note';
                        el.innerHTML = '<q>' + esc(r.what) + '</q>' +
                            (who || stamp
                                ? '<span class="sn-by">— ' + esc(who || 'someone who went') +
                                  (stamp ? ' · ' + esc(stamp) : '') + '</span>'
                                : '');
                        frag.appendChild(el);
                    });
                    var btn = li.querySelector('.sn-open');
                    if (btn) li.insertBefore(frag, btn); else li.appendChild(frag);
                });
            }, function () { /* a comment that will not load leaves the page honest */ });
    }

    function boot() {
        var lis = document.querySelectorAll('li[data-school]');
        var also = document.querySelectorAll('li[data-also]');
        if (!lis.length && !also.length) return;
        css();
        // The catalogued places need no supabase round-trip: nothing is published back
        // to them, so the boxes are wired and the function returns before the wait loop.
        Array.prototype.forEach.call(also, wirePlace);
        if (!lis.length) return;
        Array.prototype.forEach.call(lis, wire);
        var first = lis[0];
        var craft = first.getAttribute('data-craft'), dest = first.getAttribute('data-dest');
        // supabase-config takes a moment; the buttons work without it, the quotes do not
        var tries = 0;
        (function wait() {
            if (sb()) return reload(dest);
            if (window.supabaseError || tries++ > 100) return;
            setTimeout(wait, 50);
        })();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
