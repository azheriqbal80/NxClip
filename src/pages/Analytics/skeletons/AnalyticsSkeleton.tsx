import { memo } from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

// --- Base Reusable Widgets ---

export const MetricCardSkeleton = memo(() => {
  return (
    <Card className="ui-metric-card border border-border/50 bg-card/40 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="space-y-2 mt-3">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-7 w-24 rounded font-black" />
      </div>
    </Card>
  );
});
MetricCardSkeleton.displayName = "MetricCardSkeleton";

export const ChartSkeleton = memo(() => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 min-h-[300px]">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
      <div className="flex-1 flex items-end gap-3 mt-8 pb-2 border-b border-white/5 h-[200px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-sm bg-primary/10" 
            style={{ height: `${[45, 62, 30, 85, 40, 55, 70, 48, 60, 32, 58, 80][i % 12]}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-10 rounded" />
        ))}
      </div>
    </div>
  );
});
ChartSkeleton.displayName = "ChartSkeleton";

export const TableRowSkeleton = memo(() => {
  return (
    <TableRow className="ui-table-row border-border/30">
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-10 rounded shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-3 w-20 rounded" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4.5 w-14 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3.5 w-10 ml-auto rounded" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-3.5 w-12 ml-auto rounded" />
      </TableCell>
      <TableCell className="text-right hidden sm:table-cell">
        <Skeleton className="h-3.5 w-10 ml-auto rounded" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-5 w-8 ml-auto rounded-full bg-primary/5 border border-primary/10" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded-md" />
      </TableCell>
    </TableRow>
  );
});
TableRowSkeleton.displayName = "TableRowSkeleton";

export const PlatformCardSkeleton = memo(() => {
  return (
    <Card className="rounded-lg border border-border/50 bg-card/40 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-6 w-32 rounded font-black" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-12 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-12 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16 rounded font-bold" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16 rounded font-bold" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </Card>
  );
});
PlatformCardSkeleton.displayName = "PlatformCardSkeleton";

export const PieChartSkeleton = memo(() => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center p-4 gap-8 min-h-[220px]">
      <div className="relative flex items-center justify-center">
        <Skeleton className="h-40 w-40 rounded-full bg-muted/20 border-[20px] border-muted/25" />
        <div className="absolute flex flex-col items-center">
          <Skeleton className="h-3 w-10 mt-1 rounded" />
        </div>
      </div>
      <div className="space-y-3 shrink-0 w-full sm:w-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-8 ml-auto font-mono rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});
PieChartSkeleton.displayName = "PieChartSkeleton";

export const HeatmapSkeleton = memo(() => {
  return (
    <div className="space-y-4">
      <div className="flex mb-1">
        <div className="w-12" />
        <div className="flex-1 flex justify-between px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-8 rounded" />
          ))}
        </div>
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-12 h-3.5 rounded" />
          <div className="flex-1 grid grid-cols-24 gap-0.5 h-6">
            {Array.from({ length: 24 }).map((_, j) => (
              <Skeleton 
                key={j} 
                className="h-full w-full rounded-sm" 
                style={{ opacity: [0.12, 0.45, 0.23, 0.8, 0.5, 0.15, 0.65, 0.3][(i + j) % 8] }} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
HeatmapSkeleton.displayName = "HeatmapSkeleton";


// --- Tab-Specific Premium Page Skeletons ---

export const AnalyticsOverviewSkeleton = memo(() => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 6 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Area Chart Layout + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border border-border/50 bg-card/40 hover:border-primary/20 transition-all">
          <div className="p-6">
            <ChartSkeleton />
          </div>
        </Card>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Banner Card */}
          <Card className="rounded-lg border border-primary/20 bg-primary/5 shadow-soft shadow-primary/5 p-6 space-y-4">
            <Skeleton className="h-4.5 w-28 rounded-md bg-primary/10" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded bg-primary/5" />
              <Skeleton className="h-3 w-5/6 rounded bg-primary/5" />
              <Skeleton className="h-3 w-4/5 rounded bg-primary/5" />
            </div>
            <Skeleton className="h-9 w-full rounded-md bg-primary/10" />
          </Card>

          {/* Top 3 List Card */}
          <Card className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-4">
            <Skeleton className="h-4.5 w-32 rounded-md" />
            <div className="space-y-4 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-10 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-2.5 w-16 rounded" />
                      <Skeleton className="h-4 w-12 rounded bg-muted/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});
AnalyticsOverviewSkeleton.displayName = "AnalyticsOverviewSkeleton";

export const AnalyticsContentSkeleton = memo(() => {
  return (
    <div className="ui-table-container overflow-x-auto no-scrollbar animate-pulse">
      <Table className="ui-table-shell min-w-[700px] lg:min-w-0">
        <TableHeader className="ui-table-header">
          <TableRow className="ui-table-row border-border/50">
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="text-end"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-end"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-end hidden sm:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-end"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
AnalyticsContentSkeleton.displayName = "AnalyticsContentSkeleton";

export const AnalyticsCreativeSkeleton = memo(() => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      {/* Pie Chart Card */}
      <Card className="lg:col-span-8 border border-border/50 bg-card/40 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <PieChartSkeleton />
        </div>
      </Card>

      {/* Sidebar Insights */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="rounded-lg border border-border/50 bg-card/40 p-5 space-y-4">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 bg-muted/10 border border-border/50 rounded-lg space-y-2.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-2.5 w-full rounded" />
                  <Skeleton className="h-2.5 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});
AnalyticsCreativeSkeleton.displayName = "AnalyticsCreativeSkeleton";

export const AnalyticsPlatformsSkeleton = memo(() => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <PlatformCardSkeleton key={i} />
        ))}
      </div>
      <Card className="p-6 border border-border/50 bg-card/40">
        <ChartSkeleton />
      </Card>
    </div>
  );
});
AnalyticsPlatformsSkeleton.displayName = "AnalyticsPlatformsSkeleton";

export const AnalyticsGeoIntelSkeleton = memo(() => {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      {/* 6 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Composable Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 overflow-hidden bg-card/40 border-border/50 h-[500px] flex items-center justify-center p-6 relative">
          <div className="text-center space-y-4 w-full">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-1.5 text-left">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-4.5 w-48 rounded" />
              </div>
              <Skeleton className="h-7 w-48 rounded-md bg-muted/20" />
            </div>
            {/* Outline map shape representation */}
            <div className="flex items-center justify-center relative h-[360px]">
              <Skeleton className="h-[300px] w-5/6 rounded-full bg-muted/10 border-[8px] border-muted/15 max-w-[500px]" />
              <div className="absolute inset-0 flex items-center justify-center bg-card/10 backdrop-blur-sm z-10 rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <Skeleton className="h-3 w-32 rounded bg-primary/10" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/40 border border-border/50 p-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-primary/25 rounded" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-2.5 w-48 rounded" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 bg-muted/10 border border-border/40 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-16 rounded bg-primary/10" />
                      <Skeleton className="h-3 w-10 rounded font-mono" />
                    </div>
                    <Skeleton className="h-3 w-5/6 rounded" />
                    <div className="flex justify-between items-center pt-1 border-t border-white/5">
                      <Skeleton className="h-2.5 w-14 rounded" />
                      <Skeleton className="h-4 w-12 rounded bg-muted/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Grid Footers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border border-border/50 bg-card/40 p-4 space-y-4">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="space-y-4 pt-2">
              {Array.from({ length: i === 0 ? 5 : i === 1 ? 4 : 3 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="space-y-1.5 flex-1 max-w-[70%]">
                    <Skeleton className="h-3.5 w-[85%] rounded" />
                    <Skeleton className="h-2.5 w-[50%] rounded" />
                  </div>
                  <Skeleton className="h-4 w-14 rounded bg-muted/10" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
AnalyticsGeoIntelSkeleton.displayName = "AnalyticsGeoIntelSkeleton";

export const AnalyticsGamesSkeleton = memo(() => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizontal Bar Chart Card */}
        <Card className="lg:col-span-8 border border-border/50 bg-card/40 p-6 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1.5">
              <Skeleton className="h-4.5 w-40 rounded" />
              <Skeleton className="h-3.5 w-56 rounded" />
            </div>
            <Skeleton className="h-5 w-16 rounded bg-primary/10" />
          </div>
          <div className="space-y-5 h-[320px] flex flex-col justify-around">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3 w-16 rounded shrink-0" />
                <Skeleton 
                  className="h-6 rounded bg-primary/15 shrink-0" 
                  style={{ width: `${[85, 70, 55, 35, 12][i]}%` }} 
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Performance Status Widget Skeletons */}
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="rounded-lg border border-border/50 p-4 space-y-4 bg-muted/5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4.5 w-24 rounded bg-primary/10" />
                  <Skeleton className="h-4 w-4 bg-primary/10 rounded" />
                </div>
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-[22px] w-36 rounded" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-3 w-[40%] rounded" />
                    <Skeleton className="h-3 w-[30%] rounded font-brand-secondary" />
                  </div>
                </div>
                <div className="pt-3 border-t border-border/30">
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              </Card>
            ))}
          </div>

          {/* Core Pivot Card Skeleton */}
          <Card className="rounded-lg border border-primary/20 bg-primary/10 p-6 space-y-4 shadow-lg shadow-primary/10">
            <Skeleton className="h-4 w-32 rounded-md bg-white/10" />
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="size-10 rounded-xl bg-white/15" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-24 rounded font-bold bg-white/15" />
                <Skeleton className="h-3 w-32 rounded bg-white/10" />
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-full rounded bg-white/10" />
              <Skeleton className="h-3.5 w-5/6 rounded bg-white/10" />
            </div>
            <Skeleton className="h-9 w-full rounded-md bg-white/20" />
          </Card>
        </div>
      </div>

      {/* Bottom Table Card */}
      <div className="ui-table-container overflow-x-auto no-scrollbar">
        <Table className="ui-table-shell min-w-[500px]">
          <TableHeader className="ui-table-header">
            <TableRow className="ui-table-row border-border/50">
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="text-end"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
              <TableHead className="text-end hidden sm:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></TableHead>
              <TableHead className="text-end"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
              <TableHead className="text-end"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i} className="ui-table-row border-border/30">
                <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-3.5 w-12 ml-auto rounded font-mono" /></TableCell>
                <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-3.5 w-10 ml-auto rounded font-mono" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4.5 w-14 ml-auto rounded-full bg-primary/5" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
AnalyticsGamesSkeleton.displayName = "AnalyticsGamesSkeleton";

export const AnalyticsAudienceSkeleton = memo(() => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demographics columns */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          {/* Gender stats skeleton */}
          <Card className="rounded-lg border border-border/50 bg-card/40 p-6 min-h-[300px]">
            <div className="space-y-4">
              <Skeleton className="h-4 w-28 rounded" />
              <PieChartSkeleton />
            </div>
          </Card>
          {/* Age range stats skeleton */}
          <Card className="rounded-lg border border-border/50 bg-card/40 p-5">
            <div className="space-y-4">
              <Skeleton className="h-4 w-20 rounded" />
              <div className="h-[200px]">
                <ChartSkeleton />
              </div>
            </div>
          </Card>
        </div>

        {/* Heatmap column */}
        <Card className="lg:col-span-12 xl:col-span-7 border border-border/50 bg-card/40 p-6 h-full">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1.5 text-left">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full bg-muted/10 border border-muted/15" />
            </div>
            <HeatmapSkeleton />
            <div className="flex justify-end gap-4 mt-6">
              <Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" />
            </div>
          </div>
        </Card>
      </div>

      {/* 4 Bottom Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="size-8 rounded-lg bg-primary/10" />
              <Skeleton className="h-3.5 w-12 rounded bg-muted/10 border border-muted/15" />
            </div>
            <div className="space-y-1.5 mt-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-24 rounded font-black text-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
AnalyticsAudienceSkeleton.displayName = "AnalyticsAudienceSkeleton";

export const AnalyticsRetentionSkeleton = memo(() => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Retention Curve Card */}
      <Card className="rounded-lg border border-border/50 bg-card/40 p-6 min-h-[400px]">
        <div className="space-y-4 h-full">
          <div className="space-y-1.5 text-left">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-[350px] rounded" />
          </div>
          <ChartSkeleton />
        </div>
      </Card>

      {/* Bottom KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});
AnalyticsRetentionSkeleton.displayName = "AnalyticsRetentionSkeleton";

export const AnalyticsAiSkeleton = memo(() => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Mega Hero Card */}
      <Card className="rounded-lg border border-primary/20 bg-primary/5 p-8 relative overflow-hidden min-h-[200px] flex items-center">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 w-full">
          <div className="max-w-xl text-center md:text-left space-y-3 flex-1">
            <Skeleton className="h-4.5 w-24 rounded bg-primary/10" />
            <Skeleton className="h-7 w-64 rounded bg-white/10" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full rounded bg-white/5" />
              <Skeleton className="h-3 w-5/6 rounded bg-white/5" />
            </div>
          </div>
          <Skeleton className="h-12 w-48 rounded bg-primary/15 border border-primary/20" />
        </div>
      </Card>

      {/* 6 Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-4">
            <div className="flex justify-between items-center -mx-4 -mt-4 p-4 border-b border-border/40 bg-muted/5 rounded-t-lg">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-12 rounded bg-muted/20" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-[92%] rounded" />
            </div>
            <div className="pt-3 border-t border-border/30 flex justify-end">
              <Skeleton className="h-4.5 w-24 rounded bg-primary/5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
AnalyticsAiSkeleton.displayName = "AnalyticsAiSkeleton";
