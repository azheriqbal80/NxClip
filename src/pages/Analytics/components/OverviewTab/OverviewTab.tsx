import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Heart, Clock, TrendingUp, Share2, Zap, BrainCircuit, Flame } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { MetricCard, CustomTooltip } from "../shared-components";
import { CONTENT_DATA, generateDailyTrend } from "../constants";
import { AnalyticsOverviewSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface OverviewTabProps {
  isLoading: boolean;
}

export const OverviewTab = memo(({ isLoading }: OverviewTabProps) => {
  const { t } = useTranslation();
  const trends = useMemo(() => generateDailyTrend(7), []);

  if (isLoading) {
    return <AnalyticsOverviewSkeleton />;
  }

  return (
    <>
      <div className="ui-stat-grid">
        <MetricCard title={t('analytics.metrics.views')} value={t('analytics.overview.values.views')} trend={14.2} icon={Eye} />
        <MetricCard title={t('analytics.metrics.engagement')} value={t('analytics.overview.values.engagement')} trend={3.5} icon={Heart} />
        <MetricCard title={t('analytics.metrics.watch_time')} value={t('analytics.overview.values.watch_time')} trend={-2.1} icon={Clock} />
        <MetricCard title={t('analytics.metrics.followers')} value={t('analytics.overview.values.followers')} trend={24.8} icon={TrendingUp} />
        <MetricCard title={t('analytics.metrics.shares')} value={t('analytics.overview.values.shares')} trend={45.1} icon={Share2} />
        <MetricCard title={t('analytics.metrics.virality')} value={t('analytics.overview.values.virality')} trend={12.0} icon={Zap} description={t('analytics.metrics.virality_desc')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        <Card className="lg:col-span-8 ui-chart-card border-border hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase">{t('analytics.charts.performance_pulse')}</CardTitle>
              <CardDescription className="text-sm font-display font-bold text-foreground">{t('analytics.charts.performance_desc')}</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[9px] font-bold tracking-wider">{t('analytics.charts.views')}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tertiary" /><span className="text-[9px] font-bold tracking-wider">{t('analytics.charts.engagement')}</span></div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="views" name={t('analytics.charts.views')} stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#viewArea)" />
                <Area type="monotone" dataKey="engagement" name={t('analytics.charts.engagement')} stroke="var(--tertiary)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-lg border border-primary/30 bg-primary/5 shadow-soft shadow-primary/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <div className="ui-icon-chip-primary w-6 h-6 border-primary/20"><BrainCircuit size={14} /></div>
                <CardTitle className="text-[10px] tracking-widest font-bold leading-none uppercase">{t('analytics.ai.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-card/60 border border-primary/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Flame size={12} className="text-orange-500 rtl:ml-2 rtl:mr-0" />
                  <span className="text-[11px] font-display font-bold text-foreground">{t('analytics.ai.opportunity')}</span>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                  {t('analytics.ai.opportunity_desc')}
                </p>
              </div>
              <Button variant="brand" className="w-full text-primary-foreground font-display font-bold h-9 text-[11px] rounded-md shadow-lg shadow-primary/20 border border-primary/20">
                {t('analytics.ai.cta')}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border bg-card shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase">{t('analytics.overview.top_5_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONTENT_DATA.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-3 group cursor-pointer p-1 rounded-md hover:bg-muted/30 transition-colors">
                  <img src={item.thumbnail} className="w-10 h-12 object-cover rounded border border-border group-hover:scale-105 transition-transform" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold truncate group-hover:text-primary transition-colors tracking-tight rtl:text-right">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-muted-foreground font-mono font-bold uppercase">{t('analytics.overview.views_label', { count: (item.views/1000).toFixed(1) })}</span>
                      <Badge className="h-4 text-[7px] px-1 font-bold border-border/50">{item.platform}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
});

OverviewTab.displayName = "OverviewTab";
