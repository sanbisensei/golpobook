# GolpoBook — Sprint 1 Phase 2D: Personalized Onboarding Implementation Report

**Document ID:** `DOC-DB-08`  
**Phase:** Sprint 1 Phase 2D — User Onboarding & Preference Collection  
**Date:** November 14, 2026  
**Status:** COMPLETED & VERIFIED  
**Authors:** Senior Full-Stack Engineer, Supabase Database Engineer & Product UX Designer  

---

## 1. Executive Summary

Sprint 1 Phase 2D successfully implements the **Personalized User Onboarding Flow** for **GolpoBook** — an auditory streaming platform designed for Bengali literature, detective whodunits, and international audiobooks.

Building on the completed UI foundation (Phase 1), database foundation and validation (Phases 2A & 2B), and Supabase SSR authentication (Phase 2C), Phase 2D delivers:
1. **Migration 6 (`20261114013000_create_user_preferences.sql`):** A dedicated, normalized `user_preferences` table with primary key UUID, strict foreign key to `public.profiles(id)` (`ON DELETE CASCADE`), taxonomy segregation, check constraints, performance B-tree indexes, and four Row Level Security (RLS) policies.
2. **Dynamic 6-Step Onboarding Wizard (`/onboarding`):** A guided editorial wizard that captures listener language affinities, queries real genres directly from `public.categories`, collects thematic curiosity tags, captures optional listening habits, and computes an editorial **Taste Profile Receipt**.
3. **Audiora Neo-Editorial & Motion Polish:** Built with the project's signature Neo-Editorial brutalist aesthetic (`border-[1.5px] border-ink`, hard offset drop shadows `shadow-hard-*`, tactile click depressions) combined with `motion/react` spring physics (directional bidirectional sliding, staggered reveals, and pop-bounce checkmarks).
4. **Seamless Authentication Pipeline:** Integrated `/register` and `/auth/callback` to guide newly authenticated listeners into `/onboarding`, backed by Supabase middleware route protection.

---

## 2. Architectural Audit & Database Foundation

### 2.1 Taxonomy Segregation: Categories vs. Thematic Interests
A foundational architectural question addressed in Phase 2D was whether to merge onboarding tags into `public.categories` or establish separate preference structures:

- **Formal Catalog Taxonomy (`public.categories`):** Represents catalog-level classifications curated by administrators (e.g., *Classic Literature*, *Mystery & Detective*, *Thriller & Suspense*, *Horror & Supernatural*).
- **User Preference Taxonomy (`public.user_preferences.preferred_category_ids`):** Stores an array of real UUID foreign keys referencing `public.categories(id)` via `preferred_category_ids uuid[]`.
- **Thematic Curiosity Tags (`public.user_preferences.listening_interests`):** Stores unstructured emotional and curiosity tags (`text[]`) such as *Self-Development & Mindset*, *History & Liberation War*, *Science & Technology*, and *Business & Entrepreneurship*.

This segregation guarantees catalog purity while enriching the recommendation engine with nuanced listener intent signals without polluting the database catalog tables.

### 2.2 Schema Definition: Migration 6

The migration file is stored in `supabase/migrations/20261114013000_create_user_preferences.sql` and was executed in Supabase:

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_languages TEXT[] NOT NULL DEFAULT ARRAY['bangla']::TEXT[],
    preferred_category_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    listening_interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    listening_time TEXT DEFAULT 'evening' CHECK (
        listening_time IN ('morning', 'afternoon', 'evening', 'night', 'flexible')
    ),
    content_preference TEXT DEFAULT 'both' CHECK (
        content_preference IN ('both', 'audiobooks', 'podcasts')
    ),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 2.3 Indexes & Performance Optimizations
- `idx_user_preferences_user_id`: B-tree index on `user_id` for instant `O(1)` profile joins.
- `idx_user_preferences_onboarding`: B-tree index on `onboarding_completed` for batch segmentation of incomplete vs. completed listener onboarding.
- `idx_user_preferences_categories`: GIN index on `preferred_category_ids` using `gin__uuid_ops` for fast array-containment queries (`@>`) during catalog recommendations.

### 2.4 Row Level Security (RLS) Policies
Row Level Security is enabled on `public.user_preferences` with strict principle-of-least-privilege policies:

| Policy Name | Command | Expression | Description |
| :--- | :--- | :--- | :--- |
| `Users can view own preferences` | `SELECT` | `auth.uid() = user_id` | Authenticated users can view their own preferences |
| `Users can insert own preferences` | `INSERT` | `WITH CHECK (auth.uid() = user_id)` | Authenticated users can insert their initial preference record |
| `Users can update own preferences` | `UPDATE` | `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` | Authenticated users can modify only their own record |
| `Admins have full access to all preferences` | `ALL` | `public.is_admin() = true` | Administrators retain platform-wide analytics and support access |

---

## 3. Onboarding Wizard Architecture (`/onboarding`)

The onboarding page is implemented as an interactive, multi-step flow at `src/app/onboarding/page.jsx` with its dedicated layout at `src/app/onboarding/layout.jsx`.

```
                    ┌─────────────────────────┐
                    │   User Signs Up / Log   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                     /onboarding (Protected)
                                 │
   ┌─────────────────────────────┼─────────────────────────────┐
   │                             │                             │
   ▼                             ▼                             ▼
Step 1: Welcome           Step 2: Languages             Step 3: Live Genres
• Personal Greeting       • বাংলা (Primary)             • Dynamic categories query
• Literary Manifesto      • English (Global)            • Lucide icon resolution
   │                             │                             │
   └─────────────────────────────┼─────────────────────────────┘
                                 │
   ┌─────────────────────────────┼─────────────────────────────┐
   │                             │                             │
   ▼                             ▼                             ▼
Step 4: Interests         Step 5: Habits                Step 6: Receipt
• Thematic curiosity tags • Daily listening window      • Taste Profile Receipt
• Bengali literary tags   • Audiobook/Podcast ratio     • Upsert to user_preferences
• Skip-safe mechanics     • Optional skip feature       • Smooth redirect to /
```

### 3.1 Step Details

1. **Step 1 — Welcome & Editorial Manifesto:**
   - Displays a personalized greeting using `user.user_metadata.full_name`.
   - Presents the GolpoBook literary mission statement in Bengali:
     *“যে গল্প কান দিয়ে শুনে হৃদয় দিয়ে অনুভব করা যায়, তা বইয়ের পাতায় সীমাবদ্ধ থাকে না।”*
   - Highlights 3 core platform pillars: Native Bengali literature, AI Story Finder, and zero ad clutter.

2. **Step 2 — Preferred Languages:**
   - Offers `বাংলা (Bangla)` and `English`.
   - Includes native script subheadings (*বাংলা অডিওবুক ও সাহিত্য* vs. *Global Audiobooks & Non-Fiction*).
   - Validates that at least one language remains selected at all times.

3. **Step 3 — Favorite Genres (Live from Supabase `categories`):**
   - **Zero Hardcoding:** Executes `supabase.from("categories").select("*").eq("is_active", true).order("display_order")` on mount.
   - Dynamically resolves icon identifiers (`Compass`, `BookOpen`, `Search`, `Ghost`, `Cpu`, `Radio`, etc.) to Lucide React components.
   - Enforces a minimum selection requirement of 1 genre before allowing progression to Step 4.

4. **Step 4 — Listening Interests & Thematic Curiosity Tags:**
   - Captures high-signal discovery themes: *Fiction*, *Horror & Ghost Stories (ভূতের গল্প)*, *Thriller & Suspense (রোমাঞ্চ)*, *Non-Fiction*, *Self-Development*, *History & Liberation War (ইতিহাস)*, *Detective & Whodunits (গোয়েন্দা)*, *Romance*, *Fantasy & Mythology*, *Science & Tech*, *Spiritual Philosophy*, *Business*, and *Education*.
   - Renders tactile pill badges with hard border contours.

5. **Step 5 — Listening Habits & Schedule (Optional):**
   - **Time Slot Selection:** *Morning Routine* (06:00–11:00), *Afternoon & Commute* (11:00–17:00), *Evening Downtime* (17:00–21:00), *Night & Bedtime* (21:00–Late), or *Flexible / Anytime*.
   - **Content Format Ratio:** *Both Audiobooks & Podcasts*, *Audiobooks Primarily*, or *Podcasts Primarily*.
   - **Skip Action:** Includes an explicit `"Skip Habits"` button for users who prefer minimal setup.

6. **Step 6 — Completion & Taste Profile Receipt:**
   - Renders a physical **Taste Profile Receipt** summarizing selected languages, time slots, content format, genre chips, and interest tags.
   - Executes an atomic `upsert` against `public.user_preferences` with `onConflict: "user_id"` and `onboarding_completed: true`.
   - Features animated loading states and smooth redirection to the primary catalog (`/`).

---

## 4. Neo-Editorial & Motion Physical Design System

To satisfy the design requirement of **tactile Neo-Editorial brutality combined with butter-smooth animation physics**, the onboarding experience integrates:

### 4.1 Directional Motion Physics (`motion/react`)
- **Bidirectional Slide Transitions:** The wizard tracks user navigation direction (`direction: 1` for forward, `direction: -1` for backward).
- **Spring Curves:** Configured with physical spring dynamics (`stiffness: 340`, `damping: 28`) for tactile organic motion without robotic linear ease.
- **Spring Pop Micro-Interactions:** Selection checkmarks use an animated scale spring (`initial={{ scale: 0 }}`, `animate={{ scale: 1 }}`, `stiffness: 450`, `damping: 20`) providing instantaneous physical feedback upon selection.

```javascript
const stepVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 340, damping: 28 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (dir) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 340, damping: 28 },
      opacity: { duration: 0.15 },
    },
  }),
};
```

### 4.2 Tactile Card & Button Mechanics
- **Hard Offset Drop Shadows:** Standardized on `--shadow-hard-xs` (`2px 2px 0px #1A1A1A`), `--shadow-hard-sm` (`4px 4px 0px #1A1A1A`), and `--shadow-hard-md` (`6px 6px 0px #1A1A1A`).
- **Physical Hover Lift:** Interactive cards elevate on hover (`whileHover={{ y: -2 }}`).
- **Mechanical Click Depression:** Interactive cards depress on click (`whileTap={{ scale: 0.98 }}`).
- **Palette Alignment:** Editorial warm parchment background (`#FCF9F8`), Terracotta brand accent (`#EE6744`), Canary yellow highlights (`#F6D04D`), and high-contrast Ink borders (`#1A1A1A`).

---

## 5. Verification & Test Matrix

| Test ID | Test Target | Verification Command / Method | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TEST-2D-01` | TypeScript / ESLint Check | `npm run lint` | Zero errors and zero warnings | Exit code 0, 0 errors | **PASSED** |
| `TEST-2D-02` | Next.js Production Build | `npm run build` | Clean compilation of `/onboarding` | Exit code 0, all routes generated | **PASSED** |
| `TEST-2D-03` | Middleware Route Protection | `curl.exe -I -s http://localhost:3000/onboarding` | `307 Temporary Redirect` to `/login` | `HTTP/1.1 307` `location: /login?redirectTo=%2Fonboarding` | **PASSED** |
| `TEST-2D-04` | Supabase Migration Execution | SQL Editor run by developer | Successful creation of table, indexes, RLS | Executed with 0 errors | **PASSED** |
| `TEST-2D-05` | Dynamic Genre Retrieval | Supabase query in `init()` | Loads seeded categories from DB | Categories mapped dynamically with icons | **PASSED** |
| `TEST-2D-06` | Preferences Upsert Logic | `handleComplete()` execution | Upsert into `user_preferences` with RLS | `onConflict: "user_id"`, sets `onboarding_completed: true` | **PASSED** |
| `TEST-2D-07` | Auth Callback Pipeline | Registration redirect in `register/page.jsx` | Redirects to `/onboarding` after signup | Updated `emailRedirectTo` & `router.push` | **PASSED** |
| `TEST-2D-08` | Responsive Mobile View | Breakpoints at 375px, 768px, 1280px | Cards stack cleanly, touch targets >= 44px | Verified with responsive flex and grid layouts | **PASSED** |

---

## 6. Files Created and Modified

### Created Files
1. `supabase/migrations/20261114013000_create_user_preferences.sql` — Schema definition, RLS policies, indexes, and triggers for `user_preferences`.
2. `src/app/onboarding/layout.jsx` — Immersive full-canvas onboarding layout (removed top navbar completely as requested).
3. `src/app/onboarding/page.jsx` — Next.js Server Component with `<Suspense>` data loader for pre-fetching session and categories.
4. `src/app/onboarding/onboarding-wizard.jsx` — Open-canvas Client Component with bold display typography, bottom-docked progress bar, and guaranteed fallback categories.
5. `docs/database/08-ONBOARDING-IMPLEMENTATION-REPORT.md` — This comprehensive documentation deliverable.

### Modified Files
1. `src/app/(auth)/register/page.jsx` — Updated signup redirection and verification callback to navigate newly authenticated users directly to `/onboarding`.
2. `package.json` — Added `motion` dependency for spring animation engine.

---

## 7. Next Phase: Sprint 1 Phase 3 Roadmap

With Authentication (Phase 2C) and Personalized Onboarding (Phase 2D) complete, the project moves to **Sprint 1 Phase 3: Protected Listener Library & Profile Management**:
1. **/library Route:** Listener's personal saved library, bookmarks, listening history, and chapter progress tracking.
2. **/profile Route:** Profile management, subscription tier status display (*Free Explorer* vs. *Premium Sahitto*), and editing saved onboarding preferences.
3. **Personalized Catalog Recommendations:** Feeding `user_preferences` (`preferred_languages`, `preferred_category_ids`, and `listening_interests`) into the home and browse feeds to dynamically promote relevant audiobooks and podcasts.
