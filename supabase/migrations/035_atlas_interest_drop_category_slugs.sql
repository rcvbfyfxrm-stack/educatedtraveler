-- =====================================================
-- 035: ATLAS INTEREST — a category is not a craft
-- =====================================================
-- Correction to 034, found by reading its actual output rather than trusting it.
--
-- 034 started counting interests stored as PLAIN STRINGS, on the assumption
-- that the homepage / old orb / intent forms wrote craft names that way. They
-- didn't — they wrote the WORLD, not the craft. So the function began
-- reporting "ocean", "healing" and "wild" as though they were crafts people
-- wanted to learn. No Atlas card carries those names, so nothing wrong ever
-- reached the page, but a public endpoint should not be handing out three
-- invented crafts.
--
-- Honest scorecard for 034, now that its output has been read: of the two
-- shapes it added, the BARE-STRING one recovered nothing real — those legacy
-- rows hold worlds, not crafts, so nobody was undercounted there after all.
-- The other addition, {kind:'discipline', open:'…'}, DOES earn its keep: it
-- surfaces the craft a member typed in their own words when the Atlas had no
-- entry for it, which 033 dropped on the floor. Keep that branch.
--
-- (Counts also moved between the two reads because a real /circle signup
-- landed mid-check. Don't read a count change as proof a parser change worked
-- — this table is live.)
--
-- The rule: a plain string only counts if it contains a capital letter. Every
-- discipline in the Atlas is capitalised ("Freediving", "New Basque Cuisine");
-- the legacy world slugs are lowercase. Free text a member typed themselves
-- still counts however they capitalised it — that arrives as
-- {kind:'discipline', open:'…'}, an object, and this rule only touches the
-- bare-string shape that caused the problem.
--
-- NOTE: migrations are NOT auto-applied to prod — run this via
--   supabase db query --linked --yes -f supabase/migrations/035_atlas_interest_drop_category_slugs.sql
-- If it errors, 034's version stays live — no downtime, no half-state.

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
        -- oldest shape: {world:[...], world:[...]} → flatten the values
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
    -- "Freediving"  — a bare string. Capitalised = a craft; lowercase = a
    -- legacy world slug ("ocean", "healing", "wild"), which is not a craft.
    select em, nullif(trim(i #>> '{}'), '') as craft
    from exploded
    where jsonb_typeof(i) = 'string'
      and trim(i #>> '{}') ~ '[A-Z]'
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
  'Public, anonymous read of Circle interest per craft: craft name + headcount only. Never names, emails or letters. Legacy world slugs are excluded — a category is not a craft. Powers the interest line on /browse.';

revoke all on function public.atlas_interest() from public;
grant execute on function public.atlas_interest() to anon, authenticated;
