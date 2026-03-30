// Supabase Configuration

const SUPABASE_URL = 'https://exaehwaqwcledemwpluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YWVod2Fxd2NsZWRlbXdwbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA1MjIsImV4cCI6MjA4NTA5NjUyMn0.vY4Rtio2RNQ2eCYxaYy1M_PGaBTbRPRd_nrqe-HGXlQ';

// Initialize Supabase client (wait for SDK if needed)
function initSupabase() {
    if (window.supabase) {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = client;
        window.SUPABASE_URL = SUPABASE_URL;
    } else {
        setTimeout(initSupabase, 50);
    }
}

initSupabase();
