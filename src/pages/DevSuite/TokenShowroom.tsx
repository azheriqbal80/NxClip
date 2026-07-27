import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Palette, 
  Type, 
  Sliders, 
  Table, 
  HelpCircle, 
  Check, 
  Copy, 
  Plus, 
  User, 
  AlertTriangle, 
  ChevronDown, 
  Search, 
  Edit3, 
  Trash2, 
  Activity, 
  AlertCircle, 
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  Square,
  FileText
} from "lucide-react";
import { toast } from "sonner";

// Helper utility for conditionally joining classNames
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TokenShowroom() {
  const [dsSubTab, setDsSubTab] = useState<"architecture" | "foundations" | "components" | "patterns">("architecture");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Foundations States
  const [customText, setCustomText] = useState("The quick brown fox jumps over the lazy dog");
  const [selectedRadius, setSelectedRadius] = useState<"sm" | "md" | "lg" | "xl">("lg");

  // Components States
  const [selectedDemoComp, setSelectedDemoComp] = useState<string>("button");
  const [demoCheckboxChecked, setDemoCheckboxChecked] = useState(true);
  const [demoChipSelected, setDemoChipSelected] = useState("all-nodes");
  const [demoPaginationPage, setDemoPaginationPage] = useState(1);
  const [demoNeedsAttention, setDemoNeedsAttention] = useState(true);
  const [demoInputText, setDemoInputText] = useState("api-node-west.nxclip.ai");
  const [demoInputError, setDemoInputError] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Pattern states
  const [patternTableMode, setPatternTableMode] = useState<"data" | "empty" | "loading">("data");
  const [selectedPatternPatients, setSelectedPatternPatients] = useState<string[]>([]);
  const [patternSearch, setPatternSearch] = useState("");

  const handleCopyDsToken = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success(`Copied ${label}`, { description: `"${value}" copied to clipboard.` });
    setTimeout(() => setCopiedValue(null), 1500);
  };

  // Static Token definitions
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
    { name: "Shadow Soft (Elevated)", value: "shadow-[0_4px_20px_rgba(0,0,0,0.5)]", desc: "Elevate overlay popups and dropdowns." },
    { name: "Glass Premium border", value: "border border-white/5 bg-white/[0.02] backdrop-blur-md", desc: "Glassmorphism card backgrounds." },
    { name: "Focus Halo glow", value: "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40", desc: "Visual access tracking on buttons and inputs." },
    { name: "Standard motion ease", value: "transition-all duration-300 ease-out", desc: "Fade overlays, slide drawer menus, accordion expansions." }
  ];

  const toggleSelectPatient = (id: string) => {
    setSelectedPatternPatients(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAllPatients = (ids: string[]) => {
    if (selectedPatternPatients.length === ids.length) {
      setSelectedPatternPatients([]);
    } else {
      setSelectedPatternPatients(ids);
    }
  };

  return (
    <div className="space-y-6">
      {/* Design Token Showroom Sub-navigation */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex bg-zinc-950/60 p-1.5 rounded-xl border border-white/5 overflow-x-auto max-w-full scrollbar-none gap-1.5 w-full">
          {[
            { id: "architecture", label: "Architecture", icon: HelpCircle },
            { id: "foundations", label: "Foundations", icon: Palette },
            { id: "components", label: "Components", icon: Sliders },
            { id: "patterns", label: "Patterns", icon: Table }
          ].map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.id}
                onClick={() => setDsSubTab(sub.id as any)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all outline-none flex items-center justify-center gap-2 shrink-0 relative min-w-[120px]",
                  dsSubTab === sub.id ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={12} />
                <span className="relative z-10">{sub.label}</span>
                {dsSubTab === sub.id && (
                  <motion.div layoutId="ds-subtab-indicator" className="absolute inset-0 bg-zinc-900 border border-white/5 rounded-lg shadow-inner" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: ARCHITECTURE */}
        {dsSubTab === "architecture" && (
          <motion.div
            key="architecture"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Visual Header Summary Banner */}
            <div className="bg-gradient-to-r from-purple-950/20 to-indigo-950/10 border border-purple-500/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Foundations Complete
                </span>
                <h3 className="text-lg font-black text-white font-sans">Three-tier Design System Architecture</h3>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Every UI element, layout, and visual flow in this workspace is derived from semantic tokens. 
                  When tokens change, the entire system dogfoods the update, ensuring strict aesthetic consistency across views.
                </p>
              </div>
            </div>

            {/* How it's Organized */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider mb-3">How it's organized</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center font-bold text-xs">1</div>
                  <h5 className="text-xs font-bold text-white font-sans">Tier 1: Foundations</h5>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Raw values bound to variables (Color, Typography, Spacing & Radius, Effects, Graphic Language). 
                    No custom hardcoded hex values or raw pixel offsets are permitted in components.
                  </p>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">2</div>
                  <h5 className="text-xs font-bold text-white font-sans">Tier 2: Components</h5>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Modular UI atoms and molecules assembled ONLY from foundation tokens (Button, Cell, Checkbox, Chip, Input, Icon, Row, Needs-attention item).
                  </p>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center font-bold text-xs">3</div>
                  <h5 className="text-xs font-bold text-white font-sans">Tier 3: Patterns</h5>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    High-level, reusable templates forming whole screens (Patient list tables with active, loading, and empty modes, toolbars, and dynamic bulk bars).
                  </p>
                </div>
              </div>
            </div>

            {/* Core System Principles */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider mb-3">Core system principles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: "Source of Truth", desc: "Tokens reference variables and styles; never hardcode colors, paddings, or shadows." },
                  { title: "Semantic First", desc: "Reach for role tokens (text/primary, surface/card) before primitives (neutral/800)." },
                  { title: "Anchor Guidelines", desc: "Strictly extend what exists; do not invent unique visual components outside the layout." },
                  { title: "Restraint is Brand", desc: "One primary brand highlight per viewport, minimal palettes, and generous neutrals." },
                  { title: "Docs Dogfooding", desc: "Every sheet compiles from the tokens it documents, so updates instantly refresh pages." }
                ].map((p, i) => (
                  <div key={i} className="bg-zinc-950/40 border border-white/5 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-400">P.0{i+1}</span>
                    <h5 className="text-xs font-bold text-white font-sans">{p.title}</h5>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Naming & Status Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Naming Guide */}
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Token Naming Structure</h4>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Dual-layered architecture for maximum predictability and code autocompletion.</p>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-sans">Layer 1: Primitives</span>
                      <span className="text-[9px] font-mono text-zinc-500">Values & family steps</span>
                    </div>
                    <code className="text-[10.5px] font-mono text-purple-400 block">coffee/800, sage/500, space-4, radius-md</code>
                    <p className="text-[10px] text-zinc-500 font-sans">Raw design specifications. Build the foundation variables.</p>
                  </div>

                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-sans">Layer 2: Semantics</span>
                      <span className="text-[9px] font-mono text-zinc-500 font-bold text-purple-400">Recommended</span>
                    </div>
                    <code className="text-[10.5px] font-mono text-purple-400 block">text/primary, surface/card, brand/primary, feedback/error</code>
                    <p className="text-[10px] text-zinc-500 font-sans">Roles pointing to a primitive. Used directly in client-side classes.</p>
                  </div>
                </div>
              </div>

              {/* Status & Roadmap */}
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Library Status & Roadmap</h4>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Development sprint logs and component prioritization checklist.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">Done / Active</span>
                    <ul className="text-[10px] text-zinc-400 space-y-1.5 font-sans">
                      <li className="flex items-center gap-1"><Check size={10} className="text-emerald-500 shrink-0" /> Foundations Complete</li>
                      <li className="flex items-center gap-1"><Check size={10} className="text-emerald-500 shrink-0" /> Built Core Atoms</li>
                      <li className="flex items-center gap-1"><Check size={10} className="text-emerald-500 shrink-0" /> First Pattern Done</li>
                      <li className="flex items-center gap-1"><Check size={10} className="text-emerald-500 shrink-0" /> Token Showroom</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-400 block">Up Next</span>
                    <ul className="text-[10px] text-zinc-400 space-y-1.5 font-sans">
                      <li className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shrink-0" /> Select Dropdown</li>
                      <li className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" /> Date Input Picker</li>
                      <li className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" /> Informational Callouts</li>
                      <li className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" /> Micro modal triggers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: FOUNDATIONS */}
        {dsSubTab === "foundations" && (
          <motion.div
            key="foundations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Color section */}
            <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Colors & Gradients</h4>
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Brand Gradient & Accent Primitive</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {colors.brand.map((c, i) => (
                      <div key={i} className="bg-zinc-950/40 border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all">
                        <div className={cn("h-12 w-full relative", c.value)} />
                        <div className="p-3 space-y-1">
                          <span className="text-[11px] font-bold text-white block truncate">{c.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono block truncate">{c.value}</span>
                          <button 
                            onClick={() => handleCopyDsToken(c.value, c.name)}
                            className="text-[9px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-1.5 border-t border-white/5 w-full text-left"
                          >
                            <Copy size={8} /> Copy Classes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Slate Graphite Neutrals</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {colors.slateGraphite.map((c, i) => (
                      <div key={i} className="bg-zinc-950/40 border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all">
                        <div className={cn("h-12 w-full relative border-b border-white/5", c.value)} />
                        <div className="p-3 space-y-1">
                          <span className="text-[11px] font-bold text-white block truncate">{c.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono block truncate">{c.value}</span>
                          <button 
                            onClick={() => handleCopyDsToken(c.value, c.name)}
                            className="text-[9px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-1.5 border-t border-white/5 w-full text-left"
                          >
                            <Copy size={8} /> Copy Classes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Section with Live Previewer */}
            <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Typography Specs</h4>
                  <p className="text-[11px] text-zinc-500 font-sans">Inter is mapped to UI layouts, paired with JetBrains Mono for metrics and diagnostics logs.</p>
                </div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type to preview font scales..."
                  className="bg-zinc-950/80 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/30 w-full sm:w-64 transition-all"
                />
              </div>

              <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-5">
                {fontHierarchies.map((f, i) => {
                  const CustomTag = f.tag as any;
                  return (
                    <div key={i} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center pb-4 border-b border-white/5 last:border-b-0 last:pb-0">
                      <div className="lg:col-span-1">
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">{f.tag} scale</span>
                        <span className="text-[9px] text-zinc-500 block">{f.size}</span>
                      </div>
                      <div className="lg:col-span-2">
                        <CustomTag className={cn(f.style, "truncate")}>{customText}</CustomTag>
                      </div>
                      <div className="lg:col-span-1 flex justify-end">
                        <button
                          onClick={() => handleCopyDsToken(f.style, `${f.tag} style`)}
                          className="text-[9px] font-mono text-zinc-400 hover:text-white border border-white/5 px-2 py-1 rounded bg-zinc-900/40 flex items-center gap-1"
                        >
                          <Copy size={9} /> Copy Class
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spacing & Radius Section with Interactive Morpher */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spacer Scales */}
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Spacing scale (paddings & margins)</h4>
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-3.5">
                  {spacingScale.map((s, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white font-sans">{s.name}</span>
                        <span className="text-[9px] text-zinc-500 font-mono block">{s.size} ({s.desc})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("bg-purple-500 rounded-sm", s.cls)} />
                        <button
                          onClick={() => handleCopyDsToken(s.name, s.name)}
                          className="text-[9px] font-mono text-zinc-400 hover:text-white"
                        >
                          <Copy size={9} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radius Morpher Card */}
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Border Radius Showcase</h4>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Select a size to see the interactive card morph its layout corners.</p>
                </div>

                <div className="flex justify-center py-6">
                  {/* Morpher Card */}
                  <div className={cn(
                    "w-48 h-28 bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
                    selectedRadius === "sm" && "rounded-sm",
                    selectedRadius === "md" && "rounded-md",
                    selectedRadius === "lg" && "rounded-xl",
                    selectedRadius === "xl" && "rounded-3xl"
                  )}>
                    <span className="text-xs font-mono font-bold text-white">CORNER MORPH</span>
                    <span className="text-[10px] text-purple-300 font-mono">{selectedRadius} ({selectedRadius === "sm" ? "4px" : selectedRadius === "md" ? "8px" : selectedRadius === "lg" ? "12px" : "24px"})</span>
                  </div>
                </div>

                <div className="bg-zinc-950/60 p-1.5 rounded-xl border border-white/5 flex gap-1">
                  {(["sm", "md", "lg", "xl"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRadius(r)}
                      className={cn(
                        "flex-1 py-1 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all outline-none relative",
                        selectedRadius === r ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <span className="relative z-10">{r}</span>
                      {selectedRadius === r && (
                        <motion.div layoutId="radius-capsule" className="absolute inset-0 bg-zinc-900 border border-white/5 rounded-lg shadow-inner" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Effects and Motion scale */}
            <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Effects and Interactive States</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {effectsScale.map((e, i) => (
                  <div key={i} className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl space-y-1.5 hover:border-white/10 transition-colors">
                    <span className="text-[10px] font-mono text-purple-400">E.0{i+1}</span>
                    <h5 className="text-xs font-bold text-white font-sans">{e.name}</h5>
                    <p className="text-[10px] text-zinc-500 leading-normal">{e.desc}</p>
                    <code className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900/60 px-1 py-0.5 rounded border border-white/5 block truncate">{e.value}</code>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: COMPONENTS */}
        {dsSubTab === "components" && (
          <motion.div
            key="components"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"
          >
            {/* Component Catalog Side bar */}
            <div className="lg:col-span-1 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-2 pl-2">Core Component Atoms</span>
              {[
                { id: "button", label: "Button Component", icon: Sliders },
                { id: "checkbox", label: "Checkbox Cell", icon: Square },
                { id: "chip", label: "Chip Filter", icon: Palette },
                { id: "avatar", label: "Avatar Stack", icon: User },
                { id: "input", label: "Input Fields", icon: Edit3 },
                { id: "status_tile", label: "Status Pings", icon: Activity },
                { id: "pagination", label: "Pagination Node", icon: Table },
                { id: "attention", label: "Needs-Attention", icon: AlertTriangle },
                { id: "select", label: "Upcoming: Select", icon: ChevronDown, secondary: true },
                { id: "callout", label: "Upcoming: Callout", icon: Info, secondary: true }
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedDemoComp(c.id)}
                    className={cn(
                      "w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-xl transition-all outline-none font-sans font-semibold",
                      selectedDemoComp === c.id 
                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-300" 
                        : "text-zinc-400 hover:bg-white/[0.02] border border-transparent hover:text-zinc-200",
                      c.secondary && "opacity-60"
                    )}
                  >
                    <Icon size={12} className="shrink-0" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Playground, Props & Guidelines Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Visual Demo Card */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Interactive Preview</span>
                
                <div className="bg-zinc-950/60 rounded-xl border border-white/5 p-8 flex items-center justify-center min-h-[140px]">
                  {selectedDemoComp === "button" && (
                    <div className="flex flex-wrap gap-4">
                      <button 
                        disabled={btnLoading}
                        onClick={() => {
                          setBtnLoading(true);
                          toast.loading("Dispatched event task...", { id: "ds-btn-trigger" });
                          setTimeout(() => {
                            setBtnLoading(false);
                            toast.success("Event evaluated cleanly!", { id: "ds-btn-trigger" });
                          }, 1500);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold h-10 px-5 text-xs rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all uppercase tracking-wider flex items-center gap-1"
                      >
                        {btnLoading && <Activity size={12} className="animate-spin text-white" />}
                        {btnLoading ? "Processing" : "Primary brand action"}
                      </button>

                      <button 
                        onClick={() => toast.message("Secondary trigger captured.")}
                        className="bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-200 font-bold h-10 px-5 text-xs rounded-xl uppercase tracking-wider transition-colors"
                      >
                        Secondary outline
                      </button>

                      <button 
                        onClick={() => toast.error("Critical warning state active.")}
                        className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold h-10 px-5 text-xs rounded-xl uppercase tracking-wider transition-colors"
                      >
                        Danger Alert
                      </button>
                    </div>
                  )}

                  {selectedDemoComp === "checkbox" && (
                    <div className="flex items-center gap-3 bg-zinc-900/60 p-4 border border-white/5 rounded-xl w-72">
                      <button
                        onClick={() => setDemoCheckboxChecked(!demoCheckboxChecked)}
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                          demoCheckboxChecked 
                            ? "bg-purple-500 border-purple-500 text-white" 
                            : "border-white/20 hover:border-white/30 bg-transparent"
                        )}
                      >
                        {demoCheckboxChecked && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div>
                        <span className="text-xs font-bold text-white block">Patient Active Node</span>
                        <span className="text-[10px] text-zinc-500 font-mono block">Status: {demoCheckboxChecked ? "Selected" : "Idle"}</span>
                      </div>
                    </div>
                  )}

                  {selectedDemoComp === "chip" && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all-nodes", label: "All Clinic Nodes" },
                        { id: "attention-req", label: "Needs Attention" },
                        { id: "active-nodes", label: "Active Gateways" }
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setDemoChipSelected(ch.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                            demoChipSelected === ch.id 
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-300" 
                              : "border-white/5 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDemoComp === "avatar" && (
                    <div className="flex items-center gap-6">
                      {/* Stack */}
                      <div className="flex -space-x-2">
                        {["GP", "SJ", "AI"].map((init, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[9px] font-bold text-white border-2 border-zinc-950 shadow-md",
                              i === 0 ? "from-purple-500 to-indigo-500" : i === 1 ? "from-pink-500 to-rose-500" : "from-emerald-500 to-teal-500"
                            )}
                          >
                            {init}
                          </div>
                        ))}
                      </div>

                      {/* Single Avatar with Status Dot */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-soft">
                          AZ
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  {selectedDemoComp === "input" && (
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase text-zinc-400">Server Alias IP</label>
                        <button 
                          onClick={() => setDemoInputError(!demoInputError)}
                          className="text-[9px] font-mono text-purple-400"
                        >
                          Toggle Error: {demoInputError ? "On" : "Off"}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={demoInputText}
                          onChange={(e) => setDemoInputText(e.target.value)}
                          className={cn(
                            "w-full h-10 px-3 bg-zinc-950/40 border rounded-xl text-xs text-white focus:outline-none transition-all placeholder-zinc-600 font-sans",
                            demoInputError 
                              ? "border-rose-500/40 focus:border-rose-500/60 ring-1 ring-rose-500/10" 
                              : "border-white/10 focus:border-purple-500/40"
                          )}
                        />
                        {demoInputError && <AlertCircle size={14} className="absolute right-3 top-3 text-rose-400" />}
                      </div>
                      {demoInputError && <span className="text-[10px] text-rose-400 font-sans leading-none block">Value contain invalid domain host formats.</span>}
                    </div>
                  )}

                  {selectedDemoComp === "status_tile" && (
                    <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                      <div className="bg-zinc-900/60 p-3 border border-emerald-500/10 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Ready
                        </div>
                        <span className="text-xs font-bold text-white block">Cluster Gateway</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 border border-amber-500/10 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          Pending
                        </div>
                        <span className="text-xs font-bold text-white block">Evaluation Q</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 border border-rose-500/10 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px] uppercase">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          Failed
                        </div>
                        <span className="text-xs font-bold text-white block">Diagnostic VM</span>
                      </div>
                    </div>
                  )}

                  {selectedDemoComp === "pagination" && (
                    <div className="flex items-center gap-1.5 bg-zinc-900/40 p-2.5 border border-white/5 rounded-xl shadow-soft">
                      {[1, 2, 3, 4].map((pNum) => (
                        <button
                          key={pNum}
                          onClick={() => {
                            setDemoPaginationPage(pNum);
                            toast.message(`Jumped to clinic sheet ${pNum}`);
                          }}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center",
                            demoPaginationPage === pNum 
                              ? "bg-purple-500 text-white shadow-soft shadow-purple-500/20" 
                              : "text-zinc-500 hover:text-white bg-zinc-950/40 border border-white/5"
                          )}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDemoComp === "attention" && (
                    <div className="w-80">
                      {demoNeedsAttention ? (
                        <div className="bg-amber-500/5 border border-amber-500/10 border-l-4 border-l-amber-500 p-3.5 rounded-xl relative flex gap-2">
                          <AlertTriangle className="text-amber-400 size-4 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">Clinic Alert: Spacers Missing</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">Node az-west-4 requires spacing-8 radius offsets evaluated immediately.</p>
                            <button
                              onClick={() => {
                                setDemoNeedsAttention(false);
                                toast.success("Attention marker cleared!");
                              }}
                              className="text-[9px] font-mono text-amber-400 underline font-bold"
                            >
                              Dismiss Alert
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDemoNeedsAttention(true)}
                          className="bg-zinc-900 border border-white/5 px-4 py-2 text-xs font-bold font-sans rounded-xl text-zinc-400 hover:text-white transition-colors"
                        >
                          Re-invoke Attention Card
                        </button>
                      )}
                    </div>
                  )}

                  {selectedDemoComp === "select" && (
                    <div className="w-64 space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase text-zinc-400">Clinic Module Scope</label>
                      <div className="relative">
                        <select className="w-full h-10 px-3 bg-zinc-950/40 border border-white/10 focus:border-purple-500/40 rounded-xl text-xs text-white focus:outline-none transition-all appearance-none cursor-pointer">
                          <option className="bg-zinc-950 text-white">Full Platform Sandbox</option>
                          <option className="bg-zinc-950 text-white">Localized Clinic Sheet</option>
                          <option className="bg-zinc-950 text-white">External Diagnostic API</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {selectedDemoComp === "callout" && (
                    <div className="w-full max-w-md bg-white/[0.02] border border-white/5 backdrop-blur-md p-4 rounded-xl flex gap-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500" />
                      <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white font-sans">Upcoming Component Release</span>
                        <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                          A premium informational callout block styled with custom glass layering borders. Highly robust for highlighting status shifts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guidelines & Props split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Properties Table */}
                <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Properties & Attributes</h4>
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20">
                    <table className="w-full text-left text-[11px] font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-zinc-900/40 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                          <th className="p-2.5 pl-3">Prop</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                        {selectedDemoComp === "button" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">variant</td>
                              <td className="p-2.5">"gradient" | "outline" | "danger"</td>
                              <td className="p-2.5">"outline"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">disabled</td>
                              <td className="p-2.5">boolean</td>
                              <td className="p-2.5">false</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">onClick</td>
                              <td className="p-2.5">() =&gt; void</td>
                              <td className="p-2.5">undefined</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "checkbox" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">checked</td>
                              <td className="p-2.5">boolean</td>
                              <td className="p-2.5">false</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">onCheckedChange</td>
                              <td className="p-2.5">(v: boolean) =&gt; void</td>
                              <td className="p-2.5">undefined</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "chip" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">selected</td>
                              <td className="p-2.5">boolean</td>
                              <td className="p-2.5">false</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">label</td>
                              <td className="p-2.5">string</td>
                              <td className="p-2.5">""</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "avatar" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">initials</td>
                              <td className="p-2.5">string</td>
                              <td className="p-2.5">"AZ"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">status</td>
                              <td className="p-2.5">"online" | "offline" | "busy"</td>
                              <td className="p-2.5">"online"</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "input" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">error</td>
                              <td className="p-2.5">boolean</td>
                              <td className="p-2.5">false</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">placeholder</td>
                              <td className="p-2.5">string</td>
                              <td className="p-2.5">""</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "status_tile" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">status</td>
                              <td className="p-2.5">"ready" | "pending" | "failed"</td>
                              <td className="p-2.5">"ready"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">ping animate</td>
                              <td className="p-2.5">boolean</td>
                              <td className="p-2.5">true</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "pagination" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">currentPage</td>
                              <td className="p-2.5">number</td>
                              <td className="p-2.5">1</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">totalPages</td>
                              <td className="p-2.5">number</td>
                              <td className="p-2.5">4</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "attention" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">onClear</td>
                              <td className="p-2.5">() =&gt; void</td>
                              <td className="p-2.5">undefined</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "select" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">label</td>
                              <td className="p-2.5">string</td>
                              <td className="p-2.5">""</td>
                            </tr>
                          </>
                        )}
                        {selectedDemoComp === "callout" && (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3 text-purple-400 font-bold">variant</td>
                              <td className="p-2.5">"purple" | "neutral"</td>
                              <td className="p-2.5">"purple"</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Do / Don't guidance */}
                <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">Do & Don't Guidelines</h4>
                  
                  <div className="space-y-3 font-sans">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex gap-2">
                      <Check className="text-emerald-400 size-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-white block">DO (Recommended pattern)</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          {selectedDemoComp === "button" && "Use the primary brand gradient ONLY for final high-value evaluation triggers or diagnostic evaluations."}
                          {selectedDemoComp === "checkbox" && "Pair checkboxes with clear uppercase label tags detailing selected node active variables."}
                          {selectedDemoComp === "chip" && "Utilize filter chips to switch layout grids seamlessly without reloading entire node clusters."}
                          {selectedDemoComp === "avatar" && "Include fallbacks with initials and a solid status ring pinger to represent node access states."}
                          {selectedDemoComp === "input" && "Render standard inputs with border-white/10 and focus variables to provide high contrast visual clues."}
                          {selectedDemoComp === "status_tile" && "Position active status tiles in core header margins or dashboards to highlight status shifts cleanly."}
                          {selectedDemoComp === "pagination" && "Ensure pagination indicators show actual sheet lengths. Limit range offsets to prevent page overflow."}
                          {selectedDemoComp === "attention" && "Position attention flags at the top of lists. Color-coordinate with warning alert variables."}
                          {selectedDemoComp === "select" && "Style select selectors with relative arrows. Match option wrappers to zinc-950 canvas background."}
                          {selectedDemoComp === "callout" && "Embed information indicators inside callouts. Style with a transparent premium glass border."}
                        </p>
                      </div>
                    </div>

                    <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl flex gap-2">
                      <AlertCircle className="text-rose-400 size-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-white block">DON'T (Unsafe anti-pattern)</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          {selectedDemoComp === "button" && "Avoid stacking multiple primary CTA gradients on the same viewport. Clutters brand priority."}
                          {selectedDemoComp === "checkbox" && "Do not use checkbox buttons as a single click button action. Use standard buttons instead."}
                          {selectedDemoComp === "chip" && "Avoid wrapping chip text across multiple lines. Keep content single-word or short uppercase names."}
                          {selectedDemoComp === "avatar" && "Do not overlay custom decorative border elements that hide initials framing inside dashboards."}
                          {selectedDemoComp === "input" && "Avoid hiding active validation errors. Always render feedback labels below failed input wrappers."}
                          {selectedDemoComp === "status_tile" && "Do not overload status tiles with descriptive details. Keep content brief and numerical."}
                          {selectedDemoComp === "pagination" && "Avoid hiding pagination steps on short pages. Ensure active triggers are at least 32px touch targets."}
                          {selectedDemoComp === "attention" && "Do not use aggressive blinking motion flags. Leads to system fatigue and poor creator UX."}
                          {selectedDemoComp === "select" && "Avoid relying on default browser select controls. They clash with our twilight black theme."}
                          {selectedDemoComp === "callout" && "Avoid positioning multiple callouts on top of each other. Restraint is the key branding standard."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: PATTERNS (The Clinical Hub List) */}
        {dsSubTab === "patterns" && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Pattern controls & toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-300">Assembled View: Patient List Pattern</h4>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Test dynamic states of the clinic patient list table layout.</p>
              </div>

              <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-white/5 gap-1 self-start sm:self-auto">
                {[
                  { id: "data", label: "Active Data mode" },
                  { id: "empty", label: "Empty illustrated state" },
                  { id: "loading", label: "Loading shimmer bones" }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPatternTableMode(m.id as any);
                      setSelectedPatternPatients([]);
                      toast.message(`Switch list mode to: ${m.label}`);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none relative",
                      patternTableMode === m.id ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span className="relative z-10">{m.label}</span>
                    {patternTableMode === m.id && (
                      <motion.div layoutId="pattern-mode-capsule" className="absolute inset-0 bg-zinc-900 border border-white/5 rounded-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Component Assembly */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-6 relative min-h-[400px]">
              {/* Pattern Page Header component */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-500">
                    <span>Platform Sandbox</span>
                    <ChevronRight size={10} />
                    <span className="text-purple-400 font-bold">Clinic Hub manager</span>
                  </div>
                  <h3 className="text-lg font-black text-white font-sans">Active Patient Diagnostics</h3>
                  <p className="text-xs text-zinc-400">Review, evaluate and monitor clinic patient nodes across the network cluster.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toast.success("Added new simulated patient node.")}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold h-9 px-4 text-xs rounded-xl flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Plus size={12} /> Add Patient
                  </button>
                </div>
              </div>

              {/* Dynamic rendering */}
              {patternTableMode === "data" && (
                <div className="space-y-4">
                  {/* Toolbar pattern */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-xl">
                    <div className="relative flex-grow max-w-sm">
                      <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search patient nodes..."
                        value={patternSearch}
                        onChange={(e) => setPatternSearch(e.target.value)}
                        className="bg-zinc-950 pl-9 pr-3 py-2 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/40 w-full transition-all"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <span>Selected: {selectedPatternPatients.length} / 4</span>
                    </div>
                  </div>

                  {/* Patient List Table */}
                  <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-zinc-900/40">
                          <th className="p-3 pl-4 w-12">
                            <button
                              onClick={() => selectAllPatients(["pt-1", "pt-2", "pt-3", "pt-4"])}
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                selectedPatternPatients.length === 4 
                                  ? "bg-purple-500 border-purple-500 text-white" 
                                  : "border-white/20 hover:border-white/30 bg-transparent"
                              )}
                            >
                              {selectedPatternPatients.length === 4 && <Check size={10} strokeWidth={3} />}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">Patient Details</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">Diagnostic Status</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">Assigned Cluster</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 text-right pr-4">Metrics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { id: "pt-1", name: "Eleanor Vance", email: "eleanor@clinic.io", age: "34 Yrs", gender: "Female", status: "ready", statusLabel: "Evaluated", cluster: "Alpha Primary", metrics: "99.2%" },
                          { id: "pt-2", name: "Marcus Thorne", email: "marcus.t@clinic.io", age: "52 Yrs", gender: "Male", status: "pending", statusLabel: "Pending Diagnostic", cluster: "Beta Secondary", metrics: "84.8%" },
                          { id: "pt-3", name: "Sophia Martinez", email: "sophia@clinic.io", age: "28 Yrs", gender: "Female", status: "ready", statusLabel: "Evaluated", cluster: "Alpha Primary", metrics: "98.9%" },
                          { id: "pt-4", name: "David Vance", email: "david.v@clinic.io", age: "41 Yrs", gender: "Male", status: "failed", statusLabel: "Warning Block", cluster: "Delta Testing", metrics: "—" }
                        ]
                          .filter(pt => {
                            if (!patternSearch) return true;
                            return pt.name.toLowerCase().includes(patternSearch.toLowerCase()) || pt.email.toLowerCase().includes(patternSearch.toLowerCase());
                          })
                          .map((pt) => {
                            const isSelected = selectedPatternPatients.includes(pt.id);
                            return (
                              <tr 
                                key={pt.id} 
                                className={cn(
                                  "hover:bg-white/[0.015] border-b border-white/5 last:border-b-0 transition-colors group",
                                  isSelected && "bg-purple-500/[0.02]"
                                )}
                              >
                                <td className="p-3 pl-4">
                                  <button
                                    onClick={() => toggleSelectPatient(pt.id)}
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                      isSelected 
                                        ? "bg-purple-500 border-purple-500 text-white" 
                                        : "border-white/20 hover:border-white/30 bg-transparent"
                                    )}
                                  >
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                  </button>
                                </td>
                                <td className="px-4 py-3 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0 font-mono">
                                    {pt.name.split(" ").map(w => w[0]).join("")}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block group-hover:text-purple-400 transition-colors">{pt.name}</span>
                                    <span className="text-[10px] text-zinc-500 block font-mono">{pt.email} • {pt.age} ({pt.gender})</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border",
                                    pt.status === "ready" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    pt.status === "pending" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                    pt.status === "failed" && "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                                  )}>
                                    <span className={cn("w-1 h-1 rounded-full",
                                      pt.status === "ready" && "bg-emerald-500",
                                      pt.status === "pending" && "bg-amber-500",
                                      pt.status === "failed" && "bg-rose-500"
                                    )} />
                                    {pt.statusLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-zinc-400">
                                  {pt.cluster}
                                </td>
                                <td className="px-4 py-3 text-right pr-4 font-mono text-xs text-zinc-200 font-bold">
                                  {pt.metrics}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-mono text-zinc-500">Showing 4 of 4 active diagnostic nodes</span>
                    <div className="flex items-center gap-1">
                      <button className="h-7 w-7 bg-zinc-950/40 hover:bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 font-bold font-mono">Prev</button>
                      <button className="h-7 w-7 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-[10px] text-purple-300 font-bold font-mono">1</button>
                      <button className="h-7 w-7 bg-zinc-950/40 hover:bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 font-bold font-mono">Next</button>
                    </div>
                  </div>
                </div>
              )}

              {patternTableMode === "empty" && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-900/40 rounded-2xl border border-white/5 flex items-center justify-center text-zinc-600">
                    <Layers size={24} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white font-sans">No diagnostic nodes loaded</h5>
                    <p className="text-[10px] text-zinc-500 max-w-xs font-sans">There are currently no active patient nodes connected to this clinic diagnostic cluster.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setPatternTableMode("data");
                      toast.success("Simulated clinic diagnostics database reloaded.");
                    }}
                    className="bg-zinc-900 border border-white/5 hover:border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 font-sans rounded-xl uppercase tracking-wider"
                  >
                    Reload Sample Nodes
                  </button>
                </div>
              )}

              {patternTableMode === "loading" && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-zinc-950/40 border border-white/5 rounded-xl" />
                  <div className="space-y-3 bg-zinc-950/10 border border-white/5 rounded-xl p-4">
                    {[1, 2, 3].map((sh) => (
                      <div key={sh} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-zinc-900 rounded" />
                            <div className="h-2 w-44 bg-zinc-900/60 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-16 bg-zinc-900 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FLOATING BULK BAR PATTERN - Elegant translation of the diagram */}
              <AnimatePresence>
                {selectedPatternPatients.length > 0 && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute bottom-6 left-6 right-6 bg-purple-950/80 border border-purple-500/30 backdrop-blur-md px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_30px_rgba(168,85,247,0.15)] z-40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-soft">
                        {selectedPatternPatients.length}
                      </div>
                      <span className="text-xs font-bold text-white font-sans">Patients selected for bulk diagnostics</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          toast.success(`Dispatched bulk diagnostic evaluations for ${selectedPatternPatients.length} patients!`);
                          setSelectedPatternPatients([]);
                        }}
                        className="bg-white text-purple-950 hover:bg-purple-100 font-bold h-8 px-3 text-[10px] rounded-lg uppercase tracking-wider transition-colors"
                      >
                        Run Evaluations
                      </button>
                      <button 
                        onClick={() => {
                          toast.message(`Assigned ${selectedPatternPatients.length} patient nodes to Delta Secondary Cluster.`);
                          setSelectedPatternPatients([]);
                        }}
                        className="bg-purple-900/60 hover:bg-purple-950 border border-white/5 text-purple-300 font-bold h-8 px-3 text-[10px] rounded-lg uppercase tracking-wider transition-colors"
                      >
                        Assign Cluster
                      </button>
                      <button 
                        onClick={() => setSelectedPatternPatients([])}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
