import { memo, useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion } from "motion/react";
import { 
  Users, Target, Clock, TrendingUp, Globe, Zap, 
  Activity, Gamepad2, BarChart3, ChevronRight, Flame, BrainCircuit,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { MetricCard } from "../shared-components";
import { GEO_INTEL_DATA, GEO_INTEL_STRATEGY, REGION_TOTALS } from "../constants";
import { AnalyticsGeoIntelSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface GeoIntelTabProps {
  isLoading: boolean;
}

const LAYER_COLORS: Record<string, string> = {
  views: "#7c3aed",
  avgPercent: "#10b981",
  watchTime: "#ec4899",
};

export const GeoIntelTab = memo(({ isLoading }: GeoIntelTabProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [mapLayer, setMapLayer] = useState<"views" | "avgPercent" | "watchTime">("views");
  const [geoRegionFilter, setGeoRegionFilter] = useState("all");

  const layers = useMemo(() => ({
    views: { label: t('geo.layer_names.views'), unit: "views" },
    avgPercent: { label: t('geo.layer_names.avgPercent'), unit: "%" },
    watchTime: { label: t('geo.layer_names.watchTime'), unit: "min" },
  }), [t]);

  const filteredGeoData = useMemo(() => {
    if (geoRegionFilter === "all") return GEO_INTEL_DATA;
    return GEO_INTEL_DATA.filter((item) => item.id === geoRegionFilter);
  }, [geoRegionFilter]);

  const chartData = useMemo(() =>
    filteredGeoData.map((r) => ({
      name: r.country.length > 8 ? r.country.slice(0, 8) + "…" : r.country,
      value: r[mapLayer],
      id: r.id,
    })),
  [filteredGeoData, mapLayer]);

  const geoTotals = useMemo(() => {
    if (geoRegionFilter === "all") return REGION_TOTALS;
    const region = GEO_INTEL_DATA.find((r) => r.id === geoRegionFilter);
    if (!region) return REGION_TOTALS;
    return {
      ...REGION_TOTALS,
      views: region.views,
      avgDuration: region.avgDuration,
      avgPercent: region.avgPercent,
      watchTime: region.watchTime,
      bestRegion: region.country,
      growthMomentum: `+${region.growth}%`,
    };
  }, [geoRegionFilter]);

  if (isLoading) {
    return <AnalyticsGeoIntelSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title={t('geo.metric_reach')} value={geoRegionFilter === "all" ? REGION_TOTALS.reach : `${(geoTotals.views / 100).toFixed(1)}k`} trend={12.4} icon={Users} />
        <MetricCard title={t('geo.metric_best')} value={geoTotals.bestRegion} trend={8.2} icon={Target} />
        <MetricCard title={t('geo.metric_retention')} value={`${geoTotals.avgPercent}${i18n.language === 'ar' ? '٪' : '%'}`} trend={2.1} icon={Clock} />
        <MetricCard title={t('geo.metric_momentum')} value={geoTotals.growthMomentum} trend={15.5} icon={TrendingUp} />
        <MetricCard title={t('geo.metric_platform')} value={geoRegionFilter === "all" ? REGION_TOTALS.topPlatform : (GEO_INTEL_DATA.find((r) => r.id === geoRegionFilter)?.bestPlatform || "N/A")} trend={4.8} icon={Globe} />
        <MetricCard title={t('geo.metric_viral')} value={geoRegionFilter === "all" ? "88/100" : `${GEO_INTEL_DATA.find((r) => r.id === geoRegionFilter)?.viralityScore || 0}/100`} trend={6.2} icon={Zap} />
      </div>

      {/* Hero Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 overflow-hidden bg-card border-border shadow-soft group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-[10px] tracking-widest font-bold text-muted-foreground uppercase">{t('geo.map_title')}</CardTitle>
              <CardDescription className="text-sm font-display font-bold text-foreground">{t('geo.map_subtitle', { layer: layers[mapLayer].label })}</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border">
              <Select value={geoRegionFilter} onValueChange={setGeoRegionFilter}>
                <SelectTrigger className="w-[130px] h-8 text-[9px] font-black bg-card border-none hover:bg-muted/30">
                  <SelectValue placeholder={t('geo.select_region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('geo.all_regions')}</SelectItem>
                  {GEO_INTEL_DATA.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{t(`geo.regions.${r.id}` as any, { defaultValue: r.country })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Layer Toggle */}
            <div className="flex gap-2 mb-4">
              {(Object.keys(layers) as Array<"views" | "avgPercent" | "watchTime">).map((key) => (
                <Button
                  key={key}
                  variant={mapLayer === key ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-7 text-[8px] font-black tracking-wider px-2.5", mapLayer !== key && "text-muted-foreground")}
                  onClick={() => setMapLayer(key)}
                >
                  {layers[key].label}
                </Button>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontWeight: 700 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 700 }}
                    itemStyle={{ color: LAYER_COLORS[mapLayer] }}
                    formatter={(val: number) => [`${val.toLocaleString()} ${layers[mapLayer].unit}`, layers[mapLayer].label]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.id} fill={LAYER_COLORS[mapLayer]} opacity={geoRegionFilter === "all" || geoRegionFilter === entry.id ? 1 : 0.3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations Card */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <Card className="rounded-lg border border-primary/30 bg-primary/5 shadow-soft flex flex-col h-full backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Activity size={16} className="text-primary" />
                <CardTitle className="text-xs font-bold tracking-widest uppercase">{t('geo.opportunities')}</CardTitle>
              </div>
              <CardDescription className="text-[10px]">{t('geo.opportunities_desc' as any, { defaultValue: 'AI-powered audience expansion strategies.' })}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {GEO_INTEL_STRATEGY.map((strat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i18n.language === 'ar' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-muted/20 border border-border rounded-lg hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="text-[7px] h-3.5 px-1.5 font-black uppercase bg-primary/10 text-primary border-none">{t(`geo.strategy_types.${strat.type}` as any)}</Badge>
                    <span className="text-[9px] font-mono font-bold text-muted-foreground">{t('geo.matching', { count: strat.confidence })}</span>
                  </div>
                  <p className="text-[11px] font-medium text-foreground leading-relaxed mb-3">{t(`geo.insights.${strat.insightKey}` as any)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t(`geo.regions.${strat.regionId}` as any, { defaultValue: strat.regionId })}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold text-primary group-hover:bg-primary/10">
                      {t('geo.take_action')}
                      <ChevronRight size={10} className="ml-1 rtl:rotate-180" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Games by Region */}
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <Gamepad2 size={14} className="text-brand-secondary" />
              {t('geo.top_games')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {GEO_INTEL_DATA.slice(0, 5).map((region) => (
                <div key={region.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{t(`geo.regions.${region.id}` as any, { defaultValue: region.country })}</p>
                    <p className="text-sm font-display font-black">{region.topGame}</p>
                  </div>
                  <div className="text-end space-y-1 animate-pulse-slow">
                    <Badge variant="outline" className="text-[8px] h-4 border-brand-secondary/20 text-brand-secondary">{t('geo.high_retention')}</Badge>
                    <p className="text-[9px] font-mono font-bold text-muted-foreground">{t('geo.score', { count: region.viralityScore })}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Content Performance */}
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14} className="text-tertiary" />
              {t('geo.format_index')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {[
              { label: t('geo.formats.clutch'), engagement: 92, color: "var(--primary)" },
              { label: t('geo.formats.memes'), engagement: 85, color: "var(--tertiary)" },
              { label: t('geo.formats.ai_packs'), engagement: 68, color: "var(--brand-secondary)" },
              { label: t('geo.formats.highlights'), engagement: 82, color: "#f59e0b" },
            ].map((format) => (
              <div key={format.label} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-foreground uppercase tracking-tight">{format.label}</span>
                  <span className="text-muted-foreground font-mono">{format.engagement}{i18n.language === 'ar' ? '٪' : '%'} ENG</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${format.engagement}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: format.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Best Platform + Posting Time */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest">{t('geo.platform_strength')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { platform: "TikTok", region: t('geo.regions.SEA' as any, { defaultValue: "Southeast Asia" }), strength: "Dominant" },
                { platform: "Instagram", region: "India / LATAM", strength: "Peak Growth" },
                { platform: "YouTube", region: "North America", strength: "High LTV" },
              ].map((p) => (
                <div key={p.platform} className="p-3 bg-muted/20 border border-border rounded-lg flex items-center gap-3">
                  <div className="size-8 rounded bg-background flex items-center justify-center border border-border"><Globe size={14} className="text-primary" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-foreground">{t('geo.strongest_in', { platform: p.platform, region: p.region })}</p>
                    <p className="text-[9px] font-bold text-primary uppercase">{p.strength}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest">{t('geo.posting_intel')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{t('geo.peak_labels.us')}</span>
                <span className="font-mono font-bold text-foreground">8PM EST</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{t('geo.peak_labels.brazil')}</span>
                <span className="font-mono font-bold text-foreground">{t('geo.peak_labels.weekends')}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{t('geo.peak_labels.india')}</span>
                <span className="font-mono font-bold text-foreground">10PM IST</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Virality & Momentum List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <Flame size={14} className="text-orange-500" />
              {t('geo.virality_signals')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(t('geo.signals', { returnObjects: true }) as string[]).map((signal, i) => (
              <div key={i} className="flex gap-4 p-3 bg-muted/10 border border-border/50 rounded-lg group hover:border-orange-500/30 transition-all">
                <div className="size-2 rounded-full bg-orange-500 mt-1 animate-pulse" />
                <p className="text-[11px] font-medium leading-relaxed">{signal}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit size={14} className="text-primary" />
              {t('geo.language_intel')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <p className="text-[11px] font-bold text-primary">{t('geo.lang_ops')}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <Trans
                  i18nKey="geo.multilingual_insight"
                  values={{ lang: "Spanish", game: "Valorant", region: "LATAM" }}
                  components={{
                    percent: <span className="font-bold text-foreground" />,
                    boost: <span className="text-brand-secondary" />
                  }}
                />
              </p>
              <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">{t('geo.language_intel')}</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/20 border border-border rounded-lg text-center">
                <p className="text-[14px] font-black">{t('geo.best_languages')}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{t('geo.top_lang_duo')}</p>
              </div>
              <div className="p-3 bg-muted/20 border border-border rounded-lg text-center">
                <p className="text-[14px] font-black">92{i18n.language === 'ar' ? '٪' : '%'}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{t('geo.subtitle_pref')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance Index */}
      <div className="ui-table-container overflow-x-auto no-scrollbar">
        <Table className="ui-table-shell">
          <TableHeader className="ui-table-header">
            <TableRow className="ui-table-row hover:bg-transparent border-b border-border/50">
              <TableHead className="pl-6 h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('analytics.table.region_intel')}</TableHead>
              <TableHead className="text-end h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('analytics.table.reach_index')}</TableHead>
              <TableHead className="text-end h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">{t('analytics.table.top_game')}</TableHead>
              <TableHead className="text-end h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">{t('analytics.table.format_score')}</TableHead>
              <TableHead className="text-end h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pr-6">{t('analytics.table.virality_pulse')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/30">
            {filteredGeoData.map((region) => (
              <TableRow key={region.id} className="ui-table-row group">
                <TableCell className={cn("ui-table-cell font-bold text-foreground pl-6", isRtl && "pr-6 pl-4 text-start")}>
                  <div className="flex flex-col">
                    <span>{t(`geo.regions.${region.id}` as any, { defaultValue: region.country })}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{region.bestPlatform} {t('geo.focus')}</span>
                  </div>
                </TableCell>
                <TableCell className="ui-table-cell text-end">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono font-bold text-primary">{(region.views / 1000).toFixed(1)}M</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{t('geo.top_percent', { count: 2 })}</span>
                  </div>
                </TableCell>
                <TableCell className="ui-table-cell text-end text-[11px] font-bold text-muted-foreground hidden sm:table-cell">{region.topGame}</TableCell>
                <TableCell className="ui-table-cell text-end text-[11px] font-mono font-bold text-muted-foreground hidden md:table-cell">{region.viralityScore}</TableCell>
                <TableCell className="ui-table-cell text-end pr-6">
                  <Badge className={cn(
                    "h-5 text-[9px] font-bold border-none",
                    region.growth > 20 ? "bg-brand-secondary text-brand-secondary-foreground" : "bg-primary/20 text-primary"
                  )}>
                    +{region.growth}{i18n.language === 'ar' ? '٪' : '%'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

GeoIntelTab.displayName = "GeoIntelTab";
