# GOLPOBOOK: UI/UX DESIGN SYSTEM & INTERACTION SPECIFICATION
**Document ID:** `02-UI-UX-DESIGN-SYSTEM`  
**Course:** CSE 495 – IT Project Management  
**Project:** GolpoBook – Personalized Subscription-Based Audiobook & Podcast Platform  
**Design Direction:** "Audiora Neo-Editorial" (Literary Tactile Minimalism)  
**Status:** SPECIFICATION APPROVED FOR SPRINT 1 THEME ADOPTION

---

## 1. Visual Identity & Brand Philosophy

GolpoBook is designed to evoke the tactile, intellectual warmth of vintage print publishing, independent literary journals, and mid-century graphic ephemera, seamlessly fused with a high-performance modern audio interface.

### 1.1 The Anti-SaaS Manifesto
Most modern SaaS dashboards rely on sterile cold grays, generic indigo/purple gradients, blurred glassmorphism, floating drop shadows, and over-animated micro-interactions. 

**GolpoBook rejects this paradigm entirely:**
- **Zero Diffuse Shadows**: No Gaussian blurs or floating card elevations. Surfaces do not levitate.
- **Architectural Framing**: Sections, sidebars, and cards are separated by crisp, deliberate **1.5px solid ink-black borders (`#1A1A1A`)**.
- **Tactile Paper Canvas**: Backgrounds celebrate unbleached book-stock, newsprint, and warm parchment rather than stark digital white (`#FFFFFF`) or cold blue-black (`#0B0F19`).
- **High-Contrast Editorial Color Blocking**: A signature terracotta coral (`#EE6744`) reserved for high-intent audio actions, a canary yellow (`#F6D04D`) dedicated to search and discovery, and warm antique amber accents (`#E8B931`).
- **Hard Offsets**: Overlays and interactive elements use hard 2px to 3px solid black offset shadows (`box-shadow: 2px 2px 0px #1A1A1A`) that physically depress on click (`translate(1px, 1px)`).

---

## 2. Color Palette & Token System

The color architecture is built around three distinct tiers: **Base Paper Surfaces**, **Editorial Structural Ink**, and **Functional Editorial Accents**.

### 2.1 Complete Token Mapping Table

| Token Name | Light Mode Value | Dark Mode Value | Semantic Role & UI Placement |
| :--- | :--- | :--- | :--- |
| `--color-canvas-base` | `#FCF9F8` / `#F4EBD9` | `#141413` | Deep page background (book stock / dark binding cloth) |
| `--color-surface-card` | `#FDFBF7` | `#1C1B1A` | Content containers, card fills, inspector panels |
| `--color-surface-dim` | `#EFE4CE` / `#E5E2E1` | `#262523` | Framing strips, section bands, table header fills |
| `--color-ink-primary` | `#1A1A1A` / `#1C1B1B` | `#F5F2EB` | High-contrast structural text, outlines, borders |
| `--color-ink-muted` | `#58413C` | `#A69C97` | Secondary metadata, narrator names, timestamps |
| `--color-accent-terracotta` | `#EE6744` / `#AA3617` | `#F07150` | **Primary Brand Accent**: Play buttons, active tabs |
| `--color-accent-canary` | `#F6D04D` / `#FDD753` | `#E5C036` | **Secondary Brand Accent**: Search bars, VIP badges |
| `--color-accent-amber` | `#E8B931` / `#D2A51A` | `#D9AB25` | Rating stars, bookmark indicators, warning pills |
| `--color-accent-error` | `#BA1A1A` | `#FF6B6B` | Error alerts, failed transactions, cancel prompts |
| `--color-border-rule` | `#1A1A1A` | `#383633` | Continuous 1.5px structural partition rules |

### 2.2 Dark Mode Strategy: "Obsidian Library"
Dark mode in GolpoBook must **NOT** be converted into a cold, purple-tinted dark gray. Instead, it must embody the ambiance of an intimate, dimly lit private library at midnight:
- Canvas transitions from warm cream paper to **dark bookbinding morocco leather (`#141413`)**.
- Card surfaces use **aged charcoal slate (`#1C1B1A`)**.
- Borders soften slightly to **burnished bronze-tinted charcoal (`#383633`)** to prevent harsh optical glare while maintaining crisp structural definition.
- High-intent terracotta (`#F07150`) and canary yellow (`#E5C036`) remain vibrant, illuminating key controls against dark backgrounds.

### 2.3 Proposed Tailwind CSS v4 `@theme inline` Definition
To replace the default neutral shadcn tokens in `src/app/globals.css`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Audiora Neo-Editorial Custom Tokens */
  --color-terracotta: #ee6744;
  --color-canary: #f6d04d;
  --color-amber: #e8b931;
  --color-paper: #f4ebd9;
  --color-ink: #1a1a1a;

  /* Typography */
  --font-display: var(--font-space-grotesk), sans-serif;
  --font-body: var(--font-courier-prime), monospace;
  --font-bengali: var(--font-anek-bangla), sans-serif;

  /* Architectural Hard Shadows */
  --shadow-hard-xs: 1px 1px 0px #1a1a1a;
  --shadow-hard-sm: 2px 2px 0px #1a1a1a;
  --shadow-hard-md: 3px 3px 0px #1a1a1a;
  --shadow-hard-lg: 4px 4px 0px #1a1a1a;
}
```

---

## 3. Typography Architecture

The typographic hierarchy juxtaposes technical geometric sans-serif headings with the tactile literary heritage of vintage typewriter monospace, supplemented by a high-legibility Bengali typeface for localized content.

```
+-----------------------------------------------------------------------+
|  TYPOGRAPHY PAIRING MATRIX                                            |
|                                                                       |
|  DISPLAY & HEADINGS:   Space Grotesk (700 / 600 / 500)                |
|  - Architectural, compact, geometric, authoritative                   |
|  - Used for Titles, Navigation Labels, Hero Headers, Buttons          |
|                                                                       |
|  BODY & METADATA:      Courier Prime (400 / 700 / Italic)             |
|  - Tactile typewriter monospace, editorial manuscript character       |
|  - Used for Narrators, Audio Specs, Synopses, Reviews, Timestamps     |
|                                                                       |
|  LOCALIZED SCRIPTS:    Anek Bangla / Noto Serif Bengali               |
|  - High readability for Bangla and Banglish Story Finder queries      |
|  - Standardized letterform rendering across mobile & desktop          |
+-----------------------------------------------------------------------+
```

### 3.1 Typographic Scale & Hierarchy

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline XL** | Space Grotesk | 32px | Bold (700) | 40px | -0.02em | Hero banner, major landing page headlines |
| **Headline LG** | Space Grotesk | 24px | Bold (700) | 32px | -0.01em | Section headers ("Popular Books", "For You") |
| **Headline MD** | Space Grotesk | 18px | Semibold (600) | 24px | 0.00em | Modal titles, chapter titles, book titles |
| **Body LG** | Courier Prime | 15px | Regular (400) | 22px | 0.00em | Audiobook synopsis, long-form editorial reviews |
| **Body MD** | Courier Prime | 13px | Regular (400) | 19px | 0.00em | Default body copy, chapter lists, specs |
| **Body SM** | Courier Prime | 11px | Regular (400) | 16px | 0.00em | Timestamps, durations, secondary metadata |
| **Label LG** | Space Grotesk | 13px | Semibold (600) | 18px | +0.02em | Primary button labels, category pills |
| **Label MD** | Space Grotesk | 11px | Semibold (600) | 16px | +0.03em | Chapter badges, tier chips ("PLUS", "PREMIUM") |
| **Label SM** | Space Grotesk | 9px | Bold (700) | 12px | +0.05em | Mini badges ("NEW", "AI", "1.5x"), speed controls |

---

## 4. Layout Architecture: The 3-Tier Pane Model

As demonstrated in `REF/code.html` and `REF/screen.png`, desktop viewports are structured around a rigid, continuous 3-tier layout:

```
+--------------------------------------------------------------------------------------------------+
| TOP HEADER: Logo | Punchy Canary Search Bar [AI Search Trigger] | Notifications | Profile Menu  |
+---------+----------------------------------------------------+-----------------------------------+
| NAV     | MAIN BROWSE / FEED PANEL                           | RIGHT INSPECTOR / AUDIO PLAYER    |
| RAIL    | - Category Pill Strip (Horizontally Scrollable)     | - Active Book Cover & Metadata    |
| (72px)  | - Featured Editorial Hero Banner                   | - Retro Audio Waveform Display    |
|         | - Popular Audiobooks Grid (2:3 aspect ratio)       | - Chapter Selector & Speed Chips  |
| - Home  | - Recommended Podcasts Grid (1:1 aspect ratio)     | - Terracotta Primary Play Trigger |
| - Browse| - "For You" Taste-Based Recommendations            | - Sleep Timer & Bookmark Controls |
| - Shelf | - Continue Listening Bar                           | - Full Chapter Progression Drawer |
| - Saved |                                                    |                                   |
+---------+----------------------------------------------------+-----------------------------------+
```

### 4.1 Tier 1: Fixed Navigation Rail (72px fixed)
- Fixed left column with a continuous `1.5px solid #1A1A1A` right border.
- Features stacked iconography, compact uppercase micro-labels (`label-sm`), and active indicators.
- Light mode background: `#FCF9F8`; Dark mode: `#141413`.

### 4.2 Tier 2: Dynamic Browse Canvas (Flexible center)
- Houses the primary content feeds, genre filters, and category carousels.
- Separated from the right inspector by a continuous `1.5px solid #1A1A1A` vertical rule.
- Fully scrollable with hidden scrollbars for clean editorial immersion.

### 4.3 Tier 3: Dedicated Inspector & Persistent Audio Player (380px fixed)
- Unlike Spotify or Audible where players sit in a narrow bottom drawer, GolpoBook utilizes a **permanent desktop inspector panel**:
  - Displays high-resolution cover art (micro-rounded with 1.5px border).
  - Displays active chapter metadata, narrator credits, and speed limit badge.
  - Hosts the retro audiobook player controls and interactive chapter tracklist.

### 4.4 Mobile & Tablet Responsive Transition
On viewports under `1024px`:
1. **Left Navigation Rail** collapses into a **Fixed Bottom Navigation Bar (64px height)** with 4 primary destinations (Home, Search/AI, Library, Profile).
2. **Right Inspector Panel** collapses into a **Sticky Mini-Player Bar (64px)** anchored immediately above the bottom navigation bar.
3. Tapping the mini-player expands a full-screen **Audiobook Drawer / Sheet** containing the retro controls, waveform, and chapter list.

---

## 5. Component Design Specifications

### 5.1 Buttons & Interactive Triggers
- **Primary Play Button**:
  - Solid Terracotta `#EE6744` background.
  - Border: `1.5px solid #1A1A1A`.
  - Font: Space Grotesk Bold, Uppercase, tracking `+0.05em`.
  - Shadow: `shadow-[2px_2px_0px_#1A1A1A]`.
  - Active State: `active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`.
- **Secondary Action Buttons**:
  - Paper container `#FDFBF7` background.
  - Border: `1.5px solid #1A1A1A`.
  - Text: Deep ink `#1A1A1A`.
  - Hover: Background shifts to `#EFE4CE`.
- **Segmented Quick-Action Group**:
  - Triple-divided horizontal bar with 1.5px interior dividers for `Download`, `Bookmark`, and `Add to Shelf`.

### 5.2 Audiobook & Podcast Cards
- **Audiobook Cards**:
  - Aspect Ratio: `2:3` (standard book proportion).
  - Border: `1.5px solid #1A1A1A`.
  - Shadow: `2px 2px 0px #1A1A1A`.
  - Hover: `-translate-y-1 shadow-[4px_4px_0px_#1A1A1A]` (crisp hard elevation).
  - Cover Image: High-contrast vintage artwork; zero rounded corners (sharp bookplate feel).
  - Bottom metadata: Title in Space Grotesk Bold (`14px`), author in Courier Prime (`12px`), star ratings in antique amber (`#E8B931`).
- **Podcast Cards**:
  - Aspect Ratio: `1:1` (square vinyl / album proportion).
  - Includes episode count chip and host name.

### 5.3 AI Story Finder Search Interface
- **Prominent Top Bar Placement**:
  - Search input container rendered in vivid **Canary Yellow (`#F6D04D`)**.
  - Border: `1.5px solid #1A1A1A` with `shadow-[2px_2px_0px_#1A1A1A]`.
  - Placeholder: Monospaced Courier Prime (`"amar voyer golpo shunte mon chacche..."`).
  - Integrated AI Badge: Terracotta badge with spark icon and `"AI SEARCH"` indicator.
  - Quota Indicator: Miniature typewriter badge displaying remaining daily searches (e.g. `[ 1/1 REMAINING ]` or `[ 8/10 REMAINING ]`).

### 5.4 Audio Player & Equalizer Visualization
- Retro-styled hardware aesthetic:
  - Chapter header with live audio icon.
  - Progress bar: Sharp-edged rectangular track with Terracotta progress fill and a square white thumb bounded by a 1.5px black border.
  - Equalizer bars: A 6-bar vertical rhythm visualization that pulses gently during active playback, alternating between ink-black and terracotta.
  - Playback Speed Chip: Crisp bordered pill showing `1.0x`, `1.25x`, `1.5x`, `2.0x`. If user is on Free tier, speeds above 1.0x display a small lock icon.

---

## 6. Animation & Interaction Architecture

Motion in GolpoBook is **restrained, mechanical, and tactile**, simulating physical print ephemera and physical audio hardware switches rather than fluid organic morphs.

### 6.1 Motion Rules & Constraints
1. **Zero Bouncing or Spring Physics**: Avoid high-damping bouncy animations that feel playful or childish.
2. **Hard State Transitions**: Button presses, tab switches, and card clicks use instant or ultra-fast easing (`150ms ease-out`).
3. **No Continuous Background Loops**: Disallow floating blobs, animated background gradients, or continuous rotating badges that drain mobile battery.
4. **Equalizer Animation**: Use a lightweight 6-bar CSS keyframe animation (`transform: scaleY(...)`) that activates **only** when `isPlaying === true`.

### 6.2 Motion Token Standards

| Interaction Type | Duration | Easing Curve | Visual Behavior |
| :--- | :--- | :--- | :--- |
| **Button Click** | 50ms | `linear` | `translate(1px, 1px)` with hard shadow collapse |
| **Card Hover** | 150ms | `ease-out` | `translate(-2px, -2px)` with shadow expanding to 4px |
| **Modal / Dialog** | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Slide up from bottom with 1.5px dark border |
| **Drawer / Sheet** | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Bottom-to-top sheet slide on mobile viewports |
| **Skeleton Shimmer** | 1200ms | `linear` (infinite) | Subtle opacity cycle (40% to 80%) on sharp rectangles |

---

## 7. Base UI & shadcn Component Customization Plan

The repository currently contains 19 components in `src/components/ui/` generated via the `base-maia` style. The team must customize them in Sprint 1 to enforce the Neo-Editorial design system:

| Component | Retain / Customize | Action Required for Design System Alignment |
| :--- | :--- | :--- |
| `button.jsx` | **Customize** | Replace pill radii (`rounded-4xl`) with sharp `rounded-sm` or `rounded-none`, inject `border-[1.5px] border-ink`, hard shadow, and active press state. |
| `card.jsx` | **Customize** | Remove diffuse shadows, add `border-[1.5px] border-ink`, sharp corners, and `bg-surface-card`. |
| `dialog.jsx` | **Customize** | Style overlay with `bg-ink/60` (no blur), set container to sharp `border-[1.5px] border-ink` with `shadow-hard-lg`. |
| `sheet.jsx` | **Customize** | Mobile player drawer container: sharp borders, vintage paper background, typewriter header. |
| `input.jsx` | **Customize** | Monospace typography, sharp corners, canary or paper background, crisp focus outline without soft halo. |
| `tabs.jsx` | **Customize** | Convert to vintage index tabs or pill filters with terracotta active indicator. |
| `skeleton.jsx` | **Customize** | Sharp rectangular placeholders with warm parchment tone rather than cool gray. |
| `slider.jsx` | **Customize** | Primary audio scrub bar: rectangular track, square bordered thumb. |
| `badge.jsx` | **Customize** | Uppercase `label-sm`, Space Grotesk Bold, 1px border, hard offset. |

**Audit Conclusion for UI/UX**: The design blueprint is comprehensive and distinctive. By applying the "Audiora Neo-Editorial" tokens in Sprint 1, GolpoBook will achieve a standout, production-grade visual identity that feels bespoke and commercial rather than a generic student submission.
