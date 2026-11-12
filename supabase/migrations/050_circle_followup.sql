-- Circle follow-up (12 Nov 2026): one per person, two days after the welcome.
alter table public.launch_waitlist add column if not exists followed_up_at timestamptz;
