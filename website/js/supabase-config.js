// Supabase Configuration

const SUPABASE_URL = 'https://exaehwaqwcledemwpluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YWVod2Fxd2NsZWRlbXdwbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA1MjIsImV4cCI6MjA4NTA5NjUyMn0.vY4Rtio2RNQ2eCYxaYy1M_PGaBTbRPRd_nrqe-HGXlQ';

// Track connection state globally
window.supabaseReady = false;
window.supabaseError = false;

// ── WRITES ARE GATED ON THE HOSTNAME ─────────────────────────────────────────
// This file builds a PRODUCTION client wherever it loads — a local preview, a
// file:// open, a staging copy. Without a gate, one click while reviewing a page
// writes a real row into launch_waitlist and fires the real welcome email to a
// made-up address. Reads stay open, because reading is how a preview is useful.
// ?live=1 forces genuine writes when you actually mean to test the loop.
window.ET_PROD_HOSTS = ['educatedtraveler.app', 'www.educatedtraveler.app'];
window.etIsProd = function () {
    try {
        if (new URLSearchParams(window.location.search).get('live') === '1') return true;
    } catch (e) { /* no URLSearchParams on a very old browser: fall through */ }
    return window.ET_PROD_HOSTS.indexOf(window.location.hostname) !== -1;
};
window.etCanWrite = function () {
    return window.etIsProd() && !!(window.supabaseClient && window.supabaseClient.from);
};

// Off prod, every mutating call resolves as if it had worked, so the rest of a
// flow stays testable, and says so loudly in the console. A page is free to ask
// window.etCanWrite() and skip the call entirely; this is the backstop for the
// ones that forget, and for every capture surface written from here on.
function installPreviewGuard(client) {
    if (window.etIsProd()) return;
    var PRETEND = function (what) {
        console.warn('[ET preview] ' + what + ' was NOT sent — this is not a production '
                   + 'hostname. Add ?live=1 to the URL to write for real.');
        var out = Promise.resolve({ data: null, error: null, status: 200,
                                    statusText: 'OK (preview — nothing written)' });
        out.select = function () { return out; };      // .insert().select() is common
        out.single = function () { return out; };
        out.maybeSingle = function () { return out; };
        return out;
    };
    var realFrom = client.from.bind(client);
    client.from = function (table) {
        var q = realFrom(table);
        ['insert', 'upsert', 'update', 'delete'].forEach(function (op) {
            if (typeof q[op] !== 'function') return;
            q[op] = function () { return PRETEND(op + ' on "' + table + '"'); };
        });
        return q;
    };
    // AUTH TOO. The banner below says "no email is sent", and until this existed
    // that was false: signInWithOtp is not a `from()` call, so it sailed straight
    // past the guard and Supabase mailed a real sign-in link from localhost. A
    // preview that lies about what it sent is worse than no preview at all.
    if (client.auth) {
        ['signInWithOtp', 'signUp', 'resetPasswordForEmail'].forEach(function (op) {
            if (typeof client.auth[op] !== 'function') return;
            client.auth[op] = function () {
                console.warn('[ET preview] auth.' + op + ' was NOT sent — this is not a '
                           + 'production hostname. Add ?live=1 to the URL to send for real.');
                return Promise.resolve({ data: { user: null, session: null }, error: null });
            };
        });
    }

    if (client.storage && typeof client.storage.from === 'function') {
        var realStorageFrom = client.storage.from.bind(client.storage);
        client.storage.from = function (bucket) {
            var b = realStorageFrom(bucket);
            b.upload = function (path) {
                console.warn('[ET preview] upload to "' + bucket + '/' + path + '" was NOT sent.');
                return Promise.resolve({ data: { path: path }, error: null });
            };
            b.remove = function (paths) {
                console.warn('[ET preview] remove from "' + bucket + '" was NOT sent.');
                return Promise.resolve({ data: [], error: null });
            };
            return b;
        };
    }
    previewBanner();
}

// A console warning is invisible to whoever is actually looking at the page, and
// the person reviewing is exactly who must not be fooled by a fake success.
function previewBanner() {
    function draw() {
        if (document.getElementById('et-preview-bar')) return;
        if (document.getElementById('demo')) return;   // page carries its own
        var b = document.createElement('div');
        b.id = 'et-preview-bar';
        b.textContent = 'PREVIEW — nothing is saved and no email is sent';
        b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;'
            + 'background:rgba(210,138,82,0.16);border-top:1px solid rgba(210,138,82,0.45);'
            + 'color:#d28a52;font:500 10px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;'
            + 'letter-spacing:0.14em;text-transform:uppercase;text-align:center;padding:8px 12px;'
            + 'pointer-events:none;';
        document.body.appendChild(b);
    }
    if (document.body) draw();
    else document.addEventListener('DOMContentLoaded', draw);
}

// Initialize Supabase client (wait for SDK, with timeout)
function initSupabase(attempt) {
    attempt = attempt || 0;
    var MAX_ATTEMPTS = 100; // ~5 seconds at 50ms intervals

    if (window.supabase) {
        try {
            var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            installPreviewGuard(client);        // before anything can reach for it
            window.supabaseClient = client;
            window.SUPABASE_URL = SUPABASE_URL;
            window.supabaseReady = true;
        } catch (err) {
            console.error('Supabase init failed:', err);
            handleSupabaseUnavailable();
        }
    } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(function() { initSupabase(attempt + 1); }, 50);
    } else {
        console.warn('Supabase SDK failed to load after 5s');
        handleSupabaseUnavailable();
    }
}

function handleSupabaseUnavailable() {
    window.supabaseError = true;
    // Show a non-intrusive banner on auth-dependent pages
    var authPages = ['/dashboard', '/profile', '/instructor-dashboard', '/join', '/community', '/admin',
                     '/circle', '/hello', '/portrait', '/you'];
    var path = window.location.pathname.replace('.html', '').replace(/\/$/, '');
    var isAuthPage = authPages.some(function(p) { return path.endsWith(p); });

    if (isAuthPage) {
        var banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 20px;background:rgba(217,119,6,0.15);backdrop-filter:blur(20px);border-bottom:1px solid rgba(217,119,6,0.3);color:rgba(255,255,255,0.9);font-family:Inter,system-ui,sans-serif;font-size:14px;text-align:center;';
        banner.textContent = 'Connection issue — some features may be unavailable. The site still works for browsing.';
        if (document.body) {
            document.body.appendChild(banner);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(banner);
            });
        }
    }
}

initSupabase();
