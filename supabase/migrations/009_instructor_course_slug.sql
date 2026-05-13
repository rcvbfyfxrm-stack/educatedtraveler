-- =====================================================
-- 009_instructor_course_slug.sql
-- Per-instructor landing page. Signed-in instructors are
-- redirected to /{course_slug} (their course page) instead
-- of the generic /instructor-dashboard.
-- =====================================================

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS course_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_instructors_course_slug
  ON instructors(course_slug)
  WHERE course_slug IS NOT NULL;
