import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Bookmark } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { CustomTooltip } from "../shared-components";
import { AnalyticsCreativeSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface CreativeTabProps {
  isLoading: boolean;
}

export const CreativeTab = memo(({ isLoading }: CreativeTabProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <AnalyticsCreativeSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      <Card className="lg:col-span-8 ui-chart-card">
        <CardHeader>
          <CardTitle className="text-xs font-bold font-display tracking-widest uppercase text-muted-foreground">{t('analytics.charts.meme_virality')}</CardTitle>
          <CardDescription>{t('analytics.charts.meme_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Saves', value: 450 },
                    { name: 'Shares', value: 1200 },
                    { name: 'Likes', value: 3100 },
                  ]} 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  <Cell fill="var(--primary)" />
                  <Cell fill="var(--secondary-foreground)" />
                  <Cell fill="var(--tertiary)" />
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>{t('analytics.creative.caption_perf')}</span>
                <span>{t('common.high')}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[82%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>{t('analytics.creative.save_density')}</span>
                <span>{t('common.medium')}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[45%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>{t('analytics.creative.share_multiplier')}</span>
                <span>{t('common.critical')}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-secondary-foreground h-full w-[92%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="lg:col-span-4 space-y-6">
        <Card className="rounded-lg border border-border bg-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{t('analytics.creative.insights')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/20 border border-border rounded-lg group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <ImageIcon size={14} className="text-primary rtl:ml-2 rtl:mr-0" />
                <p className="text-[11px] font-bold">{t('analytics.creative.format')}</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">{t('analytics.creative.format_desc')}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-lg group hover:border-tertiary/20 transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <Bookmark size={14} className="text-tertiary rtl:ml-2 rtl:mr-0" />
                <p className="text-[11px] font-bold">{t('analytics.creative.caption')}</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">{t('analytics.creative.caption_desc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

CreativeTab.displayName = "CreativeTab";
