// Database Module for EducatedTraveler
// Handles all Supabase database operations

(function() {
    'use strict';

    const supabase = window.supabaseClient;

    // ========================================
    // PROFILE OPERATIONS
    // ========================================

    async function getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            throw error;
        }

        return data;
    }

    async function updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        return data;
    }

    async function addXP(userId, amount) {
        // Get current XP
        const profile = await getProfile(userId);
        if (!profile) return null;

        const newXP = (profile.xp || 0) + amount;
        const newLevel = Math.floor(newXP / 500) + 1;

        return updateProfile(userId, {
            xp: newXP,
            level: newLevel
        });
    }

    // ========================================
    // PREFERENCES OPERATIONS
    // ========================================

    async function getPreferences(userId) {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching preferences:', error);
            throw error;
        }

        return data;
    }

    async function savePreferences(userId, preferences) {
        const { data, error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                elements: preferences.elements || [],
                desires: preferences.desires || [],
                time_preference: preferences.time || null,
                intensity: preferences.intensity || null,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving preferences:', error);
            throw error;
        }

        return data;
    }

    // ========================================
    // SAVED ADVENTURES OPERATIONS
    // ========================================

    async function getSavedAdventures(userId) {
        const { data, error } = await supabase
            .from('saved_adventures')
            .select('*')
            .eq('user_id', userId)
            .order('saved_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved adventures:', error);
            throw error;
        }

        return data || [];
    }

    async function saveAdventure(userId, adventure) {
        const { data, error } = await supabase
            .from('saved_adventures')
            .upsert({
                user_id: userId,
                adventure_id: adventure.id,
                adventure_name: adventure.name
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving adventure:', error);
            throw error;
        }

        return data;
    }

    async function removeAdventure(userId, adventureId) {
        const { error } = await supabase
            .from('saved_adventures')
            .delete()
            .eq('user_id', userId)
            .eq('adventure_id', adventureId);

        if (error) {
            console.error('Error removing adventure:', error);
            throw error;
        }
    }

    // ========================================
    // BADGES OPERATIONS
    // ========================================

    async function getBadges(userId) {
        const { data, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (error) {
            console.error('Error fetching badges:', error);
            throw error;
        }

        return data || [];
    }

    async function awardBadge(userId, badgeKey) {
        // Check if badge already exists
        const { data: existing } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_key', badgeKey)
            .single();

        if (existing) {
            return null; // Badge already awarded
        }

        const { data, error } = await supabase
            .from('user_badges')
            .insert({
                user_id: userId,
                badge_key: badgeKey
            })
            .select()
            .single();

        if (error) {
            console.error('Error awarding badge:', error);
            throw error;
        }

        return data;
    }

    // ========================================
    // QUEST SAVE FUNCTION
    // ========================================

    async function saveQuestResults(questState, matchedAdventures) {
        const user = window.auth?.getCurrentUser();

        if (!user) {
            // Store pending data, trigger sign-in
            sessionStorage.setItem('pendingQuest', JSON.stringify({
                questState,
                matchedAdventures
            }));
            return { needsAuth: true };
        }

        try {
            // Save preferences
            await savePreferences(user.id, questState);

            // Save matched adventures
            for (const adventure of matchedAdventures.slice(0, 5)) {
                await saveAdventure(user.id, adventure);
            }

            // Award badges based on selections
            const allTags = [...(questState.elements || []), ...(questState.desires || [])];
            for (const tag of allTags) {
                const awarded = await awardBadge(user.id, tag);
                if (awarded) {
                    // Badge was newly awarded - add XP
                    await addXP(user.id, 50);
                }
            }

            // Add XP for completing quest
            await addXP(user.id, 150);

            return { success: true };
        } catch (error) {
            console.error('Error saving quest results:', error);
            return { error };
        }
    }

    // ========================================
    // FULL DASHBOARD DATA
    // ========================================

    async function getDashboardData(userId) {
        const [profile, preferences, adventures, badges] = await Promise.all([
            getProfile(userId),
            getPreferences(userId),
            getSavedAdventures(userId),
            getBadges(userId)
        ]);

        return {
            profile,
            preferences,
            adventures,
            badges
        };
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.db = {
        // Profile
        getProfile,
        updateProfile,
        addXP,

        // Preferences
        getPreferences,
        savePreferences,

        // Adventures
        getSavedAdventures,
        saveAdventure,
        removeAdventure,

        // Badges
        getBadges,
        awardBadge,

        // Combined
        saveQuestResults,
        getDashboardData
    };

})();
