-- Wrap auth.*() calls in a scalar subselect so Postgres evaluates them once per
-- query instead of once per row (same logic, better plan at scale).
-- (Applied via Supabase MCP; recorded here for repo parity.)

drop policy if exists "Authenticated users can view batches" on public.batches;
create policy "Authenticated users can view batches" on public.batches for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "Authenticated users can view media metadata" on public.media;
create policy "Authenticated users can view media metadata" on public.media for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "Users can view own payment history" on public.payment_history;
create policy "Users can view own payment history" on public.payment_history for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  using ((select auth.uid()) = id);

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions for select
  using ((select auth.uid()) = profile_id);

drop policy if exists "Users can view own test attempts" on public.test_attempts;
create policy "Users can view own test attempts" on public.test_attempts for select
  using ((select auth.uid()) = profile_id);
