-- 021_circle_newsletter.sql
-- The Circle newsletter sender: unsubscribe + send-tracking on launch_waitlist.
-- Additive and idempotent. The table is the owned Circle list (see CLAUDE.md).

ALTER TABLE public.launch_waitlist
  ADD COLUMN IF NOT EXISTS unsubscribed       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsubscribe_token  UUID    NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS welcomed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_issue         TEXT;

-- one-click unsubscribe link target
CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_waitlist_unsub_token
  ON public.launch_waitlist (unsubscribe_token);

-- fast "who still gets letters" lookups
CREATE INDEX IF NOT EXISTS idx_launch_waitlist_active
  ON public.launch_waitlist (unsubscribed, created_at DESC);

-- NOTE: RLS already restricts SELECT to admins (migration 019). The Edge
-- Functions use the service role and bypass RLS, so no policy change is needed.
