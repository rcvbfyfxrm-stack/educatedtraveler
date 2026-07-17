-- 025: wire the joiner welcome email (Arnaud approved the draft 2026-07-17).
-- circle-welcome existed since June expecting a launch_waitlist INSERT webhook
-- that was never created — zero joiners were ever welcomed. Separate trigger
-- from 024's notify-lead so either can be dropped independently. The function
-- itself is idempotent (welcomed_at stamp) and skips unsubscribed rows.
-- NOTE: migrations are not auto-applied to prod — run via
--   supabase db query --linked --yes -f supabase/migrations/025_circle_welcome_webhook.sql

create or replace function public.welcome_lead_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://exaehwaqwcledemwpluw.supabase.co/functions/v1/circle-welcome',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'launch_waitlist',
      'schema', 'public',
      'record', jsonb_build_object('id', NEW.id)
    ),
    timeout_milliseconds := 5500
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

drop trigger if exists trg_welcome_lead_on_signup on public.launch_waitlist;
create trigger trg_welcome_lead_on_signup
  after insert on public.launch_waitlist
  for each row execute function public.welcome_lead_on_signup();
