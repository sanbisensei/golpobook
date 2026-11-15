# GOLPOBOOK: TECHNICAL, ARCHITECTURAL & PROJECT AUDIT REPORT
**Document ID:** `01-PROJECT-AUDIT`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Audit Date:** November 2026  
**Auditor:** Senior Software Architect, Technical Project Manager & UI/UX Design Lead  
**Audit Status:** COMPLETE — PLANNING & AUDIT PHASE (Zero Code Execution)

---

## 1. Executive Summary & Codebase Baseline

This audit evaluates the current state of the **GolpoBook** repository against the approved project proposal (`REF/PROPOSAL.docx`) and visual design directives (`REF/DESIGN.md`, `REF/code.html`, `REF/screen.png`).

GolpoBook is conceived as an audio-first, personalized, subscription-based streaming web platform tailored for the Bangladeshi market, featuring:
1. Chapter-by-chapter audiobook streaming and podcast delivery.
2. Three-tiered monetization (Free, Plus, Premium) with local payment integration (SSLCommerz sandbox).
3. Taste-based onboarding and personalized "For You" recommendation feeds.
4. An AI-powered Story Finder using Retrieval-Augmented Generation (RAG) over Supabase `pgvector` that accepts natural-language queries in Bangla, Banglish, and English.
5. Server-enforced tier restrictions covering playback speed, seeking controls, sleep timer, offline downloads, and AI quotas.

### Current Repository Status
The repository currently represents an **initial scaffolding state** generated via `create-next-app` with selective UI component initialization. **No core application logic, database integrations, authentication handlers, payment workflows, audio streaming mechanisms, or AI pipelines have been implemented.**

| Dimension | Current State | Readiness Score |
| :--- | :--- | :--- |
| **Framework & Runtime** | Next.js 16.4.6 (App Router, Turbopack, React 19.3.0) | **15%** (Scaffolded, unconfigured) |
| **Styling & Design System** | Tailwind CSS v4.3.3 + shadcn Base-UI (neutral monochrome) | **20%** (Misaligned with `DESIGN.md`) |
| **Frontend UI Pages** | Default boilerplate (`app/page.js` default template) | **5%** (Zero product pages) |
| **Backend & Database** | Empty (`.env.local` 0 bytes, zero Supabase clients/schemas) | **0%** (Not started) |
| **Audio Engine** | `wavesurfer.js` installed in `package.json`, zero code | **0%** (Not started) |
| **Payment Gateway** | Zero code, zero SDKs, zero webhook handlers | **0%** (Not started) |
| **AI / RAG Pipeline** | Zero AI SDKs, zero pgvector migrations, zero RPCs | **0%** (Not started) |
| **Test Coverage & CI/CD** | Basic ESLint only, zero unit/integration tests | **0%** (Not started) |

---

## 2. Deep-Dive File & Environment Audit

### 2.1 Package & Runtime Configuration (`package.json`, `next.config.mjs`)
- **Next.js Version (`16.4.6`) & React (`19.3.0`)**:
  - The repository runs on bleeding-edge Next.js 16 and React 19.
  - *Critical Note*: `AGENTS.md` explicitly warns: *"This version has breaking changes — APIs, conventions, and file structure may all differ from your training data."*
  - `next.config.mjs` has experimental flags enabled:
    ```javascript
    cacheComponents: true,
    partialPrefetching: true,
    turbopack: {
      rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } }
    }
    ```
  - *Risk Assessment*: `cacheComponents: true` and `partialPrefetching: true` are bleeding-edge Next.js features. In Next.js 15/16, partial prefetching can cause unexpected hydration errors if client components read dynamic cookies or headers during streaming. The team must exercise caution when mixing client-side audio player state with server-side layout prefetching.

### 2.2 Tailwind CSS v4 & Styling Engine (`src/app/globals.css`)
- **Tailwind Version (`4.3.3`)**:
  - Tailwind CSS v4 completely eliminates `tailwind.config.js`. Instead, it uses CSS-first configuration via `@import "tailwindcss";` and `@theme inline { ... }`.
  - In `src/app/globals.css`, the repository imports:
    ```css
    @import "tailwindcss";
    @import "tw-animate-css";
    @import "shadcn/tailwind.css";
    ```
  - *Current Problem*: The color tokens defined in `globals.css` are the standard shadcn neutral grayscale palette (`oklch(0.145 0 0)` / `oklch(1 0 0)`). This is completely disconnected from the rich editorial paper palette specified in `REF/DESIGN.md` (`#F4EBD9`, `#EE6744`, `#F6D04D`, `#1A1A1A`).
  - *Font Variable Mismatch*: `src/app/layout.js` injects `--font-geist-sans` and `--font-geist-mono`, but `globals.css` defines `--font-sans: var(--font-sans)`. This breaks standard Tailwind font inheritance.

### 2.3 Component Library & Primitives (`components.json`, `src/components/ui/`)
- **Base UI Integration**:
  - `components.json` specifies `"style": "base-maia"`. The components in `src/components/ui/` (e.g. `button.jsx`, `dialog.jsx`, `sheet.jsx`, `tabs.jsx`) are built on `@base-ui/react` (Base UI primitives by the MUI team), rather than the traditional Radix UI primitives.
  - While Base UI is fast and accessible, the components currently inherit the default monochrome tokens.
- **Utility Export Bug (`src/lib/utils.js`)**:
  - Current code in `src/lib/utils.js`:
    ```javascript
    export { cn } from "cn";
    ```
  - Both `clsx` (`^2.1.1`) and `tailwind-merge` (`^3.7.0`) are installed in `package.json`, along with the third-party package `"cn": "^0.5.2"`.
  - In standard shadcn architectures, `cn` must be:
    ```javascript
    import { clsx } from "clsx";
    import { twMerge } from "tailwind-merge";
    export function cn(...inputs) { return twMerge(clsx(inputs)); }
    ```
  - Relying on the standalone `cn` npm package can fail to resolve complex Tailwind CSS v4 arbitrary class conflicts. This must be corrected in Sprint 1.

### 2.4 Dependency Redundancies & Conflicts
1. **Icon Library Clutter**:
   - `package.json` contains `@hugeicons/react` (`^1.1.10`), `@hugeicons/core-free-icons` (`^4.4.0`), and `lucide-react` (`^1.72.0`).
   - Meanwhile, the design prototype in `REF/code.html` uses Google `Material Symbols Outlined`!
   - *Impact*: Having three icon paradigms creates bundle bloat and visual inconsistency. A single standard must be locked (Hugeicons or Lucide).
2. **Missing Essential Packages**:
   - **No AI SDK**: Neither `@google/genai` nor `openai` is installed. The RAG Story Finder cannot function without an SDK or direct REST client.
   - **No Schema Validation**: `zod` is absent, which is critical for runtime validation of incoming SSLCommerz IPN callbacks and AI API responses in a JavaScript (non-TypeScript) codebase.
   - **No Audio State Management**: No lightweight state manager (such as `zustand`) is installed for managing the persistent global audio player across App Router route transitions.

### 2.5 Audio Visualizer Evaluation (`wavesurfer.js`)
- `wavesurfer.js` (`^8.1.0`) is present in `package.json`.
- *Architectural Warning*: Wavesurfer decodes raw audio files into memory using the browser's Web Audio API (`decodeAudioData`).
- In an audiobook platform where individual chapters last 20 to 60 minutes (20MB to 70MB MP3/AAC files):
  - Attempting to decode full-length audio files on client devices will cause **severe memory spikes, browser freezes, and crashes on mobile devices**.
  - Decoding a 40-minute file takes 5–15 seconds of 100% CPU time before playback can begin.
- *Recommendation*: Do **NOT** use Wavesurfer to decode full audio streams in real-time. Use the native HTML5 `<audio>` element (via custom React audio controller) for streaming and playback, and use pre-computed waveform JSON peaks, or lightweight canvas-based frequency visualizers during active playback.

---

## 3. Analysis of Project Proposal (`REF/PROPOSAL.docx`)

A rigorous review of the formal proposal submitted to the faculty reveals strong conceptual foundations, but several critical architectural oversights, technical contradictions, and unrealistic scope assumptions that must be addressed during planning.

### 3.1 Technical Contradictions Identified in the Proposal

| # | Proposal Statement | Technical Reality & Contradiction | Architectural Resolution |
| :--- | :--- | :--- | :--- |
| **1** | **Offline Downloads on Web**: Section 6 lists *"Podcasts + audiobooks (chapter-wise) for Premium; 1 download for Plus"* within a web browser app. | Browsers do not support true sandboxed, DRM-protected offline file downloads. Downloaded MP3 files become unprotected local files. IndexedDB audio caching is ephemeral and easily evicted by iOS Safari and Android Chrome. | Downgrade offline downloads to an **IndexedDB audio cache** for in-browser offline playback, with clear disclaimer that files cannot be exported as raw MP3s. |
| **2** | **Unlimited AI Story Finder on Premium**: Section 6.1 states *"Premium users have no limit"*. | Unlimited LLM & embedding API queries expose the student team to **devastating API cost spikes** and denial-of-wallet attacks if a user scripts automated calls. | Impose a **Fair-Use Ceiling** (e.g., 50 searches/day for Premium) protected by server-side rate limiters, without marketing it as a downgrade. |
| **3** | **Client-Side Playback Restrictions**: Section 6.1 notes *"Playback speed... is applied in the browser, so it is treated as a soft restriction"*. | The proposal admits playback speed and seek limits are soft. However, if audio URLs are public, users can simply open the URL in VLC or browser native player, completely bypassing speed, seeking, and ad restrictions. | Audio files must be stored in **Private Supabase Buckets** and accessed exclusively via **time-limited Signed URLs** (15-min expiry) with server-side tier gating. |
| **4** | **Timeline Misalignment**: Section 15 outlines a 12-week schedule (six 2-week sprints). | University semesters frequently compress coding into an intense **7 to 8-week active implementation window** once midterm exams, project approval, and final exams are factored in. | Create a dual-track roadmap: a formal 12-week schedule and an accelerated 7-week MVP execution plan. |
| **5** | **Banglish RAG Retrieval Degradation**: Proposal assumes standard embedding models handle *"amar voyer golpo shunte mon chacche"* directly. | OpenAI `text-embedding-3-small` and Gemini embeddings perform poorly on phonetic Banglish (Bengali written in Latin script) because Banglish has no standardized spelling. | Must insert a **Query Normalization Stage** using a fast, low-cost LLM (Gemini 2.0 Flash) to translate Banglish into standardized Bengali/English semantic keywords before vector embedding. |

---

## 4. Strengths & Weaknesses of Current Baseline

### 4.1 Strengths
1. **Modern Foundation**: Next.js App Router with React 19 and Turbopack provides the most capable web framework for server-side rendering, streaming, and SEO.
2. **Clear Aesthetic Target**: The presence of `REF/DESIGN.md` and `REF/code.html` gives the team an exact visual and stylistic reference, eliminating design ambiguity.
3. **Well-Defined Feature Scope**: The proposal articulates clear user stories, tier differentiation, and role distribution across the five team members.

### 4.2 Critical Weaknesses & Gaps
1. **Zero Backend Connectivity**: Not a single database table, migration, or authentication hook exists.
2. **Empty Environment Setup**: No keys for Supabase, SSLCommerz, or AI providers are configured.
3. **Design System Disconnect**: The current repository uses generic shadcn gray styles instead of the terracotta/canary/paper editorial design.
4. **Vulnerable Audio Gating**: Without private buckets and server-issued signed tokens, premium audio content is unprotected.
5. **Lack of Type Safety**: Developing a 20-table relational system with complex subscription state machines in plain JavaScript without TypeScript requires strict runtime validation schemas (`zod`).

---

## 5. Repository Readiness Scorecard

```
[System Architecture Readiness]       ██░░░░░░░░░░░░░░░░░░  10%
[Frontend Scaffolding]               ████░░░░░░░░░░░░░░░░  20%
[Design System Alignment]            ███░░░░░░░░░░░░░░░░░  15%
[Database & Backend Schema]          ░░░░░░░░░░░░░░░░░░░░   0%
[Audio Player Architecture]          ░░░░░░░░░░░░░░░░░░░░   0%
[Monetization & Payment Pipeline]    ░░░░░░░░░░░░░░░░░░░░   0%
[AI & Vector Search Readiness]       ░░░░░░░░░░░░░░░░░░░░   0%
[Security & Tier Protection]         ░░░░░░░░░░░░░░░░░░░░   0%
------------------------------------------------------------
OVERALL IMPLEMENTATION READINESS:     ██░░░░░░░░░░░░░░░░░░   6%
```

**Audit Verdict**: The repository is in a clean, blank slate state. This is advantageous because no architectural debt has been accumulated yet. However, the team must adhere strictly to the prioritized implementation roadmap to complete this project within the academic semester.
