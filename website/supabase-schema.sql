-- =====================================================
-- EDUCATEDTRAVELER SUPABASE SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Go to: https://app.supabase.com → Your Project → SQL Editor

-- =====================================================
-- TABLE: profiles
-- Extends Supabase auth.users with additional user data
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  xp INTEGER DEFAULT 100,
  level INTEGER DEFAULT 1,
  phone TEXT DEFAULT NULL,
  whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_preferences
-- User preferences from quest selections
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  elements TEXT[] DEFAULT '{}',  -- ocean, mountain, city, temple, wild
  desires TEXT[] DEFAULT '{}',   -- certification, career, stories, reset, rare
  time_preference TEXT,          -- foundation, mastery, saga
  intensity INTEGER,             -- 1, 2, 3
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- TABLE: saved_adventures
-- Adventures matched/saved by users
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_adventures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL,    -- matches experience IDs from index.html
  adventure_name TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, adventure_id)
);

-- =====================================================
-- TABLE: user_badges
-- Badges earned by users
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,       -- ocean, mountain, certification, etc.
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- =====================================================
-- TABLE: instructors
-- Instructor profiles linked to auth.users
-- =====================================================
CREATE TABLE IF NOT EXISTS instructors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  website TEXT,
  discipline TEXT,
  credentials TEXT,
  approach TEXT,
  preferred_locations TEXT[] DEFAULT '{}',
  availability TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- =====================================================
-- TABLE: cohorts
-- Specific class instances run by instructors
-- =====================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  adventure_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  capacity INTEGER DEFAULT 10,
  price_cents INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: enrollments
-- Links students to cohorts
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'waitlisted', 'cancelled', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cohort_id)
);

-- =====================================================
-- TABLE: experience_interests
-- Student interest in an experience (before cohort exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS experience_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL,
  adventure_name TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined', 'cancelled')),
  token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, adventure_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone can view visible profiles" ON profiles
  FOR SELECT USING (visible = true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Saved adventures policies
CREATE POLICY "Users can view own adventures" ON saved_adventures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adventures" ON saved_adventures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adventures" ON saved_adventures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adventures" ON saved_adventures
  FOR DELETE USING (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own badges" ON user_badges
  FOR DELETE USING (auth.uid() = user_id);

-- Instructors policies
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Instructors can view and update their own record
CREATE POLICY "Instructors can view own record" ON instructors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Instructors can update own record" ON instructors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert instructor application" ON instructors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cohorts policies
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own cohorts
CREATE POLICY "Instructors can view own cohorts" ON cohorts
  FOR SELECT USING (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

CREATE POLICY "Instructors can insert own cohorts" ON cohorts
  FOR INSERT WITH CHECK (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Instructors can update own cohorts" ON cohorts
  FOR UPDATE USING (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

-- Students can view published cohorts
CREATE POLICY "Anyone can view published cohorts" ON cohorts
  FOR SELECT USING (status IN ('published', 'full'));

-- Enrollments policies
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Students can manage their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Instructors can view enrollments for their cohorts
CREATE POLICY "Instructors can view cohort enrollments" ON enrollments
  FOR SELECT USING (
    cohort_id IN (
      SELECT c.id FROM cohorts c
      JOIN instructors i ON c.instructor_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

-- Experience interests policies
ALTER TABLE experience_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interests" ON experience_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests" ON experience_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests" ON experience_interests
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_adventures_user_id ON saved_adventures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_instructor_id ON cohorts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_interests_user_id ON experience_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_interests_adventure_id ON experience_interests(adventure_id);

-- =====================================================
-- TRIGGERS for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON instructors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at
    BEFORE UPDATE ON cohorts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
