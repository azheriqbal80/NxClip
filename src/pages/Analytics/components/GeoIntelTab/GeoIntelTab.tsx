import { memo, useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion } from "motion/react";
import { 
  Users, Target, Clock, TrendingUp, Globe, Zap, 
  Activity, Gamepad2, BarChart3, ChevronRight, Flame, BrainCircuit,
  ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { MetricCard } from "../shared-components";
import { GEO_INTEL_DATA, GEO_INTEL_STRATEGY, REGION_TOTALS, geoUrl } from "../constants";
import { AnalyticsGeoIntelSkeleton } from "../../skeletons/AnalyticsSkeleton";

const MotionZoomableGroup = motion(ZoomableGroup);

interface GeoIntelTabProps {
  isLoading: boolean;
}

export const GeoIntelTab = memo(({ isLoading }: GeoIntelTabProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [mapLayer, setMapLayer] = useState<"views" | "avgPercent" | "watchTime">("views");
  const [geoRegionFilter, setGeoRegionFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 20]);

  const safeZoom = isNaN(zoom) ? 1 : zoom;

  const layers = useMemo(() => ({
    views: {
      scale: scaleLinear<string>().domain([0, 4000]).range(["#1a1a1a", "#7c3aed"]).interpolate(interpolateRgb),
      label: t('geo.layer_names.views'),
      unit: "views",
      min: "0",
      max: "4k"
    },
    avgPercent: {
      scale: scaleLinear<string>().domain([0, 100]).range(["#1a1a1a", "#10b981"]).interpolate(interpolateRgb),
      label: t('geo.layer_names.avgPercent'),
      unit: "%",
      min: "0%",
      max: "100%"
    },
    watchTime: {
      scale: scaleLinear<string>().domain([0, 20000]).range(["#1a1a1a", "#ec4899"]).interpolate(interpolateRgb),
      label: t('geo.layer_names.watchTime'),
      unit: "min",
      min: "0",
      max: "20k"
    }
  }), [t]);

  const filteredGeoData = useMemo(() => {
    if (geoRegionFilter === "all") return GEO_INTEL_DATA;
    return GEO_INTEL_DATA.filter((item) => item.id === geoRegionFilter);
  }, [geoRegionFilter]);

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

      {/* Hero Map Section */}
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
          <CardContent className="relative p-0 h-[380px] bg-[#0c0c0c] flex items-center justify-center">
            {/* Layers Filter Toggle Buttons */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 p-1 bg-card/60 backdrop-blur-md rounded-lg border border-border">
              {(Object.keys(layers) as Array<"views" | "avgPercent" | "watchTime">).map((key) => (
                <Button 
                  key={key} 
                  variant={mapLayer === key ? "default" : "ghost"}
                  size="sm" 
                  className={cn("h-7 text-[8px] font-black tracking-wider justify-start px-2.5", mapLayer !== key && "text-muted-foreground")}
                  onClick={() => setMapLayer(key)}
                >
                  {layers[key].label}
                </Button>
              ))}
            </div>

            {/* Scale Indicator */}
            <div className="absolute bottom-4 left-4 z-10 p-3 bg-card/60 backdrop-blur-md rounded-lg border border-border space-y-1.5">
              <span className="text-[8px] font-black text-muted-foreground uppercase block tracking-wider">{t('geo.layer_intensity')}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-muted-foreground">{layers[mapLayer].min}</span>
                <div 
                  className="w-24 h-2 rounded-full border border-white/5" 
                  style={{ 
                    background: `linear-gradient(to right, #1a1a1a, ${
                      mapLayer === "views" ? "#7c3aed" : mapLayer === "avgPercent" ? "#10b981" : "#ec4899"
                    })` 
                  }} 
                />
                <span className="text-[9px] font-mono font-bold text-muted-foreground">{layers[mapLayer].max}</span>
              </div>
            </div>

            {/* Map Interaction Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 p-1 bg-card/60 backdrop-blur-md rounded-lg border border-border">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}><ZoomIn size={14} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}><ZoomOut size={14} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setZoom(1); setCenter([10, 20]); }}><RotateCcw size={14} /></Button>
            </div>

            {/* SVG Map Canvas */}
            <ComposableMap 
              projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }} 
              width={800} 
              height={400} 
              style={{ width: "100%", height: "100%" }}
            >
              <MotionZoomableGroup 
                zoom={safeZoom} 
                center={center} 
                onMoveEnd={({ coordinates, zoom: moveZoom }) => {
                  if (coordinates && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
                    setCenter(coordinates as [number, number]);
                  }
                  if (moveZoom && !isNaN(moveZoom)) {
                    setZoom(moveZoom);
                  }
                }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo, index) => {
                      const regionData = GEO_INTEL_DATA.find((r) => r.id === geo.id || r.id === geo.properties.ISO_A3);
                      const isHighlighted = geoRegionFilter !== "all" && geoRegionFilter === geo.id;
                      
                      let fillColor = "#141414";
                      if (regionData) {
                        const val = regionData[mapLayer];
                        fillColor = layers[mapLayer].scale(val);
                      }

                      return (
                        <Geography 
                          key={geo.rkey || geo.id || geo.properties?.ISO_A3 || geo.properties?.NAME || `geo-${index}`} 
                          geography={geo} 
                          fill={fillColor}
                          stroke={isHighlighted ? "var(--primary)" : "#222"}
                          strokeWidth={isHighlighted ? 1.5 : 0.5}
                          style={{
                            default: { outline: "none", transition: "all 250ms" },
                            hover: { fill: regionData ? "var(--primary)" : "#2a2a2a", outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </MotionZoomableGroup>
            </ComposableMap>
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
