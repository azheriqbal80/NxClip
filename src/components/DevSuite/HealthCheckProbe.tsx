import { useState, useEffect } from "react";
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  Globe,
  Lock,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { resolveBaseGatewayUrl } from "../../services/apiClient";

interface ProbeResult {
  env: "development" | "staging" | "production";
  url: string;
  status: "idle" | "testing" | "success" | "failed" | "cors_error";
  statusCode?: number;
  statusText?: string;
  latency?: number;
  headers?: Record<string, string>;
  error?: string;
  timestamp?: string;
}

export function HealthCheckProbe() {
  const [results, setResults] = useState<Record<string, ProbeResult>>({
    development: { env: "development", url: resolveBaseGatewayUrl("development"), status: "idle" },
    staging: { env: "staging", url: resolveBaseGatewayUrl("staging"), status: "idle" },
    production: { env: "production", url: resolveBaseGatewayUrl("production"), status: "idle" },
  });

  const [expandedEnv, setExpandedEnv] = useState<string | null>(null);
  const [globalTesting, setGlobalTesting] = useState(false);

  const runProbe = async (env: "development" | "staging" | "production") => {
    const targetUrl = resolveBaseGatewayUrl(env);
    const startTime = performance.now();
    
    setResults(prev => ({
      ...prev,
      [env]: { ...prev[env], status: "testing", error: undefined, statusCode: undefined, headers: undefined }
    }));

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      
      const isCrossOrigin = typeof window !== "undefined" && !targetUrl.startsWith(window.location.origin) && targetUrl.startsWith("http");
      
      let response: Response;
      try {
        response = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        });
        clearTimeout(id);

        if (response.status === 429) {
          setResults(prev => ({
            ...prev,
            [env]: { 
              ...prev[env], 
              status: "failed", 
              statusCode: 429,
              statusText: "Rate Exceeded",
              error: "Rate limit reached. The infrastructure is temporarily throttling requests. Please wait a moment before re-scanning.",
              latency: Math.round(performance.now() - startTime),
              timestamp: new Date().toLocaleTimeString(),
            }
          }));
          return;
        }
      } catch (err: any) {
        clearTimeout(id);
        
        if (isCrossOrigin && !(err instanceof DOMException && err.name === "AbortError")) {
          // Check if it's reachable via proxy (CORS validation)
          const proxyUrl = `/api/proxy-health?url=${encodeURIComponent(targetUrl)}`;
          try {
            const proxyResponse = await fetch(proxyUrl, { method: "GET" });
            if (proxyResponse.ok) {
              setResults(prev => ({
                ...prev,
                [env]: { 
                  ...prev[env], 
                  status: "cors_error", 
                  error: "CORS Blocked: Gateway is online but rejects browser-side requests.",
                  latency: Math.round(performance.now() - startTime),
                  timestamp: new Date().toLocaleTimeString(),
                }
              }));
              return;
            }
          } catch { /* proxy failed too, likely offline */ }
        }
        throw err;
      }

      const latency = Math.round(performance.now() - startTime);
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      setResults(prev => ({
        ...prev,
        [env]: {
          ...prev[env],
          status: "success",
          statusCode: response.status,
          statusText: response.statusText,
          latency,
          headers,
          timestamp: new Date().toLocaleTimeString(),
        }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [env]: {
          ...prev[env],
          status: "failed",
          error: err.name === "AbortError" ? "Request Timeout (8s)" : (err.message || "Unknown Connection Error"),
          timestamp: new Date().toLocaleTimeString(),
        }
      }));
    }
  };

  const runAllProbes = async () => {
    setGlobalTesting(true);
    // Sequential with small delay to avoid burst rate limits
    await runProbe("development");
    await new Promise(r => setTimeout(r, 200));
    await runProbe("staging");
    await new Promise(r => setTimeout(r, 200));
    await runProbe("production");
    setGlobalTesting(false);
  };

  useEffect(() => {
    runAllProbes();
  }, []);

  return (
    <div className="space-y-6" id="connection-diagnostics-tool">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Activity className="size-4 text-purple-400" />
            Active Connection Diagnostics
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            Probing gateway availability, CORS headers, and latency across enterprise clusters.
          </p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={runAllProbes} 
          disabled={globalTesting}
          className="bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-400 font-bold text-xs h-9 px-4 shadow-lg shadow-purple-500/5 transition-all active:scale-95"
        >
          {globalTesting ? (
            <RefreshCw className="size-3.5 mr-2 animate-spin" />
          ) : (
            <Search className="size-3.5 mr-2" />
          )}
          SCAN ENVIRONMENTS
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(["development", "staging", "production"] as const).map((env) => {
          const res = results[env];
          const isExpanded = expandedEnv === env;
          
          return (
            <Card 
              key={env} 
              className={cn(
                "bg-zinc-900/40 border-white/5 transition-all duration-300 overflow-hidden",
                res.status === "success" && "border-emerald-500/20 shadow-lg shadow-emerald-500/5",
                res.status === "failed" && "border-red-500/20 shadow-lg shadow-red-500/5",
                res.status === "cors_error" && "border-amber-500/20 shadow-lg shadow-amber-500/5"
              )}
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedEnv(isExpanded ? null : env)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                    res.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                    res.status === "failed" ? "bg-red-500/10 text-red-400" :
                    res.status === "cors_error" ? "bg-amber-500/10 text-amber-400" :
                    res.status === "testing" ? "bg-purple-500/10 text-purple-400" :
                    "bg-zinc-800 text-zinc-500"
                  )}>
                    {res.status === "success" ? <ShieldCheck className="size-5" /> : 
                     res.status === "failed" ? <ShieldAlert className="size-5" /> :
                     res.status === "cors_error" ? <Lock className="size-5" /> :
                     res.status === "testing" ? <RefreshCw className="size-5 animate-spin" /> :
                     <Wifi className="size-5" />}
                  </div>
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                        {env}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono border-white/10 text-zinc-500 uppercase">
                        {res.status === "success" ? "Online" : res.status === "failed" ? "Offline" : res.status === "cors_error" ? "Restricted" : "Probing"}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 truncate max-w-[200px] md:max-w-md">
                      <Globe className="size-3 shrink-0" />
                      {res.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {res.status === "success" && (
                    <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-500 text-[8px] uppercase tracking-tighter">Status</span>
                        <span className="text-emerald-400 font-bold">{res.statusCode} {res.statusText}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-500 text-[8px] uppercase tracking-tighter">Latency</span>
                        <span className={cn(
                          "font-bold",
                          (res.latency || 0) < 150 ? "text-emerald-400" : (res.latency || 0) < 300 ? "text-amber-400" : "text-red-400"
                        )}>{res.latency}ms</span>
                      </div>
                    </div>
                  )}
                  {isExpanded ? <ChevronUp className="size-4 text-zinc-600" /> : <ChevronDown className="size-4 text-zinc-600" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/5 bg-zinc-950/50"
                  >
                    <div className="p-4 space-y-4">
                      {res.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                          <WifiOff className="size-4 text-red-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-red-400">Diagnostic Failure</p>
                            <p className="text-[10px] text-red-300/70 font-mono leading-relaxed">{res.error}</p>
                          </div>
                        </div>
                      )}

                      {res.headers && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            <Terminal className="size-3 text-purple-400" />
                            Response Headers
                          </div>
                          <div className="bg-black/40 rounded-xl border border-white/5 p-3 font-mono text-[10px] overflow-x-auto">
                            <table className="w-full">
                              <tbody>
                                {Object.entries(res.headers).map(([key, val]) => (
                                  <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="py-1.5 pr-4 text-purple-400 font-bold whitespace-nowrap">{key}</td>
                                    <td className="py-1.5 text-zinc-400 break-all">{val}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 px-1 pt-2">
                        <div className="flex items-center gap-2">
                          <Search className="size-3" />
                          Last Probed: {res.timestamp || "N/A"}
                        </div>
                        <div>UUID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
