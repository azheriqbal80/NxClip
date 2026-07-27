import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Heart, MessageSquare, Share2, MoreHorizontal,
  Sparkles, Trash2, ExternalLink, Image as ImageIcon, Video, Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";

export interface Post {
  id: string | number;
  creator: string;
  game: string;
  time: string;
  content: string;
  tags?: string[];
  contentType: "clip" | "meme" | "image" | "insight";
  platform: "tiktok" | "youtube" | "instagram" | "twitch" | "all";
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagement: number;
  retention?: number;
  avgWatchTime?: string;
  image: string;
  avatar: string;
  isLiked?: boolean;
  planStep?: string;
  aiInsight?: string;
  status?: string;
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

const isRealImage = (url?: string): url is string =>
  !!url &&
  typeof url === "string" &&
  url.trim() !== "" &&
  !url.includes("undefined") &&
  !url.includes("null") &&
  !url.includes("gcs-mock-upload-bucket") &&
  !url.includes("mock-bucket");

export const PostCard = memo(({ post, onLike, onDelete }: PostCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";

  const [imgFailed, setImgFailed] = useState(false);
  const showImage = isRealImage(post.image) && !imgFailed;
  const isClip = post.contentType === "clip";

  const openDetail = () => navigate(`/feed/post/${post.id}`);

  const formattedTime = (() => {
    if (!post.time) return t("common.time.just_now");
    if (post.time.includes("h")) return t("common.time.hours_ago", { count: parseInt(post.time) || 1 });
    if (post.time.includes("d")) return t("common.time.days_ago", { count: parseInt(post.time) || 1 });
    if (post.time === "now" || post.time === "Just now") return t("common.time.just_now");
    const dateObj = new Date(post.time);
    return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : post.time;
  })();

  // Only surface a status badge when it carries information (i.e. not the
  // default "published" state that every feed item shares).
  const showStatus = post.status && post.status !== "published";
  const statusClass =
    post.status === "moderation_rejected" || post.status === "generation_failed"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : post.status === "processing" || post.status === "publishing"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-muted/70 text-muted-foreground border-border/70";

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("home.post.link_copied", { defaultValue: "Link copied" }), { description: url });
    } catch {
      toast.error(t("home.post.link_copy_failed", { defaultValue: "Couldn't copy the link." }));
    }
  };

  // Forward-looking per-post metrics. No per-post analytics endpoint exists yet,
  // so these render "—" (not tracked) until the backend wires them — and light up
  // automatically once real values arrive. `0` is only shown for genuine zeros.
  const NA = "—";
  const num = (v?: number) =>
    typeof v === "number" && v > 0 ? (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)) : NA;
  const pct = (v?: number) => (typeof v === "number" && v > 0 ? `${v}%` : NA);

  return (
    <Card className="ui-post-card group h-full text-start flex flex-col border border-border/70 bg-card/60 backdrop-blur-md hover:border-primary/40 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 ease-out rounded-2xl overflow-hidden">
      {/* Thumbnail — clickable to detail */}
      <button
        type="button"
        onClick={openDetail}
        aria-label={t("home.post.view_details", { defaultValue: "View details" })}
        className="ui-post-thumbnail relative aspect-video bg-muted/50 overflow-hidden rounded-t-2xl group/thumb block w-full text-start outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {showImage ? (
          <AuthenticatedImage
            src={post.image}
            alt={post.content || "Post"}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground/50">
            {isClip ? <Video size={28} strokeWidth={1.5} /> : <ImageIcon size={28} strokeWidth={1.5} />}
          </div>
        )}

        {/* Scrim for legibility (media overlay, not decoration) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover/thumb:opacity-70 transition-opacity duration-300 pointer-events-none" />

        {isClip && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary shadow-lg transform group-hover/thumb:scale-110 transition-transform duration-300">
              <Play size={16} className="fill-current ms-0.5" />
            </div>
          </div>
        )}

        {/* Content-type + meaningful status only */}
        <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1.5 z-10">
          <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground text-[9px] font-bold h-5 px-2 border border-primary/30 capitalize shadow-sm">
            {post.contentType}
          </Badge>
          {showStatus && (
            <Badge variant="outline" className={cn("backdrop-blur-md text-[9px] font-bold h-5 px-2 capitalize shadow-sm border", statusClass)}>
              {post.status!.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </button>

      <CardContent className="p-3.5 md:p-4 flex-1 flex flex-col space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              onClick={openDetail}
              className="text-[13px] font-bold text-foreground leading-snug line-clamp-2 cursor-pointer group-hover:text-primary transition-colors"
              title={post.content}
            >
              {post.content}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">{formattedTime}</span>
              {post.creator && post.creator !== "You" && (
                <span className="text-[10px] text-muted-foreground/70 font-medium">• {post.creator}</span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                aria-label={t("common.more", { defaultValue: "More" })}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44 border-border/80 bg-popover/95 backdrop-blur-md text-[11px] font-bold shadow-xl">
              <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary" onClick={openDetail}>
                <ExternalLink size={12} /> {t("home.post.view_details", { defaultValue: "View details" })}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary" onClick={() => navigate("/create/image")}>
                <Sparkles size={12} /> {t("home.post.remix", { defaultValue: "Remix" })}
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => onDelete(post.id)}>
                    <Trash2 size={12} /> {t("home.post.delete", { defaultValue: "Delete post" })}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {post.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[9px] font-mono text-primary/90 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md transition-colors hover:bg-primary/20">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Forward-looking performance strip — "—" until per-post analytics is wired */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-auto grid grid-cols-3 gap-1 rounded-xl border border-border/50 bg-white/[0.02] p-2.5 text-center cursor-default">
                <div>
                  <p className="text-[11px] font-bold font-mono text-foreground tracking-tight tabular-nums">{num(post.reach)}</p>
                  <p className="text-[8px] font-semibold text-muted-foreground/80 uppercase tracking-wider mt-0.5">{isClip ? t("home.post.views", { defaultValue: "Views" }) : t("home.post.reach", { defaultValue: "Reach" })}</p>
                </div>
                <div className="border-s border-border/40">
                  <p className="text-[11px] font-bold font-mono text-foreground tracking-tight tabular-nums">{pct(post.engagement)}</p>
                  <p className="text-[8px] font-semibold text-muted-foreground/80 uppercase tracking-wider mt-0.5">{t("home.post.eng", { defaultValue: "Engagement" })}</p>
                </div>
                <div className="border-s border-border/40">
                  <p className="text-[11px] font-bold font-mono text-foreground tracking-tight tabular-nums">{num(post.shares)}</p>
                  <p className="text-[8px] font-semibold text-muted-foreground/80 uppercase tracking-wider mt-0.5">{t("home.post.shares", { defaultValue: "Shares" })}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-[10px] font-bold max-w-[200px] text-center">
              {t("home.post.metrics_pending", { defaultValue: "Post analytics aren't tracked yet — these will populate once live." })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>

      {/* Engagement footer — only real, feed-backed metrics (0-safe) */}
      <div className="ui-post-action-row mt-auto border-t border-border/60 px-3.5 py-2.5 bg-card/40 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLike?.(post.id)}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200 py-1 px-2 rounded-lg hover:bg-white/5 active:scale-90",
              post.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={!!post.isLiked}
            aria-label={t("home.post.like", { defaultValue: "Like" })}
          >
            <Heart size={13} className={cn("transition-all duration-200", post.isLiked ? "fill-current text-primary scale-110" : "hover:scale-110")} />
            <span className="tabular-nums">{post.likes ?? 0}</span>
          </button>
          <button
            onClick={openDetail}
            className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all duration-200 py-1 px-2 rounded-lg hover:bg-white/5 active:scale-95"
            aria-label={t("home.post.comments", { defaultValue: "Comments" })}
          >
            <MessageSquare size={13} className="transition-transform group-hover:scale-110" />
            <span className="tabular-nums">{post.comments ?? 0}</span>
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleShare}
                  className="flex items-center text-muted-foreground hover:text-primary transition-all duration-200 py-1 px-2 rounded-lg hover:bg-white/5 active:scale-90"
                  aria-label={t("home.post.share", { defaultValue: "Share" })}
                >
                  <Share2 size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] font-bold">{t("home.post.share", { defaultValue: "Copy link" })}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button
          variant="outline"
          className="h-7 text-[9px] font-bold rounded-lg px-2.5 border-border/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary hover:shadow-sm active:scale-95 transition-all duration-200"
          onClick={openDetail}
        >
          {t("home.post.view_details", { defaultValue: "View details" })}
        </Button>
      </div>
    </Card>
  );
});

PostCard.displayName = "PostCard";
