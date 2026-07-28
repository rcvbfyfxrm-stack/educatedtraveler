-- 031 — tell Arnaud when a profile is FILLED IN, not only when it is created.
--
-- Why: on_profile_created_welcome_email fires AFTER INSERT only. People create
-- an account, then come back later and choose their crafts on the profile page
-- (an UPDATE) — and nothing fired. Jean Charles signed up 25 Jul and filled in
-- ten crafts on 27 Jul; Arnaud was never told. 9 profiles have been completed
-- after signup, every one of them silently.
--
-- The guard fires only on the empty -> filled transition, so ordinary edits and
-- the updated_at touch stay quiet.

create or replace function public.notify_profile_filled()
returns trigger
language plpgsql
security definer
as $function$
begin
  -- Never let a notification failure block the member's save.
  begin
    perform net.http_post(
      url := 'https://exaehwaqwcledemwpluw.supabase.co/functions/v1/send-welcome-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YWVod2Fxd2NsZWRlbXdwbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA1MjIsImV4cCI6MjA4NTA5NjUyMn0.vY4Rtio2RNQ2eCYxaYy1M_PGaBTbRPRd_nrqe-HGXlQ"}'::jsonb,
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'profiles',
        'record', jsonb_build_object(
          'id', new.id,
          'email', new.email,
          'name', new.name,
          'created_at', new.created_at
        )
      )
    );
  exception when others then
    raise warning 'notify_profile_filled failed for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$function$;

drop trigger if exists on_profile_filled_notify on public.profiles;

-- Fires when interests go from empty to filled, or when profile_complete flips
-- false -> true. Portrait completion is deliberately NOT included: notify-portrait
-- already covers that, and doubling it would mail Arnaud twice for one act.
create trigger on_profile_filled_notify
after update on public.profiles
for each row
when (
  (
    (old.interests is null or old.interests::text in ('null', '{}', '[]'))
    and new.interests is not null
    and new.interests::text not in ('null', '{}', '[]')
  )
  or (
    coalesce(old.profile_complete, false) = false
    and coalesce(new.profile_complete, false) = true
  )
)
execute function public.notify_profile_filled();
