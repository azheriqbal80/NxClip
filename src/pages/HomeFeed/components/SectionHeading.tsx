import { memo } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export const SectionHeading = memo(({ title, subtitle }: SectionHeadingProps) => (
  <div className="space-y-1 text-start">
    <h3 className="text-xs font-bold text-muted-foreground/60">{title}</h3>
    {subtitle && <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>}
  </div>
));

SectionHeading.displayName = "SectionHeading";
