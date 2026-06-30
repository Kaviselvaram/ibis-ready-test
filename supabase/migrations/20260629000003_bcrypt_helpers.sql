-- Helper to read bcrypt cost from stored hash
CREATE OR REPLACE FUNCTION public.get_user_hash_cost(p_user_id UUID)
RETURNS TABLE(cost INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT encrypted_password INTO v_hash
  FROM auth.users WHERE id = p_user_id;

  -- bcrypt format: $2b$<cost>$...  — cost is the third $-delimited segment
  cost := CAST(split_part(v_hash, '$', 3) AS INTEGER);
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_password_hash(p_user_id UUID, p_new_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = p_new_hash, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Lock both to service_role only
REVOKE EXECUTE ON FUNCTION public.get_user_hash_cost(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_password_hash(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_hash_cost(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_password_hash(UUID, TEXT) TO service_role;
