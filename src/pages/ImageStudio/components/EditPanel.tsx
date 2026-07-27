import React from "react";
import { useTranslation } from "react-i18next";
import { 
  Settings2, Plus, Check, History 
} from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Slider } from "../../../components/ui/slider";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { EditPanelProps } from "../types";

export function EditPanel({ 
  resultImage, brightness, setBrightness, contrast, setContrast, saturation, setSaturation, 
  onPublishClick, isPublishing, isPublished, className 
}: EditPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  return (
    <Card className={cn("flex flex-col border-border glass shrink-0", className, isRTL ? "direction-rtl" : "direction-ltr")}>
      <Tabs defaultValue="adjust" className="flex-1 flex flex-col">
        <div className="p-2 border-b border-border/50">
          <TabsList className="grid w-full grid-cols-1 h-9">
            <TabsTrigger value="adjust" className="text-[10px] font-bold">{t('image_studio.edit.tabs.adjust')}</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-4">
            <TabsContent value="adjust" className="m-0 space-y-6">
              <div className="space-y-4">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('image_studio.edit.adjustments')}</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[8px] font-bold uppercase"
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}
                  >
                    {t('image_studio.canvas.reset')}
                  </Button>
                </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className={cn("flex justify-between items-center group/lt", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                          <Label className="text-[10px] font-bold">{t('image_studio.canvas.brightness')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help"><Settings2 size={8} className="text-muted-foreground/50" /></div>
                            </TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.edit.brightness_tooltip')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{brightness}%</span>
                      </div>
                      <Slider 
                        value={[brightness]} 
                        onValueChange={(v: number | number[]) => {
                          const val = Array.isArray(v) ? v[0] : v;
                          if (typeof val === 'number') setBrightness(val);
                        }} 
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        min={0} max={200} step={1} 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className={cn("flex justify-between items-center group/lt", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                          <Label className="text-[10px] font-bold">{t('image_studio.canvas.contrast')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help"><Settings2 size={8} className="text-muted-foreground/50" /></div>
                            </TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.edit.contrast_tooltip')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{contrast}%</span>
                      </div>
                      <Slider 
                        value={[contrast]} 
                        onValueChange={(v: number | number[]) => {
                          const val = Array.isArray(v) ? v[0] : v;
                          if (typeof val === 'number') setContrast(val);
                        }} 
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        min={0} max={200} step={1} 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className={cn("flex justify-between items-center group/lt", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                          <Label className="text-[10px] font-bold">{t('image_studio.canvas.saturation')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help"><Settings2 size={8} className="text-muted-foreground/50" /></div>
                            </TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>{t('image_studio.edit.saturation_tooltip')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{saturation}%</span>
                      </div>
                      <Slider 
                        value={[saturation]} 
                        onValueChange={(v: number | number[]) => {
                          const val = Array.isArray(v) ? v[0] : v;
                          if (typeof val === 'number') setSaturation(val);
                        }} 
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        min={0} max={200} step={1} 
                      />
                    </div>
                  </div>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 space-y-2">
          {resultImage && (
            <Button 
              variant="brand-gradient" 
              className={cn("w-full text-xs gap-2 h-9 font-bold shadow-lg shadow-primary/20", isRTL && "flex-row-reverse")}
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
          )}
          <Button variant="secondary" className={cn("w-full text-xs gap-2 h-9 font-bold", isRTL && "flex-row-reverse")}>
            <History className="h-3 w-3" />
            {t('image_studio.edit.view_history')}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}
