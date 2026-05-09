-- =====================================================
-- 007_instructor_workflow.sql
-- Cohort review workflow + instructor↔ET messaging
-- =====================================================

-- -----------------------------------------------------
-- cohorts: add pending_review + change_request_note
-- -----------------------------------------------------
ALTER TABLE cohorts DROP CONSTRAINT IF EXISTS cohorts_status_check;
ALTER TABLE cohorts ADD CONSTRAINT cohorts_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'full', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;          -- admin's note when bouncing back

-- -----------------------------------------------------
-- instructor_messages: paper trail of change requests + ET ↔ instructor comms
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS instructor_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  from_role TEXT NOT NULL CHECK (from_role IN ('instructor', 'admin', 'system')),
  topic TEXT NOT NULL CHECK (topic IN (
    'cohort_dates', 'cohort_price', 'cohort_capacity', 'cohort_description',
    'profile_bio', 'page_content', 'payments_payouts', 'student_question', 'other',
    'cohort_submitted', 'cohort_approved', 'cohort_changes_requested'
  )),
  subject TEXT,
  body TEXT NOT NULL,
  read_by_admin_at TIMESTAMPTZ,
  read_by_instructor_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_messages_instructor_id ON instructor_messages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_messages_cohort_id ON instructor_messages(cohort_id);
CREATE INDEX IF NOT EXISTS idx_instructor_messages_created_at ON instructor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_messages_unread_admin
  ON instructor_messages(created_at DESC)
  WHERE read_by_admin_at IS NULL AND from_role = 'instructor';

-- -----------------------------------------------------
-- RLS
-- -----------------------------------------------------
ALTER TABLE instructor_messages ENABLE ROW LEVEL SECURITY;

-- Instructors see their own thread
CREATE POLICY "Instructors view own messages" ON instructor_messages
  FOR SELECT USING (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

-- Instructors can write messages from their own role
CREATE POLICY "Instructors send messages" ON instructor_messages
  FOR INSERT WITH CHECK (
    from_role = 'instructor'
    AND instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

-- Instructors can mark messages as read
CREATE POLICY "Instructors mark read" ON instructor_messages
  FOR UPDATE USING (
    instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
  );

-- Admins see and write everything
CREATE POLICY "Admins read all messages" ON instructor_messages
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins write messages" ON instructor_messages
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins update messages" ON instructor_messages
  FOR UPDATE USING (is_admin());
