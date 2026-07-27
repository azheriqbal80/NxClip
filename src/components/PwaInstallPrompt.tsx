import { useState, useEffect } from "react";
import { usePWA } from "../contexts/PwaContext";
import { motion, AnimatePresence } from "motion/react";
import { Download, Sparkles, X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { safeLocalStorage } from "../lib/safeStorage";

interface PwaInstallPromptProps {
  variant?: "banner" | "card" | "compact";
  className?: string;
  onDismiss?: () => void;
}

export function PwaInstallPrompt({ variant = "card", className, onDismiss }: PwaInstallPromptProps) {
  const { isInstallable, isInstalled, showPrompt } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed this inline prompt
    const hasDismissed = safeLocalStorage.getItem("nx_inline_pwa_dismissed") === "true";
    if (hasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    try {
      const outcome = await showPrompt();
      if (outcome === "accepted") {
        console.log("[PWA User Action] User opted to install");
      }
    } catch (err) {
      console.error("[PWA Install Error]", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    safeLocalStorage.setItem("nx_inline_pwa_dismissed", "true");
    if (onDismiss) onDismiss();
  };

  // If the app is already installed or there's no install prompt available or dismissed, we don't render anything.
  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={className}
      >
        {variant === "compact" ? (
          <div className="flex items-center justify-between gap-3 bg-zinc-900/80 border border-white/5 p-3 rounded-xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20 text-purple-400">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                  Install nxclip.ai OS
                  <Sparkles className="h-3 w-3 text-amber-400" />
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Get full screen canvas workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                aria-label="Dismiss prompt"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg border-none px-3 flex items-center gap-1 shadow-md shadow-purple-500/10"
              >
                Install
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : variant === "banner" ? (
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-purple-500/15 p-4 rounded-xl shadow-2xl relative overflow-hidden group">
            {/* Ambient lighting effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
              <div className="flex items-start gap-3.5">
                <div className="bg-zinc-900/90 border border-white/10 p-2.5 rounded-lg shrink-0 shadow-lg text-purple-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/15">Desktop app ready</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5">Gentle Creator Reminder: Install nxclip.ai onto your desktop</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Run our platform as a standalone application. Benefit from responsive full-bleed canvases, zero browser tab distractions, and optimized creator speeds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 h-9 rounded-xl font-medium"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white h-9 px-4 font-semibold shadow-lg hover:shadow-purple-500/20 transition-all rounded-xl border-none flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Add to Home Screen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-white/10 p-5 rounded-2xl shadow-3xl text-white relative overflow-hidden group">
            {/* Ambient subtle backlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-purple-500/10 p-1.5 px-2.5 rounded-lg border border-purple-500/20 text-purple-400">
                <Smartphone className="h-4 w-4" />
                <span className="text-[9px] font-bold tracking-widest uppercase">PWA Desktop Integration</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-white bg-zinc-900 border border-white/5 hover:border-white/10 p-1.5 rounded-lg transition-all"
                aria-label="Close widget"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                Install nxclip.ai OS
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                Enable deep creator tools like direct timeline scrubbing, distraction-free frame views, and faster offline cache syncs with the nxclip.ai runtime.
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 text-xs border-white/5 bg-zinc-900/50 hover:bg-zinc-900 h-9 font-medium text-zinc-300 transition-all rounded-xl"
              >
                Later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 text-xs bg-purple-600 hover:bg-purple-500 text-white h-9 font-semibold shadow-lg hover:shadow-purple-500/20 transition-all rounded-xl border-none flex items-center justify-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Add to Home Screen
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
