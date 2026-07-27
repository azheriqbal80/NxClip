import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  WifiOff,
  ServerCrash,
  Lock,
  SearchX,
  RotateCw,
  LucideIcon,
} from "lucide-react";

/**
 * Normalized error shape surfaced by the API layer (see apiClient `ApiError`).
 * ErrorState reads `statusCode` / `code` to pick an appropriate icon + copy so a
 * failed live call is always visibly an error — never silently faked data.
 */
export interface ErrorStateError {
  statusCode?: number;
  code?: string;
  message?: string | string[];
}

export type ErrorStateVariant = "network" | "server" | "auth" | "notFound" | "generic";

interface ErrorStateProps {
  /** Raw error thrown by the API layer; used to auto-pick variant + message when not overridden. */
  error?: ErrorStateError | unknown;
  variant?: ErrorStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  /** Retry handler — renders the primary "Try again" button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Show the raw correlation id / code for support + debugging. Defaults to true. */
  showDetails?: boolean;
  className?: string;
}

const VARIANT_CONFIGS: Record<ErrorStateVariant, {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  glow: string;
  iconColor: string;
}> = {
  network: {
    icon: WifiOff,
    badge: "Connection Lost",
    title: "Can't reach the gateway",
    description: "We couldn't connect to the nxclip API gateway. Check your connection and try again.",
    glow: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  server: {
    icon: ServerCrash,
    badge: "Service Error",
    title: "Something went wrong upstream",
    description: "The service returned an unexpected error. This is usually temporary — please retry in a moment.",
    glow: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
  auth: {
    icon: Lock,
    badge: "Not Authorized",
    title: "Your session needs attention",
    description: "You don't have access or your session expired. Try signing in again.",
    glow: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  notFound: {
    icon: SearchX,
    badge: "Not Found",
    title: "We couldn't find that",
    description: "The item you're looking for doesn't exist or may have been removed.",
    glow: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  generic: {
    icon: AlertTriangle,
    badge: "Error",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    glow: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
};

function normalize(error: unknown): ErrorStateError {
  if (!error || typeof error !== "object") return { message: error ? String(error) : undefined };
  const e = error as any;
  return {
    statusCode: e.statusCode ?? e.response?.status,
    code: e.code,
    message: e.message ?? e.response?.data?.message,
  };
}

function pickVariant(err: ErrorStateError): ErrorStateVariant {
  const status = err.statusCode;
  if (err.code === "NETWORK_ERROR" || status === 0 || status === undefined) return "network";
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "notFound";
  if (status >= 500) return "server";
  return "generic";
}

function messageText(message?: string | string[]): string | undefined {
  if (!message) return undefined;
  return Array.isArray(message) ? message.join(" ") : message;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  variant,
  icon: CustomIcon,
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  secondaryActionLabel,
  onSecondaryAction,
  showDetails = true,
  className,
}) => {
  const normalized = normalize(error);
  const resolvedVariant = variant || pickVariant(normalized);
  const config = VARIANT_CONFIGS[resolvedVariant] || VARIANT_CONFIGS.generic;
  const IconComponent = CustomIcon || config.icon;

  const resolvedTitle = title || config.title;
  const resolvedDescription = description || messageText(normalized.message) || config.description;
  const detailCode = normalized.code || (normalized.statusCode ? `HTTP ${normalized.statusCode}` : undefined);

  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-8 md:p-12 text-center flex flex-col items-center justify-center transition-all duration-300",
        className
      )}
    >
      {/* Ambient glow */}
      <div className={cn("absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none", config.glow)} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
        {/* Icon */}
        <div className="relative mb-6 group">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-0.5 backdrop-blur-md flex items-center justify-center shadow-xl">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-card via-background to-card/90 flex items-center justify-center relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-20 blur-sm", config.glow)} />
              <IconComponent className={cn("w-9 h-9", config.iconColor)} />
            </div>
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/5 text-muted-foreground border border-white/10 mb-3 shadow-xs">
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.glow)} />
          {config.badge}
        </span>

        {/* Title */}
        <h3 className="text-base md:text-lg font-extrabold text-foreground tracking-tight mb-2">
          {resolvedTitle}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground/90 leading-relaxed mb-6 font-medium max-w-xs">
          {resolvedDescription}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {onRetry && (
            <Button
              variant="brand-gradient"
              size="default"
              onClick={onRetry}
              className="h-10 text-xs font-bold px-5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all group/btn"
            >
              <RotateCw size={14} className="mr-1.5 transition-transform group-hover/btn:rotate-180 duration-500" />
              {retryLabel}
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
            </Button>
          )}
        </div>

        {/* Debug detail */}
        {showDetails && detailCode && (
          <p className="mt-5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">
            ref: {detailCode}
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
