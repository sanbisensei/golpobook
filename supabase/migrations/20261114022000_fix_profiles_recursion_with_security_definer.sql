-- ==============================================================================
-- Migration: 20261114022000_fix_profiles_recursion_with_security_definer.sql
-- Module: Row Level Security (RLS) Optimization & Infinite Recursion Fix
-- Purpose: Fixes infinite recursion in public.profiles policies by using a SECURITY DEFINER function
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create SECURITY DEFINER is_admin() Helper Function
-- Bypasses RLS on public.profiles to prevent infinite self-referential policy recursion
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execution permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Fix Policies on `public.profiles`
-- ------------------------------------------------------------------------------

-- Replace profiles_select_admin with the non-recursive function
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Fix profiles_update_own to eliminate self-referential subquery in WITH CHECK
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. Update Admin Policies on Dependent Tables to use is_admin()
-- ------------------------------------------------------------------------------

-- public.subscription_plans
DROP POLICY IF EXISTS "subscription_plans_select_admin" ON public.subscription_plans;
CREATE POLICY "subscription_plans_select_admin"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "subscription_plans_modify_admin" ON public.subscription_plans;
CREATE POLICY "subscription_plans_modify_admin"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- public.tier_limits
DROP POLICY IF EXISTS "tier_limits_modify_admin" ON public.tier_limits;
CREATE POLICY "tier_limits_modify_admin"
  ON public.tier_limits
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- public.categories
DROP POLICY IF EXISTS "categories_select_admin" ON public.categories;
CREATE POLICY "categories_select_admin"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "categories_modify_admin" ON public.categories;
CREATE POLICY "categories_modify_admin"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- public.user_subscriptions
DROP POLICY IF EXISTS "user_subscriptions_select_admin" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_select_admin"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- public.user_preferences
DROP POLICY IF EXISTS "user_preferences_select_admin" ON public.user_preferences;
CREATE POLICY "user_preferences_select_admin"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
