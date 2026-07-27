import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Users, Sparkles, TrendingUp, Clock, Target } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { cn } from "../../../../lib/utils";
import { CustomTooltip } from "../shared-components";
import { AUDIENCE_STATS, DAY_KEYS } from "../constants";
import { AnalyticsAudienceSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface AudienceTabProps {
  isLoading: boolean;
}

export const AudienceTab = memo(({ isLoading }: AudienceTabProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return <AnalyticsAudienceSkeleton />;
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demographics */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <Card className="rounded-lg border border-border bg-card shadow-soft overflow-hidden min-h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground flex items-center gap-2 uppercase">
                <Users size={12} className="text-primary" />
                {t('analytics.audience.gender')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={AUDIENCE_STATS.gender.map(g => ({ ...g, name: t(`analytics.audience.gender_types.${g.name.toLowerCase()}`) }))} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={8} 
                    dataKey="value"
                    stroke="none"
                  >
                    {AUDIENCE_STATS.gender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 ml-4 rtl:ml-0 rtl:mr-4">
                {AUDIENCE_STATS.gender.map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-[10px] font-bold text-muted-foreground">{t(`analytics.audience.gender_types.${g.name.toLowerCase()}`)}</span>
                    <span className="text-xs font-mono font-bold">{g.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border bg-card shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">{t('analytics.audience.age')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AUDIENCE_STATS.age.map(a => ({ ...a, range: t(`analytics.audience.age_ranges.${a.range.replace('-', '_').replace('+', '_plus')}`) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis hide />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="val" name={t('analytics.audience.age')} fill="var(--tertiary)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Active Hours Heatmap */}
        <Card className="lg:col-span-12 xl:col-span-7 ui-chart-card border-border hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase leading-none">{t('analytics.audience.active_hours')}</CardTitle>
              <CardDescription className="text-sm font-display font-bold text-foreground leading-none">{t('analytics.charts.active_desc')}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 rounded-full h-5 px-3 font-bold tracking-widest text-[8px]">{t('analytics.platforms.syncing')}</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
              <div className="flex flex-col gap-1 min-w-[600px] md:min-w-0">
                <div className="flex mb-1">
                  <div className="w-12" />
                  <div className="flex-1 flex justify-between px-2">
                    {[0, 4, 8, 12, 16, 20].map(h => <span key={h} className="text-[8px] font-bold text-muted-foreground">{h}:00</span>)}
                  </div>
                </div>
                {DAY_KEYS.map((dayKey, dIdx) => (
                  <div key={dayKey} className="flex items-center gap-2">
                    <span className="w-12 text-[9px] font-bold text-muted-foreground uppercase">{t(`analytics.audience.days.${dayKey}`)}</span>
                    <div className="flex-1 grid grid-cols-24 gap-0.5 h-6">
                      {Array.from({ length: 24 }).map((_, hIdx) => {
                        const val = AUDIENCE_STATS.activeHours.find(h => h.day === dIdx && h.hour === hIdx)?.value || 0;
                        return (
                          <div 
                            key={hIdx} 
                            className="rounded-sm transition-transform hover:scale-110 cursor-help"
                            style={{ 
                              backgroundColor: `rgba(var(--primary-rgb), ${val / 100})`,
                              opacity: Math.max(0.1, val / 100)
                            }}
                            title={t('analytics.audience.heatmap.tooltip', { 
                              day: t(`analytics.audience.days.${dayKey}`),
                              hour: hIdx,
                              value: val
                            })}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 md:gap-4 mt-6">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-primary/10" /><span className="text-[8px] font-bold text-muted-foreground uppercase">{t('analytics.audience.heatmap.idle')}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-primary/40" /><span className="text-[8px] font-bold text-muted-foreground uppercase">{t('analytics.audience.heatmap.active')}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-primary" /><span className="text-[8px] font-bold text-muted-foreground uppercase">{t('analytics.audience.heatmap.peak')}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { key: 'ltv', label: t('analytics.audience.metrics.ltv'), val: '$4.20', trend: `+12${i18n.language === 'ar' ? '٪' : '%'}`, icon: Target },
          { key: 'sentiment', label: t('analytics.audience.metrics.sentiment'), val: `92${i18n.language === 'ar' ? '٪ ' : '% '}${t('analytics.audience.metrics.positive')}`, trend: `+2${i18n.language === 'ar' ? '٪' : '%'}`, icon: Sparkles },
          { key: 'conversion', label: t('analytics.audience.metrics.conversion'), val: `3.8${i18n.language === 'ar' ? '٪' : '%'}`, trend: `+0.5${i18n.language === 'ar' ? '٪' : '%'}`, icon: TrendingUp },
          { key: 'session', label: t('analytics.audience.metrics.session'), val: `24${i18n.language === 'ar' ? ' د' : 'm'}`, trend: `-2${i18n.language === 'ar' ? '٪' : '%'}`, icon: Clock },
        ].map((m) => (
          <Card key={m.key} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all duration-300 shadow-soft">
            <div className="flex justify-between items-start">
              <div className="ui-icon-chip-primary size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/5"><m.icon size={16} /></div>
              <span className={cn(
                "text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full border", 
                m.trend.startsWith('+') ? "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20" : "text-destructive bg-destructive/10 border-destructive/20"
              )}>{m.trend}</span>
            </div>
            <div className="mt-4">
              <p className="text-[9px] font-bold text-muted-foreground tracking-widest leading-none mb-1.5 uppercase">{m.label}</p>
              <p className="text-xl font-display font-black text-foreground">{m.val}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});

AudienceTab.displayName = "AudienceTab";
