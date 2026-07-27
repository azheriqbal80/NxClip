import { memo } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export const FocusCardSkeleton = memo(() => {
  return (
    <Card className="ui-plan-card border border-border bg-primary/5 shadow-soft overflow-hidden relative p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-8 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        </div>
        <div className="shrink-0 w-full md:w-44 space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 mx-auto rounded" />
        </div>
      </div>
    </Card>
  );
});
FocusCardSkeleton.displayName = "FocusCardSkeleton";

export const MetricCardSkeleton = memo(() => {
  return (
    <Card className="ui-metric-card border border-border p-5 relative overflow-hidden flex flex-col justify-between h-[120px] text-start bg-card/40">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-muted/20 border border-muted/30 rounded-lg">
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-4 w-12 rounded" />
      </div>
      <div className="space-y-2 mt-3">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </Card>
  );
});
MetricCardSkeleton.displayName = "MetricCardSkeleton";

export const PostCardSkeleton = memo(() => {
  return (
    <Card className="ui-post-card group h-full text-start flex flex-col border border-border bg-card/40">
      <div className="ui-post-thumbnail relative aspect-video bg-muted/20">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded bg-background/50" />
          <Skeleton className="h-4 w-16 rounded bg-background/50" />
        </div>
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-4 w-10 rounded bg-primary/30" />
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

        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/50">
          <Skeleton className="h-3 w-3 rounded-full shrink-0" />
          <Skeleton className="h-3 w-[70%] rounded" />
        </div>

        <div className="ui-post-metric-row mt-auto border-t border-border/40 pt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1 text-center">
              <Skeleton className="h-3.5 w-10 mx-auto rounded" />
              <Skeleton className="h-2.5 w-8 mx-auto rounded" />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
          <Skeleton className="h-3 w-3 rounded-full shrink-0 bg-primary/20" />
          <Skeleton className="h-3 w-5/6 rounded bg-primary/10" />
        </div>
      </CardContent>

      <div className="ui-post-action-row p-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </Card>
  );
});
PostCardSkeleton.displayName = "PostCardSkeleton";

export const PlanTaskCardSkeleton = memo(() => {
  return (
    <Card className="rounded-lg border border-border bg-card/40 shadow-soft overflow-hidden flex flex-col justify-between">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4.5 w-16 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-3.5 w-12 rounded" />
            <Skeleton className="h-3.5 w-14 rounded" />
          </div>
        </div>
      </div>
      <div className="p-4 bg-muted/10 border-t border-border">
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </Card>
  );
});
PlanTaskCardSkeleton.displayName = "PlanTaskCardSkeleton";

export const SidebarProgressSkeleton = memo(() => {
  return (
    <div className="ui-sidebar-panel border border-border p-4 rounded-lg space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex items-end justify-between">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-4.5 w-20 rounded" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>
    </div>
  );
});
SidebarProgressSkeleton.displayName = "SidebarProgressSkeleton";

export const SidebarPipelineSkeleton = memo(() => {
  return (
    <div className="ui-sidebar-panel border border-border p-4 rounded-lg space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/10">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});
SidebarPipelineSkeleton.displayName = "SidebarPipelineSkeleton";

export const HomeFeedSkeleton = memo(() => {
  return (
    <div className="ui-dashboard-page space-y-6 animate-pulse text-start">
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-4 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-md" />
          <Skeleton className="h-4.5 w-[320px] rounded" />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Skeleton className="w-[120px] h-9 rounded" />
          <Skeleton className="w-[120px] h-9 rounded" />
        </div>
      </div>

      <div className="ui-dashboard-grid">
        {/* --- Main Feed Column --- */}
        <div className="ui-dashboard-main space-y-6">
          {/* Section 1: Today's Focus */}
          <FocusCardSkeleton />

          {/* Section 2: Summary Metrics Strip */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>

          {/* Section 3: Feed Tabs Content */}
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/40">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-md shrink-0" />
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3.5 w-44 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              </div>

              <div className="ui-feed-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Sidebar Column --- */}
        <div className="ui-dashboard-sidebar space-y-6">
          <SidebarPipelineSkeleton />
          
          <SidebarProgressSkeleton />

          {/* Viral Opportunities Skeleton */}
          <div className="ui-sidebar-panel border border-border p-4 rounded-lg space-y-3 bg-primary/5">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          </div>

          {/* Suggested Creators Skeleton */}
          <div className="ui-sidebar-panel border border-border p-4 rounded-lg space-y-4">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="space-y-4 pt-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-16 rounded" />
                      <Skeleton className="h-2.5 w-12 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
HomeFeedSkeleton.displayName = "HomeFeedSkeleton";
