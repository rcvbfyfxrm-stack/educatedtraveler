// Authentication Module for EducatedTraveler
// Uses Supabase Magic Links (passwordless email authentication)

(function() {
    'use strict';

    const supabase = window.supabaseClient;

    // ========================================
    // AUTH STATE MANAGEMENT
    // ========================================

    let currentUser = null;
    let authStateListeners = [];

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;

        // Notify all listeners
        authStateListeners.forEach(listener => listener(currentUser, event));

        // Update UI
        updateAuthUI();

        // Handle specific events
        if (event === 'SIGNED_IN') {
            handleSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            handleSignOut();
        }
    });

    // ========================================
    // PUBLIC AUTH FUNCTIONS
    // ========================================

    // Send magic link to email
    async function signInWithEmail(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/auth-callback.html'
            }
        });

        if (error) {
            console.error('Sign in error:', error);
            throw error;
        }

        return data;
    }

    // Sign out
    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    // Get current user
    async function getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    // Get current session
    async function getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }

    // Check if user is signed in
    function isSignedIn() {
        return currentUser !== null;
    }

    // Add auth state listener
    function onAuthStateChange(callback) {
        authStateListeners.push(callback);
        // Return unsubscribe function
        return () => {
            authStateListeners = authStateListeners.filter(l => l !== callback);
        };
    }

    // ========================================
    // INTERNAL HANDLERS
    // ========================================

    async function handleSignIn(user) {
        // Create or update profile in database
        await ensureProfile(user);

        // Check for pending quest data and migrate
        await migratePendingData(user.id);

        // Migrate localStorage data if exists
        await migrateLocalStorage(user.id);
    }

    function handleSignOut() {
        currentUser = null;
    }

    async function ensureProfile(user) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existing) {
            // Create new profile
            const name = user.email.split('@')[0];
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                xp: 100,
                level: 1
            });
        }
    }

    async function migratePendingData(userId) {
        const pendingQuest = sessionStorage.getItem('pendingQuest');
        if (!pendingQuest) return;

        try {
            const { questState, matchedAdventures } = JSON.parse(pendingQuest);

            // Save preferences
            if (questState) {
                await supabase.from('user_preferences').upsert({
                    user_id: userId,
                    elements: questState.elements || [],
                    desires: questState.desires || [],
                    time_preference: questState.time,
                    intensity: questState.intensity
                });
            }

            // Save matched adventures
            if (matchedAdventures && matchedAdventures.length) {
                for (const adventure of matchedAdventures) {
                    await supabase.from('saved_adventures').upsert({
                        user_id: userId,
                        adventure_id: adventure.id,
                        adventure_name: adventure.name
                    });
                }
            }

            sessionStorage.removeItem('pendingQuest');
        } catch (e) {
            console.error('Error migrating pending data:', e);
        }
    }

    async function migrateLocalStorage(userId) {
        const STORAGE_KEY = 'educatedtraveler_profile';
        const localProfile = localStorage.getItem(STORAGE_KEY);
        if (!localProfile) return;

        try {
            const profile = JSON.parse(localProfile);

            // Migrate preferences
            if (profile.elements?.length || profile.desires?.length) {
                await supabase.from('user_preferences').upsert({
                    user_id: userId,
                    elements: profile.elements || [],
                    desires: profile.desires || []
                });
            }

            // Migrate badges
            if (profile.badges?.length) {
                for (const badge of profile.badges) {
                    await supabase.from('user_badges').upsert({
                        user_id: userId,
                        badge_key: badge
                    });
                }
            }

            // Migrate saved adventures
            if (profile.adventures?.length) {
                for (const adventureId of profile.adventures) {
                    await supabase.from('saved_adventures').upsert({
                        user_id: userId,
                        adventure_id: adventureId
                    });
                }
            }

            // Update XP if higher than default
            if (profile.xp && profile.xp > 100) {
                await supabase.from('profiles').update({
                    xp: profile.xp,
                    level: Math.floor(profile.xp / 500) + 1
                }).eq('id', userId);
            }

            // Clear localStorage after successful migration
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Error migrating localStorage:', e);
        }
    }

    // ========================================
    // UI FUNCTIONS
    // ========================================

    function updateAuthUI() {
        const signInBtn = document.getElementById('sign-in-btn');
        const dashboardLink = document.getElementById('dashboard-link');
        const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');
        const mobileDashboardLink = document.getElementById('mobile-dashboard-link');

        if (currentUser) {
            // User is signed in - show dashboard link
            if (signInBtn) signInBtn.classList.add('hidden');
            if (dashboardLink) dashboardLink.classList.remove('hidden');
            if (mobileSignInBtn) mobileSignInBtn.classList.add('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
        } else {
            // User is signed out - show sign in button
            if (signInBtn) signInBtn.classList.remove('hidden');
            if (dashboardLink) dashboardLink.classList.add('hidden');
            if (mobileSignInBtn) mobileSignInBtn.classList.remove('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.add('hidden');
        }
    }

    function showSignInModal(prefillEmail = '') {
        // Remove existing modal if any
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.closeAuthModal()"></div>
            <div class="relative glass rounded-2xl p-8 max-w-md w-full">
                <button onclick="window.closeAuthModal()" class="absolute top-4 right-4 text-white/50 hover:text-white p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <div id="auth-form-container">
                    <h3 class="text-2xl font-light mb-2">Sign in</h3>
                    <p class="text-white/50 text-sm mb-6">Enter your email and we'll send you a magic link.</p>

                    <form id="auth-email-form" class="space-y-4">
                        <input
                            type="email"
                            id="auth-email-input"
                            placeholder="you@email.com"
                            value="${prefillEmail}"
                            required
                            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 text-sm"
                        >
                        <button type="submit" id="auth-submit-btn" class="cta-button w-full px-6 py-3 rounded-xl text-sm font-medium">
                            Send Magic Link
                        </button>
                    </form>
                    <p id="auth-error" class="text-red-400 text-xs mt-3 hidden"></p>
                </div>

                <div id="auth-success-container" class="hidden text-center">
                    <div class="text-4xl mb-4">✨</div>
                    <h3 class="text-2xl font-light mb-2">Check your email</h3>
                    <p class="text-white/50 text-sm mb-4">We sent a magic link to <span id="auth-sent-email" class="text-white"></span></p>
                    <p class="text-white/30 text-xs">Click the link in your email to sign in. You can close this window.</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus email input
        const emailInput = document.getElementById('auth-email-input');
        if (emailInput) emailInput.focus();

        // Handle form submission
        const form = document.getElementById('auth-email-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('auth-email-input').value.trim();
            const submitBtn = document.getElementById('auth-submit-btn');
            const errorEl = document.getElementById('auth-error');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            errorEl.classList.add('hidden');

            try {
                await signInWithEmail(email);

                // Show success
                document.getElementById('auth-form-container').classList.add('hidden');
                document.getElementById('auth-success-container').classList.remove('hidden');
                document.getElementById('auth-sent-email').textContent = email;
            } catch (error) {
                errorEl.textContent = error.message || 'Something went wrong. Please try again.';
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Magic Link';
            }
        });
    }

    window.closeAuthModal = function() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.remove();
    };

    // ========================================
    // INITIALIZE
    // ========================================

    // Check initial auth state on page load
    document.addEventListener('DOMContentLoaded', async () => {
        const session = await getSession();
        currentUser = session?.user || null;
        updateAuthUI();

        // Set up sign-in button click handler
        const signInBtn = document.getElementById('sign-in-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => showSignInModal());
        }

        const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');
        if (mobileSignInBtn) {
            mobileSignInBtn.addEventListener('click', () => showSignInModal());
        }
    });

    // ========================================
    // EXPORTS
    // ========================================

    window.auth = {
        signInWithEmail,
        signOut,
        getUser,
        getSession,
        isSignedIn,
        onAuthStateChange,
        showSignInModal,
        getCurrentUser: () => currentUser
    };

})();
