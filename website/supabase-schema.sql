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

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_adventures_user_id ON saved_adventures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

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
