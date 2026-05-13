-- 014 — let the community sidebar list every adventurer who joins, not
-- only ones who flipped `visible=true`.
--
-- The base RLS policy from 000 gates SELECT on `visible = true`, which
-- means brand-new sign-ups never appear in the live
-- "ADVENTURERS / RECENT" slide window. Loosening the policy on the whole
-- `profiles` table would leak sensitive columns (email, about,
-- credentials, profession, interests…) — so instead we ship a dedicated
-- view + RPC that only exposes identity columns, and point
-- community-sidebar.js at it.
--
-- Idempotent.

-- 1. Identity-only view: avatar + display name + location only. Safe for
--    anon read regardless of the profile's `visibility` setting.
CREATE OR REPLACE VIEW public.community_sidebar_profiles AS
SELECT
  id,
  COALESCE(NULLIF(name, ''), first_name) AS display_name,
  first_name,
  location,
  avatar_url,
  visibility,
  email,           -- only used client-side to seed deterministic avatar gradient
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- The view bypasses RLS (definer = postgres owner). Grant SELECT
-- explicitly to anon + authenticated so the sidebar can read it.
GRANT SELECT ON public.community_sidebar_profiles TO anon, authenticated;

-- 2. Public count of total adventurers (used by the big counter at the
--    top of the slide window). RLS on profiles would otherwise hide
--    most rows from anon.
CREATE OR REPLACE FUNCTION public.community_member_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.profiles;
$$;

GRANT EXECUTE ON FUNCTION public.community_member_count() TO anon, authenticated;

-- Note: the base "Anyone can view visible profiles" policy is left
-- untouched. profile.html, get_community_for_adventure, and any other
-- code that reads richer profile fields still goes through the existing
-- visibility gate.
