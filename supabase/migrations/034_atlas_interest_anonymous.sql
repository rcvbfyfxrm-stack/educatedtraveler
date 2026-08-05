-- =====================================================
-- 034: ATLAS INTEREST — anonymous, and counting every craft a member named
-- =====================================================
-- Replaces public.atlas_interest() from migration 033. Two changes, both
-- asked for by Arnaud on 2026-08-05:
--
-- 1. ANONYMOUS. 033 published up to three FIRST names per craft. It no longer
--    reads names at all — not "hides" them, does not read them. The `names`
--    column stays in the signature (returning NULL) only so the return type is
--    unchanged and no client breaks. The page now says "One member of the
--    Circle wants this one" / "N members of the Circle want this one".
--    Do not put names back without asking him again.
--
-- 2. COUNT EVERY CRAFT A MEMBER NAMED, not just the one in their letter.
--    033 only read {kind:'discipline'} objects, which is the shape /circle and
--    the /browse letter write. Members who came in through the homepage, the
--    old orb or the intent forms have their crafts stored as PLAIN STRINGS,
--    and the oldest profiles store them as {category:[...]}. Those people were
--    silently counted as interested in nothing. All three shapes now count —
--    the same shapes notify-lead already parses.
--
--    Deliberately NOT counted: {kind:'mastery'}.skill is what someone ALREADY
--    masters, not something they want to learn. Counting it would make the
--    line untrue.
--
-- launch_waitlist SELECT stays admin-only (migration 019). This SECURITY
-- DEFINER function still exposes nothing but a craft name and a headcount.
--
-- NOTE: migrations are NOT auto-applied to prod — run this via
--   supabase db query --linked --yes -f supabase/migrations/034_atlas_interest_anonymous.sql
-- If it errors, 033's version simply stays live — no downtime, no half-state.

create or replace function public.atlas_interest()
returns table (discipline text, learners integer, names text[])
language sql
security definer
set search_path = public
stable
as $$
  with src as (
    select
      lower(trim(w.email)) as em,
      case
        when jsonb_typeof(w.interests) = 'array' then w.interests
        -- oldest shape: {category:[...], category:[...]} → flatten the values
        when jsonb_typeof(w.interests) = 'object' then (
          select coalesce(jsonb_agg(v), '[]'::jsonb)
          from jsonb_each(w.interests) e
          cross join lateral jsonb_array_elements(
            case when jsonb_typeof(e.value) = 'array' then e.value else '[]'::jsonb end
          ) v
        )
        else '[]'::jsonb
      end as items
    from public.launch_waitlist w
    where coalesce(w.unsubscribed, false) = false
      and w.email is not null
  ),
  exploded as (
    select s.em, i
    from src s
    cross join lateral jsonb_array_elements(s.items) i
  ),
  crafts as (
    -- "Freediving"                                    homepage / orb / intent forms
    select em, nullif(trim(i #>> '{}'), '') as craft
    from exploded where jsonb_typeof(i) = 'string'
    union all
    -- {kind:'discipline', discipline:'Freediving'}    /circle and the /browse letter
    select em, nullif(trim(i ->> 'discipline'), '')
    from exploded where jsonb_typeof(i) = 'object' and i ->> 'kind' = 'discipline'
    union all
    -- {kind:'discipline', discipline:null, open:'…'}  a craft not yet in the Atlas
    select em, nullif(trim(i ->> 'open'), '')
    from exploded where jsonb_typeof(i) = 'object' and i ->> 'kind' = 'discipline'
  ),
  -- one person counts once per craft, however many rows or surfaces they came through
  per_person as (
    select distinct em, craft from crafts where craft is not null
  )
  select
    craft as discipline,
    count(*)::integer as learners,
    null::text[] as names
  from per_person
  group by craft;
$$;

comment on function public.atlas_interest() is
  'Public, anonymous read of Circle interest per craft: craft name + headcount only. Never names, emails or letters. Counts every craft a member named on any surface. Powers the interest line on /browse.';

revoke all on function public.atlas_interest() from public;
grant execute on function public.atlas_interest() to anon, authenticated;
