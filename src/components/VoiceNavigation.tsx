import { useVoiceNavigation } from "../hooks/useVoiceNavigation";
import { Mic, MicOff, Sparkles, X, Volume2, HelpCircle, ChevronRight, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export default function VoiceNavigation() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  
  const {
    isSupported,
    isListening,
    transcript,
    status,
    errorMessage,
    startListening,
    stopListening,
    commands,
  } = useVoiceNavigation();

  const [showHelper, setShowHelper] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close helper
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHelper(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Automatically open helper when user clicks microphone to start listening
  useEffect(() => {
    if (isListening) {
      setShowHelper(true);
    }
  }, [isListening]);

  if (!isSupported) {
    return null; // Gracefully hide if Speech Recognition is unsupported
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Microphone Toggle Button */}
      <TooltipSimple 
        content={
          isListening 
            ? (isAr ? "إيقاف الاستماع" : "Stop Listening") 
            : (isAr ? "التحكم الصوتي (يدوي)" : "Voice Control (Hands-free)")
        }
        align={isAr ? "left" : "right"}
      >
        <button
          onClick={isListening ? stopListening : startListening}
          className={cn(
            "relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background",
            isListening
              ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
              : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-muted-foreground/30"
          )}
          aria-label={isAr ? "تشغيل التحكم بالصوت" : "Toggle Voice Control"}
          aria-expanded={showHelper}
        >
          {isListening ? (
            <div className="relative">
              <Mic size={18} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
          ) : (
            <Mic size={18} />
          )}
        </button>
      </TooltipSimple>

      {/* Floating Status & Helper Panel */}
      <AnimatePresence>
        {showHelper && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-12 mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50 p-4 select-none",
              isAr ? "left-0" : "right-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
              <div className="flex items-center gap-2 text-foreground">
                <Sparkles size={14} className="text-primary animate-pulse" />
                <span className="text-[12px] font-bold tracking-wider uppercase">
                  {isAr ? "مساعد التنقل الصوتي" : "Voice Navigation"}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowHelper(false);
                  stopListening();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isAr ? "إغلاق" : "Close panel"}
              >
                <X size={14} />
              </button>
            </div>

            {/* Listening Live Indicator & Soundwave */}
            {isListening ? (
              <div className="space-y-3 bg-muted/30 border border-border/40 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-red-400 flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {isAr ? "جاري الاستماع الآن..." : "Listening..."}
                  </span>
                  
                  {/* CSS Soundwave */}
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 bg-red-500 rounded-full animate-voice-bar-1 h-full" />
                    <span className="w-0.5 bg-red-500 rounded-full animate-voice-bar-2 h-full" />
                    <span className="w-0.5 bg-red-500 rounded-full animate-voice-bar-3 h-full" />
                    <span className="w-0.5 bg-red-500 rounded-full animate-voice-bar-4 h-full" />
                  </div>
                </div>

                {/* Transcript placeholder */}
                <div className="min-h-[2.5rem] flex items-center justify-center border-t border-border/20 pt-2">
                  <p className="text-[13px] font-medium italic text-foreground text-center line-clamp-2">
                    {transcript ? `"${transcript}"` : (isAr ? "تحدث الآن لتوجيه التطبيق..." : "Speak a command...")}
                  </p>
                </div>
              </div>
            ) : status === "success" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mb-4 text-center">
                <span className="text-[11px] font-bold text-emerald-400">
                  {isAr ? "✓ تم التنفيذ بنجاح!" : "✓ Command Executed!"}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4 text-center">
                <span className="text-[11px] font-bold text-red-400 line-clamp-2">
                  {errorMessage}
                </span>
              </div>
            ) : (
              <div className="bg-muted/20 border border-border/40 p-3 rounded-lg mb-4 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isAr ? "اضغط على الميكروفون للبدء" : "Click the mic icon to start"}
                </span>
              </div>
            )}

            {/* Quick Guide / Help */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                {isAr ? "الأوامر المدعومة" : "Supported Commands"}
              </p>
              
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-sans text-[11px] font-medium text-muted-foreground">
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted text-[10px] text-foreground rounded border border-border">
                    {isAr ? "لوحة التحكم" : "go to dashboard"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span>{isAr ? "معدل المقاطع" : "Clip Editor"}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted text-[10px] text-foreground rounded border border-border">
                    {isAr ? "المحرر" : "go to editor"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span>{isAr ? "التحليلات" : "Analytics"}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted text-[10px] text-foreground rounded border border-border">
                    {isAr ? "التحليلات" : "go to analytics"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted text-[10px] text-foreground rounded border border-border">
                    {isAr ? "الملف الشخصي" : "go to profile"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span>{isAr ? "المدرب الذكي" : "AI Coach"}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted text-[10px] text-foreground rounded border border-border">
                    {isAr ? "المدرب" : "go to coach"}
                  </kbd>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Internal Simple Tooltip Component to avoid import weight */
function TooltipSimple({ children, content, align = "right" }: { children: React.ReactNode; content: string; align?: "left" | "right" }) {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-11 bg-popover text-popover-foreground text-[10px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-md shadow-md border border-border whitespace-nowrap z-50 pointer-events-none",
              align === "left" ? "left-0" : "right-0"
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
