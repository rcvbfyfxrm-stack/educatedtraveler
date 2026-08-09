-- 038 — Actually close the anon leak, and lay the rail for the authenticated half
--        (2026-08-08)
--
-- ⚠ 037 IS SUPERSEDED AND WAS A NO-OP. It ran without error and changed nothing.
-- The reason is worth writing down, because it is the whole trick of this bug:
--
--     revoke select (email, phone, dream_letter) on profiles from anon;   -- did nothing
--
-- Postgres privileges are ADDITIVE, and `anon` holds a **table-level** SELECT grant
-- on public.profiles (confirmed in information_schema.role_table_grants). A
-- column-level REVOKE only removes column-level grants; it cannot carve a hole in a
-- table-wide one. Proof it was a no-op: after applying 037, the anon key still
-- returned every address, the phone number and the letter.
--
-- The shape that works is the inverse: drop the table-wide grant, then grant back
-- exactly the columns that are genuinely public.
--
-- The 43 columns below are every column of profiles EXCEPT email, phone and
-- dream_letter. Listing them explicitly (rather than granting the table and carving)
-- also means a NEW column is private by default: someone adding `passport_number`
-- next year has to come here and opt it in, instead of publishing it by accident.
-- That default is the point.

revoke select on public.profiles from anon;

grant select (
  id, name, xp, level, created_at, updated_at, whatsapp_opt_in, first_name, age,
  location, about, interests, credentials, existing_certs, fitness, comfort_zone,
  profession, adventure_years, previous_experience, skills, what_matters, languages,
  avatar_url, visible, day3_email_sent, day7_email_sent, welcome_email_sent,
  whatsapp_day1_sent, whatsapp_day3_sent, whatsapp_day7_sent, is_admin, visibility,
  profile_complete, status, availability, preferred_duration, completion_pct, reach,
  portrait_complete, portrait_completed_at, portrait_welcomed_at, budget, preferences
) on public.profiles to anon;

-- ── the rail for the second half ─────────────────────────────────────────────
-- `authenticated` still holds the same table-wide SELECT, so one member can still
-- read another public member's address and letter. Narrowing that role the same way
-- would also stop a member reading their OWN — /you and /portrait both need
-- dream_letter for the person who wrote it. So self-reads move here first.
--
-- Argument-free and keyed on auth.uid(): there is no parameter to tamper with, so
-- this can only ever return the caller's own row. Returns jsonb so the shape follows
-- the table without this function needing to be rewritten every time a column lands.
create or replace function public.get_my_profile()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select to_jsonb(p) from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- The Studio and admin surfaces (cmd.html, admin.html) read email across ALL
-- profiles. They run as `authenticated` with is_admin() true, so the same narrowing
-- would break them. This is their replacement: same data, but the gate is checked in
-- the function instead of resting on a table grant everyone shares.
create or replace function public.admin_all_profiles()
returns setof public.profiles
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select * from public.profiles order by created_at desc;
end;
$$;

revoke all on function public.admin_all_profiles() from public, anon;
grant execute on function public.admin_all_profiles() to authenticated;

-- PostgREST caches privileges; without this the change lands in the DB but the API
-- keeps answering from the old cache and the verification below lies to you.
notify pgrst, 'reload schema';

-- ── PROVE IT (anon key is public, safe to run) ───────────────────────────────
--   curl "$U/rest/v1/profiles?select=email"        -> 42501 permission denied
--   curl "$U/rest/v1/profiles?select=dream_letter" -> 42501 permission denied
--   curl "$U/rest/v1/profiles?select=*"            -> 42501 (select=* expands to all columns)
--   curl "$U/rest/v1/profiles?select=id,first_name,interests,location" -> 200 rows
--
-- NOT DONE HERE, deliberately: `authenticated` is untouched, so member-to-member
-- exposure remains until the site reads get_my_profile()/admin_all_profiles() and
-- 039 narrows that role too. Revoking it before the code ships would break /you,
-- /portrait, the dashboard and the Studio at once.
