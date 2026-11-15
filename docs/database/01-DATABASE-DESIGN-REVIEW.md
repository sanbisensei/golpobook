# GolpoBook: Database Foundation & Architecture Design Review
**Document ID:** `01-DATABASE-DESIGN-REVIEW`  
**Phase:** Sprint 1 Phase 2A — Database Foundation & Security Design  
**Author:** Senior PostgreSQL Engineer, Supabase Security Architect & Backend Lead  
**Status:** DESIGN REVIEW COMPLETE — READY FOR MIGRATION APPLICATION

---

## 1. Executive Summary & Design Scope

In Sprint 1 Phase 1, we successfully delivered the Next.js 16 frontend shell, the Audiora Neo-Editorial design system, standardized on `lucide-react`, and established the 3-tier desktop/mobile layout with zero build errors.

We are now preparing the PostgreSQL and Supabase database foundation. In accordance with strict software engineering discipline, **this phase prioritizes only the foundational data models required for user registration, identity, profile management, subscription plan definitions, dynamic tier limits, and content discovery categories.**

The initial schema consists of five tightly coupled, highly normalized tables:
1. `public.subscription_plans`: Master catalog of platform subscription tiers (`free`, `plus`, `premium`).
2. `public.tier_limits`: Dynamic single source of truth for tier-based feature caps and quotas.
3. `public.categories`: Public content taxonomy and genre classification.
4. `public.profiles`: Listener identity extending Supabase `auth.users`.
5. `public.user_subscriptions`: Normalized subscription ledger preserving historical records while guaranteeing exactly one active plan per user.

---

## 2. Critical Review of Proposed Architecture (`03-SYSTEM-ARCHITECTURE.md`)

A rigorous audit of the preliminary database design in `03-SYSTEM-ARCHITECTURE.md` revealed several critical vulnerabilities, omissions, and operational risks that have been systematically resolved in these migrations:

### 2.1 Vulnerability 1: Search-Path Hijacking in `handle_new_user()`
- **Flaw in Architecture Document**: The proposed `handle_new_user()` trigger was declared as `SECURITY DEFINER` without setting an explicit `search_path`.
- **Security Impact**: In PostgreSQL, a `SECURITY DEFINER` function without a fixed `search_path` is vulnerable to **privilege escalation**. If an untrusted user creates an object in a user-controlled schema with the same name as a function or table referenced inside the trigger, the trigger (executing as database owner) can be coerced into running malicious code.
- **Resolution**: The function now explicitly declares:
  ```sql
  SET search_path = public, auth, pg_temp;
  ```
  Furthermore, execution permissions are explicitly revoked from `PUBLIC`, `anon`, and `authenticated`, granting execution solely to `supabase_auth_admin`.

### 2.2 Vulnerability 2: Privilege Escalation via Client-Side Profile Updates
- **Flaw in Architecture Document**: The architecture document proposed a generic RLS policy:
  ```sql
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  ```
- **Security Impact**: RLS row-level checks control *which rows* can be updated, **not which columns**. Under that policy, any authenticated listener could send:
  ```javascript
  supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
  ```
  This immediately grants administrative privileges over the entire platform.
- **Resolution**: Implemented **Triple-Layer Defense-in-Depth**:
  1. **Column-Level Privileges**: `REVOKE UPDATE ON public.profiles FROM authenticated;` followed by `GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;`. The PostgreSQL engine rejects updates to any other column.
  2. **RLS Policy Guard**: The `WITH CHECK` expression verifies that `role` cannot be modified to anything other than its current value or `'listener'`.
  3. **Database Trigger Guard**: A `BEFORE UPDATE` trigger `prevent_profile_role_escalation()` intercepts updates and raises an exception if a non-admin session attempts to alter the `role` column.

### 2.3 Vulnerability 3: Multiple Active Subscriptions & Accounting Inconsistency
- **Flaw in Architecture Document**: In `03-SYSTEM-ARCHITECTURE.md`, `user_subscriptions` lacked a uniqueness constraint on active subscriptions.
- **Operational Impact**: A user could have multiple concurrent `status = 'active'` rows due to race conditions during payment webhooks or admin overrides. Determining the "effective tier" becomes non-deterministic.
- **Resolution**: Implemented a **Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX user_subscriptions_single_active_idx 
    ON public.user_subscriptions (user_id) 
    WHERE (status = 'active');
  ```
  This allows unlimited historical rows (`expired`, `cancelled`, `past_due`) for an immutable financial audit trail, while strictly enforcing at the engine level that **no user can ever hold more than one active subscription at any point in time**.

### 2.4 Vulnerability 4: Unauthorized Subscription Elevation
- **Flaw in Architecture Document**: Ambiguous RLS policies for `user_subscriptions`.
- **Security Impact**: If an authenticated listener has `INSERT` or `UPDATE` privileges on `user_subscriptions`, they could insert a `plan_id = 'premium'` row directly from browser DevTools, bypassing SSLCommerz entirely.
- **Resolution**: **Zero client-side modification policies.** Authenticated users have `SELECT` privileges on their own rows (`auth.uid() = user_id`). `INSERT`, `UPDATE`, and `DELETE` privileges are **completely withheld from authenticated and anonymous users**. Subscriptions are modified exclusively by:
  - The `handle_new_user()` registration trigger (`SECURITY DEFINER`).
  - Backend payment validation route handlers using `SUPABASE_SERVICE_ROLE_KEY`.

### 2.5 Vulnerability 5: Missing Automated Timestamp Management
- **Flaw in Architecture Document**: Tables defined `created_at`, but lacked `updated_at` synchronization.
- **Resolution**: Implemented a standardized, reusable `set_updated_at()` trigger function applied across all foundation tables.

---

## 3. Analysis of Critical Architecture Questions

### 3.1 Does the subscription schema support historical records while preventing multiple active subscriptions?
**Yes.** The combination of standard relational foreign keys and the partial unique index `user_subscriptions_single_active_idx` provides the ideal architectural balance:
- When a user signs up, a row with `status = 'active'` and `plan_id = 'free'` is created.
- When the user upgrades to Plus via SSLCommerz, an atomic transaction updates the existing Free row to `status = 'expired'`, and inserts a new row with `status = 'active'` and `plan_id = 'plus'`.
- All past subscriptions remain preserved in the table for reporting, renewal reminders, and dispute resolution.
- Any concurrent transaction attempting to insert a second active subscription will immediately fail with a unique constraint violation (`23505`).

### 3.2 Does the profile RLS and column-level permission model prevent privilege escalation?
**Yes, unconditionally.** By revoking table-wide `UPDATE` and granting updates solely on `(full_name, avatar_url, updated_at)` to the `authenticated` role, direct modification of `role` or `id` is physically rejected by PostgreSQL. Even if an attacker executes raw SQL via the REST API, the command will abort with `permission denied for column "role"`. As a secondary barrier, the `prevent_profile_role_escalation()` trigger validates that only sessions with role `service_role` or existing `admin` profiles can alter user roles.

### 3.3 Is the registration trigger provably safe?
**Yes.** The `handle_new_user()` function:
- Sanitizes incoming metadata, providing fallback defaults if `raw_user_meta_data` is empty or malformed.
- Hardcodes `'listener'` role, ignoring any `role` or `is_admin` claims in user metadata.
- Defensively verifies the existence of the `'free'` subscription plan before insertion, self-healing the record if necessary.
- Executes within an isolated transaction. If an error occurs, it is logged and re-raised, rolling back the auth user insertion so the database never retains orphaned credentials without an accompanying profile.
- Fixes `search_path` to `public, auth, pg_temp` to prevent code injection.

### 3.4 Does the tier-limit data accurately match the approved project proposal?
**Yes.** All 11 feature dimensions from Section 6 of `REF/PROPOSAL.docx` have been mapped into `public.tier_limits`:
1. `playback_speed_max`: Free 1.0x, Plus 1.5x, Premium 2.0x.
2. `playhead_seeking_unlimited`: Free 0 (restricted to +15s forward), Plus 1, Premium 1.
3. `ad_free`: Free 0 (with ads), Plus 1, Premium 1.
4. `offline_downloads_count`: Free 0, Plus 1, Premium NULL (unlimited).
5. `full_audiobook_access`: Free 0 (previews only), Plus 1, Premium 1.
6. `sleep_timer_enabled`: Free 0, Plus 1, Premium 1.
7. `playlists_and_bookmarks_limit`: Free 5, Plus NULL, Premium NULL.
8. `cross_device_sync_enabled`: Free 0, Plus 1, Premium 1.
9. `ai_summary_monthly`: Free 0, Plus 5, Premium 30.
10. `exclusive_content_level`: Free 0, Plus 1, Premium 2.
11. `story_finder_daily`: Free 1, Plus 10, Premium NULL (with backend fair-use cap).

### 3.5 Could any implemented function expose another user's information?
**No.** All policies on `profiles` and `user_subscriptions` enforce `auth.uid() = user_id`. Stored functions that execute with elevated privileges (`set_updated_at`, `prevent_profile_role_escalation`, `handle_new_user`) do not accept arbitrary user IDs as parameters or return tabular user datasets to callers.

### 3.6 How will future AI quota enforcement remain atomic under concurrent requests?
When the `ai_usage` table is implemented in Sprint 5, atomic quota enforcement will be achieved using PostgreSQL **Row-Level Locking** within an atomic RPC function:
```sql
SELECT used_count FROM public.ai_usage 
WHERE user_id = p_user_id AND feature = p_feature AND period_start = v_today 
FOR UPDATE;
```
By acquiring an exclusive row lock (`FOR UPDATE`), two parallel requests arriving at the exact same millisecond are serialized. The first request increments the counter from 0 to 1; the second request reads 1 and is blocked if the limit is 1. This prevents race-condition bypasses.

---

## 4. Architectural Readiness for Remaining 15 Tables

The foundation established in Phase 2A provides clean foreign-key targets for the remaining modules:
- `categories.id` will serve as the foreign key for `audiobooks.category_id` and `podcasts.category_id`.
- `subscription_plans.id` will govern tier access on `audiobooks.tier_requirement` and `payment_transactions.plan_id`.
- `profiles.id` will anchor authors, reviews, bookmarks, listening history, and AI usage.

No destructive schema alterations will be required when adding the remaining tables in subsequent sprints.
