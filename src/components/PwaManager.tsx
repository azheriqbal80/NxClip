import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { safeSessionStorage } from '../lib/safeStorage';
import { 
  Download, 
  Sparkles, 
  X, 
  Smartphone, 
  Check, 
  Cpu, 
  WifiOff, 
  RefreshCw, 
  BatteryWarning,
  FileText,
  Trash2,
  CloudLightning,
  Loader2,
  ListTodo,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { usePWA } from '../contexts/PwaContext';
import { useBattery } from '../hooks/useBattery';
import { 
  getOfflineDrafts, 
  updateDraftStatus, 
  deleteOfflineDraft, 
  clearSyncedOfflineDrafts,
  addOfflineDraft,
  OfflineDraft 
} from '../lib/draftStore';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { triggerHaptic } from '../lib/vibration';

export function PwaManager() {
  const { isInstallable, isInstalled, showPrompt } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Service Worker Update State
  const [updateExists, setUpdateExists] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Network Connectivity State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Battery Warning State
  const { isLowPower, level } = useBattery();
  const [showBatteryWarn, setShowBatteryWarn] = useState(false);
  const [hasDismissedBattery, setHasDismissedBattery] = useState(false);

  // Draft Background Sync States
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [showDraftQueue, setShowDraftQueue] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateDraft, setShowCreateDraft] = useState(false);

  // Draft Form fields
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState('image');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftStyle, setDraftStyle] = useState('Cyberpunk');

  // Load drafts from IndexedDB
  const loadDrafts = useCallback(async () => {
    try {
      const list = await getOfflineDrafts();
      setDrafts(list);
    } catch (err) {
      console.error('[PWA Store] Failed to load offline drafts:', err);
    }
  }, []);

  // Sync core logic
  const syncAllPendingDrafts = useCallback(async () => {
    if (isSyncing) return;
    
    try {
      const activeDrafts = await getOfflineDrafts();
      const pendingAndFailed = activeDrafts.filter(d => d.status === 'pending' || d.status === 'failed');
      
      if (pendingAndFailed.length === 0) {
        return;
      }

      setIsSyncing(true);
      triggerHaptic('heavy');
      
      const syncPromise = (async () => {
        let syncedCount = 0;
        for (const draft of pendingAndFailed) {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            await updateDraftStatus(draft.id, 'failed', 'User not authenticated');
            continue;
          }

          await updateDraftStatus(draft.id, 'syncing');
          await loadDrafts();

          try {
            // Write directly to creators Firestore collection
            await addDoc(collection(db, 'creations'), {
              uid: currentUser.uid,
              type: `offline_sync_${draft.type}`,
              title: draft.title,
              prompt: draft.prompt || '',
              style: draft.style || '',
              status: 'published',
              createdAt: serverTimestamp(),
              url: draft.content ? JSON.parse(draft.content).url || '' : ''
            });

            await updateDraftStatus(draft.id, 'synced');
            syncedCount++;
          } catch (err: unknown) {
            const error = err as Error;
            console.error('[PWA Sync] Sync failed for draft id:', draft.id, error);
            await updateDraftStatus(draft.id, 'failed', error?.message || 'Firestore write failed');
          }
        }
        await loadDrafts();
        if (syncedCount > 0) {
          triggerHaptic('success');
          return `${syncedCount} offline draft(s) successfully synchronized to creator cloud.`;
        } else {
          triggerHaptic('warning');
          throw new Error('Sync executed but user was not signed in to submit draft contents.');
        }
      })();

      toast.promise(syncPromise, {
        loading: 'Syncing offline drafts automatically with nxclip.ai cloud...',
        success: (msg) => msg,
        error: (err) => {
          triggerHaptic('error');
          return err?.message || 'Sync complete with authenticated warnings.';
        }
      });
    } catch (err) {
      console.error('[PWA Sync] Trigger loop failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [loadDrafts, isSyncing]);

  // Handle messages from the Service Worker
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TRIGGER_DRAFT_SYNC') {
        console.log('[PWA Manager] Received TRIGGER_DRAFT_SYNC notification.');
        syncAllPendingDrafts();
      }
    };

    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.addEventListener('message', handleSWMessage);
      } catch (e) {
        console.warn('[PWA] serviceWorker is disabled/blocked in this sandboxed context:', e);
      }
    }

    return () => {
      if ('serviceWorker' in navigator) {
        try {
          navigator.serviceWorker.removeEventListener('message', handleSWMessage);
        } catch (e) {
          // Ignore removal errors in sandbox
        }
      }
    };
  }, [syncAllPendingDrafts]);

  // Load and subscribe to online/offline changes
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Battery Warning State Logic
  useEffect(() => {
    if (isLowPower && !hasDismissedBattery) {
      setShowBatteryWarn(true);
    } else if (!isLowPower) {
      setShowBatteryWarn(false);
      setHasDismissedBattery(false);
    }
  }, [isLowPower, hasDismissedBattery]);

  useEffect(() => {
    // 1. Service Worker Registration & Update Handling
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const handleRegister = () => {
        try {
          // Register service worker
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
              console.log('[PWA] Service Worker registered with scope:', reg.scope);

              // Initial check for waiting workers
              if (reg.waiting) {
                setWaitingWorker(reg.waiting);
                setUpdateExists(true);
              }

              // Listen for future updates
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    try {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingWorker(newWorker);
                        setUpdateExists(true);
                      }
                    } catch (e) {
                      // Handle sandbox exception
                    }
                  });
                }
              });
            })
            .catch((err) => {
              console.error('[PWA] Service Worker registration failed:', err);
            });
        } catch (e) {
          console.warn('[PWA] serviceWorker.register is blocked in this sandboxed context:', e);
        }
      };

      // Event listener for active controller changes (reload the page as soon as skipWaiting yields controller control)
      let refreshing = false;
      try {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[PWA] Controller changed, reloading application tab...');
            window.location.reload();
          }
        });
      } catch (e) {
        console.warn('[PWA] serviceWorker controllerchange tracking blocked in this sandboxed context:', e);
      }

      if (document.readyState === 'complete') {
        handleRegister();
      } else {
        window.addEventListener('load', handleRegister);
        return () => window.removeEventListener('load', handleRegister);
      }
    }
  }, []);

  // 2. Network status monitoring
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(false);
      toast.success('Connection Restored', {
        description: 'Syncing your offline drafts and syncing creator data...'
      });
      syncAllPendingDrafts();
    };
    const handleOfflineStatus = () => {
      setIsOffline(true);
      toast.warning('Offline Mode Active', {
        description: 'You are now working offline securely. Drafts will sync when connection recovers.'
      });
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, [syncAllPendingDrafts]);

  useEffect(() => {
    // Show banner when installable, not installed, not dismissed in this session, and there is no active update waiting
    const dismissedInSession = safeSessionStorage.getItem('nx_pwa_dismissed') === 'true';
    if (isInstallable && !isInstalled && !dismissedInSession && !hasDismissed && !updateExists) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 12000); // 12 seconds delay for polished onboarding context
      return () => clearTimeout(timer);
    } else {
      setShowInstallBanner(false);
    }
  }, [isInstallable, isInstalled, hasDismissed, updateExists]);

  useEffect(() => {
    // Listen for successful installation to show welcome toast
    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setShowInstallBanner(false);
      setTimeout(() => setInstallSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstallClick = async () => {
    try {
      const outcome = await showPrompt();
      if (outcome === 'accepted') {
        console.log('[PWA] App installation accepted');
      }
      setShowInstallBanner(false);
    } catch (err) {
      console.error('[PWA] App installation triggered error', err);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setHasDismissed(true);
    // Persist session-level dismissal to avoid annoying active creators
    safeSessionStorage.setItem('nx_pwa_dismissed', 'true');
  };

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      console.log('[PWA] Dispatching SKIP_WAITING payload to register worker...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Emergency contingency fallback if reference was garbage collected/lost
      window.location.reload();
    }
  };

  const handleCreateDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      toast.error('Draft title is required');
      triggerHaptic('warning');
      return;
    }

    try {
      const payload = {
        uid: auth.currentUser?.uid || 'guest_creator',
        type: draftType,
        title: draftTitle,
        prompt: draftPrompt,
        style: draftStyle,
        content: JSON.stringify({ url: `https://picsum.photos/seed/${Math.random()}/500/500` })
      };

      await addOfflineDraft(payload);
      setDraftTitle('');
      setDraftPrompt('');
      setShowCreateDraft(false);
      await loadDrafts();
      triggerHaptic('success');
      toast.success('Offline Draft Queued!', {
        description: 'Stored in IndexedDB. It will background sync automatically when online.'
      });
    } catch (err) {
      triggerHaptic('error');
      toast.error('Failed to queue offline draft.');
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteOfflineDraft(id);
      await loadDrafts();
      triggerHaptic('light');
      toast.success('Draft removed from device cache.');
    } catch (err) {
      triggerHaptic('error');
      toast.error('Failed to delete draft.');
    }
  };

  const handleClearSynced = async () => {
    try {
      await clearSyncedOfflineDrafts();
      await loadDrafts();
      triggerHaptic('medium');
      toast.success('Cleaned up synced drafts from local cache.');
    } catch (err) {
      triggerHaptic('error');
      toast.error('Failed to clear synced drafts.');
    }
  };

  return (
    <>
      {/* 1. Offline Mode Indicator Status */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 bg-zinc-950 border border-amber-500/20 text-amber-400 p-3 px-4 rounded-xl shadow-2xl backdrop-blur-md max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-1.5 rounded-lg shrink-0">
                <WifiOff className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-white">Offline Mode Live</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Offline core cache active. Canvas tools operational.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-t border-white/5 pt-2">
              <Button
                onClick={() => setShowDraftQueue(true)}
                className="flex-1 h-7 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg flex items-center justify-center gap-1 font-semibold"
              >
                <FileText className="h-3 w-3" />
                Manage Offline Drafts ({drafts.filter(d => d.status !== 'synced').length})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.1 Unsynced drafts floating indicator (Only when online and drafts are waiting to sync) */}
      <AnimatePresence>
        {!isOffline && drafts.filter(d => d.status !== 'synced').length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setShowDraftQueue(true)}
            className="fixed bottom-28 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-2.5 px-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-400/30 font-medium text-xs transition-all hover:scale-105"
          >
            <CloudLightning className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>Sync Ready ({drafts.filter(d => d.status !== 'synced').length})</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Critical Low Power Warning Panel */}
      <AnimatePresence>
        {showBatteryWarn && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-36 right-6 z-50 flex flex-col gap-3 bg-zinc-950 border border-amber-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md w-[320px] max-w-[calc(100vw-48px)]"
          >
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg shrink-0 text-amber-500 border border-amber-500/20">
                <BatteryWarning className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[11px] text-white uppercase tracking-wider">Device Power Low</p>
                  <button 
                    onClick={() => {
                      setShowBatteryWarn(false);
                      setHasDismissedBattery(true);
                    }}
                    className="text-zinc-500 hover:text-white p-0.5 rounded transition-all"
                    aria-label="Dismiss battery warning"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-amber-500 mt-1">Battery level is at {Math.round(level * 100)}%</p>
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                  Please plug in your charger or save your active images & clips before your device drafts are lost.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <Button 
                onClick={() => {
                  setShowBatteryWarn(false);
                  setHasDismissedBattery(true);
                }}
                variant="outline"
                className="h-7 text-[10px] border-white/5 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg px-2.5 font-medium"
              >
                I'll save my work
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Service Worker Hotfix/Bundle Update Ready Panel */}
      <AnimatePresence>
        {updateExists && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] bg-zinc-950/95 border border-purple-500/30 p-5 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] text-white backdrop-blur-xl w-[380px] max-w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2 bg-purple-500/15 p-1.5 px-2.5 rounded-lg border border-purple-500/25">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[9px] font-bold tracking-widest text-purple-300 uppercase">System Hotfix</span>
              </div>
              <button 
                onClick={() => setUpdateExists(false)}
                className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Title / Description */}
            <div className="mt-4">
              <h4 className="text-sm font-bold font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                Optimization Update Ready
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                A new version of nxclip.ai OS is loaded. Complete this hotfix to synchronize instant assets, offline enhancements, and faster rendering speeds.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <Button 
                onClick={() => setUpdateExists(false)}
                variant="outline"
                className="flex-1 text-xs border-white/5 bg-zinc-900/50 hover:bg-zinc-900/80 h-9 font-medium text-zinc-300 transition-all rounded-xl"
              >
                Later
              </Button>
              <Button 
                onClick={handleApplyUpdate}
                className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white h-9 font-semibold shadow-lg hover:shadow-purple-500/20 transition-all rounded-xl border-none flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                Update OS
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Toast alert on successful installation */}
      <AnimatePresence>
        {installSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-950 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl shadow-2xl backdrop-blur-md max-w-sm"
          >
            <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Welcome to nxclip.ai OS</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">Application successfully installed to your local dock.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Floating Prompt Banner styled strictly to nxclip.ai graphite standard */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[380px] z-[100] bg-zinc-950/95 border border-white/10 p-5 rounded-2xl shadow-3xl text-white backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-2 px-3 rounded-lg border border-purple-500/20">
                <Smartphone className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">Interactive App</span>
              </div>
              <button 
                onClick={handleDismiss}
                className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all"
                aria-label="Dismiss panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Information */}
            <div className="mt-4">
              <h4 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                Install nxclip.ai Creator OS
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                Launch instantly from your home screen or dock. Run offline, enable faster loading, and get full screen canvas editing workspace with no browser bars.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-5">
              <Button 
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 text-xs border-white/10 hover:bg-white/5 h-10 font-medium text-zinc-300 transition-all rounded-xl"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={handleInstallClick}
                className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white h-10 font-semibold shadow-lg hover:shadow-purple-500/20 transition-all rounded-xl border-none flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Install Platform
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Swipe Drawer for Managing Offline Draft Sync Queue */}
      <AnimatePresence>
        {showDraftQueue && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDraftQueue(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140]"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[450px] max-w-full z-[150] bg-zinc-950/95 border-l border-white/10 p-6 flex flex-col text-white shadow-3xl backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                    <CloudLightning className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight font-display text-white">Offline Sync Hub</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Dual-mode background background sync queue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDraftQueue(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                  aria-label="Close sync panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status info bar */}
              <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Network State:</span>
                <span className={`font-semibold flex items-center gap-1.5 ${isOffline ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isOffline ? (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      Offline Mode Active
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connected to Cloud
                    </>
                  )}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => setShowCreateDraft(!showCreateDraft)}
                  variant="outline"
                  className="flex-1 text-[11px] h-8 border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-lg flex items-center justify-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5 text-purple-400" />
                  {showCreateDraft ? 'Cancel Form' : 'Add Draft Offline'}
                </Button>
                
                <Button
                  onClick={handleClearSynced}
                  variant="outline"
                  className="text-[11px] h-8 border-white/5 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg px-2.5"
                  title="Clear successfully synced jobs"
                >
                  Clear Synced
                </Button>

                <Button
                  onClick={syncAllPendingDrafts}
                  disabled={isOffline || isSyncing || drafts.filter(d => d.status === 'pending' || d.status === 'failed').length === 0}
                  className="text-[11px] h-8 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-900/40 text-white font-semibold rounded-lg flex items-center gap-1 border-none disabled:text-zinc-500 shadow-md transition-all"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync Now
                </Button>
              </div>

              {/* Create Draft Form Dropdown */}
              <AnimatePresence>
                {showCreateDraft && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateDraftSubmit}
                    className="mt-4 p-4 rounded-xl border border-purple-500/20 bg-purple-950/10 space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">Creation Mode</label>
                      <select
                        value={draftType}
                        onChange={(e) => setDraftType(e.target.value)}
                        className="w-full h-8 mt-1 rounded-lg bg-zinc-900 border border-white/10 px-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="image">Image Studio Draft</option>
                        <option value="clip">Viral Clip Trim Config</option>
                        <option value="coach_chat">Creator Coach Prompt</option>
                        <option value="comment">Commentary Script</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">Draft Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Minecraft Speedrun Thumbnail Ideas"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full h-8 mt-1 rounded-lg bg-zinc-900 border border-white/10 px-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">Idea Prompt / Captions</label>
                      <textarea
                        placeholder="Details of your creation or AI prompt description..."
                        rows={2}
                        value={draftPrompt}
                        onChange={(e) => setDraftPrompt(e.target.value)}
                        className="w-full mt-1 rounded-lg bg-zinc-900 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-zinc-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">Theme Style</label>
                        <input
                          type="text"
                          value={draftStyle}
                          onChange={(e) => setDraftStyle(e.target.value)}
                          className="w-full h-8 mt-1 rounded-lg bg-zinc-900 border border-white/10 px-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="submit"
                          className="h-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-xs font-bold rounded-lg border-none hover:to-indigo-500 text-white flex items-center justify-center gap-1.5"
                        >
                          Queue Draft
                        </Button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Draft List Scrollable Stream */}
              <div className="mt-5 flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {drafts.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                    <ListTodo className="h-8 w-8 text-zinc-600 mb-2.5" />
                    <p className="text-xs font-semibold text-zinc-400">Sync Queue Empty</p>
                    <p className="text-[10px] text-zinc-600 max-w-xs mt-1">Ready to capture and store any gaming creativity while running offline.</p>
                  </div>
                ) : (
                  drafts.map((draft) => {
                    const isSyncingItem = draft.status === 'syncing';
                    const isSynced = draft.status === 'synced';
                    const isFailed = draft.status === 'failed';

                    return (
                      <motion.div
                        key={draft.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-colors duration-200 ${
                          isSynced 
                            ? 'bg-zinc-900/40 border-emerald-500/10' 
                            : isFailed 
                              ? 'bg-zinc-900/50 border-red-500/20' 
                              : isSyncingItem 
                                ? 'bg-zinc-900/60 border-indigo-500/30' 
                                : 'bg-zinc-900 border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-white/5 border border-white/10 text-purple-400 shrink-0">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">{draft.title}</h4>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1 lines-clamp-2 leading-relaxed">
                              {draft.prompt || 'No content prompt specified.'}
                            </p>
                            {draft.error && (
                              <p className="text-[9px] text-red-400 bg-red-400/5 border border-red-500/10 p-1 px-1.5 rounded mt-1.5">
                                Error: {draft.error}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Status label */}
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isSynced 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : isFailed 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                  : isSyncingItem 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {draft.status}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all"
                              title="Delete local draft record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-zinc-500 border-t border-white/5 pt-1.5 mt-1">
                          <span>Mode: {draft.type} | Style: {draft.style || 'None'}</span>
                          <span>{new Date(draft.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
