-- Consolidate the two overlapping SELECT policies on the client-readable course
-- tables into one each (covers anon + authenticated, no per-row auth.role()).
-- Also cover two unindexed foreign keys. (Applied via Supabase MCP; recorded here.)

drop policy if exists "Authenticated users can view published chapters" on public.chapters;
drop policy if exists "Public can view published chapters" on public.chapters;
create policy "Anyone can view published chapters"
  on public.chapters for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Authenticated users can view topics" on public.topics;
drop policy if exists "Public can view topics" on public.topics;
create policy "Anyone can view topics"
  on public.topics for select
  to anon, authenticated
  using (true);

create index if not exists idx_payment_history_user on public.payment_history(user_id);
create index if not exists idx_test_results_attempt on public.test_results(attempt_id);
