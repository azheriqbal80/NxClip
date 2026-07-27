import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Flame, 
  Sparkles,
  Zap,
  Power,
  TrendingUp,
  LineChart,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  getAllCircuitBreakersStatus, 
  forceOpenCircuitBreaker, 
  resetCircuitBreaker, 
  isRealApiEnabled, 
  setRealApiEnabled,
  resolveBaseGatewayUrl,
  CircuitStatusInfo 
} from "../../services/apiClient";
import { cn } from "../../lib/utils";
import { useDispatch } from "react-redux";
import { setMockApiEnabled } from "../../store/slices/uiSlice";

export function CircuitBreakersDashboard() {
  const dispatch = useDispatch();
  const [statuses, setStatuses] = useState<CircuitStatusInfo[]>([]);
  const [realApi, setRealApi] = useState<boolean>(isRealApiEnabled());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const updateStatuses = useCallback(() => {
    try {
      const current = getAllCircuitBreakersStatus();
      setStatuses(current);
    } catch (err) {
      console.error("Failed to load circuit status:", err);
    }
  }, []);

  useEffect(() => {
    updateStatuses();
    const interval = setInterval(updateStatuses, 4000);
    return () => clearInterval(interval);
  }, [updateStatuses]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    updateStatuses();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Circuit breaker statuses refreshed and healthy.");
    }, 600);
  };

  const handleToggleApiMode = () => {
    const newVal = !realApi;
    setRealApi(newVal);
    setRealApiEnabled(newVal);
    dispatch(setMockApiEnabled(!newVal));
    updateStatuses();
    toast.message(
      newVal ? "Switched to Live API Gateway Mode" : "Switched to Sim / Local Hybrid Mode",
      {
        description: newVal 
          ? `The client will attempt connections via gateway proxy (${resolveBaseGatewayUrl()}).`
          : "Zero-latency mock data logic and fallback handlers are activated.",
      }
    );
  };

  const handleForceTrip = (prefix: string, name: string) => {
    forceOpenCircuitBreaker(prefix);
    updateStatuses();
    toast.warning(`Circuit Breaker Tripped!`, {
      description: `Forced OPEN state for ${name}. Requests will instantly activate hybrid fallbacks.`,
    });
  };

  const handleResetBreaker = (prefix: string, name: string) => {
    resetCircuitBreaker(prefix);
    updateStatuses();
    toast.success(`Circuit Breaker Reset`, {
      description: `Restored CLOSED / Active routing state for ${name}.`,
    });
  };

  // Maps prefixes to suitable service-related icons for premium polish
  const getServiceIcon = (prefix: string) => {
    switch (prefix) {
      case "auth":
        return <Flame className="size-4 text-primary" />;
      case "content":
        return <Sparkles className="size-4 text-purple-400" />;
      case "feed":
        return <TrendingUp className="size-4 text-blue-400" />;
      case "analytics":
        return <LineChart className="size-4 text-emerald-400" />;
      case "notifications":
        return <BellRing className="size-4 text-amber-400" />;
      default:
        return <Activity className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="ui-panel border border-white/10 bg-white/5 backdrop-blur-md mb-8 overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-primary animate-pulse" />
              <CardTitle className="text-base font-bold text-white tracking-tight">
                API Integration & Circuit Breaker Dashboard
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Real-time fallback state systems. If upstream services (defined in `api-reference.md`) return 5xx errors or network loss, circuit breakers switch instantly to client-side Firestore cache failovers with zero user disruption.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global API mode Controller */}
            <div className="flex items-center gap-2 bg-neutral-900/40 p-1 rounded-lg border border-white/5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase px-2">
                API MODE:
              </span>
              <Button
                variant={realApi ? "default" : "secondary"}
                onClick={handleToggleApiMode}
                className={cn(
                  "h-8 px-3 rounded text-[10px] font-bold uppercase transition-all gap-1.5",
                  realApi 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-white/10 hover:bg-white/15 text-white"
                )}
              >
                <Power className="size-3" />
                {realApi ? "Live Gateway" : "Sim / Hybrid Mode"}
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh Statuses"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {statuses.map((s, index) => {
              const isClosed = s.state === "CLOSED";
              const isOpen = s.state === "OPEN";
              const isHalfOpen = s.state === "HALF_OPEN";

              return (
                <motion.div
                  key={s.prefix}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 bg-black/20",
                    isClosed && "border-white/5 hover:border-emerald-500/20",
                    isOpen && "border-destructive/30 hover:border-destructive/50 bg-destructive/[0.02]",
                    isHalfOpen && "border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-500/[0.02]"
                  )}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getServiceIcon(s.prefix)}
                        <h4 className="text-xs font-bold text-neutral-200 truncate" title={s.name}>
                          {s.name.split(" (")[0]}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 tracking-tighter shrink-0">
                        /{s.prefix}
                      </span>
                    </div>

                    {/* Status Display badge */}
                    <div className="flex items-center gap-2">
                      {isClosed && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="size-14 text-emerald-400 fill-emerald-400/10" />
                          <span>Online (Active)</span>
                        </div>
                      )}
                      {isOpen && (
                        <div className="flex items-center gap-1.5 text-destructive text-xs font-semibold animate-pulse">
                          <ShieldAlert className="size-14 text-destructive fill-destructive/10" />
                          <span>Circuit Open (Fallback)</span>
                        </div>
                      )}
                      {isHalfOpen && (
                        <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold">
                          <RefreshCw className="size-14 text-yellow-400 animate-spin" />
                          <span>Half Open (Probe)</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics info */}
                    <div className="rounded bg-neutral-900/50 p-2 border border-white/5 space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-neutral-400">FAILS SEQ:</span>
                        <span className={cn("font-bold", s.failureCount > 0 ? "text-amber-500" : "text-neutral-500")}>
                          {s.failureCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-neutral-400">STATE MODE:</span>
                        <span className={cn(
                          "font-bold",
                          isClosed && "text-emerald-400",
                          isOpen && "text-destructive",
                          isHalfOpen && "text-yellow-400"
                        )}>
                          {s.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions to test live integration */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex gap-1.5">
                    {isClosed ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleForceTrip(s.prefix, s.name)}
                        className="w-full h-7 text-[9px] uppercase font-bold tracking-wider text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                      >
                        Force Trip
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleResetBreaker(s.prefix, s.name)}
                        className="w-full h-7 text-[9px] uppercase font-bold tracking-wider text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                      >
                        Reset / Retry
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
