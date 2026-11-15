-- ==============================================================================
-- Migration: 20261114013000_create_user_preferences.sql
-- Module: Listener Personalization & Onboarding (Sprint 1 Phase 2D)
-- Purpose: Creates the user_preferences table and configures strict Row Level Security (RLS)
-- Author: Senior Full-Stack Engineer, Supabase Database Engineer & Product UX Designer
-- Date: November 2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create `user_preferences` Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_languages TEXT[] NOT NULL DEFAULT '{"bangla"}',
  preferred_category_ids UUID[] NOT NULL DEFAULT '{}',
  listening_interests TEXT[] NOT NULL DEFAULT '{}',
  listening_time TEXT CHECK (listening_time IS NULL OR listening_time IN ('morning', 'afternoon', 'evening', 'night', 'flexible')),
  content_preference TEXT CHECK (content_preference IS NULL OR content_preference IN ('audiobooks', 'podcasts', 'both')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences (user_id);
CREATE INDEX IF NOT EXISTS user_preferences_onboarding_idx ON public.user_preferences (user_id, onboarding_completed);

-- ------------------------------------------------------------------------------
-- 3. Automatic updated_at Trigger
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. RLS Policies for `public.user_preferences`
-- Threat Model: Cross-user taste data scraping, unauthorized preference tampering
-- ------------------------------------------------------------------------------

-- Policy A: Listeners can view ONLY their own preferences
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy B: Listeners can insert their own preferences (enforces auth.uid() matching)
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy C: Listeners can update ONLY their own preferences
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy D: Listeners can delete ONLY their own preferences
DROP POLICY IF EXISTS "user_preferences_delete_own" ON public.user_preferences;
CREATE POLICY "user_preferences_delete_own"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy E: Administrators can view all user preferences (analytics & support)
DROP POLICY IF EXISTS "user_preferences_select_admin" ON public.user_preferences;
CREATE POLICY "user_preferences_select_admin"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 6. Grant Explicit Table Permissions
-- ------------------------------------------------------------------------------
REVOKE ALL ON public.user_preferences FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT ON public.user_preferences TO anon;
