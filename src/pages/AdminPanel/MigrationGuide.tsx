import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  Copy, 
  Check, 
  Cpu, 
  Database, 
  Code, 
  Network, 
  RefreshCw, 
  BookOpen,
  Info,
  FileDown,
  Activity
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import { jsPDF } from "jspdf";

interface DocSection {
  id: string;
  title: string;
  level: number;
}

export default function MigrationGuide() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"document" | "interactive_matrix">("document");
  const contentContainerRef = useRef<HTMLDivElement>(null);

  interface EndpointHealth {
    status: "checking" | "online" | "offline";
    latency: number | null;
    lastChecked: string;
  }

  const [healthStatus, setHealthStatus] = useState<Record<string, EndpointHealth>>({
    gateway: { status: "checking", latency: null, lastChecked: "" },
    auth: { status: "checking", latency: null, lastChecked: "" },
    content: { status: "checking", latency: null, lastChecked: "" },
    feed: { status: "checking", latency: null, lastChecked: "" },
    coach: { status: "checking", latency: null, lastChecked: "" },
    analytics: { status: "checking", latency: null, lastChecked: "" },
    notifications: { status: "checking", latency: null, lastChecked: "" },
  });
  const [autoPoll, setAutoPoll] = useState(true);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  const endpointsToPoll = useMemo(() => [
    { name: "API Gateway", url: "http://localhost:5000", key: "gateway", port: 5000 },
    { name: "Auth & Profiles", url: "http://localhost:5001/users/me", key: "auth", port: 5001 },
    { name: "Content & Video", url: "http://localhost:5002/content/upload-url", key: "content", port: 5002 },
    { name: "Social Feed", url: "http://localhost:5003/feed", key: "feed", port: 5003 },
    { name: "AI Creator Coach", url: "http://localhost:5004/ai-coach/chat/stream", key: "coach", port: 5004 },
    { name: "Metrics & Analytics", url: "http://localhost:5005/analytics/metrics", key: "analytics", port: 5005 },
    { name: "Live Notifications", url: "http://localhost:5006/events", key: "notifications", port: 5006, isWs: true }
  ], []);

  const checkSingleEndpoint = async (url: string, isWs = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const start = performance.now();
    try {
      if (isWs) {
        const probeUrl = url.replace("ws://", "http://").replace("wss://", "https://") + "/socket.io/?EIO=4&transport=polling";
        await fetch(probeUrl, {
          signal: controller.signal,
          credentials: "omit",
          mode: "no-cors"
        });
        clearTimeout(timeoutId);
        const end = performance.now();
        return { status: "online" as const, latency: Math.round(end - start) };
      } else {
        await fetch(url, {
          method: "GET",
          signal: controller.signal,
          credentials: "omit",
          mode: "no-cors"
        });
        clearTimeout(timeoutId);
        const end = performance.now();
        return { status: "online" as const, latency: Math.round(end - start) };
      }
    } catch {
      clearTimeout(timeoutId);
      return { status: "offline" as const, latency: null };
    }
  };

  const verifyAllEndpoints = async () => {
    setIsRefreshingHealth(true);
    const timestamp = new Date().toLocaleTimeString();

    const checked = await Promise.all(
      endpointsToPoll.map(async (ep) => {
        const res = await checkSingleEndpoint(ep.url, ep.isWs);
        return { key: ep.key, val: { status: res.status, latency: res.latency, lastChecked: timestamp } };
      })
    );

    setHealthStatus((prev) => {
      const next = { ...prev };
      checked.forEach(({ key, val }) => {
        next[key] = val;
      });
      return next;
    });
    setIsRefreshingHealth(false);
  };

  useEffect(() => {
    verifyAllEndpoints();
    
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (autoPoll) {
      intervalId = setInterval(() => {
        verifyAllEndpoints();
      }, 15000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoPoll, endpointsToPoll]);

  const overallHealth = useMemo(() => {
    const values = Object.values(healthStatus);
    const onlineCount = values.filter(v => v.status === "online").length;
    if (onlineCount === values.length) return "all_online";
    if (onlineCount > 0) return "partial";
    return "offline";
  }, [healthStatus]);

  // Fetch the migration guide document dynamically
  const fetchGuide = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/docs/migration-guide");
      if (!response.ok) {
        throw new Error("Failed to load guide from API");
      }
      const data = await response.json();
      setMarkdown(data.content);
    } catch (err) {
      // Try fetching from the static fallback path in public/docs
      try {
        const staticResponse = await fetch("/docs/nxclip-migration-guide.md");
        if (!staticResponse.ok) {
          throw new Error("Failed to load static guide file");
        }
        const text = await staticResponse.text();
        setMarkdown(text);
      } catch (staticErr) {
        console.warn("Migration Guide static fallback also failed:", staticErr);
        setMarkdown(`# nxClip Production Migration Blueprint & Integration Report

This report provides backend developers and lead engineers with a module-by-module integration architecture.

## Fallback Notice
The dynamic API endpoint is offline, and the static asset could not be loaded. Please check the network connectivity or server status.
`);
        toast.error("Resource Unavailable", {
          description: "Failed to connect to microservices guide API. Loaded fallback content."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuide();
  }, []);

  // Export roadmap as beautifully styled vector PDF with pagination and microservices headers
  const exportToPDF = () => {
    if (!markdown) {
      toast.error("Nothing to export", {
        description: "The migration roadmap document is currently empty or loading."
      });
      return;
    }

    try {
      toast.loading("Compiling vector PDF blueprint...", { id: "ds-pdf" });
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageHeight = 297;
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2); // 170mm
      let y = 30; // Start below the header area

      // Header Footer decorator
      const drawHeaderFooter = (pageNum: number, totalPages: number) => {
        doc.setPage(pageNum);
        
        // Header
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("nxclip.ai  |  PRODUCTION MIGRATION BLUEPRINT", margin, 15);
        
        // Top thin hairline
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.12);
        doc.line(margin, 17, pageWidth - margin, 17);
        
        // Footer thin hairline
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
        doc.text("CONFIDENTIAL  -  SYSTEMS ENGINEERING ROADMAP", margin, pageHeight - 11);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 11);
      };

      // Check current cursor, spawn page if overflowing
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 24) {
          doc.addPage();
          y = 30; // Reset content starts below the line
        }
      };

      // Header Banner on first page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(168, 85, 247); // Brand Purple
      doc.text("Production Migration Blueprint", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated on ${new Date().toLocaleDateString()}  -  Microservices Architecture Transition Guide`, margin, y);
      y += 12;

      // Split raw markdown into rows
      const lines = markdown.split("\n");
      let inCodeBlock = false;
      let codeContent: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines unless inside code block
        if (!line && !inCodeBlock) {
          y += 3;
          continue;
        }

        // Detect code region bounds
        if (line.startsWith("```")) {
          if (inCodeBlock) {
            inCodeBlock = false;
            
            // Draw compiled code box
            const codeText = codeContent.join("\n");
            doc.setFont("courier", "normal");
            doc.setFontSize(8);
            doc.setTextColor(147, 51, 234); // violet code text
            
            const wrappedCode = doc.splitTextToSize(codeText, contentWidth - 8);
            const boxHeight = wrappedCode.length * 3.8 + 8;
            
            checkPageBreak(boxHeight);
            
            // Draw background box shape
            doc.setFillColor(250, 250, 250); // soft clean gray
            doc.setDrawColor(220, 220, 220); // border gray
            doc.setLineWidth(0.2);
            doc.rect(margin, y, contentWidth, boxHeight, "FD");
            
            // Label box
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.setTextColor(140, 140, 140);
            doc.text("MICROSERVICE SOURCE SPEC SCHEMA / COMMANDS", margin + 4, y + 4.5);
            
            doc.setFont("courier", "normal");
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(wrappedCode, margin + 4, y + 9);
            y += boxHeight + 5;
            codeContent = [];
          } else {
            inCodeBlock = true;
          }
          continue;
        }

        if (inCodeBlock) {
          codeContent.push(lines[i]); // Preserve original line structure
          continue;
        }

        // Headings 1 (# ...)
        if (line.startsWith("# ")) {
          const text = line.replace("# ", "").trim();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(168, 85, 247); // brand purple
          
          checkPageBreak(12);
          y += 3;
          doc.text(text, margin, y);
          y += 8;
          continue;
        }

        // Headings 2 (## ...)
        if (line.startsWith("## ")) {
          const text = line.replace("## ", "").trim();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11.5);
          doc.setTextColor(99, 102, 241); // brand indigo
          
          checkPageBreak(9);
          y += 2;
          doc.text(text, margin, y);
          y += 6.5;
          continue;
        }

        // Headings 3 (### ...)
        if (line.startsWith("### ")) {
          const text = line.replace("### ", "").trim();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40); // blackish
          
          checkPageBreak(8);
          y += 2;
          doc.text(text, margin, y);
          y += 6;
          continue;
        }

        // Bullet point lines (- ... or * ...)
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const cleanBullet = line.substring(2).trim()
            .replace(/\*\*([^*]+)\*\*/g, "$1") // Strip bold tags
            .replace(/\*([^*]+)\*/g, "$1");
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          
          const wrappedText = doc.splitTextToSize(`•  ${cleanBullet}`, contentWidth - 4);
          const textHeight = wrappedText.length * 4;
          
          checkPageBreak(textHeight + 1.5);
          doc.text(wrappedText, margin + 3, y);
          y += textHeight + 1.8;
          continue;
        }

        // List Item indexing numbers (1. ...)
        if (/^\d+\.\s/.test(line)) {
          const numPrefix = line.match(/^(\d+\.)/)?.[1] || "1.";
          const cleanText = line.replace(/^\d+\.\s/, "").trim()
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1");
            
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          
          const wrappedText = doc.splitTextToSize(`${numPrefix} ${cleanText}`, contentWidth - 4);
          const textHeight = wrappedText.length * 4;
          
          checkPageBreak(textHeight + 1.5);
          doc.text(wrappedText, margin + 1.5, y);
          y += textHeight + 1.8;
          continue;
        }

        // Clean paragraphs
        const cleanP = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
        if (cleanP) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          
          const wrappedText = doc.splitTextToSize(cleanP, contentWidth);
          const textHeight = wrappedText.length * 4;
          
          checkPageBreak(textHeight + 1.5);
          doc.text(wrappedText, margin, y);
          y += textHeight + 1.8;
        }
      }

      // Format footer totals
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        drawHeaderFooter(p, totalPages);
      }

      // Deliver stream as system browser attachment
      doc.save("nxclip_production_migration_blueprint.pdf");
      toast.success("Blueprint exported!", {
        id: "ds-pdf",
        description: "Your migration blueprint guide has been successfully exported as a vector PDF document."
      });
    } catch (pdfErr) {
      console.error("PDF engine crash detail:", pdfErr);
      toast.error("Export Error", {
        id: "ds-pdf",
        description: "The local system was unable to create the PDF data buffer."
      });
    }
  };

  // Parse sections (headings) dynamically from the markdown to construct an interactive index
  const sections = useMemo((): DocSection[] => {
    if (!markdown) return [];
    
    const lines = markdown.split("\n");
    const parsed: DocSection[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        // Skip general title or small items
        if (title && !title.includes("SECTION") && !title.includes("nxClip")) {
          const id = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
          parsed.push({ id, title, level });
        }
      }
    });
    
    return parsed;
  }, [markdown]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Copied to Clipboard", {
      description: "Code fragment or database schema successfully copied."
    });
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Scroll smoothly to a specific section heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Pre-compiled quick reference modules for the Backend developers
  const modulesSummary = [
    { name: "Auth & Security", id: "module-a-user-authentication-security", status: "Ready", type: "Identity-Service (5001)" },
    { name: "Profiles Management", id: "module-b-profiles-user-management", status: "Ready", type: "Identity-Service (5001)" },
    { name: "Clip Editor & S3", id: "module-c-clip-editor-video-content-management", status: "Ready", type: "Content-Service (5002)" },
    { name: "Image Studio Workflows", id: "module-d-image-editor-meme-canvas", status: "Ready", type: "Content-Service (5002)" },
    { name: "Social Feed & Cursor Page", id: "module-e-social-feed-engagement-creator-relations", status: "Ready", type: "Feed-Service (5003)" },
    { name: "Analytics Logs", id: "module-f-aggregated-metrics-analytics-dashboard", status: "Ready", type: "Analytics-Service (5005)" },
    { name: "WebSocket Handshakes", id: "module-g-notifications-websockets-live-events", status: "Ready", type: "Notification-Service (5006)" },
    { name: "SSE AI Coach chat", id: "module-h-ai-creator-coach", status: "Ready", type: "AI-Service (5004)" },
    { name: "Docs & Sheets Integration", id: "module-i-google-workspace-hub-docs-sheets-integration", status: "Ready", type: "Identity/Workspace (5001)" },
  ];

  return (
    <div className="min-h-screen ui-bg-dashboard text-white p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon-lg"
              className="bg-zinc-900/40 border-white/10 hover:bg-zinc-900 text-muted-foreground hover:text-white"
              onClick={() => navigate("/admin")}
              aria-label="Back to admin panel"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-purple-400 size-6 shrink-0" />
                <h1 className="text-xl font-bold tracking-tight text-white m-0">
                  Production Migration Blueprint
                </h1>
                <Badge variant="brand-gradient" className="text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 rounded">
                  Gateway http://localhost:5000
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time dashboard mapping Google Auth & client-side Firestore MVP architecture to NestJS/Postgres Microservices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGuide}
              className="text-xs font-mono bg-zinc-900/40 border-white/5 hover:border-white/10 gap-1.5 h-9"
            >
              <RefreshCw size={12} className={cn("shrink-0", loading && "animate-spin")} />
              Sync API
            </Button>
            <Button
              variant="brand-gradient"
              size="sm"
              disabled={loading}
              onClick={exportToPDF}
              className="text-xs font-mono gap-1.5 h-9 font-bold tracking-wide shadow-soft"
            >
              <FileDown size={13} className="shrink-0" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab("document")}
            className={cn(
              "px-5 py-3 text-xs font-bold uppercase tracking-wider relative transition-all outline-none",
              activeTab === "document" ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Blueprint Document
            {activeTab === "document" && (
              <motion.div layoutId="doc-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("interactive_matrix")}
            className={cn(
              "px-5 py-3 text-xs font-bold uppercase tracking-wider relative transition-all outline-none",
              activeTab === "interactive_matrix" ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Hybrid Cache Registry (Redux vs Apollo)
            {activeTab === "interactive_matrix" && (
              <motion.div layoutId="doc-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
        </div>

        {activeTab === "document" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Nav Index Desk */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter keys or routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                />
              </div>

              {/* API Health Status Widget */}
              <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm shadow-soft">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Activity size={12} className={cn("text-purple-400", isRefreshingHealth && "animate-pulse")} />
                      <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">API Health Status</span>
                      <span className={cn(
                        "text-[7px] font-bold tracking-wider px-1 py-0.5 rounded-sm uppercase shrink-0 font-mono scale-90 origin-left border",
                        overallHealth === "all_online" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        overallHealth === "partial" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        overallHealth === "offline" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {overallHealth === "all_online" ? "ALL UP" : overallHealth === "partial" ? "PARTIAL" : "OFFLINE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAutoPoll(!autoPoll)}
                        className={cn(
                          "text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded transition-all",
                          autoPoll ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-zinc-800 text-zinc-500 border border-transparent"
                        )}
                        title="Toggle Auto Polling (15s)"
                      >
                        {autoPoll ? "AUTO: ON" : "AUTO: OFF"}
                      </button>
                      <button
                        onClick={verifyAllEndpoints}
                        disabled={isRefreshingHealth}
                        className="text-zinc-500 hover:text-white transition-all disabled:opacity-50"
                        title="Manual Ping"
                      >
                        <RefreshCw size={10} className={cn("shrink-0", isRefreshingHealth && "animate-spin")} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {endpointsToPoll.map((ep) => {
                      const stat = healthStatus[ep.key] || { status: "checking", latency: null, lastChecked: "" };
                      return (
                        <div
                          key={ep.key}
                          className="flex items-center justify-between p-2 rounded bg-zinc-950/20 hover:bg-white/5 border border-white/5 transition-all text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-300 block text-[10px]">{ep.name}</span>
                            <span className="text-[8px] font-mono text-zinc-500">Port {ep.port}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {stat.latency !== null && stat.status === "online" && (
                              <span className="text-[9px] font-mono text-emerald-400/90">{stat.latency}ms</span>
                            )}
                            
                            <div className="relative flex h-1.5 w-1.5">
                              {stat.status === "online" && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              )}
                              <span className={cn(
                                "relative inline-flex rounded-full h-1.5 w-1.5",
                                stat.status === "online" && "bg-emerald-500",
                                stat.status === "offline" && "bg-rose-500",
                                stat.status === "checking" && "bg-amber-500"
                              )} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[8px] text-zinc-500 font-mono pt-1.5 text-center border-t border-white/5">
                    Specs defined in{" "}
                    <span 
                      onClick={() => {
                        toast.info("Endpoint Specs Active", {
                          description: "Pings are executed in real-time against localhost dev gateways listed in api-reference.md."
                        });
                      }}
                      className="text-purple-400/90 underline cursor-pointer hover:text-purple-300 font-bold"
                    >
                      api-reference.md
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Board */}
              <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm shadow-soft">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Module Registry</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {modulesSummary.map((m) => (
                      <div 
                        key={m.id}
                        onClick={() => scrollToHeading(m.id)}
                        className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all"
                      >
                        <span className="font-semibold text-zinc-300 truncate max-w-[130px]">{m.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] font-mono text-zinc-500">{m.type.split(" ")[0]}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Table of Contents */}
              <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm shadow-soft">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={14} className="text-purple-400/90" />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Table of Contents</span>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-1 pr-2">
                      {sections.map((sec, idx) => (
                        <button
                          key={idx}
                          onClick={() => scrollToHeading(sec.id)}
                          className={cn(
                            "w-full text-left text-xs text-zinc-400 hover:text-white leading-tight py-1 block truncate transition-all",
                            sec.level === 3 ? "pl-3 font-semibold text-[11px] text-zinc-500 hover:text-zinc-300" : "font-black"
                          )}
                        >
                          {sec.title}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Document Content Desk */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-zinc-950 border border-white/5 shadow-2xl relative overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-mono text-xs text-zinc-500 lowercase">fetching blueprint metadata schema stream...</p>
                    </div>
                  ) : (
                    <div 
                      ref={contentContainerRef}
                      className="prose prose-invert prose-xs max-w-none text-zinc-300 font-sans leading-relaxed"
                    >
                      {/* Markdown Custom Renderer */}
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => {
                            const text = String(children);
                            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                            return (
                              <h1 id={id} className="text-2xl font-black text-white tracking-tight mt-8 mb-4 border-b border-white/10 pb-2 flex items-center gap-2 scroll-mt-24">
                                <Cpu size={18} className="text-purple-400" />
                                {children}
                              </h1>
                            );
                          },
                          h2: ({ children }) => {
                            const text = String(children);
                            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                            return (
                              <h2 id={id} className="text-lg font-bold text-white tracking-tight mt-6 mb-3 flex items-center gap-2 scroll-mt-24">
                                <Network size={16} className="text-indigo-400" />
                                {children}
                              </h2>
                            );
                          },
                          h3: ({ children }) => {
                            const text = String(children);
                            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                            return (
                              <h3 id={id} className="text-sm font-semibold tracking-wide text-zinc-200 mt-5 mb-2 uppercase text-purple-400 scroll-mt-24">
                                {children}
                              </h3>
                            );
                          },
                          p: ({ children }) => <p className="text-xs text-zinc-400 mb-4">{children}</p>,
                          li: ({ children }) => <li className="text-xs text-zinc-400 mb-1 leading-relaxed list-disc list-inside">{children}</li>,
                          code: ({ children }) => {
                            const codeString = String(children).replace(/\n$/, "");
                            const isBlock = codeString.includes("\n") || codeString.length > 40;
                            
                            if (isBlock) {
                              const isCopied = copiedText === codeString;
                              return (
                                <div className="my-4 rounded-lg border border-white/10 bg-zinc-900/60 overflow-hidden relative font-mono text-[11px] select-all group shadow-inner">
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900">
                                    <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
                                      <Code size={10} className="text-zinc-500" />
                                      Deployment snippet / schema rules
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(codeString)}
                                      className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 transition-all outline-none"
                                      title="Copy code to clipboard"
                                    >
                                      {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                  <pre className="p-4 overflow-x-auto text-[11px] text-zinc-300 leading-normal scrollbar-none max-h-72">
                                    <code>{codeString}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return (
                              <code className="bg-white/5 text-purple-400 px-1.5 py-0.5 rounded font-mono text-[11px] tracking-tight border border-white/5">
                                {children}
                              </code>
                            );
                          },
                          table: ({ children }) => (
                            <div className="w-full overflow-x-auto my-6 rounded-lg border border-white/5 shadow-soft">
                              <table className="w-full text-xs text-left text-zinc-400 border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900/50 border-b border-white/10">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
                          th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
                          td: ({ children }) => <td className="px-4 py-3 font-mono text-zinc-300">{children}</td>,
                          hr: () => <Separator className="bg-white/5 my-8" />
                        }}
                      >
                        {markdown}
                      </ReactMarkdown>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <Card className="bg-zinc-950 border border-white/5 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="ui-icon-chip-primary w-10 h-10 shadow-soft">
                    <Info size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Understanding store cache allocations</h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                      To optimize user interactivity, standard UI operations are split between local transient state arrays (maintained inside Redux Toolkit slices) and production GraphQL servers (stored inside Apollo Client's in-memory index mappings).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Authentication keys", slice: "authSlice", scope: "Redux State", desc: "Dynamic route protections, user role syncs, and Bearer validation rules." },
                    { title: "Creator portfolios", slice: "Apollo Queries", scope: "Apollo Cache", desc: "Maintains relational channel listings and category attributes." },
                    { title: "Media marker loops", slice: "clipSlice", scope: "Redux State", desc: "Tracks real-time timestamp sliders, sound triggers, and visual overlays." },
                    { title: "Live notifications Hub", slice: "notificationsSlice", scope: "Socket.IO Feed", desc: "Dynamic unread flags, live alerts, and background job statuses." }
                  ].map((matrix, idx) => (
                    <Card key={idx} className="bg-zinc-900/40 border-white/5 overflow-hidden shadow-inner">
                      <CardContent className="p-5 flex items-start gap-4 justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{matrix.title}</h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{matrix.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={matrix.scope === "Redux State" ? "outline" : "brand-gradient"} className="text-[9px] uppercase tracking-wider">
                            {matrix.scope}
                          </Badge>
                          <p className="text-[10px] font-mono text-zinc-500 mt-1">{matrix.slice}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
