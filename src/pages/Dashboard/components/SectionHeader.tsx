import { memo } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export const SectionHeader = memo(({ title, subtitle }: SectionHeaderProps) => (
  <div className="mb-4">
    <h3 className="text-base font-black text-foreground tracking-tight">{title}</h3>
    {subtitle && <p className="text-[10px] font-bold text-muted-foreground">{subtitle}</p>}
  </div>
));

SectionHeader.displayName = "SectionHeader";
