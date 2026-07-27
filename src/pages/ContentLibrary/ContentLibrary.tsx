import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  MoreVertical,
  Eye,
  Heart,
  Calendar,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Trash2,
  Download,
  Clapperboard,
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Send,
  RotateCw,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthenticatedImage } from "../../components/AuthenticatedImage";
import { DataGrid, ColumnDef, FilterDef } from "../../components/ui/data-grid";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { contentApi, extractValidImageUrl, ContentDto } from "../../services/apiClient";
import { toast } from "sonner";
import { StatusBadge } from "./components/StatusBadge";
import { ErrorState } from "../../components/common/ErrorState";

const normalizeStatus = (s?: string) => (s === "rejected" ? "moderation_rejected" : s || "draft");

export default function ContentLibrary() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Moderation-rejected / draft recovery editor
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contentApi.getUserContentList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      // Live-only: surface the real failure instead of silently showing an empty list.
      console.error("Failed to load content:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDelete = async (id: string) => {
    // Optimistic remove with rollback on failure.
    const prev = items;
    setItems((cur) => cur.filter((item) => item.id !== id));
    try {
      await contentApi.deleteContent(id);
      toast.success("Creation deleted.");
    } catch (err: any) {
      setItems(prev);
      toast.error("Failed to delete creation.", { description: err?.message });
    }
  };

  // A post must have a title, a caption, at least one hashtag, and media before it
  // can go to the feed. Returns the human-readable list of what's still missing.
  const getMissingForPublish = (item: any): string[] => {
    const missing: string[] = [];
    if (!String(item.title || "").trim()) missing.push("a title");
    if (!String(item.selectedCaption || item.caption || "").trim()) missing.push("a caption");
    const tags = item.selectedHashtags || item.hashtags;
    if (!Array.isArray(tags) || tags.length === 0) missing.push("at least one hashtag");
    if (!(item.thumbnailUrl || item.cdnUrl || item.mediaUrl || item.imageUrl || item.storageKey)) {
      missing.push("an image");
    }
    return missing;
  };

  const handlePublish = async (item: any) => {
    // Gate: don't publish an incomplete draft — point the user to finish it first.
    const missing = getMissingForPublish(item);
    if (missing.length > 0) {
      toast.error("This post isn't ready to publish", {
        description: `Still needs ${missing.join(", ")}. Finish it in the studio, then publish.`,
        action: { label: "Complete in Studio", onClick: () => continueEditing(item) },
        duration: 9000,
      });
      return;
    }

    setActioningId(item.id);
    try {
      await contentApi.publish(item.id, {
        title: item.title || undefined,
        caption: item.selectedCaption || item.caption || undefined,
        hashtags: item.selectedHashtags || item.hashtags || undefined,
        description: item.description || undefined,
      });
      toast.success("Submitted for moderation.", {
        description: "It will appear on your feed once approved.",
      });
      await fetchContent();
    } catch (err: any) {
      toast.error("Failed to publish.", {
        description: Array.isArray(err?.message) ? err.message.join(" ") : err?.message,
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleRetry = async (item: any) => {
    setActioningId(item.id);
    try {
      await contentApi.retryGeneration(item.id);
      toast.info("Retrying generation…");
      await fetchContent();
    } catch (err: any) {
      toast.error("Retry failed.", { description: err?.message });
    } finally {
      setActioningId(null);
    }
  };

  // Drafts are unfinished creations — continue them in the studio, not an inline
  // title/desc edit (and PATCH is only valid for moderation_rejected anyway).
  const continueEditing = (item: any) => {
    const type = (item.contentType || item.type) as string;
    if (type === "clip") {
      navigate(`/create/clip/${item.id}/edit`);
      return;
    }
    navigate("/create/image", {
      state: {
        prompt: item.prompt || item.title || item.caption || "",
        title: item.title || "",
        style: item.style || "cinematic",
        aspectRatio: item.aspectRatio || "1:1",
        mode: type === "meme" ? "meme" : "image",
        contentId: item.id,
        resultImage: extractValidImageUrl(item),
        caption: item.selectedCaption || item.caption || "",
        hashtags: item.selectedHashtags || item.hashtags || [],
        description: item.description || "",
      },
    });
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditTitle(item.title || "");
    setEditDesc(item.description || "");
  };

  const saveEdit = async () => {
    if (!editItem) return;
    if (!editTitle.trim() && !editDesc.trim()) {
      toast.error("Add a title or description to continue.");
      return;
    }
    setIsSaving(true);
    try {
      await contentApi.editContent(editItem.id, {
        title: editTitle.trim() || undefined,
        description: editDesc.trim() || undefined,
      });
      toast.success("Updated — you can publish again.");
      setEditItem(null);
      await fetchContent();
    } catch (err: any) {
      toast.error("Couldn't save changes.", {
        description: Array.isArray(err?.message) ? err.message.join(" ") : err?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: t("content_library.columns.content"),
      cell: (item) => {
        const thumb = extractValidImageUrl(item);
        return (
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-20 h-12 bg-muted rounded-lg overflow-hidden border border-border shrink-0 flex items-center justify-center">
              <AuthenticatedImage src={thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <p
              className="text-sm font-bold text-foreground truncate max-w-[200px]"
              title={item.title || item.caption || "Untitled Creation"}
            >
              {item.title || item.caption || "Untitled Creation"}
            </p>
          </div>
        );
      },
    },
    {
      header: t("content_library.columns.type"),
      cell: (item) => {
        const type = (item.contentType || item.type || "image") as string;
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            {type === "clip" ? <Video size={16} /> : <ImageIcon size={16} />}
            <span className="text-xs font-bold capitalize">{t(`content_library.types.${type}`, { defaultValue: type })}</span>
          </div>
        );
      },
    },
    {
      header: t("content_library.columns.status"),
      cell: (item) => <StatusBadge status={(item.status as string) || "draft"} />,
    },
    {
      header: t("content_library.columns.stats"),
      className: "text-center",
      cell: (item) => (
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye size={14} />
            <span className="text-xs font-bold" dir="ltr">{typeof item.views === "number" ? item.views : 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={14} />
            <span className="text-xs font-bold" dir="ltr">{typeof item.likes === "number" ? item.likes : 0}</span>
          </div>
        </div>
      ),
    },
    {
      header: t("content_library.columns.date"),
      cell: (item) => {
        let formattedDate = "-";
        try {
          const dateVal = item.createdAt || item.date || item.timestamp;
          if (dateVal) {
            const d = new Date(dateVal as string);
            if (!isNaN(d.getTime())) formattedDate = d.toLocaleDateString();
          }
        } catch {
          formattedDate = "-";
        }
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span className="text-xs font-bold">{formattedDate}</span>
          </div>
        );
      },
    },
    {
      header: t("content_library.columns.actions"),
      className: isRtl ? "text-left" : "text-right",
      cell: (item) => {
        const status = normalizeStatus(item.status);
        const busy = actioningId === item.id;
        const inFlight = status === "publishing" || status === "processing";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                disabled={busy}
                aria-label={t("content_library.columns.actions", { defaultValue: "Actions" })}
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <MoreVertical size={18} />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-52">
              {/* State-specific primary actions */}
              {status === "draft" && (
                <>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => continueEditing(item)}>
                    <Pencil size={14} /> Continue editing
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handlePublish(item)}>
                    <Send size={14} /> Publish to feed
                  </DropdownMenuItem>
                </>
              )}
              {status === "generation_failed" && (
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleRetry(item)}>
                  <RotateCw size={14} /> Retry generation
                </DropdownMenuItem>
              )}
              {status === "moderation_rejected" && (
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(item)}>
                  <Pencil size={14} /> Edit &amp; re-publish
                </DropdownMenuItem>
              )}
              {status === "published" && (
                <>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/feed/post/${item.id}`)}>
                    <ExternalLink size={14} /> {t("content_library.actions.view_details")}
                  </DropdownMenuItem>
                  {extractValidImageUrl(item) && (
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => window.open(extractValidImageUrl(item), "_blank")}
                    >
                      <Download size={14} /> {t("content_library.actions.download")}
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {inFlight && (
                <DropdownMenuItem disabled className="gap-2">
                  <Loader2 size={14} className="animate-spin" /> Working…
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                onClick={() => handleDelete(item.id as string)}
              >
                <Trash2 size={14} /> {t("content_library.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters: FilterDef[] = [
    {
      label: t("content_library.columns.type"),
      key: "contentType",
      options: [
        { label: t("content_library.types.clips", { defaultValue: "Clips" }), value: "clip" },
        { label: t("content_library.types.images", { defaultValue: "Images" }), value: "image" },
      ],
    },
    {
      label: t("content_library.columns.status"),
      key: "status",
      options: [
        { label: t("content_library.status.draft", { defaultValue: "Draft" }), value: "draft" },
        { label: t("content_library.status.processing", { defaultValue: "Processing" }), value: "processing" },
        { label: t("content_library.status.publishing", { defaultValue: "Publishing" }), value: "publishing" },
        { label: t("content_library.status.generation_failed", { defaultValue: "Failed" }), value: "generation_failed" },
        { label: t("content_library.status.moderation_rejected", { defaultValue: "Rejected" }), value: "moderation_rejected" },
        { label: t("content_library.status.published", { defaultValue: "Published" }), value: "published" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono">Loading your creations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16">
        <ErrorState
          error={error}
          title="Couldn't load your content library"
          onRetry={fetchContent}
          className="max-w-lg mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DataGrid
        data={items}
        columns={columns}
        filters={filters}
        searchKey="title"
        searchPlaceholder={t("content_library.search_placeholder")}
        pageSize={6}
        emptyState={
          <div className="py-24 text-center max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-32 h-32 mx-auto mb-8"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-full h-full bg-card border border-border rounded-lg flex items-center justify-center shadow-xl">
                <Clapperboard size={48} className="text-primary" />
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-2 -right-2 w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-white shadow-lg"
                >
                  <Plus size={20} />
                </motion.div>
              </div>
            </motion.div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">{t("content_library.empty_state.title")}</h3>
            <p className="text-muted-foreground font-medium mb-10 leading-relaxed">{t("content_library.empty_state.desc")}</p>
            <Button
              variant="brand-gradient"
              size="xl"
              className="px-10 h-14 font-bold shadow-xl shadow-primary/20 group"
              onClick={() => navigate("/create/image")}
            >
              {t("content_library.empty_state.cta")}
              {isRtl ? (
                <ChevronLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              )}
            </Button>
          </div>
        }
      />

      {/* Edit / reject-recovery dialog (PATCH title/description → returns item to draft) */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {normalizeStatus(editItem?.status) === "moderation_rejected" ? "Fix & re-publish" : "Edit details"}
            </DialogTitle>
            <DialogDescription>
              {normalizeStatus(editItem?.status) === "moderation_rejected"
                ? "This item was flagged in moderation. Update the title or description, then publish again."
                : "Update the title or description for this creation."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cl-edit-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <Input
                id="cl-edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={200}
                placeholder="Give your creation a title…"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-edit-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="cl-edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={5000}
                placeholder="Add an optional description…"
                className="min-h-[120px] resize-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="brand-gradient"
              className="font-bold"
              onClick={saveEdit}
              disabled={isSaving || (!editTitle.trim() && !editDesc.trim())}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
