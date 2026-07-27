import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Palette, 
  Type, 
  Sparkles, 
  Layers, 
  Layout, 
  Check, 
  Copy, 
  Info, 
  Play, 
  Maximize2, 
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export default function DesignSystem() {
  const navigate = useNavigate();
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "components" | "layouts">("colors");

  // State for interactive element playground demo
  const [btnLoading, setBtnLoading] = useState(false);
  const [demoBadgeVariant, setDemoBadgeVariant] = useState<"default" | "brand-gradient" | "destructive" | "outline">("brand-gradient");

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success(`Copied ${label}`, {
      description: `"${value}" is now in your clipboard.`
    });
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const colors = {
    brand: [
      { name: "Brand Primary", hex: "linear-gradient(to right, #a855f7, #6366f1)", value: "bg-gradient-to-r from-purple-500 to-indigo-500", desc: "Main brand button CTA action state." },
      { name: "Purple Neon", hex: "#a855f7", value: "bg-purple-500", desc: "Focal markers, selection borders, and premium badges." },
      { name: "Indigo Tech", hex: "#6366f1", value: "bg-indigo-500", desc: "Interactive states, secondary gradients, links." }
    ],
    slateGraphite: [
      { name: "UI Dark Canvas", hex: "#09090b", value: "bg-zinc-950", desc: "Base platform background for pages." },
      { name: "Panel Base", hex: "rgba(24, 24, 27, 0.4)", value: "bg-zinc-900/40 border-white/5", desc: "Glassmorphism panels with thin borders." },
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
    { tag: "h3", style: "text-sm font-semibold tracking-wide uppercase", label: "Semantic Core Blueprint Subheading", size: "14px / Semibold" },
    { tag: "p", style: "text-xs text-zinc-400 leading-relaxed font-sans", label: "Standard Compact Explanatory Paragraph and details", size: "12px / Regular" },
    { tag: "code", style: "font-mono text-[11px] bg-white/5 text-purple-400 px-1.5 py-0.5 rounded border border-white/5", label: "npm i @google/genai --save", size: "11px / JetBrains Mono" }
  ];

  return (
    <div className="min-h-screen ui-bg-dashboard text-white p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon-lg"
              className="bg-zinc-900/40 border-white/10 hover:bg-zinc-900 text-muted-foreground hover:text-white"
              onClick={() => navigate("/admin")}
              aria-label="Back to admin"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Palette className="text-purple-400 size-6 shrink-0" />
                <h1 className="text-xl font-bold tracking-tight text-white m-0">
                  nxclip.ai Design System
                </h1>
                <Badge variant="brand-gradient" className="text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 rounded">
                  System Tokens v1.2
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                A unified design showroom catalog of core UI design specs, semantic color palettes, compact typography, and interactive components.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 scrollbar-none overflow-x-auto">
          {[
            { id: "colors", label: "Colors & Palettes", icon: Palette },
            { id: "typography", label: "Typography & Scaling", icon: Type },
            { id: "components", label: "Interactive Components", icon: Sparkles },
            { id: "layouts", label: "Borders, Layers & Spacing", icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "colors" | "typography" | "components" | "layouts")}
                className={cn(
                  "px-5 py-3 text-xs font-bold uppercase tracking-wider relative transition-all outline-none flex items-center gap-2 shrink-0",
                  activeTab === tab.id ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={14} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="ds-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content screens */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "colors" && (
              <motion.div
                key="colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Brand Colors */}
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3 block">
                    Brand Core Gradients & Highlights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {colors.brand.map((c, idx) => (
                      <Card key={idx} className="bg-zinc-900/40 border-white/5 overflow-hidden group shadow-soft hover:border-white/10 transition-all">
                        <div className={cn("h-24 w-full relative", c.value)} style={c.name.includes("Primary") ? { background: c.hex } : {}}>
                          <button 
                            onClick={() => handleCopy(c.hex, c.name)}
                            className="absolute right-2 top-2 bg-black/60 opacity-0 group-hover:opacity-100 p-1.5 rounded text-white hover:bg-black/90 transition-all outline-none"
                            title="Copy HEX Code"
                          >
                            {copiedValue === c.hex ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <CardContent className="p-4 space-y-1 bg-zinc-950/80">
                          <h4 className="text-xs font-bold text-white uppercase">{c.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500 block">{c.hex}</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{c.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Graphite slate layering colors */}
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3 block">
                    Slate, Graphite & Glassmorphism Panels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {colors.slateGraphite.map((c, idx) => (
                      <Card key={idx} className="bg-zinc-900/40 border-white/5 overflow-hidden group shadow-soft hover:border-white/10 transition-all">
                        <div className={cn("h-24 w-full relative", c.value, "flex items-center justify-center")}>
                          <span className="text-[10px] font-mono font-bold tracking-widest text-[#FFF]/20">nxclip style</span>
                          <button 
                            onClick={() => handleCopy(c.hex, c.name)}
                            className="absolute right-2 top-2 bg-black/60 opacity-0 group-hover:opacity-100 p-1.5 rounded text-white hover:bg-black/90 transition-all outline-none"
                            title="Copy Token Color"
                          >
                            {copiedValue === c.hex ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <CardContent className="p-4 space-y-1 bg-zinc-950/80">
                          <h4 className="text-xs font-bold text-white uppercase">{c.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500 block">{c.hex}</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{c.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Semantics & Status States */}
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3 block">
                    Semantic Status Alerts & Pings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {colors.semantics.map((c, idx) => (
                      <Card key={idx} className="bg-zinc-900/40 border-white/5 overflow-hidden group shadow-soft hover:border-white/10 transition-all">
                        <div className={cn("h-24 w-full relative", c.value)}>
                          <button 
                            onClick={() => handleCopy(c.hex, c.name)}
                            className="absolute right-2 top-2 bg-black/60 opacity-0 group-hover:opacity-100 p-1.5 rounded text-white hover:bg-black/90 transition-all outline-none"
                            title="Copy Hex"
                          >
                            {copiedValue === c.hex ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <CardContent className="p-4 space-y-1 bg-zinc-950/80">
                          <h4 className="text-xs font-bold text-white uppercase">{c.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500 block">{c.hex}</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{c.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "typography" && (
              <motion.div
                key="typography"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="bg-zinc-950 border border-white/5 overflow-hidden shadow-soft">
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                      <div className="ui-icon-chip-primary w-10 h-10 shadow-soft">
                        <Type size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white tracking-tight">Compact Creator-Tech Typography</h2>
                        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                          Our typography pairing system focuses on high reading density, clean structural layout, and spacious tracking. It uses the custom <code className="text-purple-400">Inter</code> font-sans for core UI text, and <code className="text-purple-400">JetBrains Mono</code> as code accents.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {fontHierarchies.map((f, idx) => (
                        <div key={idx} className="group border-b border-white/5 pb-6 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                            <span>{f.tag.toUpperCase()} Tag Specifications</span>
                            <div className="flex items-center gap-2">
                              <span>Size Details: {f.size}</span>
                              <button 
                                onClick={() => handleCopy(f.style, `Class of ${f.tag}`)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-all outline-none p-1 rounded"
                                title="Copy Tailwind Classes"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                          {f.tag === "h1" && <h1 className={f.style}>{f.label}</h1>}
                          {f.tag === "h2" && <h2 className={f.style}>{f.label}</h2>}
                          {f.tag === "h3" && <h3 className={f.style}>{f.label}</h3>}
                          {f.tag === "p" && <p className={f.style}>{f.label}</p>}
                          {f.tag === "code" && <code className={f.style}>{f.label}</code>}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "components" && (
              <motion.div
                key="components"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Button Classes & Actions showroom */}
                <Card className="bg-zinc-950 border border-white/5 shadow-soft p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">Standard Buttons & Hover Interactivities</h3>
                    <p className="text-[11px] text-zinc-500">Every button has tailored cursor scales and hover parameters.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Primary Gradient CTA</span>
                        <Button variant="brand-gradient" size="default">
                          Compile Reel Clip
                        </Button>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Secondary Outline</span>
                        <Button variant="outline" size="default">
                          Save as draft
                        </Button>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Alert Trigger</span>
                        <Button variant="destructive" size="default">
                          Delete workspace log
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase">Interactive sandbox playground</span>
                      <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                          <p className="text-xs font-semibold text-white">Click button below to trigger dynamic loader state</p>
                          <p className="text-[10px] text-zinc-500">Sinks the action, simulates render queues, and fires notifications.</p>
                        </div>
                        <Button 
                          variant="brand-gradient" 
                          size="sm"
                          disabled={btnLoading}
                          onClick={() => {
                            setBtnLoading(true);
                            toast.loading("Sending S3 metadata details...", { id: "ds-action" });
                            setTimeout(() => {
                              setBtnLoading(false);
                              toast.success("Meme generation completed!", { 
                                id: "ds-action", 
                                description: "Render job dispatched asynchronously." 
                              });
                            }, 2000);
                          }}
                          className="gap-2 shrink-0"
                        >
                          {btnLoading ? (
                            <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <Play size={12} />
                          )}
                          Render Job
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Badges system */}
                <Card className="bg-zinc-950 border border-white/5 shadow-soft p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">Badge elements & Status classifications</h3>
                    <p className="text-[11px] text-zinc-500">Small pill structures to surface user roles, plan tiers, and job states.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Brand highlight</span>
                        <Badge variant="brand-gradient">STUDIO TIER</Badge>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Default dark</span>
                        <Badge variant="default">FREE ACCOUNT</Badge>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Critical state</span>
                        <Badge variant="destructive">QUEUE TIMEOUT</Badge>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block mb-1">Light borders</span>
                        <Badge variant="outline">published</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase">Dynamic badge selection</span>
                      <p className="text-[11px] text-zinc-500">Toggle variant pills dynamically to preview interactive sizing details:</p>
                      <div className="flex flex-col md:flex-row items-center gap-4 bg-zinc-900/50 p-4 border border-white/5 rounded-lg justify-between">
                        <div className="flex gap-1.5 shrink-0">
                          {(["default", "brand-gradient", "destructive", "outline"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setDemoBadgeVariant(v)}
                              className={cn(
                                "px-2 py-1 text-[10px] font-mono rounded border transition-all text-zinc-400 hover:text-white capitalize",
                                demoBadgeVariant === v ? "bg-white/10 border-white/20 text-white" : "bg-black/25 border-transparent hover:border-white/5"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <div className="shrink-0">
                          <Badge variant={demoBadgeVariant}>Active display</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "layouts" && (
              <motion.div
                key="layouts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Spacing card */}
                  <Card className="bg-zinc-950 border border-white/5 p-6 space-y-4">
                    <div className="ui-icon-chip-primary w-10 h-10 shadow-soft">
                      <Layout size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Spacing density system</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        To maintain compact and highly legible developer charts, padding ranges conform strictly to the Neutral graphite system limits:
                      </p>
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-zinc-500">Inner card padding</span>
                        <span className="text-purple-400">p-4 to p-6 (16px–24px)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-zinc-500">Component structures</span>
                        <span className="text-purple-400">space-y-3 to space-y-6</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">Margin boundaries</span>
                        <span className="text-purple-400">mx-auto max-w-7xl</span>
                      </div>
                    </div>
                  </Card>

                  {/* Border card */}
                  <Card className="bg-zinc-950 border border-white/5 p-6 space-y-4">
                    <div className="ui-icon-chip-primary w-10 h-10 shadow-soft">
                      <Maximize2 size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Border & overlay shadows</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Double border overlays are created with overlapping thin gradients and internal box drop shadows to simulate extreme depth:
                      </p>
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-zinc-500">Default borders</span>
                        <span className="text-purple-400">border-white/5 (thin grey)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-zinc-500">Overlay hover state</span>
                        <span className="text-purple-400">border-white/10 (bright overlay)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">Platform card shadow</span>
                        <span className="text-purple-400">shadow-soft / shadow-2xl</span>
                      </div>
                    </div>
                  </Card>

                  {/* Errors card */}
                  <Card className="bg-zinc-950 border border-white/5 p-6 space-y-4">
                    <div className="ui-icon-chip-primary w-10 h-10 shadow-soft">
                      <AlertTriangle size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Unified error alert shapes</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        To align user notices with the dynamic API error schemas detailed in the microservice contract logs:
                      </p>
                    </div>
                    <div className="pt-2">
                      <div className="p-3 bg-red-900/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] leading-relaxed font-mono flex items-start gap-2">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold flex items-center gap-1">Error Mapping [403 FORBIDDEN]</span>
                          <span className="text-zinc-400 block mt-0.5">Correlation ID: 8f86b402-73a1-4be0-80de-6f8afcc060a8</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
