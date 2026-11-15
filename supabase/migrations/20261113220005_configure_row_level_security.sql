-- ==============================================================================
-- Migration: 20261113220005_configure_row_level_security.sql
-- Module: Row Level Security (RLS) & Access Governance
-- Purpose: Strict policy enforcement and column-level permission lockdown
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on All Foundation Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Policies for `public.profiles`
-- Threat Model: Cross-user data leakage and role self-elevation (privilege escalation)
-- ------------------------------------------------------------------------------

-- A. Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- B. Admins can view all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- C. Users can update their own profile (strictly validated)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (role = 'listener' OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

-- D. Column-level privilege lockdown: authenticated role can ONLY modify safe columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;

-- Direct client INSERTs and DELETEs are denied. Profile creation is owned by auth trigger.

-- ------------------------------------------------------------------------------
-- 3. Policies for `public.subscription_plans`
-- Threat Model: Unauthorized pricing tampering or tier creation
-- ------------------------------------------------------------------------------

-- A. Public read access to active plans (anonymous and authenticated)
CREATE POLICY "subscription_plans_select_public"
  ON public.subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- B. Admins can view all plans (including inactive/drafts)
CREATE POLICY "subscription_plans_select_admin"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- C. Only admins can create, modify, or disable plans
CREATE POLICY "subscription_plans_modify_admin"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 4. Policies for `public.tier_limits`
-- Threat Model: Manipulation of speed caps, AI quotas, or seek restrictions
-- ------------------------------------------------------------------------------

-- A. Public read access to tier limit rules
CREATE POLICY "tier_limits_select_public"
  ON public.tier_limits
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- B. Only admins can update or insert tier limits
CREATE POLICY "tier_limits_modify_admin"
  ON public.tier_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 5. Policies for `public.categories`
-- Threat Model: Unauthorized category insertion or vandalism
-- ------------------------------------------------------------------------------

-- A. Public read access to active categories (anonymous and authenticated)
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- B. Admins can view all categories
CREATE POLICY "categories_select_admin"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- C. Only admins can create, edit, or delete categories
CREATE POLICY "categories_modify_admin"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 6. Policies for `public.user_subscriptions`
-- Threat Model: Self-assignment of Plus/Premium tiers and subscription tampering
-- ------------------------------------------------------------------------------

-- A. Users can view their own subscription records
CREATE POLICY "user_subscriptions_select_own"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- B. Admins can view all subscription records
CREATE POLICY "user_subscriptions_select_admin"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- C. CRITICAL SECURITY INVARIANT:
-- NO client-side INSERT, UPDATE, or DELETE policies exist for authenticated or anon roles!
-- Ordinary users cannot directly insert, update, or delete user_subscriptions rows.
-- Subscriptions are managed EXCLUSIVELY by:
-- 1. The handle_new_user() trigger (running as SECURITY DEFINER during registration).
-- 2. Server-side payment callbacks/webhooks executing with SUPABASE_SERVICE_ROLE_KEY.
-- 3. Dedicated administrative RPC functions.
