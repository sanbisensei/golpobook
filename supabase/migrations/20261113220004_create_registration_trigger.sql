-- ==============================================================================
-- Migration: 20261113220004_create_registration_trigger.sql
-- Module: Auth Lifecycle & Automated Profile Provisioning
-- Purpose: Provably safe handle_new_user() trigger function on auth.users
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- 1. Create the Security Definer Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_free_plan_exists boolean;
BEGIN
  -- A. Extract and sanitize user metadata with safe fallback defaults
  v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), '');
  v_avatar_url := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')), '');

  IF v_full_name IS NULL THEN
    -- Fallback to the username portion of email or generic default
    v_full_name := COALESCE(NULLIF(SPLIT_PART(NEW.email, '@', 1), ''), 'Listener');
  END IF;

  -- B. Insert Profile record (strictly hardcoded to 'listener' role to prevent self-elevation)
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    v_full_name,
    v_avatar_url,
    'listener'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  -- C. Verify that the 'free' subscription plan exists before attempting insertion
  SELECT EXISTS (
    SELECT 1 FROM public.subscription_plans WHERE id = 'free'
  ) INTO v_free_plan_exists;

  IF NOT v_free_plan_exists THEN
    -- Defensive self-healing fallback if 'free' plan was deleted or not yet seeded
    INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, is_active, display_order)
    VALUES ('free', 'Free Explorer', 'Standard free tier', 0.00, 0.00, true, 1)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- D. Initialize initial Free subscription record
  -- Check if an active subscription already exists (handles retries idempotently)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = NEW.id AND status = 'active'
  ) THEN
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      billing_cycle,
      status,
      starts_at,
      expires_at
    )
    VALUES (
      NEW.id,
      'free',
      'lifetime',
      'active',
      now(),
      now() + interval '100 years'
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error detail in PostgreSQL server logs and re-raise so auth registration fails atomically
    RAISE WARNING 'handle_new_user failed for auth.users id %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- 2. Restrict Direct Execution Permissions
-- Only the internal auth admin role executing the trigger should ever run this function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3. Attach Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
