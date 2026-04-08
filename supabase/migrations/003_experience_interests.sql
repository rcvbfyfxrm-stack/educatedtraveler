-- Experience Interests: track student interest in experiences
-- Run in Supabase SQL Editor

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

ALTER TABLE experience_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interests" ON experience_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests" ON experience_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests" ON experience_interests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_experience_interests_user_id ON experience_interests(user_id);
CREATE INDEX idx_experience_interests_adventure_id ON experience_interests(adventure_id);

CREATE TRIGGER update_experience_interests_updated_at
    BEFORE UPDATE ON experience_interests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
