/* vouch.js — a chef who stood in the room signs for it, from their own account.
 *
 * Rule 10 of the Standard wants a name, a trade and a date on every check. Until
 * this existed the only way to add one was to hand-edit data/repertoire.js, so one
 * place in 384 carried a check. This is the door for the people who actually went.
 *
 * What this file may NOT do, and the reasons are not stylistic:
 *   - It never publishes. The row lands `pending`; the RLS WITH CHECK makes any
 *     other status impossible to insert, so self-approval is not a policy we rely
 *     on remembering.
 *   - It never says Arnaud has read anything. He will read it; at submit time he
 *     has not. Tense is the whole tell (the automated-mail law).
 *   - Consent to publish is a separate, explicit act from submitting. Telling us
 *     what a week was is not agreeing to appear on a public page under your name.
 */
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };
    var esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    };

    var TRADES = ['Yacht chef', 'Private chef', 'Chef de partie', 'Head chef', 'Sous chef',
                  'Pastry chef', 'Chalet chef', 'Estate chef', 'Freelance chef', 'Other'];

    function crafts() {
        var ix = window.ET_ATLAS_INDEX;
        return (ix && ix.crafts) ? ix.crafts.slice().sort(function (a, b) {
            return a.name.localeCompare(b.name);
        }) : [];
    }

    function fillPlaces(craftId) {
        var sel = $('v-place');
        var c = crafts().filter(function (x) { return x.id === craftId; })[0];
        var ds = (c && c.dests) || [];
        sel.innerHTML = ds.length
            ? ds.map(function (d) {
                return '<option value="' + esc(d.id) + '">' + esc(d.place) + ', ' + esc(d.country) + '</option>';
              }).join('')
            : '<option value="">— no places listed for this craft —</option>';
        sel.disabled = !ds.length;
    }

    function say(msg, tone) {
        var el = $('v-msg');
        if (!el) return;
        el.textContent = msg;
        el.style.color = tone === 'bad' ? 'var(--ember)' : 'var(--muted)';
        el.style.display = msg ? 'block' : 'none';
    }

    function renderMine(rows) {
        var box = $('v-mine');
        if (!box) return;
        if (!rows || !rows.length) { box.innerHTML = ''; return; }
        var label = { pending: 'with Arnaud', approved: 'on the Atlas', declined: 'not used' };
        box.innerHTML = '<p class="note" style="margin-bottom:8px">What you have signed so far</p>'
            + rows.map(function (r) {
                return '<p class="note" style="margin:0 0 6px">'
                     + esc(r.destination.replace(/--/g, ' &middot; ').replace(/-/g, ' '))
                     + ' &middot; ' + esc(r.visited_on)
                     + ' &middot; <b>' + esc(label[r.status] || r.status) + '</b></p>';
            }).join('');
    }

    async function loadMine(sb, uid) {
        try {
            var r = await sb.from('vouches')
                .select('destination,visited_on,status')
                .eq('user_id', uid).order('created_at', { ascending: false });
            renderMine(r && r.data);
        } catch (e) { /* the form still works without the history */ }
    }

    async function submit(sb, uid, ev) {
        ev.preventDefault();
        var btn = $('v-send');
        var what = ($('v-what').value || '').trim();
        var name = ($('v-name').value || '').trim();
        if (name.length < 2) { return say('A name to put on it, please — first name and an initial is enough.', 'bad'); }
        if (what.length < 40) { return say('Say a little more — what did you actually see in the room?', 'bad'); }
        if (!$('v-consent').checked) {
            return say('We cannot put it on the page without your say-so. Tick the box, or write to Arnaud instead.', 'bad');
        }
        if (window.etCanWrite && !window.etCanWrite()) {
            return say('Preview host — nothing was written. Add ?live=1 to write for real.', 'bad');
        }
        btn.disabled = true; say('Sending…');
        var row = {
            user_id: uid,
            craft: $('v-craft').value,
            destination: $('v-place').value,
            state: $('v-state').value,
            display_name: name,
            trade: $('v-trade').value,
            visited_on: $('v-when').value,
            route: $('v-route').value,
            what: what,
            consent_public: true
        };
        try {
            var r = await sb.from('vouches').insert(row);
            if (r && r.error) throw r.error;
            $('v-form').style.display = 'none';
            // Careful with tense: he WILL read it. At this instant he has not.
            say('Signed, and saved. Nothing goes on the Atlas until Arnaud has read it himself — '
              + 'he reads every one, and that part is not automatic.');
            loadMine(sb, uid);
        } catch (e) {
            btn.disabled = false;
            var m = (e && (e.message || e.details)) || '';
            say(/duplicate|unique/i.test(m)
                ? 'You have already signed for that place. Write to Arnaud if it has changed.'
                : 'That did not save. Try again, or write to Arnaud and he will add it by hand.', 'bad');
        }
    }

    window.etVouchInit = async function (sb, uid) {
        var sec = $('s-vouch');
        if (!sec || !sb || !uid) return;
        var cs = crafts();
        if (!cs.length) return;                       // no Atlas index, no honest picker

        // The table arrives with migration 044, which is applied by hand. Until it
        // exists this door stays shut rather than showing a form that cannot save:
        // a visible control that fails is worse than one that is not there yet.
        try {
            var probe = await sb.from('vouches').select('id').limit(1);
            if (probe && probe.error) return;
        } catch (e) { return; }

        sec.style.display = '';
        $('v-craft').innerHTML = cs.map(function (c) {
            return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
        }).join('');
        $('v-trade').innerHTML = TRADES.map(function (t) {
            return '<option value="' + esc(t) + '">' + esc(t) + '</option>';
        }).join('');
        $('v-when').max = new Date().toISOString().slice(0, 10);
        fillPlaces($('v-craft').value);
        $('v-craft').addEventListener('change', function () { fillPlaces(this.value); });
        $('v-form').addEventListener('submit', function (e) { submit(sb, uid, e); });
        loadMine(sb, uid);
    };
})();
