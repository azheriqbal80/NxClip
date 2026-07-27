import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Play, Activity, Clock } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { MetricCard, CustomTooltip } from "../shared-components";
import { AnalyticsRetentionSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface RetentionTabProps {
  isLoading: boolean;
}

export const RetentionTab = memo(({ isLoading }: RetentionTabProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return <AnalyticsRetentionSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <Card className="rounded-lg border border-border bg-card shadow-soft overflow-hidden transition-all duration-200 min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase">{t('analytics.retention.title')}</CardTitle>
          <CardDescription className="text-sm font-display font-medium">{t('analytics.retention.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={[
                { time: '0s', val: 100 },
                { time: '3s', val: 82 },
                { time: '5s', val: 72 },
                { time: '10s', val: 56 },
                { time: '15s', val: 42 },
                { time: '20s', val: 38 },
                { time: '30s', val: 24 },
              ]}
            >
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit="%" />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="val" stroke="var(--destructive)" strokeWidth={3} fill="url(#retGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title={t('analytics.metrics.first_3s_hook')} value={`82${i18n.language === 'ar' ? '٪' : '%'}`} trend={4.2} icon={Play} />
        <MetricCard title={t('analytics.metrics.rewatch_rate')} value={`14.2${i18n.language === 'ar' ? '٪' : '%'}`} trend={-1.5} icon={Activity} />
        <MetricCard title={t('analytics.metrics.avg_view')} value={`48.2${i18n.language === 'ar' ? '٪' : '%'}`} trend={12.0} icon={Clock} />
      </div>
    </div>
  );
});

RetentionTab.displayName = "RetentionTab";
