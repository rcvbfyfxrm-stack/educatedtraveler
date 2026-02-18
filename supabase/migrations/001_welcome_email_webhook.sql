-- =====================================================
-- WELCOME EMAIL WEBHOOK TRIGGER
-- =====================================================
-- This creates a database webhook that triggers the Edge Function
-- when a new profile is created.
--
-- SETUP STEPS:
-- 1. Deploy the Edge Function first (see README)
-- 2. Run this SQL in Supabase SQL Editor
-- 3. Configure the webhook URL in Supabase Dashboard
-- =====================================================

-- Add columns to track email sequence status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS day3_email_sent TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS day7_email_sent TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for email queries
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent
ON profiles(welcome_email_sent)
WHERE welcome_email_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_day3_email
ON profiles(created_at)
WHERE day3_email_sent IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_day7_email
ON profiles(created_at)
WHERE day7_email_sent IS NULL;

-- =====================================================
-- OPTION A: Use Supabase Database Webhooks (Recommended)
-- =====================================================
-- Go to: Supabase Dashboard → Database → Webhooks → Create Webhook
--
-- Settings:
--   Name: send-welcome-email
--   Table: profiles
--   Events: INSERT
--   Type: Supabase Edge Function
--   Edge Function: send-welcome-email
--
-- This is the easiest method - no SQL needed beyond the table setup above.

-- =====================================================
-- OPTION B: Use pg_net extension (Alternative)
-- =====================================================
-- If you prefer SQL-based triggers, enable pg_net extension first:
-- Go to: Database → Extensions → Enable pg_net

-- Uncomment below if using pg_net:
/*
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email';
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY'; -- Store in vault for production
BEGIN
  -- Only send if not already sent
  IF NEW.welcome_email_sent = FALSE THEN
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'profiles',
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'name', NEW.name,
          'created_at', NEW.created_at
        )
      )
    );

    -- Mark as sent
    NEW.welcome_email_sent := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();
*/
