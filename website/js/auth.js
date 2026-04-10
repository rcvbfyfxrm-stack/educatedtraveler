// Authentication Module for EducatedTraveler
// Uses Supabase Magic Links (passwordless email authentication)

(function() {
    'use strict';

    function waitForClient(cb, attempt) {
        attempt = attempt || 0;
        if (window.supabaseClient) { cb(); return; }
        if (window.supabaseError) { console.warn('Auth: Supabase unavailable, skipping init'); return; }
        if (attempt < 120) setTimeout(function() { waitForClient(cb, attempt + 1); }, 50);
    }

    waitForClient(initAuth);

    function initAuth() {
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

    // Send password reset email
    async function resetPassword(email) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth-callback.html?type=recovery'
        });

        if (error) {
            console.error('Reset password error:', error);
            throw error;
        }

        return data;
    }

    // Update password (after reset link clicked)
    async function updatePassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Update password error:', error);
            throw error;
        }

        return data;
    }

    // Sign up with email + password
    async function signUp(email, password, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata
            }
        });

        if (error) {
            console.error('Sign up error:', error);
            throw error;
        }

        return data;
    }

    // Sign in with email + password
    async function signInWithPassword(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
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

        // Auto-claim: if an instructor was pre-created with this email but no user_id, link it
        try {
            const { data: unclaimed } = await supabase
                .from('instructors')
                .select('id, name')
                .eq('email', user.email)
                .is('user_id', null)
                .single();

            if (unclaimed) {
                await supabase
                    .from('instructors')
                    .update({ user_id: user.id })
                    .eq('id', unclaimed.id);

                // Update profile name to match instructor name if profile name is just email prefix
                if (unclaimed.name) {
                    await supabase
                        .from('profiles')
                        .update({ name: unclaimed.name })
                        .eq('id', user.id);
                }

                console.log('Auto-claimed instructor profile:', unclaimed.name);
            }
        } catch (e) {
            // No unclaimed instructor — normal user flow
        }
    }

    async function migratePendingData(userId) {
        const pendingQuest = sessionStorage.getItem('pendingQuest');
        if (!pendingQuest) return;

        try {
            const { questState, matchedAdventures, phone, whatsappOptIn } = JSON.parse(pendingQuest);

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

            // Save phone + WhatsApp opt-in if provided
            if (phone) {
                await supabase.from('profiles').update({
                    phone: phone,
                    whatsapp_opt_in: whatsappOptIn || false,
                    updated_at: new Date().toISOString()
                }).eq('id', userId);
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
        const joinLink = document.getElementById('join-link');
        const mobileJoinLink = document.getElementById('mobile-join-link');
        const dashboardLink = document.getElementById('dashboard-link');
        const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');
        const mobileDashboardLink = document.getElementById('mobile-dashboard-link');

        if (currentUser) {
            if (signInBtn) signInBtn.classList.add('hidden');
            if (joinLink) joinLink.classList.add('hidden');
            if (mobileJoinLink) mobileJoinLink.classList.add('hidden');
            if (dashboardLink) dashboardLink.classList.remove('hidden');
            if (mobileSignInBtn) mobileSignInBtn.classList.add('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
        } else {
            if (signInBtn) signInBtn.classList.remove('hidden');
            if (joinLink) joinLink.classList.remove('hidden');
            if (mobileJoinLink) mobileJoinLink.classList.remove('hidden');
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
            <div class="relative glass rounded-2xl p-8 max-w-md w-full" style="background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);">
                <button onclick="window.closeAuthModal()" class="absolute top-4 right-4 text-white/50 hover:text-white p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <!-- PASSWORD SIGN IN (default) -->
                <div id="auth-password-container">
                    <h3 class="text-2xl font-light mb-2">Sign in</h3>
                    <p class="text-white/50 text-sm mb-6">Enter your email and password.</p>

                    <form id="auth-password-form" class="space-y-4" autocomplete="on">
                        <input
                            type="email"
                            id="auth-email-input"
                            name="email"
                            autocomplete="username email"
                            autocapitalize="none"
                            spellcheck="false"
                            placeholder="you@email.com"
                            value="${prefillEmail}"
                            required
                            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 text-sm"
                        >
                        <input
                            type="password"
                            id="auth-password-input"
                            name="password"
                            autocomplete="current-password"
                            placeholder="Password"
                            required
                            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 text-sm"
                        >
                        <button type="submit" id="auth-submit-btn" class="w-full px-6 py-3 rounded-xl text-sm font-medium text-white" style="background:linear-gradient(135deg,#059669 0%,#1d4ed8 100%);">
                            Sign In
                        </button>
                    </form>
                    <p id="auth-error" class="text-red-400 text-xs mt-3 hidden"></p>

                    <div class="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <button id="auth-forgot-link" class="text-xs text-white/40 hover:text-white/70 transition-colors">Forgot password?</button>
                        <button id="auth-magic-link" class="text-xs text-white/40 hover:text-white/70 transition-colors">Use magic link instead</button>
                    </div>
                </div>

                <!-- MAGIC LINK FORM -->
                <div id="auth-magiclink-container" class="hidden">
                    <h3 class="text-2xl font-light mb-2">Magic link</h3>
                    <p class="text-white/50 text-sm mb-6">We'll email you a sign-in link. No password needed.</p>

                    <form id="auth-email-form" class="space-y-4">
                        <input
                            type="email"
                            id="auth-magic-email-input"
                            name="email"
                            autocomplete="email"
                            autocapitalize="none"
                            spellcheck="false"
                            placeholder="you@email.com"
                            value="${prefillEmail}"
                            required
                            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 text-sm"
                        >
                        <button type="submit" id="auth-magic-submit-btn" class="w-full px-6 py-3 rounded-xl text-sm font-medium text-white" style="background:linear-gradient(135deg,#059669 0%,#1d4ed8 100%);">
                            Send Magic Link
                        </button>
                    </form>
                    <p id="auth-magic-error" class="text-red-400 text-xs mt-3 hidden"></p>

                    <div class="mt-4 pt-4 border-t border-white/5">
                        <button id="auth-back-to-password" class="text-xs text-white/40 hover:text-white/70 transition-colors">Back to password sign in</button>
                    </div>
                </div>

                <!-- FORGOT PASSWORD FORM -->
                <div id="auth-forgot-container" class="hidden">
                    <h3 class="text-2xl font-light mb-2">Reset password</h3>
                    <p class="text-white/50 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

                    <form id="auth-forgot-form" class="space-y-4">
                        <input
                            type="email"
                            id="auth-forgot-email-input"
                            name="email"
                            autocomplete="email"
                            autocapitalize="none"
                            spellcheck="false"
                            placeholder="you@email.com"
                            value="${prefillEmail}"
                            required
                            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 text-sm"
                        >
                        <button type="submit" id="auth-forgot-submit-btn" class="w-full px-6 py-3 rounded-xl text-sm font-medium text-white" style="background:linear-gradient(135deg,#059669 0%,#1d4ed8 100%);">
                            Send Reset Link
                        </button>
                    </form>
                    <p id="auth-forgot-error" class="text-red-400 text-xs mt-3 hidden"></p>

                    <div class="mt-4 pt-4 border-t border-white/5">
                        <button id="auth-back-from-forgot" class="text-xs text-white/40 hover:text-white/70 transition-colors">Back to sign in</button>
                    </div>
                </div>

                <!-- SUCCESS MESSAGE -->
                <div id="auth-success-container" class="hidden text-center">
                    <div class="text-4xl mb-4">&#x2728;</div>
                    <h3 id="auth-success-title" class="text-2xl font-light mb-2">Check your email</h3>
                    <p class="text-white/50 text-sm mb-4"><span id="auth-success-msg">We sent a link to</span> <span id="auth-sent-email" class="text-white"></span></p>
                    <p class="text-white/30 text-xs">Click the link in your email to continue. You can close this window.</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus email input
        const emailInput = document.getElementById('auth-email-input');
        if (emailInput) emailInput.focus();

        // View switching helpers
        function showView(viewId) {
            ['auth-password-container', 'auth-magiclink-container', 'auth-forgot-container', 'auth-success-container']
                .forEach(id => document.getElementById(id).classList.add('hidden'));
            document.getElementById(viewId).classList.remove('hidden');
        }

        // Navigation between views
        document.getElementById('auth-magic-link').addEventListener('click', () => {
            showView('auth-magiclink-container');
            document.getElementById('auth-magic-email-input').value = document.getElementById('auth-email-input').value;
            document.getElementById('auth-magic-email-input').focus();
        });

        document.getElementById('auth-forgot-link').addEventListener('click', () => {
            showView('auth-forgot-container');
            document.getElementById('auth-forgot-email-input').value = document.getElementById('auth-email-input').value;
            document.getElementById('auth-forgot-email-input').focus();
        });

        document.getElementById('auth-back-to-password').addEventListener('click', () => {
            showView('auth-password-container');
        });

        document.getElementById('auth-back-from-forgot').addEventListener('click', () => {
            showView('auth-password-container');
        });

        // PASSWORD FORM
        document.getElementById('auth-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email-input').value.trim();
            const password = document.getElementById('auth-password-input').value;
            const submitBtn = document.getElementById('auth-submit-btn');
            const errorEl = document.getElementById('auth-error');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            errorEl.classList.add('hidden');

            try {
                await signInWithPassword(email, password);
                window.closeAuthModal();
                window.location.reload();
            } catch (error) {
                errorEl.textContent = error.message || 'Invalid email or password.';
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });

        // MAGIC LINK FORM
        document.getElementById('auth-email-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-magic-email-input').value.trim();
            const submitBtn = document.getElementById('auth-magic-submit-btn');
            const errorEl = document.getElementById('auth-magic-error');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            errorEl.classList.add('hidden');

            try {
                await signInWithEmail(email);
                document.getElementById('auth-success-title').textContent = 'Check your email';
                document.getElementById('auth-success-msg').textContent = 'We sent a magic link to';
                document.getElementById('auth-sent-email').textContent = email;
                showView('auth-success-container');
            } catch (error) {
                errorEl.textContent = error.message || 'Something went wrong.';
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Magic Link';
            }
        });

        // FORGOT PASSWORD FORM
        document.getElementById('auth-forgot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-forgot-email-input').value.trim();
            const submitBtn = document.getElementById('auth-forgot-submit-btn');
            const errorEl = document.getElementById('auth-forgot-error');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            errorEl.classList.add('hidden');

            try {
                await resetPassword(email);
                document.getElementById('auth-success-title').textContent = 'Reset link sent';
                document.getElementById('auth-success-msg').textContent = 'We sent a password reset link to';
                document.getElementById('auth-sent-email').textContent = email;
                showView('auth-success-container');
            } catch (error) {
                errorEl.textContent = error.message || 'Something went wrong.';
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Reset Link';
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

    async function setupUI() {
        const session = await getSession();
        currentUser = session?.user || null;
        updateAuthUI();

        const signInBtn = document.getElementById('sign-in-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => showSignInModal());
        }

        const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');
        if (mobileSignInBtn) {
            mobileSignInBtn.addEventListener('click', () => showSignInModal());
        }
    }

    // Run setupUI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupUI);
    } else {
        setupUI();
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.auth = {
        signInWithEmail,
        signUp,
        signInWithPassword,
        signOut,
        getUser,
        getSession,
        isSignedIn,
        onAuthStateChange,
        showSignInModal,
        resetPassword,
        updatePassword,
        getCurrentUser: () => currentUser
    };

    } // end initAuth (called by waitForClient)

})();
