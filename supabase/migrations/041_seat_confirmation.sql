-- 041 — the seat ledger
--
-- Applied to the live project on 2026-08-17. Recorded here so the repo and the
-- database do not drift apart, which they already have once on this table.
--
-- Why these columns exist: no rail used by /pay tells the website that money
-- arrived. Revolut, PayPal and a bank transfer all settle somewhere the site
-- cannot see, so "he pressed I've sent it" is a claim, not a payment. These
-- three columns are where a claim becomes a fact, and only Arnaud can make
-- that happen — by looking at the account and pressing the button in the
-- seat email (function: seat-confirm).
--
-- seat_paid_at is therefore the ONLY honest answer to "how many seats are
-- paid" for the 15 September gate. Nothing else on this table means paid.
--
--   supabase db query --linked --yes "$(cat supabase/migrations/041_seat_confirmation.sql)"

alter table public.launch_waitlist
  add column if not exists seat_token    text,        -- minted service-side by notify-lead, never by the browser
  add column if not exists seat_paid_at  timestamptz, -- stamped only by seat-confirm, on Arnaud's confirmation
  add column if not exists seat_paid_eur integer;     -- what actually landed, in euros

-- One token, one seat. Partial so the column stays null for every non-seat row.
create unique index if not exists launch_waitlist_seat_token_idx
  on public.launch_waitlist (seat_token)
  where seat_token is not null;

-- The count that decides whether the week runs:
--   select count(*) from public.launch_waitlist where seat_paid_at is not null;
