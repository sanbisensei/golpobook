# GolpoBook: Registration Trigger & Identity Provisioning Architecture
**Document ID:** `03-REGISTRATION-TRIGGER-EXPLANATION`  
**Phase:** Sprint 1 Phase 2A — Database Foundation & Security Design  
**Author:** Senior Backend Architect & Database Lead  
**Function:** `public.handle_new_user()` on `auth.users`  
**Status:** VALIDATED FOR PRODUCTION DEPLOYMENT

---

## 1. Overview & Operational Mandate

When a listener signs up for GolpoBook through Supabase Auth (via email/password or OAuth), an account record is inserted into the internal `auth.users` table managed by GoTrue.

To guarantee that every registered user immediately possesses:
1. A corresponding profile record in `public.profiles`.
2. An initial **Free Explorer** subscription instance in `public.user_subscriptions`.
3. Safe default settings and non-privileged role assignment (`listener`),

we employ an automated database trigger: `on_auth_user_created` executing `public.handle_new_user()`.

```
[ Listener Submits Sign-Up Form ]
                 |
                 v
      [ POST /auth/v1/signup ]
                 |
                 v
   [ Insert into auth.users (ID, Email, Raw Metadata) ]
                 |
                 v
   [ TRIGGER: on_auth_user_created ] (AFTER INSERT)
                 |
                 v
   [ FUNCTION: public.handle_new_user() ] (SECURITY DEFINER)
   |
   +---> 1. Sanitize & extract full_name / avatar_url
   |
   +---> 2. Hardcode role = 'listener' (Ignore any client 'admin' claim)
   |
   +---> 3. INSERT INTO public.profiles
   |
   +---> 4. Verify 'free' plan exists in subscription_plans (Self-healing fallback)
   |
   +---> 5. INSERT INTO public.user_subscriptions (status = 'active', plan = 'free')
                 |
                 v
[ Transaction Commits: User Authenticated with Complete Profile & Active Free Tier ]
```

---

## 2. Detailed Technical Walkthrough

### 2.1 The Complete Trigger Code
```sql
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
    v_full_name := COALESCE(NULLIF(SPLIT_PART(NEW.email, '@', 1), ''), 'Listener');
  END IF;

  -- B. Insert Profile record (strictly hardcoded to 'listener' role)
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
    INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, is_active, display_order)
    VALUES ('free', 'Free Explorer', 'Standard free tier', 0.00, 0.00, true, 1)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- D. Initialize initial Free subscription record
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
    RAISE WARNING 'handle_new_user failed for auth.users id %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;
```

---

## 3. Security Analysis: Why Elevated Privileges Are Required & How They Are Contained

### 3.1 Why `SECURITY DEFINER` is Strictly Necessary
By default, PostgreSQL functions execute with the privileges of the calling user (`SECURITY INVOKER`).  
When a new user registers through Supabase Auth, the insertion into `auth.users` is executed by the internal role `supabase_auth_admin`. At the moment of registration:
1. The user has not yet established an authenticated session JWT.
2. Under Row Level Security, the user has zero permission to insert into `public.profiles` or `public.user_subscriptions`.
3. If `handle_new_user()` executed as `SECURITY INVOKER`, the attempt to insert the profile and subscription would be blocked by RLS, causing the registration request to fail.

Declaring `SECURITY DEFINER` elevates the function's execution privileges to the database owner (the role that created the function), allowing it to provision the necessary relational records across schemas.

### 3.2 Mitigation Against Search-Path Hijacking
A known vulnerability in PostgreSQL `SECURITY DEFINER` functions is search-path manipulation: if an attacker creates a malicious function named `now()` or a malicious table in a schema placed early in the search path, the elevated function could execute arbitrary malicious code.

**Protection Implemented:**
```sql
SET search_path = public, auth, pg_temp;
```
By hardcoding the `search_path` directly in the function declaration, PostgreSQL guarantees that only trusted schemas are searched during execution, completely neutralizing search-path hijacking attacks.

### 3.3 Revocation of Direct Execution Privileges
By default in PostgreSQL, any database role (including `PUBLIC` and `anon`) can execute newly created functions unless explicitly revoked.
If a malicious user could call `SELECT handle_new_user()` directly, they could trigger arbitrary trigger logic.

**Protection Implemented:**
```sql
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
```
Direct invocation over the HTTP API is completely denied. Only the internal `supabase_auth_admin` engine can fire this function via the trigger.

---

## 4. Input Sanitization & Self-Healing Architecture

### 4.1 Anti-Tampering Metadata Coercion
Users can pass custom JSON during registration via the `data` option:
```javascript
supabase.auth.signUp({
  email: 'user@example.com',
  password: '...',
  options: {
    data: { full_name: 'Attacker', role: 'admin' } // Malicious injection attempt
  }
});
```
`handle_new_user()` treats all client-supplied data as untrusted:
- `full_name` and `avatar_url` are extracted, trimmed, and sanitized. Empty strings are converted to `NULL` via `NULLIF()`.
- If `full_name` is missing, it falls back to the email prefix (e.g. `user` from `user@example.com`), and finally to `'Listener'`.
- **The `role` parameter is completely ignored.** The function hardcodes `'listener'`, preventing any possibility of self-assigned admin privileges upon signup.

### 4.2 Guaranteed Existence of 'free' Subscription Plan
If `handle_new_user()` attempts to insert into `user_subscriptions` with `plan_id = 'free'`, but the `'free'` row in `subscription_plans` is missing (due to an accidental admin deletion or out-of-order seeding), the foreign key check would fail, breaking all user signups.

The trigger includes a **Self-Healing Fallback**: it queries `subscription_plans` first. If missing, it immediately inserts the default `'free'` plan before proceeding.

### 4.3 Idempotency & Conflict Handling
In distributed cloud architectures, network retries or identity provider webhook replays can re-trigger `on_auth_user_created` for the same user ID.
- `INSERT INTO public.profiles ... ON CONFLICT (id) DO UPDATE ...` handles existing profiles gracefully without throwing uniqueness errors.
- `IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = NEW.id AND status = 'active')` ensures that retries never insert duplicate active subscriptions.

### 4.4 Transactional Atomicity & Error Safety
The trigger executes within the exact same database transaction as the `auth.users` insert:
- If an unhandled exception occurs inside `handle_new_user()`, the `EXCEPTION` block logs the failure via `RAISE WARNING` and re-raises the error via `RAISE;`.
- Re-raising the error **rolls back the entire auth registration**.
- **Crucial Invariant:** An auth user is **never** created without an accompanying profile and active subscription. The database never retains half-provisioned orphan accounts.
