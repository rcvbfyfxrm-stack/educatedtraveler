-- =====================================================
-- 014_admin_chat_access.sql — admins can read & post in any cohort chat
-- =====================================================
-- Updates the is_cohort_member() helper so that profiles.is_admin
-- bypasses the (instructor-or-paid-student) check. All downstream RLS
-- policies (cohort_messages SELECT/INSERT/UPDATE/DELETE) and the
-- get_cohort_members() RPC inherit the new rule because they call
-- this single helper.
--
-- Run AFTER 013_cohort_community.sql.

CREATE OR REPLACE FUNCTION is_cohort_member(p_cohort_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  -- Admins see and can post in every cohort chat
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND is_admin = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Instructor of this cohort
  IF EXISTS (
    SELECT 1 FROM cohorts c
    JOIN instructors i ON i.id = c.instructor_id
    WHERE c.id = p_cohort_id AND i.user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Paid student
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.cohort_id = p_cohort_id
      AND e.user_id = p_user_id
      AND e.payment_status = 'paid'
      AND e.status IN ('enrolled', 'completed', 'pending')
  );
END;
$$;

-- get_cohort_members already gates on is_cohort_member, so admins
-- automatically receive the roster. Surface an "admin" badge so the
-- chat UI can distinguish admin observers from real members.
CREATE OR REPLACE FUNCTION get_cohort_members(p_cohort_id UUID)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  name TEXT,
  location TEXT,
  about TEXT,
  avatar_url TEXT,
  profession TEXT,
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
      'instructor'::TEXT AS role,
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
      'student'::TEXT AS role,
      e.status       AS enrollment_status,
      e.payment_status,
      COALESCE(e.paid_at, e.enrolled_at) AS joined_at
    FROM enrollments e
    JOIN profiles p ON p.id = e.user_id
    WHERE e.cohort_id = p_cohort_id
      AND e.payment_status = 'paid'
      AND e.status IN ('enrolled', 'completed', 'pending')
    ORDER BY 11 ASC;

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
      'admin'::TEXT  AS role,
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

GRANT EXECUTE ON FUNCTION is_cohort_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cohort_members(UUID) TO authenticated;
