import { memo } from "react";
import { useTranslation } from "react-i18next";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

export interface WeeklyChange {
  value: string;
  direction: "up" | "down" | "neutral";
  period?: string;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: "up" | "down" | "neutral" | "brand";
  weeklyChange?: WeeklyChange;
  subtext?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  accentGlow?: string;
}

export const MetricCard = memo(({ 
  label, 
  value, 
  trend, 
  trendType = "neutral",
  weeklyChange,
  subtext,
  icon: Icon,
  iconBg = "bg-primary/10 border-primary/20",
  iconColor = "text-primary",
  accentGlow = "bg-primary/10"
}: MetricCardProps) => {
  const { t } = useTranslation();

  // Effective change calculation
  const effectiveDirection = weeklyChange?.direction || (
    trendType === "up" || (trend && trend.startsWith("+")) ? "up" :
    trendType === "down" || (trend && trend.startsWith("-")) ? "down" :
    "neutral"
  );

  const displayTrendText = weeklyChange?.value || trend;
  const periodText = weeklyChange?.period || (weeklyChange ? "vs last week" : (trendType === "up" || trendType === "down") ? "vs last week" : null);

  const getBadgeStyle = () => {
    if (effectiveDirection === "up") {
      return {
        badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: TrendingUp
      };
    }
    if (effectiveDirection === "down") {
      return {
        badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
        icon: TrendingDown
      };
    }
    if (trendType === "brand") {
      return {
        badge: "bg-primary/10 text-primary border-primary/20",
        icon: null
      };
    }
    return {
      badge: "bg-muted/80 text-muted-foreground border-border/80",
      icon: Minus
    };
  };

  const badgeInfo = getBadgeStyle();
  const ArrowIcon = badgeInfo.icon;

  return (
    <Card className="ui-metric-card group cursor-pointer border-border/70 hover:border-primary/50 relative overflow-hidden text-start p-4 bg-card/90 backdrop-blur-md transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5">
      {/* Background ambient glow */}
      <div className={cn("absolute -top-6 -end-6 w-28 h-28 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none opacity-60 group-hover:opacity-100", accentGlow)} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={cn("p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-105 shadow-xs", iconBg, iconColor)}>
          <Icon size={18} className="transition-transform group-hover:rotate-6" />
        </div>

        {displayTrendText && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn("inline-flex items-center gap-1 text-[10px] font-bold h-5 px-2 rounded-md border tracking-wide shadow-2xs transition-transform group-hover:scale-105", badgeInfo.badge)}>
              {ArrowIcon && <ArrowIcon size={11} className="shrink-0 stroke-[2.5]" />}
              <span>{displayTrendText}</span>
            </Badge>
            {periodText && (
              <span className="text-[9px] font-medium text-muted-foreground/75 tracking-tight">
                {periodText}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 relative z-10 space-y-1">
        <div className="flex items-baseline justify-between gap-1">
          <p className="text-2xl font-black font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
            {value}
          </p>
        </div>
        <p className="text-[11px] font-bold text-foreground/80 tracking-tight leading-none">
          {label.includes('.') ? t(label) : label}
        </p>
        {subtext && (
          <p className="text-[9px] font-semibold text-muted-foreground/80 tracking-wide pt-0.5">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
});

MetricCard.displayName = "MetricCard";

