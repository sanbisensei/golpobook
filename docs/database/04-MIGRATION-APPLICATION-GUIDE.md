# GolpoBook: Migration Application & Database Verification Guide
**Document ID:** `04-MIGRATION-APPLICATION-GUIDE`  
**Phase:** Sprint 1 Phase 2A — Database Foundation & Security Design  
**Author:** Senior Backend Architect & Database Lead  
**Status:** STEP-BY-STEP OPERATIONAL GUIDE

---

## 1. Pre-Migration Prerequisites & Safety Checks

Before applying any SQL migrations to your Supabase project, execute this pre-flight verification checklist:

1. **Verify Supabase Project Status**:
   - Log into your [Supabase Dashboard](https://supabase.com/dashboard).
   - Ensure the project is **Active** (not paused due to 7 days of inactivity).
2. **Verify Environment Variables**:
   - Confirm that `.env.local` contains valid values for:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - *Never share or expose the `SUPABASE_SERVICE_ROLE_KEY` to client components.*
3. **Backup / Snapshot**:
   - For an existing development database, create a backup or ensure no conflicting tables exist with names: `profiles`, `subscription_plans`, `tier_limits`, `categories`, or `user_subscriptions`.

---

## 2. Migration Execution Options

You can apply the five migration files using either the **Supabase Web SQL Editor** (recommended for ease of inspection) or the **Supabase CLI**.

### Option A: Manual Application via Supabase Web SQL Editor (Recommended)

1. Open your project in the **Supabase Dashboard**.
2. In the left navigation menu, click on the **SQL Editor** (terminal icon).
3. Click **New query**.
4. Apply the five migrations in the **exact sequential order** listed below. (Do not change the order, as later migrations depend on foreign keys and tables created in earlier migrations).

```
EXECUTION SEQUENCE:
  Step 1: 20261113220001_create_subscription_plans_and_tier_limits.sql
  Step 2: 20261113220002_create_categories.sql
  Step 3: 20261113220003_create_profiles_and_user_subscriptions.sql
  Step 4: 20261113220004_create_registration_trigger.sql
  Step 5: 20261113220005_configure_row_level_security.sql
```

For each file:
- Open the SQL file located in `supabase/migrations/` on your machine.
- Copy the full SQL contents.
- Paste into the Supabase SQL Editor.
- Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
- Confirm the output displays: `Success. No rows returned` (or row counts for inserts).

---

### Option B: Automated Application via Supabase CLI

If you have the Supabase CLI configured locally:

1. Link your local project to your remote Supabase project:
   ```bash
   npx supabase link --project-ref your-project-ref-id
   ```
2. Push all migrations from `supabase/migrations/` to the remote database:
   ```bash
   npx supabase db push
   ```
3. The CLI will inspect the remote database, detect all five new migration files, apply them in alphabetical/timestamp order, and record their status in the internal `supabase_migrations` ledger.

---

## 3. Post-Migration Verification Queries

After running the migrations, open a new SQL query in the Supabase SQL Editor and run the following verification checks to validate that the schema, seed data, triggers, and RLS policies are active and functioning correctly:

### Test 1: Verify Table Existence & Structure
```sql
SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'subscription_plans', 'tier_limits', 'categories', 'user_subscriptions')
ORDER BY table_name;
```
*Expected Result:* 5 rows returned. `categories`, `profiles`, `subscription_plans`, `tier_limits`, and `user_subscriptions` all present.

---

### Test 2: Verify Seed Data (Plans, Tier Limits, Categories)
```sql
-- Check subscription plans (should be 3: free, plus, premium)
SELECT id, name, price_monthly, price_yearly, is_active FROM public.subscription_plans ORDER BY display_order;

-- Check category count (should be 10 seeded categories)
SELECT count(*) AS total_categories FROM public.categories;

-- Check tier limits count (should be 33 rules: 11 per tier)
SELECT tier, count(*) AS feature_count FROM public.tier_limits GROUP BY tier ORDER BY tier;
```
*Expected Result:*
- `subscription_plans`: 3 rows (`free`, `plus`, `premium`).
- `categories`: 10 rows.
- `tier_limits`: 3 rows returned (`free`: 11, `plus`: 11, `premium`: 11).

---

### Test 3: Verify Row Level Security (RLS) is Active on All Tables
```sql
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('profiles', 'subscription_plans', 'tier_limits', 'categories', 'user_subscriptions')
ORDER BY relname;
```
*Expected Result:* All 5 tables must show `rls_enabled = true`.

---

### Test 4: Verify Partial Unique Index on Active Subscriptions
```sql
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'user_subscriptions' 
  AND indexname = 'user_subscriptions_single_active_idx';
```
*Expected Result:* 1 row returned showing `CREATE UNIQUE INDEX user_subscriptions_single_active_idx ON public.user_subscriptions USING btree (user_id) WHERE (status = 'active'::text)`.

---

### Test 5: Verify Registration Trigger on `auth.users`
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement, 
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
```
*Expected Result:* 1 row returned showing trigger `on_auth_user_created` firing `AFTER INSERT` on `auth.users` with `EXECUTE FUNCTION public.handle_new_user()`.

---

### Test 6: Verify Anti-Privilege Escalation Trigger on `public.profiles`
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'profiles'
  AND trigger_name = 'trigger_guard_profile_role_escalation';
```
*Expected Result:* 1 row returned showing `BEFORE UPDATE` trigger on `public.profiles`.

---

## 4. End-to-End Simulation Test (Optional Dry Run)

To verify the complete auth lifecycle and registration trigger before building the frontend auth forms:

1. Navigate to the **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter a test email: `listener.test@example.com`, password, and metadata: `{"full_name": "Test Listener"}`.
4. Click **Create User**.
5. Switch to the **Table Editor** (or SQL Editor) and execute:
   ```sql
   SELECT p.id, p.full_name, p.role, s.plan_id, s.status, s.billing_cycle 
   FROM public.profiles p
   JOIN public.user_subscriptions s ON p.id = s.user_id
   WHERE p.full_name = 'Test Listener';
   ```
6. **Expected Result:**
   - A single joined row appears.
   - `role` is strictly `'listener'`.
   - `plan_id` is `'free'`.
   - `status` is `'active'`.
   - `billing_cycle` is `'lifetime'`.
7. Once verified, delete the test user from **Authentication** -> **Users** (which will cleanly cascade-delete the profile and subscription rows).

---

## 5. Emergency Rollback Plan

If you ever need to completely reset the foundation schema during development before moving to Phase 2B, run the following rollback script in the Supabase SQL Editor:

```sql
-- DANGER: Drops all foundation tables, triggers, and types
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.tier_limits CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

DROP FUNCTION IF EXISTS public.prevent_profile_role_escalation();
DROP FUNCTION IF EXISTS public.set_updated_at();
```
*(Only execute the rollback script if you intend to wipe the foundation tables and re-apply the migrations from scratch.)*
