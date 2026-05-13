-- =====================================================
-- PROFILE EXTENDED COLUMNS
-- =====================================================
-- Adds the columns written by dashboard.html (profile setup form)
-- and read by profile.html, community-sidebar.js, and the
-- get_community_for_adventure() RPC (migration 004).
--
-- These columns were previously created ad-hoc in the Supabase
-- dashboard; this migration makes the schema authoritative.
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- =====================================================

-- Types below match the live production database (exaehwaqwcledemwpluw).
-- age is TEXT (stores age-range strings like "18-25"); arrays are TEXT[].
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS adventure_years TEXT,
  ADD COLUMN IF NOT EXISTS previous_experience TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fitness TEXT,
  ADD COLUMN IF NOT EXISTS comfort_zone TEXT,
  ADD COLUMN IF NOT EXISTS credentials TEXT,
  ADD COLUMN IF NOT EXISTS existing_certs TEXT,
  ADD COLUMN IF NOT EXISTS what_matters TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT,
  ADD COLUMN IF NOT EXISTS preferred_duration TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private'
    CHECK (visibility IN ('private', 'cohort', 'public')),
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- The RLS policy in 000 (base schema) references profiles.visible;
-- without this column, the "Anyone can view visible profiles" policy
-- errors silently and all public-profile lookups return nothing.
CREATE INDEX IF NOT EXISTS idx_profiles_visible
  ON profiles(visible) WHERE visible = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_profile_complete
  ON profiles(profile_complete) WHERE profile_complete = TRUE;
