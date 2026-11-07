---
name: Cinematic Violet Anime Catalog
colors:
  surface: '#14121a'
  surface-dim: '#14121a'
  surface-bright: '#3a3840'
  surface-container-lowest: '#0e0d14'
  surface-container-low: '#1c1b22'
  surface-container: '#201f26'
  surface-container-high: '#2a2931'
  surface-container-highest: '#35343c'
  on-surface: '#e5e1eb'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1eb'
  inverse-on-surface: '#312f37'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb0cd'
  on-secondary: '#640039'
  secondary-container: '#aa0266'
  on-secondary-container: '#ffbad3'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cd'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0053'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#14121a'
  on-background: '#e5e1eb'
  surface-variant: '#35343c'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-card:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  badge-score:
    fontFamily: Sora
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system serves a modern, premium anime discovery and catalog tracking platform. The visual identity shifts away from conventional crowded database layouts toward an elevated, cinematic media experience. It balances atmospheric immersion with high-density utility: large poster canvases, rich metadata hierarchy, and tactical micro-interactions.

The style combines **cinematic dark minimalism** with refined **glassmorphism** and subtle neon luminescence. Visual depth is achieved through layered deep-violet surfaces, micro-borders with inner luminance, and focused glowing accents. Key interfaces emphasize content-first curation—allowing vibrant anime artwork and key visuals to anchor the layout while UI chrome recedes into deep atmospheric tones.

## Colors

The palette is engineered for a dark-first environment that avoids harsh pure blacks in favor of deep violet-tinted depths.

- **Canvas & Surfaces:**
  - Base canvas: `#0E0D14` (Deep obsidian with 8% violet undertone).
  - Surface Tier 1 (Cards, panels): `#191724`.
  - Surface Tier 2 (Floating cards, modals, hover states): `#211E30`.
  - Surface Glass: `rgba(25, 23, 36, 0.72)` with a 16px background blur.
  - Structural Borders: `#2D283E` (1px low-contrast separation).

- **Accent Colors:**
  - **Primary (Electric Violet):** `#8B5CF6` core, scaling from `#A78BFA` (interactive hovers, high-legibility text links) to `#7C3AED` (deep interactive base and glows).
  - **Secondary (Sakura Pink):** `#EC4899` core, complemented by `#F9A8D4` for high-tier score highlights, favorite hearts, and status badges.
  - **Tertiary (Cyber Cyan):** `#06B6D4` reserved strictly for active watch tracking indicators and live broadcasting counters.

- **Semantic & Content Neutrals:**
  - Text Primary: `#F3F0FA` (96% luminance, cool white with faint violet tint).
  - Text Secondary: `#9D97B5` (muted metadata, secondary attributes).
  - Text Tertiary: `#605B77` (captions, episode counts, inactive markers).
  - Status Indicators: Watching (`#10B981`), Completed (`#8B5CF6`), On Hold (`#F59E0B`), Dropped (`#EF4444`), Plan to Watch (`#6B7280`).

## Typography

The typography structure uses **Sora** for display anchors and section titles to convey a high-tech, geometric media character. Cyrillic script support in Sora is balanced and sharp, giving Russian titling distinct graphic punch.

**Inter** handles all long-form synopses, episode logs, and rich descriptions to preserve maximum readability against dark surfaces.

**Plus Jakarta Sans** is dedicated to metadata tags, badge labels, navigation pills, and interactive button controls where geometric curves enhance tactile clarity. All uppercase badge labels receive wide letter-spacing (`0.04em`) to maintain legibility at compact sizes (`11px`).

## Layout & Spacing

The layout is grounded in an 8pt spatial grid with responsive constraints:

- **Desktop (≥ 1280px):** 12-column fluid grid, max-width `1440px`, with `1.5rem` gutters and `3.5rem` outer canvas padding. Media grids use an adaptive 6-column setup for poster cards (approximate 3:4 aspect ratio).
- **Tablet (768px – 1279px):** 8-column layout with `1.25rem` gutters and `2rem` outer margin. Media catalog spans 4 columns.
- **Mobile (< 768px):** 4-column layout with `1rem` outer margins. Catalog cards shift to a 2-column grid or single-column horizontal list cards.

Horizontal scrollers for seasonal charts, trending releases, and watchlists use edge-to-edge overflow with snap points and trailing padding matching the canvas margin.

## Elevation & Depth

Visual hierarchy uses frosted glass overlays, subtle surface tinting, and localized luminescence:

- **Level 0 (Canvas Base):** Solid `#0E0D14`. Background features large, ultra-diffused radial light leaks (`rgba(124, 58, 237, 0.08)` blur radius 140px) behind key visual banners.
- **Level 1 (Standard Card Container):** Solid `#191724` surrounded by a 1px uniform border in `#2D283E`. Zero drop-shadow in default state.
- **Level 2 (Interactive Overlays & Floating Navigation):** Semi-transparent `rgba(25, 23, 36, 0.78)` backed by `backdrop-filter: blur(16px)` and a subtle highlight border: `1px solid rgba(167, 139, 250, 0.15)`.
- **Level 3 (Focused Menus, Dialogs & Modals):** `#211E30` with `1px solid rgba(167, 139, 250, 0.25)`, elevated by an ambient shadow: `0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 0 24px 0 rgba(124, 58, 237, 0.15)`.
- **Glow Accents:** Focused interactive elements (such as primary buttons and active score badges) cast a soft colored halo: `box-shadow: 0 0 20px -2px rgba(139, 92, 246, 0.45)`.

## Shapes

The geometric framework balances structured rectangles with soft radii:

- **Media & Content Cards:** Fixed `16px` border-radius (`rounded-lg`) matching user specifications.
- **Modals & Flyouts:** `24px` (`rounded-xl`) for soft overlay framing.
- **Pills & Status Tags:** Fully rounded pill radius (`9999px`) for action buttons, status pills, score badges, and genre chips.
- **Form Inputs & Search Fields:** `12px` border-radius (`rounded-md`) for precise tactile boundaries.

## Components

### 1. Primary Action Buttons
- Pill silhouette (`border-radius: 9999px`), height 44px (36px for compact).
- Background: Gradient `linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)`.
- Text: `#F3F0FA`, font `Plus Jakarta Sans`, weight 600, 14px.
- Subtle inner top border highlight: `1px solid rgba(255, 255, 255, 0.2)`.
- Rest state glow: `box-shadow: 0 4px 16px -2px rgba(124, 58, 237, 0.35)`.
- Hover state: Scaled brightness, halo expands to `0 6px 24px 0 rgba(124, 58, 237, 0.55)`.

### 2. Anime Media Cards (Catalog Grid)
- Radius `16px`, background `#191724`, border `1px solid #2D283E`.
- Poster image takes top ratio (3:4.2) with an inner gradient overlay fading to `#191724` at the base.
- Badges anchored directly over image (top-left: format/episodes; top-right: score badge).
- Hover behavior: Subtle image zoom (`scale(1.04)`), card border shifts to `#8B5CF6`, shadow elevates with deep violet glow.

### 3. Score & Rating Badges
- Pill container with `rgba(236, 72, 153, 0.14)` background and border `1px solid rgba(236, 72, 153, 0.35)`.
- Text & star icon: Sakura pink (`#F9A8D4`), font `Sora`, 12px bold.
- Visual score presentation: Star icon + score value (e.g., `★ 8.84`).

### 4. Tracking Status Chips (Watchlist)
- Compact pill height 28px, border radius `9999px`.
- Status states:
  - «Смотрю» (Watching): Teal-green accent dot + `#10B981` text tint.
  - «В планах» (Plan to Watch): Muted slate `#9D97B5`.
  - «Просмотрено» (Completed): Electric violet `#A78BFA` background fill.
- Click triggers inline dropdown with status options and episode progress counter (`+1` stepper).

### 5. Search & Filter Inputs
- Height 44px, background `rgba(25, 23, 36, 0.9)`, border `1px solid #2D283E`, border radius `12px`.
- Prefix icon: Search glyph in `#605B77`.
- Focus state: Border transitions to `#8B5CF6` with ring `0 0 0 3px rgba(139, 92, 246, 0.2)`.
- Placeholder: `#605B77`, font `Inter`, 14px.

### 6. Episode Progress Counter Bar
- Container: Track height 4px, background `#211E30`, radius 2px.
- Progress fill: Gradient from `#8B5CF6` to `#EC4899`, radius 2px.
- Numeric accompaniment: «12 из 24 эп.» styled in `Plus Jakarta Sans` 12px muted violet.

### 7. Glassmorphic Navigation Bar
- Fixed top bar, height 64px.
- Background: `rgba(14, 13, 20, 0.8)` with backdrop blur `20px` and bottom border `1px solid #2D283E`.
- Nav links: `Plus Jakarta Sans` 14px, default `#9D97B5`, active state `#F3F0FA` with glowing violet underline indicator.