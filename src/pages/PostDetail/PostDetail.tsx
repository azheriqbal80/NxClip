import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronLeft,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Clock,
  Layers,
  FileText,
  Hash,
  Image as ImageIcon,
  Film,
  Maximize2,
  Trash2,
  Eye,
  Sliders,
  TrendingUp,
  X,
  Download,
  Wand2,
  Cpu,
  Terminal,
} from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "../../components/SEO";
import { AuthenticatedImage } from "../../components/AuthenticatedImage";
import { feedApi, contentApi, ContentDto } from "../../services/apiClient";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function generateMetadata(id: string | undefined) {
  return {
    title: `Post ${id} Details - nxclip.ai`,
    description: `Detailed view, AI generation prompt, and metadata for creation ${id}.`,
  };
}

// Relative time from an ISO timestamp.
const relTime = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d ago`;
  return d.toLocaleDateString();
};

interface DisplayComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

// The comments API returns { id, userId, body, createdAt } — no display name/avatar.
// We derive a stable handle + placeholder avatar from userId (honest: real id, generic avatar).
const mapComment = (c: any): DisplayComment => ({
  id: c?.id || `c_${Math.random().toString(36).slice(2, 9)}`,
  author: c?.userId ? `@${String(c.userId).slice(0, 8)}` : "Creator",
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c?.userId || c?.id || "creator")}`,
  text: c?.body || c?.text || "",
  time: relTime(c?.createdAt) || c?.time || "",
});

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [comment, setComment] = useState("");
  const [postData, setPostData] = useState<ContentDto | any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtagsAll, setCopiedHashtagsAll] = useState(false);
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<DisplayComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const meta = generateMetadata(id);

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      if (!id) return;
      setLoading(true);
      setImgFailed(false);
      try {
        let data: any = null;
        let fetchError: any = null;
        try {
          data = await contentApi.getContentById(id, { suppressErrorLog: true });
        } catch (e1) {
          fetchError = e1;
          try {
            data = await feedApi.getFeedItemById(id, { suppressErrorLog: true });
          } catch (e2) {
            fetchError = e2;
            try {
              const list = await contentApi.getUserContentList(100);
              data = list.find((item) => item.id === id);
            } catch (e3) {
              fetchError = e3;
            }
          }
        }

        if (!isMounted) return;

        if (data) {
          setPostData(data);
          setLikeCount(data.likes ?? data.likeCount ?? 0);
          setIsLiked(data.isLiked ?? data.likedByMe ?? false);

          // Load real comments for this content.
          const cid = data.contentId || id;
          setCommentsLoading(true);
          try {
            const cres: any = await feedApi.getCommentsList(String(cid));
            const items = Array.isArray(cres) ? cres : cres?.items || [];
            if (isMounted) setCommentsList(items.map(mapComment));
          } catch {
            /* comments are non-blocking */
          } finally {
            if (isMounted) setCommentsLoading(false);
          }
        } else {
          const errMsg = Array.isArray(fetchError?.message)
            ? fetchError.message.join(", ")
            : fetchError?.message || "Post not found";
          toast.error(errMsg);
        }
      } catch (e: any) {
        const errMsg = Array.isArray(e?.message) ? e.message.join(", ") : e?.message || "Could not load post details.";
        toast.error(errMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPost();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const contentId = postData?.contentId || id;

  const handleLikeToggle = async () => {
    if (!contentId) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    // Optimistic
    setIsLiked(!prevLiked);
    setLikeCount((c) => (prevLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const res: any = await feedApi.likeContent(String(contentId));
      if (typeof res?.liked === "boolean") setIsLiked(res.liked);
      if (typeof res?.likeCount === "number") setLikeCount(res.likeCount);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Couldn't update your like.");
    }
  };

  const handleCopyText = (text: string, type: "prompt" | "caption" | "hashtag", tagValue?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "prompt") {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
      toast.success("Prompt copied");
    } else if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
      toast.success("Caption copied");
    } else if (type === "hashtag" && tagValue) {
      setCopiedHashtag(tagValue);
      setTimeout(() => setCopiedHashtag(null), 2000);
      toast.success(`Copied ${tagValue}`);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Post link copied");
  };

  const handleDownloadMedia = async () => {
    if (!imageUrl) return;
    try {
      toast.info("Preparing download…");
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "creation").toLowerCase().replace(/[^a-z0-9]/g, "_")}_nxclip.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      window.open(imageUrl, "_blank");
      toast.success("Opened media in a new tab");
    }
  };

  const handleRemixInStudio = () => {
    navigate("/create/image", {
      state: {
        prompt: prompt || title,
        style: postData?.style || undefined,
        aspectRatio: postData?.aspectRatio || undefined,
        title,
        mode: (postData?.contentType || "").toLowerCase() === "meme" ? "meme" : "image",
      },
    });
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body || !contentId) return;
    setPosting(true);
    setComment("");
    try {
      const created: any = await feedApi.addComment(String(contentId), body);
      const optimistic: DisplayComment = {
        id: created?.id || `c_${Date.now()}`,
        author: "You",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=You`,
        text: created?.body || body,
        time: relTime(created?.createdAt) || "Just now",
      };
      setCommentsList((prev) => [optimistic, ...prev]);
    } catch (err: any) {
      setComment(body);
      toast.error("Couldn't post your comment.", {
        description: Array.isArray(err?.message) ? err.message.join(" ") : err?.message,
      });
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    if (confirm("Delete this creation? This cannot be undone.")) {
      try {
        await contentApi.deleteContent(id);
        toast.success("Creation deleted.");
        navigate("/my-content");
      } catch {
        toast.error("Failed to delete creation.");
      }
    }
  };

  // ---- Resolved fields (honest — no fabricated defaults) ----
  const rawMedia: string =
    postData?.thumbnailUrl || postData?.cdnUrl || postData?.mediaUrl || postData?.imageUrl || "";
  const hasImage = !!rawMedia && !rawMedia.includes("undefined") && !rawMedia.includes("null") && !imgFailed;
  const imageUrl = rawMedia;

  const title = postData?.title || postData?.caption || "Untitled Creation";
  const description = postData?.description || "No description provided.";
  const contentType = (postData?.contentType || "image").toUpperCase();
  const status = (postData?.status || "published").toLowerCase();
  const NA = "—";

  const selectedCaption = postData?.selectedCaption || postData?.caption || "";

  const rawHashtags = postData?.selectedHashtags || postData?.hashtags;
  const selectedHashtags: string[] = Array.isArray(rawHashtags)
    ? rawHashtags
    : typeof rawHashtags === "string"
    ? rawHashtags.split(",").map((s: string) => (s.trim().startsWith("#") ? s.trim() : `#${s.trim()}`)).filter(Boolean)
    : [];

  // Prompt is only shown if the backend actually stored it.
  const prompt =
    postData?.prompt || postData?.metadata?.prompt || postData?.parameters?.prompt || postData?.data?.prompt || "";

  const aiModel = postData?.model || postData?.imageModel || postData?.metadata?.model || NA;
  const style = postData?.style || postData?.metadata?.style || NA;
  const aspectRatio = postData?.aspectRatio || postData?.metadata?.aspectRatio || NA;

  const alternativeCaptions: string[] = Array.isArray(postData?.captions)
    ? postData.captions.filter((c: string) => c && c !== selectedCaption)
    : [];

  const handleCopyAllHashtags = () => {
    if (!selectedHashtags.length) return;
    navigator.clipboard.writeText(selectedHashtags.join(" "));
    setCopiedHashtagsAll(true);
    setTimeout(() => setCopiedHashtagsAll(false), 2000);
    toast.success("All hashtags copied");
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return NA;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return NA;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const publishedAt = formatDate(postData?.publishedAt || postData?.createdAt);
  const updatedAt = formatDate(postData?.updatedAt || postData?.createdAt);

  // Per-post views have no API yet → honest "—" until wired.
  const views = postData?.views ?? postData?.viewCount ?? postData?.reach;
  const viewsDisplay = typeof views === "number" ? views.toLocaleString() : NA;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Draft
          </span>
        );
      case "processing":
      case "publishing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Loader2 size={12} className="animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted/60 text-muted-foreground border border-border capitalize">
            {st.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <SEO title={meta.title} description={meta.description} />

      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={handleRemixInStudio} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md shadow-primary/20">
            <Wand2 size={14} /> Remix in Studio
          </button>
          <button onClick={handleDownloadMedia} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all">
            <Download size={14} /> Download
          </button>
          <button onClick={handleShareLink} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all">
            <Share2 size={14} /> Share
          </button>
          <button onClick={handleDeletePost} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Media showcase */}
          <div className="ui-card p-0 overflow-hidden border border-white/10 bg-card/60 backdrop-blur-md shadow-2xl rounded-2xl">
            <div className="relative bg-black/80 group flex items-center justify-center min-h-[320px] max-h-[560px] overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="animate-spin text-primary" size={36} />
                  <p className="text-xs text-muted-foreground font-mono">Loading media…</p>
                </div>
              ) : (
                <>
                  {hasImage ? (
                    <AuthenticatedImage
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-contain max-h-[560px] transition-transform duration-500 group-hover:scale-[1.01]"
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground/50">
                      {contentType === "CLIP" ? <Film size={40} strokeWidth={1.5} /> : <ImageIcon size={40} strokeWidth={1.5} />}
                      <p className="text-xs font-medium">No media available</p>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
                        {contentType === "CLIP" ? <Film size={12} className="text-primary" /> : <ImageIcon size={12} className="text-primary" />}
                        {contentType}
                      </span>
                      {getStatusBadge(status)}
                    </div>
                    {aspectRatio !== NA && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                        <Sliders size={12} className="text-muted-foreground" />
                        {aspectRatio}
                      </span>
                    )}
                  </div>

                  {hasImage && (
                    <button
                      onClick={() => setIsFullscreenImage(true)}
                      className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                      title="View fullscreen"
                    >
                      <Maximize2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Engagement bar */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={handleLikeToggle} className={cn("flex items-center gap-2 text-sm font-bold transition-all group", isLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground")} aria-pressed={isLiked}>
                  <Heart size={20} className={cn("transition-transform group-hover:scale-110", isLiked && "fill-rose-500 text-rose-500")} />
                  <span className="tabular-nums">{likeCount}</span>
                </button>
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <MessageSquare size={20} />
                  <span className="tabular-nums">{commentsList.length}</span>
                </div>
                <button onClick={handleShareLink} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all group">
                  <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadMedia} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Download">
                  <Download size={20} />
                </button>
                <button
                  onClick={() => { setIsSaved(!isSaved); toast.success(isSaved ? "Removed from saved" : "Saved locally"); }}
                  className={cn("p-2 rounded-lg transition-all", isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}
                  title="Save"
                >
                  <Bookmark size={20} className={isSaved ? "fill-primary" : ""} />
                </button>
              </div>
            </div>

            {/* Title & description */}
            <div className="p-6 sm:p-8 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight mb-2">{title}</h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{description}</p>
            </div>
          </div>

          {/* AI prompt card — only if a prompt was stored */}
          {prompt && (
            <div className="ui-card p-6 sm:p-8 space-y-6 border border-white/10 bg-card/60 backdrop-blur-md rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <h2 className="text-base font-bold text-foreground">Generation Prompt</h2>
                </div>
                <button onClick={handleRemixInStudio} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all">
                  <Wand2 size={12} /> Load in Studio
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-primary" />
                    <span className="text-xs font-bold text-foreground tracking-wider uppercase">Prompt</span>
                  </div>
                  <button onClick={() => handleCopyText(prompt, "prompt")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedPrompt ? "Copied" : "Copy prompt"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed select-all">
                  <p className="whitespace-pre-wrap">{prompt}</p>
                </div>
              </div>
            </div>
          )}

          {/* Specifications & metadata — only backend-provided fields */}
          <div className="ui-card p-6 sm:p-8 space-y-8 border border-white/10 bg-card/60 backdrop-blur-md rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-primary" />
                <h2 className="text-base font-bold text-foreground">Creation Details</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">ID: {id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Cpu size={14} className="text-primary" /><span>AI Model</span></div>
                <p className="text-sm font-bold text-foreground truncate">{aiModel}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Sparkles size={14} className="text-primary" /><span>Style</span></div>
                <p className="text-sm font-bold text-foreground truncate">{style}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Maximize2 size={14} className="text-primary" /><span>Aspect Ratio</span></div>
                <p className="text-sm font-bold text-foreground font-mono">{aspectRatio}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Layers size={14} className="text-primary" /><span>Type</span></div>
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">{contentType}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Calendar size={14} className="text-primary" /><span>Published</span></div>
                <p className="text-xs font-semibold text-foreground">{publishedAt}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><Clock size={14} className="text-primary" /><span>Updated</span></div>
                <p className="text-xs font-semibold text-foreground">{updatedAt}</p>
              </div>
            </div>

            {/* Selected caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText size={16} className="text-primary" /><span className="text-xs font-bold text-foreground tracking-wider uppercase">Caption</span></div>
                {selectedCaption && (
                  <button onClick={() => handleCopyText(selectedCaption, "caption")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {copiedCaption ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCaption ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-foreground leading-relaxed">
                {selectedCaption || "No caption set."}
              </div>
            </div>

            {/* Alternative captions (real, from generate) */}
            {alternativeCaptions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground tracking-wider uppercase block">Alternative Captions</span>
                <div className="space-y-2">
                  {alternativeCaptions.map((cap, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3 text-xs">
                      <p className="text-zinc-300 leading-relaxed truncate">{cap}</p>
                      <button onClick={() => handleCopyText(cap, "caption")} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0" title="Copy">
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {selectedHashtags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Hash size={16} className="text-primary" /><span className="text-xs font-bold text-foreground tracking-wider uppercase">Hashtags ({selectedHashtags.length})</span></div>
                  <button onClick={handleCopyAllHashtags} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {copiedHashtagsAll ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedHashtagsAll ? "Copied all" : "Copy all"}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedHashtags.map((tag, idx) => (
                    <button key={idx} onClick={() => handleCopyText(tag, "hashtag", tag)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer" title="Copy hashtag">
                      {copiedHashtag === tag ? <Check size={12} /> : null}
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Author */}
          <div className="ui-card p-6 border border-white/10 bg-card/60 backdrop-blur-md rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Creator</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted border border-white/20 overflow-hidden shrink-0">
                <img
                  src={postData?.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(postData?.userId || "creator")}`}
                  alt="Creator"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-foreground truncate">{postData?.creatorName || postData?.creator || "Creator"}</p>
                <p className="text-xs text-muted-foreground truncate">Published {publishedAt}</p>
              </div>
            </div>
          </div>

          {/* Performance — views has no API yet ("—"); likes real */}
          <div className="ui-card p-6 border border-white/10 bg-card/60 backdrop-blur-md rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Performance</h3>
              <TrendingUp size={16} className="text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1"><Eye size={12} /> Views</p>
                <p className="text-base font-extrabold text-foreground tabular-nums">{viewsDisplay}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1"><Heart size={12} /> Likes</p>
                <p className="text-base font-extrabold text-foreground tabular-nums">{likeCount}</p>
              </div>
            </div>
          </div>

          {/* Comments — real API */}
          <div className="ui-card p-0 border border-white/10 bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col h-[480px]">
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground tracking-wider uppercase flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" /> Comments ({commentsList.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {commentsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-muted-foreground" />
                </div>
              ) : commentsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                  <MessageSquare size={28} className="opacity-40" />
                  <p className="text-xs font-medium">No comments yet. Start the conversation.</p>
                </div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-muted border border-white/10 overflow-hidden shrink-0">
                      <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{c.author}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ms-2">{c.time}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed break-words">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="p-3 border-t border-white/10 bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  disabled={posting}
                  maxLength={2000}
                  className="w-full pl-3 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-medium text-foreground focus:border-primary outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60"
                />
                <button type="submit" disabled={!comment.trim() || posting} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-primary disabled:opacity-30 hover:scale-110 transition-all">
                  {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Fullscreen */}
      {isFullscreenImage && hasImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8" onClick={() => setIsFullscreenImage(false)}>
          <button onClick={() => setIsFullscreenImage(false)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 z-10">
            <X size={20} />
          </button>
          <AuthenticatedImage src={imageUrl} alt={title} className="max-w-full max-h-full object-contain rounded-xl border border-white/10 shadow-2xl" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
}
