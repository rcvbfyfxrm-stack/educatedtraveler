-- 028 — get_profile_classes: expose a member's classes on their crew card (2026-07-21)
--
-- A viewer can't read another member's experience_interests/enrollments directly
-- (owner-scoped RLS). This SECURITY DEFINER RPC returns a given profile's classes
-- (followed + joined) BUT only if that profile is visible to the caller — it mirrors
-- the profiles SELECT RLS exactly (public / self / shared-cohort). Anon (auth.uid()
-- null) therefore gets classes only for 'public' profiles. Private members' classes
-- are never exposed.

CREATE OR REPLACE FUNCTION public.get_profile_classes(p_profile_id uuid)
 RETURNS TABLE(adventure_id text, adventure_name text, kind text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- gate on visibility of the target profile to the caller (mirror profiles RLS)
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = p_profile_id
      AND (
        p.visibility = 'public'
        OR p.id = auth.uid()
        OR (p.visibility = 'cohort' AND p.id IN (
              SELECT e1.user_id FROM enrollments e1
              WHERE e1.status = 'enrolled'
                AND e1.cohort_id IN (
                  SELECT e2.cohort_id FROM enrollments e2
                  WHERE e2.user_id = auth.uid() AND e2.status = 'enrolled')))
      )
  ) THEN
    RETURN;  -- not visible to caller -> expose nothing
  END IF;

  RETURN QUERY
    SELECT ei.adventure_id, ei.adventure_name, 'interested'::text AS kind
    FROM experience_interests ei
    WHERE ei.user_id = p_profile_id AND ei.status = 'interested'
    UNION
    SELECT co.adventure_id, COALESCE(NULLIF(co.title,''), co.adventure_id), 'joined'::text AS kind
    FROM enrollments en
    JOIN cohorts co ON co.id = en.cohort_id
    WHERE en.user_id = p_profile_id AND en.status = 'enrolled';
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_profile_classes(uuid) TO anon, authenticated;
