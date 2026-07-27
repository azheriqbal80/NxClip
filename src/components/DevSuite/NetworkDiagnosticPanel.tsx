import { useState } from "react";
import { 
  Globe, 
  Send, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Clock,
  ExternalLink,
  Info,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface DiagnosticResult {
  url: string;
  status: "idle" | "loading" | "success" | "error" | "cors_blocked";
  statusCode?: number;
  statusText?: string;
  headers?: Record<string, string>;
  latency?: number;
  errorDetails?: string;
  timestamp?: string;
  isCrossOrigin?: boolean;
}

export function NetworkDiagnosticPanel() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!url || !url.startsWith("http")) {
      setResult({
        url,
        status: "error",
        errorDetails: "Please enter a valid URL starting with http:// or https://",
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();
    const isCrossOrigin = typeof window !== "undefined" && !url.startsWith(window.location.origin);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { "Accept": "*/*" }
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        
        // If it failed and is cross-origin, let's probe via proxy to see if it's online
        if (isCrossOrigin && !(fetchErr instanceof DOMException && fetchErr.name === "AbortError")) {
          const proxyUrl = `/api/proxy-health?url=${encodeURIComponent(url)}`;
          try {
            const proxyRes = await fetch(proxyUrl);
            if (proxyRes.ok) {
              setResult({
                url,
                status: "cors_blocked",
                isCrossOrigin: true,
                latency: Math.round(performance.now() - startTime),
                timestamp: new Date().toLocaleTimeString(),
                errorDetails: "CORS ERROR: The target server is ONLINE but the browser blocked the request because the server did not provide valid 'Access-Control-Allow-Origin' headers for this domain."
              });
              setIsLoading(false);
              return;
            }
          } catch { /* Proxy also failed, server might be down */ }
        }
        throw fetchErr;
      }

      const latency = Math.round(performance.now() - startTime);
      const headers: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headers[key] = val;
      });

      if (response.status === 429) {
        setResult({
          url,
          status: "error",
          statusCode: 429,
          statusText: "Too Many Requests",
          errorDetails: "Rate limit reached. The target server is currently throttling requests from this source.",
          headers,
          latency,
          isCrossOrigin,
          timestamp: new Date().toLocaleTimeString()
        });
        setIsLoading(false);
        return;
      }

      setResult({
        url,
        status: "success",
        statusCode: response.status,
        statusText: response.statusText,
        headers,
        latency,
        isCrossOrigin,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      setResult({
        url,
        status: "error",
        errorDetails: err.name === "AbortError" ? "Request Timeout (10s)" : (err.message || "Network request failed"),
        timestamp: new Date().toLocaleTimeString(),
        isCrossOrigin
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="network-diagnostic-panel">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
          <Terminal className="size-4 text-emerald-400" />
          Ad-hoc Network Diagnostics
        </h3>
        <p className="text-xs text-zinc-400 font-sans">
          Input any endpoint URL to verify connectivity and analyze browser-side fetch restrictions.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/health"
            className="pl-9 bg-zinc-950/50 border-white/5 text-xs font-mono h-10 focus:ring-emerald-500/20"
            onKeyDown={(e) => e.key === "Enter" && runDiagnostic()}
          />
        </div>
        <Button 
          onClick={runDiagnostic} 
          disabled={isLoading || !url}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 h-10 shadow-lg shadow-emerald-500/10"
        >
          {isLoading ? <Clock className="size-4 animate-spin" /> : <Send className="size-4 mr-2" />}
          RUN PROBE
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <Card className={cn(
              "p-4 bg-zinc-900/60 border-white/5 transition-colors",
              result.status === "success" && "border-emerald-500/20 bg-emerald-500/[0.02]",
              result.status === "cors_blocked" && "border-amber-500/20 bg-amber-500/[0.02]",
              result.status === "error" && "border-red-500/20 bg-red-500/[0.02]"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-8 rounded-lg flex items-center justify-center",
                    result.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                    result.status === "cors_blocked" ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                  )}>
                    {result.status === "success" ? <ShieldCheck className="size-4" /> :
                     result.status === "cors_blocked" ? <Lock className="size-4" /> :
                     <ShieldAlert className="size-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">
                        {result.status === "success" ? "Probe Successful" : 
                         result.status === "cors_blocked" ? "CORS Restriction Detected" : 
                         "Diagnostic Failed"}
                      </span>
                      {result.statusCode && (
                        <Badge variant="outline" className="text-[10px] h-4 font-mono border-emerald-500/20 text-emerald-400">
                          {result.statusCode} {result.statusText}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono truncate max-w-sm md:max-w-xl">
                      {result.url}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  {result.timestamp}
                </div>
              </div>

              {result.errorDetails && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex gap-3">
                  <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">Analysis Result</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{result.errorDetails}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Latency</p>
                  <p className="text-xs font-mono text-white">{result.latency ? `${result.latency}ms` : 'N/A'}</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Type</p>
                  <p className="text-xs font-mono text-white">{result.isCrossOrigin ? 'Cross-Origin' : 'Same-Origin'}</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Method</p>
                  <p className="text-xs font-mono text-white">GET</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Engine</p>
                  <p className="text-xs font-mono text-white">Fetch v2</p>
                </div>
              </div>

              {result.headers && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="size-3" />
                      Response Headers
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono">
                      {Object.keys(result.headers).length} Keys Found
                    </div>
                  </div>
                  <div className="bg-black/60 rounded-xl border border-white/5 p-4 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                      <table className="w-full text-left font-mono text-[10px]">
                        <thead>
                          <tr className="text-zinc-600 border-b border-white/5">
                            <th className="pb-2 font-bold uppercase tracking-tighter">Header Key</th>
                            <th className="pb-2 font-bold uppercase tracking-tighter">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Object.entries(result.headers).map(([key, val]) => (
                            <tr key={key} className="group hover:bg-white/5 transition-colors">
                              <td className="py-2 pr-4 font-bold text-emerald-400 align-top whitespace-nowrap">{key}</td>
                              <td className="py-2 text-zinc-400 break-all">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
              <Info className="size-4 text-blue-400 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase font-mono">Quick Insight</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  If status is <span className="text-emerald-400">200 OK</span> but you see <span className="text-amber-400">CORS ERROR</span> in analysis, check if the server's <code className="bg-white/5 px-1 rounded text-zinc-300">Access-Control-Allow-Origin</code> matches this domain: <code className="bg-white/5 px-1 rounded text-zinc-300">{window.location.origin}</code>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
