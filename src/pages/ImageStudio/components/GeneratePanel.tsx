import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings2, Sparkles, Loader2, Maximize2, X, Zap, RefreshCw, 
  Type as TypeIcon, Square, RectangleHorizontal, RectangleVertical, 
  Check 
} from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Separator } from "../../../components/ui/separator";
import { Slider } from "../../../components/ui/slider";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { cn } from "../../../lib/utils";
import { GeneratePanelProps } from "../types";
import { ScrollableSuggestions } from "./ScrollableSuggestions";

const GAMING_KEYWORDS = [
  "cyberpunk", "ray tracing", "unreal engine 5", "pixel art", "low poly", "voxel art", 
  "sci-fi", "dark fantasy", "retro arcade", "mech suit", "neon glow", "esports arena", 
  "speedrun", "synthwave", "battle royale", "isometric", "holographic HUD", "open world", 
  "dungeon crawler", "gamer setup", "rgb lighting", "rpg quest", "boss fight", "space marine",
  "cybernetic", "virtual reality", "survival game", "stealth", "chibi gamer", "retro platformer",
  "alien colony", "post-apocalyptic", "steampunk", "mech hangar", "fantasy castle", "magical forest",
  "high fps", "raytraced shadows", "retro gaming", "mech warrior", "boss arena", "co-op quest"
];

export function GeneratePanel({ 
  mode, setMode, prompt, setPrompt, title, setTitle, isGeneratingTitle, handleGenerateTitle, style, setStyle, aspectRatio, setAspectRatio,
  isGenerating, handleGenerate, 
  activeSuggestions, refreshSuggestions, STYLE_PRESETS, 
  handleSuggestionClick, setIsQuickEditOpen,
  topText, setTopText, bottomText, setBottomText, captionStyle, setCaptionStyle,
  creativity, setCreativity, lighting, setLighting, negativePrompt, setNegativePrompt,
  caption, setCaption, isGeneratingCaption, handleGenerateCaption, resultImage,
  captionSuggestions,
  history,
  handleReuseGeneration,
  setIsConfirmClearOpen,
  className 
}: GeneratePanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const [tagSuggestions, setTagSuggestions] = React.useState<string[]>([]);
  const [activeWordIsHash, setActiveWordIsHash] = React.useState(false);

  React.useEffect(() => {
    const lastWhitespaceIdx = Math.max(prompt.lastIndexOf(" "), prompt.lastIndexOf("\n"));
    const lastWord = lastWhitespaceIdx === -1 ? prompt : prompt.slice(lastWhitespaceIdx + 1);

    if (!lastWord) {
      setTagSuggestions([]);
      return;
    }

    const isHash = lastWord.startsWith("#");
    const searchWord = (isHash ? lastWord.slice(1) : lastWord).toLowerCase();

    if (searchWord.length >= 1) {
      const filtered = GAMING_KEYWORDS.filter(kw => 
        kw.toLowerCase().startsWith(searchWord) && 
        kw.toLowerCase() !== searchWord
      );
      setTagSuggestions(filtered.slice(0, 5));
      setActiveWordIsHash(isHash);
    } else {
      setTagSuggestions([]);
    }
  }, [prompt]);

  const handleTagSuggestSelect = (tag: string) => {
    const lastWhitespaceIdx = Math.max(prompt.lastIndexOf(" "), prompt.lastIndexOf("\n"));
    const lastWord = lastWhitespaceIdx === -1 ? prompt : prompt.slice(lastWhitespaceIdx + 1);
    const isHash = lastWord.startsWith("#");
    const insertVal = isHash ? `#${tag}` : tag;
    
    if (lastWhitespaceIdx === -1) {
      setPrompt(insertVal + " ");
    } else {
      setPrompt(prompt.slice(0, lastWhitespaceIdx + 1) + insertVal + " ");
    }
  };

  return (
    <Card className={cn("flex flex-col border-border glass shrink-0 h-full overflow-hidden", isRTL && "rtl", className)}>
      <ScrollArea className={cn("flex-1 min-h-0", isRTL && "text-right")}>
        <div className="p-4 space-y-6">
          {/* Mode & Model Selection */}
          <div className="space-y-4">
            <div className={cn("flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg w-fit", isRTL && "flex-row-reverse")}>
              <Settings2 size={10} className="text-primary" />
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t('image_studio.config.title')}</Label>
            </div>
            
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <div className={cn("flex items-center gap-2 ml-1", isRTL && "flex-row-reverse")}>
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t('image_studio.config.mode_label')}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help"><Sparkles size={8} className="text-primary/50" /></div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      {t('image_studio.config.mode_tooltip')}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "image" | "meme")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="image" className="text-[10px]">{t('common.create_image')}</TabsTrigger>
                    <TabsTrigger value="meme" className="text-[10px]">{t('common.create_meme')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-3">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('image_studio.title_input.label')}</Label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-6 text-[8px] font-bold uppercase gap-1.5 text-primary hover:bg-primary/10", isRTL && "flex-row-reverse")}
                    onClick={handleGenerateTitle}
                    disabled={isGeneratingTitle || !prompt}
                  >
                    {isGeneratingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {t('image_studio.title_input.ai_suggest')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('image_studio.title_input.tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <Input 
              placeholder={t('image_studio.title_input.placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn("h-9 text-xs bg-muted/30 border-border/50 focus:border-primary/50", isRTL && "text-right")}
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('image_studio.prompt.label')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsQuickEditOpen(true)}
                      className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                    >
                      <Maximize2 size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.edit.tabs.adjust')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="relative">
              <Textarea 
                placeholder={t('image_studio.prompt.placeholder')}
                className={cn(
                  "min-h-[120px] resize-none bg-muted/30 border-border/50 focus:border-primary/50 outline-none transition-all text-foreground placeholder:text-muted-foreground/50 text-sm p-4",
                  prompt.length > 2000 && "border-red-500 focus:border-red-500 ring-red-500/20",
                  isRTL && "text-right"
                )}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {prompt && (
                <button 
                  onClick={() => setPrompt("")}
                  className={cn("absolute top-2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-foreground/10", isRTL ? "left-2" : "right-2")}
                  title={t('image_studio.prompt.clear')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* GAMING TAG SUGGESTER TRAY */}
            <AnimatePresence>
              {tagSuggestions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={10} className="text-primary animate-pulse" />
                        Gaming Keywords
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground bg-white/5 px-1 rounded">
                        suggester
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {tagSuggestions.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all text-[10px] py-0.5 px-2 font-mono font-medium border border-white/5 rounded"
                          onClick={() => handleTagSuggestSelect(tag)}
                        >
                          {activeWordIsHash ? `#${tag}` : tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={cn("flex px-1", isRTL ? "justify-start" : "justify-end")}>
              <span className={cn(
                "text-[10px] font-mono transition-colors",
                prompt.length > 2000 ? "text-red-500 font-bold" : 
                prompt.length >= 1800 ? "text-amber-500" : 
                "text-muted-foreground"
              )}>
                {prompt.length}/2000
              </span>
            </div>

            {/* Recent History Segment */}
            {history.length > 0 && (
              <div className="space-y-3">
                <div className={cn("flex items-center justify-between px-1", isRTL && "flex-row-reverse")}>
                  <Label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('image_studio.recent_prompts.label')}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 text-muted-foreground hover:text-red-400"
                        onClick={() => setIsConfirmClearOpen(true)}
                      >
                        <X size={10} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t('image_studio.recent_prompts.tooltip')}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <div 
                      key={item.id || item.timestamp} 
                      onClick={() => handleReuseGeneration(item)}
                      className={cn("p-2 rounded-md bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all group", isRTL && "text-right")}
                    >
                      <p className="text-[10px] text-foreground/70 line-clamp-2 group-hover:text-foreground">
                        {item.prompt}
                      </p>
                      <div className={cn("flex items-center justify-between mt-1.5", isRTL && "flex-row-reverse")}>
                        <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/20 text-primary/70 lowercase font-medium">
                          {item.style}
                        </Badge>
                        <RefreshCw size={8} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className={cn("flex items-center justify-between px-1", isRTL && "flex-row-reverse")}>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('image_studio.prompt.suggested', { style })}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  onClick={refreshSuggestions}
                >
                  <RefreshCw size={10} className={cn(isGenerating && "animate-spin")} />
                </Button>
              </div>
              <ScrollableSuggestions 
                items={activeSuggestions} 
                onSelect={handleSuggestionClick} 
                truncateLimit={15}
              />
            </div>
          </div>

          {/* Caption Input */}
          <Accordion className="w-full border-none">
            <AccordionItem value="caption" className="border-none">
              <AccordionTrigger className={cn("hover:no-underline py-2 group", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                  <Sparkles className="h-3 w-3 text-primary group-hover:animate-pulse" />
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground cursor-pointer group-hover:text-primary transition-colors">{t('image_studio.caption_studio.title')}</Label>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1 space-y-4">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <span className="text-[9px] font-medium text-muted-foreground italic">{t('image_studio.caption_studio.description')}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("h-6 text-[8px] font-bold uppercase gap-1.5 text-primary hover:bg-primary/10", isRTL && "flex-row-reverse")}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateCaption();
                          }}
                          disabled={isGeneratingCaption || !prompt || !resultImage}
                        >
                          {isGeneratingCaption ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          {t('image_studio.caption_studio.ai_generate')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('image_studio.caption_studio.tooltip')}
                      </TooltipContent>
                    </Tooltip>
                </div>
                <Textarea 
                  placeholder={t('image_studio.caption_studio.placeholder')}
                  className={cn("min-h-[80px] resize-none bg-muted/30 border-border/50 focus:border-primary/50 outline-none transition-all text-foreground placeholder:text-muted-foreground/50 text-xs p-3", isRTL && "text-right")}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                {captionSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className={cn("flex items-center gap-1.5 ml-1", isRTL && "flex-row-reverse mr-1 ml-0")}>
                      <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t('image_studio.caption_studio.ai_suggestions_label')}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help"><Sparkles size={8} className="text-primary/50" /></div>
                        </TooltipTrigger>
                        <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.caption_studio.tooltip')}</TooltipContent>
                      </Tooltip>
                    </div>
                    <ScrollableSuggestions 
                      items={captionSuggestions} 
                      onSelect={setCaption} 
                      selectedValue={caption}
                      truncateLimit={20}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Meme Inputs */}
          <AnimatePresence>
            {mode === "meme" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <Separator className="bg-border/50" />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className={cn("flex items-center justify-between px-1", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                          <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t('image_studio.meme.top_text')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help"><TypeIcon size={8} className="text-muted-foreground/50" /></div>
                            </TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.meme.style_tooltip')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className={cn(
                          "text-[9px] font-mono transition-colors",
                          topText.length >= 45 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {topText.length}/50
                        </span>
                      </div>
                      <Input 
                        placeholder={t('image_studio.meme.top_placeholder')} 
                        value={topText}
                        onChange={(e) => setTopText(e.target.value.slice(0, 50))}
                        className={cn("h-9 text-xs bg-muted/30 border-border/50 rounded-lg focus:border-primary/50", isRTL && "text-right")}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className={cn("flex items-center justify-between px-1", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                          <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t('image_studio.meme.bottom_text')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help"><TypeIcon size={8} className="text-muted-foreground/50" /></div>
                            </TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.meme.style_tooltip')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className={cn(
                          "text-[9px] font-mono transition-colors",
                          bottomText.length >= 45 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {bottomText.length}/50
                        </span>
                      </div>
                      <Input 
                        placeholder={t('image_studio.meme.bottom_placeholder')} 
                        value={bottomText}
                        onChange={(e) => setBottomText(e.target.value.slice(0, 50))}
                        className={cn("h-9 text-xs bg-muted/30 border-border/50 rounded-lg focus:border-primary/50", isRTL && "text-right")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className={cn("flex items-center gap-1.5 ml-1", isRTL && "flex-row-reverse mr-1 ml-0")}>
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t('image_studio.meme.style_label')}</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help"><Settings2 size={8} className="text-muted-foreground/50" /></div>
                          </TooltipTrigger>
                          <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.meme.style_tooltip')}</TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={captionStyle} onValueChange={setCaptionStyle}>
                        <SelectTrigger className={cn("h-9 text-xs bg-muted/30 border-border/50 rounded-lg", isRTL && "flex-row-reverse")}>
                          <SelectValue placeholder={t('image_studio.meme.style_label')} />
                        </SelectTrigger>
                        <SelectContent className={isRTL ? "text-right" : ""}>
                          <SelectItem value="impact">{t('image_studio.meme.styles.impact')}</SelectItem>
                          <SelectItem value="modern">{t('image_studio.meme.styles.modern')}</SelectItem>
                          <SelectItem value="classic">{t('image_studio.meme.styles.classic')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Accordion className="w-full space-y-2">
            {/* Aspect Ratio Accordion */}
            <AccordionItem value="aspect-ratio" className="border-none">
              <AccordionTrigger className={cn("py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:no-underline", isRTL && "flex-row-reverse")}>
                {t('image_studio.aspect_ratio.title')}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 px-1">
                  {[
                    { id: "1:1", label: "1:1", key: "square", icon: <Square className="h-3 w-3" /> },
                    { id: "16:9", label: "16:9", key: "widescreen", icon: <RectangleHorizontal className="h-3 w-3" /> },
                    { id: "9:16", label: "9:16", key: "social", icon: <RectangleVertical className="h-3 w-3" /> },
                  ].map((ratio) => (
                      <Tooltip key={ratio.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={aspectRatio === ratio.id ? "default" : "outline"}
                            className={cn(
                              "h-12 flex flex-row items-center justify-start gap-2.5 px-2 bg-muted/20 border-border/50 transition-all",
                              aspectRatio === ratio.id && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]",
                              isRTL && "flex-row-reverse"
                            )}
                            onClick={() => setAspectRatio(ratio.id)}
                          >
                            <div className={cn(
                              "shrink-0 p-1.5 rounded-md",
                              aspectRatio === ratio.id ? "bg-primary-foreground/20" : "bg-muted/40"
                            )}>
                              {ratio.icon}
                            </div>
                            <div className={cn("flex flex-col items-start gap-0.5 leading-none", isRTL && "items-end")}>
                              <span className="text-[9px] font-bold tracking-tight">{ratio.label}</span>
                              <span className="text-[7px] opacity-70 font-medium truncate w-full text-left">{t(`image_studio.aspect_ratio.presets.${ratio.key}`)}</span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t(`image_studio.aspect_ratio.presets.${ratio.key}`)} ({ratio.label})</TooltipContent>
                      </Tooltip>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Style Presets Accordion */}
            <AccordionItem value="styles" className="border-none">
              <AccordionTrigger className={cn("py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:no-underline", isRTL && "flex-row-reverse")}>
                {t('image_studio.style_presets.title')}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 px-1">
                  {STYLE_PRESETS.map((p) => (
                    <Tooltip key={p.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-20 flex flex-col gap-2 text-[10px] p-1 overflow-hidden group/preset relative border-border/50 bg-muted/20",
                            style === p.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          )}
                          onClick={() => setStyle(p.id)}
                        >
                          <div className={cn(
                            "w-full h-10 rounded-md overflow-hidden relative flex items-center justify-center border border-white/5",
                            p.id === "realistic" ? "bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-background" :
                            p.id === "cinematic" ? "bg-gradient-to-br from-amber-900/40 via-purple-900/30 to-background" :
                            p.id === "cartoon" ? "bg-gradient-to-br from-pink-900/40 via-rose-900/30 to-background" :
                            p.id === "thumbnail" ? "bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-background" :
                            "bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-background"
                          )}>
                            <Sparkles className="w-4 h-4 text-primary/70 group-hover/preset:scale-110 transition-transform" />
                            {style === p.id && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "font-bold transition-colors uppercase tracking-wider",
                            style === p.id ? "text-primary" : "text-muted-foreground group-hover/preset:text-foreground"
                          )}>
                            {p.label}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">
                        {t('image_studio.style_presets.tooltip', { label: p.label })}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Advanced Controls */}
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className={cn("py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:no-underline", isRTL && "flex-row-reverse")}>
                {t('image_studio.advanced.title')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 px-1">
                <div className="space-y-3">
                  <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                      <Label className="text-[10px] font-bold text-foreground/70">{t('image_studio.advanced.creativity')}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help"><Sparkles size={8} className="text-primary/50" /></div>
                        </TooltipTrigger>
                        <TooltipContent side={isRTL ? "left" : "right"} className="max-w-[200px]">
                          {t('image_studio.advanced.creativity_tooltip')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{creativity[0]}%</span>
                  </div>
                  <Slider 
                    value={creativity} 
                    onValueChange={(val: number[]) => {
                      setCreativity(val);
                    }} 
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    max={100} 
                    step={1} 
                  />
                </div>
                <div className="space-y-2">
                  <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse mr-1 ml-0")}>
                    <Label className="text-[10px] font-bold text-foreground/70">{t('image_studio.advanced.lighting')}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help"><Sparkles size={8} className="text-primary/50" /></div>
                      </TooltipTrigger>
                      <TooltipContent side={isRTL ? "left" : "right"}>
                        {t('image_studio.advanced.lighting_tooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={lighting} onValueChange={setLighting}>
                    <SelectTrigger className={cn("h-9 text-[10px] bg-muted/30 border-border/50", isRTL && "flex-row-reverse")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isRTL ? "text-right" : ""}>
                      <SelectItem value="natural" className="text-[10px]">{t('image_studio.advanced.lighting_options.natural')}</SelectItem>
                      <SelectItem value="neon" className="text-[10px]">{t('image_studio.advanced.lighting_options.neon')}</SelectItem>
                      <SelectItem value="golden" className="text-[10px]">{t('image_studio.advanced.lighting_options.golden')}</SelectItem>
                      <SelectItem value="dramatic" className="text-[10px]">{t('image_studio.advanced.lighting_options.dramatic')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse mr-1 ml-0")}>
                    <Label className="text-[10px] font-bold text-foreground/70">{t('image_studio.advanced.negative')}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help"><Sparkles size={8} className="text-primary/50" /></div>
                      </TooltipTrigger>
                      <TooltipContent side={isRTL ? "left" : "right"} className="max-w-[200px]">
                        {t('image_studio.advanced.negative_tooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    placeholder={t('image_studio.advanced.negative_placeholder')} 
                    className={cn("h-9 text-[10px] bg-muted/30 border-border/50", isRTL && "text-right")}
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 shrink-0 bg-background/80 backdrop-blur-sm space-y-3">
        <Button 
          variant="brand-gradient"
          className={cn(
            "w-full font-bold shadow-lg transition-all shadow-primary/20",
            isRTL && "flex-row-reverse"
          )}
          onClick={handleGenerate}
          disabled={isGenerating || !prompt || prompt.length > 2000}
        >
          {isGenerating ? (
            <>
              <Loader2 className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4 animate-spin")} />
              {t('image_studio.buttons.generating')}
            </>
          ) : (
            <>
              <Zap className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4 fill-current")} />
              {t('image_studio.buttons.generate')}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
