-- 028: store the COMPLETED Atlas page, built overnight.
-- The nightly build renders each new-skill row into a full, self-contained /atlas
-- page and stores it here, so the page is DONE (not a sheet to assemble) and Arnaud
-- previews the real finished page before approving. Publish writes this HTML verbatim,
-- so the preview is byte-identical to what goes live.
-- Apply: supabase db query --linked --yes -f supabase/migrations/028_concierge_page_html.sql
alter table public.concierge_queue add column if not exists page_html text;
alter table public.concierge_queue add column if not exists page_built_at timestamptz;
