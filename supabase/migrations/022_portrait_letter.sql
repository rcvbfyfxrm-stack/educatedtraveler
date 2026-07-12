-- =====================================================
-- PORTRAIT + LETTER  (the /portrait Circle questionnaire)
-- =====================================================
-- Columns written by website/portrait.html when a signed-in
-- member seals their portrait. Most fields already exist
-- (005_profile_extended_columns): first_name, profession,
-- location, status, interests[], previous_experience,
-- availability, preferred_duration, profile_complete.
-- This migration adds only what's new.
--
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dream_letter TEXT,            -- the private letter, for Arnaud alone
  ADD COLUMN IF NOT EXISTS reach TEXT,                   -- "how far would you travel" answer
  ADD COLUMN IF NOT EXISTS portrait_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS portrait_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_portrait_complete
  ON profiles(portrait_completed_at DESC) WHERE portrait_complete = TRUE;

-- The member writes their own row (RLS from base schema already lets a
-- user upsert profiles WHERE id = auth.uid()). No new policy needed for
-- the write path. Reads stay owner/admin per existing policies.

-- =====================================================
-- COMPLETION EMAIL — "email me each time someone completes a portrait"
-- =====================================================
-- Wired in the app, NOT the database: right after a successful seal,
-- website/portrait.html calls supabase.functions.invoke('notify-portrait').
-- That edge function verifies the caller's JWT, re-reads THEIR OWN profile
-- row with the service role (never trusts the browser payload), and emails
-- Arnaud via Resend. So there is no DB webhook / pg_net trigger to maintain
-- and no service-role key living in the database.
