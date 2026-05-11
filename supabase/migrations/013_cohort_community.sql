-- =====================================================
-- 013_cohort_community.sql — prior experiences,
-- enrollment timeline, cohort group chat
-- =====================================================
-- Adds three community features:
--   1. prior_experiences  — self-declared past classes with our instructors
--   2. user_enrollment_timeline (view) — Planning / Doing / Completed status
--   3. cohort_messages + get_cohort_members RPC — group chat & member roster
--
-- Run AFTER 012_realtime_profiles.sql.

-- =====================================================
-- 1) PRIOR EXPERIENCES — past classes (before EducatedTraveler)
-- =====================================================
CREATE TABLE IF NOT EXISTS prior_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Optional FK to a known offering in ET_EXPERIENCES (text id, e.g. "sushi-mastery-tokyo")
  experience_id TEXT,
  experience_name TEXT NOT NULL,

  -- Optional FK to an EducatedTraveler instructor (claim a known instructor)
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  instructor_name TEXT,         -- denormalized fallback / freeform

  year_completed INTEGER CHECK (year_completed BETWEEN 1950 AND 2099),
  location TEXT,
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),

  -- Self-attested only by default. When instructor_id is set, the instructor
  -- can flip this to TRUE to vouch publicly ("Verified by instructor").
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prior_experiences_user
  ON prior_experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_prior_experiences_instructor
  ON prior_experiences(instructor_id)
  WHERE instructor_id IS NOT NULL;

ALTER TABLE prior_experiences ENABLE ROW LEVEL SECURITY;

-- Public read: prior experiences appear on profile pages
CREATE POLICY "Prior experiences are publicly readable"
  ON prior_experiences FOR SELECT USING (true);

-- Owner-only write
CREATE POLICY "Users insert own prior experiences"
  ON prior_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own prior experiences"
  ON prior_experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own prior experiences"
  ON prior_experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Instructors can flip the verified flag on their own claimed rows
CREATE POLICY "Instructors verify their rows"
  ON prior_experiences FOR UPDATE
  USING (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_prior_experiences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prior_experiences_updated_at ON prior_experiences;
CREATE TRIGGER trg_prior_experiences_updated_at
  BEFORE UPDATE ON prior_experiences
  FOR EACH ROW EXECUTE FUNCTION touch_prior_experiences_updated_at();


-- =====================================================
-- 2) USER ENROLLMENT TIMELINE — derived status
-- =====================================================
-- Computes Planning / Doing / Completed / Cancelled from existing
-- enrollments + cohort dates. No new column needed.
CREATE OR REPLACE VIEW user_enrollment_timeline AS
SELECT
  e.id              AS enrollment_id,
  e.user_id,
  e.cohort_id,
  c.adventure_id,
  c.title           AS cohort_title,
  c.location,
  c.start_date,
  c.end_date,
  c.status          AS cohort_status,
  e.status          AS enrollment_status,
  e.payment_status,
  e.amount_paid_cents,
  e.currency,
  e.paid_at,
  e.enrolled_at,
  i.id              AS instructor_id,
  i.name            AS instructor_name,
  CASE
    WHEN e.status = 'cancelled'                          THEN 'cancelled'
    WHEN e.status = 'completed'                          THEN 'completed'
    WHEN c.status = 'completed'                          THEN 'completed'
    WHEN c.end_date   IS NOT NULL AND c.end_date   < CURRENT_DATE THEN 'completed'
    WHEN c.start_date IS NOT NULL
         AND c.start_date <= CURRENT_DATE
         AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE) THEN 'doing'
    WHEN e.payment_status = 'paid'                       THEN 'planning'
    WHEN e.status IN ('enrolled', 'pending')             THEN 'planning'
    ELSE 'pending'
  END AS timeline_status
FROM enrollments e
JOIN cohorts c    ON c.id = e.cohort_id
LEFT JOIN instructors i ON i.id = c.instructor_id;

GRANT SELECT ON user_enrollment_timeline TO authenticated;


-- =====================================================
-- 3) COHORT MESSAGES — group chat for paid cohort members
-- =====================================================
CREATE TABLE IF NOT EXISTS cohort_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),

  -- 'text' is normal chat. 'system' is auto-generated (joins/leaves).
  -- 'announcement' is instructor-flagged broadcast.
  message_type TEXT DEFAULT 'text'
    CHECK (message_type IN ('text', 'system', 'announcement')),

  reply_to_id UUID REFERENCES cohort_messages(id) ON DELETE SET NULL,

  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohort_messages_cohort_created
  ON cohort_messages(cohort_id, created_at DESC);

ALTER TABLE cohort_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a member of this cohort (instructor or paid student)?
CREATE OR REPLACE FUNCTION is_cohort_member(p_cohort_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cohorts c
    JOIN instructors i ON i.id = c.instructor_id
    WHERE c.id = p_cohort_id AND i.user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.cohort_id = p_cohort_id
      AND e.user_id = p_user_id
      AND e.payment_status = 'paid'
      AND e.status IN ('enrolled', 'completed', 'pending')
  );
END;
$$;

-- Members read messages
CREATE POLICY "Cohort members read messages"
  ON cohort_messages FOR SELECT
  USING (is_cohort_member(cohort_id, auth.uid()));

-- Members post messages (and the message must be authored by them)
CREATE POLICY "Cohort members post messages"
  ON cohort_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_cohort_member(cohort_id, auth.uid())
  );

-- Author can edit their own message (only the body — message_type stays put)
CREATE POLICY "Author can edit own message"
  ON cohort_messages FOR UPDATE
  USING (user_id = auth.uid());

-- Author can delete their own message
CREATE POLICY "Author can delete own message"
  ON cohort_messages FOR DELETE
  USING (user_id = auth.uid());

-- Realtime: stream new messages to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE cohort_messages;


-- =====================================================
-- 4) GET_COHORT_MEMBERS RPC — roster for the chat sidebar
-- =====================================================
-- SECURITY DEFINER, but the function refuses to return rows
-- unless the caller is themselves a member of the cohort.
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

  -- Student rows (paid only — pre-paid 'pending' shown so checkout flow lands here)
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
END;
$$;

GRANT EXECUTE ON FUNCTION get_cohort_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_cohort_member(UUID, UUID) TO authenticated;
