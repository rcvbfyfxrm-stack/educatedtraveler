-- =====================================================
-- 019_installments_confirmation.sql
-- Installment payments (1/3 deposit + balance) + instructor
-- confirmation gate for cohort enrollments.
-- =====================================================
-- Booking now runs through the server-side PayPal Orders v2 flow
-- (paypal-create-order / paypal-capture-order). A capture no longer
-- marks a student 'enrolled' directly — it parks them in
-- 'awaiting_confirmation' until the instructor confirms (one-click
-- email link or dashboard button). Students may pay the full price or
-- a 1/3 deposit now with the balance due >= 1 month before start.
--
-- Run AFTER 018_security_fixes.sql (which creates profiles.is_admin, used by
-- is_cohort_member below).

-- -----------------------------------------------------
-- 1) Widen the status check constraints
-- -----------------------------------------------------
-- enrollment lifecycle now includes the confirmation gate.
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN (
    'pending',                -- order created, not yet paid
    'awaiting_confirmation',  -- paid (deposit or full), waiting on the instructor
    'enrolled',               -- instructor confirmed the seat
    'waitlisted',
    'cancelled',
    'declined',               -- instructor declined the booking (refund handled manually)
    'completed'
  ));

-- payment_status gains 'deposit_paid' for the installment plan.
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_payment_status_check
  CHECK (payment_status IN (
    'unpaid', 'pending', 'deposit_paid', 'paid', 'refunded', 'failed'
  ));

-- -----------------------------------------------------
-- 2) Installment + confirmation columns
-- -----------------------------------------------------
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS payment_plan TEXT DEFAULT 'full'
    CHECK (payment_plan IN ('full', 'installment')),
  ADD COLUMN IF NOT EXISTS price_total_cents INTEGER,   -- price snapshot at booking
  ADD COLUMN IF NOT EXISTS deposit_cents INTEGER,        -- amount charged up front
  ADD COLUMN IF NOT EXISTS balance_cents INTEGER,        -- remaining owed (0 when settled)
  ADD COLUMN IF NOT EXISTS balance_due_date DATE,        -- start_date - 1 month
  ADD COLUMN IF NOT EXISTS balance_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirm_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paypal_balance_order_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_balance_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS student_notes TEXT,           -- "notes for the instructor"
  ADD COLUMN IF NOT EXISTS addons JSONB;                 -- add-ons of interest

-- A volatile default (gen_random_uuid) rewrites the table and assigns a
-- distinct value to each existing row, but backfill explicitly to be safe.
UPDATE enrollments SET confirm_token = gen_random_uuid() WHERE confirm_token IS NULL;

-- Backfill amount columns for pre-existing enrollments (all treated as 'full').
UPDATE enrollments e
SET price_total_cents = COALESCE(e.amount_paid_cents, c.price_cents),
    deposit_cents     = COALESCE(e.amount_paid_cents, c.price_cents),
    balance_cents     = 0,
    payment_plan      = COALESCE(e.payment_plan, 'full')
FROM cohorts c
WHERE c.id = e.cohort_id
  AND e.price_total_cents IS NULL;

-- -----------------------------------------------------
-- 3) Indexes
-- -----------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_confirm_token
  ON enrollments(confirm_token)
  WHERE confirm_token IS NOT NULL;

-- Drives the daily send-balance-reminders sweep.
CREATE INDEX IF NOT EXISTS idx_enrollments_balance_due
  ON enrollments(balance_due_date)
  WHERE payment_status = 'deposit_paid' AND balance_reminder_sent_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_paypal_balance_order_id
  ON enrollments(paypal_balance_order_id)
  WHERE paypal_balance_order_id IS NOT NULL;

-- -----------------------------------------------------
-- 4) user_enrollment_timeline — surface 'awaiting' + installment fields
--    (supersedes the definition in 013_cohort_community.sql)
-- -----------------------------------------------------
-- CREATE OR REPLACE VIEW cannot reorder/insert columns in the existing
-- leading set, so drop first (only a GRANT depends on it).
DROP VIEW IF EXISTS user_enrollment_timeline;
CREATE VIEW user_enrollment_timeline AS
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
  e.payment_plan,
  e.amount_paid_cents,
  e.price_total_cents,
  e.balance_cents,
  e.balance_due_date,
  e.currency,
  e.paid_at,
  e.enrolled_at,
  i.id              AS instructor_id,
  i.name            AS instructor_name,
  CASE
    WHEN e.status = 'cancelled'                          THEN 'cancelled'
    WHEN e.status = 'declined'                           THEN 'cancelled'
    -- An unconfirmed booking stays 'awaiting' regardless of the calendar —
    -- it must never read as enrolled/in-progress before the instructor acts.
    WHEN e.status = 'awaiting_confirmation'              THEN 'awaiting'
    WHEN e.status = 'completed'                          THEN 'completed'
    WHEN c.status = 'completed'                          THEN 'completed'
    WHEN c.end_date   IS NOT NULL AND c.end_date   < CURRENT_DATE THEN 'completed'
    WHEN c.start_date IS NOT NULL
         AND c.start_date <= CURRENT_DATE
         AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE) THEN 'doing'
    WHEN e.payment_status IN ('paid', 'deposit_paid')    THEN 'planning'
    WHEN e.status IN ('enrolled', 'pending')             THEN 'planning'
    ELSE 'pending'
  END AS timeline_status
FROM enrollments e
JOIN cohorts c    ON c.id = e.cohort_id
LEFT JOIN instructors i ON i.id = c.instructor_id
-- Hide abandoned checkouts (order created, never paid) so they don't show as
-- a phantom 'Planning to do' card and block re-booking the same cohort.
WHERE NOT (e.status = 'pending' AND e.payment_status = 'pending');

GRANT SELECT ON user_enrollment_timeline TO authenticated;

-- -----------------------------------------------------
-- 5) instructor_cohort_revenue — count deposits as collected
--    (supersedes the definition in 006_stripe.sql)
-- -----------------------------------------------------
-- Drop first: the new column order can't be applied via CREATE OR REPLACE.
DROP VIEW IF EXISTS instructor_cohort_revenue;
CREATE VIEW instructor_cohort_revenue AS
SELECT
  c.id                                            AS cohort_id,
  c.instructor_id,
  c.title,
  c.price_cents,
  c.start_date,
  c.end_date,
  COUNT(*) FILTER (WHERE e.payment_status = 'paid')          AS paid_count,
  COUNT(*) FILTER (WHERE e.payment_status = 'deposit_paid')  AS deposit_count,
  COUNT(*) FILTER (WHERE e.payment_status = 'pending')       AS pending_count,
  COUNT(*) FILTER (WHERE e.payment_status = 'refunded')      AS refunded_count,
  COUNT(*) FILTER (WHERE e.status = 'awaiting_confirmation') AS awaiting_count,
  -- Cash actually collected = full payments + deposits.
  COALESCE(SUM(e.amount_paid_cents) FILTER (WHERE e.payment_status IN ('paid', 'deposit_paid')), 0) AS gross_cents,
  -- Still owed on deposit-only enrollments.
  COALESCE(SUM(e.balance_cents)     FILTER (WHERE e.payment_status = 'deposit_paid'), 0)            AS outstanding_cents,
  -- 10% platform fee; Arnaud pays instructors out manually under PayPal direct.
  COALESCE(SUM(e.amount_paid_cents) FILTER (WHERE e.payment_status IN ('paid', 'deposit_paid')), 0) * 9 / 10 AS payout_cents
FROM cohorts c
LEFT JOIN enrollments e ON e.cohort_id = c.id
GROUP BY c.id;

GRANT SELECT ON instructor_cohort_revenue TO authenticated;

-- -----------------------------------------------------
-- 6) is_cohort_member — confirmed students (incl. deposit-only) get chat
--    (supersedes the definition in 016_admin_chat_access.sql)
-- -----------------------------------------------------
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

  -- Confirmed student who has paid at least a deposit
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.cohort_id = p_cohort_id
      AND e.user_id = p_user_id
      AND e.payment_status IN ('deposit_paid', 'paid')
      AND e.status IN ('enrolled', 'completed')
  );
END;
$$;

-- get_cohort_members student rows must match the widened membership rule.
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

  -- Student rows (confirmed + at least a deposit paid)
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
      COALESCE(e.confirmed_at, e.paid_at, e.enrolled_at) AS joined_at
    FROM enrollments e
    JOIN profiles p ON p.id = e.user_id
    WHERE e.cohort_id = p_cohort_id
      AND e.payment_status IN ('deposit_paid', 'paid')
      AND e.status IN ('enrolled', 'completed')
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
          AND e.payment_status IN ('deposit_paid', 'paid')
      );
END;
$$;

GRANT EXECUTE ON FUNCTION is_cohort_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cohort_members(UUID) TO authenticated;
