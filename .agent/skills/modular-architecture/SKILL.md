---
name: modular-architecture
description: Multi-level nested folder structure standard for Next.js App Router full-stack projects. app/ directory holds thin route wrappers only. src/pages/ holds all real page component logic with modular components/ and skeletons/ subfolders at every level. Covers route groups, Server vs Client components, auth guards, API routes, hooks, services, contexts, and types.
license: MIT
---

# Modular & Nested Folder Architecture Standard

## Overview

This application is a **Next.js App Router full-stack project**. The architecture enforces a strict separation between routing and component logic:

- `app/` — Next.js route files only. Thin wrappers. No component logic.
- `src/pages/` — All real page component logic, structured with modular `components/` and `skeletons/` subfolders.
- `src/components/` — Shared, reusable components used across 2+ pages.
- `src/lib/`, `src/services/`, `src/hooks/`, `src/contexts/`, `src/utils/`, `src/types/` — Dedicated layers for each concern.

Always consult and strictly adhere to this architectural standard when adding, modifying, refactoring, or deleting routes, views, components, or layout elements.

**Keywords**: folder structure, Next.js App Router, route groups, server components, client components, auth, API routes, clean architecture, components, nested components, page folders, modular design, skeleton loading, skeletons, encapsulation, hooks, services, contexts, types

---

## Core Guidelines

### 1. App Router Route Files Are Thin Wrappers

Files inside `app/` are **routing only**. They import from `src/pages/` and render nothing else.

```tsx
// app/(dashboard)/analytics/page.tsx
import { AnalyticsPage } from "@/pages/Analytics/Analytics"
export default function AnalyticsRoute() {
  return <AnalyticsPage />
}
```

Do NOT put JSX layout, state, or component logic directly in `app/` route files.

### 2. Route Groups

Use parenthesized route groups to separate layout contexts:

- `app/(auth)/` — login, register, forgot-password. Has its own minimal `layout.tsx`.
- `app/(dashboard)/` — all authenticated app pages. Has its own `layout.tsx` with sidebar/topbar and auth guard.
- Root `app/` — root `layout.tsx` (providers, fonts, theme) and public `page.tsx` (landing page).

### 3. Page-Level Encapsulation

Every distinct page view lives in its own dedicated folder under `src/pages/`:

- The primary page component is named exactly after the folder (e.g., `src/pages/Analytics/Analytics.tsx`).
- No page component exists as a flat file directly under `src/pages/`.

### 4. Multi-Level Page-Specific Components

Components unique to a page must not go in the global `src/components/` directory. They live inside that page's own hierarchy.

**Correct Symmetrical Nesting Example:**

```
src/pages/Analytics/
├── Analytics.tsx                         ← Page Entry (imported by app/ route)
├── components/
│   ├── OverviewTab/
│   │   ├── OverviewTab.tsx
│   │   ├── components/
│   │   │   └── .gitkeep
│   │   └── skeletons/
│   │       └── OverviewTabSkeleton.tsx
│   └── AudienceTab/
│       ├── AudienceTab.tsx
│       ├── components/
│       │   └── .gitkeep
│       └── skeletons/
│           └── AudienceTabSkeleton.tsx
└── skeletons/
    └── AnalyticsSkeleton.tsx
```

### 5. Integrated Skeleton Loading Animations

Skeletons live with their parent component — never in a global directory.

- Place skeletons in a `skeletons/` folder inside the same directory as the component they represent.
- Name the skeleton file after its target (e.g., `AnalyticsSkeleton.tsx`, `OverviewTabSkeleton.tsx`).
- Every `skeletons/` folder must contain a real `.tsx` file — never just `.gitkeep`.

### 6. Server vs Client Component Discipline

- All `src/pages/` components are **Server Components by default**.
- Add `"use client"` only when the component uses `useState`, `useEffect`, `useContext`, or event handlers.
- Push `"use client"` as deep as possible — keep parent components as Server Components.
- All `src/hooks/` and `src/contexts/` files are always Client (`"use client"` at the top).

### 7. Shared Components Rule

Only components used across **2 or more pages** belong in `src/components/`.

```
src/components/
├── ui/         ← shadcn/ui primitives — never modified directly
├── shared/     ← Navbar, Footer, PageHeader, UserAvatar
└── dashboard/  ← Shared dashboard widgets (used on 2+ dashboard pages)
```

Page-specific components always stay inside `src/pages/[PageName]/components/`.

### 8. Symmetrical Sub-Folder Rules

**Do:**
- Use `components/` (plural) for sub-component directories.
- Use `skeletons/` (plural) for skeleton directories.
- Use `.gitkeep` only inside empty `components/` folders — not inside `skeletons/`.
- Every `skeletons/` folder must contain a real `.tsx` skeleton from the moment it is created.
- Keep sub-views localized — if a component is only used inside `OverviewTab`, it lives in `OverviewTab/components/`.

**Don't:**
- Place component files flat inside `src/pages/` or `app/`.
- Place page-specific components inside `src/components/`.
- Put component logic inside `app/` route files.

### 9. Import Path Discipline

Always use `@/` aliases — never relative `../../` paths across directory boundaries.

```ts
// Correct
import { AnalyticsPage } from "@/pages/Analytics/Analytics"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getClips } from "@/services/clipService"

// Wrong
import { AnalyticsPage } from "../../../pages/Analytics/Analytics"
```

---

## Architecture Checklist

When creating a new route and page:
- [ ] Create route file: `app/(group)/[route-name]/page.tsx` — thin wrapper only
- [ ] Assign correct route group: `(auth)/` or `(dashboard)/`
- [ ] Create page folder: `src/pages/[PageName]/`
- [ ] Create page entry component: `src/pages/[PageName]/[PageName].tsx`
- [ ] Create page-level skeleton: `src/pages/[PageName]/skeletons/[PageName]Skeleton.tsx`
- [ ] Create component storage folder: `src/pages/[PageName]/components/`
- [ ] Each sub-component gets its own folder with `components/` and `skeletons/` subfolders
- [ ] Repeat `components/` + `skeletons/` recursively for any further nested components
- [ ] Every `skeletons/` folder contains a real `.tsx` file — not just `.gitkeep`
- [ ] Default to Server Component — add `"use client"` only when needed
- [ ] Auth guard applied at layout level — not inside page components
- [ ] API calls go through `src/services/` — not inline in components
- [ ] Skeleton components follow the skeleton-ui SKILL (React.memo + displayName + shadcn Skeleton)
- [ ] All imports use `@/` aliases
- [ ] Run lint and compile checks to confirm type and route safety
