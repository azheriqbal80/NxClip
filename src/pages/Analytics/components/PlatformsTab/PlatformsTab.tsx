import { memo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { PLATFORM_STATS } from "../constants";
import { CustomTooltip } from "../shared-components";
import { AnalyticsPlatformsSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface PlatformsTabProps {
  isLoading: boolean;
  platformFilter: string;
}

export const PlatformsTab = memo(({ isLoading, platformFilter }: PlatformsTabProps) => {
  const { t, i18n } = useTranslation();

  const filteredStats = PLATFORM_STATS.filter((p) => {
    if (platformFilter === "all") return true;
    return p.id === platformFilter;
  });

  if (isLoading) {
    return <AnalyticsPlatformsSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredStats.map((p) => (
          <Card key={p.id} className="rounded-lg border border-border bg-card shadow-soft group hover:bg-muted/10 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div 
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:border-primary/20 transition-all shadow-sm" 
                  style={{ color: p.color }}
                >
                  <p.icon size={20} />
                </div>
                <Badge className="h-5 text-[9px] font-bold font-mono border-brand-secondary/20 text-brand-secondary bg-brand-secondary/10" variant="outline">{p.growth}</Badge>
              </div>
              <CardTitle className="text-base font-display font-black mt-4 tracking-tight">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t('analytics.platforms.views')}</p>
                  <p className="text-xl font-display font-black">{t('analytics.overview.views_label', { count: (p.views / 1000).toFixed(0) })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t('analytics.platforms.eng_rate')}</p>
                  <p className="text-xl font-display font-black">{p.engagement}{i18n.language === 'ar' ? '٪' : '%'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t('analytics.platforms.followers')}</p>
                  <p className="text-xl font-display font-black text-primary">
                    {t('analytics.overview.followers_label', { count: (p.followers / 1000).toFixed(1) }).replace(t('analytics.metrics.followers'), '').trim()}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t('analytics.platforms.shares')}</p>
                  <p className="text-xl font-display font-black">
                    {t('analytics.overview.shares_label', { count: (p.shares / 1000).toFixed(1) }).replace(t('analytics.metrics.shares'), '').trim()}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold w-full rounded-md tracking-widest hover:bg-primary/5 transition-colors">
                  {t('analytics.platforms.deep_dive')} 
                  <ArrowUpRight size={10} className="ml-1 rtl:mr-1 rtl:ml-0 rtl:rotate-[-90deg]" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="ui-chart-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{t('analytics.charts.inter_platform')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={[
                { name: 'TikTok', views: 128400, eng: 45000 },
                { name: 'YouTube', views: 342100, eng: 120000 },
                { name: 'Instagram', views: 89200, eng: 67000 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="views" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="eng" fill="var(--tertiary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

PlatformsTab.displayName = "PlatformsTab";
