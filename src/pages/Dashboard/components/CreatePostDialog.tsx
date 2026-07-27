import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "../../../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../../../components/ui/tooltip";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Slider } from "../../../components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { 
  Type, 
  Scissors, 
  Wand2, 
  X, 
  Plus,
  Check,
  Sparkles,
  Loader2,
  Calendar,
  User,
  AlertCircle,
  Search,
  Music,
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../../lib/utils";
import { GoogleGenAI, Type as GeminiType } from "@google/genai";
import { ContentPlanItem } from "../../../types";

interface PlanInput {
  games: string;
  audience: string;
  contentType: string;
  goal: string;
  frequency: string;
}

const DEFAULT_PLAN_INPUT: PlanInput = {
  games: "Valorant, Minecraft",
  audience: "Gen Z gamers, competitive players",
  contentType: "Short-form clips, long-form tutorials",
  goal: "Increase engagement and follower growth",
  frequency: "Daily",
};

interface CreatePostDialogProps {
  onPost: (post: { 
    content: string; 
    media: string | null; 
    mediaType: "image" | "video" | null;
    tags: string[]; 
    trim?: [number, number] 
  }) => void;
}

const FILTERS = [
  { name: "None", filter: "none" },
  { name: "Grayscale", filter: "grayscale(100%)" },
  { name: "Sepia", filter: "sepia(100%)" },
  { name: "Invert", filter: "invert(100%)" },
  { name: "High Contrast", filter: "contrast(150%)" },
  { name: "Warm", filter: "sepia(30%) saturate(150%)" },
  { name: "Cool", filter: "hue-rotate(180deg) saturate(120%)" },
];

export default function CreatePostDialog({ onPost }: CreatePostDialogProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [activeFilter, setActiveFilter] = useState("none");
  const [overlayText, setOverlayText] = useState("");
  const [trimRange, setTrimRange] = useState([0, 100]);
  const [duration, setDuration] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentPlanItem[] | null>(null);
  const [planInput, setPlanInput] = useState<PlanInput>(DEFAULT_PLAN_INPUT);
  const [activeTab, setActiveTab] = useState("filters");
  const [mainTab, setMainTab] = useState("single");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateAICaption = async () => {
    if (!media) return;
    setIsGenerating(true);
    setCaptionError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let mediaPart;
      if (mediaType === "image") {
        // Since 'media' is a blob URL from URL.createObjectURL, we need to fetch it and convert to base64
        const response = await fetch(media);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const base64 = await base64Promise;
        mediaPart = {
          inlineData: {
            mimeType: blob.type,
            data: base64.split(",")[1],
          },
        };
      } else if (mediaType === "video" && videoRef.current) {
        // Capture a frame from the video
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          mediaPart = {
            inlineData: {
              mimeType: "image/jpeg",
              data: dataUrl.split(",")[1],
            },
          };
        }
      }

      const prompt = "You are a professional gaming content creator. Based on this media, suggest a catchy caption and 3-5 relevant hashtags. Return the response in JSON format with 'caption' and 'hashtags' (as an array) fields.";
      
      const parts = mediaPart ? [mediaPart, { text: prompt }] : [{ text: prompt }];

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GeminiType.OBJECT,
            properties: {
              caption: { type: GeminiType.STRING },
              hashtags: { 
                type: GeminiType.ARRAY,
                items: { type: GeminiType.STRING }
              }
            },
            required: ["caption", "hashtags"]
          }
        }
      });

      const data = JSON.parse(result.text);
      setContent(data.caption);
      setTagsInput(data.hashtags.join(", "));
    } catch (error) {
      console.error("AI Generation Error:", error);
      setCaptionError("Failed to generate caption. Please check your connection or try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIPlan = async () => {
    setIsGeneratingPlan(true);
    setPlanError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert social media strategist for gaming creators. Create a highly effective 7-day content plan for a creator based on these details:
      - Games: ${planInput.games}
      - Audience: ${planInput.audience}
      - Content Type: ${planInput.contentType}
      - Goal: ${planInput.goal}
      - Posting Frequency: ${planInput.frequency}

      For each day, provide:
      1. 'day': (1-7)
      2. 'title': A catchy name for that day's content
      3. 'description': Detailed plan for what to create and post
      4. 'hashtags': 3-5 relevant hashtags

      Return the response as a JSON array of objects.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GeminiType.ARRAY,
            items: {
              type: GeminiType.OBJECT,
              properties: {
                day: { type: GeminiType.INTEGER },
                title: { type: GeminiType.STRING },
                description: { type: GeminiType.STRING },
                hashtags: { 
                  type: GeminiType.ARRAY,
                  items: { type: GeminiType.STRING }
                }
              },
              required: ["day", "title", "description", "hashtags"]
            }
          }
        }
      });

      const data = JSON.parse(result.text);
      setContentPlan(data);
    } catch (error) {
      console.error("AI Plan Generation Error:", error);
      setPlanError("Strategy generation failed. Please review your inputs and try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMedia(url);
      const type = file.type.startsWith("video") ? "video" : "image";
      setMediaType(type);
      setTrimRange([0, 100]);
      setDuration(0);
      // Reset active tab only if it was 'trim' and we switched to 'image'
      if (type === "image" && activeTab === "trim") {
        setActiveTab("filters");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && mediaType === "video") {
      const duration = videoRef.current.duration;
      if (isNaN(duration)) return;

      const startTime = (trimRange[0] / 100) * duration;
      const endTime = (trimRange[1] / 100) * duration;

      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime > endTime) {
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const handleTrimChange = (val: number[]) => {
    setTrimRange(val);
    if (videoRef.current && mediaType === "video") {
      const duration = videoRef.current.duration;
      if (!isNaN(duration)) {
        videoRef.current.currentTime = (val[0] / 100) * duration;
      }
    }
  };

  const handlePost = () => {
    const tags = tagsInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag !== "")
      .map(tag => tag.startsWith("#") ? tag : `#${tag}`);
    
    onPost({ 
      content, 
      media, 
      mediaType,
      tags, 
      trim: mediaType === "video" ? [trimRange[0], trimRange[1]] : undefined 
    });
    setIsOpen(false);
    // Reset state
    setContent("");
    setTagsInput("");
    setMedia(null);
    setMediaType(null);
    setActiveFilter("none");
    setOverlayText("");
    setTrimRange([0, 100]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-md font-bold px-6">{t('dashboard.header.post_button')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 premium-card border-none bg-background/80 backdrop-blur-3xl">
        <div className={cn(
          "flex h-full flex-col md:flex-row divide-border/50",
          isAr ? "md:divide-x-reverse md:divide-x" : "md:divide-x"
        )}>
          {/* Left Column: Editor Controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-2 border-b border-border bg-card/30 backdrop-blur-xl">
              <DialogTitle className="text-xl font-display font-bold flex items-center gap-2 mb-2">
                <div className="ui-icon-chip-primary w-8 h-8">
                  <Sparkles size={16} />
                </div>
                {t('create_post.title')}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t('create_post.title')}
              </DialogDescription>
              
              <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                <TabsList aria-label="Creation modes" className="bg-muted/50 p-1 rounded-full w-fit">
                  <TabsTrigger value="single" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold">{t('create_post.tabs.single')}</TabsTrigger>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger value="plan" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold flex items-center gap-2">
                          <Calendar size={14} />
                          {t('create_post.tabs.plan')}
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[250px] text-xs">
                        {t('create_post.plan_tooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TabsList>
              </Tabs>
            </DialogHeader>

            <ScrollArea className="flex-grow p-6">
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsContent value="single" className="mt-0 space-y-6">
              {/* AI Generation Error Message */}
              {captionError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3"
                >
                  <AlertCircle className="text-destructive shrink-0" size={16} />
                  <div className="space-y-1">
                    <p className={cn(
                      "text-[11px] font-bold text-destructive leading-none",
                      isAr ? "tracking-normal" : "tracking-wider"
                    )}>{t('create_post.ai.error_title')}</p>
                    <p className="text-[11px] text-destructive/80 leading-relaxed font-medium">{captionError}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 ml-auto shrink-0 text-destructive hover:bg-destructive/10" 
                    onClick={() => setCaptionError(null)}
                  >
                    <X size={12} />
                  </Button>
                </motion.div>
              )}

              {/* Content Area */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="post-content" className={cn(
                      "text-[10px] font-bold text-muted-foreground uppercase leading-none",
                      isAr ? "tracking-normal" : "tracking-widest"
                    )}>
                      {t('create_post.labels.caption')}
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateAICaption} 
                      disabled={isGenerating || !media}
                      className={cn(
                        "h-7 text-[9px] font-bold text-primary hover:bg-primary/10 gap-1.5",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {content ? t('create_post.ai.regenerate') : t('create_post.ai.generate')}
                    </Button>
                  </div>
                  <Textarea
                    id="post-content"
                    placeholder={t('create_post.placeholders.caption')}
                    className="min-h-[100px] resize-none border-border focus-visible:ring-primary rounded-lg"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-tags" className={cn(
                    "text-[10px] font-bold text-muted-foreground leading-none",
                    isAr ? "tracking-normal" : "tracking-widest"
                  )}>
                    {t('create_post.labels.tags')}
                  </Label>
                  <Input
                    id="post-tags"
                    placeholder={t('create_post.placeholders.tags')}
                    className="border-border focus-visible:ring-primary h-11 rounded-lg"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Media Area */}
              <div className="space-y-4">
                <Label className={cn(
                  "text-[10px] font-bold text-muted-foreground leading-none",
                  isAr ? "tracking-normal" : "tracking-widest"
                )}>
                  {t('create_post.labels.media')}
                </Label>
                
                {!media ? (
                  <div 
                    role="button"
                    tabIndex={0}
                    aria-label={t('create_post.placeholders.upload')}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2 ring-offset-background"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <Plus className="text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{t('create_post.placeholders.upload')}</p>
                      <p className="text-xs text-muted-foreground">{t('create_post.placeholders.upload_sub')}</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Preview with Enhancements */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-card group shadow-2xl">
                      {mediaType === "image" ? (
                        <img 
                          src={media} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                          style={{ filter: activeFilter }}
                        />
                      ) : (
                        <video 
                          ref={videoRef}
                          src={media} 
                          className="w-full h-full object-contain"
                          style={{ filter: activeFilter }}
                          controls
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          autoPlay
                          loop
                          muted
                        />
                      )}

                      {/* Text Overlay Preview */}
                      {overlayText && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <motion.span 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            role="text"
                            aria-label={`Overlay text: ${overlayText}`}
                            className="text-white font-display font-black text-3xl md:text-5xl tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] px-4 text-center"
                          >
                            {overlayText}
                          </motion.span>
                        </div>
                      )}

                      <Button 
                        variant="destructive" 
                        size="icon" 
                        aria-label="Remove media"
                        className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 focus-visible:opacity-100"
                        onClick={() => setMedia(null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    {/* Enhancement Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList aria-label="Enhancement tools" className="grid w-full grid-cols-3 bg-muted/80 p-1.5 rounded-lg border border-border/50">
                        <TabsTrigger value="filters" className="gap-2 text-[10px] font-bold rounded-lg data-[state=active]:bg-card shadow-sm">
                          <Wand2 size={13} />
                          {t('create_post.tools.filters')}
                        </TabsTrigger>
                        <TabsTrigger value="text" className="gap-2 text-[10px] font-bold rounded-lg data-[state=active]:bg-card shadow-sm">
                          <Type size={13} />
                          {t('create_post.tools.text')}
                        </TabsTrigger>
                        <TabsTrigger value="trim" className="gap-2 text-[10px] font-bold rounded-lg data-[state=active]:bg-card shadow-sm" disabled={mediaType !== "video"}>
                          <Scissors size={13} />
                          {t('create_post.tools.trim')}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="filters" className="pt-5 translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2">
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                          <div className="flex gap-4 p-1">
                            {FILTERS.map((f) => (
                              <button
                                key={f.name}
                                onClick={() => setActiveFilter(f.filter)}
                                aria-label={`Apply ${f.name} filter`}
                                aria-pressed={activeFilter === f.filter}
                                className={cn(
                                  "flex flex-col items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1",
                                  activeFilter === f.filter ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                <div className={cn(
                                  "size-16 rounded-lg overflow-hidden border-2 transition-all duration-300 bg-card",
                                  activeFilter === f.filter ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-border/60 group-hover:border-primary/40 group-hover:scale-105"
                                )}>
                                  <div 
                                    className="w-full h-full bg-muted"
                                    style={{ filter: f.filter }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold tracking-widest uppercase">{t(`create_post.tools.filters_list.${f.name.toLowerCase().replace(' ', '_')}`)}</span>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="text" className="pt-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor="overlay-text" className="text-[10px] font-bold tracking-widest text-muted-foreground">
                            {t('create_post.labels.overlay_text')}
                          </Label>
                          <Input 
                            id="overlay-text"
                            placeholder={t('create_post.placeholders.overlay')}
                            value={overlayText}
                            onChange={(e) => setOverlayText(e.target.value)}
                            className="border-border focus-visible:ring-primary rounded-lg h-11"
                          />
                        </div>
                      </TabsContent>

                        <TabsContent value="trim" className="pt-5 space-y-6 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="trim-slider" className="text-[10px] font-bold tracking-widest text-muted-foreground">
                                {t('create_post.labels.trim_range')}
                              </Label>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded", isAr && "dir-ltr")}>
                                  {formatTime((trimRange[0] / 100) * duration)} - {formatTime((trimRange[1] / 100) * duration)}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({Math.round(((trimRange[1] - trimRange[0]) / 100) * duration)}s)
                                </span>
                              </div>
                            </div>
                            <Slider 
                              id="trim-slider"
                              value={trimRange}
                              min={0}
                              max={100}
                              step={0.1}
                              onValueChange={(val) => handleTrimChange(Array.isArray(val) ? [...val] : [val])}
                              className="py-4"
                            />
                            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/40">
                              <p className="text-[10px] text-muted-foreground">
                                {t('create_post.tools.trim_hint')}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleTrimChange([0, 100])}
                                className="h-6 text-[9px] font-bold tracking-widest hover:bg-primary/10 text-primary"
                              >
                                {t('create_post.tools.reset_range')}
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plan" className="mt-0 space-y-6">
              <div className="space-y-6">
                {/* AI Plan Error Message */}
                {planError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="text-destructive shrink-0" size={18} />
                    <div className="space-y-1">
                      <p className={cn(
                        "text-xs font-bold text-destructive leading-none",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.ai.error_title')}</p>
                      <p className="text-[11px] text-destructive/80 leading-relaxed font-medium">{planError}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 ml-auto shrink-0 text-destructive hover:bg-destructive/10" 
                      onClick={() => setPlanError(null)}
                    >
                      <X size={14} />
                    </Button>
                  </motion.div>
                )}

                <div className="p-5 premium-card bg-primary/5 border-primary/20 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="ui-icon-chip-primary w-10 h-10 shadow-lg shadow-primary/20">
                      <Wand2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-foreground">{t('create_post.ai.strategist')}</h3>
                      <p className={cn(
                        "text-[10px] text-muted-foreground font-bold",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.ai.strategist_sub')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={cn(
                        "text-[9px] font-bold text-muted-foreground",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.labels.target_games')}</Label>
                      <Input 
                        value={planInput.games}
                        onChange={(e) => setPlanInput({...planInput, games: e.target.value})}
                        placeholder={t('create_post.placeholders.games')}
                        className="h-9 text-xs rounded-lg border-border/50 bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={cn(
                        "text-[9px] font-bold text-muted-foreground",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.labels.target_audience')}</Label>
                      <Input 
                        value={planInput.audience}
                        onChange={(e) => setPlanInput({...planInput, audience: e.target.value})}
                        placeholder={t('create_post.placeholders.audience')}
                        className="h-9 text-xs rounded-lg border-border/50 bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={cn(
                        "text-[9px] font-bold text-muted-foreground",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.labels.content_style')}</Label>
                      <Input 
                        value={planInput.contentType}
                        onChange={(e) => setPlanInput({...planInput, contentType: e.target.value})}
                        placeholder={t('create_post.placeholders.style')}
                        className="h-9 text-xs rounded-lg border-border/50 bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={cn(
                        "text-[9px] font-bold text-muted-foreground",
                        isAr ? "tracking-normal" : "tracking-widest"
                      )}>{t('create_post.labels.primary_goal')}</Label>
                      <Input 
                        value={planInput.goal}
                        onChange={(e) => setPlanInput({...planInput, goal: e.target.value})}
                        placeholder={t('create_post.placeholders.goal')}
                        className="h-9 text-xs rounded-lg border-border/50 bg-background/50"
                      />
                    </div>
                  </div>

                  <Button 
                    variant="brand"
                    onClick={generateAIPlan}
                    disabled={isGeneratingPlan}
                    className={cn(
                      "w-full h-11 font-bold text-xs",
                      isAr ? "tracking-normal" : "tracking-widest"
                    )}
                  >
                    {isGeneratingPlan ? (
                      <>
                        <Loader2 className={cn("h-4 w-4 animate-spin", isAr ? "ml-2" : "mr-2")} />
                        {t('create_post.ai.analyzing')}
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className={cn(isAr ? "ml-2" : "mr-2")} />
                        {t('create_post.ai.gen_plan')}
                      </>
                    )}
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {contentPlan ? (
                    <motion.div 
                      key="plan-results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pb-4"
                    >
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Calendar size={14} className="text-primary" />
                          {t('create_post.ai.personalized_strategy')}
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setContentPlan(null)} className={cn(
                          "h-7 text-[9px] font-bold",
                          isAr ? "tracking-normal" : "tracking-widest"
                        )}>{t('create_post.tools.reset_range')}</Button>
                      </div>
                      
                      <div className="space-y-3">
                        {contentPlan.map((item, idx) => (
                          <motion.div
                            key={item.day}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="ui-card p-4 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="ui-icon-chip-primary w-8 h-8 text-[10px] font-bold flex-shrink-0">
                                D{item.day}
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-[13px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{item.title}</h5>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                  {item.hashtags.map((tag: string, i: number) => (
                                    <span key={i} className="text-[9px] font-bold text-muted-foreground/60 tracking-widest">
                                      #{tag.replace('#', '')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : !isGeneratingPlan && (
                    <motion.div 
                      key="empty-plan"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 flex flex-col items-center justify-center text-center px-8 border-2 border-dashed border-border/40 premium-card bg-muted/20"
                    >
                      <div className="ui-icon-chip-primary size-16 mb-4">
                        <Calendar size={32} />
                      </div>
                      <p className="text-sm font-bold text-foreground mb-1">{t('create_post.ai.empty_plan')}</p>
                      <p className="text-xs text-muted-foreground">{t('create_post.ai.empty_plan_sub')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-border bg-card/10 backdrop-blur-xl flex-shrink-0">
          <div className="flex w-full items-center justify-end gap-3">
            {mainTab === "single" ? (
              <>
                <Button variant="ghost" onClick={() => setIsOpen(false)} className={cn(
                  "font-bold uppercase text-[10px] h-9 px-6",
                  isAr ? "tracking-normal" : "tracking-widest"
                )}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handlePost} 
                  disabled={!content && !media}
                  className={cn(
                    "font-bold uppercase text-[10px] h-9 px-8 bg-foreground text-background hover:opacity-90 transition-all shadow-xl shadow-foreground/10",
                    isAr ? "tracking-normal" : "tracking-widest"
                  )}
                >
                  <Check size={14} className={isAr ? "ml-2" : "mr-2"} strokeWidth={3} />
                  {t('common.post_now')}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contrast" 
                  onClick={() => setIsOpen(false)} 
                  className="font-bold uppercase tracking-widest text-[10px] h-9 px-8 shadow-xl shadow-foreground/10"
                >
                  <Check size={14} className="ms-2" strokeWidth={3} />
                  {t('create_post.ai.strategy_ready')}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </div>

      {/* Right Column: Live Feed Preview */}
      <div className="hidden md:flex w-[380px] bg-muted/20 items-center justify-center p-8 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-brand-secondary/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative w-full max-w-[280px] aspect-[9/17.5] bg-black rounded-[40px] border-[8px] border-black shadow-2xl overflow-hidden ring-1 ring-white/10">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30">
            <div className={cn("flex gap-4", isAr && "flex-row-reverse")}>
              <span className="text-[11px] font-bold text-white/50">{t('create_post.preview.following')}</span>
              <span className="text-[11px] font-black text-white border-b-2 border-white pb-1">{t('create_post.preview.for_you')}</span>
            </div>
            <Search size={16} className="text-white" />
          </div>

          <div className="absolute inset-0 bg-black">
            {media ? (
              <div className="w-full h-full relative">
                {mediaType === "video" ? (
                  <video 
                    ref={videoRef}
                    src={media} 
                    className="w-full h-full object-cover"
                    style={{ filter: activeFilter }}
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img 
                    src={media} 
                    className="w-full h-full object-cover"
                    style={{ filter: activeFilter }}
                    alt="Preview"
                  />
                )}
                
                {overlayText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 px-6">
                    <span className="text-white font-display font-black text-2xl tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] text-center animate-in zoom-in-95 duration-300">
                      {overlayText}
                    </span>
                  </div>
                )}

                {/* Right side interactions */}
                <div className={cn("absolute bottom-24 flex flex-col items-center gap-4 z-30", isAr ? "left-3" : "right-3")}>
                  <div className="w-10 h-10 rounded-full border-2 border-white/80 bg-muted/20 flex items-center justify-center overflow-hidden relative shadow-lg">
                    <User size={20} className="text-white" />
                    <div className="absolute -bottom-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                       <Plus size={10} strokeWidth={4} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles size={26} className="text-white opacity-90 drop-shadow-lg" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">11.2K</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Type size={26} className="text-white opacity-90 drop-shadow-lg" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">482</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white drop-shadow-lg hover:bg-transparent">
                    <Calendar size={26} className="opacity-90" />
                  </Button>
                </div>

                {/* Bottom content info */}
                <div className={cn("absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20", isAr ? "text-right" : "text-left")}>
                  <div className={cn("space-y-1.5", isAr ? "mr-auto" : "max-w-[85%]")}>
                    <p className={cn("text-[13px] font-bold text-white flex items-center gap-1.5 mb-1", isAr && "flex-row-reverse")}>
                      @nxclip_ai
                      <Check size={10} className="bg-primary text-primary-foreground rounded-full p-0.5" />
                    </p>
                    <p className="text-[11px] text-white/95 leading-[1.3] line-clamp-3">
                      {content || t('create_post.preview.connect_media')}
                    </p>
                    <div className={cn("flex flex-wrap gap-1", isAr && "flex-row-reverse")}>
                      {tagsInput.split(",").map((tag, i) => tag.trim() && (
                        <span key={i} className={cn("text-[10px] font-bold text-primary", isAr ? "ml-1" : "mr-1")}>
                          {tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`}
                        </span>
                      ))}
                    </div>
                    <div className={cn("flex items-center gap-2 pt-1", isAr && "flex-row-reverse")}>
                       <Music size={10} className="text-white/80 animate-spin" style={{ animationDuration: '4s' }} />
                       <span className="text-[9px] text-white/80 font-medium whitespace-nowrap overflow-hidden">
                          Original Sound - nxclip.ai - Pulse of Gamers
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
                   <Plus size={32} />
                </div>
                <p className={cn(
                  "text-[10px] font-black text-white/20 uppercase leading-relaxed",
                  isAr ? "tracking-normal" : "tracking-widest"
                )}>
                  {t('create_post.preview.connect_media')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Status Info */}
        <div className="mt-6 w-full max-w-[280px]">
           <div className="px-4 py-3 bg-card border border-border rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                 <BrainCircuit size={16} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-foreground">{t('create_post.preview.polish_active')}</p>
                 <p className="text-[9px] text-muted-foreground">{t('create_post.preview.polish_sub')}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  </DialogContent>
    </Dialog>
  );
}
