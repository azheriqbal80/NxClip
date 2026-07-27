import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  MoreVertical, 
  Trash2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ShieldCheck, 
  Sparkle, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import {
  socketService,
  SocketStatus,
  WebSocketEnvelope,
  GenerationCompletePayload,
  GenerationFailedPayload,
  GenerationProgressPayload,
  ModerationCompletePayload,
  SubscriptionChangedPayload
} from "../../services/socketService";
import { toast } from "sonner";

type NotificationType = "trend" | "system" | "analytics" | "social" | "achievement" | "billing" | "moderation";

interface ClientNotification {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  time: string;
  date: string;
  unread: boolean;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

// Map types to Lucide Icons dynamically
const TYPE_CONFIG = {
  trend: { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
  system: { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
  analytics: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
  social: { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  achievement: { icon: CheckCircle2, color: "text-orange-400", bg: "bg-orange-500/10" },
  billing: { icon: Sparkle, color: "text-pink-400", bg: "bg-pink-500/10" },
  moderation: { icon: ShieldCheck, color: "text-indigo-400", bg: "bg-indigo-500/10" },
};

function unwrapSocketPayload<TPayload>(payload: WebSocketEnvelope<TPayload>): TPayload {
  return (payload.data ?? payload) as TPayload;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [wsStatus, setWsStatus] = useState<SocketStatus>("disconnected");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeGeneration, setActiveGeneration] = useState<{
    contentId: string;
    progress: number;
    step: string;
  } | null>(null);

  // 1. Subscribe to socketService connection states and mandated real-time pipeline events
  useEffect(() => {
    // Sync connection status state
    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setWsStatus(status);
    });

    // Handle incoming 'content:processing' progress updates
    const unsubscribeProcessing = socketService.subscribe("content:processing", (_eventName, payload) => {
      const progressData = unwrapSocketPayload<GenerationProgressPayload>(
        payload as WebSocketEnvelope<GenerationProgressPayload>
      );
      
      setActiveGeneration({
        contentId: progressData.contentId || "pending-content",
        progress: progressData.progress || 0,
        step: progressData.step || "Synthesizing frame vectors..."
      });
    });

    // Handle incoming 'content:generation_complete' events
    const unsubscribeComplete = socketService.subscribe("content:generation_complete", (_eventName, payload) => {
      const completeData = unwrapSocketPayload<GenerationCompletePayload>(
        payload as WebSocketEnvelope<GenerationCompletePayload>
      );

      setActiveGeneration(null);
      
      const newNotif: ClientNotification = {
        id: `notif-${Date.now()}`,
        title: "AI Asset Generation Complete",
        description: `Content ${completeData.contentId} has finished rendering. Check your library.`,
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        time: "Just now",
        date: new Date().toLocaleDateString(),
        unread: true,
        type: "system",
        metadata: { assetUrl: completeData.assetUrl }
      };

      setNotifications((prev) => [newNotif, ...prev]);
      toast.success("AI Generation Complete!", {
        description: "Your brand new asset has been successfully created and indexed."
      });
    });

    // Handle incoming 'content:generation_failed' events
    const unsubscribeFailed = socketService.subscribe("content:generation_failed", (_eventName, payload) => {
      const failedData = unwrapSocketPayload<GenerationFailedPayload>(
        payload as WebSocketEnvelope<GenerationFailedPayload>
      );

      setActiveGeneration(null);

      const newNotif: ClientNotification = {
        id: `notif-${Date.now()}`,
        title: "AI Asset Generation Failed",
        description: `Failed to compile image: ${failedData.reason || "Server timeouts"}.`,
        icon: AlertTriangle,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        time: "Just now",
        date: new Date().toLocaleDateString(),
        unread: true,
        type: "system"
      };

      setNotifications((prev) => [newNotif, ...prev]);
      toast.error("Generation Failed", {
        description: failedData.reason || "Unexpected hardware cluster timeout."
      });
    });

    // Handle incoming 'content:moderation_complete' checks
    const unsubscribeModeration = socketService.subscribe("content:moderation_complete", (_eventName, payload) => {
      const modData = unwrapSocketPayload<ModerationCompletePayload>(
        payload as WebSocketEnvelope<ModerationCompletePayload>
      );

      const isApproved = modData.status === "approved";
      
      const newNotif: ClientNotification = {
        id: `notif-${Date.now()}`,
        title: isApproved ? "Content Policy Passed" : "Content Rejection Triggered",
        description: isApproved 
          ? `Your asset conforming to safety laws was approved. Policy reason: ${modData.reason || "Perfect safety rating."}`
          : `Rejection flag: ${modData.reason || "Violates standard community guidelines."}`,
        icon: ShieldCheck,
        color: isApproved ? "text-indigo-400" : "text-rose-400",
        bg: isApproved ? "bg-indigo-500/10" : "bg-rose-500/10",
        time: "Just now",
        date: new Date().toLocaleDateString(),
        unread: true,
        type: "moderation"
      };

      setNotifications((prev) => [newNotif, ...prev]);
      
      if (isApproved) {
        toast.success("Moderation Approved", { description: "Your asset conforms to safe creator guidelines." });
      } else {
        toast.warning("Moderation Rejected", { description: "Content failed community guidelines check." });
      }
    });

    // Handle incoming 'billing:subscription_changed' event
    const unsubscribeBilling = socketService.subscribe("billing:subscription_changed", (_eventName, payload) => {
      const billData = unwrapSocketPayload<SubscriptionChangedPayload>(
        payload as WebSocketEnvelope<SubscriptionChangedPayload>
      );

      const newNotif: ClientNotification = {
        id: `notif-${Date.now()}`,
        title: `Tier Shifted: ${billData.plan || "PRO"}`,
        description: `Your nxclip.ai subscription limits have been dynamically reassigned to the '${billData.plan}' creator tier.`,
        icon: Sparkle,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
        time: "Just now",
        date: new Date().toLocaleDateString(),
        unread: true,
        type: "billing"
      };

      setNotifications((prev) => [newNotif, ...prev]);
      toast.success("Plan Limits Synchronized", {
        description: `You are now on the nxclip.ai ${billData.plan} Creator Suite!`
      });
    });

    // Handle incoming 'analytics:report_ready' report
    const unsubscribeAnalytics = socketService.subscribe("analytics:report_ready", () => {
      const newNotif: ClientNotification = {
        id: `notif-${Date.now()}`,
        title: "Weekly Performance Compiled",
        description: "Your weekly aggregated analytical digest has been completed and structured for download.",
        icon: Sparkles,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        time: "Just now",
        date: new Date().toLocaleDateString(),
        unread: true,
        type: "analytics"
      };

      setNotifications((prev) => [newNotif, ...prev]);
      toast.success("Weekly Analytics Compiled", {
        description: "The data digest is indexed and ready to evaluate."
      });
    });

    // Cleanup listeners
    return () => {
      unsubscribeStatus();
      unsubscribeProcessing();
      unsubscribeComplete();
      unsubscribeFailed();
      unsubscribeModeration();
      unsubscribeBilling();
      unsubscribeAnalytics();
    };
  }, []);

  // Filter list
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((n) => n.unread);
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  // Actions
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success("Read Confirmations Logged", {
      description: "All in-app alerts marked as read."
    });
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Alert Cleared", {
      description: "Removed from active notification list."
    });
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Feed Cleared", {
      description: "Cleared all in-app logs."
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 m-0">
              <Bell className="text-purple-400 size-6" />
              Creator Live Stream Alerts
            </h1>
            
            {/* Real-time Connection Status Badge */}
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] uppercase font-mono tracking-wider font-bold py-0.5 px-2.5 rounded gap-1.5 border shrink-0",
                wsStatus === "connected" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                wsStatus === "connecting" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                wsStatus === "disconnected" && "bg-zinc-800 text-zinc-400 border-white/5",
                wsStatus === "error" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              {wsStatus === "connected" && (
                <>
                  <Wifi size={10} className="shrink-0 animate-pulse" />
                  Live WebSocket Port 5006
                </>
              )}
              {wsStatus === "connecting" && (
                <>
                  <RefreshCw size={10} className="shrink-0 animate-spin" />
                  Connecting...
                </>
              )}
              {wsStatus === "disconnected" && (
                <>
                  <WifiOff size={10} className="shrink-0" />
                  Offline
                </>
              )}
              {wsStatus === "error" && (
                <>
                  <WifiOff size={10} className="shrink-0" />
                  Socket Error
                </>
              )}
            </Badge>
          </div>
          <p className="text-zinc-400 mt-1 text-xs">
            Dynamic real-time stream status, AI video progress sliders, and policy check alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => n.unread) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllRead}
              className="text-xs bg-zinc-900/40 border-white/10 hover:bg-zinc-900 font-mono gap-1.5 h-9"
            >
              <CheckCircle2 size={13} className="text-purple-400" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="text-xs bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white font-mono gap-1.5 h-9"
            >
              <Trash2 size={13} />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        
        {/* Left main alert feed */}
        <div className="space-y-6">
          
          {/* Real-time active AI process widget (appears only when socket signals work is happening) */}
          <AnimatePresence>
            {activeGeneration && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="bg-purple-950/10 border border-purple-500/20 shadow-lg mb-4">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                        <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase font-mono">
                          Live AI Cluster Processing Stream
                        </span>
                      </div>
                      <span className="text-xs font-mono text-purple-400 font-bold">
                        {activeGeneration.progress}%
                      </span>
                    </div>

                    <p className="text-xs font-medium text-white m-0">
                      Syncing frame variables for ID: <span className="font-mono text-purple-300">{activeGeneration.contentId}</span>
                    </p>

                    {/* Progress slider track */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                        animate={{ width: `${activeGeneration.progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>

                    <p className="text-[10px] text-zinc-400 font-mono italic m-0">
                      Step: {activeGeneration.step}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed filters toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-3">
            {[
              { id: "all", label: "All Logs" },
              { id: "unread", label: "Unread" },
              { id: "trend", label: "Trends" },
              { id: "system", label: "AI & System" },
              { id: "social", label: "Comments" },
              { id: "moderation", label: "Policy Guard" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border outline-none font-mono",
                  activeFilter === f.id
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-inner"
                    : "bg-transparent text-zinc-400 border-transparent hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Active Notifications listing */}
          <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-sm shadow-xl">
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                    <Bell className="text-zinc-600 size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">No notifications matching criteria</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                      Whenever live microservices fire events over WebSockets, they will appear immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {filteredNotifications.map((notif) => {
                      const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                      const IconComponent = config.icon;

                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          key={notif.id}
                          className={cn(
                            "p-5 flex gap-4 transition-all hover:bg-white/5 group relative overflow-hidden",
                            notif.unread && "bg-purple-500/[0.02]"
                          )}
                        >
                          {notif.unread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                          )}
                          
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/5 transition-transform group-hover:scale-105",
                            config.bg,
                            config.color
                          )}>
                            <IconComponent size={18} />
                          </div>

                          <div className="flex-grow space-y-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "font-bold text-xs md:text-sm tracking-wide",
                                    notif.unread ? "text-white font-black" : "text-zinc-300"
                                  )}>
                                    {notif.title}
                                  </h4>
                                  {notif.unread && (
                                    <Badge className="bg-purple-500/10 text-purple-400 text-[8px] font-bold tracking-widest px-1.5 py-0 h-4 border border-purple-500/25 uppercase rounded-sm">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] md:text-xs text-zinc-400 leading-relaxed max-w-xl">
                                  {notif.description}
                                </p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1 uppercase">
                                  <Clock size={9} />
                                  {notif.time}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => clearNotification(notif.id)}
                                    className="h-7 w-7 rounded bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white"
                                    title="Dismiss alert"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white"
                                  >
                                    <MoreVertical size={12} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
