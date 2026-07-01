-- Phase 3 + Phase 1(trigger): live course updates + guaranteed profile creation.
-- Apply via the Supabase MCP (execute_sql / apply_migration) or the SQL editor.

-- =========================================================================
-- 1. Auto-create a public.profiles row for every new auth user (belt-and-
--    suspenders backup for the API signup path, which already inserts one).
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 2. Realtime for structural course changes (chapters, topics).
--    The frontend supabase client is anonymous (students authenticate with a
--    custom backend JWT, not a Supabase session), so it needs an anon SELECT
--    policy to RECEIVE these change events. Only low-sensitivity structure is
--    exposed here; youtubes / questions / media keys stay sealed and are served
--    exclusively through the backend (service role + signed URLs).
-- =========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chapters'
  ) then
    alter publication supabase_realtime add table public.chapters;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'topics'
  ) then
    alter publication supabase_realtime add table public.topics;
  end if;
end $$;

drop policy if exists "Public can view published chapters" on public.chapters;
create policy "Public can view published chapters"
  on public.chapters for select
  to anon
  using (is_published = true);

drop policy if exists "Public can view topics" on public.topics;
create policy "Public can view topics"
  on public.topics for select
  to anon
  using (true);

-- =========================================================================
-- 3. security_events table — referenced by the TOTP-lockout path in
--    routeBuilder.js but never created by an earlier migration. Sealed
--    (service-role only; no client policies).
-- =========================================================================
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid,
  ip_address text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.security_events enable row level security;

