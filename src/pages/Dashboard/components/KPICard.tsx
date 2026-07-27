import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

export interface KPICardProps {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  status: string;
  icon: React.ElementType;
}

export const KPICard = memo(({ label, value, trend, status, icon: Icon }: KPICardProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <Card className="ui-dashboard-kpi-card group cursor-pointer relative overflow-hidden p-5 rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-soft hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out">
      {/* Background ambient glow on hover */}
      <div className="absolute -top-8 -end-8 w-24 h-24 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:rotate-3">
          <Icon size={16} />
        </div>
        <Badge variant="outline" className={cn(
          "text-[8px] h-4 border-none font-bold rounded-md tracking-wider leading-none transition-transform duration-200 group-hover:scale-105",
          isAr && "tracking-normal",
          trend === "up" ? "bg-brand-secondary/10 text-brand-secondary" : 
          trend === "down" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          {status}
        </Badge>
      </div>
      <div className="space-y-1 relative z-10">
        <p className={cn(
          "text-[10px] font-bold text-muted-foreground leading-none transition-colors group-hover:text-muted-foreground/90",
          isAr ? "tracking-normal" : "tracking-widest"
        )}>{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-display font-black text-foreground group-hover:text-primary transition-colors duration-200" dir="ltr">{value}</h3>
        </div>
      </div>
    </Card>
  );
});

KPICard.displayName = "KPICard";
