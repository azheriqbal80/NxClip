import { memo } from "react";
import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export const KPICardSkeleton = memo(() => {
  return (
    <Card className="ui-dashboard-kpi-card">
      <div className="flex justify-between items-start mb-3">
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
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="h-[300px] w-full flex flex-col justify-between">
        <div className="h-[250px] w-full flex items-end gap-3 pb-4 border-b border-border/40">
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

export const ContentTypeCardSkeleton = memo(() => {
  return (
    <Card className="ui-content-performance-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3.5 w-10" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-5 w-10" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-5 w-10" />
        </div>
      </div>
      <div className="p-3 rounded-md bg-muted/10 border border-border/50 mb-3 space-y-1.5">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </Card>
  );
});
ContentTypeCardSkeleton.displayName = "ContentTypeCardSkeleton";

export const TopContentCardSkeleton = memo(() => {
  return (
    <Card className="ui-top-content-card">
      <div className="aspect-video relative rounded-md overflow-hidden bg-muted mb-4">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="p-2.5 rounded bg-muted/10 border border-border/50 space-y-1.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="w-full h-8" />
      </div>
    </Card>
  );
});
TopContentCardSkeleton.displayName = "TopContentCardSkeleton";

export const AICommandSkeleton = memo(() => {
  return (
    <Card className="p-6 border-none bg-primary/10 backdrop-blur-sm shadow-xl shadow-primary/5 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded bg-primary/30" />
        <Skeleton className="h-10 w-full bg-primary/20" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 bg-primary/30" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full bg-primary/30 shrink-0" />
              <Skeleton className="h-3 w-4/5 bg-primary/20" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="w-full h-10 bg-primary/35" />
    </Card>
  );
});
AICommandSkeleton.displayName = "AICommandSkeleton";

export const SidebarWidgetSkeleton = memo(({ itemsCount = 3 }: { itemsCount?: number }) => {
  return (
    <div className="ui-sidebar-panel space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: itemsCount }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-border/50 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
            <Skeleton className="h-7 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});
SidebarWidgetSkeleton.displayName = "SidebarWidgetSkeleton";

export const DashboardSkeleton = memo(() => {
  return (
    <div className="ui-dashboard-page space-y-6 animate-pulse">
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="w-[80px] h-9 rounded" />
          <Skeleton className="w-[120px] h-9 rounded" />
          <Skeleton className="w-[110px] h-9 rounded" />
        </div>
      </div>

      {/* --- KPI Row --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <KPICardSkeleton key={idx} />
        ))}
      </div>

      {/* --- Main Grid --- */}
      <div className="ui-dashboard-grid">
        {/* Left Column (Chart + Lists) */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <ChartWidgetSkeleton />

          {/* Section: Content Matrix */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <ContentTypeCardSkeleton key={idx} />
              ))}
            </div>
          </div>

          {/* Section: Top Performing Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <TopContentCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <AICommandSkeleton />
          
          <div className="space-y-2">
            <SidebarWidgetSkeleton itemsCount={2} />
          </div>

          <div className="space-y-2">
            <SidebarWidgetSkeleton itemsCount={3} />
          </div>

          {/* Pulse Widget Skeleton */}
          <div className="ui-sidebar-panel bg-muted/5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded bg-muted" />
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amber Box Skeleton */}
          <Card className="p-5 border-none bg-amber-500/5 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded bg-amber-500/20" />
              <Skeleton className="h-4 w-24 bg-amber-500/20" />
            </div>
            <Skeleton className="h-12 w-full bg-amber-500/10" />
          </Card>
        </div>
      </div>
    </div>
  );
});
DashboardSkeleton.displayName = "DashboardSkeleton";
