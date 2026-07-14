-- 023: the member's "letter back" after sealing a portrait is sent ONCE.
-- notify-portrait stamps this after a successful send; a re-sealed portrait
-- re-notifies Arnaud but never re-welcomes the member.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portrait_welcomed_at timestamptz;
