import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { 
  Image as ImageIcon, Sparkles, X, Download, Copy, RefreshCw, Plus, Check 
} from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";
import { CanvasPanelProps } from "../types";

export function CanvasPanel({ 
  resultImage, isGenerating, error, handleGenerate, handleDownload, variations: _variations, setResultImage: _setResultImage,
  brightness, setBrightness: _setBrightness, contrast, setContrast: _setContrast, saturation, setSaturation: _setSaturation, aspectRatio,
  onPublishClick, isPublishing, isPublished, isGenerationFailed, isRetryingGeneration, handleRetryGeneration
}: CanvasPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "aspect-video";
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-square";
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
      <Card className="flex-1 flex flex-col relative overflow-hidden glass border-border group min-h-[400px] h-full">
        {/* Background Glow & Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute inset-0 dots-pattern opacity-[0.15] pointer-events-none" />

        <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center p-4 md:p-6">
          <AnimatePresence mode="wait">
            {!resultImage && !isGenerating && !error && !isGenerationFailed ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center max-w-md my-auto"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-8">
                  {/* Animated background rings */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                  />
                  <motion.div 
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute inset-0 rounded-full bg-secondary/20 blur-xl"
                  />
                  
                  {/* Center Icon */}
                  <div className="relative h-full w-full rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                    <div className="relative">
                      <ImageIcon className="h-10 w-10 md:h-12 md:w-12 text-foreground/20" />
                      <motion.div 
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-2 -right-2"
                      >
                        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary/20" />
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{t('image_studio.canvas.ready_to_create')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('image_studio.canvas.ready_desc')}
                </p>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "w-full max-w-lg rounded-2xl bg-muted/30 border border-border/50 flex flex-col items-center justify-center gap-6 my-auto",
                  getAspectRatioClass(aspectRatio)
                )}
              >
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-display font-bold text-foreground">{t('image_studio.canvas.generating')}</h4>
                  <p className="text-xs text-muted-foreground animate-pulse">{t('image_studio.canvas.crafting')}</p>
                </div>
              </motion.div>
            ) : error || isGenerationFailed ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center max-w-md p-8 rounded-lg bg-destructive/10 border border-destructive/20 my-auto"
              >
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center text-destructive mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{t('image_studio.canvas.failed')}</h3>
                <p className="text-sm text-destructive/80 mb-6">
                  {error || "Generation failed. Retry this backend content job to continue."}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {isGenerationFailed && (
                    <Button 
                      variant="brand-gradient" 
                      onClick={handleRetryGeneration}
                      disabled={isRetryingGeneration}
                    >
                      {isRetryingGeneration ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                          Retrying...
                        </>
                      ) : (
                        "Retry generation"
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleGenerate}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    disabled={isRetryingGeneration}
                  >
                    {t('image_studio.canvas.try_again')}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md md:max-w-lg flex flex-col gap-3 my-auto"
              >
                <div className={cn(
                  "relative w-full group/img max-h-[50vh] md:max-h-[55vh] flex items-center justify-center overflow-hidden rounded-lg",
                  getAspectRatioClass(aspectRatio)
                )}>
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl opacity-50 group-hover/img:opacity-100 transition-opacity duration-500" />
                  <AuthenticatedImage 
                    src={resultImage!} 
                    alt="Generated" 
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                    className="w-full h-full object-contain rounded-lg border border-border/50 shadow-2xl relative z-10"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating Overlay Actions */}
                  <div className={cn(
                    "absolute top-3 flex items-center gap-2 z-20 opacity-100 transition-opacity",
                    isRTL ? "left-3" : "right-3"
                  )}>
                    <Button 
                      size="sm" 
                      variant="brand-gradient" 
                      className="h-8 px-3 gap-1.5 rounded-full shadow-xl font-bold text-xs"
                      onClick={onPublishClick}
                      disabled={isPublishing || isPublished}
                    >
                      {isPublishing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : isPublished ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Publish to Feed</span>
                        </>
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg glass border-border/10" onClick={() => handleDownload(resultImage!)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('image_studio.history.download')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-8 w-8 rounded-full shadow-lg glass border-border/10"
                          onClick={() => {
                            navigator.clipboard.writeText(resultImage!);
                            toast.success("Image URL copied to clipboard!");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Image URL</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Canvas Footer Actions - Always Sticky & Visible */}
        {resultImage && !isGenerating && (
          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0 flex flex-wrap justify-center items-center gap-3 relative z-30 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-bold" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4" />
                  {t('image_studio.buttons.regenerate')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Generate a new image with the same prompt.</TooltipContent>
            </Tooltip>
            
            <Button 
              variant="brand-gradient"
              size="sm" 
              className="gap-2 h-9 px-5 text-xs font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={onPublishClick}
              disabled={isPublishing || isPublished}
            >
              {isPublishing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : isPublished ? (
                <>
                  <Check className="h-4 w-4" />
                  Published!
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Publish to Feed
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
