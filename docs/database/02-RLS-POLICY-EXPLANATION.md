# GolpoBook: Row Level Security (RLS) & Access Governance Specification
**Document ID:** `02-RLS-POLICY-EXPLANATION`  
**Phase:** Sprint 1 Phase 2A — Database Foundation & Security Design  
**Author:** Senior Backend Architect & Supabase Security Architect  
**Status:** COMPLETE RLS SECURITY AUDIT & SPECIFICATION

---

## 1. Security Philosophy & The PostgREST Threat Model

When utilizing Supabase, the PostgreSQL database is exposed directly to the internet through the PostgREST auto-generated Data API. Every table in the `public` schema can be targeted with `GET`, `POST`, `PATCH`, and `DELETE` requests using the browser's public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) or a logged-in user's JWT.

**Core Invariant:**  
In a production-grade commercial platform, **client-side JavaScript cannot be trusted**. Security must never rely on hiding UI buttons or frontend validation checks. If a user can craft a `fetch()` request from browser DevTools that modifies a privileged column or accesses another user's private data, the system is fundamentally compromised.

To guarantee zero unauthorized access, GolpoBook employs a **Multi-Layer Defense Strategy**:
1. **Default Deny**: Row Level Security (RLS) is enabled on 100% of application tables. With no matching policy, operations are rejected by default.
2. **Column-Level Privileges (SQL GRANT/REVOKE)**: Limiting which exact columns can be updated, even when row-level policies match.
3. **Trigger-Based Validation**: Database-level triggers intercepting privileged field mutations and raising fatal exceptions.
4. **Service-Role Isolation**: High-privilege writes (such as activating a paid subscription or updating tier capabilities) are restricted to backend Route Handlers executing with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Policy-by-Policy Security Audit

---

### Table: `public.profiles`
**Purpose:** Stores user identity, display metadata, and platform role (`listener` vs `admin`).  
**Sensitivity:** High. Contains user identity and authorization credentials.

#### 1. Policy: `profiles_select_own`
```sql
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```
- **Target Role:** `authenticated`
- **Operation:** `SELECT`
- **Mechanism:** Compares the PostgreSQL function `auth.uid()` (which extracts the cryptographic subject claim from the verified JWT) against the table's `id` column.
- **Threat Mitigated:** Prevents any user from reading another listener's profile data, email identifiers, or account metadata.

#### 2. Policy: `profiles_select_admin`
```sql
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
```
- **Target Role:** `authenticated` (Admins)
- **Operation:** `SELECT`
- **Mechanism:** Evaluates whether the currently authenticated user possesses `role = 'admin'` in `public.profiles`. If true, permits querying all profiles for backoffice user management.
- **Threat Mitigated:** Guarantees administrative oversight while preventing ordinary listeners from inspecting the user directory.

#### 3. Policy: `profiles_update_own` & Column Privileges
```sql
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (role = 'listener' OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;
```
- **Target Role:** `authenticated`
- **Operation:** `UPDATE`
- **Threat Mitigated: Privilege Escalation (Elevation to Admin)**:
  - If a user sends: `supabase.from('profiles').update({ role: 'admin' })`, PostgreSQL **column-level privileges immediately abort the query**, because the `authenticated` role only possesses update privileges on `full_name`, `avatar_url`, and `updated_at`.
  - As a secondary defense, the `WITH CHECK` clause verifies that the resulting row does not alter the role to anything other than `'listener'`.
  - As a tertiary defense, the `trigger_guard_profile_role_escalation` trigger intercepts mutations on `NEW.role` and raises an exception if the caller is not an admin or `service_role`.

#### 4. Direct Client `INSERT` & `DELETE`
- **Policy:** **None.** (Default Deny)
- **Mechanism:** Profiles can only be created via the `handle_new_user()` trigger running with `SECURITY DEFINER` privileges upon auth signup. Direct client profile creation and deletion are strictly blocked.

---

### Table: `public.subscription_plans`
**Purpose:** Defines platform tiers (`free`, `plus`, `premium`), pricing, and billing options.  
**Sensitivity:** Medium. Public pricing catalog; must be read by anonymous visitors, but tamper-proof.

#### 1. Policy: `subscription_plans_select_public`
```sql
CREATE POLICY "subscription_plans_select_public"
  ON public.subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
```
- **Target Role:** `anon`, `authenticated`
- **Operation:** `SELECT`
- **Mechanism:** Grants public read access to active subscription plans so the `/pricing` page and checkout modals can display tier prices and names without requiring authentication.
- **Threat Mitigated:** Prevents unauthorized viewing of unreleased, deprecated, or draft plans (`is_active = false`).

#### 2. Policy: `subscription_plans_modify_admin`
```sql
CREATE POLICY "subscription_plans_modify_admin"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```
- **Target Role:** `authenticated` (Admin only)
- **Operation:** `ALL` (`INSERT`, `UPDATE`, `DELETE`)
- **Threat Mitigated:** Prevents ordinary listeners or attackers from tampering with subscription prices (e.g. setting Plus price to BDT 0.00).

---

### Table: `public.tier_limits`
**Purpose:** Stores dynamic capability limits (playback speed, daily Story Finder searches, sleep timer, offline downloads).  
**Sensitivity:** High. Governs commercial feature gating.

#### 1. Policy: `tier_limits_select_public`
```sql
CREATE POLICY "tier_limits_select_public"
  ON public.tier_limits
  FOR SELECT
  TO anon, authenticated
  USING (true);
```
- **Target Role:** `anon`, `authenticated`
- **Operation:** `SELECT`
- **Mechanism:** Allows the frontend UI to read tier capabilities for comparison tables, locked feature badges, and quota notices.
- **Security Check:** Does this leak sensitive data? **No.** Tier limits are public platform rules (e.g. "Free tier allows 1.0x speed").

#### 2. Policy: `tier_limits_modify_admin`
```sql
CREATE POLICY "tier_limits_modify_admin"
  ON public.tier_limits
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```
- **Target Role:** `authenticated` (Admin only)
- **Operation:** `ALL`
- **Threat Mitigated:** Completely blocks any listener from modifying tier limits (e.g. giving Free tier unlimited daily AI searches).

---

### Table: `public.categories`
**Purpose:** Content genres and browse taxonomies.  
**Sensitivity:** Low. Public catalog metadata.

#### 1. Policy: `categories_select_public`
```sql
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
```
- **Target Role:** `anon`, `authenticated`
- **Operation:** `SELECT`
- **Mechanism:** Allows unauthenticated and authenticated listeners to browse and filter audiobooks by category.

#### 2. Policy: `categories_modify_admin`
```sql
CREATE POLICY "categories_modify_admin"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```
- **Target Role:** `authenticated` (Admin only)
- **Operation:** `ALL`
- **Threat Mitigated:** Prevents vandalism or unauthorized insertion of fraudulent content categories.

---

### Table: `public.user_subscriptions`
**Purpose:** Ledger recording user subscription plans, status (`active`, `expired`, `cancelled`), and expiry timestamps.  
**Sensitivity:** **Critical.** The core commercial ledger of the platform.

#### 1. Policy: `user_subscriptions_select_own`
```sql
CREATE POLICY "user_subscriptions_select_own"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```
- **Target Role:** `authenticated`
- **Operation:** `SELECT`
- **Mechanism:** A listener can query their own active and historical subscription records to display active plan status, renewal dates, and payment history in `/account`.
- **Threat Mitigated:** Prevents any listener from inspecting another user's billing dates, plan status, or subscription history.

#### 2. CRITICAL SECURITY INVARIANT: Absence of Client-Side `INSERT`, `UPDATE`, `DELETE` Policies
- **Target Role:** `authenticated`, `anon`
- **Operation:** `INSERT`, `UPDATE`, `DELETE`
- **Policy:** **NONE EXIST.** (Default Deny)
- **Architectural Rationale:**
  - If an authenticated user had an `INSERT` policy on `user_subscriptions`, they could execute:
    ```javascript
    supabase.from('user_subscriptions').insert({
      user_id: user.id,
      plan_id: 'premium',
      status: 'active',
      expires_at: '2099-01-01'
    });
    ```
    This would bypass payment gateways and unlock premium content for free.
  - By providing **ZERO client write policies**, PostgreSQL physically rejects any direct mutation from a browser session.
  - Subscriptions can **ONLY** be modified by:
    1. The `handle_new_user()` registration trigger (which runs as `SECURITY DEFINER`).
    2. Server-side payment callbacks (`/api/payment/ipn`) executing via the Supabase Service Role client (`SUPABASE_SERVICE_ROLE_KEY`), which operates with elevated backend privileges.
    3. Dedicated, authenticated administrative RPC procedures.

---

## 3. Summary of Access Control Matrix

| Table Name | Public (`anon`) | Listener (`authenticated`) | Administrator | Service Role (Backend) |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | None | `SELECT` (own), `UPDATE` (own safe cols) | `SELECT` (all), `UPDATE` (all) | Full Access (Bypass RLS) |
| `subscription_plans` | `SELECT` (active) | `SELECT` (active) | Full Access (`ALL`) | Full Access (Bypass RLS) |
| `tier_limits` | `SELECT` (all) | `SELECT` (all) | Full Access (`ALL`) | Full Access (Bypass RLS) |
| `categories` | `SELECT` (active) | `SELECT` (active) | Full Access (`ALL`) | Full Access (Bypass RLS) |
| `user_subscriptions` | None | `SELECT` (own only) | `SELECT` (all), `UPDATE` (all) | Full Access (Bypass RLS) |

This access governance framework guarantees that user data is isolated, platform pricing is protected, and subscriptions cannot be self-elevated under any circumstance.
