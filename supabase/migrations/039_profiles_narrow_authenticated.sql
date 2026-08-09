-- 039 — One member can no longer read another member's email, phone or letter
--        (2026-08-08)
--
-- 038 closed the open-internet half: the anon key stopped returning contact details
-- and letters. This closes the other half. `authenticated` still held the same
-- table-wide SELECT, so ANY signed-in member could read the address and the private
-- letter of any member whose card is public — a smaller audience than the whole
-- internet, and exactly as wrong.
--
-- The same shape as 038, for the same reason: a column-level REVOKE cannot carve a
-- hole in a table-wide grant, so the grant goes and the safe columns come back.
--
-- WHY THIS COULD NOT SHIP WITH 038: a member must still read their OWN email and
-- their OWN letter, and the Studio must still read everyone's. Both now go through
-- functions instead of the table, and THAT CODE IS ALREADY LIVE (commit ac7e80f,
-- verified on educatedtraveler.app before this ran):
--   • get_my_profile()     — /you, /portrait, dashboard overlay, database.js,
--                            and the admin gates in admin.html and cmd.html
--   • admin_all_profiles() — the two admin listings that show every member's email
-- Running this before that deploy would have broken all of them at once.
--
-- Writes are untouched: INSERT and UPDATE are separate privileges. Verified that the
-- profile upserts on the seal path (portrait.html) and the dashboard do not chain
-- .select(), so supabase-js sends return=minimal and never asks to read back a
-- column this role can no longer see.

revoke select on public.profiles from authenticated;

grant select (
  id, name, xp, level, created_at, updated_at, whatsapp_opt_in, first_name, age,
  location, about, interests, credentials, existing_certs, fitness, comfort_zone,
  profession, adventure_years, previous_experience, skills, what_matters, languages,
  avatar_url, visible, day3_email_sent, day7_email_sent, welcome_email_sent,
  whatsapp_day1_sent, whatsapp_day3_sent, whatsapp_day7_sent, is_admin, visibility,
  profile_complete, status, availability, preferred_duration, completion_pct, reach,
  portrait_complete, portrait_completed_at, portrait_welcomed_at, budget, preferences
) on public.profiles to authenticated;

notify pgrst, 'reload schema';

-- ── AFTER THIS, THE PROMISE IS TRUE AT THE API, NOT ONLY IN THE INTERFACE ────
-- The letter a member writes to Arnaud is readable by Arnaud (service role, and the
-- Studio through admin_all_profiles) and by its own author (get_my_profile). Nobody
-- else — not the anon key, not another member. PORTRAIT-HANDOFF said "private to
-- Arnaud, no member-facing sharing" and /you deliberately never renders it back even
-- to the person who wrote it; until 038 and 039 that was an interface convention
-- sitting on top of an API that would hand it to anyone who asked.
--
-- STILL TRUE AND NOT ADDRESSED HERE: profiles.email is a copy of the auth address.
-- Edge functions read it with the service role and are unaffected.
