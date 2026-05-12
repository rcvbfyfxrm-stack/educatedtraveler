-- =====================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- =====================================================
-- The profiles table requires email NOT NULL, but there was
-- no trigger creating a profile row when a new auth user is
-- inserted. Result: sign-in worked, but the first save in the
-- dashboard hit "null value in column \"email\"" because the
-- upsert had no row to merge into and the email wasn't in the
-- payload.
--
-- This migration:
--   1. Backfills profile rows for any auth.users that don't have one
--   2. Adds a trigger so future sign-ups always get a row
-- =====================================================

-- 1. Backfill missing profiles ---------------------------------
insert into public.profiles (id, email, created_at)
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.email is not null;

-- 2. Trigger function ------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Drop any old trigger with the same name, then create -----
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
