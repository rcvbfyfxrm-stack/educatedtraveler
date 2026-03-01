-- =====================================================
-- WHATSAPP INTEGRATION COLUMNS
-- =====================================================
-- Adds phone number, opt-in, and message tracking columns
-- Run this in Supabase SQL Editor after deploying edge functions

-- Add WhatsApp columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_day1_sent TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_day3_sent TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_day7_sent TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for WhatsApp cron queries
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_day1
ON profiles(created_at)
WHERE phone IS NOT NULL AND whatsapp_opt_in = TRUE AND whatsapp_day1_sent IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_day3
ON profiles(created_at)
WHERE phone IS NOT NULL AND whatsapp_opt_in = TRUE AND whatsapp_day3_sent IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_day7
ON profiles(created_at)
WHERE phone IS NOT NULL AND whatsapp_opt_in = TRUE AND whatsapp_day7_sent IS NULL;
