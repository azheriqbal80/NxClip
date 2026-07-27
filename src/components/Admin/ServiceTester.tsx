import { useState, useEffect } from "react";
import { 
  SlidersHorizontal,
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCcw, 
  Flame, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Server
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { isRealApiEnabled, resolveBaseGatewayUrl, getEnvVarNameForEnv } from "../../services/apiClient";
import { safeLocalStorage, safeSessionStorage } from "../../lib/safeStorage";
import { useDispatch, useSelector } from "react-redux";
import { setMockApiEnabled, setApiEnv, setConnectionStatus, selectConnectionStatus } from "../../store/slices/uiSlice";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export function ServiceTester() {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(selectConnectionStatus);

  // Custom localStorage-synced persistent states
  const [mockApiVal, setMockApiVal] = useLocalStorage<"true" | "false">("nxclip_mock_api", "false");
  const [apiEnvVal, setApiEnvVal] = useLocalStorage<"development" | "staging" | "production">("nxclip_api_env", "development");
  const [realApiVal, setRealApiVal] = useLocalStorage<"true" | "false">("nx_use_real_api", "true");

  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusText: string;
    mode: "live" | "mock";
    timestamp: string;
    targetUrl?: string;
    errorDetails?: string;
    fallbackActive?: boolean;
    fallbackReason?: string;
  } | null>(null);

  // Derived state
  const useRealApi = mockApiVal === "false";

  // Automated synchronization to keep Redux store responsive and fully in sync with persistent states
  useEffect(() => {
    const isMock = mockApiVal === "true";
    dispatch(setMockApiEnabled(isMock));
  }, [mockApiVal, dispatch]);

  useEffect(() => {
    dispatch(setApiEnv(apiEnvVal));
  }, [apiEnvVal, dispatch]);

  const handleToggleState = (targetReal: boolean) => {
    setMockApiVal(targetReal ? "false" : "true");
    setRealApiVal(targetReal ? "true" : "false");
    
    // Write directly to local storage to make sure the subsequent check sees it instantly
    safeLocalStorage.setItem("nxclip_mock_api", targetReal ? "false" : "true");
    safeLocalStorage.setItem("nx_use_real_api", targetReal ? "true" : "false");
    
    const message = targetReal 
      ? "Gateway Live routing initialized" 
      : "Mock Simulated fallback mode activated";
    
    toast.message(message, {
      description: `nxclip_mock_api set to "${!targetReal}". nx_use_real_api set to "${targetReal}".`,
    });

    // Run connection test immediately with the newly selected mock status
    handleRunPingDiagnostics(!targetReal, apiEnvVal);
  };

  const handleRunPingDiagnostics = async (
    overrideIsMock?: boolean,
    overrideEnv?: "development" | "staging" | "production"
  ) => {
    setIsTestingConnection(true);
    setTestResult(null);

    const now = new Date().toLocaleTimeString();
    const isMock = overrideIsMock !== undefined ? overrideIsMock : (mockApiVal === "true");
    const targetEnv = overrideEnv !== undefined ? overrideEnv : apiEnvVal;
    const targetGatewayUrl = resolveBaseGatewayUrl(targetEnv);

    // Update connection status to "testing"
    dispatch(setConnectionStatus({ env: targetEnv, status: "testing" }));

    // We will ALWAYS attempt to ping the live API gateway to check if it's online/offline,
    // even if mock mode is active, so the user knows the status of the gateway.
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); // 8-second timeout for Cloud Run cold starts

      const targetUrl = `${targetGatewayUrl}/health`;
      const isCrossOrigin = typeof window !== "undefined" && !targetUrl.startsWith(window.location.origin) && targetUrl.startsWith("http");

      let response: Response;

      // Primary attempt: Direct fetch to verify connectivity AND CORS
      try {
        response = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
        });
      } catch (err) {
        // If it's cross-origin and failed, it might be a CORS block
        if (isCrossOrigin && !(err instanceof DOMException && err.name === "AbortError")) {
          // Try secondary attempt via proxy to confirm if it's online but CORS-blocked
          const proxyUrl = `/api/proxy-health?url=${encodeURIComponent(targetUrl)}`;
          try {
            const proxyResponse = await fetch(proxyUrl, { method: "GET", signal: controller.signal });
            if (proxyResponse.ok) {
              // Online and reachable via Proxy!
              setIsTestingConnection(false);
              dispatch(setConnectionStatus({ env: targetEnv, status: "connected" }));
              setTestResult({
                success: true,
                statusText: "200 Connected (CORS Bypassed)",
                mode: isMock ? "mock" : "live",
                timestamp: now,
                targetUrl,
                errorDetails: undefined,
                fallbackActive: isMock,
                fallbackReason: isMock 
                  ? "Firebase fallback is active because 'API Mock Mode' is manually enabled." 
                  : "CORS restriction detected on direct browser request, but connection is fully functional via the server-side CORS bypass proxy.",
              });
              toast.success(`Connected to ${targetEnv} gateway via Proxy!`, {
                description: "Direct connection was blocked by CORS, but requests are automatically and safely routed through the server proxy."
              });
              clearTimeout(id);
              return;
            }
          } catch { /* ignore proxy failure */ }
        }
        throw err; // Re-throw to main catch if it wasn't a CORS block we handled
      }

      clearTimeout(id);

      if (response.ok) {
        setIsTestingConnection(false);
        dispatch(setConnectionStatus({ env: targetEnv, status: "connected" }));
        setTestResult({
          success: true,
          statusText: "200 Connected (API Gateway Online)",
          mode: isMock ? "mock" : "live",
          timestamp: now,
          targetUrl,
          fallbackActive: isMock,
          fallbackReason: isMock 
            ? "Firebase fallback is active because 'API Mock Mode' is manually enabled." 
            : undefined,
          errorDetails: undefined
        });
        if (isMock) {
          toast.info("Live Gateway is ONLINE, but your active operating plan is set to Firebase Fallback.");
        } else {
          toast.success("Successfully connected to API Gateway!");
        }
      } else {
        setIsTestingConnection(false);
        dispatch(setConnectionStatus({ env: targetEnv, status: "failed" }));
        
        let errorDetails = `Gateway at ${targetUrl} returned status code ${response.status}.`;
        
        try {
          const errJson = await response.json();
          if (errJson?.proxySource === "nxclip-server") {
            errorDetails = `Internal Proxy Error (${response.status}). The server-side proxy attempted to reach ${targetUrl} but the target gateway was unreachable or rejected the request. ${errJson.error || ""}`;
          } else if (errJson?.error) {
            errorDetails += ` Details: ${errJson.error}`;
          }
        } catch (e) {
          // Fallback if parsing fails
        }

        setTestResult({
          success: false,
          statusText: `${response.status} Error`,
          mode: isMock ? "mock" : "live",
          timestamp: now,
          targetUrl,
          fallbackActive: true,
          fallbackReason: isMock 
            ? "Firebase fallback is manually active (Mock Mode enabled)." 
            : "API Gateway responded with an anomaly. Falling back to Firebase / Local Cache.",
          errorDetails
        });
        toast.warning("Gateway returned an unexpected status code.");
      }
    } catch (err: any) {
      setIsTestingConnection(false);
      dispatch(setConnectionStatus({ env: targetEnv, status: "failed" }));
      const isTimeout = err?.name === "AbortError" || err?.message?.toLowerCase().includes("abort") || err?.message?.toLowerCase().includes("signal");
      
      const now = new Date().toLocaleTimeString();
      let errorDesc = "";
      
      if (isTimeout) {
        errorDesc = `Connection timed out (8s limit exceeded). The target service at ${targetGatewayUrl} is likely cold-starting (scaled down to zero) or entirely offline.`;
      } else {
        errorDesc = `Network / Connection Block: The browser failed to establish a network connection to the target endpoint. Error: ${err?.message || "Unknown Connection Failure"}`;
      }

      setTestResult({
        success: false,
        statusText: isTimeout ? "Connection Timeout" : "Network Block / Offline",
        mode: isMock ? "mock" : "live",
        timestamp: now,
        targetUrl: `${targetGatewayUrl}/health`,
        fallbackActive: true,
        fallbackReason: isMock 
          ? "Firebase fallback is manually active (Mock Mode enabled)." 
          : "API Gateway is offline or unreachable. The system has automatically fallback-routed all active operations to Firebase Firestore.",
        errorDetails: errorDesc
      });
      toast.error("Gateway connection failed.");
    }
  };

  const handlePurgeCaches = () => {
    try {
      let count = 0;
      safeLocalStorage.keys().forEach((key) => {
        if (key.startsWith("nx_api_cache_")) {
          safeLocalStorage.removeItem(key);
          count++;
        }
      });
      safeSessionStorage.keys().forEach((key) => {
        if (key.startsWith("nx_api_cache_")) {
          safeSessionStorage.removeItem(key);
          count++;
        }
      });
      toast.success(`Purged ${count} API response cache entries.`);
    } catch (err) {
      toast.error("Failed to clean browser caches safely.");
    }
  };

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden mb-8">
      <CardHeader className="p-6 border-b border-white/5 bg-gradient-to-r from-white/[0.01] to-transparent">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <CardTitle className="text-sm font-bold text-white tracking-wide uppercase">
            Service Tester & Mode Controller
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-neutral-400">
          Manually test and control the gateway integration logic, localStorage environment flags, and client caching states. No manual intervention required — changes sync natively with storage and Redux.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Dynamic Integration & Routing Overview Callout */}
        <div className="p-4 rounded-xl border border-white/10 bg-zinc-950/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                Active System Routing
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "size-2 rounded-full animate-pulse",
                  useRealApi ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="text-sm font-semibold text-white">
                  {useRealApi ? "Main API Gateway (Live Mode)" : "Firebase Fallback (Mock Mode)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={useRealApi ? "default" : "outline"} className={cn(
                "text-[10px] uppercase tracking-wider font-semibold py-0.5 px-2 font-mono",
                useRealApi 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {useRealApi ? "REST API GATEWAY ROUTING" : "CLIENT-SIDE FIRESTORE CACHE"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.05] text-[11px]">
            <div>
              <span className="text-neutral-500 font-medium">Target Gateway Endpoint:</span>
              <div className="font-mono text-neutral-300 mt-1 select-all bg-black/40 px-2 py-1 rounded border border-white/5 truncate flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate">{resolveBaseGatewayUrl(apiEnvVal)}</span>
                  <span className="text-[9px] text-neutral-500 uppercase font-bold shrink-0 ml-2">
                    {apiEnvVal}
                  </span>
                </div>
                <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-bold border-t border-white/5 pt-1">
                  Source: {getEnvVarNameForEnv(apiEnvVal)}
                </div>
              </div>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Auto-Failover Strategy:</span>
              <p className="text-neutral-400 mt-1 leading-relaxed">
                {useRealApi 
                  ? "If the gateway or any microservice times out or fails (e.g., status 502/503), the circuit breaker trips instantly, and the system automatically falls back to your local Firestore cache safely."
                  : "Bypasses external endpoints entirely to ensure zero-latency local operations using pre-configured database mocks and client-side memory."}
              </p>
            </div>
          </div>
        </div>

        {/* State Toggle Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Mock / Live State */}
          <div className="p-5 rounded-xl border border-white/5 bg-neutral-900/30 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 tracking-wide uppercase flex items-center gap-2">
                  <Database className="size-3.5 text-primary" />
                  API Mock Mode
                </span>
                <Badge variant={useRealApi ? "outline" : "default"} className={cn(
                  "text-[10px] font-mono tracking-wider font-semibold",
                  useRealApi ? "text-neutral-400 border-white/5" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {useRealApi ? "Live Mode" : "Mocking"}
                </Badge>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Manually control the <code className="text-primary font-mono bg-neutral-950 px-1 py-0.5 rounded">nxclip_mock_api</code> local variable. When set to <code className="text-amber-400 font-mono">"true"</code>, the browser will fetch clean offline fake records.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant={!useRealApi ? "default" : "outline"}
                onClick={() => handleToggleState(false)}
                className={cn(
                  "w-full h-9 text-xs font-bold transition-all border-white/5 font-semibold",
                  !useRealApi 
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30" 
                    : "hover:bg-white/5 text-neutral-300"
                )}
              >
                <ToggleLeft className="size-4 mr-2" />
                Enable Mocks
              </Button>
              <Button
                variant={useRealApi ? "default" : "outline"}
                onClick={() => handleToggleState(true)}
                className={cn(
                  "w-full h-9 text-xs font-bold transition-all border-white/5",
                  useRealApi 
                    ? connectionStatus[apiEnvVal] === "testing"
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 font-semibold animate-pulse"
                      : connectionStatus[apiEnvVal] === "connected"
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 font-semibold"
                      : connectionStatus[apiEnvVal] === "failed"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30 font-semibold"
                      : "bg-primary text-primary-foreground hover:bg-primary/95"
                    : "hover:bg-white/5 text-neutral-300"
                )}
              >
                {useRealApi ? (
                  connectionStatus[apiEnvVal] === "testing" ? (
                    <>
                      <RefreshCcw className="size-4 mr-2 animate-spin text-amber-400" />
                      Testing Gateway...
                    </>
                  ) : connectionStatus[apiEnvVal] === "connected" ? (
                    <>
                      <CheckCircle2 className="size-4 mr-2 text-emerald-400" />
                      Gateway: Connected
                    </>
                  ) : connectionStatus[apiEnvVal] === "failed" ? (
                    <>
                      <AlertTriangle className="size-4 mr-2 text-destructive" />
                      Gateway: Offline
                    </>
                  ) : (
                    <>
                      <ToggleRight className="size-4 mr-2" />
                      Enable Live Gateway
                    </>
                  )
                ) : (
                  <>
                    <ToggleRight className="size-4 mr-2" />
                    Enable Live Gateway
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Card 2: Environment Profile Picker */}
          <div className="p-5 rounded-xl border border-white/5 bg-neutral-900/30 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 tracking-wide uppercase flex items-center gap-2">
                  <Server className="size-3.5 text-purple-400" />
                  API Env Profile
                </span>
                <Badge variant="outline" className="text-[10px] font-mono tracking-wider font-semibold border-white/5 text-purple-400">
                  {apiEnvVal}
                </Badge>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Manually control the <code className="text-purple-400 font-mono bg-neutral-950 px-1 py-0.5 rounded">nxclip_api_env</code> variable. Directs endpoint targeting profiles for all cloud analytics features.
              </p>
            </div>

            <div className="bg-zinc-950/65 p-1 rounded-xl flex border border-white/5">
              {(["development", "staging", "production"] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    setApiEnvVal(env);
                    safeLocalStorage.setItem("nxclip_api_env", env);
                    toast.success(`Switched target environment context to "${env}"`);
                    handleRunPingDiagnostics(mockApiVal === "true", env);
                  }}
                  className={cn(
                    "flex-1 py-1 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg relative transition-all outline-none",
                    apiEnvVal === env ? "text-purple-400 bg-neutral-900 shadow-inner border border-white/5" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {env.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Diagnostics and Ping Panel */}
          <div className="p-5 rounded-xl border border-white/5 bg-neutral-900/30 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-200 tracking-wide uppercase flex items-center gap-2">
                <Wifi className="size-3.5 text-emerald-400" />
                Live Connection Probe
              </span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Validate whether the local API Gateway serves packets smoothly. Triggers a test probe fetch and handles connectivity failures gracefully.
              </p>
            </div>

            {/* Always visible Target URL Display */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest font-mono">
                    Target Ping Gateway
                  </span>
                  {typeof window !== "undefined" && !(`${resolveBaseGatewayUrl(apiEnvVal)}/health`).startsWith(window.location.origin) && (
                    <Badge variant="outline" className="text-[8px] py-0 px-1 border-purple-500/30 text-purple-400 bg-purple-500/5 h-3.5">
                      PROXY MODE
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] text-emerald-500/80 font-bold font-mono tracking-tighter">ACTIVE</span>
                </div>
              </div>
              <div className="font-mono text-[10px] text-neutral-300 select-all bg-black/20 px-2 py-1.5 rounded border border-white/5 truncate">
                {resolveBaseGatewayUrl(apiEnvVal)}/health
              </div>
            </div>

            {/* Test result display */}
            {testResult && (
              <div className="space-y-3 pt-1">
                {/* Main Status Bar */}
                <div className={cn(
                  "rounded-lg border p-2.5 text-[11px] font-mono flex items-center justify-between",
                  testResult.success 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                    : "bg-destructive/5 border-destructive/20 text-destructive"
                )}>
                  <span className="flex items-center gap-1.5 overflow-hidden">
                    {testResult.success ? (
                      <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-3 text-destructive shrink-0" />
                    )}
                    <span className="font-semibold uppercase tracking-wider">
                      Gateway: {testResult.success ? "ONLINE" : "OFFLINE / BLOCK"}
                    </span>
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                    {testResult.timestamp}
                  </span>
                </div>

                {/* Precise Error Details (If Failed) */}
                {!testResult.success && testResult.errorDetails && (
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-destructive/20 text-[10px] space-y-1">
                    <span className="font-bold text-destructive uppercase tracking-wider font-mono block">
                      Diagnosis & Reason:
                    </span>
                    <p className="leading-relaxed font-sans text-neutral-300">
                      {testResult.errorDetails}
                    </p>
                  </div>
                )}

                {/* Firebase Fallback Plan Alert */}
                {testResult.fallbackActive && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider font-mono">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      Firebase Fallback Active
                    </div>
                    <p className="leading-relaxed text-neutral-300 font-sans">
                      {testResult.fallbackReason || "Operating in offline fallback mode using Firestore database as the primary source of truth."}
                    </p>
                  </div>
                )}
                
                {/* Gateway Online + Real API Active success indicator */}
                {testResult.success && !testResult.fallbackActive && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider font-mono">
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Live Transaction Syncing
                    </div>
                    <p className="leading-relaxed text-neutral-300 font-sans">
                      Direct connection established. Transactions are routed live to the NestJS cloud microservices architecture.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunPingDiagnostics()}
                className="flex-1 h-8 text-[11px] border-white/10 hover:bg-white/5 font-semibold"
                disabled={isTestingConnection}
              >
                <Play className={cn("size-3 mr-2 text-emerald-400", isTestingConnection && "animate-spin")} />
                {isTestingConnection ? "Probing Upstream..." : "Ping API Gateway"}
              </Button>
            </div>
          </div>
        </div>

        {/* Environmental variables inspect row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-white/5 pt-5">
          
          <div className="p-3 bg-black/30 rounded border border-white/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">
              VARIABLE: nxclip_mock_api
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-amber-400">
                {mockApiVal ? `"${mockApiVal}"` : "undefined"}
              </code>
              <span className="text-[9px] font-bold text-neutral-500 font-mono">
                [LocalStorage]
              </span>
            </div>
          </div>

          <div className="p-3 bg-black/30 rounded border border-white/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">
              VARIABLE: nx_use_real_api
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-primary">
                {realApiVal ? `"${realApiVal}"` : "undefined"}
              </code>
              <span className="text-[9px] font-bold text-neutral-500 font-mono">
                [LocalStorage]
              </span>
            </div>
          </div>

          <div className="p-3 bg-black/30 rounded border border-white/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">
              VARIABLE: nxclip_api_env
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-purple-400">
                "{apiEnvVal}"
              </code>
              <span className="text-[9px] font-bold text-neutral-500 font-mono">
                [LocalStorage]
              </span>
            </div>
          </div>

          <div className="p-3 bg-black/30 rounded border border-white/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">
              Storage Cache Maintenance
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-neutral-400 leading-tight">
                Clear network response caches.
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={handlePurgeCaches}
                className="h-7 px-2 text-[9px] font-bold text-destructive hover:text-white hover:bg-destructive/10 border border-white/5 shrink-0 uppercase"
              >
                <Trash2 className="size-3 mr-1" />
                Purge
              </Button>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
