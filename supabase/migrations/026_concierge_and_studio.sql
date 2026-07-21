-- 026: the Circle Concierge + Studio command surface.
-- Three admin-only tables the nightly routine writes (via service key, bypassing
-- RLS) and Arnaud reads/decides in /studio with his signed-in admin session.
--   concierge_queue  — one drafted answer per hand raised (draft -> approved ->
--                      published -> sent lifecycle). NOTHING publishes or sends
--                      without Arnaud flipping status in the Studio.
--   studio_tasks     — the ranked "do today" list, done/skip toggled by Arnaud,
--                      rebuilt every night by the routine.
--   studio_briefs    — the nightly "what moved / do next" digest.
-- RLS: SELECT/UPDATE (and INSERT where Arnaud adds his own) require is_admin();
-- the routine's sync uses the service key which bypasses RLS. Same trust boundary
-- as growth_loop_news. is_admin() = profiles.is_admin for auth.uid().
-- NOTE: migrations are NOT auto-applied to prod — run via
--   supabase db query --linked --yes -f supabase/migrations/026_concierge_and_studio.sql
-- then prove with pg_policies / \d.

-- ---------- concierge_queue ----------
create table if not exists public.concierge_queue (
  id            uuid primary key default gen_random_uuid(),
  ext_id        text unique,                       -- stable key for nightly upsert: "<email>::<skill_slug>"
  lead_email    text not null,
  person_name   text,
  skill_raw     text,                              -- what they typed
  skill_title   text,                              -- cleaned display title
  skill_slug    text,                              -- atlas slug when action = create/exists
  world         text,                              -- Atlas world
  atlas_action  text not null default 'create'
                  check (atlas_action in ('create','exists','have_week','none')),
  status        text not null default 'draft'
                  check (status in ('draft','changes_requested','approved','published','sent','parked')),
  fact_md       text,                              -- the surprising, verified fact
  fact_source   text,
  message_subject text,
  message_md    text,                              -- the personal note (gated send)
  skill_sheet_md  text,                            -- the drafted Atlas sheet (gated publish)
  claude_notes_md text,                            -- notes FOR Arnaud (litto-editor style)
  arnaud_notes    text,                            -- his feedback, editable in Studio
  verify_md     text,                              -- adversarial school/fact verification record
  atlas_url     text,
  week_ref      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  approved_at   timestamptz,
  published_at  timestamptz,
  sent_at       timestamptz,
  sent_to       text
);
create index if not exists concierge_queue_status_idx on public.concierge_queue (status, created_at desc);

alter table public.concierge_queue enable row level security;
drop policy if exists "concierge admin read"   on public.concierge_queue;
drop policy if exists "concierge admin update" on public.concierge_queue;
create policy "concierge admin read"   on public.concierge_queue for select using (is_admin());
create policy "concierge admin update" on public.concierge_queue for update using (is_admin()) with check (is_admin());
-- No INSERT/DELETE policy: only the service key (routine sync) can insert. Arnaud
-- never creates a concierge row by hand; he only judges what the routine drafted.

-- ---------- studio_tasks ----------
create table if not exists public.studio_tasks (
  id         uuid primary key default gen_random_uuid(),
  ext_id     text unique,                          -- routine's stable id (upsert); null for Arnaud-added
  day        date not null default (now() at time zone 'Europe/Madrid')::date,
  rank       int  not null default 100,            -- lower = more important, shown first
  title      text not null,
  detail     text,
  category   text,                                 -- crux | concierge | campaign | content | ops
  why        text,                                 -- one line: why it matters (ties to the crux)
  status     text not null default 'todo' check (status in ('todo','done','skipped')),
  source     text not null default 'routine' check (source in ('routine','arnaud')),
  done_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_tasks_day_rank_idx on public.studio_tasks (day, rank);

alter table public.studio_tasks enable row level security;
drop policy if exists "tasks admin read"   on public.studio_tasks;
drop policy if exists "tasks admin insert" on public.studio_tasks;
drop policy if exists "tasks admin update" on public.studio_tasks;
drop policy if exists "tasks admin delete" on public.studio_tasks;
create policy "tasks admin read"   on public.studio_tasks for select using (is_admin());
create policy "tasks admin insert" on public.studio_tasks for insert with check (is_admin());  -- Arnaud can add his own
create policy "tasks admin update" on public.studio_tasks for update using (is_admin()) with check (is_admin());
create policy "tasks admin delete" on public.studio_tasks for delete using (is_admin());

-- ---------- studio_briefs ----------
create table if not exists public.studio_briefs (
  id         uuid primary key default gen_random_uuid(),
  day        date not null unique,                 -- one brief per day (upsert on day)
  digest_md  text,                                 -- "what moved yesterday" (evidence only)
  do_next_md text,                                 -- the one thing that matters today
  plan_md    text,                                 -- staged publication/marketing move
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.studio_briefs enable row level security;
drop policy if exists "briefs admin read" on public.studio_briefs;
create policy "briefs admin read" on public.studio_briefs for select using (is_admin());
-- INSERT/UPDATE: service key only (routine sync).

-- keep updated_at fresh on the two tables Arnaud edits
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_touch_concierge on public.concierge_queue;
create trigger trg_touch_concierge before update on public.concierge_queue
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_touch_tasks on public.studio_tasks;
create trigger trg_touch_tasks before update on public.studio_tasks
  for each row execute function public.touch_updated_at();
