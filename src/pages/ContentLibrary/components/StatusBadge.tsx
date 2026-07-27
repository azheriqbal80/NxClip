import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  FileEdit,
  Trash2,
  LucideIcon,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

interface StatusBadgeProps {
  status: string;
}

/**
 * Renders every backend content lifecycle status with a distinct, tokenized
 * badge. Text is tinted from each hue (not gray) to keep ≥4.5:1 contrast on the
 * /10 tinted backgrounds. Legacy `rejected` is normalized to moderation_rejected.
 */
const STATUS_CONFIG: Record<
  string,
  { className: string; icon: LucideIcon; spin?: boolean; defaultLabel: string }
> = {
  draft: {
    className: "bg-muted/60 text-muted-foreground border-border",
    icon: FileEdit,
    defaultLabel: "Draft",
  },
  processing: {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    icon: Loader2,
    spin: true,
    defaultLabel: "Processing",
  },
  generation_failed: {
    className: "bg-destructive/10 text-destructive border-destructive/25",
    icon: AlertTriangle,
    defaultLabel: "Failed",
  },
  publishing: {
    className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    icon: Loader2,
    spin: true,
    defaultLabel: "Publishing",
  },
  moderation_rejected: {
    className: "bg-destructive/10 text-destructive border-destructive/25",
    icon: XCircle,
    defaultLabel: "Rejected",
  },
  published: {
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
    defaultLabel: "Published",
  },
  deleted: {
    className: "bg-muted/40 text-muted-foreground/70 border-border/60",
    icon: Trash2,
    defaultLabel: "Deleted",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { t } = useTranslation();
  // Normalize legacy/alias values so the correct config always resolves.
  const normalized = status === "rejected" ? "moderation_rejected" : status || "draft";
  const config = STATUS_CONFIG[normalized] ?? {
    className: "bg-muted/50 text-muted-foreground border-border",
    icon: Clock,
    defaultLabel: normalized,
  };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-bold uppercase tracking-widest text-[10px] px-3 py-1",
        config.className
      )}
    >
      <Icon size={12} className={cn(config.spin && "animate-spin")} />
      {t(`content_library.status.${normalized}`, { defaultValue: config.defaultLabel })}
    </Badge>
  );
};
