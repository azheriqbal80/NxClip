---
name: skeleton-ui
description: Guidelines and blueprints for building high-fidelity skeleton loaders in a Next.js App Router full-stack project using Tailwind CSS, React.memo, and shadcn/ui. Covers placement inside skeletons/ subfolders, Next.js loading.tsx integration, Server vs Client component rules, and the premium dark creator-tech nxclip.ai aesthetic.
---

# Skeleton UI Creation Guidelines & Blueprints

This skill provides comprehensive guidelines and technical blueprints for creating high-fidelity, performance-optimized skeleton loaders in a **Next.js App Router** project, matching the dark premium "creator-tech" aesthetic (nxclip.ai standard) using Tailwind CSS and React memoization.

---

## 0. Next.js App Router — Skeleton Placement

Next.js supports two skeleton integration patterns. Use both:

### Pattern A — `loading.tsx` (route-level, automatic)

Place a `loading.tsx` file directly inside an `app/` route folder. Next.js streams this automatically while the page loads:

```
app/(dashboard)/analytics/
├── page.tsx
└── loading.tsx      ← Renders automatically while page.tsx streams
```

```tsx
// app/(dashboard)/analytics/loading.tsx
import { AnalyticsSkeleton } from "@/pages/Analytics/skeletons/AnalyticsSkeleton"
export default function Loading() {
  return <AnalyticsSkeleton />
}
```

The skeleton component itself lives in `src/pages/Analytics/skeletons/` per the modular-architecture SKILL — the `loading.tsx` is only a thin re-export.

### Pattern B — Conditional render inside components (component-level)

For sub-components that fetch their own data or have their own loading state:

```tsx
// src/pages/Analytics/components/OverviewTab/OverviewTab.tsx
"use client"
import { OverviewTabSkeleton } from "./skeletons/OverviewTabSkeleton"

if (isLoading) return <OverviewTabSkeleton />
```

### Which to use

| Situation | Pattern |
|---|---|
| Full page load / route transition | `loading.tsx` (Pattern A) |
| Sub-component data fetching | Conditional render (Pattern B) |
| Tab switching / UI state | Conditional render (Pattern B) |

---

## 1. Principles of High-Fidelity Skeletons

To avoid visual layout shifting during page hydration, skeleton loaders must act as **mirror boundaries** of the target components:

1. **Pixel-Perfect Structural Mirroring**:
   - Match the exact heights, paddings, flex layouts, grids, gaps, and borders as the hydrated components.
   - Use identical CSS utility classes (margins, rounded corners, borders) so the transition from loading state to loaded state is visually seamless.

2. **The "nxclip.ai" Dark Theme Aesthetics**:
   - For standard card backgrounds: use `bg-card border-border` as the base surface.
   - Muted container zones inside skeletons: use `bg-muted border-border` — no raw opacity modifiers like `/10` or `/40`.
   - Accent Skeletons (e.g. AI panel): use `bg-primary/10` as a subtle tint to indicate premium/AI zones. This is the only approved opacity modifier for skeleton containers.
   - The shadcn `Skeleton` component handles its own pulse animation internally — do NOT add `animate-pulse` to wrapper divs or raw elements. Apply `animate-pulse` only directly on `<Skeleton>` if a custom override is required and approved.

3. **Performance Optimization (React.memo)**:
   - Skeleton components must be **Client Components** (`"use client"`) — `memo` is a React hook and cannot be used in Server Components.
   - Always wrap skeleton components in `memo` from `"react"`. Skeleton loaders undergo continuous rendering loops during initialization; preventing unnecessary parent re-renders is critical.
   - Explicitly define `displayName` for developer tooling visibility and eslint compliance.

---

## 2. Technical Blueprint: KPI Metric Card Skeleton

Aligns with the standard KPICards used across the feed and dashboards.

```tsx
"use client"
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const KPICardSkeleton = memo(() => {
  return (
    <Card className="ui-dashboard-kpi-card border border-border bg-card p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-md bg-muted border border-border">
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="h-4 w-12 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </Card>
  );
});
KPICardSkeleton.displayName = "KPICardSkeleton";
```

---

## 3. Technical Blueprint: Interactive Media / Post Card Skeleton

Supports a dual-layout feed card containing video thumbnails, user descriptors, dynamic tags, interactions counters, and custom inline action triggers.

```tsx
"use client"
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PostCardSkeleton = memo(() => {
  return (
    <Card className="ui-post-card group h-full text-start flex flex-col border border-border bg-card">
      <div className="ui-post-thumbnail relative aspect-video bg-muted">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded bg-background" />
          <Skeleton className="h-4 w-16 rounded bg-background" />
        </div>
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-4 w-10 rounded bg-primary/10" />
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3.5 w-5/6 rounded" />
            <Skeleton className="h-3 w-16 rounded mt-2" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
        </div>

        <div className="flex items-center gap-2 p-2 rounded-md bg-muted border border-border">
          <Skeleton className="h-3 w-3 rounded-full shrink-0" />
          <Skeleton className="h-3 w-[70%] rounded" />
        </div>

        <div className="ui-post-metric-row mt-auto border-t border-border pt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1 text-center">
              <Skeleton className="h-3.5 w-10 mx-auto rounded" />
              <Skeleton className="h-2.5 w-8 mx-auto rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
PostCardSkeleton.displayName = "PostCardSkeleton";
```

---

## 4. Technical Blueprint: Analytical Area/Bar Chart Skeleton

To keep visual layouts consistent while rendering charts, avoid standard raw placeholders and construct pseudo-bars using grid overlays representing previous data metrics.

```tsx
"use client"
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ChartWidgetSkeleton = memo(() => {
  return (
    <Card className="p-6 md:p-8 bg-card border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="h-[300px] w-full flex flex-col justify-between">
        <div className="h-[250px] w-full flex items-end gap-3 pb-4 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <Skeleton
                className="w-full bg-primary/10 rounded-t"
                style={{ height: `${[40, 25, 85, 45, 55, 30, 48][i]}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </Card>
  );
});
ChartWidgetSkeleton.displayName = "ChartWidgetSkeleton";
```

---

## 5. Performance Optimization Checklist

- [ ] **`"use client"` at top of file**: Skeleton components use `memo` — they must be Client Components.
- [ ] **React.memo Applied**: Verify every skeleton export has been registered inside `memo` to bypass useless virtual DOM evaluations.
- [ ] **displayName Provided**: Correct `Component.displayName = "Component";` defined.
- [ ] **Matching Array length**: Ensure that mapping list sizes exactly equal native loading counts of items (e.g. 5 list items matching 5 placeholder mock items).
- [ ] **No raw animate-pulse**: Do NOT add `animate-pulse` to wrapper divs or raw elements. The shadcn `Skeleton` component handles pulse animation internally.
- [ ] **No opacity token overrides**: Do not use `/40`, `/50`, `/20`, `/10` modifiers on `bg-card`, `bg-muted`, `border-border`, or similar tokens. Use clean semantic tokens only. The sole exception is `bg-primary/10` for accent/AI zone tinting.
- [ ] **Token-only styling**: All wrapper surfaces must use `bg-card`, `bg-muted`, `border-border` — no `bg-white`, `bg-black`, `bg-card/40`, or `backdrop-blur-sm`.
- [ ] **Correct import paths**: Always use `@/components/ui/skeleton` and `@/components/ui/card` — not relative `./ui/` paths.
- [ ] **Skeleton lives in correct folder**: File must be inside the `skeletons/` subfolder of its parent component or page (see modular-architecture SKILL).
- [ ] **`loading.tsx` for route-level skeletons**: Full page route loading must use `app/(group)/[route]/loading.tsx` that re-exports the page skeleton from `src/pages/`.
- [ ] **No skeleton logic in `app/` files**: `loading.tsx` is a thin wrapper — all skeleton JSX lives in `src/pages/[PageName]/skeletons/`.