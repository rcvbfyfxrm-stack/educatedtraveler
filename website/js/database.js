// Database Module for EducatedTraveler
// Handles all Supabase database operations

(function() {
    'use strict';

    function waitForClient(cb, attempt) {
        attempt = attempt || 0;
        if (window.supabaseClient) { cb(); return; }
        if (window.supabaseError) { console.warn('Database: Supabase unavailable, skipping init'); return; }
        if (attempt < 120) setTimeout(function() { waitForClient(cb, attempt + 1); }, 50);
    }

    waitForClient(function() {
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

    async function saveQuestResults(questState, matchedAdventures, options) {
        const user = window.auth?.getCurrentUser();

        if (!user) {
            // Store pending data, trigger sign-in
            sessionStorage.setItem('pendingQuest', JSON.stringify({
                questState,
                matchedAdventures,
                phone: options?.phone || null,
                whatsappOptIn: options?.whatsappOptIn || false
            }));
            return { needsAuth: true };
        }

        try {
            // Save preferences
            await savePreferences(user.id, questState);

            // Save phone + WhatsApp opt-in if provided
            if (options?.phone) {
                await updateProfile(user.id, {
                    phone: options.phone,
                    whatsapp_opt_in: options.whatsappOptIn || false
                });
            }

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
    // EXPERIENCE INTEREST OPERATIONS
    // ========================================

    async function expressInterest(userId, adventureId, adventureName) {
        const { data, error } = await supabase
            .from('experience_interests')
            .upsert({
                user_id: userId,
                adventure_id: adventureId,
                adventure_name: adventureName,
                status: 'interested'
            }, { onConflict: 'user_id,adventure_id' })
            .select()
            .single();

        if (error) {
            console.error('Error expressing interest:', error);
            throw error;
        }

        return data;
    }

    async function getUserInterests(userId) {
        const { data, error } = await supabase
            .from('experience_interests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching interests:', error);
            throw error;
        }

        return data || [];
    }

    async function getInterestForAdventure(userId, adventureId) {
        const { data, error } = await supabase
            .from('experience_interests')
            .select('*')
            .eq('user_id', userId)
            .eq('adventure_id', adventureId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking interest:', error);
            throw error;
        }

        return data;
    }

    async function cancelInterestByAdventure(userId, adventureId) {
        const { error } = await supabase
            .from('experience_interests')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('adventure_id', adventureId);

        if (error) {
            console.error('Error cancelling interest:', error);
            throw error;
        }
    }

    // ========================================
    // INSTRUCTOR OPERATIONS
    // ========================================

    async function getInstructorByUserId(userId) {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching instructor:', error);
            throw error;
        }

        return data;
    }

    async function createInstructorApplication(userId, application) {
        const { data, error } = await supabase
            .from('instructors')
            .insert({
                user_id: userId,
                name: application.name,
                email: application.email,
                location: application.location || null,
                website: application.website || null,
                discipline: application.discipline || null,
                credentials: application.credentials || null,
                approach: application.approach || null,
                preferred_locations: application.preferred_locations || [],
                availability: application.availability || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating instructor application:', error);
            throw error;
        }

        return data;
    }

    async function updateInstructor(instructorId, updates) {
        const { data, error } = await supabase
            .from('instructors')
            .update(updates)
            .eq('id', instructorId)
            .select()
            .single();

        if (error) {
            console.error('Error updating instructor:', error);
            throw error;
        }

        return data;
    }

    // ========================================
    // COHORT OPERATIONS
    // ========================================

    async function getInstructorCohorts(instructorId) {
        const { data, error } = await supabase
            .from('cohorts')
            .select('*')
            .eq('instructor_id', instructorId)
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Error fetching cohorts:', error);
            throw error;
        }

        return data || [];
    }

    async function createCohort(cohort) {
        const { data, error } = await supabase
            .from('cohorts')
            .insert({
                instructor_id: cohort.instructor_id,
                adventure_id: cohort.adventure_id || null,
                title: cohort.title,
                description: cohort.description || null,
                location: cohort.location || null,
                start_date: cohort.start_date || null,
                end_date: cohort.end_date || null,
                capacity: cohort.capacity || 10,
                price_cents: cohort.price_cents || null,
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating cohort:', error);
            throw error;
        }

        return data;
    }

    async function updateCohort(cohortId, updates) {
        const { data, error } = await supabase
            .from('cohorts')
            .update(updates)
            .eq('id', cohortId)
            .select()
            .single();

        if (error) {
            console.error('Error updating cohort:', error);
            throw error;
        }

        return data;
    }

    // ========================================
    // ENROLLMENT OPERATIONS
    // ========================================

    async function getCohortEnrollments(cohortId) {
        const { data, error } = await supabase
            .from('enrollments')
            .select('*, profiles(name, email)')
            .eq('cohort_id', cohortId)
            .order('enrolled_at', { ascending: true });

        if (error) {
            console.error('Error fetching enrollments:', error);
            throw error;
        }

        return data || [];
    }

    async function getPublishedCohorts() {
        const { data, error } = await supabase
            .from('cohorts')
            .select('*, instructors(name, discipline), enrollments(id)')
            .in('status', ['published', 'full'])
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Error fetching published cohorts:', error);
            throw error;
        }

        return data || [];
    }

    async function enrollInCohort(userId, cohortId) {
        const { data, error } = await supabase
            .from('enrollments')
            .insert({
                user_id: userId,
                cohort_id: cohortId,
                status: 'enrolled'
            })
            .select()
            .single();

        if (error) {
            console.error('Error enrolling:', error);
            throw error;
        }

        return data;
    }

    async function getUserEnrollments(userId) {
        const { data, error } = await supabase
            .from('enrollments')
            .select('*, cohorts(title, location, start_date, end_date, status, instructors(name))')
            .eq('user_id', userId)
            .order('enrolled_at', { ascending: false });

        if (error) {
            console.error('Error fetching user enrollments:', error);
            throw error;
        }

        return data || [];
    }

    async function cancelEnrollment(userId, cohortId) {
        const { error } = await supabase
            .from('enrollments')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('cohort_id', cohortId);

        if (error) {
            console.error('Error cancelling enrollment:', error);
            throw error;
        }
    }

    // ========================================
    // INSTRUCTOR DASHBOARD DATA
    // ========================================

    async function getInstructorDashboardData(userId) {
        const instructor = await getInstructorByUserId(userId);
        if (!instructor) return null;

        const cohorts = await getInstructorCohorts(instructor.id);

        // Fetch enrollments for each cohort
        const cohortsWithEnrollments = await Promise.all(
            cohorts.map(async (cohort) => {
                const enrollments = await getCohortEnrollments(cohort.id);
                return { ...cohort, enrollments };
            })
        );

        return {
            instructor,
            cohorts: cohortsWithEnrollments
        };
    }

    // ========================================
    // FULL DASHBOARD DATA
    // ========================================

    async function getPublicProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, name, age, location, about, interests, credentials, existing_certs, fitness, comfort_zone, profession, adventure_years, previous_experience, skills, what_matters, languages, avatar_url, visible')
            .eq('id', userId)
            .eq('visible', true)
            .single();

        if (error) return null;
        return data;
    }

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

        // Interests
        expressInterest,
        getUserInterests,
        getInterestForAdventure,
        cancelInterestByAdventure,

        // Instructors
        getInstructorByUserId,
        createInstructorApplication,
        updateInstructor,

        // Cohorts
        getInstructorCohorts,
        createCohort,
        updateCohort,
        getPublishedCohorts,

        // Enrollments
        getCohortEnrollments,
        enrollInCohort,
        getUserEnrollments,
        cancelEnrollment,

        // Public
        getPublicProfile,

        // Combined
        saveQuestResults,
        getDashboardData,
        getInstructorDashboardData
    };

    }); // end waitForClient

})();
