-- =====================================================
-- PROFILE JSONB FIX
-- =====================================================
-- Realigns column types with what dashboard.html actually
-- writes and profile.html actually reads.
--
-- The save was failing because:
--   * interests is written as a JS object  { ocean:[...], adventure:[...] }
--     but the column was TEXT[]            → Postgres type error
--   * credentials is written as an array of { cert, family } objects
--     but the column was TEXT              → type error
--   * languages is written as a single string ("English, French")
--     but the column was TEXT[]            → type error
--   * skills is written as an array of strings
--     so TEXT[] worked but JSONB is more consistent
--
-- Idempotent: each ALTER checks current type before changing.
-- =====================================================

-- INTERESTS  → JSONB (object keyed by category)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='interests') <> 'jsonb' THEN
    ALTER TABLE profiles
      ALTER COLUMN interests DROP DEFAULT,
      ALTER COLUMN interests TYPE JSONB
        USING (
          CASE
            WHEN interests IS NULL THEN '{}'::jsonb
            WHEN pg_typeof(interests)::text = 'text[]' THEN to_jsonb(interests)
            ELSE '{}'::jsonb
          END
        ),
      ALTER COLUMN interests SET DEFAULT '{}'::jsonb;
  END IF;
END$$;

-- CREDENTIALS → JSONB (array of { cert, family })
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='credentials') <> 'jsonb' THEN
    ALTER TABLE profiles
      ALTER COLUMN credentials DROP DEFAULT,
      ALTER COLUMN credentials TYPE JSONB
        USING (
          CASE
            WHEN credentials IS NULL OR credentials = '' THEN '[]'::jsonb
            ELSE to_jsonb(credentials)
          END
        ),
      ALTER COLUMN credentials SET DEFAULT '[]'::jsonb;
  END IF;
END$$;

-- SKILLS → JSONB (array of strings)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='skills') <> 'jsonb' THEN
    ALTER TABLE profiles
      ALTER COLUMN skills DROP DEFAULT,
      ALTER COLUMN skills TYPE JSONB
        USING (
          CASE
            WHEN skills IS NULL THEN '[]'::jsonb
            WHEN pg_typeof(skills)::text = 'text[]' THEN to_jsonb(skills)
            ELSE '[]'::jsonb
          END
        ),
      ALTER COLUMN skills SET DEFAULT '[]'::jsonb;
  END IF;
END$$;

-- LANGUAGES → TEXT (comma-separated string from the form)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='languages') <> 'text' THEN
    ALTER TABLE profiles
      ALTER COLUMN languages DROP DEFAULT,
      ALTER COLUMN languages TYPE TEXT
        USING (
          CASE
            WHEN languages IS NULL THEN NULL
            WHEN pg_typeof(languages)::text = 'text[]' THEN array_to_string(languages, ', ')
            ELSE languages::text
          END
        );
  END IF;
END$$;

-- Make sure profile_complete + avatar_url exist (older DBs may lack them)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS completion_pct INTEGER DEFAULT 0;
