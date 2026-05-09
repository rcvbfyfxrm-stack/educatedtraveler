-- =====================================================
-- 006_stripe.sql — Stripe Connect + payments
-- =====================================================
-- Adds: instructor Connect account, enrollment payment tracking,
-- and an audit-trail payments table.
-- Run AFTER 005_profile_extended_columns.sql.

-- -----------------------------------------------------
-- instructors: Stripe Connect account
-- -----------------------------------------------------
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_onboarded_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_stripe_account_id
  ON instructors(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- -----------------------------------------------------
-- enrollments: payment tracking
-- -----------------------------------------------------
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT
    DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Allow waitlisted/pending enrollments to be created during checkout
-- so the new 'pending' state is permitted.
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('pending', 'enrolled', 'waitlisted', 'cancelled', 'completed'));

CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status
  ON enrollments(payment_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_stripe_session_id
  ON enrollments(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- -----------------------------------------------------
-- payments: audit trail for every Stripe event we record
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,

  stripe_event_id TEXT UNIQUE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_account_id TEXT,         -- destination account (instructor)

  event_type TEXT NOT NULL,        -- checkout.session.completed, charge.refunded, etc.
  amount_cents INTEGER NOT NULL,
  application_fee_cents INTEGER,   -- platform fee
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,            -- succeeded, refunded, failed, pending

  customer_email TEXT,
  raw JSONB,                       -- full event payload for forensics

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_cohort_id ON payments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_payments_instructor_id ON payments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_type ON payments(event_type);

-- -----------------------------------------------------
-- RLS: payments
-- -----------------------------------------------------
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Students see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Instructors see payments for their cohorts
CREATE POLICY "Instructors can view cohort payments" ON payments
  FOR SELECT USING (
    instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  );

-- Only the service role (used by stripe-webhook) writes. No INSERT/UPDATE
-- policy is defined on purpose — service role bypasses RLS.

-- -----------------------------------------------------
-- View: instructor cohort revenue summary
-- Used by the Payments panel in instructor-dashboard.html
-- -----------------------------------------------------
CREATE OR REPLACE VIEW instructor_cohort_revenue AS
SELECT
  c.id                                            AS cohort_id,
  c.instructor_id,
  c.title,
  c.price_cents,
  c.start_date,
  c.end_date,
  COUNT(*) FILTER (WHERE e.payment_status = 'paid')           AS paid_count,
  COUNT(*) FILTER (WHERE e.payment_status = 'pending')        AS pending_count,
  COUNT(*) FILTER (WHERE e.payment_status = 'refunded')       AS refunded_count,
  COALESCE(SUM(e.amount_paid_cents) FILTER (WHERE e.payment_status = 'paid'), 0) AS gross_cents,
  -- 10% platform fee. Adjust here if pricing changes.
  COALESCE(SUM(e.amount_paid_cents) FILTER (WHERE e.payment_status = 'paid'), 0) * 9 / 10 AS payout_cents
FROM cohorts c
LEFT JOIN enrollments e ON e.cohort_id = c.id
GROUP BY c.id;

GRANT SELECT ON instructor_cohort_revenue TO authenticated;
