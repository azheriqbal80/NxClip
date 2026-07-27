import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  AlertTriangle,
  Server,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getAllCircuitBreakersStatus, 
  isRealApiEnabled, 
  CircuitStatusInfo 
} from "../../services/apiClient";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

export function ServiceHealthDashboard() {
  const [statuses, setStatuses] = useState<CircuitStatusInfo[]>([]);
  const [realApi, setRealApi] = useState<boolean>(isRealApiEnabled());
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const refreshHealth = useCallback(() => {
    try {
      const current = getAllCircuitBreakersStatus();
      setStatuses(current);
      setRealApi(isRealApiEnabled());
    } catch (err) {
      console.error("Failed to fetch service health telemetry:", err);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    if (!autoPoll) return;
    const interval = setInterval(refreshHealth, 3000);
    return () => clearInterval(interval);
  }, [refreshHealth, autoPoll]);

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden rounded-xl shadow-2xl mb-8">
      <CardHeader className="p-6 border-b border-white/5 bg-gradient-to-r from-white/[0.01] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="size-4.5 text-primary animate-pulse" />
              <CardTitle className="text-sm font-bold text-white tracking-wide uppercase">
                Upstream Microservice Telemetry
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Uptime status monitoring for primary system endpoints. Circuit protection intercepts downstream network disruptions.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoPoll(prev => !prev)}
              className={cn(
                "h-8 text-[10px] font-mono tracking-wider transition-all border-white/10 uppercase font-semibold",
                autoPoll 
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              )}
            >
              Autopoll: {autoPoll ? "ACTIVE (3s)" : "PAUSED"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshHealth}
              className="h-8 w-8 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/5"
              aria-label="Refresh manual telemetry"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Base API Gateway Node Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-neutral-900 border border-white/5">
                <Server className="size-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-widest">
                  API Gateway Proxy
                </h4>
                <p className="text-[10px] text-neutral-400 font-mono">
                  gateway PORT: 5000
                </p>
              </div>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border animate-pulse",
              realApi
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}>
              {realApi ? "ONLINE / ACTIVE" : "SIM_MOCKED"}
            </span>
          </div>

          {/* Map Service Health Cards */}
          <AnimatePresence mode="popLayout">
            {statuses.map((service) => {
              const isClosed = service.state === "CLOSED";
              const isMocked = !realApi || service.state === "OPEN" || service.state === "HALF_OPEN";

              return (
                <motion.div
                  key={service.prefix}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border transition-all duration-300",
                    isMocked 
                      ? "border-amber-500/20 hover:border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.02)]" 
                      : "border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.01]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-neutral-900 border border-white/5">
                      <Activity className={cn(
                        "size-4",
                        isMocked ? "text-amber-400" : "text-emerald-400 animate-pulse"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-widest">
                        {service.name.split(" (")[0]}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        upstream: /{service.prefix}
                      </p>
                    </div>
                  </div>

                  {/* Healthy / Mocked indicator badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border flex items-center gap-1",
                      isMocked
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {isMocked ? (
                        <>
                          <AlertTriangle className="size-2.5 text-amber-500 fill-amber-500/15" />
                          <span>Status: Mocked</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-2.5 text-emerald-400 fill-emerald-400/15" />
                          <span>Status: Online</span>
                        </>
                      )}
                    </span>
                    {service.failureCount > 0 && (
                      <span className="text-[9px] font-mono font-bold text-destructive">
                        FAIL_SEQ: {service.failureCount}
                      </span>
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
