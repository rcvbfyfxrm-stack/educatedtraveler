-- 018_member_xp_in_cohort_roster.sql
-- Add xp + completion_pct to get_cohort_members so chat avatars can render
-- the XP tier ring (color = tier) for fellow members.
--
-- No new data exposed — profiles.xp and profiles.completion_pct are already
-- readable to a cohort peer via the public profile view; this just bundles
-- them with the roster RPC so the chat doesn't need a second round-trip.
--
-- Must DROP before re-CREATE because PostgreSQL forbids changing RETURNS
-- TABLE column set with CREATE OR REPLACE.

DROP FUNCTION IF EXISTS get_cohort_members(UUID);

CREATE OR REPLACE FUNCTION get_cohort_members(p_cohort_id UUID)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  name TEXT,
  location TEXT,
  about TEXT,
  avatar_url TEXT,
  profession TEXT,
  xp INTEGER,
  completion_pct INTEGER,
  role TEXT,
  enrollment_status TEXT,
  payment_status TEXT,
  joined_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_cohort_member(p_cohort_id, auth.uid()) THEN
    RETURN;
  END IF;

  -- Instructor row
  RETURN QUERY
    SELECT
      p.id           AS user_id,
      p.first_name,
      p.name,
      p.location,
      p.about,
      p.avatar_url,
      p.profession,
      COALESCE(p.xp, 0)              AS xp,
      COALESCE(p.completion_pct, 0)  AS completion_pct,
      'instructor'::TEXT             AS role,
      NULL::TEXT     AS enrollment_status,
      NULL::TEXT     AS payment_status,
      c.created_at   AS joined_at
    FROM cohorts c
    JOIN instructors i ON i.id = c.instructor_id
    JOIN profiles p    ON p.id = i.user_id
    WHERE c.id = p_cohort_id;

  -- Student rows (paid only)
  RETURN QUERY
    SELECT
      p.id           AS user_id,
      p.first_name,
      p.name,
      p.location,
      p.about,
      p.avatar_url,
      p.profession,
      COALESCE(p.xp, 0)              AS xp,
      COALESCE(p.completion_pct, 0)  AS completion_pct,
      'student'::TEXT                AS role,
      e.status       AS enrollment_status,
      e.payment_status,
      COALESCE(e.paid_at, e.enrolled_at) AS joined_at
    FROM enrollments e
    JOIN profiles p ON p.id = e.user_id
    WHERE e.cohort_id = p_cohort_id
      AND e.payment_status = 'paid'
      AND e.status IN ('enrolled', 'completed', 'pending')
    ORDER BY 13 ASC;

  -- Admin observers who are NOT already the instructor or a student
  RETURN QUERY
    SELECT
      p.id           AS user_id,
      p.first_name,
      p.name,
      p.location,
      p.about,
      p.avatar_url,
      p.profession,
      COALESCE(p.xp, 0)              AS xp,
      COALESCE(p.completion_pct, 0)  AS completion_pct,
      'admin'::TEXT                  AS role,
      NULL::TEXT     AS enrollment_status,
      NULL::TEXT     AS payment_status,
      NOW()          AS joined_at
    FROM profiles p
    WHERE p.is_admin = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM cohorts c
        JOIN instructors i ON i.id = c.instructor_id
        WHERE c.id = p_cohort_id AND i.user_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.cohort_id = p_cohort_id
          AND e.user_id = p.id
          AND e.payment_status = 'paid'
      );
END;
$$;

GRANT EXECUTE ON FUNCTION get_cohort_members(UUID) TO authenticated;
