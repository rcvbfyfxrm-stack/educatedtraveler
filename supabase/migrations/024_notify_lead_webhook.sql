-- 024: notify Arnaud on every Circle signup.
-- launch_waitlist had NO trigger/webhook at all — signups landed silently.
-- This wires an AFTER INSERT pg_net call to the notify-lead edge function,
-- which re-fetches the row by id (payload is untrusted) and emails the full
-- sheet to Arnaud. The notify must never block a signup: pg_net is async and
-- any error is swallowed.
-- NOTE: migrations are not auto-applied to prod — run this via
--   supabase db query --linked --yes "$(cat supabase/migrations/024_notify_lead_webhook.sql)"

create or replace function public.notify_lead_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://exaehwaqwcledemwpluw.supabase.co/functions/v1/notify-lead',
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

drop trigger if exists trg_notify_lead_on_signup on public.launch_waitlist;
create trigger trg_notify_lead_on_signup
  after insert on public.launch_waitlist
  for each row execute function public.notify_lead_on_signup();
