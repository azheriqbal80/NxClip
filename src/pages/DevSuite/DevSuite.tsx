import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  Cpu, 
  Network, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Palette, 
  Type, 
  CheckCircle,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Zap,
  Activity,
  Table,
  List,
  Sliders,
  Tag,
  Edit3,
  AlertCircle,
  ShieldCheck,
  Layers,
  Info,
  Calendar,
  Plus,
  User,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Square,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import TokenShowroom from "./TokenShowroom";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

import { 
  selectMockApiEnabled, 
  selectApiEnv, 
  setApiEnv,
  setConnectionStatus,
  selectConnectionStatus,
  selectErrorReasons,
  setConnectionError,
  clearConnectionError
} from "../../store/slices/uiSlice";

import { resolveBaseGatewayUrl, getEnvVarNameForEnv } from "../../services/apiClient";

import { ServiceHealthDashboard } from "../../components/Admin/ServiceHealthDashboard";
import { CircuitBreakersDashboard } from "../../components/Admin/CircuitBreakersDashboard";
import { ServiceTester } from "../../components/Admin/ServiceTester";
import { HealthCheckProbe } from "../../components/DevSuite/HealthCheckProbe";
import { NetworkDiagnosticPanel } from "../../components/DevSuite/NetworkDiagnosticPanel";



interface Transaction {
  id: string;
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  endpoint: string;
  service: string;
  serviceKey: string;
  status: number;
  latency: number;
}

// Premium Inline Sparkline Component
function Sparkline({ data, width = 64, height = 18 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) {
    return <span className="text-zinc-600 text-[10px] font-mono select-none">—</span>;
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Determine stroke color based on current latency value (the last one)
  const currentVal = data[data.length - 1];
  let strokeColor = "#a855f7"; // purple-500 (good)
  if (currentVal > 150) strokeColor = "#f59e0b"; // amber-500 (high latency)
  if (currentVal > 300) strokeColor = "#ef4444"; // red-500 (critical latency)
  if (currentVal === 0) strokeColor = "#71717a"; // offline (gray)

  const gradId = `sparkline-grad-${Math.random().toString(36).substr(2, 4)}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none inline-block font-sans">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#${gradId})`}
        stroke="none"
      />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="1.5"
        fill={strokeColor}
      />
    </svg>
  );
}

export default function DevSuite() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from Redux
  const mockApiEnabled = useSelector(selectMockApiEnabled);
  const apiEnv = useSelector(selectApiEnv);
  const connectionStatus = useSelector(selectConnectionStatus);
  const errorReasons = useSelector(selectErrorReasons);

  // Active Tab handling (?tab=)
  const activeTab = searchParams.get("tab") || "cluster";
  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const testEnvConnection = async (env: "development" | "staging" | "production") => {
    dispatch(setConnectionStatus({ env, status: "testing" }));
    const baseUrl = resolveBaseGatewayUrl(env);
    let timeoutId: any;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const targetUrl = `${baseUrl}/health`;
      const isCrossOrigin = typeof window !== "undefined" && !targetUrl.startsWith(window.location.origin) && targetUrl.startsWith("http");

      let response: Response;

      // Primary attempt: Direct fetch to verify connectivity AND CORS
      try {
        response = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
        });
      } catch (err) {
        // If it's cross-origin and failed, it's often a CORS block or total downtime
        if (isCrossOrigin && !(err instanceof DOMException && err.name === "AbortError")) {
          // Try a secondary attempt via proxy to see if it's online but just CORS-blocked
          const proxyUrl = `/api/proxy-health?url=${encodeURIComponent(targetUrl)}`;
          try {
            const proxyResponse = await fetch(proxyUrl, { method: "GET", signal: controller.signal });
            if (proxyResponse.ok) {
              const json = await proxyResponse.json().catch(() => null);
              if (json && (json.ok || json.status === "ok" || json.status === 200)) {
                // It's online and reachable via Proxy!
                dispatch(setConnectionStatus({ env, status: "connected" }));
                dispatch(clearConnectionError(env));
                toast.success(`Connected to ${env} gateway via Proxy!`, {
                  description: "Direct connection was blocked by CORS, but requests are safely routed through the server proxy."
                });
                clearTimeout(timeoutId);
                return;
              }
            }
          } catch { /* ignore proxy failure */ }
        }
        throw err; // Re-throw to main catch if it wasn't a specific CORS scenario we handled
      }

      clearTimeout(timeoutId);
      if (response.ok) {
        dispatch(setConnectionStatus({ env, status: "connected" }));
        dispatch(clearConnectionError(env));
        toast.success(`Successfully connected to ${env} gateway!`);
      } else {
        let errorMessage = `Status ${response.status}`;
        let details = "The gateway server returned an error status.";
        try {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data.error) errorMessage = data.error;
            else if (data.message) errorMessage = data.message;
            if (data.data && typeof data.data === "object") {
              details = data.data.message || data.data.error || data.data.details || JSON.stringify(data.data);
            }
          } catch {
            if (text && text.length < 100) errorMessage = text;
          }
        } catch { /* ignore */ }
        
        dispatch(setConnectionStatus({ env, status: "failed" }));
        dispatch(setConnectionError({ env, reason: `HTTP Error: ${errorMessage}`, details }));
        toast.error(`Failed to connect to ${env} gateway`, {
          description: errorMessage
        });
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (baseUrl.includes("localhost") || baseUrl.includes("ais-dev") || baseUrl.includes("127.0.0.1")) {
        dispatch(setConnectionStatus({ env, status: "connected" }));
        dispatch(clearConnectionError(env));
        return;
      }
      
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const reason = isAbort ? "Request timed out" : (err instanceof Error ? err.message : "Connection attempt failed");
      const details = isAbort 
        ? `The connection attempt to ${baseUrl}/health took too long (exceeded 8s).`
        : `An unexpected browser or local proxy error occurred: ${err instanceof Error ? err.message : "Unknown issue"}.`;

      dispatch(setConnectionStatus({ env, status: "failed" }));
      dispatch(setConnectionError({ env, reason, details }));
      toast.error(`Connectivity failure on ${env} gateway`, {
        description: reason
      });
    }
  };

  // --- TAB 1: CLUSTER & NETWORK STATE ---
  const [latencyHistory, setLatencyHistory] = useState<Record<string, number[]>>({
    gateway: [12, 18, 15, 22, 14, 19, 11, 15, 17, 20],
    auth: [34, 45, 38, 52, 41, 48, 30, 42, 35, 40],
    content: [89, 95, 112, 105, 98, 120, 94, 108, 101, 115],
    feed: [22, 28, 25, 30, 24, 29, 21, 26, 23, 27],
    coach: [310, 345, 320, 395, 330, 380, 298, 350, 312, 340],
    analytics: [54, 62, 58, 68, 61, 65, 50, 59, 55, 60],
    notifications: [18, 24, 20, 28, 22, 25, 17, 21, 19, 23],
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx_init_1",
      timestamp: new Date(Date.now() - 3000).toLocaleTimeString() + ".045",
      method: "GET",
      endpoint: "/analytics/realtime",
      service: "Metrics & Analytics",
      serviceKey: "analytics",
      status: 200,
      latency: 58
    },
    {
      id: "tx_init_2",
      timestamp: new Date(Date.now() - 5000).toLocaleTimeString() + ".112",
      method: "POST",
      endpoint: "/content/render-mp4",
      service: "Content & Video",
      serviceKey: "content",
      status: 201,
      latency: 115
    },
    {
      id: "tx_init_3",
      timestamp: new Date(Date.now() - 9000).toLocaleTimeString() + ".340",
      method: "GET",
      endpoint: "/users/me/profile",
      service: "Auth & Profiles",
      serviceKey: "auth",
      status: 200,
      latency: 40
    }
  ]);

  const [isLogPaused, setIsLogPaused] = useState(false);
  const [txSearchInput, setTxSearchInput] = useState("");

  const filteredTxs = useMemo(() => {
    if (!txSearchInput.trim()) return transactions;
    const query = txSearchInput.toLowerCase().trim();
    return transactions.filter(t => 
      t.endpoint.toLowerCase().includes(query) || 
      t.service.toLowerCase().includes(query) || 
      t.method.toLowerCase().includes(query) || 
      t.status.toString().includes(query)
    );
  }, [transactions, txSearchInput]);

  // continuous realistic background traffic generation to keep the transaction logs fully active
  useEffect(() => {
    if (activeTab !== "cluster" || isLogPaused) return;

    const mockPaths = [
      { method: "GET" as const, path: "/users/me/profile", service: "Auth & Profiles", key: "auth" },
      { method: "POST" as const, path: "/content/render-mp4", service: "Content & Video", key: "content" },
      { method: "GET" as const, path: "/content/explore", service: "Content & Video", key: "content" },
      { method: "GET" as const, path: "/feed/trending", service: "Social Feed", key: "feed" },
      { method: "POST" as const, path: "/ai-coach/context/inject", service: "AI Creator Coach", key: "coach" },
      { method: "GET" as const, path: "/analytics/realtime", service: "Metrics & Analytics", key: "analytics" },
      { method: "GET" as const, path: "/events/count", service: "Live Notifications", key: "notifications" }
    ];

    const interval = setInterval(() => {
      const template = mockPaths[Math.floor(Math.random() * mockPaths.length)];
      
      const baseHistory = latencyHistory[template.key] || [40];
      const avg = baseHistory.reduce((a, b) => a + b, 0) / baseHistory.length;
      const noise = Math.floor(Math.random() * 20) - 10;
      const latency = Math.max(5, Math.round(avg + noise));

      const newTx: Transaction = {
        id: `tx_sim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString() + "." + String(Date.now() % 1000).padStart(3, "0"),
        method: template.method,
        endpoint: template.path,
        service: template.service,
        serviceKey: template.key,
        status: Math.random() > 0.04 ? (template.method === "POST" ? 201 : 200) : 503, // 4% simulated error rate
        latency
      };

      setTransactions((prev) => [newTx, ...prev].slice(0, 50));

      // Append new check point to evolve active sparkline live!
      setLatencyHistory((prev) => {
        const next = { ...prev };
        const history = prev[template.key] || [];
        next[template.key] = [...history, latency].slice(-15);
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [activeTab, isLogPaused, latencyHistory]);



  // --- TAB 3: DESIGN TOKENS SHOWCASE (From DesignSystem.tsx) ---
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [dsSubTab, setDsSubTab] = useState<"architecture" | "foundations" | "components" | "patterns">("architecture");
  const [dsActiveSection, setDsActiveSection] = useState<"colors" | "typography" | "spacing" | "effects" | "graphic">("colors");
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<string>("overview");
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [tableSortField, setTableSortField] = useState<"name" | "status" | "rate">("name");
  
  // Interactive inputs demo states
  const [demoInputText, setDemoInputText] = useState("api-node-west.nxclip.ai");
  const [demoInputSelect, setDemoInputSelect] = useState("production");
  const [demoInputErrorState, setDemoInputErrorState] = useState(false);

  // Playground interactive components demo states
  const [selectedDemoComp, setSelectedDemoComp] = useState<string>("button");
  const [demoCheckboxChecked, setDemoCheckboxChecked] = useState(true);
  const [demoChipSelected, setDemoChipSelected] = useState("all-nodes");
  const [demoPaginationPage, setDemoPaginationPage] = useState(1);
  const [demoNeedsAttention, setDemoNeedsAttention] = useState(true);

  // Pattern Demo Patient State
  const [patternTableMode, setPatternTableMode] = useState<"data" | "empty" | "loading">("data");
  const [selectedPatternPatients, setSelectedPatternPatients] = useState<string[]>([]);

  const colors = {
    brand: [
      { name: "Brand Primary (Gradient)", hex: "linear-gradient(to right, #a855f7, #6366f1)", value: "bg-gradient-to-r from-purple-500 to-indigo-500", desc: "Main brand button CTA action state." },
      { name: "Purple Neon", hex: "#a855f7", value: "bg-purple-500", desc: "Focal markers, selection borders, and premium badges." },
      { name: "Indigo Tech", hex: "#6366f1", value: "bg-indigo-500", desc: "Interactive states, secondary gradients, links." },
      { name: "Coffee/800 (Primitive)", hex: "#2e2520", value: "bg-[#2e2520]", desc: "Warm shadow primitive accent color." },
      { name: "Sage/500 (Primitive)", hex: "#789481", value: "bg-[#789481]", desc: "Neutral organic green status primitive." }
    ],
    slateGraphite: [
      { name: "UI Dark Canvas", hex: "#09090b", value: "bg-zinc-950", desc: "Base platform background for pages." },
      { name: "Panel Base (Glassmorphic)", hex: "rgba(24, 24, 27, 0.4)", value: "bg-zinc-900/40 border-white/5", desc: "Glassmorphism panels with thin borders." },
      { name: "High Contrast Overlays", hex: "rgba(255, 255, 255, 0.05)", value: "bg-white/5 border-white/10", desc: "Muted borders and inner box backgrounds." },
      { name: "Active Selection", hex: "rgba(255, 255, 255, 0.1)", value: "bg-white/10", desc: "Hover state cells and selected sidebar segments." }
    ],
    semantics: [
      { name: "Ready Success", hex: "#10b981", value: "bg-emerald-500", desc: "Success alerts, complete statuses, and active pings." },
      { name: "Warning Alert", hex: "#f59e0b", value: "bg-amber-500", desc: "Warning logs, pending rendering queues, and limit flags." },
      { name: "Failed Block", hex: "#ef4444", value: "bg-red-500", desc: "Error messages, deleted clips, moderation alerts." }
    ]
  };

  const fontHierarchies = [
    { tag: "h1", style: "text-2xl font-black font-sans tracking-tight", label: "Display Page Hero Title", size: "24px / Extrabold" },
    { tag: "h2", style: "text-lg font-bold font-sans tracking-tight", label: "Module Panel Heading", size: "18px / Bold" },
    { tag: "h3", style: "text-xs font-semibold tracking-wider uppercase font-mono text-purple-400", label: "Semantic Core Blueprint Subheading", size: "12px / JetBrains Mono" },
    { tag: "p", style: "text-xs text-zinc-400 leading-relaxed font-sans", label: "Standard Compact Explanatory Paragraph and details", size: "12px / Regular" },
    { tag: "code", style: "font-mono text-[11px] bg-white/5 text-purple-400 px-1.5 py-0.5 rounded border border-white/5", label: "npm i @google/genai --save", size: "11px / JetBrains Mono" }
  ];

  // Spacing & Radius scales derived from architecture blueprint
  const spacingScale = [
    { name: "space-1", size: "4px", cls: "w-1 h-1 bg-purple-500", desc: "Micro gaps, internal checkbox offsets." },
    { name: "space-2", size: "8px", cls: "w-2 h-2 bg-purple-500", desc: "Subtle inner margins, labels padding." },
    { name: "space-4", size: "16px", cls: "w-4 h-4 bg-purple-500", desc: "Default layout margins, list items spacing." },
    { name: "space-6", size: "24px", cls: "w-6 h-6 bg-purple-500", desc: "Outer panel internal padding, headers spacing." },
    { name: "space-8", size: "32px", cls: "w-8 h-8 bg-purple-500", desc: "Section breaks, layout segments split offsets." },
    { name: "space-12", size: "48px", cls: "w-12 h-12 bg-purple-500", desc: "Major page column grids, hero headers." }
  ];

  const radiusScale = [
    { name: "radius-sm", value: "4px", cls: "rounded-sm", desc: "Checkbox wrappers, small tags." },
    { name: "radius-md", value: "8px", cls: "rounded-md", desc: "Segmented pills, miniature badges." },
    { name: "radius-lg", value: "12px", cls: "rounded-lg", desc: "Standard buttons, dropdown containers, input fields." },
    { name: "radius-xl", value: "16px", cls: "rounded-2xl", desc: "Primary page cards, dashboard panels, modal containers." }
  ];

  const effectsScale = [
    { name: "Shadow Soft (Elevated)", value: "shadow-[0_4px_20px_rgba(0,0,0,0.5)]", cls: "shadow-[0_4px_20px_rgba(0,0,0,0.5)]", desc: "Elevate overlay popups and dropdowns." },
    { name: "Glass Premium border", value: "border border-white/5 bg-white/[0.02] backdrop-blur-md", cls: "border border-white/5 bg-white/[0.02] backdrop-blur-md", desc: "Glassmorphism card backgrounds." },
    { name: "Focus Halo glow", value: "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40", cls: "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40", desc: "Visual access tracking on buttons and inputs." },
    { name: "Standard motion ease", value: "transition-all duration-300 ease-out", cls: "transition-all duration-300 ease-out", desc: "Fade overlays, slide drawer menus, accordion expansions." }
  ];

  const handleCopyDsToken = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success(`Copied ${label}`, { description: `"${value}" stored in clipboard.` });
    setTimeout(() => setCopiedValue(null), 1500);
  };

  return (
    <div className="min-h-screen ui-bg-dashboard text-white p-4 md:p-8" id="dev-suite-workspace">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Superior UX Top Header with connection metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="text-purple-400 size-6 shrink-0 animate-pulse" />
                <h1 className="text-xl font-bold font-display tracking-tight text-white mb-0">
                  nxclip Developer Suite
                </h1>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest text-purple-400 border-purple-500/20 uppercase font-mono">
                  ACTIVE DEVSUITE
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-medium font-sans">
                Comprehensive console for cluster networking routing controls, Mock API intercepts, transition roadmaps, and UI layout tokens.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            {/* Global Connection Pillar Badge */}
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/5 px-3 py-1.5 rounded-lg">
              <span className="text-zinc-500">MAPPING ENVIRONMENT:</span>
              <span className="text-amber-400 font-bold uppercase">{apiEnv}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/5 px-3 py-1.5 rounded-lg">
              <span className="text-zinc-500">INTERCEPT SERVICE STATUS:</span>
              <span className={cn("font-bold uppercase", mockApiEnabled ? "text-amber-400" : "text-emerald-400")}>
                {mockApiEnabled ? "MOCKS ACTIVE" : "REAL API DIRECT"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout with horizontal tabs */}
        <div className="space-y-6">
          
          {/* Glassmorphism Navigation Horizontal Bar */}
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm shadow-soft rounded-2xl overflow-hidden p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div className="flex flex-col shrink-0">
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono mb-0.5">
                Console Console Hub
              </h3>
              <p className="text-[9px] text-zinc-500 font-sans leading-none hidden md:block">
                Select developer console perspective
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow max-w-4xl">
              {[
                { id: "cluster", label: "Cluster & Network Gateway", icon: Network, desc: "Env routers, mock toggles, microservices pollers." },
                { id: "diagnostics", label: "Connection Diagnostics", icon: ShieldCheck, desc: "Live health probes, header analysis, and network debugging." },
                { id: "tokens", label: "Design Token Showroom", icon: Palette, desc: "Colors, text scale, card shadows, elements playground." }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all duration-200 outline-none text-left select-none relative group border",
                      isSelected 
                        ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-purple-500/30 text-white shadow-[0_0_12px_rgba(168,85,247,0.05)]" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/30 border-transparent"
                    )}
                  >
                    <TabIcon className={cn("size-5 mt-0.5 shrink-0", isSelected ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold font-sans tracking-wide truncate">{tab.label}</div>
                      <div className="text-[10px] text-zinc-500 leading-normal line-clamp-1 truncate">{tab.desc}</div>
                    </div>
                    {isSelected && (
                      <motion.div 
                        layoutId="sidebar-h-notch"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-purple-500 rounded-t"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Core Content Terminal Workspace with animations */}
          <div className="w-full min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "cluster" && (
                <motion.div
                  key="cluster"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Environment Selector Cluster Grid */}
                  <Card className="bg-zinc-900/40 border-white/5 rounded-2xl backdrop-blur-sm p-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">Primary Microservice Env Target</h4>
                      <p className="text-xs text-muted-foreground font-sans">
                        Configures the base URL matching global client context router endpoints.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          value: "development",
                          label: "Development local",
                          url: resolveBaseGatewayUrl("development"),
                          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          description: "Direct local developer backend container. Standard dev sandbox proxy state."
                        },
                        {
                          value: "staging",
                          label: "Staging sandbox",
                          url: resolveBaseGatewayUrl("staging"),
                          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          description: "Pre-production cluster sync. Runs hot database snapshots and mock stream logs."
                        },
                        {
                          value: "production",
                          label: "Production global",
                          url: resolveBaseGatewayUrl("production"),
                          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                          description: "Primary enterprise cluster servicing production world-class components worldwide."
                        }
                      ].map((opt) => {
                        const isSelected = apiEnv === opt.value;
                        const status = connectionStatus[opt.value as "development" | "staging" | "production"] || "idle";
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              dispatch(setApiEnv(opt.value as "development" | "staging" | "production"));
                              toast.success(`Switched to ${opt.label}`, {
                                description: `Inbound endpoints synced target context parameters.`,
                                duration: 3000
                              });
                              testEnvConnection(opt.value as "development" | "staging" | "production");
                            }}
                            className={cn(
                              "flex flex-col text-left p-4 rounded-xl border transition-all duration-200 outline-none select-none relative",
                              isSelected 
                                ? status === "connected"
                                  ? "bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/5"
                                  : status === "failed"
                                  ? "bg-zinc-900 border-rose-500/60 shadow-lg shadow-rose-500/5"
                                  : status === "testing"
                                  ? "bg-zinc-900 border-amber-500/60 shadow-lg shadow-amber-500/5 animate-pulse"
                                  : "bg-zinc-900 border-purple-500/60 shadow-lg shadow-purple-500/5"
                                : status === "connected"
                                ? "bg-emerald-500/2 border-emerald-500/10 hover:bg-emerald-500/5 hover:border-emerald-500/20"
                                : status === "failed"
                                ? "bg-rose-500/2 border-rose-500/10 hover:bg-rose-500/5 hover:border-rose-500/20"
                                : status === "testing"
                                ? "bg-amber-500/2 border-amber-500/10 hover:bg-amber-500/5 hover:border-amber-500/20"
                                : "bg-zinc-950/20 border-white/5 hover:bg-zinc-900/40 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{opt.label}</span>
                                {typeof window !== "undefined" && !opt.url.startsWith(window.location.origin) && opt.url.startsWith("http") && (
                                  <Badge variant="outline" className="text-[7px] py-0 px-1 border-purple-500/30 text-purple-400 bg-purple-500/5 h-3">
                                    PROXY
                                  </Badge>
                                )}
                              </div>
                              <span className={cn("text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest", opt.badgeColor)}>
                                {opt.value}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed line-clamp-2 mb-3 h-8">
                              {opt.description}
                            </p>
                            {status === "failed" && errorReasons[opt.value as "development" | "staging" | "production"] && (
                              <div className="mb-3 p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg text-left flex flex-col gap-0.5 pointer-events-none select-none">
                                <span className="font-bold text-[9px] text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                                  {errorReasons[opt.value as "development" | "staging" | "production"]?.reason}
                                </span>
                                <p className="text-[8px] text-rose-400/80 leading-normal font-sans line-clamp-2" title={errorReasons[opt.value as "development" | "staging" | "production"]?.details}>
                                  {errorReasons[opt.value as "development" | "staging" | "production"]?.details}
                                </p>
                              </div>
                            )}
                            <div className="mt-auto pt-2 border-t border-white/5 w-full flex items-center justify-between">
                              <div className="flex flex-col gap-0.5 max-w-[60%]">
                                <code className="text-[9px] text-zinc-500 font-mono truncate">{opt.url}</code>
                                <span className="text-[7px] text-zinc-600 font-mono uppercase tracking-tighter">
                                  Var: {getEnvVarNameForEnv(opt.value)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {status === "testing" && (
                                  <span className="text-[9px] font-bold text-amber-400 font-mono flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                                    TESTING
                                  </span>
                                )}
                                {status === "connected" && (
                                  <span className="text-[9px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-400" />
                                    CONNECTED
                                  </span>
                                )}
                                {status === "failed" && (
                                  <span className="text-[9px] font-bold text-rose-400 font-mono flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-rose-400" />
                                    OFFLINE
                                  </span>
                                )}
                                {isSelected && (
                                  <CheckCircle className={cn(
                                    "size-3 shrink-0",
                                    status === "connected" ? "text-emerald-400" :
                                    status === "failed" ? "text-rose-400" :
                                    status === "testing" ? "text-amber-400" : "text-purple-400"
                                  )} />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Upstream Microservice Telemetry */}
                  <ServiceHealthDashboard />

                  {/* API Integration & Circuit Breaker Dashboard */}
                  <CircuitBreakersDashboard />

                  {/* Service Tester & Mode Controller */}
                  <ServiceTester />

                  {/* Real-time API Transaction Log component */}
                  <Card className="bg-zinc-900/40 border-white/5 rounded-2xl backdrop-blur-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Activity className="text-purple-400 size-4 animate-pulse" />
                          <h4 className="text-sm font-bold text-white font-display">Real-time API Transaction Log</h4>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider font-mono uppercase animate-pulse">
                            ● Streaming Live
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans">
                          Active streaming outbound microservice REST queries & websocket metrics processed client-side.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Search Bar inside Transaction Logs */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 size-3" />
                          <input
                            type="text"
                            value={txSearchInput}
                            onChange={(e) => setTxSearchInput(e.target.value)}
                            placeholder="Filter queries..."
                            className="bg-zinc-950/60 border border-white/5 pl-8 pr-3 py-1 rounded-lg text-[11px] font-medium text-white placeholder-zinc-650 focus:border-purple-500/40 outline-none w-36 focus:w-48 transition-all"
                          />
                        </div>

                        {/* Control buttons */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsLogPaused(!isLogPaused)}
                          className={cn(
                            "h-7 text-[10px] font-mono font-bold border-white/5 flex items-center gap-1",
                            isLogPaused ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                          )}
                        >
                          {isLogPaused ? <Play size={10} /> : <Pause size={10} />}
                          {isLogPaused ? "Resume" : "Pause"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTransactions([]);
                            toast.success("Transaction log cleared.");
                          }}
                          className="h-7 text-[10px] font-mono font-bold bg-zinc-900/40 border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <Trash2 size={10} />
                          Clear
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Generate simulated burst of load (e.g. 5 rapid transactions)
                            const services = [
                              { method: "GET" as const, path: "/feed/list", service: "Social Feed", key: "feed" },
                              { method: "POST" as const, path: "/clips/render", service: "Content & Video", key: "content" },
                              { method: "GET" as const, path: "/coach/context", service: "AI Creator Coach", key: "coach" },
                              { method: "GET" as const, path: "/analytics/reports/daily", service: "Metrics & Analytics", key: "analytics" },
                              { method: "POST" as const, path: "/auth/refresh-token", service: "Auth & Profiles", key: "auth" }
                            ];
                            
                            const bursts: Transaction[] = [];
                            for (let i = 0; i < 5; i++) {
                              const s = services[Math.floor(Math.random() * services.length)];
                              const hist = latencyHistory[s.key] || [50];
                              const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
                              const latency = Math.max(5, Math.round(avg + (Math.random() * 40 - 20)));
                              bursts.push({
                                id: `tx_burst_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
                                timestamp: new Date(Date.now() - i * 150).toLocaleTimeString() + "." + String(Math.abs(Date.now() - i * 150) % 1000).padStart(3, "0"),
                                method: s.method,
                                endpoint: s.path,
                                service: s.service,
                                serviceKey: s.key,
                                status: Math.random() > 0.05 ? (s.method === "POST" ? 201 : 200) : 500,
                                latency
                              });
                            }
                            setTransactions(prev => [...bursts, ...prev].slice(0, 50));
                            toast.success("Dispatched simulated diagnostic traffic burst!");
                          }}
                          className="h-7 text-[10px] font-mono font-bold bg-zinc-900/40 border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <Zap size={10} className="text-amber-450 animate-pulse" />
                          Simulate Load
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {filteredTxs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-1 select-none">
                          <Activity size={24} className="text-zinc-750 animate-pulse animate-duration-1000" />
                          <p className="text-xs font-bold text-zinc-500 font-sans">No transactions captured</p>
                          <p className="text-[10px] text-zinc-600 font-sans">Toggle Resume or click Force Refresh to generate endpoint traffic</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse font-mono">
                          <thead>
                            <tr className="border-b border-white/5 bg-zinc-900/40 text-[9px] uppercase tracking-wider text-zinc-500">
                              <th className="p-2.5 pl-3">Timestamp</th>
                              <th className="p-2.5">Method</th>
                              <th className="p-2.5">Endpoint Path</th>
                              <th className="p-2.5">Target Cluster</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5 text-right pr-4">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-[11px]">
                            {filteredTxs.map((tx) => {
                              const history = latencyHistory[tx.serviceKey] || [];
                              return (
                                <tr key={tx.id} className="hover:bg-white/[0.015] transition-colors group">
                                  <td className="p-2.5 pl-3 text-zinc-500 select-all font-mono">{tx.timestamp}</td>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none tracking-wide",
                                      tx.method === "GET" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                      tx.method === "POST" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                      tx.method === "DELETE" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                      tx.method === "PUT" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                      tx.method === "OPTIONS" && "bg-zinc-800 text-zinc-400 border-zinc-700"
                                    )}>
                                      {tx.method}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-zinc-200">{tx.endpoint}</td>
                                  <td className="p-2.5 text-zinc-400 font-sans font-medium text-xs">{tx.service}</td>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-bold",
                                      tx.status < 300 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      <span className={cn("w-1 h-1 rounded-full", tx.status < 300 ? "bg-emerald-500" : "bg-rose-500")} />
                                      {tx.status} {tx.status === 201 ? "Created" : tx.status === 200 ? "OK" : "Error"}
                                    </span>
                                  </td>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "font-semibold",
                                      tx.latency < 50 ? "text-emerald-400" : tx.latency < 150 ? "text-amber-400" : "text-rose-400"
                                    )}>
                                      {tx.latency} ms
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right pr-4">
                                    <Sparkline data={history} width={48} height={14} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}



              {activeTab === "diagnostics" && (
                <motion.div
                  key="diagnostics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="bg-zinc-900/40 border-white/5 rounded-2xl backdrop-blur-sm p-6">
                    <HealthCheckProbe />
                  </Card>

                  <Card className="bg-zinc-900/40 border-white/5 rounded-2xl backdrop-blur-sm p-6">
                    <NetworkDiagnosticPanel />
                  </Card>
                </motion.div>
              )}

              {activeTab === "tokens" && (
                <motion.div
                  key="tokens"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <TokenShowroom />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
