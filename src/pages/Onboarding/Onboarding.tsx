import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  Bot, 
  Calendar, 
  Zap, 
  Tag, 
  Gamepad2, 
  Plane, 
  Utensils, 
  ChefHat, 
  Compass,
  AlertCircle
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { coachApi, CoachQuestionResponse, CoachPlanResponse } from "../../services/apiClient";
import { socketService } from "../../services/socketService";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { selectAuthUser, selectAuthProfile, setAuthProfile } from "../../store/slices/authSlice";
import { safeSessionStorage } from "../../lib/safeStorage";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

interface ChatMessage {
  id: string;
  sender: "coach" | "user";
  text: string;
  timestamp: string;
  questionNumber?: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  Gaming: Gamepad2,
  General: Compass,
  Travel: Plane,
  Food: Utensils,
  Cooking: ChefHat,
};

export default function Onboarding() {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector(selectAuthUser);
  const reduxProfile = useAppSelector(selectAuthProfile);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Onboarding API states
  const [currentQuestion, setCurrentQuestion] = useState<CoachQuestionResponse | null>(null);
  const [onboardingPlan, setOnboardingPlan] = useState<CoachPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMultiChips, setSelectedMultiChips] = useState<string[]>([]);
  const [progressMessage, setProgressMessage] = useState<string>("");
  
  // Streaming token accumulator
  const [streamingText, setStreamingText] = useState<string>("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat area
  const scrollToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, selectedMultiChips, submitting, generatingPlan, scrollToBottom]);

  // Initial load: Fetch status or start onboarding
  const initOnboarding = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      // Check location state for reset directive
      const isReset = reset || !!location.state?.fromReset;
      const response = await coachApi.start(undefined, isReset);
      setCurrentQuestion(response);

      if (response.status === "completed") {
        // Already completed
        navigate("/dashboard", { replace: true });
        return;
      }

      // Add initial coach message to chat
      setMessages([
        {
          id: `coach_init_${Date.now()}`,
          sender: "coach",
          text: response.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionNumber: response.question,
        }
      ]);
    } catch (err: any) {
      console.error("[Onboarding] Error initiating coach session:", err);
      setError(err?.message || "Failed to connect to Creator Coach. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    initOnboarding();
  }, [initOnboarding]);

  // Socket.IO event listeners for live token streaming
  useEffect(() => {
    const handleCoachToken = (data: { token?: string; text?: string }) => {
      const tokenStr = data.token || data.text || "";
      setStreamingText((prev) => prev + tokenStr);
    };

    const handleCoachProgress = (data: { message?: string }) => {
      if (data?.message) {
        setProgressMessage(data.message);
      }
    };

    const handleOnboardingComplete = (data: any) => {
      console.log("[Onboarding] Received onboarding:complete socket event:", data);
    };

    socketService.on("coach:token", handleCoachToken);
    socketService.on("coach:progress", handleCoachProgress);
    socketService.on("onboarding:complete", handleOnboardingComplete);

    return () => {
      socketService.off("coach:token", handleCoachToken);
      socketService.off("coach:progress", handleCoachProgress);
      socketService.off("onboarding:complete", handleOnboardingComplete);
    };
  }, []);

  // Handle answering question 0 (category) or questions 1-5
  const handleAnswer = async (answerVal: string | string[]) => {
    if (submitting || !currentQuestion) return;
    setSubmitting(true);
    setError(null);

    // Format user's message bubble text
    const userDisplayAnswer = Array.isArray(answerVal) ? answerVal.join(", ") : answerVal;

    // Add user's selection to chat log immediately (Optimistic UI)
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: userDisplayAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSelectedMultiChips([]);
    setStreamingText("");

    try {
      let nextResponse: CoachQuestionResponse;
      
      if (currentQuestion.question === 0) {
        // Question 0 is category picker: pass category to start
        nextResponse = await coachApi.start(typeof answerVal === "string" ? answerVal : answerVal[0]);
      } else {
        // Questions 1-5
        nextResponse = await coachApi.answer(currentQuestion.question, answerVal);
      }

      setCurrentQuestion(nextResponse);

      // Append coach's next message to chat log
      const coachMsg: ChatMessage = {
        id: `coach_${Date.now()}`,
        sender: "coach",
        text: nextResponse.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        questionNumber: nextResponse.question,
      };

      setMessages((prev) => [...prev, coachMsg]);

      // If status is ready_for_plan, trigger plan generation automatically
      if (nextResponse.status === "ready_for_plan") {
        await handleGeneratePlan();
      }
    } catch (err: any) {
      console.error("[Onboarding] Error submitting answer:", err);
      setError(err?.message || "Failed to submit answer. Please try again.");
      toast.error("Answering Failed", { description: err?.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger AI 7-day Plan Generation
  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setError(null);
    try {
      const planRes = await coachApi.generatePlan();
      setOnboardingPlan(planRes);

      // Update Redux profile state
      if (reduxProfile) {
        dispatch(
          setAuthProfile({
            ...reduxProfile,
            onboardingCompleted: true,
          })
        );
      }

      toast.success("Creation Plan Generated!", {
        description: "Your personalized 7-day strategy is ready."
      });
    } catch (err: any) {
      console.error("[Onboarding] Error generating plan:", err);
      setError(err?.message || "Failed to generate your personalized plan.");
      toast.error("Plan Generation Failed", { description: err?.message || "Please try again." });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Skip onboarding handler
  const handleSkip = async () => {
    try {
      safeSessionStorage.setItem("finishing_onboarding", "true");
      if (reduxProfile) {
        dispatch(setAuthProfile({ ...reduxProfile, onboardingCompleted: true }));
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      navigate("/dashboard", { replace: true });
    }
  };

  // Toggle multi-select chip selection
  const toggleMultiChip = (chip: string) => {
    setSelectedMultiChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  // Finish onboarding and jump to creation or dashboard
  const handleFinishOnboarding = () => {
    safeSessionStorage.setItem("finishing_onboarding", "true");
    if (reduxProfile) {
      dispatch(setAuthProfile({ ...reduxProfile, onboardingCompleted: true }));
    }
    navigate("/create/image", { 
      replace: true,
      state: { fromOnboarding: true }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Connecting to your Creator Coach...
        </p>
      </div>
    );
  }

  const answeredCount = currentQuestion?.answeredCount ?? 0;
  const totalQuestions = currentQuestion?.totalQuestions ?? 5;
  const currentQNum = currentQuestion?.question ?? 0;
  const isMulti = currentQuestion?.multiSelect ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* TOP HEADER BAR */}
      <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight brand-text-gradient">
            nxclip<span className="text-primary">.ai</span>
          </span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-mono">
            Creator Coach
          </span>
        </div>

        {/* PROGRESS DOTS */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {[1, 2, 3, 4, 5].map((stepNum) => {
              const isDone = answeredCount >= stepNum;
              const isCurrent = currentQNum === stepNum;
              return (
                <div
                  key={stepNum}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    isDone
                      ? "bg-primary shadow-sm shadow-primary/50"
                      : isCurrent
                      ? "bg-primary/60 animate-pulse ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                      : "bg-white/10"
                  )}
                />
              );
            })}
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden md:inline">
            {answeredCount} / {totalQuestions}
          </span>
        </div>

        {/* SKIP FOR NOW BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip setup
        </Button>
      </header>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden">
        
        {/* LEFT SIDEBAR PANEL - COACH BRANDING & CONTEXT */}
        <aside className="lg:col-span-4 flex flex-col space-y-6">
          <Card className="premium-card p-6 bg-white/[0.03] border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">AI Creator Coach</h2>
                  <p className="text-xs text-muted-foreground">Powered by Gemini & Claude Intelligence</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-white/5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Personalized 7-day content schedule engineered for viral reach.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-white/5">
                  <Compass className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Tailored niche strategies for Gaming, Travel, Food, Cooking & Lifestyle.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-white/5">
                  <Tag className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Targeted hashtag bundles & workspace themes generated automatically.</span>
                </div>
              </div>
            </div>

            {/* CURRENT CATEGORY BADGE */}
            {currentQuestion?.category && (
              <div className="pt-6 border-t border-white/10 mt-6 relative z-10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Selected Niche:</span>
                <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-3 py-1 font-semibold text-xs">
                  {currentQuestion.category}
                </Badge>
              </div>
            )}
          </Card>
        </aside>

        {/* RIGHT MAIN CHAT & PLAN REVEAL PANEL */}
        <section className="lg:col-span-8 flex flex-col h-[calc(100vh-7rem)] max-h-[800px]">
          <Card className="premium-card bg-white/[0.02] border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            
            {/* CHAT MESSAGES SCROLL AREA */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex flex-col max-w-[85%] sm:max-w-[75%]",
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-xs shadow-md shadow-primary/20"
                        : "bg-white/10 text-foreground border border-white/10 rounded-bl-xs backdrop-blur-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </motion.div>
              ))}

              {/* STREAMING TEXT TOKEN BUBBLE */}
              {streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col max-w-[85%] sm:max-w-[75%] mr-auto items-start"
                >
                  <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-white/10 text-foreground border border-white/10 rounded-bl-xs backdrop-blur-sm">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* SUBMITTING / THINKING SPINNER */}
              {submitting && !streamingText && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-white/5 px-3 py-2 rounded-xl w-max border border-white/5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>Creator Coach is preparing options...</span>
                </div>
              )}

              {/* PLAN GENERATION PROGRESS LOADING DISPLAY */}
              {generatingPlan && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-4 my-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-primary animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Synthesizing Your 7-Day Growth Plan</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {progressMessage || "Analyzing content frequency, audience personas, and hashtag strategies..."}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* PLAN REVEAL DISPLAY */}
              {onboardingPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 pt-4 border-t border-white/10 mt-6"
                >
                  <div className="bg-gradient-to-r from-primary/20 via-indigo-500/20 to-violet-500/20 p-5 rounded-2xl border border-primary/30">
                    <div className="flex items-center space-x-2 text-primary font-semibold text-sm mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{onboardingPlan.category} Creation Roadmap</span>
                    </div>
                    <p className="text-sm text-foreground/90">{onboardingPlan.plan.introMessage}</p>
                    
                    {onboardingPlan.plan.workspaceTheme?.motivationalQuote && (
                      <p className="text-xs italic text-muted-foreground mt-2 border-l-2 border-primary/50 pl-3">
                        "{onboardingPlan.plan.workspaceTheme.motivationalQuote}"
                      </p>
                    )}
                  </div>

                  {/* 7-DAY GRID */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      7-Day Content Schedule
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {onboardingPlan.plan.days.map((dayItem, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-primary flex items-center space-x-1.5">
                              <span>{dayItem.icon || "📅"}</span>
                              <span>{dayItem.day}</span>
                            </span>
                            <Badge variant="secondary" className="text-[10px] bg-white/5 font-mono">
                              {dayItem.contentType}
                            </Badge>
                          </div>
                          <p className="text-xs text-foreground/80 font-medium line-clamp-2">
                            {dayItem.theme}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HASHTAGS */}
                  {onboardingPlan.plan.recommendedHashtags?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Recommended Hashtags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {onboardingPlan.plan.recommendedHashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono"
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FINISH CTA */}
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleFinishOnboarding}
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white shadow-lg shadow-primary/25 font-semibold px-8 rounded-xl"
                    >
                      <span>Start Creating Now</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE ALERT */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

            </div>

            {/* CHIPS SELECTION BOTTOM AREA */}
            {!onboardingPlan && !generatingPlan && currentQuestion?.chips && (
              <div className="p-4 sm:p-6 border-t border-white/10 bg-white/[0.02] backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>{isMulti ? "Select one or more options:" : "Select an option:"}</span>
                  {isMulti && selectedMultiChips.length > 0 && (
                    <span className="text-primary font-bold">{selectedMultiChips.length} selected</span>
                  )}
                </div>

                {/* CHIPS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-0.5">
                  {currentQuestion.chips.map((chip, idx) => {
                    const label = currentQuestion.chipLabels?.[idx] || chip;
                    const isSelected = selectedMultiChips.includes(chip);
                    const CategoryIcon = CATEGORY_ICONS[chip];

                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        disabled={submitting}
                        onClick={() => {
                          if (isMulti) {
                            toggleMultiChip(chip);
                          } else {
                            handleAnswer(chip);
                          }
                        }}
                        className={cn(
                          "h-auto py-3 px-3.5 justify-start text-left text-xs font-medium rounded-xl border transition-all whitespace-normal",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                            : "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10 text-foreground"
                        )}
                      >
                        {CategoryIcon && <CategoryIcon className="w-4 h-4 mr-2 shrink-0 text-primary" />}
                        <span className="line-clamp-2">{label}</span>
                        {isMulti && isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </Button>
                    );
                  })}
                </div>

                {/* MULTI-SELECT CONTINUE BUTTON */}
                {isMulti && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      disabled={selectedMultiChips.length === 0 || submitting}
                      onClick={() => handleAnswer(selectedMultiChips)}
                      size="sm"
                      className="bg-primary text-primary-foreground font-semibold px-6 rounded-xl"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

          </Card>
        </section>

      </main>
    </div>
  );
}
