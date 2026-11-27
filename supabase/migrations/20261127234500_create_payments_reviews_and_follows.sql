-- ==============================================================================
-- Migration: 20261127234500_create_payments_reviews_and_follows.sql
-- Sprint 5: Pricing Update (20 BDT / 120 BDT), SSLCommerz Ledger, Reviews & Follows
-- ==============================================================================

-- 1. Update Plan Prices to User Specification (Plus = 20 BDT/mo, Premium = 120 BDT/mo)
UPDATE public.subscription_plans
SET price_monthly = 20.00, price_yearly = 200.00, updated_at = now()
WHERE id = 'plus';

UPDATE public.subscription_plans
SET price_monthly = 120.00, price_yearly = 1200.00, updated_at = now()
WHERE id = 'premium';

-- 2. Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  tran_id TEXT NOT NULL UNIQUE,
  val_id TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'failed', 'cancelled')),
  payment_method TEXT,
  raw_gateway_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_user_idx
  ON public.payment_transactions (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trigger_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trigger_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions_select_own" ON public.payment_transactions;
CREATE POLICY "payment_transactions_select_own"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Atomic Idempotent Subscription Activation RPC (REQ-18, REQ-19)
CREATE OR REPLACE FUNCTION public.activate_user_subscription(
  p_tran_id TEXT,
  p_val_id TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'SSLCommerz',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx public.payment_transactions%ROWTYPE;
  v_duration INTERVAL;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_tx
  FROM public.payment_transactions
  WHERE tran_id = p_tran_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'TRANSACTION_NOT_FOUND');
  END IF;

  -- Idempotency guard: if already validated, do NOT extend expiry again
  IF v_tx.status = 'validated' THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true, 'plan_id', v_tx.plan_id);
  END IF;

  UPDATE public.payment_transactions
  SET status = 'validated',
      val_id = COALESCE(p_val_id, val_id),
      payment_method = COALESCE(p_payment_method, payment_method),
      raw_gateway_payload = COALESCE(p_payload, raw_gateway_payload),
      updated_at = now()
  WHERE id = v_tx.id;

  v_duration := CASE WHEN v_tx.billing_cycle = 'yearly' THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END;
  v_expires_at := now() + v_duration;

  -- Mark previous active subscriptions superseded
  UPDATE public.user_subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE user_id = v_tx.user_id AND status = 'active';

  INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at)
  VALUES (v_tx.user_id, v_tx.plan_id, 'active', now(), v_expires_at);

  RETURN jsonb_build_object(
    'ok', true,
    'already_processed', false,
    'plan_id', v_tx.plan_id,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_user_subscription(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_user_subscription(TEXT, TEXT, TEXT, JSONB) TO service_role;

-- 4. Reviews & Star Ratings Table (REQ-31)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, audiobook_id)
);

CREATE INDEX IF NOT EXISTS reviews_audiobook_idx
  ON public.reviews (audiobook_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
CREATE POLICY "reviews_public_select"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_own_write" ON public.reviews;
CREATE POLICY "reviews_own_write"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. User Follows Author Table (REQ-28)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, author_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_follows_own_all" ON public.user_follows;
CREATE POLICY "user_follows_own_all"
  ON public.user_follows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
