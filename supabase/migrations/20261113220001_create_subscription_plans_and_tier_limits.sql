-- ==============================================================================
-- Migration: 20261113220001_create_subscription_plans_and_tier_limits.sql
-- Module: Subscription & Tier Engine
-- Purpose: Defines subscription plans and dynamic tier limits (single source of truth)
-- Author: Senior Backend Architect & Database Lead
-- Date: November 2026
-- ==============================================================================

-- 1. Enable required extensions safely
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Generic updated_at trigger function for automated timestamp management
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Create Subscription Plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY CHECK (id IN ('free', 'plus', 'premium')),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price_monthly >= 0),
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price_yearly >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing active plans by display order
CREATE INDEX IF NOT EXISTS subscription_plans_active_idx 
  ON public.subscription_plans (is_active, display_order);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Create Tier Limits table (Single Source of Truth for Tier Capabilities)
CREATE TABLE IF NOT EXISTS public.tier_limits (
  tier TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  limit_value NUMERIC, -- NULL represents unlimited access
  period TEXT NOT NULL CHECK (period IN ('day', 'month', 'lifetime', 'static')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tier, feature)
);

-- Index for fast feature-limit lookups
CREATE INDEX IF NOT EXISTS tier_limits_lookup_idx 
  ON public.tier_limits (tier, feature);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_tier_limits_updated_at ON public.tier_limits;
CREATE TRIGGER trigger_tier_limits_updated_at
  BEFORE UPDATE ON public.tier_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Seed Initial Subscription Plans
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, is_active, display_order)
VALUES 
  (
    'free', 
    'Free Explorer', 
    'Access free audiobooks, chapter previews, and basic 1x speed streaming with standard advertisements.',
    0.00, 
    0.00, 
    true, 
    1
  ),
  (
    'plus', 
    'GolpoBook Plus', 
    'Ad-free listening, full catalog streaming, up to 1.5x speed, sleep timer, and monthly AI summaries.',
    99.00, 
    999.00, 
    true, 
    2
  ),
  (
    'premium', 
    'GolpoBook Premium', 
    'The ultimate listening experience: up to 2.0x speed, unlimited AI Story Finder, chapter downloads, and exclusive releases.',
    199.00, 
    1999.00, 
    true, 
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- 6. Seed Complete Tier Limits Matrix (strictly derived from Proposal Section 6)
INSERT INTO public.tier_limits (tier, feature, limit_value, period, description)
VALUES
  -- Free Tier Limits
  ('free', 'playback_speed_max', 1.0, 'static', 'Maximum playback speed allowed (1.0x)'),
  ('free', 'playhead_seeking_unlimited', 0, 'static', '0 = limited forward seeking (+15s max), 1 = unlimited'),
  ('free', 'ad_free', 0, 'static', '0 = with house/promotional ads, 1 = ad-free'),
  ('free', 'offline_downloads_count', 0, 'static', 'Number of offline chapter downloads allowed'),
  ('free', 'full_audiobook_access', 0, 'static', '0 = free catalog & preview chapters only, 1 = full catalog'),
  ('free', 'sleep_timer_enabled', 0, 'static', '0 = disabled, 1 = enabled'),
  ('free', 'playlists_and_bookmarks_limit', 5, 'lifetime', 'Maximum bookmarks & custom playlists allowed'),
  ('free', 'cross_device_sync_enabled', 0, 'static', '0 = local device progress only, 1 = cloud sync'),
  ('free', 'ai_summary_monthly', 0, 'month', 'Monthly AI chapter summaries allocation'),
  ('free', 'exclusive_content_level', 0, 'static', '0 = none, 1 = limited, 2 = full'),
  ('free', 'story_finder_daily', 1, 'day', 'Daily natural-language AI Story Finder requests'),

  -- Plus Tier Limits
  ('plus', 'playback_speed_max', 1.5, 'static', 'Maximum playback speed allowed (up to 1.5x)'),
  ('plus', 'playhead_seeking_unlimited', 1, 'static', 'Unlimited seeking across chapters'),
  ('plus', 'ad_free', 1, 'static', '100% ad-free listening experience'),
  ('plus', 'offline_downloads_count', 1, 'static', 'Single offline download slot'),
  ('plus', 'full_audiobook_access', 1, 'static', 'Full included catalog access'),
  ('plus', 'sleep_timer_enabled', 1, 'static', 'Sleep timer enabled with auto-fade'),
  ('plus', 'playlists_and_bookmarks_limit', NULL, 'lifetime', 'Unlimited playlists and chapter bookmarks'),
  ('plus', 'cross_device_sync_enabled', 1, 'static', 'Seamless cross-device listening progress synchronization'),
  ('plus', 'ai_summary_monthly', 5, 'month', '5 AI chapter summaries per calendar month'),
  ('plus', 'exclusive_content_level', 1, 'static', 'Limited access to exclusive creator audiobooks'),
  ('plus', 'story_finder_daily', 10, 'day', '10 AI Story Finder searches per calendar day'),

  -- Premium Tier Limits
  ('premium', 'playback_speed_max', 2.0, 'static', 'Maximum playback speed allowed (up to 2.0x)'),
  ('premium', 'playhead_seeking_unlimited', 1, 'static', 'Unlimited seeking across chapters'),
  ('premium', 'ad_free', 1, 'static', '100% ad-free listening experience'),
  ('premium', 'offline_downloads_count', NULL, 'static', 'Unlimited chapter-wise offline downloads (cache)'),
  ('premium', 'full_audiobook_access', 1, 'static', 'Full catalog access including all premier releases'),
  ('premium', 'sleep_timer_enabled', 1, 'static', 'Sleep timer enabled'),
  ('premium', 'playlists_and_bookmarks_limit', NULL, 'lifetime', 'Unlimited playlists and chapter bookmarks'),
  ('premium', 'cross_device_sync_enabled', 1, 'static', 'Seamless cross-device listening progress synchronization'),
  ('premium', 'ai_summary_monthly', 30, 'month', '30 AI chapter summaries per calendar month'),
  ('premium', 'exclusive_content_level', 2, 'static', 'Unrestricted access to all exclusive original audiobooks'),
  ('premium', 'story_finder_daily', NULL, 'day', 'Unlimited AI Story Finder requests (with fair-use ceiling)')
ON CONFLICT (tier, feature) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  period = EXCLUDED.period,
  description = EXCLUDED.description;
