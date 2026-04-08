-- =====================================================
-- TABLE: survey_responses
-- Anonymous survey submissions (no auth required)
-- =====================================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Section 1: Who are you
  lifestage TEXT,             -- burnout, leveling_up, career_switch, deep_enthusiast, sabbatical, curious
  skill_desire TEXT,          -- yes_specific, yes_unsure, no
  skill_specify TEXT,         -- free text if yes_specific
  age_range TEXT,
  location TEXT,

  -- Section 2: What do you want
  programs TEXT[],            -- array of selected programs (max 2)
  programs_other TEXT,        -- free text if "other" selected
  duration TEXT,              -- 1_week, 2_weeks, 3_weeks, 1_month, 2-3_months, whatever_it_takes
  solo TEXT,                  -- solo, bring_someone, depends_group

  -- Section 3: Money & commitment
  price_range TEXT,           -- under_2000, 2000-3500, 3500-5000, 5000-7000, quality_over_price
  booking_intent TEXT,        -- deposit_now, very_likely, possible, unlikely
  top_barrier TEXT,           -- price, time_off, strangers, diy_cheaper, trust, other
  barrier_other TEXT,         -- free text if "other"

  -- Section 4: How we reach you
  source TEXT,                -- friend, instagram, google, other
  group_size_importance TEXT, -- essential, nice_to_have, dont_care
  trust_factors TEXT[],       -- array of trust factors (max 2)

  -- Section 5: Stay in touch
  wants_contact BOOLEAN DEFAULT FALSE,
  email TEXT,
  open_feedback TEXT,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Allow anonymous inserts (no auth required)
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert survey responses" ON survey_responses
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin can read (you'll read via Supabase dashboard or admin page)
CREATE POLICY "Authenticated users can view survey responses" ON survey_responses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Index for quick stats
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_lifestage ON survey_responses(lifestage);
CREATE INDEX IF NOT EXISTS idx_survey_responses_booking_intent ON survey_responses(booking_intent);
