// Experience action handlers — dual CTA per course.
//
// Two declarative hooks any experience page can opt into:
//
//   <button data-et-interested
//           data-experience="Sushi Mastery — Tokyo"
//           data-cohort="September 21 – October 30, 2026">I'm interested</button>
//
//   <button data-et-join
//           data-experience="Sushi Mastery — Tokyo"
//           data-cohort="Full Program — Sep 21 – Oct 30, 2026"
//           data-price-usd="7800"
//           data-instructor-name="Hiroko Ishii"
//           data-instructor-email="">Join the course</button>
//
// "Interested" records the lead silently — NEVER opens an email client.
//   • signed-in: write to experience_interests via window.db.expressInterest
//   • not signed-in: redirect to /community.html with ?interest=<experience>
//     so the existing waitlist form captures them.
// "Join" opens a small modal asking name/email, then redirects to PayPal
// (_xclick) which collects payment. PayPal returns the visitor to
// /enrollment-success.html — and that page is what fires the reservation
// email to arnaudcallier@pm.me with the instructor in CC. No email is sent
// until payment is actually confirmed.
//
// Static-site safe — no server calls required.

(function () {
    'use strict';

    var PLATFORM_EMAIL = 'arnaudcallier@pm.me';
    var PAYPAL_BUSINESS_EMAIL = 'arnaud.callier@outlook.com';
    // To test the real PayPal flow with fake money, paste your sandbox
    // business email here (developer.paypal.com → Sandbox → Accounts).
    var PAYPAL_SANDBOX_BUSINESS_EMAIL = '';
    var PAYPAL_CURRENCY = 'USD';

    // Test mode is opt-in via URL param: ?et_test=dry skips PayPal entirely
    // and jumps to the success page (best for verifying email/UX); ?et_test=
    // sandbox routes the click to sandbox.paypal.com (requires a sandbox
    // business email above + a sandbox buyer at developer.paypal.com).
    function testMode() {
        try {
            var v = new URLSearchParams(window.location.search).get('et_test');
            if (v === 'dry' || v === 'sandbox') return v;
        } catch (e) {}
        try { return sessionStorage.getItem('et_test_mode') || null; } catch (e) { return null; }
    }
    // Persist the test mode across the redirect so the success page can
    // surface "Test mode" instead of looking like a real receipt.
    (function persistMode() {
        var m = testMode();
        if (m) { try { sessionStorage.setItem('et_test_mode', m); } catch (e) {} }
    })();

    function encode(v) { return encodeURIComponent(v == null ? '' : String(v)); }

    function slugify(s) {
        return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
    }

    async function handleInterested(btn) {
        var exp = btn.dataset.experience || document.title || 'EducatedTraveler course';
        var adventureId = btn.dataset.adventureId || slugify(exp);

        try {
            var user = window.auth && window.auth.getCurrentUser ? window.auth.getCurrentUser() : null;
            if (user && window.db && window.db.expressInterest) {
                btn.disabled = true;
                btn.textContent = 'Saving…';
                await window.db.expressInterest(user.id, adventureId, exp);
                btn.textContent = "You're on the list";
                btn.style.opacity = '0.7';
                btn.style.cursor = 'default';
                return;
            }
        } catch (e) { /* fall through to redirect */ }

        // Not signed in: stash the interest and send them to the easy account.
        // auth.js:migratePendingInterest writes it the moment they land signed in,
        // and /dashboard shows it under "Classes I'm interested in".
        try {
            localStorage.setItem('et_pending_interest', JSON.stringify({ adventureId: adventureId, adventureName: exp }));
        } catch (e) {}
        window.location.href = '/join?return=' + encodeURIComponent('/dashboard');
    }

    function buildPayPalUrl(opts) {
        // PayPal classic "Buy Now" hosted payment URL — funds go directly to
        // PAYPAL_BUSINESS_EMAIL. No Connect / instructor onboarding needed.
        var mode = testMode();
        var host = mode === 'sandbox'
            ? 'https://www.sandbox.paypal.com'
            : 'https://www.paypal.com';
        var business = mode === 'sandbox' && PAYPAL_SANDBOX_BUSINESS_EMAIL
            ? PAYPAL_SANDBOX_BUSINESS_EMAIL
            : PAYPAL_BUSINESS_EMAIL;
        var base = host + '/cgi-bin/webscr';
        var params = [
            'cmd=_xclick',
            'business=' + encode(business),
            'item_name=' + encode(opts.itemName),
            'amount=' + encode(opts.amount),
            'currency_code=' + encode(opts.currency || PAYPAL_CURRENCY),
            'no_shipping=1',
            'no_note=0',
            'cn=' + encode('Notes for your instructor'),
            'custom=' + encode(opts.custom || ''),
            'return=' + encode(opts.returnUrl),
            'cancel_return=' + encode(opts.cancelUrl)
        ];
        return base + '?' + params.join('&');
    }

    function buildReservationMailto(form) {
        var subject = '[RESERVATION] ' + form.experience + ' — ' + form.studentName;
        var lines = [
            'Hi Arnaud (and ' + (form.instructorName || 'instructor') + ' in CC),',
            '',
            'I just opened the PayPal payment for the course below. Please confirm my spot in the cohort:',
            '',
            'Course: ' + form.experience,
            'Cohort / dates: ' + (form.cohort || '—'),
            'Price (USD): ' + form.amount,
            '',
            'Student: ' + form.studentName,
            'Email: ' + form.studentEmail,
            form.studentPhone ? 'Phone / WhatsApp: ' + form.studentPhone : '',
            '',
            'Notes:',
            form.notes || '(none)',
            '',
            '— Sent from the EducatedTraveler course page'
        ].filter(Boolean);
        var url = 'mailto:' + PLATFORM_EMAIL;
        if (form.instructorEmail) url += '?cc=' + encode(form.instructorEmail) + '&';
        else url += '?';
        url += 'subject=' + encode(subject) + '&body=' + encode(lines.join('\n'));
        return url;
    }

    // ── Modal ────────────────────────────────────────────────────────────
    async function openJoinModal(btn) {
        var experience = btn.dataset.experience || document.title || 'EducatedTraveler course';
        var cohort = btn.dataset.cohort || '';
        var amount = (btn.dataset.priceUsd || '').replace(/[^0-9.]/g, '');
        var instructorName = btn.dataset.instructorName || '';
        var instructorEmail = btn.dataset.instructorEmail || '';
        // When present, this class is a real published cohort → route booking
        // through the server-side checkout (records the enrollment, supports
        // deposits + instructor confirmation) instead of PayPal _xclick.
        var cohortId = btn.dataset.cohortId || '';

        // Detect existing account + fetch profile so we can offer the
        // one-click path or prefill the form.
        var user = null, profile = null;
        try {
            user = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser();
        } catch (e) {}
        if (user && window.db && window.db.getProfile) {
            try { profile = await window.db.getProfile(user.id); } catch (e) {}
        }

        var prefName = '';
        var prefEmail = (user && user.email) || '';
        var prefPhone = '';
        if (profile) {
            prefName = profile.name || profile.first_name || prefName;
            prefPhone = profile.phone || '';
        }
        if (!prefName && user && user.user_metadata) {
            prefName = user.user_metadata.name || user.user_metadata.full_name || '';
        }

        var existing = document.getElementById('et-join-modal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'et-join-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
        document.body.appendChild(overlay);

        var ctx = {
            experience: experience,
            cohort: cohort,
            cohortId: cohortId,
            amount: amount,
            instructorName: instructorName,
            instructorEmail: instructorEmail,
            user: user,
            profile: profile,
            prefName: prefName,
            prefEmail: prefEmail,
            prefPhone: prefPhone,
            _originBtn: btn
        };

        function close() { overlay.remove(); }
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        // Pick the right starting state.
        if (user && prefName && prefEmail) {
            renderFastPath(overlay, ctx, close);
        } else if (user) {
            renderGuestForm(overlay, ctx, close, /*signedIn*/ true);
        } else {
            renderAccountChoice(overlay, ctx, close);
        }
    }

    function modalHeaderHtml(ctx, subtitle) {
        return '<button id="et-join-close" aria-label="Close" style="float:right;background:none;border:none;color:rgba(255,255,255,0.5);font-size:24px;cursor:pointer;line-height:1;">×</button>' +
            '<p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 6px 0;">' + escapeHtml(subtitle || 'Reserve your spot') + '</p>' +
            '<h3 style="font-size:22px;font-weight:300;margin:0 0 4px 0;">' + escapeHtml(ctx.experience) + '</h3>' +
            (ctx.cohort ? '<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 14px 0;">' + escapeHtml(ctx.cohort) + '</p>' : '<div style="height:10px;"></div>') +
            (ctx.amount ? '<p style="color:#06B6D4;font-size:15px;margin:0 0 18px 0;">$' + escapeHtml(ctx.amount) + ' USD</p>' : '');
    }

    function renderAccountChoice(overlay, ctx, close) {
        overlay.innerHTML =
            '<div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:30px;max-width:480px;width:100%;color:#fff;max-height:90vh;overflow-y:auto;">' +
                modalHeaderHtml(ctx, 'Reserve your spot') +
                '<p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 18px 0;">Have you booked or joined the community before?</p>' +
                '<div style="display:flex;flex-direction:column;gap:10px;">' +
                    '<button id="et-have-account" style="background:linear-gradient(135deg,#0066B1,#3B8DD4);border:none;color:#fff;padding:14px 22px;border-radius:50px;font-size:14px;font-weight:500;cursor:pointer;">Yes — sign in (fastest)</button>' +
                    '<button id="et-new-account" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:14px 22px;border-radius:50px;font-size:14px;font-weight:500;cursor:pointer;">No — continue as guest</button>' +
                    '<button id="et-join-cancel" style="background:transparent;border:none;color:rgba(255,255,255,0.4);padding:8px;border-radius:50px;font-size:12px;cursor:pointer;">Cancel</button>' +
                '</div>' +
                '<p style="color:rgba(255,255,255,0.3);font-size:11px;line-height:1.6;margin:18px 0 0 0;">Signing in lets us prefill your name, email and phone — and pulls up any past cohort details automatically.</p>' +
            '</div>';
        overlay.querySelector('#et-join-close').addEventListener('click', close);
        overlay.querySelector('#et-join-cancel').addEventListener('click', close);
        overlay.querySelector('#et-have-account').addEventListener('click', function () { renderSignIn(overlay, ctx, close); });
        overlay.querySelector('#et-new-account').addEventListener('click', function () { renderGuestForm(overlay, ctx, close, false); });
    }

    function renderSignIn(overlay, ctx, close) {
        overlay.innerHTML =
            '<div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:30px;max-width:480px;width:100%;color:#fff;max-height:90vh;overflow-y:auto;">' +
                modalHeaderHtml(ctx, 'Sign in to reserve') +
                '<form id="et-signin-form">' +
                    '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Email</label>' +
                    '<input id="et-signin-email" type="email" required placeholder="you@example.com" ' + inputStyle() + '>' +
                    '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:14px 0 6px 0;">Password</label>' +
                    '<input id="et-signin-password" type="password" placeholder="Your password" ' + inputStyle() + '>' +
                    '<button id="et-signin-submit" type="submit" style="margin-top:18px;width:100%;background:linear-gradient(135deg,#0066B1,#3B8DD4);border:none;color:#fff;padding:14px 22px;border-radius:50px;font-size:14px;font-weight:500;cursor:pointer;">Sign in &amp; continue</button>' +
                '</form>' +
                '<div style="text-align:center;margin-top:14px;">' +
                    '<button id="et-magic" style="background:none;border:none;color:#3B8DD4;font-size:12px;text-decoration:underline;cursor:pointer;">Email me a sign-in link instead</button>' +
                '</div>' +
                '<p id="et-signin-msg" style="font-size:12px;color:#ef4444;margin:10px 0 0 0;min-height:18px;"></p>' +
                '<div style="display:flex;gap:14px;justify-content:space-between;margin-top:14px;">' +
                    '<button id="et-back" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:12px;cursor:pointer;">← Back</button>' +
                    '<button id="et-guest" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:12px;cursor:pointer;">Continue as guest instead</button>' +
                '</div>' +
            '</div>';
        overlay.querySelector('#et-join-close').addEventListener('click', close);
        overlay.querySelector('#et-back').addEventListener('click', function () { renderAccountChoice(overlay, ctx, close); });
        overlay.querySelector('#et-guest').addEventListener('click', function () { renderGuestForm(overlay, ctx, close, false); });

        overlay.querySelector('#et-signin-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var email = overlay.querySelector('#et-signin-email').value.trim();
            var pwd = overlay.querySelector('#et-signin-password').value;
            var msg = overlay.querySelector('#et-signin-msg');
            var sub = overlay.querySelector('#et-signin-submit');
            if (!email || !pwd) { msg.textContent = 'Email and password required.'; return; }
            sub.disabled = true; sub.textContent = 'Signing in…'; msg.textContent = '';
            try {
                var res = await window.auth.signInWithPassword(email, pwd);
                if (res && res.error) throw res.error;
                // Re-bootstrap modal with fresh user/profile data.
                close();
                openJoinModal(originBtnHack(ctx));
            } catch (err) {
                msg.textContent = (err && err.message) || 'Sign-in failed. Try the magic-link option below.';
                sub.disabled = false; sub.textContent = 'Sign in & continue';
            }
        });

        overlay.querySelector('#et-magic').addEventListener('click', async function () {
            var email = overlay.querySelector('#et-signin-email').value.trim();
            var msg = overlay.querySelector('#et-signin-msg');
            if (!email) { msg.style.color = '#ef4444'; msg.textContent = 'Enter your email first.'; return; }
            try {
                var sb = window.supabaseClient;
                var ret = encodeURIComponent(window.location.pathname + window.location.search);
                var { error } = await sb.auth.signInWithOtp({
                    email: email,
                    options: { emailRedirectTo: window.location.origin + '/auth-callback.html?return=' + ret }
                });
                if (error) throw error;
                msg.style.color = '#10B981';
                msg.textContent = 'Check your email — open the link, then click "Join the course" again.';
            } catch (err) {
                msg.style.color = '#ef4444';
                msg.textContent = (err && err.message) || 'Could not send link.';
            }
        });
    }

    // Re-creates a synthetic button carrying the original data-* attributes
    // so openJoinModal can re-enter after a successful sign-in.
    function originBtnHack(ctx) {
        var b = document.createElement('button');
        b.dataset.experience = ctx.experience;
        b.dataset.cohort = ctx.cohort;
        if (ctx.cohortId) b.dataset.cohortId = ctx.cohortId;
        b.dataset.priceUsd = ctx.amount;
        b.dataset.instructorName = ctx.instructorName;
        b.dataset.instructorEmail = ctx.instructorEmail;
        return b;
    }

    function getAddons(btn) {
        // Per-button override first, then per-page global, then nothing.
        try {
            if (btn && btn.dataset && btn.dataset.addons) return JSON.parse(btn.dataset.addons);
        } catch (e) {}
        if (Array.isArray(window.ET_PAGE_ADDONS)) return window.ET_PAGE_ADDONS;
        return [];
    }

    function renderAddonsBlock(addons) {
        if (!addons || !addons.length) return '';
        var rows = addons.map(function (a, i) {
            var label = typeof a === 'string' ? a : (a.name || '');
            var desc  = typeof a === 'string' ? '' : (a.desc || '');
            var price = typeof a === 'string' ? '' : (a.price || a.priceUSD ? '$' + (a.price || a.priceUSD) : '');
            return '<label style="display:flex;gap:10px;padding:9px 10px;border-radius:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);margin-bottom:6px;cursor:pointer;">' +
                '<input type="checkbox" class="et-addon" data-label="' + escapeHtml(label) + '" style="margin-top:3px;flex-shrink:0;">' +
                '<span style="flex:1;min-width:0;">' +
                    '<span style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">' +
                        '<span style="font-size:13px;color:rgba(255,255,255,0.85);">' + escapeHtml(label) + '</span>' +
                        (price ? '<span style="font-size:11px;color:#fbbf24;font-family:Courier New,monospace;">' + escapeHtml(price) + '</span>' : '') +
                    '</span>' +
                    (desc ? '<span style="display:block;font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;line-height:1.4;">' + escapeHtml(desc) + '</span>' : '') +
                '</span>' +
            '</label>';
        }).join('');
        return '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:18px 0 8px 0;">Add-ons you might want</label>' +
            '<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0 0 10px 0;line-height:1.5;">Tick anything that interests you. These aren\'t locked in yet — we use them to plan and we\'ll quote you separately.</p>' +
            '<div id="et-addons-list">' + rows + '</div>';
    }

    function collectAddons(overlay) {
        var picks = [];
        overlay.querySelectorAll('.et-addon').forEach(function (cb) {
            if (cb.checked) picks.push(cb.dataset.label);
        });
        return picks;
    }

    function renderFastPath(overlay, ctx, close) {
        var addons = getAddons(ctx._originBtn);
        overlay.innerHTML =
            '<div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:30px;max-width:480px;width:100%;color:#fff;max-height:90vh;overflow-y:auto;">' +
                modalHeaderHtml(ctx, 'Welcome back, ' + (ctx.prefName.split(/\s+/)[0] || 'friend')) +
                '<div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.18);border-radius:12px;padding:14px 16px;margin-bottom:18px;">' +
                    '<p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#10B981;margin:0 0 8px 0;">Account detected</p>' +
                    '<p style="font-size:13px;color:#fff;margin:0;">' + escapeHtml(ctx.prefName) + '</p>' +
                    '<p style="font-size:12px;color:rgba(255,255,255,0.55);margin:2px 0 0 0;">' + escapeHtml(ctx.prefEmail) + (ctx.prefPhone ? ' · ' + escapeHtml(ctx.prefPhone) : '') + '</p>' +
                    '<button id="et-edit" style="margin-top:8px;background:none;border:none;color:#3B8DD4;font-size:11px;text-decoration:underline;cursor:pointer;padding:0;">Use different details</button>' +
                '</div>' +

                renderAddonsBlock(addons) +

                '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:18px 0 6px 0;">Notes for the instructor (optional)</label>' +
                '<textarea id="et-join-notes" rows="3" placeholder="Diet, level, anything we should know…" style="resize:vertical;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;width:100%;color:#fff;font-size:13px;font-family:inherit;box-sizing:border-box;"></textarea>' +

                '<div style="margin-top:22px;display:flex;gap:10px;flex-direction:column;">' +
                    '<button id="et-join-go" style="background:linear-gradient(135deg,#0066B1,#3B8DD4);border:none;color:#fff;padding:14px 22px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.04em;cursor:pointer;">Continue to PayPal →</button>' +
                    '<button id="et-join-cancel" style="background:transparent;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);padding:10px 22px;border-radius:50px;font-size:12px;cursor:pointer;">Cancel</button>' +
                '</div>' +

                '<p style="color:rgba(255,255,255,0.3);font-size:11px;line-height:1.6;margin:18px 0 0 0;">You will be redirected to PayPal. Once payment confirms we email EducatedTraveler and ' + escapeHtml(ctx.instructorName || 'the instructor') + ' automatically to reserve your spot.</p>' +
            '</div>';
        overlay.querySelector('#et-join-close').addEventListener('click', close);
        overlay.querySelector('#et-join-cancel').addEventListener('click', close);
        overlay.querySelector('#et-edit').addEventListener('click', function () { renderGuestForm(overlay, ctx, close, true); });
        overlay.querySelector('#et-join-go').addEventListener('click', function () {
            submitJoin(overlay, ctx, {
                name: ctx.prefName,
                email: ctx.prefEmail,
                phone: ctx.prefPhone,
                notes: overlay.querySelector('#et-join-notes').value.trim(),
                addons: collectAddons(overlay)
            });
        });
    }

    function renderGuestForm(overlay, ctx, close, signedIn) {
        var title = signedIn
            ? 'Confirm details (' + (ctx.prefEmail || 'signed in') + ')'
            : 'Reserve your spot';
        overlay.innerHTML =
            '<div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:30px;max-width:480px;width:100%;color:#fff;max-height:90vh;overflow-y:auto;">' +
                modalHeaderHtml(ctx, title) +

                '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Your name</label>' +
                '<input id="et-join-name" type="text" value="' + escapeHtml(ctx.prefName) + '" placeholder="Full name" ' + inputStyle() + '>' +

                '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:14px 0 6px 0;">Your email</label>' +
                '<input id="et-join-email" type="email" value="' + escapeHtml(ctx.prefEmail) + '" placeholder="you@example.com" ' + inputStyle() + '>' +

                '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:14px 0 6px 0;">Phone or WhatsApp (optional)</label>' +
                '<input id="et-join-phone" type="text" value="' + escapeHtml(ctx.prefPhone) + '" placeholder="+33 6 …" ' + inputStyle() + '>' +

                renderAddonsBlock(getAddons(ctx._originBtn)) +

                '<label style="display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:14px 0 6px 0;">Notes for the instructor (optional)</label>' +
                '<textarea id="et-join-notes" rows="3" placeholder="Diet, level, anything we should know…" style="resize:vertical;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;width:100%;color:#fff;font-size:13px;font-family:inherit;box-sizing:border-box;"></textarea>' +

                '<div style="margin-top:22px;display:flex;gap:10px;flex-direction:column;">' +
                    '<button id="et-join-go" style="background:linear-gradient(135deg,#0066B1,#3B8DD4);border:none;color:#fff;padding:14px 22px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.04em;cursor:pointer;">Continue to PayPal →</button>' +
                    '<button id="et-join-cancel" style="background:transparent;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);padding:10px 22px;border-radius:50px;font-size:12px;cursor:pointer;">Cancel</button>' +
                '</div>' +

                (signedIn ? '' :
                    '<p style="text-align:center;margin:14px 0 0 0;"><button id="et-back-choice" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:11px;text-decoration:underline;cursor:pointer;">← I do have an account — let me sign in</button></p>') +

                '<p style="color:rgba(255,255,255,0.3);font-size:11px;line-height:1.6;margin:18px 0 0 0;">You will be redirected to PayPal. Nothing is emailed yet — once payment confirms, we email EducatedTraveler and ' + escapeHtml(ctx.instructorName || 'the instructor') + ' to reserve your spot.</p>' +
            '</div>';
        overlay.querySelector('#et-join-close').addEventListener('click', close);
        overlay.querySelector('#et-join-cancel').addEventListener('click', close);
        var back = overlay.querySelector('#et-back-choice');
        if (back) back.addEventListener('click', function () { renderAccountChoice(overlay, ctx, close); });
        overlay.querySelector('#et-join-go').addEventListener('click', function () {
            submitJoin(overlay, ctx, {
                name: overlay.querySelector('#et-join-name').value.trim(),
                email: overlay.querySelector('#et-join-email').value.trim(),
                phone: overlay.querySelector('#et-join-phone').value.trim(),
                notes: overlay.querySelector('#et-join-notes').value.trim(),
                addons: collectAddons(overlay)
            });
        });
    }

    function submitJoin(overlay, ctx, form) {
        var name = form.name, email = form.email, phone = form.phone, notes = form.notes;
        var addons = form.addons || [];

        if (!name || !email) {
            alert('Please enter your name and email so we can confirm your spot.');
            return;
        }

        // ── Server-side checkout (real cohort) ──────────────────────────────
        // Requires an account so we can record the enrollment + show it on the
        // dashboard. Stash the notes/add-ons for the checkout to attach, then
        // hand off to the Smart-Buttons page (deposit / full + confirmation).
        if (ctx.cohortId) {
            var signedIn = null;
            try { signedIn = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser(); } catch (e) {}
            try {
                sessionStorage.setItem('et_pending_booking', JSON.stringify({
                    cohortId: ctx.cohortId, notes: notes, addons: addons, phone: phone, ts: Date.now()
                }));
            } catch (e) {}
            // Best-effort: save phone to the profile if we have one.
            if (signedIn && phone && window.db && window.db.updateProfile) {
                try { window.db.updateProfile(signedIn.id, { phone: phone }); } catch (e) {}
            }
            var dest = '/paypal-checkout.html?cohort=' + encodeURIComponent(ctx.cohortId);
            if (!signedIn) {
                // Send through sign-in, returning straight to checkout.
                window.location.href = '/join.html?return=' + encodeURIComponent(dest);
            } else {
                window.location.href = dest;
            }
            return;
        }

        // ── Legacy hosted-button path (no cohort mapped yet) ────────────────
        if (!ctx.amount || Number(ctx.amount) <= 0) {
            alert('This course does not yet have a fixed price. Use "I am interested" — we will quote you directly.');
            return;
        }

        var reservation = {
            experience: ctx.experience,
            cohort: ctx.cohort,
            amount: ctx.amount,
            studentName: name,
            studentEmail: email,
            studentPhone: phone,
            notes: notes,
            addons: addons,
            instructorName: ctx.instructorName,
            instructorEmail: ctx.instructorEmail,
            paypalBusiness: PAYPAL_BUSINESS_EMAIL,
            ts: Date.now()
        };
        try {
            sessionStorage.setItem('et_pending_reservation', JSON.stringify(reservation));
            localStorage.setItem('et_pending_reservation', JSON.stringify(reservation));
        } catch (e) {}

        var custom = JSON.stringify({
            e: ctx.experience.slice(0, 60),
            n: name.slice(0, 40),
            m: email.slice(0, 60)
        }).slice(0, 250);

        var mode = testMode();

        if (mode === 'dry') {
            window.location.href = '/enrollment-success.html?from=paypal&et_test=dry';
            return;
        }

        var paypalUrl = buildPayPalUrl({
            itemName: (mode === 'sandbox' ? '[SANDBOX] ' : '') + ctx.experience + (ctx.cohort ? ' — ' + ctx.cohort : ''),
            amount: ctx.amount,
            custom: custom,
            returnUrl: window.location.origin + '/enrollment-success.html?from=paypal' + (mode === 'sandbox' ? '&et_test=sandbox' : ''),
            cancelUrl: window.location.origin + '/enrollment-cancelled.html'
        });

        window.location.href = paypalUrl;
    }

    function inputStyle() {
        return 'style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 14px;width:100%;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"';
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    // ── Bind ─────────────────────────────────────────────────────────────
    function bind() {
        document.querySelectorAll('[data-et-interested]').forEach(function (btn) {
            if (btn.dataset.etBound) return;
            btn.dataset.etBound = '1';
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                handleInterested(btn);
            });
        });

        document.querySelectorAll('[data-et-join]').forEach(function (btn) {
            if (btn.dataset.etBound) return;
            btn.dataset.etBound = '1';
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openJoinModal(btn);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    // Re-bind when offerings.html re-renders the detail panel.
    new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });

    // Floating badge so Arnaud never confuses test mode for a real booking.
    function showTestBadge() {
        var mode = testMode();
        if (!mode || document.getElementById('et-test-badge')) return;
        var badge = document.createElement('div');
        badge.id = 'et-test-badge';
        var label = mode === 'dry' ? 'TEST · DRY RUN (no PayPal)' : 'TEST · PAYPAL SANDBOX';
        badge.textContent = label;
        badge.style.cssText = 'position:fixed;top:12px;left:12px;z-index:9999;background:#facc15;color:#000;font:600 11px Inter,system-ui,sans-serif;letter-spacing:0.15em;padding:6px 12px;border-radius:50px;box-shadow:0 6px 18px rgba(0,0,0,0.3);';
        document.body.appendChild(badge);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showTestBadge);
    else showTestBadge();

    window.etExperienceActions = { bind: bind, openJoinModal: openJoinModal };
})();
