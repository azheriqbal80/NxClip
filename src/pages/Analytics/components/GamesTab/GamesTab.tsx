import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, TrendingUp } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { CustomTooltip } from "../shared-components";
import { GAME_PERFORMANCE } from "../constants";
import { AnalyticsGamesSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface GamesTabProps {
  isLoading: boolean;
}

export const GamesTab = memo(({ isLoading }: GamesTabProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return <AnalyticsGamesSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 ui-chart-card border-border hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase">{t('analytics.games.leaderboard_title')}</CardTitle>
              <CardDescription className="text-sm font-display font-bold text-foreground">{t('analytics.games.leaderboard_desc')}</CardDescription>
            </div>
            <Badge variant="outline" className="text-[9px] h-5 rounded-full border-primary/20 text-primary font-bold tracking-wider">{t('analytics.games.live_data')}</Badge>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GAME_PERFORMANCE} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground)" }} width={110} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
                <Bar dataKey="views" name={t('analytics.table.views')} radius={[0, 4, 4, 0]} barSize={24}>
                  {GAME_PERFORMANCE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {GAME_PERFORMANCE.filter(g => g.status === "Top Performer" || g.status === "Low Engagement").map((g) => (
              <Card 
                key={g.name} 
                className={cn(
                  "rounded-lg border border-border shadow-soft overflow-hidden",
                  g.status === "Top Performer" ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      className={cn(
                        "text-[8px] h-4 font-bold border-none tracking-widest px-2",
                        g.status === "Top Performer" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {g.status === "Top Performer" ? t('analytics.games.top_performer') : 
                       g.status === "Low Engagement" ? t('analytics.games.low_engagement') : 
                       g.status === "Steady" ? t('analytics.games.steady') : 
                       t('analytics.games.high_growth')}
                    </Badge>
                    <TrendingUp size={12} className={g.status === "Top Performer" ? "text-primary" : "text-destructive"} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-display font-black tracking-tight">{g.name}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground">
                      <span>{t('analytics.table.views')}: {t('analytics.overview.views_label', { count: (g.views/1000).toFixed(1) })}</span>
                      <span className={g.engagement > 10 ? "text-brand-secondary" : "text-destructive"}>{g.engagement}{i18n.language === 'ar' ? '٪' : '%'} {t('analytics.overview.engagement_label' as any, { defaultValue: 'ENG' })}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/10">
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                      {g.status === "Top Performer" 
                        ? t('analytics.games.top_desc')
                        : t('analytics.games.low_desc')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-lg border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold opacity-95 uppercase">{t('analytics.games.pivot_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary-foreground/20 rounded-xl"><Sparkles size={24} /></div>
                <div>
                  <p className="text-xl font-bold leading-tight">Apex Legends</p>
                  <p className="text-[10px] font-bold opacity-95 decoration-primary-foreground/20 underline underline-offset-4">{t('analytics.games.roi')}</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {t('analytics.games.pivot_desc', { game: 'Apex' })}
              </p>
              <Button variant="secondary" className="w-full text-[10px] font-bold h-9 rounded-md bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                {t('analytics.games.strategy_btn')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="ui-table-container overflow-x-auto no-scrollbar">
        <Table className="ui-table-shell min-w-[500px]">
          <TableHeader className="ui-table-header">
            <TableRow className="ui-table-row">
              <TableHead className="uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.games.table.title')}</TableHead>
              <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.games.table.views')}</TableHead>
              <TableHead className="text-end hidden sm:table-cell uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.games.table.eng')}</TableHead>
              <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.games.table.status')}</TableHead>
              <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.games.table.trend')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GAME_PERFORMANCE.map((g) => (
              <TableRow key={g.name} className="ui-table-row border-border">
                <TableCell className="ui-table-cell font-bold whitespace-nowrap">{g.name}</TableCell>
                <TableCell className="ui-table-cell text-end font-mono">
                  {t('analytics.overview.views_label', { count: (g.views/1000).toFixed(1) })}
                </TableCell>
                <TableCell className="ui-table-cell text-end font-mono text-primary hidden sm:table-cell">{g.engagement}{i18n.language === 'ar' ? '٪' : '%'}</TableCell>
                <TableCell className="ui-table-cell text-end">
                  <Badge variant="outline" className={cn(
                    "text-[8px] h-4 tracking-tighter border-none whitespace-nowrap",
                    g.status === "Top Performer" ? "bg-primary/10 text-primary" : 
                    g.status === "Low Engagement" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {g.status === "Top Performer" ? t('analytics.games.top_performer') : 
                     g.status === "Low Engagement" ? t('analytics.games.low_engagement') : 
                     g.status === "Steady" ? t('analytics.games.steady') : 
                     t('analytics.games.high_growth')}
                  </Badge>
                </TableCell>
                <TableCell className="ui-table-cell text-end">
                  <div className="inline-flex items-center gap-1 ui-text-caption font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <TrendingUp size={10} /> +12{i18n.language === 'ar' ? '٪' : '%'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

GamesTab.displayName = "GamesTab";
