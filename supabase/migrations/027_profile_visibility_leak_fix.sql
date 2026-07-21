-- 027 — Close two profile-visibility leaks (trust fix, 2026-07-21)
--
-- Direct reads of `profiles` are already correct: RLS gates SELECT to
-- public / own / shared-cohort / admin. The leaks were in two RLS-bypassing
-- paths that keyed off the legacy `visible` boolean (which the dashboard
-- editor sets TRUE for BOTH 'public' AND 'cohort') or off nothing at all:
--
--   1. get_community_for_adventure (SECURITY DEFINER) returned rich cards for
--      `p.visible = true` — so a 'cohort' (classmates-only) member who
--      expressed interest was shown to ANY caller of that adventure roster,
--      not just classmates.
--   2. community_sidebar_profiles (view, no security_invoker) bypassed RLS and
--      exposed name / first_name / location / avatar of EVERY profile — incl.
--      private ones — to anon.  (Verified: anon saw 8 rows, 6 of them private.)
--
-- Fix: the roster shows only members who chose 'public' (cohort members
-- connect through their cohort, which is RLS-enforced; private never appear);
-- the view now runs security-invoker so it honors the profiles RLS.

-- 1) adventure community roster: respect the visibility contract, not `visible`
CREATE OR REPLACE FUNCTION public.get_community_for_adventure(p_adventure_id text)
 RETURNS TABLE(user_id uuid, first_name text, name text, location text, about text, avatar_url text, profession text, previous_experience text, skills text, what_matters text, interests jsonb, interested_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      p.id AS user_id,
      p.first_name,
      p.name,
      p.location,
      p.about,
      p.avatar_url,
      p.profession,
      p.previous_experience,
      p.skills,
      p.what_matters,
      p.interests,
      ei.created_at AS interested_at
    FROM experience_interests ei
    JOIN profiles p ON p.id = ei.user_id
    WHERE ei.adventure_id = p_adventure_id
      AND ei.status = 'interested'
      AND p.visibility = 'public'   -- was: p.visible = true
    ORDER BY ei.created_at ASC;
END;
$function$;

-- 2) sidebar view must honor RLS (anon -> public only; classmates -> shared cohort)
ALTER VIEW public.community_sidebar_profiles SET (security_invoker = true);
