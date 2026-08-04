-- 032 — welcome the people who create an ACCOUNT without going through /circle.
--
-- The hole (found 2026-08-03, paid for by Jean Charles):
--   launch_waitlist INSERT -> trg_welcome_lead_on_signup -> circle-welcome  ✅ letter
--   profiles       INSERT -> on_profile_created_welcome_email               ❌ notifies
--                                                                             Arnaud ONLY
-- send-welcome-email's user-facing half ("Your adventure matches are saved")
-- was retired on 2026-07-22 as stale quest-era copy, on the assumption that
-- "new joiners already get the circle-welcome letter". True only of the /circle
-- funnel. Anyone who signs in directly has since received nothing at all:
-- Jean Charles signed up 25 Jul, filled ten crafts on 28 Jul, and was never
-- written to until Arnaud sent a letter by hand on 2026-08-03.
--
-- The fix, deliberately NOT a new email path: give the new member a real
-- launch_waitlist row (source 'account-signup'). The existing 025 trigger then
-- does the welcoming, which means one welcome implementation, a real
-- unsubscribe_token, a real welcomed_at stamp, and membership of the Circle
-- audience for future letters — all of which an account-direct member also
-- lacked. No edge function changes, so nothing here needs `functions deploy`
-- (checklist #21).
--
-- Apply by hand — migrations are NOT auto-applied (checklist #3):
--   supabase db query --linked --yes -f supabase/migrations/032_welcome_account_signups.sql

create or replace function public.welcome_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A welcome must never block a sign-up: everything below is advisory.
  begin
    -- Already in the Circle audience? Then 025 has welcomed them, or is about
    -- to. Carrier sources ('portrait-continuation', 'portrait-questionnaire')
    -- are trigger-silent data rows (029) carrying unsubscribed:true, so they do
    -- NOT count as an audience row — a /portrait carrier must still fall
    -- through to a real welcome here.
    --
    -- The welcomed_at half is belt and braces against the request-time race in
    -- checklist #15: signInWithOtp creates the auth user (and so the profile)
    -- at OTP-REQUEST time, which can land either side of the surface inserting
    -- its own waitlist row.
    if exists (
      select 1 from public.launch_waitlist w
      where lower(w.email) = lower(new.email)
        and (
          w.welcomed_at is not null
          or coalesce(w.source, '') not in ('portrait-continuation', 'portrait-questionnaire')
        )
    ) then
      return new;
    end if;

    insert into public.launch_waitlist (email, source, interests)
    values (new.email, 'account-signup', '[]'::jsonb);
  exception when others then
    raise warning 'welcome_profile_on_signup failed for %: %', new.email, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_profile_created_welcome on public.profiles;

-- Postgres forbids subqueries in a trigger WHEN clause, so the audience check
-- lives in the function above. WHEN keeps the cheap scalar guards:
--   * email present   — profiles rows come from handle_new_user via auth.users,
--                       but do not assume it.
--   * not a test box  — E2E runs create @example.com accounts; letting those
--                       send would bounce and cost real domain reputation.
create trigger on_profile_created_welcome
after insert on public.profiles
for each row
when (
  new.email is not null
  and btrim(new.email) <> ''
  and lower(new.email) not like '%@example.com'
  and lower(new.email) not like '%@example.org'
)
execute function public.welcome_profile_on_signup();

-- Arnaud already gets "New adventurer: <name>" from send-welcome-email for this
-- exact person, so suppress notify-lead's "New Circle signup" for the row we
-- just created — one act, one sheet. The welcome trigger (025) is deliberately
-- NOT given the same exclusion: sending that letter is the entire point.
drop trigger if exists trg_notify_lead_on_signup on public.launch_waitlist;
create trigger trg_notify_lead_on_signup
  after insert on public.launch_waitlist
  for each row
  when (coalesce(NEW.source, '') not in ('portrait-continuation', 'portrait-questionnaire', 'account-signup'))
  execute function public.notify_lead_on_signup();
