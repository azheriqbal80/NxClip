# NexaClip — Project Rules

This file is the single source of truth for UI, UX, styling, and architecture.

All AI-generated code must follow these rules strictly.

---

# 1. Core Principle

This is a production application.

Do NOT:
- redesign UI unnecessarily
- introduce inconsistent styles
- create parallel UI systems
- use random styling decisions

Always:
- preserve visual consistency
- reuse patterns
- build scalable UI
- use system-driven design

---

# 2. UX & Design Source of Truth

Primary reference files:

- `/docs/NexaClip_Web_UX_Flow.pdf`
- `/docs/NexaClip_Web_UX_Design_Requirements-Final.pdf`
- `src/index.css`

These define:
- page structure
- product flow
- data hierarchy
- design system
- component behavior
- pricing details
- interaction states
- accessibility
- responsive behavior

Hierarchy:
- UX Flow PDF → product structure, feature logic, user flow
- Design Requirements PDF → design requirements, layout behavior, pricing/page requirements
- `src/index.css` → design tokens, reusable classes, theme values
- shadcn/ui → component foundation
- screenshots/images → visual inspiration only

Do NOT:
- contradict the UX documents
- invent unsupported product behavior
- ignore existing tokens
- use visual references as exact copies unless explicitly requested

---

# 3. shadcn Foundation Rule

shadcn/ui is the base UI system.

Always use shadcn components when available:

- Button
- Card
- Input
- Textarea
- Select
- Dialog
- Sheet
- Tabs
- Badge
- Table
- Popover
- Tooltip
- DropdownMenu
- Accordion
- Progress
- Skeleton
- Avatar
- Separator

Do NOT:
- recreate components
- override styling unnecessarily
- build parallel UI systems
- create custom primitives when shadcn already provides them

---

# 4. Button & Link System Rule

All buttons and button-like links must use the shadcn `Button` component.

This applies across:
- landing page
- dashboard
- authenticated app
- pricing
- dialogs
- cards
- forms
- navigation CTAs
- upgrade CTAs
- empty state CTAs

---

## Required Usage

Use shadcn Button for:
- primary CTAs
- secondary CTAs
- form actions
- dialog actions
- card actions
- pricing buttons
- navbar CTA buttons
- dashboard actions
- button-like links

For links that visually behave like buttons:

```tsx
<Button asChild variant="default" size="lg">
  <Link href="/pricing">See pricing</Link>
</Button>
```

For inline/text-style links:

```tsx
<Button asChild variant="link">
  <Link href="/features">Learn more</Link>
</Button>
```

Do NOT manually style CTA links with Tailwind class chains.

---

## Allowed Button Props

Use only shadcn Button-supported props:
- `variant`
- `size`
- `asChild`
- standard React props such as `disabled`, `type`, `onClick`, `aria-label`

Do NOT override Button structure manually.

---

## Allowed Default Variants

Use shadcn default variants:
- default
- secondary
- outline
- ghost
- destructive
- link

---

## Allowed Sizes

Use shadcn default sizes:
- default
- sm
- lg
- icon

If the project already has additional approved Button sizes in the shadcn Button variant file, use them only if they are already defined centrally.

Do NOT create one-off button sizes in JSX.

---

## Approved Brand Variants

Only two custom brand button variants are allowed:

- brand-primary
- brand-gradient

These must still use the shadcn `Button` component as the base.

Good:

```tsx
<Button variant="brand-primary" size="lg">
  Start creating
</Button>
```

```tsx
<Button variant="brand-gradient" size="lg">
  Upgrade to Pro
</Button>
```

---

## Brand Variant Restrictions

Brand variants may ONLY override color-related styling.

Allowed:
- background color
- text color
- border color
- hover background color
- gradient background for `brand-gradient`

Not allowed:
- border radius override
- padding override
- height override
- width override unless layout requires it outside the Button
- gap override
- font size override
- font weight override
- transition override
- focus behavior override
- disabled behavior override
- random shadow override
- arbitrary Tailwind values

Do NOT do this:

```tsx
<Button className="rounded-xl px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl">
  Start now
</Button>
```

Do this:

```tsx
<Button variant="brand-gradient" size="lg">
  Start now
</Button>
```

---

## Forbidden Button Patterns

Do NOT use:
- raw `<button>` for normal UI buttons
- manually styled CTA links
- long Tailwind chains on buttons
- hardcoded colors
- arbitrary gradients in JSX
- arbitrary radius values
- custom padding/height overrides
- custom font overrides
- custom shadow overrides
- non-shadcn button systems

---

## Implementation Rule

If brand button styling is required:
1. define `brand-primary` and `brand-gradient` in the shadcn Button variant system
2. connect them to semantic classes or tokenized class strings
3. use only color tokens from `src/index.css`
4. do not override shadcn default radius, spacing, typography, height, focus, or disabled behavior

If a new button style is requested:
1. check existing shadcn variants first
2. use default shadcn behavior
3. add a new variant only if it is reusable and approved
4. never patch individual buttons with custom styling

---

# 5. Token System Rule

All styling must use semantic tokens.

Allowed:
- bg-background
- bg-card
- bg-popover
- bg-muted
- text-foreground
- text-muted-foreground
- border-border
- border-input
- ring-ring
- bg-primary
- text-primary-foreground
- bg-secondary
- text-secondary-foreground
- bg-accent
- text-accent-foreground
- bg-destructive
- text-destructive-foreground

Do NOT use:
- bg-black
- bg-white
- text-white
- text-black
- border-white/10
- border-black/10
- hardcoded colors
- random opacity styles
- arbitrary hex values in JSX

If something looks wrong:
- fix the token in `src/index.css`
- do NOT patch individual components randomly

---

# 6. Border System

All standard components must use consistent borders.

Default:
- standard cards → `border-border`
- forms → `border-input`
- popovers/dialogs/sheets → `border-border`
- tables → `border-border`
- navbar/sidebar surfaces → `border-border`

Rules:
- borders must be visible in both light and dark mode
- no random opacity borders
- no `border-white/10`
- no `border-black/10`
- no per-card border differences unless semantically justified

Allowed border variations only for:
- selected
- active
- featured
- destructive
- success
- warning
- premium

---

# 7. Background System

Use tokenized backgrounds only.

Default:
- page → `bg-background`
- card → `bg-card`
- nested surface → `bg-muted`
- overlay/popover → `bg-popover`

Do NOT use:
- bg-white
- bg-black
- dark:bg-black
- custom dark surfaces
- random neutral colors
- hardcoded surface colors

---

# 8. Radius System

Goal:
- subtle
- professional
- consistent
- not overly rounded

| Component | Radius |
|----------|--------|
| Button | rounded-md |
| Input / Select / Textarea | rounded-md |
| Card | rounded-lg |
| Popover / Dropdown / Tooltip | rounded-lg |
| Dialog / Sheet | rounded-xl |
| Badge | rounded-md / rounded-full |
| Avatar | rounded-full |

Do NOT use:
- rounded-2xl unless rare and approved
- rounded-3xl
- rounded-4xl
- rounded-[value]
- inline radius overrides
- button radius overrides

Buttons must inherit radius only from shadcn Button base styling.

---

# 9. Typography Scale

All text must follow the defined hierarchy.

Use semantic text classes where available.

| Level | Size | Weight | Line Height | Tracking | Class |
|---|---|---|---|---|---|
| Display Hero | 48px | 600 | 1.00 | -2.4px | `.ui-text-display-hero` |
| Section Heading | 40px | 600 | 1.20 | -2.4px | `.ui-text-section-heading` |
| Sub-heading Large | 32px | 600 | 1.25 | -1.28px | `.ui-text-subheading-lg` |
| Card Title | 24px | 600 | 1.33 | -0.96px | `.ui-text-card-title` |
| Card Title Light | 24px | 500 | 1.33 | -0.96px | `.ui-text-card-title-light` |
| Body Large | 20px | 400 | 1.80 | normal | `.ui-text-body-lg` |
| Body Medium | 16px | 500 | 1.50 | normal | `.ui-text-body-md` |
| Body Semibold | 16px | 600 | 1.50 | -0.32px | `.ui-text-body-semibold` |
| Button / Link | 14px | 500 | 1.43 | normal | `.ui-text-button` |
| Caption | 12px | 500 | 1.33 | normal | `.ui-text-caption` |
| Mono Body | 16px | 400 | 1.50 | normal | `.ui-text-mono-body` |
| Mono Label | 12px | 500 | 1.50 | uppercase | `.ui-text-mono-label` |
| Micro Badge | 7px | 700 | 1.50 | uppercase | `.ui-text-micro-badge` |

Rules:
- use the project font system
- use semantic classes `ui-text-*` where applicable
- global tags `h1`, `h2`, `h3` may be pre-mapped to their respective scales
- do NOT use random `text-[value]` classes
- do NOT use random `font-[weight]` classes outside approved definitions
- Button typography must come from shadcn Button base styling, not inline overrides

---

# 10. Component Consistency Rule

Same component type must share the same styling foundation.

Examples:
- all cards → same border + background + radius
- all inputs → same border + ring + radius
- all dialogs → same surface + border + radius
- all buttons → shadcn Button defaults only
- all button-like links → shadcn Button with `asChild`

No visual randomness allowed.

Special styling is allowed only for clear semantic states:
- selected
- active
- featured
- destructive
- success
- warning
- premium
- locked/pro feature

---

# 11. Shared Class System

Reusable styles must be moved to `src/index.css`.

Use semantic classes such as:
- `.ui-card`
- `.ui-card-interactive`
- `.ui-panel`
- `.ui-glass-card`
- `.ui-feature-card`
- `.ui-pricing-card`
- `.ui-testimonial-card`
- `.ui-table-shell`
- `.ui-dialog-shell`
- `.ui-popover-shell`
- `.ui-form-field`
- `.ui-empty-state`
- `.ui-stat-card`
- `.ui-dashboard-panel`

Use `@apply` for repeated Tailwind utility groups.

Rules:
- no long Tailwind chains in reusable components
- JSX should focus on structure and behavior
- buttons must not use long class chains
- button-like links must not use manual Tailwind styling

Inline Tailwind is allowed only for:
- minor layout adjustments
- responsive grid composition
- small alignment tweaks

---

# 12. Brand Button CSS Rule

If `brand-primary` or `brand-gradient` requires reusable CSS, define only color-related classes in `src/index.css`.

Allowed example:

```css
@layer components {
  .btn-brand-primary {
    @apply bg-primary text-primary-foreground border-transparent hover:bg-primary/90;
  }

  .btn-brand-gradient {
    color: hsl(var(--primary-foreground));
    border-color: transparent;
    background-image: linear-gradient(
      135deg,
      hsl(var(--primary)),
      hsl(var(--secondary))
    );
  }

  .btn-brand-gradient:hover {
    background-image: linear-gradient(
      135deg,
      hsl(var(--primary) / 0.92),
      hsl(var(--secondary) / 0.92)
    );
  }
}
```

Do NOT add:
- radius
- padding
- height
- font size
- font weight
- shadow
- gap
- focus ring overrides
- disabled overrides

The shadcn Button base controls those.

---

# 13. Customization Rule

Only customize when necessary.

Allowed customization:
- brand colors
- CTA color variants
- selected state
- featured cards
- premium highlights
- locked/pro feature states

Do NOT:
- style every card differently
- style every button differently
- add random glow
- mix design styles
- introduce new styling systems

---

# 14. Gradient & Background System

Use subtle radial gradients.

Rules:
- soft
- low opacity
- not distracting
- tokenized where possible
- readable content always comes first

Landing pages:
- may use richer ambient backgrounds

Dashboard/app pages:
- use minimal ambient backgrounds
- prioritize readability

Gradients for buttons are only allowed through the approved `brand-gradient` Button variant.

Do NOT place arbitrary gradients directly in JSX.

---

# 15. Dark Mode Rule

Both light and dark mode must remain consistent.

Do NOT use:
- pure black
- pure white
- dark:bg-black
- text-white
- bg-black
- bg-white

Use tokens only:
- bg-background
- bg-card
- bg-muted
- text-foreground
- text-muted-foreground
- border-border

Dark mode must:
- avoid harsh black/white contrast
- use layered neutral surfaces
- keep borders visible
- keep text readable

Light mode must:
- stay clean and soft
- keep cards and borders visible
- avoid washed-out surfaces

---

# 16. Visual Assets Rule

Use AAA gaming quality visuals.

Visuals must:
- match gaming/creator/AI context
- feel premium
- support the section topic
- avoid generic corporate stock imagery

Examples:
- clips → gameplay thumbnails
- memes → gaming meme visuals
- images → gaming/creator visuals
- analytics → creator performance/dashboard visuals
- profiles → gamer/creator avatars

Do NOT use:
- irrelevant assets
- blurry images
- low-quality visuals
- mismatched art styles
- generic business stock photos

---

# 17. Logo Usage Rule

Use the official NexaClip logo consistently.

Always:
- use the correct provided logo asset
- use the correct light/dark variant when needed
- import from a single consistent location
- use a reusable logo component when possible

Do NOT:
- recreate the logo
- stretch or distort the logo
- recolor manually
- duplicate logo files randomly
- use text substitutes when logo asset is required

---

# 18. Data, Mock Data & Empty State Rule

Always include:
- realistic mock data
- empty state
- loading state
- error/recovery state where relevant

Mock data must be gaming-creator relevant.

Examples:
- “Valorant 1v4 Clutch That Went Viral”
- “Counter-Strike 2 Hidden Smoke Meme”
- “Fortnite Trickshot Highlights”
- “Apex Legends Ranked Fail Meme”
- “Minecraft Build Tip Carousel”

Platforms:
- TikTok
- YouTube
- Instagram

Content types:
- Clip
- Meme
- Image
- Insight

Do NOT use:
- lorem ipsum
- Item 1
- User A
- generic placeholder copy

Empty states must:
- explain what happened
- guide the next action
- include a clear CTA
- avoid blank pages

---

# 19. Responsiveness Rule

Must support:
- mobile
- tablet
- desktop
- large screens

Rules:
- no horizontal overflow
- proper stacking
- responsive grids
- readable text
- tables scroll horizontally if needed
- charts resize properly
- cards stack on smaller screens
- filters collapse or wrap cleanly

Dashboard/app pages:
- use full available app-shell width
- do not use narrow landing-page containers unless specified
- right sidebars should stack on smaller screens

---

# 20. Accessibility Rule

Must follow accessibility best practices.

Required:
- readable contrast
- visible focus states
- accessible forms
- proper labels
- keyboard navigation
- no color-only meaning
- semantic table headers
- accessible icon buttons

Buttons:
- icon-only buttons must have `aria-label`
- button-like links must preserve correct link semantics with `Button asChild`
- disabled buttons must remain accessible and visually clear
- focus states must come from shadcn Button base behavior

Forms:
- inputs must have labels or accessible labels
- errors must be linked to fields
- helper text must be readable

Charts:
- readable labels/tooltips
- do not rely only on color
- provide legends where needed

---

# 21. Performance Rule

Must optimize:
- LCP
- CLS
- INP

Avoid:
- heavy animations
- unnecessary JS
- huge assets
- layout shift
- excessive client-side rendering
- unnecessary re-renders

Use:
- optimized images/thumbnails
- skeletons matching final dimensions
- lightweight charts
- lazy loading where appropriate

---

# 22. Charts & Analytics Rule

Charts must:
- use token colors
- be readable
- be responsive
- support light and dark mode
- include legends/tooltips where useful

No hardcoded chart colors in JSX.

Analytics pages must:
- be useful, not decorative
- show realistic gaming creator data
- distinguish clips, memes, and images
- include platform context for TikTok, YouTube, and Instagram

---

# 23. Pricing Rule

Pricing must follow the product documents.

Plans:
- Free
- Pro Creator
- Studio

Pricing:
- Free: $0/month
- Pro Creator: $12/month
- Pro annual: $10/month equivalent
- Annual savings: Save 17%
- Studio: $39/month or safe contact/trial flow if not fully implemented

Free includes:
- 5 image/meme generations per day
- clip uploads up to 500MB
- 3 Creator Coach messages per month
- basic analytics preview
- contextual upgrade prompts

Pro includes:
- unlimited image/meme generations
- clip uploads up to 5GB
- unlimited Creator Coach conversations
- full analytics
- engagement rate access
- weekly AI coaching report
- advanced insights

Studio is for:
- teams
- esports creators
- agencies
- multi-account workflows

Do NOT use generic SaaS pricing language:
- projects
- API calls
- custom domains
- SLA guarantees
- enterprise infrastructure

Landing pricing:
- simple cards only
- no full comparison table
- Pro highlighted as Most Popular

Pricing page:
- detailed comparison table
- FAQ
- monthly/yearly toggle
- bottom CTA

---

# 24. Profile & Billing Rule

User profile should show plan identity only.

Own Profile may show:
- FREE / PRO / STUDIO badge
- small action link:
  - Free → Unlock Pro
  - Pro → Manage billing
  - Studio → Manage plan

Do NOT show on profile:
- invoice history
- card/payment method
- next billing date
- cancellation controls
- Stripe details

Billing details belong in:
- Settings → Billing

SideNav may show:
- avatar
- username
- plan badge
- upgrade nudge for Free users

---

# 25. Refactor Rule

When editing:
- remove inconsistencies
- unify tokens
- simplify styles
- improve reuse
- replace manual buttons with shadcn Button
- replace button-like links with `Button asChild`
- move repeated styling into `src/index.css`

Do NOT redesign unless explicitly requested.

Preserve:
- existing functionality
- current routes
- app shell
- sidebar/topbar behavior
- user flows

---

# 26. Cleanup Targets

Remove or refactor:

- rounded-[...]
- rounded-3xl
- rounded-4xl
- border-white/10
- border-black/10
- bg-white
- bg-black
- dark:bg-black
- text-white
- text-black
- shadow-2xl
- raw hex colors
- random opacity borders
- long Tailwind chains
- raw styled `<button>` elements
- manually styled CTA links
- button className chains that override radius/padding/height/font/shadow
- arbitrary button gradients in JSX
- duplicate custom component systems

---

# 27. AI Workflow

Before coding:
1. audit inconsistencies
2. check tokens
3. check radius
4. check borders
5. check all buttons and button-like links
6. check shadcn usage
7. check responsive behavior
8. check accessibility
9. check empty/loading states
10. check Server vs Client component boundaries (`"use server"` / `"use client"`)
11. check route group placement — `(auth)/` vs `(dashboard)/` vs root
12. check that API logic lives in `app/api/` route handlers — never inline in components
13. check that auth logic lives in `lib/auth.ts` and `hooks/` — never duplicated across pages

Then:
- fix tokens first
- fix shared classes
- update shadcn variants only when needed
- update reusable components
- update pages last
- replace manual buttons with shadcn Button
- replace CTA links with `Button asChild`
- ensure new pages follow Rule 28 (modular folder) and Rule 29 (Next.js full-stack structure)

After coding:
- audit dark/light mode
- audit border/radius consistency
- audit button consistency
- audit responsive behavior
- audit accessibility
- audit repeated Tailwind chains
- audit hardcoded colors
- audit Server/Client component split — no `useState`/`useEffect` in Server Components
- audit that no sensitive logic (API keys, DB calls) exists in Client Components

---

# 28. Modular Folder Architecture Rule

Every page and every component must follow a strict modular folder structure.

This rule applies when **creating any new page or component**.

---

## Core Rule

Every named folder (page or component) must contain its own `skeletons/` subfolder.

If a page or component has nested components, each nested component folder must also have its own `skeletons/` subfolder.

If a page or component has no nested components (leaf node), it only needs a single `skeletons/` folder at its own level.

---

## Required Structure

### Page with no components (leaf page)

```
src/pages/MyPage/
├── skeletons/
│   └── MyPageSkeleton.tsx
└── MyPage.tsx
```

### Page with components

```
src/pages/MyPage/
├── components/
│   ├── MyWidget/
│   │   ├── skeletons/
│   │   │   └── MyWidgetSkeleton.tsx
│   │   └── MyWidget.tsx
│   └── MyPanel/
│       ├── skeletons/
│       │   └── MyPanelSkeleton.tsx
│       └── MyPanel.tsx
├── skeletons/
│   └── MyPageSkeleton.tsx
└── MyPage.tsx
```

### Component with nested components

```
src/pages/MyPage/
├── components/
│   └── AudienceTab/
│       ├── components/
│       │   └── AudienceChart/
│       │       ├── skeletons/
│       │       │   └── AudienceChartSkeleton.tsx
│       │       └── AudienceChart.tsx
│       ├── skeletons/
│       │   └── AudienceTabSkeleton.tsx
│       └── AudienceTab.tsx
├── skeletons/
│   └── MyPageSkeleton.tsx
└── MyPage.tsx
```

---

## Rules

- Every page folder directly inside `src/pages/` must have a `skeletons/` subfolder.
- Every named component subfolder inside any `components/` folder must have its own `skeletons/` subfolder.
- Nesting is recursive — if a component has its own `components/`, apply the same rule to every subfolder inside it.
- A leaf folder (no `components/` subfolder) only needs one `skeletons/` folder at its own level — do not create empty nested structures.
- Every `skeletons/` folder must contain at least one skeleton component (e.g. `MySkeleton.tsx`), not just a `.gitkeep`.
- Skeleton components must use the shadcn `Skeleton` component as the base.
- Skeletons must match the final layout dimensions as closely as possible to avoid layout shift (CLS).

---

## Skeleton Component Rules

Use shadcn `Skeleton` with `React.memo` and `displayName`:

```tsx
import { memo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const MyWidgetSkeleton = memo(() => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-[200px]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
  )
})
MyWidgetSkeleton.displayName = "MyWidgetSkeleton"
```

Do NOT:
- use `animate-pulse` manually on wrapper divs or raw elements — shadcn `Skeleton` handles this internally
- use raw opacity modifiers on token classes (`bg-card/40`, `border-border/50`, `bg-muted/20`) — use clean tokens only; the sole exception is `bg-primary/10` for AI/accent zone tinting
- use `backdrop-blur-sm` on skeleton wrappers
- hardcode dimensions that do not match real content
- create skeleton components outside of `skeletons/` folders
- use relative import paths — always use `@/components/ui/skeleton`
- export skeletons without `React.memo` and `displayName`

---

## Audit Checklist (run before committing any new page or component)

- [ ] Page folder has a `skeletons/` subfolder
- [ ] Every component subfolder has its own `skeletons/` subfolder
- [ ] Every nested component subfolder has its own `skeletons/` subfolder
- [ ] Each `skeletons/` folder contains at least one `.tsx` skeleton file
- [ ] Skeleton dimensions match final component layout
- [ ] shadcn `Skeleton` is used — no raw `animate-pulse` divs

---

# 29. Next.js Full-Stack App Structure Rule

> **Current status: Target architecture — not yet active.**
> This project is currently a **Vite + React SPA**. Rule 29 describes the target Next.js App Router architecture to migrate toward. Until migration is complete, enforce only the directory conventions that apply to both stacks (lib/, services/, hooks/, contexts/, utils/, types/, components/shared/).
>
> Migration progress is tracked in `MIGRATION-STATE.md` at the project root. Always read this file before adding, moving, or refactoring anything. Update it after every structural change.

---

## Top-Level Directory Map

```
src/
├── app/                          ← Next.js App Router — routes only
│   ├── (auth)/                   ← Auth route group (no shared layout with dashboard)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx            ← Auth shell layout
│   ├── (dashboard)/              ← Authenticated app route group
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── page.tsx              ← Dashboard home
│   │   └── layout.tsx            ← Dashboard shell (sidebar, topbar)
│   ├── api/                      ← API Route Handlers only
│   │   └── [route-handler]/
│   │       └── route.ts
│   ├── layout.tsx                ← Root layout (fonts, providers, theme)
│   └── page.tsx                  ← Landing page
├── components/                   ← Shared, reusable components only
│   ├── ui/                       ← shadcn/ui primitives
│   ├── shared/                   ← Cross-page shared components (Navbar, Footer)
│   └── dashboard/                ← Shared dashboard widgets used across multiple pages
├── lib/                          ← Core utilities and integrations
│   ├── auth.ts                   ← Auth config (NextAuth / Firebase / Clerk)
│   ├── firestore.ts              ← DB client
│   └── utils.ts                  ← cn() and other pure helpers
├── services/                     ← External API and data layer
│   ├── apiClient.ts              ← Axios/fetch wrapper
│   └── userService.ts            ← User data operations
├── hooks/                        ← Custom React hooks
│   └── useAuth.ts
├── contexts/                     ← React Context providers
│   └── AuthContext.tsx
├── utils/                        ← Pure utility functions (no side effects)
│   ├── dateFormatter.ts
│   └── validators.ts
├── types/                        ← Global TypeScript types and interfaces
│   └── index.ts
├── styles/                       ← Global styles only
│   └── globals.css
└── tests/                        ← Tests mirror the src structure
    ├── components/
    └── integration/
```

---

## Route Group Rules

### `(auth)/` group
- Contains: login, register, forgot-password, reset-password
- Has its own `layout.tsx` — minimal shell, no sidebar/topbar
- No authenticated data fetching inside this group

### `(dashboard)/` group
- Contains all authenticated app pages
- Has its own `layout.tsx` — includes sidebar, topbar, auth guard
- All pages inside this group assume an authenticated session

### Root `app/`
- `layout.tsx` — root providers only: ThemeProvider, AuthContext, QueryClient, fonts
- `page.tsx` — public landing page only

---

## Page Component Rules (App Router)

Every page inside `app/` is a **Server Component by default**.

```tsx
// app/(dashboard)/analytics/page.tsx
// No "use client" — this is a Server Component
import { AnalyticsPage } from "@/pages/Analytics/Analytics"

export default function AnalyticsRoute() {
  return <AnalyticsPage />
}
```

The `app/` route files are **thin wrappers only** — they import from `src/pages/` where the real component logic and structure lives (see Rule 28).

Do NOT put component logic, JSX layout, or state directly in `app/` route files.

---

## Server vs Client Component Rule

| Location | Default | When to add directive |
|---|---|---|
| `app/**/page.tsx` | Server | Only if page needs client state |
| `app/**/layout.tsx` | Server | Only if layout needs client state |
| `src/pages/**/*.tsx` | Server | Add `"use client"` only when needed |
| `src/components/shared/**` | Server | Add `"use client"` only when needed |
| Anything using `useState`, `useEffect`, `useContext`, event handlers | Must be `"use client"` | — |
| `src/hooks/**` | Client | Always `"use client"` |
| `src/contexts/**` | Client | Always `"use client"` |

Rules:
- Default to Server Components — only add `"use client"` when the component uses browser APIs, React state, or event handlers.
- Push `"use client"` as deep as possible — keep parent components as Server Components.
- Never put `"use client"` on a layout that wraps Server Component pages unless unavoidable.
- Never `fetch()` data inside Client Components when a Server Component can do it.

---

## API Route Rules

All server-side logic must live in `app/api/`:

```
app/api/
├── auth/
│   └── route.ts           ← NextAuth handler or custom auth endpoint
├── user/
│   └── route.ts
└── clips/
    └── route.ts
```

Rules:
- API routes export named HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Never expose API keys, DB credentials, or secrets in route handlers — use `process.env` only
- Always validate request bodies — use Zod or manual validation
- Always return typed `NextResponse` — never raw `Response` with untyped JSON
- Never call `app/api/` routes from Server Components — use service functions in `src/services/` directly

```ts
// app/api/clips/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getClips } from "@/services/clipService"

export async function GET(req: NextRequest) {
  const clips = await getClips()
  return NextResponse.json(clips)
}
```

---

## Auth Rule

Auth must be handled in one place: `src/lib/auth.ts`.

Never:
- duplicate auth logic across pages
- check session state in multiple places manually
- store auth tokens in `localStorage` — use cookies or server sessions
- expose user passwords, tokens, or session secrets in Client Components

Auth guard pattern for the dashboard layout:

```tsx
// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"

export default async function DashboardLayout({ children }) {
  const session = await getServerSession()
  if (!session) redirect("/login")
  return <>{children}</>
}
```

---

## `src/lib/` vs `src/services/` vs `src/utils/` Rule

| Directory | Purpose | Examples |
|---|---|---|
| `src/lib/` | Third-party integrations, config, and core singletons | `auth.ts`, `firestore.ts`, `db.ts`, `stripe.ts` |
| `src/services/` | Data operations — fetch, mutate, transform | `userService.ts`, `clipService.ts`, `apiClient.ts` |
| `src/utils/` | Pure functions with no side effects | `dateFormatter.ts`, `validators.ts`, `cn.ts` |
| `src/hooks/` | React hooks — stateful, Client only | `useAuth.ts`, `useClips.ts` |
| `src/contexts/` | React Context providers — Client only | `AuthContext.tsx`, `ThemeContext.tsx` |
| `src/types/` | TypeScript types and interfaces only — no logic | `index.ts`, `clip.ts`, `user.ts` |

Do NOT:
- put business logic in `src/utils/` — that belongs in `src/services/`
- put React hooks in `src/lib/` — that belongs in `src/hooks/`
- put third-party config in `src/services/` — that belongs in `src/lib/`

---

## `src/components/` Directory Rule

Only **shared, reusable** components belong here.

```
src/components/
├── ui/           ← shadcn/ui primitives only — never modified directly
├── shared/       ← Used on 2+ pages: Navbar, Footer, PageHeader, UserAvatar
└── dashboard/    ← Shared dashboard widgets used on 2+ dashboard pages
```

Do NOT:
- put page-specific components in `src/components/` — they belong in `src/pages/[PageName]/components/`
- modify files inside `src/components/ui/` — extend via shadcn variants or wrapper components
- create a `src/components/pages/` directory — that pattern belongs in `src/pages/`

---

## `src/types/` Rule

All TypeScript types and interfaces must be centralized.

```ts
// src/types/index.ts
export interface User {
  id: string
  email: string
  plan: "free" | "pro" | "studio"
}

export interface Clip {
  id: string
  title: string
  platform: "tiktok" | "youtube" | "instagram"
  createdAt: string
}
```

Rules:
- All shared types exported from `src/types/index.ts`
- No inline type definitions in component files unless the type is truly local
- No `any` — use proper types or `unknown`
- Use `interface` for objects, `type` for unions and primitives

---

## App Router Checklist

When creating a new route:
- [ ] Create route file: `app/(group)/[route-name]/page.tsx`
- [ ] Route file is a thin wrapper — imports from `src/pages/[PageName]/`
- [ ] Correct route group assigned — `(auth)/` or `(dashboard)/`
- [ ] Layout file exists at the right level
- [ ] Auth guard applied at layout level — not inside page components
- [ ] Server Component by default — `"use client"` only if truly needed
- [ ] API logic in `app/api/` — not inline in the page
- [ ] Data fetching in Server Component or `src/services/` — not in Client Component
- [ ] Types defined in `src/types/`
- [ ] Environment variables accessed via `process.env` — never hardcoded

---

# FINAL RULE

The UI must feel like ONE system.

Not a mix of random styles.

All buttons and button-like links must feel like they belong to the same shadcn-based design system.