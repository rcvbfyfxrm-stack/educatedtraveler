-- =====================================================
-- 010_paypal.sql — PayPal direct-to-platform checkout
-- =====================================================
-- Adds PayPal Orders v2 tracking columns alongside the existing
-- Stripe columns (kept dormant for future re-enablement) and a
-- `provider` discriminator on the payments audit table.
-- Run AFTER 009_instructor_course_slug.sql.

-- -----------------------------------------------------
-- enrollments: PayPal order tracking
-- -----------------------------------------------------
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_payer_email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_paypal_order_id
  ON enrollments(paypal_order_id)
  WHERE paypal_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_paypal_capture_id
  ON enrollments(paypal_capture_id)
  WHERE paypal_capture_id IS NOT NULL;

-- -----------------------------------------------------
-- payments: provider discriminator + PayPal columns
-- -----------------------------------------------------
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'paypal')),
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paypal_capture_id
  ON payments(paypal_capture_id)
  WHERE paypal_capture_id IS NOT NULL;

-- The existing payments.stripe_event_id UNIQUE handles Stripe idempotency.
-- For PayPal we rely on paypal_capture_id UNIQUE (above) for the same role.
