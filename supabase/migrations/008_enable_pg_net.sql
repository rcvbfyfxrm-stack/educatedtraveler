-- =====================================================
-- 008_enable_pg_net.sql
-- Enables pg_net so the on_profile_created_welcome_email
-- trigger (which calls net.http_post) stops failing with
-- "schema net does not exist" on every new sign-up.
--
-- Applied to project exaehwaqwcledemwpluw on 2026-05-10.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
