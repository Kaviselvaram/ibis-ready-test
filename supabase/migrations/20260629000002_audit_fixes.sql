-- Fix 1: Atomic Payment Transactions via RPC
CREATE OR REPLACE FUNCTION public.process_payment(
  p_user_id     UUID,
  p_event_id    TEXT,
  p_amount      INTEGER,
  p_currency    TEXT,
  p_paid_until  TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := FALSE;
BEGIN
  -- Self-enforcing role guard (second layer of defence)
  IF current_role NOT IN ('service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'process_payment: unauthorized caller role: %', current_role;
  END IF;

  INSERT INTO public.processed_events (event_id, received_at)
  VALUES (p_event_id, NOW())
  ON CONFLICT (event_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF NOT v_inserted THEN
    RETURN jsonb_build_object('status', 'duplicate');
  END IF;

  UPDATE public.subscriptions
  SET
    status     = 'active',
    valid_until = p_paid_until
  WHERE profile_id = p_user_id;

  INSERT INTO public.payment_history (user_id, event_id, amount, currency, received_at)
  VALUES (p_user_id, p_event_id, p_amount, p_currency, NOW());

  RETURN jsonb_build_object('status', 'processed');
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- REMEDIATION 1: Lock down RPC execution to service_role only
REVOKE EXECUTE ON FUNCTION public.process_payment(
  UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.process_payment(
  UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ
) TO service_role;

-- Fix 3: Deletion log tombstone table for DPDP
CREATE TABLE IF NOT EXISTS public.deletion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_hash TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.deletion_log ENABLE ROW LEVEL SECURITY;
-- No policies, service_role only
