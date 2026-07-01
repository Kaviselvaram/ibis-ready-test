-- Admin-defined tests that students browse and take. Questions are pulled from
-- the existing question bank by chapter at attempt time. (Applied via Supabase
-- MCP; recorded here for repo parity.)
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  test_type text not null check (test_type in ('half_chapter','full_chapter','combined','full_syllabus')),
  chapter_ids uuid[] not null default '{}',
  question_count integer not null default 20 check (question_count between 1 and 200),
  duration_minutes integer not null default 30 check (duration_minutes between 1 and 600),
  is_live boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tests enable row level security;

-- Students (anon + authenticated client) may read only LIVE tests. Writes are
-- service-role only (admin API).
drop policy if exists "Anyone can view live tests" on public.tests;
create policy "Anyone can view live tests"
  on public.tests for select
  to anon, authenticated
  using (is_live = true);

-- Realtime so the student "Take Test" list reflects publish/unpublish live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tests'
  ) then
    alter publication supabase_realtime add table public.tests;
  end if;
end $$;

create index if not exists idx_tests_is_live on public.tests(is_live);
