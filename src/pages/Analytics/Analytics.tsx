import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, 
  Layers, 
  Users, 
  Image as ImageIcon, 
  Clock, 
  Gamepad2, 
  Globe, 
  Map, 
  BrainCircuit, 
  Download,
  Zap
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../components/ui/select";

// Import Modular Tab Components
import { OverviewTab } from "./components/OverviewTab/OverviewTab";
import { ContentTab } from "./components/ContentTab/ContentTab";
import { CreativeTab } from "./components/CreativeTab/CreativeTab";
import { PlatformsTab } from "./components/PlatformsTab/PlatformsTab";
import { GeoIntelTab } from "./components/GeoIntelTab/GeoIntelTab";
import { AudienceTab } from "./components/AudienceTab/AudienceTab";
import { GamesTab } from "./components/GamesTab/GamesTab";
import { RetentionTab } from "./components/RetentionTab/RetentionTab";
import { AiTab } from "./components/AiTab/AiTab";
import { WorkspaceExportDialog } from "../../components/WorkspaceExportDialog";

export default function Analytics() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState("all");
  const [contentType, setContentType] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  useEffect(() => {
    // Simulate API loading state transitions when tab or filters change
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeTab, platform, contentType, dateRange]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      
      {/* Shared Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">
            {t('analytics.title')}
          </h1>
          <p className="text-[11px] md:text-xs text-muted-foreground font-bold tracking-tight max-w-lg">
            {t('analytics.description')}
          </p>
        </div>
        
        {/* Shared Filtering Controllers */}
        <div className="flex flex-wrap items-center gap-2 ui-filter-panel mb-0 py-1.5 px-2 w-full md:w-auto bg-muted/20 border-border">
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-md border border-border shrink-0">
            {["7D", "30D", "90D"].map((r) => (
              <Button 
                key={r}
                variant={dateRange === r.toLowerCase() ? "secondary" : "ghost"} 
                size="sm" 
                className="h-7 text-[9px] md:text-[10px] font-bold px-2.5 md:px-3 transition-all"
                onClick={() => setDateRange(r.toLowerCase())}
              >
                {r}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-8 text-[10px] font-bold bg-card border-border">
                <SelectValue placeholder={t('common.platform')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all_platforms')}</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-8 text-[10px] font-bold bg-card border-border">
                <SelectValue placeholder={t('common.filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('create_post.labels.content_style')}</SelectItem>
                <SelectItem value="video">{t('nav.clip_editor')}</SelectItem>
                <SelectItem value="meme">{t('dashboard.content_matrix.memes')}</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 md:w-auto md:gap-2 text-[9px] font-bold p-0 md:px-3"
              onClick={() => setIsWorkspaceOpen(true)}
            >
              <Download size={14} className="md:size-3 rtl:ml-0 rtl:mr-1" />
              <span className="hidden md:inline">{t('analytics.export')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Layout System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative group">
          <TabsList className="ui-tabs-list w-full overflow-x-auto no-scrollbar justify-start md:justify-center">
            {[
              { id: "overview", label: t('analytics.tabs.overview'), icon: BarChart3 },
              { id: "content", label: t('analytics.tabs.content'), icon: Layers },
              { id: "creative", label: t('analytics.tabs.creative'), icon: ImageIcon },
              { id: "platforms", label: t('analytics.tabs.platforms'), icon: Globe },
              { id: "geo-intel", label: t('analytics.tabs.geo'), icon: Map },
              { id: "audience", label: t('analytics.tabs.audience'), icon: Users },
              { id: "games", label: t('analytics.tabs.games'), icon: Gamepad2 },
              { id: "retention", label: t('analytics.tabs.retention'), icon: Clock },
              { id: "ai", label: t('analytics.tabs.ai'), icon: BrainCircuit },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="ui-tabs-trigger shrink-0"
              >
                <tab.icon size={12} className="mr-2 rtl:mr-0 rtl:ml-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="absolute right-0 rtl:left-0 rtl:right-auto top-0 bottom-6 w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="outline-none mt-6"
          >
            <TabsContent value="overview" className="mt-0 outline-none">
              <OverviewTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="content" className="mt-0 outline-none">
              <ContentTab isLoading={isLoading} contentType={contentType} />
            </TabsContent>

            <TabsContent value="creative" className="mt-0 outline-none">
              <CreativeTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="platforms" className="mt-0 outline-none">
              <PlatformsTab isLoading={isLoading} platformFilter={platform} />
            </TabsContent>

            <TabsContent value="geo-intel" className="mt-0 outline-none">
              <GeoIntelTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="audience" className="mt-0 outline-none">
              <AudienceTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="games" className="mt-0 outline-none">
              <GamesTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="retention" className="mt-0 outline-none">
              <RetentionTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="ai" className="mt-0 outline-none">
              <AiTab isLoading={isLoading} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Shared Global Insight Section (Glass Footer) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-1 bg-gradient-to-r from-primary/20 via-transparent to-tertiary/20 rounded-xl overflow-hidden mt-8"
      >
        <div className="bg-card border border-border p-6 rounded-[var(--radius-lg)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft-lg">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-start">
            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-primary shadow-glow-primary/10 shrink-0">
              <BrainCircuit size={24} />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-foreground">{t('analytics.performance_footer.title')}</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                {t('analytics.performance_footer.ai_insight')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-col sm:flex-row">
            <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
              {t('analytics.performance_footer.live_tracking')}: <span className="text-brand-secondary italic">{t('analytics.performance_footer.connected')}</span>
            </span>
            <Button size="sm" variant="brand" className="text-primary-foreground font-bold px-8 h-10 rounded-lg shadow-lg shadow-primary/20">
              {t('analytics.performance_footer.view_model')}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Google Workspace Core Export Hub */}
      <WorkspaceExportDialog 
        isOpen={isWorkspaceOpen} 
        onClose={() => setIsWorkspaceOpen(false)} 
      />
    </div>
  );
}
