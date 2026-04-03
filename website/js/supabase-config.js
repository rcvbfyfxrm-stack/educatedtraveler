// Supabase Configuration

const SUPABASE_URL = 'https://exaehwaqwcledemwpluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YWVod2Fxd2NsZWRlbXdwbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA1MjIsImV4cCI6MjA4NTA5NjUyMn0.vY4Rtio2RNQ2eCYxaYy1M_PGaBTbRPRd_nrqe-HGXlQ';

// Track connection state globally
window.supabaseReady = false;
window.supabaseError = false;

// Initialize Supabase client (wait for SDK, with timeout)
function initSupabase(attempt) {
    attempt = attempt || 0;
    var MAX_ATTEMPTS = 100; // ~5 seconds at 50ms intervals

    if (window.supabase) {
        try {
            var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    var authPages = ['/dashboard', '/profile', '/instructor-dashboard', '/join'];
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
