import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Calendar, Rocket, 
  Target, Zap, Clock, ArrowUpRight, 
  Video, Image as ImageIcon, Sparkles, ChevronRight,
  Play, Edit3, Layers, Flame, Library, RefreshCw,
  Search, X, Eye, Heart, TrendingUp
} from "lucide-react";
import { HomeFeedSkeleton } from "./skeletons/HomeFeedSkeleton";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Skeleton } from "../../components/ui/skeleton";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";
import { contentApi, feedApi, ContentDto } from "../../services/apiClient";
import { toast } from "sonner";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "../../components/ui/pagination";

// --- Types & Interfaces ---

import { Post } from "./components/PostCard";

interface PlanTask {
  id: string;
  day: string;
  contentType: "clip" | "meme" | "image" | "insight";
  game: string;
  title: string;
  platform: "tiktok" | "youtube" | "instagram" | "twitch" | "all";
  status: "ready" | "in_progress" | "scheduled" | "published" | "needs_review" | "completed" | "pending";
  dueTime: string;
  cta: string;
  objective: string;
}

const WEEKLY_PLAN: PlanTask[] = [];

const SCHEDULED_POSTS: Array<{ id: string; title: string; platform: string; time: string; status: string }> = [];

const TRENDS: Array<{ id: string; game: string; title: string; platform: string; growth: string }> = [];

const SUGGESTED_CREATORS: Array<{ id: string; name: string; niche: string; overlap: string; avatar: string }> = [];

// --- Components ---

import { PostCard } from "./components/PostCard";
import { SectionHeading } from "./components/SectionHeading";
import { MetricCard } from "./components/MetricCard";

// Honest media resolution — return the real thumbnail/CDN URL or "" (the card
// renders a neutral placeholder). No stock/Unsplash substitution.
const postImage = (item: any): string =>
  item?.thumbnailUrl || item?.cdnUrl || item?.mediaUrl || item?.imageUrl || "";

const dtoToPost = (item: ContentDto): Post => {
  const isVideo = item.contentType === "clip";
  const views = item.views ?? (item as any).viewCount ?? (item as any).reach ?? 0;
  const likes = item.likes ?? 0;
  const comments = (item as any).commentCount ?? (item as any).comments ?? 0;
  const shares = (item as any).shares ?? (item as any).shareCount ?? 0;
  const saves = (item as any).saves ?? (item as any).saveCount ?? 0;
  
  const engagement = (item as any).engagement !== undefined
    ? (item as any).engagement
    : (views > 0 ? parseFloat(((likes + comments + shares) / views * 100).toFixed(1)) : 0);

  return {
    id: item.id,
    creator: (item as any).creatorName || (item as any).creator || "You",
    game: (item as any).game || (isVideo ? "Clip Studio" : "Image Studio"),
    time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Just now",
    content: item.title || item.caption || item.description || "Untitled Creation",
    tags: item.hashtags || (item as any).tags || [],
    contentType: (item.contentType as any) || "image",
    platform: (item as any).platform || "all",
    likes,
    comments,
    shares,
    saves,
    reach: views,
    engagement,
    retention: (item as any).retention,
    avgWatchTime: (item as any).avgWatchTime,
    image: postImage(item),
    avatar: (item as any).creatorAvatar || (item as any).avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=creator",
    isLiked: (item as any).likedByMe || (item as any).isLiked || false,
    status: item.status || "published",
    planStep: (item as any).planStep,
    aiInsight: (item as any).aiInsight,
  };
};

const feedItemToPost = (item: any): Post => {
  const views = item.viewCount ?? item.views ?? item.reach ?? 0;
  const likes = item.likeCount ?? item.likes ?? 0;
  const comments = item.commentCount ?? item.comments ?? 0;
  const shares = item.shares ?? item.shareCount ?? 0;
  const saves = item.saves ?? item.saveCount ?? 0;

  const engagement = item.engagement !== undefined
    ? item.engagement
    : (views > 0 ? parseFloat(((likes + comments + shares) / views * 100).toFixed(1)) : 0);

  return {
    id: item.id || item.contentId || `feed_${Math.random()}`,
    creator: item.creatorName || item.creator || item.userName || "Creator",
    game: item.game || item.category || "Gaming",
    time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Just now"),
    content: item.title || item.caption || item.description || "Feed Post",
    tags: item.hashtags || item.tags || [],
    contentType: item.contentType || item.type || "clip",
    platform: item.platform || "all",
    likes,
    comments,
    shares,
    saves,
    reach: views,
    engagement,
    retention: item.retention,
    avgWatchTime: item.avgWatchTime,
    image: postImage(item),
    avatar: item.creatorAvatar || item.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=creator",
    isLiked: item.likedByMe || item.isLiked || false,
    status: item.status || "published",
    planStep: item.planStep,
    aiInsight: item.aiInsight,
  };
};

export default function HomeFeed() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState("posts");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  
  const [contentApiPosts, setContentApiPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Today's Focus - Derived from WEEKLY_PLAN
  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
  const todaysFocus = WEEKLY_PLAN.find(task => task.day === currentDay) || WEEKLY_PLAN[3];

  const fetchLiveFeedData = useCallback(async () => {
    setLoading(true);
    try {
      const [contentList, personalFeedRes] = await Promise.allSettled([
        contentApi.getUserContentList(),
        feedApi.fetchPersonalFeed()
      ]);

      if (contentList.status === "fulfilled" && contentList.value) {
        const val: any = contentList.value;
        const rawItems = Array.isArray(val) 
          ? val 
          : (val.items || val.data || []);
        if (Array.isArray(rawItems)) {
          setContentApiPosts(rawItems.map(dtoToPost));
        }
      } else if (contentList.status === "rejected") {
        const errObj: any = contentList.reason;
        const errMsg = Array.isArray(errObj?.message) 
          ? errObj.message.join(", ") 
          : errObj?.message || "Failed to load user content";
        console.error("Content API Error:", errObj);
        toast.error(`My Posts API Error: ${errMsg}`);
      }

      if (personalFeedRes.status === "fulfilled" && personalFeedRes.value?.items) {
        setFeedPosts(personalFeedRes.value.items.map(feedItemToPost));
      } else if (personalFeedRes.status === "rejected") {
        const errObj: any = personalFeedRes.reason;
        const errMsg = Array.isArray(errObj?.message) 
          ? errObj.message.join(", ") 
          : errObj?.message || "Failed to load personal feed";
        console.error("Feed API Error:", errObj);
      }
    } catch (err) {
      console.warn("Error fetching data from API Gate:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeedData();
  }, [fetchLiveFeedData]);

  const allUserPosts = useMemo(() => {
    const map = new Map<string | number, Post>();
    contentApiPosts.forEach(p => map.set(p.id, p));
    feedPosts.forEach(p => map.set(p.id, p));
    
    let list = Array.from(map.values());
    if (platformFilter && platformFilter !== "all") {
      list = list.filter(p => p.platform?.toLowerCase() === platformFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanTag = q.startsWith("#") ? q.slice(1) : q;
      list = list.filter(p => {
        const titleMatch = p.content?.toLowerCase().includes(q) || p.game?.toLowerCase().includes(q) || p.creator?.toLowerCase().includes(q);
        const tagMatch = p.tags?.some(tag => tag.toLowerCase().includes(cleanTag) || tag.toLowerCase().includes(q));
        return titleMatch || tagMatch;
      });
    }
    return list;
  }, [contentApiPosts, feedPosts, platformFilter, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, platformFilter, activeTab]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(allUserPosts.length / pageSize));
  }, [allUserPosts.length, pageSize]);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allUserPosts.slice(start, start + pageSize);
  }, [allUserPosts, currentPage, pageSize]);

  // Base raw posts list for channel-wide metrics
  const rawPostsList = useMemo(() => {
    const map = new Map<string | number, Post>();
    contentApiPosts.forEach(p => map.set(p.id, p));
    feedPosts.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [contentApiPosts, feedPosts]);

  // Computed KPI Metrics from available post data
  const totalReach = useMemo(() => {
    return rawPostsList.reduce((acc, p) => acc + (p.reach || 0), 0);
  }, [rawPostsList]);

  const totalInteractions = useMemo(() => {
    return rawPostsList.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
  }, [rawPostsList]);

  const totalLikes = useMemo(() => {
    return rawPostsList.reduce((acc, p) => acc + (p.likes || 0), 0);
  }, [rawPostsList]);

  const avgEngagementRate = useMemo(() => {
    if (rawPostsList.length === 0) return "0.0%";
    const sum = rawPostsList.reduce((acc, p) => acc + (p.engagement || 0), 0);
    return `${(sum / rawPostsList.length).toFixed(1)}%`;
  }, [rawPostsList]);

  const publishedCount = useMemo(() => {
    return rawPostsList.filter(p => p.status === 'published').length;
  }, [rawPostsList]);

  const pipelineCount = useMemo(() => {
    return rawPostsList.filter(p => p.status === 'ready' || p.status === 'draft' || p.status === 'in_progress' || p.status === 'needs_review').length;
  }, [rawPostsList]);

  const formatCompactNumber = useCallback((num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  }, []);

  const handleLike = useCallback(async (postId: string | number) => {
    try {
      const res = await feedApi.likeContent(String(postId));
      setContentApiPosts(prev => prev.map(p => {
        if (String(p.id) === String(postId)) {
          return {
            ...p,
            isLiked: res.liked,
            likes: res.likeCount
          };
        }
        return p;
      }));
      setFeedPosts(prev => prev.map(p => {
        if (String(p.id) === String(postId)) {
          return {
            ...p,
            isLiked: res.liked,
            likes: res.likeCount
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to toggle like via API Gate:", err);
    }
  }, []);

  const handleDeletePost = useCallback(async (postId: string | number) => {
    try {
      await contentApi.deleteContent(String(postId));
      setContentApiPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
      setFeedPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
      toast.success("Creation deleted successfully!");
    } catch (err) {
      console.error("Failed to delete creation:", err);
      toast.error("Failed to delete creation.");
    }
  }, []);

  if (loading) {
    return <HomeFeedSkeleton />;
  }

  return (
    <div className="ui-dashboard-page">
        {/* --- Page Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-4 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{t('home.header.title')}</h1>
            <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground max-w-md">
              {t('home.header.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="flex-1 sm:w-[120px] h-9 text-[10px] font-bold border-border bg-card">
                <SelectValue placeholder={t('common.platform')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all_platforms')}</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="brand" size="sm" className="px-6 shadow-soft transition-transform hover:scale-[1.01]">
                    <Plus className="mr-2 h-3 w-3" /> {t('common.create_new')}
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align={isAr ? "start" : "end"} className="w-52 border-border text-[11px] font-bold">
                  <DropdownMenuItem onClick={() => navigate('/create/clip')} className="gap-2 py-2.5"><Video size={14} className="text-primary" /> {t('common.create_clip')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create/image')} className="gap-2 py-2.5"><Sparkles size={14} className="text-amber-500" /> {t('common.create_meme')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create/image')} className="gap-2 py-2.5"><ImageIcon size={14} className="text-blue-500/80" /> {t('common.create_image')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/calendar')} className="gap-2 py-2.5"><Calendar size={14} className="text-brand-secondary" /> {t('common.schedule')}</DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="ui-dashboard-grid">
          {/* --- Main Feed Column --- */}
          <div className="ui-dashboard-main">
            {/* Section 1: Today's Focus */}
            {todaysFocus ? (
              <Card className="ui-plan-card border border-border bg-primary/5 shadow-soft overflow-hidden relative">
                <div className={cn("absolute top-0 p-4 opacity-5 pointer-events-none text-primary", isAr ? "left-0" : "right-0")}>
                  <Sparkles size={120} />
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
                    <div className="flex-1 space-y-3 text-center md:text-start">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-md h-5">{t('home.focus.title')}</Badge>
                        <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">• {t('home.focus.due', { time: todaysFocus.dueTime })}</span>
                      </div>
                      <h2 className="text-base md:text-xl font-black text-foreground leading-tight tracking-tight max-w-2xl">
                        {t(todaysFocus.contentType === "clip" ? 'home.focus.task' : 'home.focus.task_gen', { game: todaysFocus.game, type: t(`onboarding.plan.types.${todaysFocus.contentType}`), platform: todaysFocus.platform })}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                           <Target size={12} className="text-primary" /> {t('home.focus.goal', { objective: todaysFocus.objective })}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2.5 w-full md:w-44">
                      <Button variant="brand" size="lg" className="transition-transform hover:scale-[1.01]" onClick={() => navigate('/create/image')}>
                        {t(todaysFocus.contentType === "clip" ? 'home.focus.action_edit' : 'home.focus.action_gen')}
                      </Button>
                      <p className="text-[9px] text-center font-bold text-muted-foreground tracking-widest opacity-60">{t('home.focus.est', { time: 15 })}</p>
                    </div>
                </div>
              </Card>
            ) : (
              <Card className="ui-plan-card border border-border bg-card shadow-soft overflow-hidden relative p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 text-center md:text-start">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-md h-5">Studio Overview</Badge>
                    </div>
                    <h2 className="text-base md:text-xl font-black text-foreground tracking-tight">
                      Create & Manage Your Content
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Generate viral clips, AI graphics, and manage live published posts across platforms.
                    </p>
                  </div>
                  <Button variant="brand-gradient" size="lg" className="shrink-0" onClick={() => navigate('/create/image')}>
                    <Plus size={16} className="mr-1.5" /> Create Post
                  </Button>
                </div>
              </Card>
            )}

            {/* Section 2: Summary Metrics Strip */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard
                label={t('home.metrics.total_reach', { defaultValue: "Total Audience Reach" })}
                value={totalReach > 0 ? formatCompactNumber(totalReach) : "—"}
                subtext={t('home.metrics.reach_subtext', { defaultValue: `${rawPostsList.length} creations tracked` })}
                icon={Eye}
                iconBg="bg-emerald-500/10 border-emerald-500/20"
                iconColor="text-emerald-500"
                accentGlow="bg-emerald-500/10"
              />
              <MetricCard
                label={t('home.metrics.avg_engagement', { defaultValue: "Avg. Engagement Rate" })}
                value={totalInteractions > 0 ? avgEngagementRate : "—"}
                subtext={t('home.metrics.eng_subtext', { defaultValue: `${formatCompactNumber(totalLikes)} likes across feed` })}
                icon={Flame}
                iconBg="bg-violet-500/10 border-violet-500/20"
                iconColor="text-violet-500"
                accentGlow="bg-violet-500/10"
              />
              <MetricCard
                label={t('home.metrics.published_creations', { defaultValue: "Published Creations" })}
                value={publishedCount}
                subtext={t('home.metrics.published_subtext', { defaultValue: "Active on connected feeds" })}
                icon={Rocket}
                iconBg="bg-amber-500/10 border-amber-500/20"
                iconColor="text-amber-500"
                accentGlow="bg-amber-500/10"
              />
              <MetricCard
                label={t('home.metrics.active_pipeline', { defaultValue: "Creation Pipeline" })}
                value={pipelineCount}
                subtext={t('home.metrics.pipeline_subtext', { defaultValue: "Drafts & clips in progress" })}
                icon={Layers}
                iconBg="bg-primary/10 border-primary/20"
                iconColor="text-primary"
                accentGlow="bg-primary/10"
              />
            </div>

            {/* Section: Search Bar */}
            <div className="relative flex items-center justify-between gap-3 my-4">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none", isAr ? "right-3.5" : "left-3.5")} />
                <Input
                  type="text"
                  placeholder={t('home.search_placeholder', { defaultValue: "Search posts by title, game, or #tag..." })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "h-9 text-[11px] font-medium bg-card/80 backdrop-blur-md border-border/80 focus-visible:border-primary/60 rounded-xl shadow-soft placeholder:text-muted-foreground/60 transition-all",
                    isAr ? "pr-10 pl-9" : "pl-10 pr-9"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={cn("absolute top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors", isAr ? "left-2.5" : "right-2.5")}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <Badge variant="outline" className="text-[10px] font-mono h-7 px-2.5 border-border bg-card">
                  {allUserPosts.length} {allUserPosts.length === 1 ? 'match' : 'matches'}
                </Badge>
              )}
            </div>

            {/* Section 3: Feed Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="relative">
                <TabsList className="ui-tabs-list w-full justify-start overflow-x-auto no-scrollbar scroll-smooth mb-8">
                  {[
                    { id: "posts", label: t('home.tabs.posts'), icon: Layers },
                    { id: "plan", label: t('home.tabs.plan'), icon: Calendar },
                    { id: "scheduled", label: t('home.tabs.scheduled'), icon: Clock },
                    { id: "trending", label: t('home.tabs.trending'), icon: Flame },
                    { id: "insights", label: t('home.tabs.insights'), icon: Sparkles },
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="ui-tabs-trigger shrink-0 px-5 gap-2"
                    >
                      <tab.icon size={12} />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className={cn("absolute top-0 bottom-8 w-12 pointer-events-none md:hidden", isAr ? "start-0 bg-gradient-to-r from-background to-transparent" : "end-0 bg-gradient-to-l from-background to-transparent")} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="outline-none"
                >
                  {/* - Insights Tab Content - */}
                  <TabsContent value="insights" className="mt-0 space-y-8">
                    <div className="ui-feed-section">
                      <div className="flex items-center justify-between mb-4">
                        <SectionHeading 
                          title={t('home.insights.recent_posts')} 
                          subtitle={t('home.insights.recent_subtitle')} 
                        />
                        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold text-primary hover:text-primary hover:bg-primary/5" onClick={() => setActiveTab("posts")}>
                          {t('home.insights.full_library')}
                        </Button>
                      </div>
                      
                      {loading ? (
                        <div className="ui-feed-grid">
                          <Card className="ui-post-card border-border bg-muted/5 animate-pulse">
                            <Skeleton className="aspect-video w-full bg-muted/20" />
                            <div className="p-4 space-y-3">
                              <Skeleton className="h-3 w-3/4 bg-muted/20" />
                              <Skeleton className="h-10 w-full bg-muted/20" />
                            </div>
                          </Card>
                        </div>
                      ) : allUserPosts.length === 0 ? (
                        searchQuery.trim() ? (
                          <EmptyState
                            variant="insights"
                            title="No Matching Insights Posts"
                            description={`No posts found matching "${searchQuery}".`}
                            actionLabel="Clear Search"
                            onAction={() => setSearchQuery("")}
                          />
                        ) : (
                          <EmptyState
                            variant="insights"
                            title="No Insights Data Available"
                            description="Publish your first posts to unlock performance analytics, engagement metrics, and AI recommendations."
                            actionLabel="Generate First Post"
                            onAction={() => navigate('/create/image')}
                          />
                        )
                      ) : (
                        <div className="ui-feed-grid">
                          {allUserPosts.slice(0, 3).map((post) => (
                            <PostCard key={post.id} post={post} onLike={handleLike} onDelete={handleDeletePost} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="ui-feed-card p-5 group hover:border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("ui-icon-chip-primary p-2 text-brand-secondary bg-brand-secondary/10", isAr && "ml-0")}>
                            <Rocket size={16} />
                          </div>
                          <Badge className="bg-brand-secondary/10 text-brand-secondary text-[8px] h-4 font-bold border-none">Opportunity</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{t('home.insights.boost_title')}</h3>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">{t('home.insights.boost_desc')}</p>
                        <Button variant="link" className="p-0 h-4 text-[10px] font-bold text-brand-secondary hover:no-underline">
                          {t('home.insights.boost_action')} 
                          <ChevronRight size={10} className={cn(isAr ? "mr-1 rotate-180" : "ml-1")} />
                        </Button>
                      </Card>

                      <Card className="ui-feed-card p-5 group hover:border-amber-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("ui-icon-chip-primary p-2 text-amber-600 dark:text-amber-400 bg-amber-500/10", isAr && "ml-0")}>
                            <Sparkles size={16} />
                          </div>
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] h-4 font-bold border-none">AI Tip</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{t('home.insights.tutorial_title')}</h3>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">{t('home.insights.tutorial_desc')}</p>
                        <Button variant="link" className="p-0 h-4 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:no-underline">
                          {t('home.insights.tutorial_action')} 
                          <ChevronRight size={10} className={cn(isAr ? "mr-1 rotate-180" : "ml-1")} />
                        </Button>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* - My Posts Tab Content - */}
                  <TabsContent value="posts" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <SectionHeading title={t('home.insights.library_title')} subtitle={t('home.insights.library_subtitle')} />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[9px] font-bold" onClick={() => navigate('/my-content')}>
                          <Library size={12} className="mr-1.5" /> Full Library
                        </Button>
                        <Button variant="brand-gradient" size="sm" className="h-8 text-[9px] font-bold" onClick={() => navigate('/create/image')}>
                          <Plus size={12} className="mr-1" /> Create Post
                        </Button>
                      </div>
                    </div>
                    {allUserPosts.length === 0 ? (
                      searchQuery.trim() ? (
                        <EmptyState
                          variant="posts"
                          title="No Matching Posts Found"
                          description={`No posts found matching "${searchQuery}". Try searching by another title or hashtag.`}
                          actionLabel="Clear Search"
                          onAction={() => setSearchQuery("")}
                        />
                      ) : (
                        <EmptyState
                          variant="posts"
                          title="No Published Content Found"
                          description="You haven't created or published any posts yet. Generate your first image or clip to build your post library."
                          actionLabel="Create New Content"
                          onAction={() => navigate('/create/image')}
                          secondaryActionLabel="Full Library"
                          onSecondaryAction={() => navigate('/my-content')}
                        />
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="ui-feed-grid">
                          {paginatedPosts.map((post) => (
                            <PostCard key={post.id} post={post} onLike={handleLike} onDelete={handleDeletePost} />
                          ))}
                        </div>
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          pageSize={pageSize}
                          onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(1);
                          }}
                          totalItems={allUserPosts.length}
                        />
                      </div>
                    )}
                  </TabsContent>

                  {/* - Weekly Plan Tab Content - */}
                  <TabsContent value="plan" className="mt-0 space-y-6">
                    {WEEKLY_PLAN.length === 0 ? (
                      <EmptyState
                        variant="plan"
                        title="No Weekly Plan Scheduled"
                        description="Your content release plan is currently empty. Organize your daily clip drops and game announcements in the calendar."
                        actionLabel="Plan Content Schedule"
                        onAction={() => navigate('/calendar')}
                        secondaryActionLabel="Create Post"
                        onSecondaryAction={() => navigate('/create/image')}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {WEEKLY_PLAN.map((day) => (
                          <Card key={day.id} className={cn(
                            "rounded-lg border shadow-soft transition-all duration-200",
                            day.status === "published" || day.status === "completed" ? "border-brand-secondary/40 bg-brand-secondary/5" : 
                            day.status === "in_progress" ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                          )}>
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-foreground">{t(`common.days.${day.day}`)}</p>
                                <Badge className={cn(
                                  "text-[8px] h-4 font-bold",
                                  day.status === "published" || day.status === "completed" ? "bg-brand-secondary text-primary-foreground border-brand-secondary/20" : "bg-muted text-muted-foreground border-border"
                                )}>
                                  {t(`home.status.${day.status}`)}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-foreground line-clamp-1">{day.title}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className="text-[8px] h-3.5 border-border text-muted-foreground">{day.game}</Badge>
                                  <Badge variant="outline" className="text-[8px] h-3.5 border-border text-muted-foreground">{t(`onboarding.plan.types.${day.contentType}`)}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-muted/20 border-t border-border">
                              <Button className={cn(
                                "w-full h-8 text-[9px] font-bold rounded-md",
                                day.status === "published" || day.status === "completed" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                              )}>
                                {day.cta}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* - Scheduled Content - */}
                  <TabsContent value="scheduled" className="mt-0">
                    {SCHEDULED_POSTS.length === 0 ? (
                      <EmptyState
                        variant="scheduled"
                        title="No Scheduled Posts Queued"
                        description="There are currently no upcoming scheduled posts queued in your publishing pipeline."
                        actionLabel="Schedule Content"
                        onAction={() => navigate('/calendar')}
                      />
                    ) : (
                      <div className="ui-feed-grid">
                        {SCHEDULED_POSTS.map((post) => (
                          <Card key={post.id} className="ui-feed-card p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                <Clock size={16} className="text-muted-foreground" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold">{post.title}</h4>
                                <p className="text-[10px] text-muted-foreground font-bold">{post.platform} • {t(`common.time.${post.time}`)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[8px] h-4 font-bold">{t(`home.status.${post.status}`)}</Badge>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 size={12} /></Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* - Trending Content - */}
                  <TabsContent value="trending" className="mt-0">
                    {TRENDS.length === 0 ? (
                      <EmptyState
                        variant="trending"
                        title="No Trending Topics Available"
                        description="No active gaming trends or viral hooks are loaded right now. Refresh to discover top viral topics."
                        actionLabel="Refresh Trends"
                        onAction={fetchLiveFeedData}
                      />
                    ) : (
                      <div className="ui-feed-grid">
                        {TRENDS.map((trend) => (
                          <Card key={trend.id} className="ui-feed-card p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-primary/10 text-primary text-[8px] h-4 font-bold border-none">{trend.game}</Badge>
                              <span className="text-[9px] font-bold text-brand-secondary">{trend.growth} {t('home.trending.velocity')}</span>
                            </div>
                            <h4 className="text-sm font-bold leading-tight">{trend.title}</h4>
                            <div className="flex items-center justify-between pt-2">
                              <p className="text-[10px] text-muted-foreground font-bold">{t('home.trending.trending_on')} {trend.platform}</p>
                              <Button variant="link" className="p-0 h-4 text-[10px] font-bold text-primary">
                                {t('home.trending.act_now')} 
                                <ArrowUpRight size={10} className={cn(isAr ? "mr-1 rotate-180" : "ml-1")} />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* --- Right Sidebar Column --- */}
          <div className="ui-dashboard-sidebar">
            {/* Widget 1: Today's Creator Pipeline */}
            <div className="ui-sidebar-panel group border-border hover:border-primary/40 transition-colors">
              <SectionHeading title={t('home.pipeline.title')} />
              <div className="space-y-4 pt-2">
                <div className="space-y-2 text-[11px] font-bold text-foreground">
                <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-tight">{t('home.pipeline.edit')} CS2 Clip</span>
                      <span className="text-primary tracking-tight">65%</span>
                   </div>
                   <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        className="h-full bg-primary" 
                      />
                   </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border group/item hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] font-bold tracking-tight">{t('home.pipeline.gen')}</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-[8px] h-4 border-primary/20 font-bold">{t('home.pipeline.ready')}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border opacity-60">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold tracking-tight">{t('home.pipeline.schedule')}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] h-4 border-border bg-muted text-muted-foreground font-bold">{t('home.pipeline.pending')}</Badge>
                </div>
              </div>
            </div>

            {/* Widget 2: Weekly Progress */}
            <div className="ui-sidebar-panel">
               <SectionHeading title={t('home.metrics.weekly_progress')} />
               <div className="space-y-4 pt-2">
                  <div className="flex items-end justify-between">
                     <p className="text-2xl font-black font-mono">4 <span className="text-xs text-muted-foreground font-sans font-bold">/ 7</span></p>
                     <p className="text-[10px] font-bold text-brand-secondary">{t('home.metrics.streak')}</p>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: '57%' }} />
                    <div className="h-full bg-brand-secondary/20" style={{ width: '14%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">{t('home.metrics.goal_desc')}</p>
               </div>
            </div>

            {/* Widget 3: Viral Opportunities */}
            <div className="ui-sidebar-panel bg-primary/5 border-primary/20">
               <SectionHeading title={t('home.viral.title')} />
               <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-bold text-foreground leading-tight">{t('home.viral.content')}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">{t('home.viral.tip')}</p>
                   <Button className="w-full h-8 text-[9px] font-bold rounded-md bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]">{t('home.viral.action')}</Button>
               </div>
            </div>

            {/* Widget 4: Suggested Creators */}
            <div className="ui-sidebar-panel">
               <SectionHeading title={t('home.creators.title')} />
               <div className="space-y-4 pt-2">
                  {SUGGESTED_CREATORS.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No suggested creators at present.</p>
                  ) : (
                    SUGGESTED_CREATORS.map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                               <AvatarImage src={c.avatar} />
                               <AvatarFallback>{c.name.charAt(1)}</AvatarFallback>
                            </Avatar>
                            <div>
                               <p className="text-[11px] font-bold text-foreground">{c.name}</p>
                               <p className="text-[9px] font-bold text-muted-foreground">{c.overlap} {t('home.creators.overlap')}</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-primary hover:text-primary-foreground hover:bg-primary rounded-md">{t('home.creators.follow')}</Button>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
  );
}
