---
name: skeleton-ui
description: Reusable guidelines and blueprint standards for designing and implementing highly polished skeleton loaders (Tailwind + shadcn) for dashboards, widgets, social feeds, and analytical sections to maximize perceived performance. Use this skill whenever building loading screens, skeleton widgets, content placeholders, or implementing smooth loading transitions for async data fetching.
---

# Skeleton UI Loader Skill

This skill provides the technical standards and exact design blueprints for building high-fidelity skeleton loading states. By mimicking the layout, structural alignment, and responsive grid patterns of the final hydrated content, these skeletons ensure elite-level perceived performance and zero layout shift.

---

## 🚀 Perceived Performance & The "NexaClip Standard"

A premium application prioritizes UI stability and fluid motion. Traditional loading spinners or generic blocks feel abrupt and clinical. Premium skeleton screens should:
1. **Mirror Hydrated Geometry Exactly:** The skeleton's height, margin, padding, border-radius, and alignment must match the final UI pixel-for-pixel to eliminate Flash of Unstyled Content (FOUC).
2. **Utilize Subtle Ambient Gradients:** Instead of solid bright gray shapes, use deep translucent backdrops (`bg-card/40`, `bg-muted/10`, `bg-primary/5`) and thin borders (`border-border/50`) matching the main app shell's theme.
3. **Incorporate Rhythmic Pulsing:** Use the `animate-pulse` class on root elements rather than independent fast-flickering components to establish a calm, synchronous breathing feel.
4. **Optimize Rendition with React Memoization:** Wrap skeleton modules in React's `memo` function with explicitly defined `displayName` values to prevent costly rendering cycles.

---

## 🎨 Styling Blueprints

Skeletons must leverage custom aspect ratios and layout structures to model realistic content:

### 1. Typography & Text Lines
Never use full-width blocks for standard copy. Structure paragraphs with staggered, human-like line lengths:
- **Discussions / Titles:** `h-4 w-2/3` or `h-5 w-48`
- **Subtitles / Metadata:** `h-3 w-1/3` or `h-2.5 w-24`
- **Multi-line paragraphs:** Group alternating lengths (e.g., `h-3 w-full`, `h-3 w-[85%]`, `h-3 w-[60%]`)

### 2. Aspect Ratios & Placeholders
- Use `aspect-video` for clip previews, media, or video containers.
- Use `aspect-square` or `rounded-full` for creator or user profile avatars.
- Keep structural height parameters explicit (e.g., `h-[300px] w-full`).

---

## 🧬 Component Patterns & Blueprints

Include these proven code blueprints when generating new skeleton loaders or modifying existing pages.

### Blueprint A: KPI / Metric Card
A compact, highly-aligned grid element containing rapid trend metrics.

```tsx
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const KPICardSkeleton = memo(() => {
  return (
    <Card className="p-5 border border-border/50 bg-card/40 flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start mb-3">
        {/* Simulating custom metadata/icon wraps */}
        <div className="p-2 rounded-md bg-muted/20 border border-muted/30">
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

### Blueprint B: Data Charts & Visualizers
Simulate real analytics without rendering massive layout shells. Use dynamic height array mapping with staggered heights to mimic realistic data.

```tsx
export const ChartWidgetSkeleton = memo(() => {
  return (
    <Card className="p-6 md:p-8 bg-card/40 backdrop-blur-sm border-border">
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
        <div className="h-[250px] w-full flex items-end gap-3 pb-4 border-b border-border/40">
          {/* Loop to render simulated chart coordinates at static varied increments */}
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

### Blueprint C: Post Cards & Social Feeds
For media or community activity widgets, align aspect ratio shapes along with detailed interaction panels.

```tsx
import { Card, CardContent } from "@/components/ui/card";

export const PostCardSkeleton = memo(() => {
  return (
    <Card className="overflow-hidden flex flex-col border border-border bg-card/40">
      {/* Aspect video header representing post visuals or game loops */}
      <div className="relative aspect-video bg-muted/20">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3.5 w-5/6 rounded" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
        </div>

        {/* User context or secondary metadata labels */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/50">
          <Skeleton className="h-3 w-3 rounded-full shrink-0" />
          <Skeleton className="h-3 w-[70%] rounded" />
        </div>
      </CardContent>

      <div className="p-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </Card>
  );
});
PostCardSkeleton.displayName = "PostCardSkeleton";
```

---

## 🛠️ Step-by-Step Implementation Flow

When the user asks to integrate skeleton loaders or asynchronous transitions:

1. **Review High-Fi Component UI Layouts:**
   Before coding, read the actual dashboard page or grid component file (`view_file` on e.g., `src/pages/HomeFeed.tsx`) to identify its responsive layout class structures (grids, columns, flex, flex-direction).

2. **Generate Skeleton Components (`X_Skeleton.tsx`):**
   - Place skeleton elements in a separate module under `/src/components/` or `/src/components/ui`.
   - Ensure the skeleton's classes match the root layout container styles exactly (e.g., if the main feed uses `<div className="ui-dashboard-grid mt-6">`, the skeleton wrapper must use `<div className="ui-dashboard-page space-y-6 animate-pulse mt-6">`).

3. **Import and Conditional Render:**
   Maintain a strict conditional check inside the parent page to render Skeletons during data loading:
   ```tsx
   import { DashboardSkeleton } from "../components/DashboardSkeleton";
   
   // ... inside main render logic ...
   if (loading) {
     return <DashboardSkeleton />;
   }
   ```

4. **Verify Type-Safety and Build Integrity:**
   - Put accurate `import` paths for UI elements such as `Card`, `Skeleton`, or external utilities.
   - Run a `lint_applet` and a `compile_applet` check to ensure the new skeleton structures have zero TS issues or export errors.
