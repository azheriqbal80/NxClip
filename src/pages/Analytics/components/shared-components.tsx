import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

export interface ChartEntry {
  name: string;
  value: number;
  color: string;
  payload: Record<string, unknown>;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartEntry[];
  label?: string;
}

export const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  const { i18n } = useTranslation();
  if (active && payload && payload.length) {
    return (
      <Card className="border-border bg-popover/90 backdrop-blur-md shadow-xl p-3 min-w-[140px]">
        <p className="text-[10px] font-bold text-muted-foreground mb-2 border-b border-border pb-1 rtl:text-right">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-bold text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">{entry.value.toLocaleString(i18n.language)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

export interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  description?: string;
}

export const MetricCard = memo(({ title, value, trend, icon: Icon, description }: MetricCardProps) => {
  const { i18n } = useTranslation();
  return (
    <Card className="ui-metric-card group cursor-pointer relative overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out">
      {/* Background ambient glow on hover */}
      <div className="absolute -top-8 -end-8 w-24 h-24 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:rotate-3">
            <Icon size={18} />
          </div>
          <div className={cn(
            "flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider transition-transform duration-200 group-hover:scale-105",
            trend > 0 ? "text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20" : "text-destructive bg-destructive/10 border border-destructive/20"
          )}>
            {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}{i18n.language === 'ar' ? '٪' : '%'}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground tracking-widest leading-none mb-1.5 uppercase transition-colors group-hover:text-muted-foreground/90">{title}</h4>
          <p className="text-2xl font-display font-black text-foreground leading-none group-hover:text-primary transition-colors duration-200">{value}</p>
          {description && <p className="text-[9px] font-medium text-muted-foreground mt-2 italic leading-relaxed opacity-80">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = "MetricCard";
