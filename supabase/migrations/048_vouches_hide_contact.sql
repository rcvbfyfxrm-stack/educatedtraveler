-- 048: a school comment must not publish the address of the person who wrote it.
--
-- FOUND 5 Sept 2026 (THE CHECK, first run), before a single comment was approved.
-- 045 added `email` and `wants_circle` to public.vouches so an anonymous visitor
-- could leave a comment on a school and, separately, ask to join the Circle.
-- 046 then granted `select` on the WHOLE TABLE to anon so the public policy would
-- work at all. Those two together mean:
--
--   create policy "vouches_select_public" ... using (status='approved' and consent_public)
--
-- filters ROWS, not COLUMNS. So the moment Arnaud approves the first comment whose
-- writer ticked "publish", `GET /rest/v1/vouches?select=email` returns that address
-- to anyone holding the anon key — and the anon key ships in the page source, by
-- design. Verified on 5 Sept: `select=email` already answers 200 (0 rows today,
-- because nothing is approved yet). It is a hole with nothing in it, and the first
-- approval fills it.
--
-- ⚠ THE LESSON FROM 037 APPLIES AND IS WHY THIS IS SHAPED THIS WAY:
--   `revoke select (email) ...` is a SILENT NO-OP against a table-level grant.
--   Postgres privileges are additive; a column revoke only removes column grants.
--   So the table grant must be revoked FIRST, then the safe columns granted back.
--
-- ⚠ AND THE ORDER HAZARD: after this runs, `select=*` FAILS (42501) for the roles
--   below — it does not quietly omit the column. Every reader must name its
--   columns. Checked before writing this:
--     · js/school-note.js:251  select('school,what,display_name,trade,visited_on,created_at')  — safe
--     · js/vouch.js:138        select('destination,visited_on,status')                          — safe
--     · js/vouch.js:198        select('id')                                                     — safe
--     · admin.html:340         select('*')  ← WOULD BREAK. Moved to admin_all_vouches() in the
--                              same commit, matching what 038 did for profiles.
--
-- Apply (migrations are NOT auto-applied to prod), and PROVE it afterwards —
-- never trust the exit code, re-probe with the anon key:
--   supabase db query --linked --yes --dns-resolver https -f supabase/migrations/048_vouches_hide_contact.sql
--   curl -s -o /dev/null -w '%{http_code}' "$URL/rest/v1/vouches?select=email&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"   # expect 401/403
--   curl -s -o /dev/null -w '%{http_code}' "$URL/rest/v1/vouches?select=school&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"  # expect 200

-- 1 · Take back the table-wide grants that make a column revoke meaningless.
revoke select on public.vouches from anon;
revoke select on public.vouches from authenticated;

-- 2 · Give back exactly what the two public readers name, and nothing else.
--     `email` and `wants_circle` are absent on purpose: they are the writer's
--     contact details, not part of the comment.
grant select (
  id, user_id, destination, school, what, display_name, trade,
  visited_on, status, consent_public, created_at
) on public.vouches to anon;

grant select (
  id, user_id, destination, school, what, display_name, trade,
  visited_on, status, consent_public, created_at
) on public.vouches to authenticated;

-- 3 · The moderation screen legitimately needs the address — that is how Arnaud
--     answers someone who wrote about a school. Same shape as admin_all_profiles()
--     from 038: the gate is checked INSIDE the function, not left resting on a
--     table grant that every signed-in member shares.
create or replace function public.admin_all_vouches()
returns setof public.vouches
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select * from public.vouches order by created_at desc;
end;
$$;

revoke all on function public.admin_all_vouches() from public;
grant execute on function public.admin_all_vouches() to authenticated;
