-- ==============================================================================
-- Migration: 20261113220003_create_profiles_and_user_subscriptions.sql
-- Module: Identity, User Profiles & Subscription Ledger
-- Purpose: User profile extension of auth.users and user subscription instances
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- 1. Create Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('listener', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role lookup (e.g. admin checks)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Anti-Privilege Escalation Trigger on Profiles
-- Guarantees that ordinary user sessions cannot elevate their own role to 'admin'
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If role is being changed, ensure the current session is an admin or service_role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if calling auth context is service_role or an existing admin
    IF (auth.jwt() ->> 'role') != 'service_role' AND 
       NOT EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE id = auth.uid() AND role = 'admin'
       ) THEN
      RAISE EXCEPTION 'Privilege escalation rejected: only administrators can alter user roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_role_escalation ON public.profiles;
CREATE TRIGGER trigger_guard_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 3. Create User Subscriptions table (Ledger supporting historical records)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON UPDATE CASCADE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'past_due')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial Indexes:
-- A. Fast lookup by user
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx 
  ON public.user_subscriptions (user_id);

-- B. Fast lookup for active plans and expiry checks
CREATE INDEX IF NOT EXISTS user_subscriptions_status_expires_idx 
  ON public.user_subscriptions (status, expires_at);

-- C. PARTIAL UNIQUE INDEX: Strictly guarantees at most ONE active subscription per user,
-- while allowing unlimited historical records (expired / cancelled) for accounting audit.
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_single_active_idx 
  ON public.user_subscriptions (user_id) 
  WHERE (status = 'active');

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER trigger_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
