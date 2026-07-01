-- Lock down SECURITY DEFINER functions so they are NOT callable via the public
-- REST RPC endpoint by anon/authenticated. Only the backend (service_role) may
-- invoke them; handle_new_user runs as a trigger and needs no direct EXECUTE.
-- (Applied via Supabase MCP; recorded here for repo parity.)

revoke execute on function public.process_payment(uuid, text, integer, text, timestamp with time zone) from public, anon, authenticated;
grant execute on function public.process_payment(uuid, text, integer, text, timestamp with time zone) to service_role;
alter function public.process_payment(uuid, text, integer, text, timestamp with time zone) set search_path = public;

revoke execute on function public.update_user_password_hash(uuid, text) from public, anon, authenticated;
grant execute on function public.update_user_password_hash(uuid, text) to service_role;
alter function public.update_user_password_hash(uuid, text) set search_path = public;

revoke execute on function public.get_user_hash_cost(uuid) from public, anon, authenticated;
grant execute on function public.get_user_hash_cost(uuid) to service_role;
alter function public.get_user_hash_cost(uuid) set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
