-- 017_addon_interests.sql
-- Lead capture for complementary experiences surfaced on per-course landing
-- pages (e.g. /sushi-mastery, future yoga / sailing pages). Anonymous insert
-- is allowed so a visitor doesn't have to sign up just to flag interest.
-- Read access is restricted to admins / the owner of the email after sign-in.

CREATE TABLE IF NOT EXISTS addon_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  page_slug TEXT NOT NULL,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addon_interests_email ON addon_interests(lower(email));
CREATE INDEX IF NOT EXISTS idx_addon_interests_page_slug ON addon_interests(page_slug);
CREATE INDEX IF NOT EXISTS idx_addon_interests_created_at ON addon_interests(created_at DESC);

ALTER TABLE addon_interests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) may submit a lead.
DROP POLICY IF EXISTS "addon_interests_anon_insert" ON addon_interests;
CREATE POLICY "addon_interests_anon_insert" ON addon_interests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) <= 320
    AND page_slug IS NOT NULL
    AND jsonb_typeof(addons) = 'array'
  );

-- Signed-in users may read their own submissions.
DROP POLICY IF EXISTS "addon_interests_owner_read" ON addon_interests;
CREATE POLICY "addon_interests_owner_read" ON addon_interests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'));

COMMENT ON TABLE addon_interests IS
  'Lead capture for "I would like more info about these complementary experiences" forms on course landing pages. Anonymous insert-only; admin reads via service-role.';
