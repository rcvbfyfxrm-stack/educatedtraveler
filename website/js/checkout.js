// Checkout helpers — wraps Stripe Checkout for cohort enrollment.
// Exposes window.checkout.applyToExperience(adventureId) and applyToCohort(cohortId).
//
// Auto-binds to any element with [data-apply-experience="<adventure_id>"]
// or [data-apply-cohort="<cohort_id>"].

(function() {
    'use strict';

    function waitForDb(cb, attempt) {
        attempt = attempt || 0;
        if (window.db && window.auth) { cb(); return; }
        if (attempt < 120) setTimeout(function() { waitForDb(cb, attempt + 1); }, 50);
    }

    async function getPublishedCohortsForExperience(adventureId) {
        if (!window.supabaseClient) return [];
        const { data, error } = await window.supabaseClient
            .from('cohorts')
            .select('id, title, location, start_date, end_date, price_cents, capacity, status, instructor_id, enrollments(id, status, payment_status)')
            .eq('adventure_id', adventureId)
            .in('status', ['published', 'full'])
            .order('start_date', { ascending: true });
        if (error) {
            console.error('Cohort lookup failed:', error);
            return [];
        }
        return data || [];
    }

    function spotsRemaining(cohort) {
        const taken = (cohort.enrollments || []).filter(e =>
            e.status === 'enrolled' ||
            e.status === 'awaiting_confirmation' ||
            e.payment_status === 'paid' ||
            e.payment_status === 'deposit_paid' ||
            e.payment_status === 'pending'
        ).length;
        return Math.max(0, (cohort.capacity || 0) - taken);
    }

    function fmtRange(start, end) {
        const opts = { month: 'short', day: 'numeric', year: 'numeric' };
        const s = start ? new Date(start).toLocaleDateString('en-US', opts) : '';
        const e = end ? new Date(end).toLocaleDateString('en-US', opts) : '';
        if (s && e) return s + ' — ' + e;
        return s || e || 'Dates TBD';
    }

    async function ensureSignedIn() {
        const user = await window.auth.getUser();
        if (user) return user;
        const ret = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = '/join.html?return=' + ret;
        return null;
    }

    async function applyToCohort(cohortId, btn) {
        const user = await ensureSignedIn();
        if (!user) return;

        const original = btn ? btn.textContent : null;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Opening checkout…';
        }
        try {
            const { url } = await window.db.startCohortCheckout(cohortId);
            window.location.href = url;
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Could not open checkout: ' + err.message + '\n\nFalling back to email.');
            window.location.href = 'mailto:founder@educatedtraveler.app?subject=Enrollment%20Issue';
            if (btn) {
                btn.disabled = false;
                btn.textContent = original;
            }
        }
    }

    async function applyToExperience(adventureId, btn) {
        const user = await ensureSignedIn();
        if (!user) return;

        const original = btn ? btn.textContent : null;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Loading…';
        }

        try {
            const cohorts = (await getPublishedCohortsForExperience(adventureId))
                .filter(c => spotsRemaining(c) > 0);

            if (cohorts.length === 0) {
                // No bookable cohort — fall back to interest signal.
                const adventureName = (window.ET_EXPERIENCES || []).find(e => e.id === adventureId)?.name || adventureId;
                await window.db.expressInterest(user.id, adventureId, adventureName);
                alert('Thanks — no open cohort right now. We\'ve added you to the priority list and will email you when the next one opens.');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = original;
                }
                return;
            }

            if (cohorts.length === 1) {
                return applyToCohort(cohorts[0].id, btn);
            }

            showCohortPicker(cohorts, btn);
        } catch (err) {
            console.error('Apply error:', err);
            alert('Could not load cohorts: ' + err.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = original;
            }
        }
    }

    function showCohortPicker(cohorts, originBtn) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });

        const panel = document.createElement('div');
        panel.style.cssText = 'background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;max-width:480px;width:100%;color:#fff;font-family:Inter,system-ui,sans-serif;max-height:90vh;overflow-y:auto;';

        const close = document.createElement('button');
        close.textContent = '×';
        close.style.cssText = 'float:right;background:none;border:none;color:rgba(255,255,255,0.5);font-size:24px;cursor:pointer;line-height:1;';
        close.onclick = cleanup;
        panel.appendChild(close);

        const title = document.createElement('h3');
        title.textContent = 'Choose your cohort';
        title.style.cssText = 'font-size:20px;font-weight:300;margin:0 0 6px 0;';
        panel.appendChild(title);

        const sub = document.createElement('p');
        sub.textContent = 'Select the start date that works for you.';
        sub.style.cssText = 'color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px 0;';
        panel.appendChild(sub);

        cohorts.forEach(c => {
            const item = document.createElement('button');
            const remaining = spotsRemaining(c);
            item.style.cssText = 'display:block;width:100%;text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:10px;color:#fff;cursor:pointer;transition:all 0.2s;';
            item.onmouseover = () => { item.style.background = 'rgba(255,255,255,0.06)'; };
            item.onmouseout = () => { item.style.background = 'rgba(255,255,255,0.03)'; };
            item.innerHTML =
                '<div style="font-weight:500;font-size:15px;margin-bottom:4px;">' + escapeHtml(c.title) + '</div>' +
                '<div style="color:rgba(255,255,255,0.5);font-size:12px;">' + escapeHtml(fmtRange(c.start_date, c.end_date)) + (c.location ? ' · ' + escapeHtml(c.location) : '') + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                  '<span style="color:rgba(255,255,255,0.7);font-size:13px;">' + (c.price_cents ? '$' + (c.price_cents / 100).toLocaleString() : 'TBD') + '</span>' +
                  '<span style="color:' + (remaining <= 2 ? '#fbbf24' : 'rgba(255,255,255,0.4)') + ';font-size:11px;">' + remaining + ' spot' + (remaining === 1 ? '' : 's') + ' left</span>' +
                '</div>';
            item.onclick = () => {
                cleanup();
                applyToCohort(c.id, originBtn);
            };
            panel.appendChild(item);
        });

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function cleanup() {
            overlay.remove();
            if (originBtn) {
                originBtn.disabled = false;
                originBtn.textContent = originBtn.dataset.originalLabel || originBtn.textContent;
            }
        }
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function bindAutoHandlers() {
        document.querySelectorAll('[data-apply-experience]').forEach(el => {
            if (el.dataset.checkoutBound) return;
            el.dataset.checkoutBound = '1';
            el.dataset.originalLabel = el.textContent;
            el.addEventListener('click', (e) => {
                e.preventDefault();
                applyToExperience(el.dataset.applyExperience, el);
            });
        });
        document.querySelectorAll('[data-apply-cohort]').forEach(el => {
            if (el.dataset.checkoutBound) return;
            el.dataset.checkoutBound = '1';
            el.dataset.originalLabel = el.textContent;
            el.addEventListener('click', (e) => {
                e.preventDefault();
                applyToCohort(el.dataset.applyCohort, el);
            });
        });
    }

    waitForDb(function() {
        window.checkout = {
            applyToExperience,
            applyToCohort,
            getPublishedCohortsForExperience
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindAutoHandlers);
        } else {
            bindAutoHandlers();
        }
    });
})();
