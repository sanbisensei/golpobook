---
name: Audiora Neo-Editorial
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#58413c'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8c716a'
  outline-variant: '#e0bfb8'
  surface-tint: '#aa3617'
  primary: '#aa3617'
  on-primary: '#ffffff'
  primary-container: '#ee6744'
  on-primary-container: '#560f00'
  inverse-primary: '#ffb4a2'
  secondary: '#725c00'
  on-secondary: '#ffffff'
  secondary-container: '#fdd753'
  on-secondary-container: '#735d00'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2a51a'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#891e01'
  secondary-fixed: '#ffe080'
  secondary-fixed-dim: '#e8c341'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#564500'
  tertiary-fixed: '#ffdf94'
  tertiary-fixed-dim: '#f0c038'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Courier Prime
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Courier Prime
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
  body-sm:
    fontFamily: Courier Prime
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The brand personality is literary, tactile, and intellectually inviting. Drawing inspiration from vintage publishing, mid-century graphic ephemera, and modern audio media interfaces, the design style merges warm neo-brutalism with classic print editorial sensibilities. 

The aesthetic revolves around crisp outlines, tactile pill controls, and stark dividing rules set over an unbleached book-stock canvas. It eliminates artificial gradients and diffuse drop shadows in favor of explicit architectural grid lines, high-contrast structural borders, and punchy geometric color blocks that celebrate the physical sensation of printed literature and curated audio libraries.

## Colors
The palette is built on high-character editorial contrast:
- **Base Canvas & Surfaces**: Warm paper canvas (`#F4EBD9`) with slightly lighter interior content containers (`#FDFBF7`) and tinted framing bands (`#EFE4CE`).
- **Primary Accent (`#EE6744`)**: A vibrant terracotta coral dedicated to high-intent actions, primary play buttons, and active toggle states.
- **Secondary Accent (`#F6D04D`)**: A sunny, canary yellow used across prominent search bars, key headers, and navigational banners.
- **Tertiary Accent (`#E8B931`)**: Rich antique amber providing depth for badges, highlights, and secondary interactive states.
- **Structural Neutral (`#1A1A1A`)**: Deep ink black utilized for sharp outlines, structural partition rules, typography, and iconography.

All color blocking is deliberately bounded by crisp dark borders to maintain clean structural definition.

## Typography
The system balances technical typography with typewriter literary heritage:
- **Display & Headings (`Space Grotesk`)**: Geometric, compact, and architectural. Used for structural navigation, category headers, book titles, and call-to-action buttons.
- **Body & Metadata (`Courier Prime`)**: Monospaced, warm, and reminiscent of vintage manuscript typewriters. Used for narrative reviews, metadata readouts (narrator, publisher, length), and secondary details.
- **Labels & Microcopy (`Space Grotesk`)**: Crisp, uppercase or small-caps styling used on category pills, timestamps, and compact utility buttons.

## Layout & Spacing
The layout follows a modular pane-and-panel architecture with explicit divider rules:
- **Desktop Grid**: A structured 3-tier view:
  1. A narrow utility rail (72px fixed) housing primary icons and app functions.
  2. A flexible main browse panel displaying categories, carousel showcases, and book cover grids.
  3. A dedicated detail inspector pane (320px–380px fixed width) for active track selection, audio actions, extended synopsis, and specs.
- **Panels & Dividers**: Distinct interface sections are separated by continuous 1.5px solid `#1A1A1A` borders rather than floating card margins.
- **Responsive Adaptations**: On tablet and mobile viewports, the detail pane collapses into a swipeable bottom sheet or drawer, and the vertical rail converts into a fixed bottom navigation bar with 0.75rem horizontal margins.

## Elevation & Depth
Depth in this system is strictly architectural and non-skeuomorphic:
- **Zero Soft Shadows**: Avoid diffuse Gaussian blurs or elevation shadows. Surfaces do not float.
- **Tonal & Border Layering**: Hierarchy is achieved solely through crisp 1.5px solid ink-black borders (`#1A1A1A`), contrasting background fills (warm canary `#F6D04D` vs. cream `#F4EBD9`), and hard inset frames.
- **Hard Offsets for Overlays**: When a floating modal, context menu, or active state demands elevation, use a hard 2px or 3px solid black offset shadow (`box-shadow: 2px 2px 0px #1A1A1A`) with no blur.

## Shapes
A hybrid geometry defines the interface:
- **Frames & Panels**: Pure sharp corners (0px) or microscopic soft radiuses (2px to 4px) to emphasize the print sheet aesthetic.
- **Buttons & Chips**: Distinct rounded pill contours (`rounded-full` or 9999px) for category tags and small badges to contrast against rigid grid lines.
- **Input Fields & Cover Art**: Micro-rounded (4px) with stark 1.5px bounding borders, giving book covers the appearance of physical bookplates set into paper mounts.

## Components

### Buttons & Action Triggers
- **Primary Play Button**: Solid `#EE6744` background with 1.5px solid `#1A1A1A` border, bold Space Grotesk text, centered playback icon, and a crisp 2px hard hover offset.
- **Secondary Action Buttons**: Paper background (`#FDFBF7`), 1.5px solid `#1A1A1A` border, high-contrast black text.
- **Quick-Action Segment Group**: Triple-divided horizontal bar with 1.5px interior dividers for Download, Save, and Add to List actions.

### Search Bar
- Spans full width of the primary search strip with a punchy yellow background (`#F6D04D`).
- Input is framed with a 1.5px dark border, white or light cream fill, vintage search icon, and typewriter monospace placeholder text.

### Category Chips & Filters
- Compact horizontal row of pill-shaped tags (`border: 1.5px solid #1A1A1A`).
- Active pill takes a solid primary fill (`#EE6744`) with white or dark ink text; inactive pills sit on clean parchment white (`#FDFBF7`) with ink text.

### Media & Book Showcase Cards
- Book covers are rendered with 1.5px enclosing borders and zero shadow.
- Title and author appear directly beneath in two distinct font tiers: Space Grotesk for the title, monospaced Courier Prime for the author name.
- Rating stars and inline action marks (e.g., bookmark icon) anchor the foot of each card.

### Collapsible Navigation Rail
- Minimalist column bounded on the right by a continuous vertical border.
- Features clean linear iconography, centered stacking, and compact uppercase micro-labels.