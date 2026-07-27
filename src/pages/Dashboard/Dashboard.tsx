import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { auth, db, handleFirestoreError, OperationType, isFirebaseConfigured } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { TiktokIcon } from "../../components/TiktokIcon";
import CreatePostDialog from "./components/CreatePostDialog";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp,
  Zap,
  Rocket,
  Calendar,
  Target,
  ArrowUpRight,
  Plus,
  Clock,
  Globe,
  ChevronLeft
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from "recharts";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import { SEO } from "../../components/SEO";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

// --- Types & Components ---
import { KPICard, KPICardProps } from "./components/KPICard";
import { ContentTypeCard } from "./components/ContentTypeCard";
import { SectionHeader } from "./components/SectionHeader";
import { PwaInstallPrompt } from "../../components/PwaInstallPrompt";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  // Re-syncing dashboard performance
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const navigate = useNavigate();

  const DASHBOARD_KPIS: KPICardProps[] = [
    { label: t('dashboard.kpis.growth'), value: "+12.5%", trend: "up", status: t('dashboard.kpis.healthy'), icon: TrendingUp },
    { label: t('dashboard.kpis.published'), value: "12", trend: "neutral", status: t('dashboard.kpis.target'), icon: Calendar },
    { label: t('dashboard.kpis.top_platform'), value: "TikTok", trend: "up", status: t('dashboard.kpis.viral'), icon: Zap },
    { label: t('dashboard.kpis.attention'), value: `3 ${t('dashboard.kpis.items')}`, trend: "down", status: t('dashboard.kpis.action'), icon: Target },
    { label: t('dashboard.kpis.opportunity'), value: "Meme Hook", trend: "up", status: t('dashboard.kpis.high'), icon: Rocket },
  ];

  const CONTENT_PERFORMANCE = [
    { 
      type: t('dashboard.content_matrix.clips'), 
      published: 5, 
      engagement: "9.4%", 
      platform: "TikTok", 
      topPost: t('dashboard.top_content.posts.valorant'),
      insight: t('dashboard.content_matrix.insights.shorten'),
      trend: "+4.2%" 
    },
    { 
      type: t('dashboard.content_matrix.memes'), 
      published: 4, 
      engagement: "8.1%", 
      platform: "Instagram", 
      topPost: t('dashboard.top_content.posts.cs2'),
      insight: t('dashboard.content_matrix.insights.follow_up'),
      trend: "+2.1%" 
    },
    { 
      type: t('dashboard.content_matrix.images'), 
      published: 3, 
      engagement: "6.7%", 
      platform: "Instagram", 
      topPost: t('dashboard.top_content.posts.minecraft'),
      insight: t('dashboard.content_matrix.insights.tutorial'),
      trend: "-0.5%" 
    },
  ];

  const TOP_CONTENT = [
    {
      id: "top-1",
      title: t('dashboard.top_content.posts.valorant'),
      platform: "TikTok",
      type: t('dashboard.content_matrix.clips'),
      game: "Valorant",
      metrics: `18.4K ${t('post.views')}`,
      retention: "74%",
      whyItWorked: t('dashboard.top_content.posts.reasons.hook'),
      thumbnail: "https://api.dicebear.com/7.x/shapes/svg?seed=v1"
    },
    {
      id: "top-2",
      title: t('dashboard.top_content.posts.cs2'),
      platform: "Instagram",
      type: t('dashboard.content_matrix.memes'),
      game: "CS2",
      metrics: `840 ${t('post.saves')}`,
      shares: "312",
      whyItWorked: t('dashboard.top_content.posts.reasons.humor'),
      thumbnail: "https://api.dicebear.com/7.x/shapes/svg?seed=cs2"
    },
    {
      id: "top-3",
      title: t('dashboard.top_content.posts.minecraft'),
      platform: "Instagram",
      type: t('dashboard.content_matrix.images'),
      game: "Minecraft",
      metrics: `12.1K ${t('post.reach')}`,
      saves: "620",
      whyItWorked: t('dashboard.top_content.posts.reasons.visuals'),
      thumbnail: "https://api.dicebear.com/7.x/shapes/svg?seed=mc"
    }
  ];

  const ATTENTION_ITEMS = [
    { id: "a1", issue: t('dashboard.attention.items.a1.issue'), impact: t('dashboard.attention.impact.high'), action: t('dashboard.attention.items.a1.action'), cta: t('dashboard.attention.items.a1.cta') },
    { id: "a2", issue: t('dashboard.attention.items.a2.issue'), impact: t('dashboard.attention.impact.medium'), action: t('dashboard.attention.items.a2.action'), cta: t('dashboard.attention.items.a2.cta') },
    { id: "a3", issue: t('dashboard.attention.items.a3.issue'), impact: t('dashboard.attention.impact.high'), action: t('dashboard.attention.items.a3.action'), cta: t('dashboard.attention.items.a3.cta') },
    { id: "a4", issue: t('dashboard.attention.items.a4.issue'), impact: t('dashboard.attention.impact.low'), action: t('dashboard.attention.items.a4.action'), cta: t('dashboard.attention.items.a4.cta') },
  ];

  const PULSE_DATA = [
    { label: t('dashboard.pulse.best_time'), value: t('dashboard.pulse.values.sunday_8pm'), icon: Clock },
    { label: t('dashboard.pulse.top_region'), value: t('dashboard.pulse.values.us'), icon: Globe },
    { label: t('dashboard.pulse.growing'), value: "TikTok", icon: TiktokIcon },
    { label: t('dashboard.pulse.topic'), value: t('dashboard.pulse.values.cs2'), icon: Zap },
  ];

  const chartData = useMemo(() => [
    { name: t('dashboard.days.mon'), views: 2400 },
    { name: t('dashboard.days.tue'), views: 1398 },
    { name: t('dashboard.days.wed'), views: 9800 },
    { name: t('dashboard.days.thu'), views: 3908 },
    { name: t('dashboard.days.fri'), views: 4800 },
    { name: t('dashboard.days.sat'), views: 3800 },
    { name: t('dashboard.days.sun'), views: 4300 },
  ], [t]);

  const handlePostCreated = useCallback((post: { content: string; media: string | null; mediaType: "image" | "video" | null; tags: string[]; }) => {
    console.log("Post created:", post);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", auth.currentUser?.uid || "");
    const unsubscribe = onSnapshot(docRef, (_docSnap) => {
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${auth.currentUser?.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="ui-dashboard-page">
      <SEO 
        title="Creator Dashboard | NexaClip.ai"
        description="Monitor your gaming content performance, viral reach, and AI-powered creator insights."
      />
      {/* --- Page Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('dashboard.header.title')}</h1>
            <p className="text-[11px] font-bold text-muted-foreground">
              {t('dashboard.header.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[80px] h-9 text-[10px] font-bold bg-card border-border">
                  <SelectValue placeholder="7D" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7D</SelectItem>
                  <SelectItem value="30d">30D</SelectItem>
                  <SelectItem value="90d">90D</SelectItem>
                </SelectContent>
             </Select>

              <Select value={activePlatform} onValueChange={setActivePlatform}>
                <SelectTrigger className="w-[120px] h-9 text-[10px] font-bold bg-card border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all_platforms')}</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
             </Select>

             <CreatePostDialog onPost={handlePostCreated} />
          </div>
        </div>

        <PwaInstallPrompt variant="banner" className="mb-6 mt-2" />

        {/* --- KPI Row --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {DASHBOARD_KPIS.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* --- Main Grid --- */}
        <div className="ui-dashboard-grid">
           {/* Section 2: Performance Snapshot */}
           <div className="lg:col-span-8 space-y-6 md:space-y-8">
              <Card className="p-6 md:p-8 bg-card/40 backdrop-blur-sm border-border">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <SectionHeader title={t('dashboard.performance.title')} subtitle={t('dashboard.performance.subtitle')} />
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" className="h-8 text-[9px] font-black">{t('dashboard.content_matrix.clips')}</Button>
                       <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black text-muted-foreground">{t('dashboard.content_matrix.memes')}</Button>
                       <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black text-muted-foreground">{t('dashboard.content_matrix.images')}</Button>
                       <Separator orientation="vertical" className="h-4 mx-2" />
                       <Button onClick={() => navigate("/analytics")} variant="link" className="h-8 text-[9px] font-black text-primary">
                        {t('dashboard.performance.full_analytics')} 
                        {isAr ? <ChevronLeft size={10} className="me-1" /> : <ArrowUpRight size={10} className="ms-1" />}
                      </Button>
                    </div>
                 </div>

                 <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="snapGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 700 }} dy={10} reversed={isAr} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 700 }} orientation={isAr ? "right" : "left"} />
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }}
                           itemStyle={{ color: "var(--foreground)" }}
                        />
                        <Area type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={3} fill="url(#snapGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              {/* Section 4: Content Performance Matrix */}
              <div>
                <SectionHeader title={t('dashboard.content_matrix.title')} subtitle={t('dashboard.content_matrix.subtitle')} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                   {CONTENT_PERFORMANCE.map((item) => (
                     <ContentTypeCard key={item.type} post={item} />
                   ))}
                </div>
              </div>

              {/* Section 6: Top Performing Content */}
              <div>
                 <SectionHeader title={t('dashboard.top_content.title')} subtitle={t('dashboard.top_content.subtitle')} />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {TOP_CONTENT.map((content) => (
                      <Card key={content.id} className="ui-top-content-card group">
                         <div className="aspect-video relative rounded-md overflow-hidden bg-muted mb-4">
                            <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                           <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold rounded-md ring-1 ring-primary-foreground/10 shadow-xl">
                                  {isAr ? <ChevronLeft size={14} className="me-1" /> : <ArrowUpRight size={14} className="me-1" />} {t('dashboard.top_content.view_details')}
                               </Button>
                            </div>
                            <Badge className={cn("absolute top-2 bg-neutral-950/60 backdrop-blur-md border-primary-foreground/10 text-[8px] h-4 font-bold text-primary-foreground leading-none", isAr ? "right-2" : "left-2")}>
                               {content.platform}
                            </Badge>
                         </div>
                         <div className="space-y-3">
                            <div>
                               <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-[8px] h-3.5 border-border font-bold text-muted-foreground">{content.game}</Badge>
                                  <span className="text-[10px] font-bold text-brand-secondary">{content.metrics}</span>
                               </div>
                               <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{content.title}</h4>
                            </div>
                            <div className="p-2.5 rounded bg-primary/5 border border-primary/20">
                               <p className={cn(
                               "text-[9px] font-bold text-primary mb-0.5 leading-none",
                               isAr ? "tracking-normal" : "tracking-wider"
                             )}>{t('dashboard.top_content.why_worked')}</p>
                               <p className="text-[11px] font-medium text-muted-foreground leading-tight">{content.whyItWorked}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/5">
                                {t('dashboard.top_content.reuse_strategy')} <Plus size={12} className="ms-1" />
                            </Button>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Column (AI Command + Sidebar widgets) */}
           <div className="lg:col-span-4 space-y-6 md:space-y-8">
              {/* Section 3: AI Command Summary */}
              <Card className="ui-insight-card p-6 border-none bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <BrainCircuit size={100} />
                 </div>
                 <div className="relative space-y-6">
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary-foreground/20 text-primary-foreground text-[9px] h-4 font-black border-none">{t('dashboard.command.title')}</Badge>
                       </div>
                       <h3 className="text-xl font-black leading-tight italic">{t('dashboard.command.insight')}</h3>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[10px] font-black opacity-70">{t('dashboard.command.next_best')}</p>
                       <div className="space-y-2">
                          {(t('dashboard.command.actions', { returnObjects: true }) as string[]).map((action, i) => (
                             <div key={i} className="flex items-start gap-2 text-[12px] font-bold leading-snug">
                                <span className="h-4 w-4 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                                <span>{action}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-black h-10 text-[11px] rounded-md shadow-inner">
                       {t('dashboard.command.cta')} <Rocket size={14} className="ms-2" />
                    </Button>
                 </div>
              </Card>

               {/* Section 5: Weekly Plan Progress */}
              <div className="ui-sidebar-panel">
                 <div className="flex items-center justify-between">
                    <SectionHeader title={t('dashboard.progress.title')} />
                    <Badge className="bg-brand-secondary/10 text-brand-secondary border-none text-[9px] font-bold">{t('dashboard.progress.on_track')}</Badge>
                 </div>
                 <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-foreground">{t('dashboard.progress.goals')}</span>
                          <span className="text-primary">4 / 7</span>
                       </div>
                       <Progress value={57} className="h-1.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 rounded-md bg-muted/30 border border-border text-center">
                          <p className={cn(
                            "text-[9px] font-bold text-muted-foreground leading-none mb-1",
                            isAr ? "tracking-normal" : "tracking-wider"
                          )}>{t('dashboard.progress.scheduled')}</p>
                          <p className="text-lg font-display font-black text-foreground" dir="ltr">2</p>
                       </div>
                       <div className="p-3 rounded-md bg-muted/30 border border-border text-center">
                          <p className={cn(
                            "text-[9px] font-bold text-muted-foreground leading-none mb-1",
                            isAr ? "tracking-normal" : "tracking-wider"
                          )}>{t('dashboard.progress.review')}</p>
                          <p className="text-lg font-display font-black text-amber-500" dir="ltr">1</p>
                       </div>
                    </div>
                    <Card className="p-3 border-dashed border-border bg-muted/20">
                        <p className="text-[9px] font-bold text-muted-foreground mb-1">{t('dashboard.progress.up_next')}:</p>
                        <p className="text-[11px] font-bold text-foreground leading-tight">{t('dashboard.progress.up_next_task')}</p>
                    </Card>
                    <Button onClick={() => navigate("/feed")} variant="outline" className="w-full h-9 text-[10px] font-bold">{t('dashboard.progress.open_feed')}</Button>
                 </div>
              </div>

              {/* Section 7: Needs Attention */}
              <div className="ui-sidebar-panel">
                 <SectionHeader title={t('dashboard.attention.title')} />
                 <div className="space-y-3 pt-2">
                {ATTENTION_ITEMS.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between group/item hover:bg-muted/40 transition-colors">
                     <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                           <h5 className="text-[11px] font-bold text-foreground line-clamp-1 leading-none">{item.issue}</h5>
                           <Badge className={cn(
                             "text-[8px] h-3 px-1 border-none font-bold leading-none",
                             isAr ? "tracking-normal" : "tracking-wider",
                             item.impact === "High" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"
                           )}>{item.impact}</Badge>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">{item.action}</p>
                     </div>
                     <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase text-primary hover:bg-primary/5 hover:text-primary px-2 ms-2 shrink-0 border border-transparent hover:border-primary/20">
                        {item.cta}
                     </Button>
                  </div>
                ))}
                 </div>
              </div>

              {/* Section 8: Audience / Platform Pulse */}
              <div className="ui-sidebar-panel bg-muted/5">
                 <SectionHeader title={t('dashboard.pulse.title')} />
                 <div className="grid grid-cols-1 gap-2 pt-2">
                    {PULSE_DATA.map((item) => {
                      const isTiktok = item.label === t('dashboard.pulse.growing') && item.value === "TikTok";
                      return (
                        <div key={item.label} className="ui-pulse-card flex items-center gap-3">
                           <div className={cn(
                             "p-1.5 rounded bg-card",
                             isTiktok ? "text-foreground" : "text-muted-foreground"
                          )}>
                              <item.icon size={14} />
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-muted-foreground leading-none mb-1">{item.label}</p>
                              <p className="text-[11px] font-black text-foreground">{item.value}</p>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>

              {/* Quick AI Tip Secondary */}
              <Card className="p-5 border-none bg-amber-500/10 text-amber-500/80 rounded-xl">
                 <div className="flex items-center gap-3 mb-2">
                    <Sparkles size={18} />
                    <p className="text-xs font-black">{t('dashboard.tip.title')}</p>
                 </div>
                 <p className="text-xs leading-relaxed font-bold">
                    {t('dashboard.tip.content')}
                 </p>
              </Card>
           </div>
        </div>
      </div>
  );
}
