-- 040 — Arnaud must receive the LETTER, not a notice that a row changed.
--
-- Two separate silences, both hit on 10 Aug 2026 when Arnault Schick filled the
-- /portrait questionnaire and wrote a real letter. Arnaud saw nothing worth
-- opening and asked why he had received no email.
--
-- (1) trg_notify_lead_on_signup carried a WHEN guard excluding
--     'portrait-questionnaire'. That guard was added live and was NEVER in a
--     migration — the repo showed 024's unguarded version while prod ran a
--     guarded one, so reading the repo gave the wrong answer about production.
--     The exclusion was correct for 'portrait-continuation' (that person already
--     notified from their /circle row) but wrong for 'portrait-questionnaire',
--     which is someone arriving at /portrait directly. Those are the people who
--     write the longest answers, and they were the only ones reaching him
--     silently. 'account-signup' stays excluded: the profiles triggers already
--     cover it, and including it here would mail him twice for one act.
--
-- (2) send-welcome-email (the profile-filled notice) queried
--     interests/skills/what_matters/profession/location/completion_pct and NOT
--     dream_letter — so the one email that did arrive said "Profile filled in"
--     without a word the person had written. Fixed in the function, not here:
--     dream_letter + the questionnaire fields (status, previous_experience,
--     availability, preferred_duration, reach) are now selected and rendered,
--     and the subject gains " · with a letter" when there is one to read.
--
-- Applied to prod 2026-08-10 and verified end to end: a portrait-questionnaire
-- insert fired notify-lead (200, emailed arnaudcallier@pm.me, dream rendered),
-- and Arnault's notice was replayed through the fixed function and landed in
-- the Proton INBOX carrying his full letter.

drop trigger if exists trg_notify_lead_on_signup on public.launch_waitlist;

create trigger trg_notify_lead_on_signup
  after insert on public.launch_waitlist
  for each row
  when (coalesce(new.source, '') <> all (array['portrait-continuation', 'account-signup']))
  execute function public.notify_lead_on_signup();

-- NB: trg_welcome_lead_on_signup is deliberately NOT touched. It still excludes
-- 'portrait-questionnaire' and 'portrait-continuation', because those rows are
-- data carriers — mailing a welcome to them would write to people who are mid-
-- flow, or to an address that was only ever a carrier. This migration changes
-- who notifies ARNAUD, never who receives mail.
