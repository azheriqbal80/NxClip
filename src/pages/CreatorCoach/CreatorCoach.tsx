import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  History, 
  Zap, 
  Copy, 
  Check, 
  Mic, 
  Download, 
  Trash2,
  Loader2,
  User,
  Bot,
  X,
  RefreshCw,
  TrendingUp,
  BarChart2,
  ZapOff,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { auth, db, handleFirestoreError, OperationType, isFirebaseConfigured } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  deleteDoc,
  limit,
  FieldValue
} from "firebase/firestore";
import { chatWithCoach, CreatorProfile, AIError } from "../../services/aiService";
import { Creation } from "../../types";
import { toast } from "sonner";
import { triggerHaptic } from "../../lib/vibration";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";
import { safeLocalStorage } from "../../lib/safeStorage";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Badge } from "../../components/ui/badge";
import { Dna, Rocket, Target, Users, Calendar, Save } from "lucide-react";
import { WorkspaceExportDialog } from "../../components/WorkspaceExportDialog";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp?: string | number | FieldValue;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string | number | FieldValue;
}

export default function CreatorCoach() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [questionsRemaining, setQuestionsRemaining] = useState<number | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"viral" | "growth" | "analytics" | "mastery">("viral");
  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([]);
  const [showProfileConfig, setShowProfileConfig] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile>({
    games: [],
    audience: "",
    goal: "",
    frequency: "",
    creatorName: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialTextRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Web Speech API not supported", {
        description: "Your browser does not support voice-to-text. Try using Google Chrome or Safari."
      });
      triggerHaptic("error");
      return;
    }

    try {
      initialTextRef.current = message;
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = i18n.language === "ar" ? "ar-SA" : "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        triggerHaptic("light");
        toast.info("Voice Input Activated", {
          description: "Listening... speak into your microphone."
        });
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        
        const base = initialTextRef.current ? initialTextRef.current.trim() + " " : "";
        setMessage(base + finalTranscript + interimTranscript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error !== "no-speech") {
          let errorMsg = "Speech recognition encountered an error.";
          if (event.error === "not-allowed") {
            errorMsg = "Microphone access denied. Please allow microphone permission.";
          }
          toast.error("Voice Input Error", {
            description: errorMsg
          });
          triggerHaptic("error");
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      toast.error("Speech Recognition Failed", {
        description: err?.message || "Could not instantiate the Speech Recognition controller."
      });
      triggerHaptic("error");
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        triggerHaptic("success");
        toast.success("Intelligence Captured", {
          description: "Voice-to-text input finalized."
        });
      } catch (err) {
        console.error("Error stopping SpeechRecognition:", err);
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  useEffect(() => {
    refreshPrompts();
  }, [activeCategory, i18n.language]);

  const refreshPrompts = () => {
    const categoriesMapped = {
      viral: t('coach.prompts.viral', { returnObjects: true }) as string[],
      growth: t('coach.prompts.growth', { returnObjects: true }) as string[],
      analytics: t('coach.prompts.analytics', { returnObjects: true }) as string[],
      mastery: t('coach.prompts.mastery', { returnObjects: true }) as string[]
    };
    const categoryPrompts = categoriesMapped[activeCategory] || [];
    const shuffled = [...categoryPrompts].sort(() => 0.5 - Math.random()).slice(0, 3);
    setShuffledPrompts(shuffled);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setQuestionsRemaining(5);
      const savedProfile = safeLocalStorage.getItem("nexaclip_creator_profile");
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (_) {}
      } else {
        setProfile({
          games: ["Valorant"],
          audience: "Casual gamers",
          goal: "Build an active community",
          frequency: "3 times a week",
          creatorName: auth.currentUser?.displayName || "Creator"
        });
      }
      
      const savedChats = safeLocalStorage.getItem("nexaclip_coach_chats");
      if (savedChats) {
        try {
          setSessions(JSON.parse(savedChats));
        } catch (_) {}
      } else {
        setSessions([]);
      }
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Listen to user profile for question count and coach settings
    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setQuestionsRemaining(data.coachQuestionsRemaining ?? 5);
        setProfile({
          games: data.games ?? [],
          audience: data.audience ?? "",
          goal: data.goal ?? "",
          frequency: data.frequency ?? "",
          creatorName: data.creatorName ?? data.displayName ?? ""
        });
        
        // Simple onboarding check
        const isIncomplete = !data.games?.length || !data.audience || !data.goal;
        setProfileIncomplete(isIncomplete);
      }
    });

    const q = query(
      collection(db, "chats"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const qCreations = query(
      collection(db, "creations"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribeChats = onSnapshot(q, (snapshot) => {
      const chatSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(chatSessions);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chats");
      setLoading(false);
    });

    const unsubscribeCreations = onSnapshot(qCreations, (snapshot) => {
      const creationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Creation[];
      setCreations(creationsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "creations");
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeCreations) unsubscribeCreations();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    const scrollContainer = messagesEndRef.current?.closest('.rt-ScrollAreaViewport') || document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setIsScrolled(target.scrollTop > 300);
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, isTyping]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const handleNewChat = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        uid: auth.currentUser.uid,
        title: t('coach.history.new_chat_title'),
        messages: [{
          role: "model",
          text: t('coach.history.welcome_msg'),
          timestamp: new Date().toISOString()
        }],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setActiveSessionId(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "chats");
    }
  };

  const handleSend = async (textOverride?: string) => {
    const msgText = textOverride || message;
    if (!msgText || !auth.currentUser) return;

    // Check limits
    if (questionsRemaining !== null && questionsRemaining <= 0) {
      return; // UI will handle showing the upgrade prompt
    }

    let sessionId = activeSessionId;
    let currentMessages = activeSession?.messages || [];

    if (!sessionId) {
      try {
        const docRef = await addDoc(collection(db, "chats"), {
          uid: auth.currentUser.uid,
          title: msgText.slice(0, 30) + "...",
          messages: [],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        sessionId = docRef.id;
        setActiveSessionId(sessionId);
        // Since the snapshot might not have arrived yet, we start with an empty array for local logic
        currentMessages = [];
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "chats");
        return;
      }
    }

    const userMsg: Message = { 
      role: "user", 
      text: msgText, 
      timestamp: new Date().toISOString() 
    };
    
    const updatedMessages = [...currentMessages, userMsg];
    
    setMessage("");
    setIsTyping(true);

    try {
      // Update Firestore with user message
      await updateDoc(doc(db, "chats", sessionId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp()
      });

      // Get AI response
      const aiResponse = await chatWithCoach(
        msgText, 
        updatedMessages.map(m => ({ role: m.role, text: m.text })),
        creations,
        profile
      );
      
      const aiMsg: Message = { 
        role: "model", 
        text: aiResponse || t('coach.errors.processing'), 
        timestamp: new Date().toISOString() 
      };

      await updateDoc(doc(db, "chats", sessionId), {
        messages: [...updatedMessages, aiMsg],
        updatedAt: serverTimestamp()
      });

      // Decrement counter
      if (questionsRemaining !== null) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          coachQuestionsRemaining: questionsRemaining - 1,
          updatedAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("Coach interaction failed:", error);
      
      let description = "Encountered an error while connecting to the neural network.";
      if (error instanceof AIError) {
        description = error.message;
      }
      
      toast.error("Connectivity Issue", {
        description: description
      });

      const errorMsg: Message = {
        role: "model",
        text: t('coach.errors.connectivity', { error: description }),
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "chats", sessionId), {
        messages: [...updatedMessages, errorMsg],
        updatedAt: serverTimestamp()
      });
    } finally {
      setIsTyping(false);
      setShowMobileHistory(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(index);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "chats", id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${id}`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...profile,
        onboardingCompleted: true,
        updatedAt: serverTimestamp()
      });
      setShowProfileConfig(false);
      setProfileIncomplete(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "users");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col gap-4 relative overflow-hidden mesh-gradient p-2 lg:p-4">
        {/* Mobile History Toggle */}
        <div className="flex items-center justify-between lg:hidden px-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <h1 className="text-sm font-display font-black tracking-tighter italic text-foreground text-brand-secondary">{t('coach.sidebar.history')}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 bg-muted/50 border border-border backdrop-blur-md rounded-md"
            onClick={() => setShowMobileHistory(true)}
          >
            <History size={16} />
            <span className="text-[10px] font-bold tracking-widest text-brand-secondary">{t('coach.sidebar.history')}</span>
          </Button>
        </div>

        <div className="flex gap-4 lg:gap-6 flex-grow overflow-hidden relative">
          {/* Mobile History Drawer */}
          <AnimatePresence>
            {showMobileHistory && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileHistory(false)}
                  className="fixed inset-0 bg-popover/80 backdrop-blur-xl z-[60] lg:hidden"
                />
                <motion.div 
                  initial={{ x: isRtl ? "100%" : "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: isRtl ? "100%" : "-100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className={cn(
                    "fixed inset-y-0 w-[85%] max-w-[320px] bg-card z-[70] lg:hidden flex flex-col border-border shadow-soft-lg",
                    isRtl ? "right-0 border-l" : "left-0 border-r"
                  )}
                >
                  <div className="p-6 border-b border-border/5 flex items-center justify-between">
                    <h3 className="font-display font-black text-xs tracking-[0.2em] text-primary">{t('coach.sidebar.chat_history')}</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowMobileHistory(false)} className="hover:bg-muted/50">
                      <X size={20} />
                    </Button>
                  </div>
                  <div className="p-6 border-b border-border/5">
                    <Button 
                      onClick={() => { handleNewChat(); setShowMobileHistory(false); }}
                      className="w-full gap-2 bg-primary text-primary-foreground h-11 font-bold tracking-tight shadow-xl shadow-primary/20 rounded-md"
                    >
                      <Plus size={18} strokeWidth={3} />
                      {t('coach.sidebar.new_conversation')}
                    </Button>
                  </div>
                  <ScrollArea className="flex-grow px-4 py-6">
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div 
                          key={s.id}
                          onClick={() => { setActiveSessionId(s.id); setShowMobileHistory(false); }}
                          className={cn(
                            "group p-4 rounded-lg cursor-pointer transition-all relative flex items-center gap-3",
                            activeSessionId === s.id 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted border border-transparent"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            activeSessionId === s.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-muted"
                          )} />
                          <div className="flex-grow overflow-hidden">
                            <p className={cn(
                              "text-xs font-bold truncate tracking-tight",
                              activeSessionId === s.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                              {s.title || t('coach.sidebar.untitled')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showProfileConfig && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProfileConfig(false)}
                  className="fixed inset-0 bg-popover/80 backdrop-blur-xl z-[80]"
                />
                <motion.div 
                  initial={{ x: isRtl ? "-100%" : "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: isRtl ? "-100%" : "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className={cn(
                    "fixed inset-y-0 w-[90%] max-w-[400px] bg-card z-[90] flex flex-col border-border shadow-soft-lg",
                    isRtl ? "left-0 border-r" : "right-0 border-l"
                  )}
                >
                  <div className="p-6 border-b border-border/5 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                        <Dna size={16} />
                      </div>
                      <h3 className="font-display font-black text-xs tracking-[0.2em] text-foreground uppercase italic px-1">{t('coach.dna.title')}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowProfileConfig(false)} className="hover:bg-muted/50 rounded-full h-8 w-8">
                      <X size={18} />
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-grow px-6 py-8">
                    <div className="space-y-8 pb-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Users size={16} className="text-primary" />
                          <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t('coach.dna.sections.identity')}</Label>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="creator-name" className="text-xs font-bold">{t('coach.dna.labels.handle')}</Label>
                            <Input 
                              id="creator-name" 
                              value={profile.creatorName}
                              onChange={(e) => setProfile(prev => ({ ...prev, creatorName: e.target.value }))}
                              placeholder={t('coach.dna.placeholders.handle')}
                              className="bg-muted/30 border-border focus:border-primary/50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Rocket size={16} className="text-primary" />
                          <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t('coach.dna.sections.focus')}</Label>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold font-display">{t('coach.dna.labels.games')}</Label>
                            <Input 
                              value={profile.games?.join(", ")}
                              onChange={(e) => setProfile(prev => ({ ...prev, games: e.target.value.split(",").map(g => g.trim()) }))}
                              placeholder={t('coach.dna.placeholders.games')}
                              className="bg-muted/30 border-border focus:border-primary/50"
                            />
                            <p className="text-[9px] text-muted-foreground italic font-medium">{t('coach.dna.help.games')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Target size={16} className="text-primary" />
                          <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t('coach.dna.sections.audience_goals')}</Label>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">{t('coach.dna.labels.audience')}</Label>
                            <Select 
                              value={profile.audience} 
                              onValueChange={(val) => setProfile(prev => ({ ...prev, audience: val }))}
                            >
                              <SelectTrigger className="bg-muted/30 border-border">
                                <SelectValue placeholder={t('coach.dna.placeholders.audience')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="competitive-gamers">{t('coach.options.audience.competitive')}</SelectItem>
                                <SelectItem value="casual-content">{t('coach.options.audience.casual')}</SelectItem>
                                <SelectItem value="gen-z-shorts">{t('coach.options.audience.genz')}</SelectItem>
                                <SelectItem value="technical-meta">{t('coach.options.audience.technical')}</SelectItem>
                                <SelectItem value="funny-fails">{t('coach.options.audience.funny')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold">{t('coach.dna.labels.goal')}</Label>
                            <Select 
                              value={profile.goal} 
                              onValueChange={(val) => setProfile(prev => ({ ...prev, goal: val }))}
                            >
                              <SelectTrigger className="bg-muted/30 border-border">
                                <SelectValue placeholder={t('coach.dna.placeholders.goal')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viral-growth">{t('coach.options.goals.viral')}</SelectItem>
                                <SelectItem value="community-building">{t('coach.options.goals.community')}</SelectItem>
                                <SelectItem value="brand-deals">{t('coach.options.goals.brand')}</SelectItem>
                                <SelectItem value="skill-showcase">{t('coach.options.goals.skill')}</SelectItem>
                                <SelectItem value="full-time-creator">{t('coach.options.goals.fulltime')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={16} className="text-primary" />
                          <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t('coach.dna.sections.consistency')}</Label>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">{t('coach.dna.labels.frequency')}</Label>
                            <Select 
                              value={profile.frequency} 
                              onValueChange={(val) => setProfile(prev => ({ ...prev, frequency: val }))}
                            >
                              <SelectTrigger className="bg-muted/30 border-border">
                                <SelectValue placeholder={t('coach.dna.placeholders.frequency')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">{t('coach.options.frequency.daily')}</SelectItem>
                                <SelectItem value="multi-weekly">{t('coach.options.frequency.multi_weekly')}</SelectItem>
                                <SelectItem value="weekly">{t('coach.options.frequency.weekly')}</SelectItem>
                                <SelectItem value="bi-weekly">{t('coach.options.frequency.bi_weekly')}</SelectItem>
                                <SelectItem value="monthly">{t('coach.options.frequency.monthly')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  
                  <div className="p-6 border-t border-border/5 bg-muted/10 backdrop-blur-md">
                    <Button 
                      className="w-full gap-2 bg-primary text-primary-foreground h-12 font-black tracking-widest shadow-xl shadow-primary/20"
                      onClick={handleUpdateProfile}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Save size={16} />
                      )}
                      {t('coach.dna.save_btn')}
                    </Button>
                    <p className="text-center text-[9px] text-muted-foreground font-bold tracking-widest mt-4 uppercase">
                      {t('coach.dna.help.recalibrate')}
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Left Panel - History (Desktop) */}
          <div className="hidden lg:flex flex-col w-80 glass border-border rounded-lg overflow-hidden shadow-soft-lg relative">
            <div className="p-6 border-b border-border/5">
              <Button 
                onClick={handleNewChat}
                className="w-full gap-2 bg-primary text-primary-foreground h-12 font-black tracking-tight shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all rounded-md"
              >
                <Plus size={18} strokeWidth={3} />
                {t('coach.sidebar.new_chat')}
              </Button>
            </div>
            <ScrollArea className="flex-grow px-4 py-8">
              <div className="space-y-1.5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                    <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/70">{t('coach.sidebar.loading_archive')}</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-20 px-6 space-y-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
                      <History size={24} />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/70">{t('coach.sidebar.no_conversations')}</p>
                  </div>
                ) : (
                  sessions.map((s) => (
                    <motion.div 
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setActiveSessionId(s.id)}
                      className={cn(
                        "group p-3.5 rounded-lg cursor-pointer transition-all relative flex items-center gap-3 border",
                        activeSessionId === s.id 
                          ? "bg-primary/5 border-primary/20 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]" 
                          : "hover:bg-muted border-transparent hover:border-border/50"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-500",
                        activeSessionId === s.id 
                          ? "bg-primary scale-125 shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]" 
                          : "bg-muted group-hover:bg-muted-foreground/30"
                      )} />
                      
                      <div className="flex-grow overflow-hidden">
                        <p className={cn(
                          "text-[12px] font-bold truncate leading-tight transition-colors",
                          activeSessionId === s.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {s.title || t('coach.sidebar.untitled')}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 font-bold tracking-widest mt-1">
                          {s.messages.length} {t('coach.sidebar.archived')}
                        </p>
                      </div>

                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteChat(e, s.id)}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-6 bg-muted/20 border-t border-border/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Zap size={14} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.15em] text-foreground italic">
                      {questionsRemaining !== null ? t('coach.sidebar.queries_left', { count: questionsRemaining }) : t('coach.sidebar.unlimited')}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider">
                      {questionsRemaining !== null && questionsRemaining <= 0 ? t('coach.sidebar.limit_reached') : t('coach.sidebar.station')}
                    </p>
                  </div>
                </div>
                {questionsRemaining !== null && questionsRemaining <= 0 && (
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10">
                    <Link to="/pricing">{isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-grow flex flex-col glass border-border rounded-lg overflow-hidden relative shadow-soft-lg bg-card/40 backdrop-blur-3xl">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Header */}
            <div className="flex-none px-6 py-5 border-b border-border/5 flex items-center justify-between bg-background/20 backdrop-blur-2xl relative z-20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-soft-md shadow-primary/40 relative z-10">
                    <Sparkles size={22} fill="currentColor" />
                  </div>
                  <div className="absolute -inset-1 bg-primary/20 blur-md rounded-lg animate-pulse" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-display font-black tracking-tight text-foreground italic text-brand-secondary">{t('coach.header.title')}</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black tracking-widest px-1.5 h-4">{t('coach.header.beta')}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                          className="w-1 h-3 rounded-full bg-brand-secondary/50" 
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground tracking-[0.15em]">{t('coach.header.neural_link')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <p className="text-[9px] font-black text-muted-foreground tracking-widest leading-none mb-1">{t('coach.header.latency')}</p>
                  <p className="text-[10px] font-black text-brand-secondary font-mono">{t('coach.header.latency_value')} <span className="text-muted-foreground/30">±0.4</span></p>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsWorkspaceOpen(true)}
                        className="w-9 h-9 border-border bg-background/50 hover:bg-accent text-muted-foreground rounded-md"
                      >
                        <Download size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border text-popover-foreground text-[10px] font-bold tracking-widest">{t('coach.header.snapshot_tooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-4 w-px bg-border hidden sm:block" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setShowProfileConfig(true)}
                        className="w-9 h-9 border-border bg-background/50 hover:bg-accent text-primary rounded-md group relative overflow-hidden"
                      >
                        <Dna size={16} className="group-hover:rotate-12 transition-transform" />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border text-popover-foreground text-[10px] font-bold tracking-widest">{t('coach.header.dna_tooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-background/50 border-border text-foreground font-black text-[10px] tracking-widest px-4 hover:bg-accent active:scale-95 transition-all hidden sm:flex rounded-md"
                >
                  <Plus className="mr-2" size={14} strokeWidth={3} />
                  {t('coach.header.new_hub')}
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-grow min-h-0 relative z-10" onScroll={handleScroll}>
              <div className="p-6 lg:p-10 space-y-10 max-w-4xl mx-auto pb-12">
                <AnimatePresence>
                  {isScrolled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      className="fixed bottom-32 right-10 z-50"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={scrollToTop}
                        className="rounded-full h-10 px-4 gap-2 bg-background/80 backdrop-blur-md border border-border shadow-xl hover:bg-primary hover:text-white transition-all group"
                      >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black tracking-widest uppercase">{t('coach.chat.scroll_to_hub')}</span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!activeSession && !isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-20"
                  >
                    <div className="relative mb-10">
                      <div className="w-24 h-24 bg-muted/30 border border-border rounded-lg flex items-center justify-center text-primary relative z-10 backdrop-blur-3xl">
                        <MessageSquare size={44} strokeWidth={1.5} />
                      </div>
                      <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl" />
                    </div>
                    
                    <h2 className="text-3xl font-display font-black text-foreground mb-4 tracking-tighter italic text-brand-secondary">{t('coach.onboarding.title', { defaultValue: 'Ready to Optimize?' })}</h2>
                    
                    {profileIncomplete && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center gap-3 max-w-sm"
                      >
                        <p className="text-[10px] font-black tracking-widest text-primary uppercase">{t('coach.onboarding.dna_required')}</p>
                        <p className="text-[11px] text-muted-foreground font-medium text-center">{t('coach.onboarding.dna_required_desc')}</p>
                        <Button 
                          onClick={() => setShowProfileConfig(true)}
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-black tracking-widest border-primary/30 hover:bg-primary/10"
                        >
                          {t('coach.onboarding.initialize_btn')}
                        </Button>
                      </motion.div>
                    )}

                    <p className="text-[13px] text-muted-foreground font-medium max-w-sm mb-12 leading-relaxed">
                      {t('coach.onboarding.desc')}
                    </p>
                    
                    <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">
                      {/* Category Switcher */}
                      <div className="flex flex-wrap items-center justify-center gap-2 p-1 bg-muted/30 border border-border rounded-lg">
                        {[
                          { id: "viral", label: t('coach.categories.viral'), icon: TrendingUp },
                          { id: "growth", label: t('coach.categories.growth'), icon: Sparkles },
                          { id: "analytics", label: t('coach.categories.analytics'), icon: BarChart2 },
                          { id: "mastery", label: t('coach.categories.mastery'), icon: Zap }
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as "viral" | "growth" | "analytics" | "mastery")}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black tracking-widest transition-all",
                              activeCategory === cat.id 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <cat.icon size={12} />
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {shuffledPrompts.map(p => (
                          <motion.button 
                            key={p}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSend(p)}
                            className="px-5 py-3 rounded-lg bg-muted/30 border border-border text-[11px] font-black tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center gap-3 group shadow-soft-lg"
                          >
                            <Zap size={12} className="text-primary group-hover:animate-pulse" fill="currentColor" />
                            <span dir="auto">{p}</span>
                          </motion.button>
                        ))}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={refreshPrompts}
                          className="text-[10px] font-black tracking-widest text-muted-foreground/50 hover:text-primary gap-2"
                        >
                          <RefreshCw size={12} />
                          {t('coach.onboarding.shuffled_refresher')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSession?.messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex gap-5 lg:gap-8",
                      msg.role === "user" 
                        ? (isRtl ? "flex-row" : "flex-row-reverse") 
                        : (isRtl ? "flex-row-reverse" : "flex-row")
                    )}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-lg shadow-soft-lg relative transition-all duration-500",
                        msg.role === "user" 
                          ? "bg-accent border border-border group-hover:scale-110" 
                          : "bg-primary group-hover:scale-110 shadow-primary/20"
                      )}>
                        {msg.role === "user" 
                          ? <User size={18} className="text-foreground" /> 
                          : <Bot size={18} className="text-primary-foreground" fill="currentColor" />}
                        {msg.role !== "user" && <div className="absolute -inset-1 bg-primary/30 blur-md rounded-lg opacity-50" />}
                      </div>
                      <div className="w-px h-full bg-gradient-to-bottom from-border/50 to-transparent" />
                    </div>

                    <div className={cn(
                      "flex-grow max-w-[85%] relative group",
                      msg.role === "user" ? (isRtl ? "text-left" : "text-right") : (isRtl ? "text-right" : "text-left")
                    )}>
                      <div className={cn(
                        "p-6 lg:p-8 rounded-lg transition-all duration-500 border relative overflow-hidden",
                        msg.role === "user" 
                          ? "bg-muted/30 border-border rounded-tr-none hover:bg-muted/50" 
                          : "bg-card border-border backdrop-blur-2xl rounded-tl-none hover:bg-accent/30 shadow-soft-lg"
                      )}>
                        {/* Decorative inner glow for assistant messages */}
                        {msg.role !== "user" && (
                          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        )}

                        <div className={cn(
                          "prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-code:font-mono prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-strong:text-foreground prose-strong:font-black",
                          "dark:prose-pre:bg-neutral-900 dark:prose-pre:border dark:prose-pre:border-border dark:prose-pre:rounded-lg"
                        )}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        
                        {msg.role === "model" && (
                          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleCopy(msg.text, i)}
                                className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copySuccess === i ? (
                                  <>
                                    <Check size={12} className="text-brand-secondary" />
                                    {t('coach.chat.copied')}
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    {t('coach.chat.copy_intel')}
                                  </>
                                )}
                              </button>
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest">{t('coach.chat.evaluated_tokens')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "mt-2 text-[9px] font-black text-muted-foreground/50 tracking-widest",
                        msg.role === "user" 
                          ? (isRtl ? "text-left ml-4" : "text-right mr-4") 
                          : (isRtl ? "text-right mr-4" : "text-left ml-4")
                      )}>
                        {msg.role === "user" ? t('coach.chat.creator_access') : t('coach.chat.coach_response')} • {new Date(msg.timestamp as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-8"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary shadow-soft-lg shadow-primary/20 relative z-10 animate-pulse">
                        <Bot size={18} className="text-primary-foreground" fill="currentColor" />
                      </div>
                    </div>
                    <div className="bg-card border border-border p-6 lg:px-8 py-4 rounded-lg rounded-tl-none backdrop-blur-3xl shadow-soft-lg">
                      <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.3, 1, 0.3],
                              y: [0, -4, 0]
                            }} 
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.2, 
                              delay: i * 0.15,
                              ease: "easeInOut"
                            }} 
                            className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" 
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-20" />
              </div>
            </ScrollArea>

            {/* Input Station */}
            <div className="flex-none p-6 lg:p-8 bg-background/80 border-t border-border/5 backdrop-blur-3xl relative z-30">
              <div className="max-w-4xl mx-auto">
                {questionsRemaining !== null && questionsRemaining <= 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-xl flex flex-col items-center text-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <ZapOff size={24} />
                    </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black tracking-widest text-foreground">{t('coach.input.limit_title')}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{t('coach.input.limit_desc')}</p>
                      </div>
                      <Button asChild variant="brand-gradient" size="lg" className="w-full sm:w-auto px-12 mt-2">
                        <Link to="/pricing">{t('coach.input.upgrade_btn')}</Link>
                      </Button>
                  </motion.div>
                ) : (
                  <div className="relative group">
                    {/* Neon border glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-tertiary/30 rounded-lg blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative flex items-end gap-3 glass border-border hover:border-border/50 transition-all p-2 rounded-lg bg-card shadow-soft-lg">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={handleMicToggle}
                        aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
                        className={cn(
                          "h-12 w-12 rounded-lg shrink-0 flex transition-all duration-500",
                          isRecording 
                            ? "bg-destructive text-primary-foreground shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" 
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <Mic size={20} strokeWidth={isRecording ? 3 : 2} />
                      </Button>
                      
                      <div className="flex-grow relative">
                        <label htmlFor="coach-message-input" className="sr-only">Message the Coach</label>
                        <Textarea 
                          id="coach-message-input"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                          placeholder={t('coach.input.placeholder')}
                          className="min-h-[52px] max-h-[250px] bg-transparent border-none text-foreground text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 resize-none py-4 px-4 font-medium leading-relaxed no-scrollbar"
                          rows={1}
                        />
                      </div>

                      <div className="flex items-center gap-2 pr-2 pb-2">
                         <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                aria-label="Attach context"
                                className="h-8 w-8 text-muted-foreground/50 hover:text-foreground rounded-lg hidden md:flex"
                              >
                                <Plus size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border text-[9px] font-black text-popover-foreground">{t('coach.input.attach_tooltip')}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button 
                          size="icon"
                          onClick={() => handleSend()}
                          disabled={!message || isTyping}
                          aria-label="Send message"
                          className={cn(
                            "h-11 w-11 rounded-lg transition-all duration-500 shadow-2xl relative overflow-hidden group",
                            !message || isTyping 
                              ? "bg-muted text-muted-foreground" 
                              : "bg-primary text-primary-foreground shadow-primary/30 hover:scale-105 active:scale-95"
                          )}
                        >
                          <div className="relative z-10">
                            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} strokeWidth={2.5} />}
                          </div>
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                      <div className="w-1 h-1 rounded-full bg-foreground" />
                      <span className="text-[9px] font-black tracking-[0.2em]">{t('coach.input.llm')}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                      <div className="w-1 h-1 rounded-full bg-brand-secondary" />
                      <span className="text-[9px] font-black text-brand-secondary tracking-[0.2em]">{t('coach.input.context_window')}</span>
                    </div>
                  </div>
                  <p className="text-[9px] font-black text-muted-foreground tracking-[0.2em] hidden sm:block">
                    {t('coach.input.shortcuts')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Workspace Core Export Hub */}
        <WorkspaceExportDialog 
          isOpen={isWorkspaceOpen} 
          onClose={() => setIsWorkspaceOpen(false)} 
        />
    </div>
  );
}
