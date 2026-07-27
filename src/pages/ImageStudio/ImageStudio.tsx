import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Maximize2, 
  History,
  X,
  CheckCircle2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Badge } from "../../components/ui/badge";
import { generateCaptions, generateTitle, AIError } from "../../services/aiService";
import { contentApi } from "../../services/apiClient";
import type { ApiError, GenerateContentResponse, PublishContentResponse } from "../../services/apiClient";
import { socketService } from "../../services/socketService";
import type { WebSocketEnvelope, ModerationCompletePayload, GenerationFailedPayload } from "../../services/socketService";
import { ErrorState } from "../../components/common/ErrorState";
import { SEO } from "../../components/SEO";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { GenerationHistoryItem } from "./types";
import { GeneratePanel } from "./components/GeneratePanel";
import { CanvasPanel } from "./components/CanvasPanel";
import { EditPanel } from "./components/EditPanel";
import { triggerHaptic } from "../../lib/vibration";
import { AuthenticatedImage } from "../../components/AuthenticatedImage";

const SUGGESTION_POOL = [
  "Cyberpunk neon street",
  "Vintage pixel art gamer",
  "Cinematic fantasy castle",
  "Futuristic gaming setup",
  "Adorable 3D mascot",
  "Dark horror aesthetic",
  "Synthwave sunset drive",
  "Epic boss battle scene",
  "Funny reaction meme",
  "Cozy lofi gaming room",
  "Post-apocalyptic ruins",
  "Stylized anime landscape",
  "Surreal dream world",
  "High-octane racing",
  "Magic forest at night"
];

const SUPPORTED_GENERATE_STYLES = new Set(["cinematic", "meme", "pixel_art", "cartoon", "realistic"]);

const normalizeGenerateStyle = (value?: string): string => {
  if (value === "thumbnail") return "pixel_art";
  return value && SUPPORTED_GENERATE_STYLES.has(value) ? value : "cinematic";
};

const STYLE_SPECIFIC_SUGGESTIONS: Record<string, string[]> = {
  realistic: [
    "Ultra-detailed portrait of a cyberpunk hacker",
    "High-resolution landscape of a Scandinavian fjord",
    "Close-up of a high-tech mechanical keyboard with RGB lighting",
    "Professional photograph of a modern desert villa",
    "Macro shot of a butterfly on a vibrant flower"
  ],
  cinematic: [
    "Wide shot of an abandoned space colony on a red planet",
    "Dramatic silhouette of a knight standing against a sunset",
    "Intense car chase through a rain-slicked futuristic city",
    "Moodily lit epic fantasy library with floating candles",
    "First-person view of a high-speed snowy mountain descent"
  ],
  cartoon: [
    "Cutesy 3D render of a baby dragon eating a taco",
    "Stylized 2D animation character of a space adventurer",
    "Colorful whimsical village made of giant candy",
    "Vector art mascot for a tech startup",
    "Retro Saturday morning cartoon style superhero"
  ],
  pixel_art: [
    "Aggressive red border gaming thumbnail with epic text",
    "Bright high-contrast reaction face for a tech review",
    "Money falling from the sky with a large success badge",
    "Progression comparison from a noob to a pro in a sandbox game",
    "Extreme fitness transformation with bold motivational quotes"
  ],
  meme: [
    "Distorted surreal humor image with a confused cat",
    "Classic impact font style template of a person winning",
    "Deep-fried aesthetic of a common household object",
    "Wholesome drawing of a supportive animal friend",
    "Nihilistic abstract art for a relatable 3am thought"
  ]
};

type ModerationWaitResult = {
  status: "approved" | "rejected" | "timeout";
  reason?: string;
};

type ImageStudioRouteState = {
  prompt?: string;
  title?: string;
  style?: string;
  aspectRatio?: string;
  mode?: "image" | "meme";
  contentId?: string;
  resultImage?: string;
  caption?: string;
  hashtags?: string[];
  description?: string;
  status?: string;
  reason?: string;
};

const getModerationPayload = (
  payload: WebSocketEnvelope<ModerationCompletePayload>
): ModerationCompletePayload => payload.data ?? payload;

const getGenerationFailedPayload = (
  payload: WebSocketEnvelope<GenerationFailedPayload>
): GenerationFailedPayload => payload.data ?? payload;

const formatApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof AIError) {
    return err.message;
  }

  const apiError = err as Partial<ApiError>;
  const rawMessage = Array.isArray(apiError?.message)
    ? apiError.message.join(" ")
    : typeof apiError?.message === "string"
      ? apiError.message
      : fallback;

  return apiError?.correlationId
    ? `${rawMessage} (Correlation ID: ${apiError.correlationId})`
    : rawMessage;
};

export default function ImageStudio() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as ImageStudioRouteState | null;

  const STYLE_PRESETS = [
    { id: "realistic", label: t('image_studio.style_presets.realistic') },
    { id: "cinematic", label: t('image_studio.style_presets.cinematic') },
    { id: "cartoon", label: t('image_studio.style_presets.cartoon') },
    { id: "pixel_art", label: t('image_studio.style_presets.pixel_art', { defaultValue: "Pixel Art" }) },
    { id: "meme", label: t('image_studio.style_presets.meme') },
  ];
  const [mode, setMode] = useState<"image" | "meme">("image");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  useEffect(() => {
    if (routeState) {
      if (routeState.prompt) setPrompt(routeState.prompt);
      if (routeState.title) setTitle(routeState.title);
      if (routeState.style) setStyle(normalizeGenerateStyle(routeState.style));
      if (routeState.aspectRatio) setAspectRatio(routeState.aspectRatio);
      if (routeState.mode) setMode(routeState.mode);
    }
  }, [routeState]);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    refreshSuggestions();
  }, [style]);

  const refreshSuggestions = () => {
    const pool = STYLE_SPECIFIC_SUGGESTIONS[style] || SUGGESTION_POOL;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setActiveSuggestions(shuffled.slice(0, 8));
  };
  const [error, setError] = useState<string | null>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<unknown>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const fetchHistoryFromContentApi = async () => {
    setIsHistoryLoading(true);
    try {
      const contentList = await contentApi.getUserContentList();
      setHistoryError(null);
      if (Array.isArray(contentList) && contentList.length > 0) {
        const mappedItems: GenerationHistoryItem[] = contentList.map(item => {
          let itemTimestamp = Date.now();
          if (item && item.createdAt) {
            const parsedTime = new Date(item.createdAt).getTime();
            if (!isNaN(parsedTime)) {
              itemTimestamp = parsedTime;
            }
          }
          return {
            id: item?.id || Math.random().toString(),
            url: item?.thumbnailUrl || item?.cdnUrl || "",
            title: item?.title || "Untitled Creation",
            prompt: item?.title || item?.description || "",
            type: (item?.contentType as "image" | "meme") || "image",
            style: item?.description?.includes("Generated style:") 
              ? item.description.split("Generated style:")[1]?.split("with ratio:")[0]?.trim() || "cinematic"
              : "cinematic",
            timestamp: itemTimestamp,
            status: item?.status,
            reason: item?.reason || item?.moderationReason || item?.error,
            caption: item?.selectedCaption || item?.caption,
            hashtags: item?.selectedHashtags || item?.hashtags,
            description: item?.description,
          };
        });
        setHistory(mappedItems);
      } else {
        setHistory([]);
      }
    } catch (err) {
      // Live-only: surface the real failure instead of silently showing an empty/mock list.
      console.error("Failed to load history from Content API:", err);
      setHistoryError(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryFromContentApi();
  }, []);
  
  // Meme state
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [captionStyle, setCaptionStyle] = useState("impact");

  // Advanced state
  const [creativity, setCreativity] = useState([70]);
  const [lighting, setLighting] = useState("natural");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [caption, setCaption] = useState("");
  const [captionSuggestions, setCaptionSuggestions] = useState<string[]>([]);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [currentContentStatus, setCurrentContentStatus] = useState<string>("draft");
  const [moderationRejectionReason, setModerationRejectionReason] = useState<string | null>(null);
  const isRejectedRecovery = currentContentStatus === "moderation_rejected";
  const isGenerationFailed = currentContentStatus === "generation_failed" && !!currentContentId;
  const [generatedHashtags, setGeneratedHashtags] = useState<string[][]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRetryingGeneration, setIsRetryingGeneration] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Continue an existing draft handed off from the Content Library ("Continue editing").
  // Restores the generated image + draft metadata so the user can tweak and publish.
  useEffect(() => {
    const s = routeState;
    if (!s?.contentId) return;
    setCurrentContentId(s.contentId);
    setCurrentContentStatus(s.status || "draft");
    setModerationRejectionReason(s.status === "moderation_rejected" ? s.reason || null : null);
    if (s.resultImage) {
      setResultImage(s.resultImage);
      setVariations([s.resultImage]);
    }
    if (s.caption) setCaption(s.caption);
    if (Array.isArray(s.hashtags)) setSelectedHashtags(s.hashtags);
    if (s.description) setDescription(s.description);
    setIsPublished(false);
    setIsPublishing(false);
  }, [routeState]);

  const handleAddCustomTag = () => {
    const cleanTag = customTagInput.trim().replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanTag && !selectedHashtags.includes(cleanTag)) {
      setSelectedHashtags(prev => [...prev, cleanTag]);
    }
    setCustomTagInput("");
  };

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const applyGenerateResponse = async (apiResponse: GenerateContentResponse) => {
    const contentId = apiResponse.contentId || apiResponse.id || apiResponse.jobId;
    if (!contentId) {
      throw new Error("Failed to generate content: No content ID returned.");
    }

    setCurrentContentId(contentId);
    setCurrentContentStatus(apiResponse.status || "draft");
    setModerationRejectionReason(null);
    setIsPublished(false);
    setIsPublishing(false);

    if (apiResponse.status === "generation_failed") {
      const reason = apiResponse.reason || "Generation failed. Retry this backend content job to continue.";
      setError(reason);
      setResultImage(null);
      setVariations([]);
      return;
    }

    const img = apiResponse.imageUrl || apiResponse.cdnUrl || apiResponse.thumbnailUrl;
    if (!img) {
      throw new Error("API response did not contain an image payload.");
    }

    setResultImage(img);
    setVariations([img]);
    setError(null);
    setDescription("");

    if (apiResponse.captions) {
      setCaptionSuggestions(apiResponse.captions);
      setCaption(apiResponse.captions[0] || "");
    }
    if (apiResponse.hashtagSets) {
      setGeneratedHashtags(apiResponse.hashtagSets);
      setSelectedHashtags(apiResponse.hashtagSets[0] || []);
    }

    await fetchHistoryFromContentApi();
  };

  useEffect(() => {
    const unsubscribe = socketService.subscribe("content:generation_failed", (_event, payload) => {
      const data = getGenerationFailedPayload(payload as WebSocketEnvelope<GenerationFailedPayload>);
      if (!data.contentId || data.contentId !== currentContentId) return;

      const reason = data.reason || "Generation failed. Retry this backend content job to continue.";
      setCurrentContentStatus("generation_failed");
      setError(reason);
      setResultImage(null);
      setVariations([]);
      triggerHaptic("error");
      toast.error("Generation Failed", {
        description: reason,
      });
    });

    return unsubscribe;
  }, [currentContentId]);

  const handleGenerateTitle = async () => {
    if (!prompt) return;
    setIsGeneratingTitle(true);
    triggerHaptic('medium');
    try {
      const generatedTitle = await generateTitle(prompt);
      setTitle(generatedTitle);
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
      if (err instanceof AIError) {
        toast.error("Title Generation Failed", {
          description: err.message
        });
      } else {
        toast.error("Title Generation Failed", {
          description: "An unexpected error occurred while generating a title."
        });
      }
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt) return;
    executeActualGeneration();
  };

  const executeActualGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    triggerHaptic('heavy');
    
    const fullPrompt = mode === "meme" 
      ? `${prompt}. Meme format with top text: "${topText}" and bottom text: "${bottomText}"`
      : prompt;
    const targetPrompt = mode === "meme" ? fullPrompt : prompt;

    try {
      toast.info("Generating content from API...", {
        description: `Running inline generation request with style: ${normalizeGenerateStyle(style)}`
      });
      
      const requestStyle = mode === "meme" ? "meme" : normalizeGenerateStyle(style);
      const apiResponse = await contentApi.generateImage(targetPrompt, requestStyle, aspectRatio);
      await applyGenerateResponse(apiResponse);

      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      triggerHaptic('success');

      toast.success("Generation completed successfully!");
    } catch (err: unknown) {
      console.error(err);
      triggerHaptic('error');
      const errorMessage = formatApiErrorMessage(err, "Failed to generate image. Please try a different prompt.");

      if (err instanceof AIError) {
        toast.error("Image Generation Failed", {
          description: errorMessage,
          action: err.code === "RATE_LIMIT" ? {
            label: "Retry",
            onClick: () => handleGenerate()
          } : undefined
        });
      } else {
        toast.error("Image Generation Failed", {
          description: errorMessage
        });
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryGeneration = async () => {
    if (!currentContentId || currentContentStatus !== "generation_failed") {
      toast.error("No failed generation is available to retry.");
      return;
    }

    setIsRetryingGeneration(true);
    setError(null);
    triggerHaptic("medium");

    try {
      toast.info("Retrying generation...", {
        description: "Re-submitting the failed backend generation job."
      });
      const retryResponse = await contentApi.retryGeneration(currentContentId);
      await applyGenerateResponse(retryResponse);
      setCurrentContentStatus(retryResponse.status || "draft");
      triggerHaptic("success");
      toast.success("Generation retry completed.");
    } catch (err: unknown) {
      console.error(err);
      triggerHaptic("error");
      const errorMessage = formatApiErrorMessage(err, "Retry generation failed.");
      setCurrentContentStatus("generation_failed");
      setError(errorMessage);
      toast.error("Retry Generation Failed", {
        description: errorMessage
      });
    } finally {
      setIsRetryingGeneration(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!prompt) return;
    setIsGeneratingCaption(true);
    setCaptionSuggestions([]);
    triggerHaptic('medium');
    try {
      const caps = await generateCaptions(prompt);
      if (caps && caps.length > 0) {
        setCaptionSuggestions(caps.slice(0, 8));
        setCaption(caps[0]);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
      if (err instanceof AIError) {
        toast.error("Caption Generation Failed", {
          description: err.message
        });
      } else {
        toast.error("Caption Generation Failed", {
          description: "An unexpected error occurred while generating captions."
        });
      }
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  /**
   * Poll the real backend for the moderation/publish outcome after a publish call.
   * We poll GET /content/mine/{id} because the notification WebSocket may not be
   * reachable in a local-frontend -> cloud-gateway setup. Returns the last observed
   * status; never fabricates a "cleared" result.
   */
  const pollModerationStatus = async (contentId: string): Promise<string> => {
    const terminalStatuses = ["published", "moderation_rejected", "generation_failed", "deleted"];
    const maxAttempts = 10;
    const intervalMs = 3000;
    let lastStatus = "publishing";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const item = await contentApi.getMyContentById(contentId, { suppressErrorLog: true });
        lastStatus = item?.status || lastStatus;
        if (item?.status) {
          setCurrentContentStatus(item.status);
        }
        if (item?.status && terminalStatuses.includes(item.status)) {
          return item.status;
        }
      } catch {
        // Keep polling; transient failures shouldn't abort the wait.
      }
    }
    return lastStatus;
  };

  const waitForModerationSocket = (contentId: string, timeoutMs = 30000): Promise<ModerationWaitResult> => {
    socketService.init();

    return new Promise((resolve) => {
      let settled = false;
      let unsubscribe: () => void = () => undefined;
      const timer = window.setTimeout(() => {
        if (settled) return;
        unsubscribe();
        resolve({ status: "timeout" });
      }, timeoutMs);

      unsubscribe = socketService.subscribe("content:moderation_complete", (_event, payload) => {
        const data = getModerationPayload(payload as WebSocketEnvelope<ModerationCompletePayload>);
        if (data.contentId !== contentId) return;

        settled = true;
        window.clearTimeout(timer);
        unsubscribe();
        resolve({ status: data.status, reason: data.reason });
      });
    });
  };

  const handlePublish = async () => {
    if (!currentContentId) {
      toast.error("No active image to publish.");
      return;
    }
    
    setIsPublishing(true);
    triggerHaptic('medium');

    try {
      toast.info("Submitting draft to content moderation...", {
        description: currentContentStatus === "moderation_rejected"
          ? "Saving moderation fixes before re-submitting."
          : "Checking content safety and feed projection."
      });

      if (currentContentStatus === "moderation_rejected") {
        await contentApi.editContent(currentContentId, {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        });
        setCurrentContentStatus("draft");
        setModerationRejectionReason(null);
      }

      // Backend publish DTO is strict (whitelist): only title/caption/hashtags/description.
      const publishResponse = await contentApi.publish(currentContentId, {
        title,
        caption,
        hashtags: selectedHashtags,
        description,
      }) as PublishContentResponse;

      const publishedContentId = publishResponse?.contentId || currentContentId;
      setCurrentContentStatus(publishResponse?.status || "publishing");

      toast.loading("Awaiting safety moderation clearance...", {
        id: "publish-moderation"
      });

      const socketResult = await waitForModerationSocket(publishedContentId);
      const finalStatus = socketResult.status === "approved"
        ? "moderation_approved"
        : socketResult.status === "rejected"
          ? "moderation_rejected"
          : await pollModerationStatus(publishedContentId);

      // Reflect the real library state regardless of outcome.
      await fetchHistoryFromContentApi();

      if (finalStatus === "published") {
        toast.success("Moderation cleared! Content is live on your feed.", {
          id: "publish-moderation"
        });
        triggerHaptic('success');
        setIsPublished(true);
        setCurrentContentStatus("published");
        setIsPublishModalOpen(false);
        setShowSuccessModal(true);
      } else if (finalStatus === "moderation_approved") {
        toast.success("Moderation approved.", {
          id: "publish-moderation",
          description: "Feed projection is still publishing; the library will show the final live status once complete."
        });
        triggerHaptic('success');
        setCurrentContentStatus("publishing");
        setModerationRejectionReason(null);
        setIsPublishModalOpen(false);
      } else if (finalStatus === "moderation_rejected") {
        toast.error("Content was rejected by moderation.", {
          id: "publish-moderation",
          description: "Edit the title or description, then publish again."
        });
        triggerHaptic('error');
        setCurrentContentStatus("moderation_rejected");
        setModerationRejectionReason(socketResult.reason || "Moderation rejected this post. Update the title or description, then re-publish.");
      } else {
        // Still publishing after the polling window — honest, not a fake "cleared".
        toast.info("Submitted for moderation.", {
          id: "publish-moderation",
          description: "Your post is still being reviewed and will appear on your feed once approved."
        });
        setCurrentContentStatus(finalStatus);
        setIsPublishModalOpen(false);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = formatApiErrorMessage(err, "An unexpected error occurred during publication.");
      toast.error("Publishing Failed", {
        description: errorMessage,
        id: "publish-moderation"
      });
      triggerHaptic('error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleReuseGeneration = (item: GenerationHistoryItem) => {
    setPrompt(item.prompt);
    setTitle(item.title || "");
    setStyle(normalizeGenerateStyle(item.style));
    setCurrentContentStatus(item.status || "draft");
    setModerationRejectionReason(item.status === "moderation_rejected" ? item.reason || "Moderation rejected this post. Update the title or description, then re-publish." : null);
    setCaption(item.caption || "");
    setDescription(item.description || "");
    if (Array.isArray(item.hashtags)) {
      setSelectedHashtags(item.hashtags);
    }
    if (item.status === "generation_failed") {
      setError(item.reason || "Generation failed. Retry this backend content job to continue.");
      setResultImage(null);
      setVariations([]);
    } else {
      setError(null);
    }
    if (item.type) {
      setMode(item.type as "image" | "meme");
    }
    if (item.url && item.status !== "generation_failed") {
      setResultImage(item.url);
    }
    if (item.id) {
      setCurrentContentId(item.id);
    }
    setIsPublished(false);
    setIsPublishing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexaclip-gen-${Date.now()}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = async () => {
    try {
      // Loop through history items and delete them via Content API
      for (const item of history) {
        if (item.id) {
          await contentApi.deleteContent(item.id);
        }
      }
      setHistory([]);
      toast.success("History cleared successfully!");
    } catch (err) {
      console.error("Failed to clear history via Content API:", err);
      toast.error("Failed to clear history completely");
      // Fallback: clear local state
      setHistory([]);
    }
    setIsConfirmClearOpen(false);
  };

  return (
    <div className={cn("space-y-8", isRTL && "rtl")}>
      <SEO 
        title={t('image_studio.seo_title')}
        description={t('image_studio.seo_description')}
      />
      <div className="lg:hidden mb-4">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">{t('image_studio.tabs.generate')}</TabsTrigger>
            <TabsTrigger value="canvas">{t('image_studio.tabs.canvas')}</TabsTrigger>
            <TabsTrigger value="edit">{t('image_studio.tabs.edit')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="mt-4 space-y-4">
            {/* Mobile Generate Panel */}
            <GeneratePanel 
              mode={mode} setMode={setMode}
              prompt={prompt} setPrompt={setPrompt}
              title={title} setTitle={setTitle}
              isGeneratingTitle={isGeneratingTitle}
              handleGenerateTitle={handleGenerateTitle}
              style={style} setStyle={setStyle}
              aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
              isGenerating={isGenerating}
              handleGenerate={handleGenerate}
              activeSuggestions={activeSuggestions}
              refreshSuggestions={refreshSuggestions}
              STYLE_PRESETS={STYLE_PRESETS}
              handleSuggestionClick={handleSuggestionClick}
              setIsQuickEditOpen={setIsQuickEditOpen}
              topText={topText} setTopText={setTopText}
              bottomText={bottomText} setBottomText={setBottomText}
              captionStyle={captionStyle} setCaptionStyle={setCaptionStyle}
              creativity={creativity} setCreativity={setCreativity}
              lighting={lighting} setLighting={setLighting}
              negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
              caption={caption} setCaption={setCaption}
              isGeneratingCaption={isGeneratingCaption}
              handleGenerateCaption={handleGenerateCaption}
              captionSuggestions={captionSuggestions}
              resultImage={resultImage}
              history={history}
              handleReuseGeneration={handleReuseGeneration}
              setIsConfirmClearOpen={setIsConfirmClearOpen}
            />
          </TabsContent>

          <TabsContent value="canvas" className="mt-4 space-y-4">
            {/* Mobile Canvas Panel */}
            <CanvasPanel 
              resultImage={resultImage}
              aspectRatio={aspectRatio}
              isGenerating={isGenerating}
              error={error}
              handleGenerate={handleGenerate}
              handleRetryGeneration={handleRetryGeneration}
              handleDownload={handleDownload}
              variations={variations}
              setResultImage={setResultImage}
              brightness={brightness} setBrightness={setBrightness}
              contrast={contrast} setContrast={setContrast}
              saturation={saturation} setSaturation={setSaturation}
              onPublishClick={() => setIsPublishModalOpen(true)}
              isPublishing={isPublishing}
              isPublished={isPublished}
              isGenerationFailed={isGenerationFailed}
              isRetryingGeneration={isRetryingGeneration}
            />
          </TabsContent>

          <TabsContent value="edit" className="mt-4 space-y-4">
            {/* Mobile Edit Panel */}
            <EditPanel 
              resultImage={resultImage}
              brightness={brightness} setBrightness={setBrightness}
              contrast={contrast} setContrast={setContrast}
              saturation={saturation} setSaturation={setSaturation}
              onPublishClick={() => setIsPublishModalOpen(true)}
              isPublishing={isPublishing}
              isPublished={isPublished}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:flex flex-row h-[calc(100vh-140px)] gap-4 overflow-hidden">
        {/* LEFT PANEL - Controls */}
        <GeneratePanel 
          mode={mode} setMode={setMode}
          prompt={prompt} setPrompt={setPrompt}
          title={title} setTitle={setTitle}
          isGeneratingTitle={isGeneratingTitle}
          handleGenerateTitle={handleGenerateTitle}
          style={style} setStyle={setStyle}
          aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
          isGenerating={isGenerating}
          handleGenerate={handleGenerate}
          activeSuggestions={activeSuggestions}
          refreshSuggestions={refreshSuggestions}
          STYLE_PRESETS={STYLE_PRESETS}
          handleSuggestionClick={handleSuggestionClick}
          setIsQuickEditOpen={setIsQuickEditOpen}
          topText={topText} setTopText={setTopText}
          bottomText={bottomText} setBottomText={setBottomText}
          captionStyle={captionStyle} setCaptionStyle={setCaptionStyle}
          creativity={creativity} setCreativity={setCreativity}
          lighting={lighting} setLighting={setLighting}
          negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
          caption={caption} setCaption={setCaption}
          isGeneratingCaption={isGeneratingCaption}
          handleGenerateCaption={handleGenerateCaption}
          captionSuggestions={captionSuggestions}
          resultImage={resultImage}
          history={history}
          handleReuseGeneration={handleReuseGeneration}
          setIsConfirmClearOpen={setIsConfirmClearOpen}
          className="w-80 h-full"
        />

        {/* CENTER PANEL - Canvas */}
        <CanvasPanel 
          resultImage={resultImage}
          aspectRatio={aspectRatio}
          isGenerating={isGenerating}
          error={error}
          handleGenerate={handleGenerate}
          handleRetryGeneration={handleRetryGeneration}
          handleDownload={handleDownload}
          variations={variations}
          setResultImage={setResultImage}
          brightness={brightness} setBrightness={setBrightness}
          contrast={contrast} setContrast={setContrast}
          saturation={saturation} setSaturation={setSaturation}
          onPublishClick={() => setIsPublishModalOpen(true)}
          isPublishing={isPublishing}
          isPublished={isPublished}
          isGenerationFailed={isGenerationFailed}
          isRetryingGeneration={isRetryingGeneration}
        />

        {/* RIGHT PANEL - Studio Tools */}
        <EditPanel 
          resultImage={resultImage} 
          brightness={brightness} setBrightness={setBrightness}
          contrast={contrast} setContrast={setContrast}
          saturation={saturation} setSaturation={setSaturation}
          onPublishClick={() => setIsPublishModalOpen(true)}
          isPublishing={isPublishing}
          isPublished={isPublished}
          className="w-72" 
        />
      </div>

      <div className="mt-8">
        <Accordion className="w-full">
          <AccordionItem value="history" className="border-border bg-card/30 rounded-lg px-8 overflow-hidden shadow-xl backdrop-blur-md">
            <AccordionTrigger className="hover:no-underline py-6 group/trigger">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover/trigger:scale-110">
                    <History size={24} />
                  </div>
                  <div className={cn(isRTL ? "text-right" : "text-left")}>
                    <h4 className="text-lg font-display font-bold text-foreground">{t('image_studio.history.title')}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">{t('image_studio.history.subtitle')}</p>
                  </div>
                </div>
                {history.length > 0 && (
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-mono">
                    {history.length} ITEMS
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {historyError
                      ? "Couldn't load your content library."
                      : `Loaded ${history.length} item${history.length === 1 ? "" : "s"} from your content library.`}
                  </p>
                  {history.length > 0 && !historyError && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmClearOpen(true)}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 uppercase tracking-wider"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {historyError ? (
                    <ErrorState
                      className="col-span-full"
                      error={historyError}
                      title="Couldn't load your creations"
                      onRetry={fetchHistoryFromContentApi}
                    />
                  ) : isHistoryLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-xs text-muted-foreground">Loading your content library…</p>
                    </div>
                  ) : history.length === 0 ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg bg-muted/10">
                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h5 className="text-sm font-bold text-foreground mb-1">No generations yet</h5>
                        <p className="text-xs text-muted-foreground">Start creating above to build your history.</p>
                      </div>
                  ) : (
                    history.map((item, i) => (
                      <motion.div 
                        key={item.timestamp || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleReuseGeneration(item)}
                        className="group/hist relative flex flex-col p-4 rounded-lg bg-background/40 border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                      >
                        <div className="flex gap-4 mb-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-border relative group/thumb">
                            <AuthenticatedImage 
                              src={item.url} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="absolute inset-0 bg-popover/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResultImage(item.url);
                                }}
                              >
                                <Maximize2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-foreground line-clamp-1 mb-0.5">
                                  {item.title || "Untitled Creation"}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="secondary" className="w-fit text-[8px] h-4 px-1 uppercase tracking-tighter">
                                    {item.style}
                                  </Badge>
                                  <Badge variant="outline" className="w-fit text-[8px] h-4 px-1 uppercase tracking-tighter border-primary/30 text-primary">
                                    {item.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-[11px] text-foreground/80 line-clamp-3 italic leading-relaxed">
                              "{item.prompt}"
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 text-[10px] gap-2 font-bold uppercase tracking-wider"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReuseGeneration(item);
                            }}
                          >
                            <RefreshCw size={14} />
                            Reuse Prompt
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 text-[10px] gap-2 font-bold uppercase tracking-wider"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.url);
                            }}
                          >
                            <Download size={14} />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* QUICK EDIT OVERLAY */}
      <AnimatePresence>
        {isQuickEditOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Refine Prompt</h2>
                    <p className="text-sm text-muted-foreground">Focus on the details of your vision.</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsQuickEditOpen(false)}
                  className="rounded-full hover:bg-foreground/5 animate-none"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Textarea 
                    className={cn(
                      "min-h-[300px] text-lg bg-muted/30 border-border/50 focus:border-primary/50 transition-all resize-none p-6",
                      prompt.length > 2000 && "border-red-500 focus:border-red-500 ring-red-500/20"
                    )}
                    placeholder="Describe your vision in detail..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-6">
                    <span className={cn(
                      "text-xs font-mono transition-colors",
                      prompt.length > 2000 ? "text-red-500 font-bold" : 
                      prompt.length >= 1800 ? "text-amber-500" : 
                      "text-muted-foreground"
                    )}>
                      {prompt.length}/2000
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsQuickEditOpen(false)}>Cancel</Button>
                  <Button variant="brand-gradient" className="px-8" onClick={() => setIsQuickEditOpen(false)}>
                    Apply Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLEAR HISTORY CONFIRMATION */}
      <AnimatePresence>
        {isConfirmClearOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass p-8 rounded-xl border border-border shadow-2xl"
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Clear History?</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                This will permanently delete these creations through the Content API. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsConfirmClearOpen(false)}>Cancel</Button>
                <Button variant="destructive" className="font-bold" onClick={clearHistory}>
                  Clear Everything
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PUBLISH TO FEED MODAL */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge variant="brand-gradient" className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    JOURNEY A
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">
                    {isRejectedRecovery ? "Fix & Re-publish" : "Publish to Feed"}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsPublishModalOpen(false)}
                  className="rounded-full h-8 w-8 hover:bg-foreground/5 animate-none"
                  disabled={isPublishing}
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {isRejectedRecovery && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.8)]" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Moderation rejected</p>
                        <p className="text-sm text-red-100/80 leading-relaxed">
                          {moderationRejectionReason || "Update the title or description, then save and re-publish this draft."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Thumbnail column */}
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preview</Label>
                    {resultImage && (
                      <div className="aspect-square rounded-xl overflow-hidden border border-border relative bg-muted group">
                        <AuthenticatedImage 
                          src={resultImage} 
                          alt="Publish preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {aspectRatio} • Draft
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form fields column */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="publish-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Post Title</Label>
                      <Input 
                        id="publish-title"
                        placeholder="Give your masterpiece a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all text-sm h-10"
                        disabled={isPublishing}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="publish-caption" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Caption</Label>
                      <Textarea 
                        id="publish-caption"
                        placeholder="What's on your mind?"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="min-h-[100px] bg-muted/30 border-border/50 focus:border-primary/50 transition-all text-sm resize-none"
                        disabled={isPublishing}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="publish-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
                      <Textarea 
                        id="publish-description"
                        placeholder="Provide an in-depth description or comments on your creation..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] bg-muted/30 border-border/50 focus:border-primary/50 transition-all text-sm resize-none"
                        disabled={isPublishing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hashtags / Tags</Label>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/20 border border-border/50 rounded-lg min-h-[40px] items-center">
                        {selectedHashtags.length === 0 ? (
                          <span className="text-xs text-muted-foreground px-1">No hashtags selected. Select AI suggestions below or add custom tags.</span>
                        ) : (
                          selectedHashtags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] font-mono py-0.5 px-2 flex items-center gap-1 border border-primary/15 bg-primary/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all cursor-pointer group animate-none"
                              onClick={() => setSelectedHashtags(prev => prev.filter(t => t !== tag))}
                              title="Click to remove"
                            >
                              #{tag}
                              <X size={8} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                            </Badge>
                          ))
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold">#</span>
                          <Input
                            placeholder="Add custom tag (press Enter or comma)..."
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                handleAddCustomTag();
                              }
                            }}
                            className="pl-6 bg-muted/30 border-border/50 focus:border-primary/50 transition-all text-xs h-9"
                            disabled={isPublishing}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAddCustomTag}
                          className="h-9 px-3 border border-border/50"
                          disabled={isPublishing || !customTagInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions Section */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <h4 className="text-sm font-bold text-foreground">AI Creative Suggestions</h4>
                  </div>

                  {/* Caption Suggestions */}
                  {captionSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Select AI Suggested Caption</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {captionSuggestions.slice(0, 3).map((suggestion, idx) => {
                          const isSelected = caption === suggestion;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCaption(suggestion)}
                              className={cn(
                                "text-left p-3 rounded-lg border text-xs leading-relaxed transition-all",
                                isSelected 
                                  ? "bg-primary/5 border-primary text-foreground shadow-sm shadow-primary/10" 
                                  : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                              disabled={isPublishing}
                            >
                              {suggestion}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hashtag Set Suggestions */}
                  {generatedHashtags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Select AI Suggested Hashtag Set</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {generatedHashtags.slice(0, 3).map((hashSet, idx) => {
                          const isSelected = JSON.stringify(selectedHashtags) === JSON.stringify(hashSet);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedHashtags(hashSet)}
                              className={cn(
                                "text-left p-3 rounded-lg border transition-all flex flex-wrap gap-1.5 items-center",
                                isSelected 
                                  ? "bg-primary/5 border-primary shadow-sm shadow-primary/10" 
                                  : "bg-muted/20 border-border/40 hover:bg-muted/40"
                              )}
                              disabled={isPublishing}
                            >
                              <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider mr-2",
                                isSelected ? "text-primary" : "text-muted-foreground"
                              )}>
                                Set {idx + 1}
                              </span>
                              {hashSet.map((tag, tIdx) => (
                                <span 
                                  key={tIdx}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-mono",
                                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={isPublishing}
                >
                  Cancel
                </Button>
                <Button 
                  variant="brand-gradient" 
                  className="px-6 font-bold"
                  onClick={handlePublish}
                  disabled={isPublishing || !title.trim()}
                >
                  {isPublishing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                      {isRejectedRecovery ? "Saving..." : "Publishing..."}
                    </>
                  ) : (
                    isRejectedRecovery ? "Save & Re-publish" : "Publish Content"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PUBLICATION SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-md bg-card border border-emerald-500/20 rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-left"
            >
              {/* Outer Glow behind check */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="p-6 text-center space-y-6 relative z-10">
                {/* Glowing Check Circle Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CheckCircle2 size={36} className="text-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-display text-foreground">Content Published Successfully!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Your creation is cleared by safety moderation and is now live on the creator network feed.
                  </p>
                </div>

                {/* Published Asset Summary Card */}
                <div className="p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center gap-4 text-left">
                  {resultImage && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                      <AuthenticatedImage 
                        src={resultImage} 
                        alt="Published thumbnail" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">LIVE POST</span>
                    <h4 className="text-sm font-bold text-foreground truncate">{title || "Untitled Creation"}</h4>
                    {caption && (
                      <p className="text-xs text-muted-foreground truncate">{caption}</p>
                    )}
                    {selectedHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedHashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[8px] font-mono text-primary bg-primary/5 px-1 rounded border border-primary/10">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation and Action buttons */}
                <div className="space-y-2.5 pt-2">
                  <Button 
                    variant="brand-gradient" 
                    className="w-full font-bold h-11"
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate("/feed");
                    }}
                  >
                    View on Community Feed
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="border-border/60 hover:bg-muted/50 font-bold h-10 text-xs"
                      onClick={() => {
                        setShowSuccessModal(false);
                        navigate("/my-content");
                      }}
                    >
                      My Content Library
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="hover:bg-foreground/5 font-bold h-10 text-xs"
                      onClick={() => setShowSuccessModal(false)}
                    >
                      Keep Creating
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
