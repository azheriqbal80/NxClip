import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Zap, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { AnalyticsAiSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface AiTabProps {
  isLoading: boolean;
}

export const AiTab = memo(({ isLoading }: AiTabProps) => {
  const { t } = useTranslation();

  let insightsListRaw = t('analytics.ai.insights_list', { returnObjects: true }) as any;
  if (!Array.isArray(insightsListRaw)) {
    insightsListRaw = [
      {
        title: "Optimal Hook Structure",
        tag: "Hook Index",
        text: "Using a text callout on screen in the first 1.5 seconds increased retention by 34% compared to vocal hooks alone."
      },
      {
        title: "Audio Accent Matching",
        tag: "Audio Index",
        text: "Clips that synced gameplay transition moments to peak beats of popular trending audio tracks had a 21% higher completion rate."
      },
      {
        title: "Optimal Tag Density",
        tag: "SEO Index",
        text: "Using exactly 4 hashtags (2 niche, 2 broad) matching viral algorithms maximized post reach across discover feeds."
      }
    ];
  }

  if (isLoading) {
    return <AnalyticsAiSkeleton />;
  }

  return (
    <div className="space-y-8 font-sans">
      <Card className="rounded-lg border border-primary/30 bg-primary/5 p-8 shadow-soft overflow-hidden relative backdrop-blur-sm min-h-[200px]">
        <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse">
          <Sparkles size={120} className="text-primary" />
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left space-y-3">
            <Badge className="bg-primary text-primary-foreground border-border/20 py-1 px-3 rounded-full font-bold tracking-widest text-[9px]">
              {t('analytics.ai.weekly_report')}
            </Badge>
            <h2 className="text-3xl font-display font-black tracking-tight text-foreground">
              {t('analytics.ai.growth_tactics')}
            </h2>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              {t('analytics.ai.viral_expansion')}. {t('analytics.ai.reach_higher', { percent: 42 })}. {t('analytics.ai.driven_by', { game: 'Warzone' })}.
            </p>
          </div>
          <Button size="lg" className="bg-primary text-primary-foreground font-display font-bold h-12 px-12 text-sm rounded-md shadow-xl shadow-primary/30 border border-primary/20 hover:scale-105 transition-transform shrink-0">
            {t('analytics.ai.analyze_next')} 
            <Zap size={16} className="ml-2 fill-primary-foreground" />
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(insightsListRaw as any[]).map((item: any, i: number) => (
          <Card key={i} className="rounded-lg border border-border bg-card shadow-soft hover:translate-y-[-4px] transition-all duration-200">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between cursor-default">
              <CardTitle className="text-sm font-bold text-foreground">{item.title}</CardTitle>
              <Badge variant="outline" className="text-[8px] h-4 tracking-tighter border-primary/20 text-primary">{item.tag}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground leading-relaxed italic">"{item.text}"</p>
              <div className="mt-4 pt-4 border-t border-border/20 flex justify-end">
                <Button variant="link" className="h-4 p-0 text-[10px] font-bold transition-colors hover:text-primary rounded-md">
                  {t('analytics.ai.learn_strategy')} 
                  <ChevronRight size={10} className="ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

AiTab.displayName = "AiTab";
