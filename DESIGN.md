# NexaClip (nxclip.ai) Design System Specification
## The "Luminous Creator-Tech" Design Standard

NexaClip is a premium, professional web platform tailored for digital creators, gamers, and stream publishers. The NexaClip design system—**Luminous Creator-Tech**—blends high-density, compact productivity layouts with a vivid, high-fidelity atmosphere. 

This document serves as the absolute, unified reference manual for product designers and front-end engineers. It details color variables, responsive typography, visual elevation, layout metrics, interactive components, motion specifications, accessibility compliance, and iconography rules.

---

## 1. Design Principles & Identity

Luminous Creator-Tech is built upon four foundational design values:

1. **Atmospheric Contrast (Pure Luminous Accents on Dark Canvas):** The default interface uses layered, deep charcoal tones (`#0d0e12`) paired with highly saturated, luminous brand accents. This mirrors modern gaming hubs, professional streaming consoles, and audio/video workspaces.
2. **Compact Efficiency (High-Density Layouts):** NexaClip is built for active creators. Information layout avoids bloated padding or "bubbly" consumer-app styling. Desktop elements are compact and highly dense, prioritizing data density and rapid workflows.
3. **Architectural Honesty (No Clutter):** We resist unrequested technical data-larping (like mock terminal logging, port displays, or ping indicators in normal UI pages). Layout grids, typography, and content panels are human-centric, clean, and structurally honest.
4. **Interactive Polish (Fluid Motion & Micro-Transitions):** Every interaction—hovers, focus-visible outlines, transitions—is smooth and physically responsive. Components react to touch and cursor feedback via standard speed curves and subtle visual lifts.

---

## 2. Master Color System & Design Tokens

NexaClip features a dual-theme architecture (Dark and Light modes) mapped to CSS Custom Properties. The color system has been meticulously audited to satisfy **WCAG 2.2 AA (and in many cases AAA) contrast requirements** for text, borders, and controls.

### 2.1 Theme-Aware Variables (`src/index.css`)

| Custom CSS Property | Light Mode Value | Dark Mode Value | Semantic Role / Use Case |
| :--- | :--- | :--- | :--- |
| `--background` | `#FCFCFD` | `#0D0E12` | Main viewport and canvas background |
| `--foreground` | `#111113` | `#F4F4F5` | Primary body text and headlines |
| `--card` | `#FFFFFF` | `#14151A` | Floating container/card backgrounds |
| `--card-foreground` | `#111113` | `#F4F4F5` | Headings and text inside cards |
| `--popover` | `#FFFFFF` | `#14151A` | Dropdowns, menus, and context hover cards |
| `--popover-foreground` | `#111113` | `#F4F4F5` | Text within overlay systems |
| `--muted` | `#F4F4F5` | `#1A1B21` | Inactive tab backgrounds, skeletal segments |
| `--muted-foreground` | `#4B4B52` | `#A1A1AA` | Secondary copy, metadata, and descriptive labels |
| `--border` | `#E4E4E7` | `#27272F` | Subtle dividing lines, default card borders |
| `--input` | `#E4E4E7` | `#23242B` | Inactive form borders and input fields |
| `--ring` | `#7C83FF` | `#8B8FFF` | Keyboard focus indicator glow ring |
| `--destructive` | `#DC2626` | `#F87171` | Danger actions, delete buttons, error alerts |

---

### 2.2 Luminous Brand Accents

NexaClip uses three primary chromatic brand accents to symbolize its creator-tech core:

*   **Brand Primary (Amethyst Blue):** 
    *   *Light Theme (`--brand-primary` / `--primary`):* `#5257f1` (Provides a **5.3:1** contrast ratio against White)
    *   *Dark Theme (`--brand-primary` / `--primary`):* `#7a7fff` (Luminous, highly visible neon blue)
    *   *Usage:* Primary call-to-actions, branding, links, focus triggers.
*   **Brand Secondary (Luminous Teal):** 
    *   *Light Theme (`--brand-secondary`):* `#0D9488` (Teal-600, corrected from low-contrast `#31ecd7` to guarantee **4.8:1** contrast vs White)
    *   *Dark Theme (`--brand-secondary`):* `#31ecd7` (Luminous neon teal)
    *   *Usage:* Interactive hover highlights, analytics success states, secondary categories.
*   **Brand Tertiary (Electric Amethyst):** 
    *   *Light Theme (`--brand-tertiary`):* `#9333EA` (Purple-600, provides **4.6:1** contrast vs White)
    *   *Dark Theme (`--brand-tertiary`):* `#b667ff` (Luminous electric lavender)
    *   *Usage:* Premium tags, Pro Creator tiers, AI-powered generation indicators.

---

### 2.3 Layered Surface Ladder

To represent depth without relying on heavy shadows, NexaClip implements a clear, three-step elevation ladder for surfaces:

```
[Level 0: Canvas Background] ─────────────────> --background
  │ (Light: #FCFCFD | Dark: #0D0E12)
  │
  ├── [Level 1: Default Surface Card] ──────> --surface-1 / --card
  │     (Light: #FFFFFF | Dark: #14151A)
  │     Border: --border
  │
  ├── [Level 2: Lifted Hover Surface] ─────> --surface-2
  │     (Light: #F8F8FA | Dark: #1A1B21)
  │     Border: color-mix(--border)
  │
  └── [Level 3: Nested Component Shell] ───> --surface-3
        (Light: #F1F1F4 | Dark: #20222A)
```

---

## 3. Typography & Hierarchy System

NexaClip uses **Geist Variable** as its display and monospace face (developed by Vercel for high-density developer interfaces), with **Inter** as the fallback for sans-serif text blocks.

### 3.1 Font Pairing Strategy
*   **Display / Headings (`--font-display`):** `Geist Variable`, paired with standard system fallbacks. Weight ranges from Semi-Bold (600) to Black (900). Features a negative tracking parameter to maintain readability at high font sizes.
*   **Body Text (`--font-sans`):** `Geist Variable` or `Inter`. Balanced, highly legible sans-serif optimized for continuous reading at small viewport sizes.
*   **Monospace / Technical Data (`--font-mono`):** `Geist Mono Variable`. Used for numerical matrices, database identifiers, date stamps, and creator analytics stats.

---

### 3.2 Typography Tokens

All textual elements in NexaClip must use the following semantic scales mapped in `src/index.css`:

| Utility Class | Font Family | Size | Weight | Line Height | Tracking | Use Case / Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `.ui-text-display-hero` | Display | `48px` | `900` | `1.00` | `-0.04em` | Main Landing Hero Headlines |
| `.ui-text-section-heading` | Display | `40px` | `900` | `1.10` | `-0.04em` | Section Titles, Pricing Headline |
| `.ui-text-subheading-lg` | Display | `32px` | `600` | `1.25` | `-0.04em` | Dashboard Page Titles |
| `.ui-text-card-title` | Display | `24px` | `600` | `1.33` | `-0.02em` | Main Widget Card Titles |
| `.ui-text-card-title-light` | Display | `24px` | `500` | `1.33` | `-0.02em` | Nested Sub-card Headlines |
| `.ui-text-body-lg` | Sans | `18px` | `400` | `1.75` | `normal` | Hero Sub-copy, Introductions |
| `.ui-text-body-md` | Sans | `16px` | `500` | `1.50` | `normal` | Core body, descriptive paragraphs |
| `.ui-text-body-semibold` | Sans | `16px` | `600` | `1.50` | `-0.01em` | Bold emphasis in checklists/tables |
| `.ui-text-button` | Sans | `14px` | `600` | `1.50` | `0.02em` | Button labels, Menu CTAs |
| `.ui-text-caption` | Sans | `13px` | `500` | `1.40` | `normal` | Timestamps, table values, input labels |
| `.ui-text-mono-body` | Monospace | `15px` | `400` | `1.50` | `normal` | Script lines, analytics graphs |
| `.ui-text-mono-label` | Monospace | `12px` | `700` | `1.50` | `0.05em` | Table categories, KPI headers (UPPER) |
| `.ui-text-micro-badge` | Display | `9px` | `900` | `1.20` | `0.05em` | Live, active, and locked tag pills (UPPER) |

---

## 4. Spacing, Grids & Layout Architecture

NexaClip implements a strict **4px spacing grid** to align page geometry. This maintains layout symmetry across all page segments.

### 4.1 Base Spacing Scale

*   `xxs`: `4px` (Border offsets, tiny label icons)
*   `xs`: `8px` (Badge text margins, nested stack gaps)
*   `sm`: `12px` (Card sub-item gap, list spacing)
*   `md`: `16px` (Default gap, smaller card padding, form grid gap)
*   `lg`: `24px` (Card inner padding, bento panel gap, grid spacing)
*   `xl`: `32px` (Section gaps, dashboard header offset)
*   `xxl`: `48px` (Landing hero component gap, heavy landing columns)
*   `section`: `96px` (Absolute vertical divider spacing for landing section wrappers)

### 4.2 Containers & Layout Width Rules

To maintain high layout fidelity on ultrawide monitors and mobile devices alike, layouts must use the following standard width constraints:

1.  **Landing Page Viewports (`.ui-container-landing`):** Bound to `max-w-7xl` (`1280px`) with centered layout alignments.
2.  **Dashboard App Shells (`.ui-dashboard-page`):** Utilizes full available screen width without narrow barriers to allow rich dashboard grids and multiple column views. Bound to `max-w-[1440px]` (`.ui-container-hero`) for high-fidelity widescreen layouts.
3.  **Writers/Content Focus blocks (`.ui-container-text`):** Bound to `max-w-2xl` (`672px`) for perfect line length legibility.

---

## 5. Shape System & Border Radius Scale

Consistent corner curvature defines NexaClip's visual cohesion. We reject "bubble" structures on interactive blocks to project a precise and professional workspace feel.

| Token Value | Corner Radius | Application Context |
| :--- | :--- | :--- |
| `rounded-sm` | `6px` | Interactive tags, inline chips, tooltip menus |
| `rounded-md` | `8px` | Form fields, text inputs, CTA buttons |
| `rounded-lg` | `10px` | Pricing cards, modular layout widgets, stats panels |
| `rounded-xl` | `12px` | Video players, screenshots, popup sheets, modals |
| `rounded-2xl` | `14px` | Heavy landing page sections (rarely used) |
| `rounded-full` | `9999px` | User avatars, slider knobs, status indicator capsules |

---

## 6. Components System Specification

All interactive UI components are based on the **shadcn/ui** framework, styled exclusively with our custom utility tokens to maintain structural consistency.

### 6.1 Buttons

All button instances must use the shadcn `Button` as their core element. Buttons feature a high-contrast hover state, active tap feedback, and proper accessibility attributes.

```
       [Default Base Button]
  (Radius: rounded-md | Size: default)
              │
              ├───> [brand-primary] ────> bg-primary | text-primary-foreground
              │                           Hover: bg-primary/90
              │
              ├───> [brand-gradient] ───> bg-gradient-to-br from-brand-primary to-brand-tertiary
              │                           Hover: high-opacity blend gradient shift
              │
              └───> [outline] ──────────> border border-border | bg-card
                                          Hover: bg-muted/40
```

#### Code Standards for Buttons:
*   Do **not** use raw HTML `<button>` elements for custom styled CTA links.
*   Do **not** overwrite padding, height, or borders inline using raw Tailwind utility chains.
*   If a link visually acts as a button, use the `asChild` property:
    ```tsx
    <Button asChild variant="brand-gradient" size="lg">
      <Link to="/pricing">Unlock Premium Access</Link>
    </Button>
    ```

---

### 6.2 Forms, Inputs & Field Controls

Textareas, Select elements, and Inputs follow a rigid structure for interactive states:

*   **Default State:** Background: `bg-card` (light) / `var(--input)` (dark). Border: `border-input`. Corner: `rounded-md`. Text: `ui-text-caption`.
*   **Focus State (`:focus-visible`):** Border transitions to `border-primary/50`. Glow outline: `ring-[3px] ring-primary/40 ring-offset-2 ring-offset-background`. Transition: `duration-200 ease-in-out`.
*   **Error State:** Border transitions to `border-destructive`. Error label renders inline below the control using `.ui-form-error` (`text-destructive`).

---

### 6.3 Cards & Floating Panels

Cards are divided into three distinct visual categories:

1.  **Standard Cards (`.ui-card`):** Uses `--card` background with standard `--border` framing. Casts a light `--shadow-soft` for elevated reading.
2.  **Featured Cards (`.ui-card-featured`):** Uses a distinct `border-2 border-primary` outline with custom background hues. Casts an interactive glow mapped from primary color variables.
3.  **Glassmorphism Panels (`.glass`):** Perfect for floating headers and overlay navigations. Uses a high-blur filter backdrop (`backdrop-blur-xl`) with custom semi-transparent card fills.

---

### 6.4 Table Structure

Tabular layouts must be enclosed within a `.ui-table-container` wrapper to prevent overflowing frames on mobile viewports:

```html
<div class="ui-table-container">
  <table class="ui-table-shell">
    <thead class="ui-table-header">
      <tr><th>CREATOR</th><th>CLIPS</th><th>VIEWS</th></tr>
    </thead>
    <tbody>
      <tr class="ui-table-row">
        <td class="ui-table-cell">Valorant King</td>
        <td class="ui-table-cell">14</td>
        <td class="ui-table-cell font-mono">1.2M</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 7. Motion & Interaction Mechanics

Animations are crucial to NexaClip's premium interactive feel. To prevent layout flickering, **Hot Module Replacement (HMR)** is bypassed in preview builds, but CSS and Framer Motion handles dynamic state changes smoothly.

### 7.1 Framer Motion Defaults

All layout animations use standard cubic-bezier curves for organic pacing:

*   **Fast Animations (`--animate-fast` - `150ms`):** Hover transitions, focus rings, tooltip triggers.
*   **Base Animations (`--animate-base` - `200ms`):** Accordion collapses, tab content transitions, list items.
*   **Slow Animations (`--animate-slow` - `300ms`):** Dialog openings, sidebar menus, notification banners.

### 7.2 Custom Easing Curves

All transition structures should follow the standard easing functions:

```css
/* Standard fluid enter curve (Cubic Bezier) */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Soft exit curve */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);

/* Fluid bouncy response */
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 8. Accessibility (A11y) & Usability Standards

NexaClip is committed to making its digital interface inclusive for all users by integrating the following standards:

### 8.1 Keyboard Navigation & Focus Ring Rules
*   Every interactive component (buttons, inputs, sliders, anchors) must have a dedicated focus state.
*   Focus rings are styled using `.focus-visible` with matching offsets so that borders are highly legible:
    ```css
    *:focus-visible {
      outline: none;
      ring-width: 3px;
      ring-color: color-mix(in srgb, var(--primary) 40%, transparent);
      ring-offset-width: 2px;
      ring-offset-color: var(--background);
    }
    ```
*   Focus indicators must be positioned above other elements with proper z-indices:
    ```css
    a:focus-visible, button:focus-visible, input:focus-visible {
      z-index: 50;
      position: relative;
    }
    ```

### 8.2 Touch Target Dimensions
*   On touch screens, the minimum interaction target for any link, button, or input must span at least **44px** in height and width.
*   Tab buttons use a minimum tap area of **36px** on desktop viewports, automatically expanding to **44px** on touch-enabled devices.

### 8.3 Screen Reader & Context Semantics
*   Icon-only buttons (such as trash bins, gear wheels, search lenses) must include an explicit `aria-label` attribute describing their exact action.
*   We use standard semantic tags (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<article>`) to ensure screen readers can navigate layout geometry correctly.

---

## 9. Iconography Guidelines

NexaClip integrates **Lucide React** as its primary iconography library. Custom SVGs are strictly avoided to ensure a cohesive visual language.

### 9.1 Size and Scale Tokens

Icons must scale proportionally to their adjacent typography:

*   **Small (Micro) Icons (`12px`):** Used inside status pills, metadata indicators, and sub-tags.
*   **Regular (Standard) Icons (`16px`):** Used inside standard inputs, list items, and button labels.
*   **Medium (Widget) Icons (`20px`):** Used inside widget header blocks and card headers.
*   **Large (Hero) Icons (`24px`):** Used in empty-state displays and hero grid highlights.

### 9.2 Stroke Weights

Icon stroke weights match the typographic line widths:

*   **Display & Large Accents:** `1.5px` (Provides a clean, technical outline)
*   **Body & Inputs:** `2.0px` (Guarantees legibility at small sizes)
*   **Micro / Tags:** `2.5px` (Maintains solid visibility on compact grids)

---

## 10. Atmospheric Visual Layering (The "NexaClip Glow")

NexaClip is defined by its vibrant visual atmosphere. We use layers of subtle mesh gradients, neon glows, and custom glass textures to create a premium, creator-focused aesthetic.

```
┌────────────────────────────────────────────────────────┐
│ [Layer 3: Interactive Components]                      │
│ (Glass cards, sharp typography, premium glowing CTAs)  │
├────────────────────────────────────────────────────────┤
│ [Layer 2: Noise Overlay]                               │
│ (Custom subtle film grain overlay at 3% opacity)        │
├────────────────────────────────────────────────────────┤
│ [Layer 1: Luminous Ambient Glows]                      │
│ (Radial mesh background gradients mapping brand hues)  │
├────────────────────────────────────────────────────────┤
│ [Layer 0: Core Dark Canvas]                            │
│ (Deep background base mapping #0D0E12)                 │
└────────────────────────────────────────────────────────┘
```

### 10.1 Key Atmospheric CSS Classes

*   **`.noise-overlay`:** A subtle grain texture overlay that adds organic depth to dark surfaces.
*   **`.dots-pattern`:** A precise dot grid pattern (24px spacing) used to define section headers.
*   **`.mesh-gradient`:** Radial color blooms mapping brand accents at low opacities (`6%` to `8%`), creating a vivid yet readable backdrop.
*   **`brand-text-gradient`:** Applied to display headlines to project NexaClip's luminous identity:
    ```css
    background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 55%, var(--color-brand-tertiary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    ```

---

## 11. Developer Implementation Checklist

Follow these checklist items before pushing changes to verify visual cohesion:

### 11.1 Do's
- [ ] Centralize brand variables and design tokens in `src/index.css`.
- [ ] Use `asChild` on shadcn Buttons for custom visual anchors.
- [ ] Verify that borders and text satisfy contrast ratios in both Light and Dark themes.
- [ ] Keep bento-grid modules uniform with matching border-radius values (`rounded-lg`).
- [ ] centralized typography definitions in the shared class system.

### 11.2 Don'ts
- [ ] Do **not** use raw colors (`bg-black`, `bg-white`, `text-black`) inside layout files—always use theme tokens.
- [ ] Do **not** manually write custom SVG icons; use Lucide React icons instead.
- [ ] Do **not** apply high corner curvatures (`rounded-3xl` or `rounded-4xl`) on core buttons or input blocks.
- [ ] Do **not** use arbitrary raw hex color values within JSX components.
- [ ] Do **not** implement floating mock system diagnostics in card margins.
