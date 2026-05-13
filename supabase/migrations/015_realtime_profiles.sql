-- 012 — enable realtime broadcasts on the profiles table so the community
-- sidebar can show new joiners live without a page reload.
--
-- Idempotent: the publication ships with Supabase; we just ensure profiles
-- is part of it. RLS still applies to who actually receives each event.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'profiles'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
    END IF;
END$$;
