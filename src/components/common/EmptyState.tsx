import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Clock, 
  Flame, 
  Layers, 
  LucideIcon,
  Zap,
  ArrowRight
} from "lucide-react";

export type EmptyStateVariant = "posts" | "plan" | "scheduled" | "trending" | "insights" | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  badge?: string;
  className?: string;
}

const VARIANT_CONFIGS: Record<EmptyStateVariant, {
  icon: LucideIcon;
  badge: string;
  gradient: string;
  glow: string;
  iconColor: string;
}> = {
  posts: {
    icon: Layers,
    badge: "Content Library Empty",
    gradient: "from-primary/20 via-primary/5 to-transparent",
    glow: "bg-primary/20",
    iconColor: "text-primary",
  },
  plan: {
    icon: Calendar,
    badge: "Calendar Clear",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    glow: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  scheduled: {
    icon: Clock,
    badge: "No Queue",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    glow: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  trending: {
    icon: Flame,
    badge: "Trends Sync Required",
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    glow: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
  insights: {
    icon: Sparkles,
    badge: "Analytics Pending",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    glow: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  generic: {
    icon: Zap,
    badge: "No Data",
    gradient: "from-primary/20 via-primary/5 to-transparent",
    glow: "bg-primary/20",
    iconColor: "text-primary",
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = "generic",
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  badge,
  className
}) => {
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.generic;
  const IconComponent = CustomIcon || config.icon;
  const displayBadge = badge || config.badge;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-8 md:p-12 text-center flex flex-col items-center justify-center transition-all duration-300",
      className
    )}>
      {/* Background ambient glow effect */}
      <div className={cn("absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none", config.glow)} />
      <div className={cn("absolute inset-0 bg-gradient-to-b opacity-30 pointer-events-none", config.gradient)} />
      
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
        {/* Professional Illustration / Icon Container */}
        <div className="relative mb-6 group">
          {/* Outer Ring */}
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-0.5 backdrop-blur-md flex items-center justify-center shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:border-primary/40">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-card via-background to-card/90 flex items-center justify-center relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-20 blur-sm", config.glow)} />
              <IconComponent className={cn("w-9 h-9 transition-transform duration-300 group-hover:scale-110", config.iconColor)} />
            </div>
          </div>

          {/* Sparkle badge accent */}
          <div className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border border-background">
            <Sparkles size={12} />
          </div>
        </div>

        {/* Badge */}
        {displayBadge && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/5 text-muted-foreground border border-white/10 mb-3 shadow-xs">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.glow)} />
            {displayBadge}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base md:text-lg font-extrabold text-foreground tracking-tight mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground/90 leading-relaxed mb-6 font-medium max-w-xs">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {actionLabel && onAction && (
            <Button
              variant="brand-gradient"
              size="default"
              onClick={onAction}
              className="h-10 text-xs font-bold px-5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all group/btn"
            >
              <Plus size={14} className="mr-1.5 transition-transform group-hover/btn:rotate-90 duration-300" />
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="default"
              onClick={onSecondaryAction}
              className="h-10 text-xs font-bold px-4 rounded-xl border-white/10 hover:bg-white/5 hover:text-foreground transition-all"
            >
              {secondaryActionLabel}
              <ArrowRight size={12} className="ml-1.5 opacity-70" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
