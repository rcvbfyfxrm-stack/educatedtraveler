-- Community Wall: let interested students see each other's public profiles
-- This RPC function bypasses RLS safely by only returning visible profiles

CREATE OR REPLACE FUNCTION get_community_for_adventure(p_adventure_id TEXT)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  name TEXT,
  location TEXT,
  about TEXT,
  avatar_url TEXT,
  profession TEXT,
  previous_experience TEXT,
  skills TEXT,
  what_matters TEXT,
  interests JSONB,
  interested_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id AS user_id,
      p.first_name,
      p.name,
      p.location,
      p.about,
      p.avatar_url,
      p.profession,
      p.previous_experience,
      p.skills,
      p.what_matters,
      p.interests,
      ei.created_at AS interested_at
    FROM experience_interests ei
    JOIN profiles p ON p.id = ei.user_id
    WHERE ei.adventure_id = p_adventure_id
      AND ei.status = 'interested'
      AND p.visible = true
    ORDER BY ei.created_at ASC;
END;
$$;
