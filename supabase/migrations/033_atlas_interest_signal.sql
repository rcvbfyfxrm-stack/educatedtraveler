-- =====================================================
-- 033: ATLAS INTEREST SIGNAL — "who from the Circle wants this craft"
-- =====================================================
-- /browse shows, on every skill card, how many people in the Circle have
-- already raised a hand for that craft — and their first names.
--
-- launch_waitlist SELECT is admin-only (migration 019) and stays that way.
-- This is a SECURITY DEFINER function: the ONLY thing it lets the public read
-- is (craft, how many, up to three first names). Never an email, never a
-- surname, never a letter, never a row id.
--
-- PRIVACY SWITCH — SHOW_NAMES IS OFF (Arnaud's call, 2026-08-05) ────────────
-- Joiners never explicitly agreed to have their first name shown on a public
-- page, and with one person per craft a first name isn't an aggregate — it's a
-- public statement about an identifiable person. So the function returns NULL
-- for names and the page says only how many. Flipping SHOW_NAMES back to true
-- publishes real first names; don't do it without asking the people in them.
-- ───────────────────────────────────────────────────────────────────────────
--
-- NOTE: migrations are NOT auto-applied to prod — run this via
--   supabase db query --linked --yes -f supabase/migrations/033_atlas_interest_signal.sql
-- Until it is run, /browse simply shows no interest lines (the client fails soft).

create or replace function public.atlas_interest()
returns table (discipline text, learners integer, names text[])
language sql
security definer
set search_path = public
stable
as $$
  with exploded as (
    select
      lower(trim(w.email)) as em,
      nullif(trim(i->>'discipline'), '') as disc,
      (
        select nullif(trim(p->>'name'), '')
        from jsonb_array_elements(
          case when jsonb_typeof(w.interests) = 'array' then w.interests else '[]'::jsonb end
        ) p
        where p->>'kind' = 'profile'
        limit 1
      ) as nm
    from public.launch_waitlist w
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(w.interests) = 'array' then w.interests else '[]'::jsonb end
    ) i
    where coalesce(w.unsubscribed, false) = false
      and w.email is not null
      and i->>'kind' = 'discipline'
  ),
  -- one person counts once per craft, however many times they joined
  per_person as (
    select em, disc, max(nm) as nm
    from exploded
    where disc is not null
    group by em, disc
  )
  select
    disc as discipline,
    count(*)::integer as learners,
    case when false                                 -- SHOW_NAMES ← OFF (Arnaud, 2026-08-05): the line stays anonymous
      then (
        array_agg(initcap(split_part(nm, ' ', 1)) order by initcap(split_part(nm, ' ', 1)))
          filter (where nullif(trim(split_part(coalesce(nm, ''), ' ', 1)), '') is not null)
      )[1:3]
      else null::text[]
    end as names
  from per_person
  group by disc;
$$;

comment on function public.atlas_interest() is
  'Public, privacy-capped read of Circle interest per craft: count + up to 3 first names. No emails, no surnames, no letters. Powers the interest line on /browse.';

revoke all on function public.atlas_interest() from public;
grant execute on function public.atlas_interest() to anon, authenticated;
