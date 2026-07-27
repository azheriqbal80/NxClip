import { motion, AnimatePresence } from "motion/react";
import { 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Maximize, 
  BrainCircuit,
  ChevronRight,
  Clock,
  Music,
  Type,
  Zap,
  GripVertical,
  VolumeX,
  RotateCcw,
  Loader2,
  Wand2,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronLeft,
  Play,
  Pause,
  Settings,
  Layout,
  Download,
  Instagram,
  AlertTriangle
} from "lucide-react";
import { TiktokIcon } from "../../components/TiktokIcon";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useBlocker, useParams, useNavigate } from "react-router-dom";
import { contentApi } from "../../services/apiClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn, safeStringify } from "../../lib/utils";
import { safeLocalStorage } from "../../lib/safeStorage";
import { triggerHaptic } from "../../lib/vibration";
import { Slider } from "../../components/ui/slider";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { GoogleGenAI } from "@google/genai";
import { SEO } from "../../components/SEO";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const TRACKS = [
  { id: "1", title: "Cyberpunk Pulse", genre: "Synthwave", artist: "Ghost Sector", cover: "https://picsum.photos/seed/cyber/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Lo-Fi Gaming", genre: "Chill", artist: "Cloud 9", cover: "https://picsum.photos/seed/lofi/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", title: "Epic Victory", genre: "Orchestral", artist: "Legion", cover: "https://picsum.photos/seed/epic/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", title: "Trap King", genre: "Hip Hop", artist: "TRVP", cover: "https://picsum.photos/seed/trap/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "5", title: "Neon Nights", genre: "Retrowave", artist: "Chrome", cover: "https://picsum.photos/seed/neon/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "6", title: "Aggressive Phonk", genre: "Phonk", artist: "DRIFT", cover: "https://picsum.photos/seed/phonk/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: "7", title: "Summer Vibes", genre: "Pop", artist: "Solaris", cover: "https://picsum.photos/seed/summer/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: "8", title: "Dark Souls", genre: "Cinematic", artist: "Ethereal", cover: "https://picsum.photos/seed/dark/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: "9", title: "Future Bass", genre: "EDM", artist: "Vortex", cover: "https://picsum.photos/seed/future/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { id: "10", title: "8-Bit Adventure", genre: "Chiptune", artist: "Pixel", cover: "https://picsum.photos/seed/8bit/400/400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
];

export default function ClipEditor() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const step = searchParams.get("step") || "trim";
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(14.2);
  
  // Dirty state tracking for navigation guard
  const [isDirty, setIsDirty] = useState(false);
  const isLoaded = useRef(false);
  const [trimEnd, setTrimEnd] = useState(42.6);
  const [currentTime, setCurrentTime] = useState(23.0);
  const [clipVolume, setClipVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isClipMuted, setIsClipMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishProgress, setPolishProgress] = useState(0);
  const [polishStep, setPolishStep] = useState(0);
  const [isDragging, setIsDragging] = useState<"start" | "end" | "playhead" | null>(null);
  const [finalTrim, setFinalTrim] = useState<{ start: number; end: number } | null>(null);
  
  // Music State
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [title, setTitle] = useState("My Epic Clip");
  const [description, setDescription] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [memeCaptionStyle, setMemeCaptionStyle] = useState("impact");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  
  // Enhancement States
  const [isNoiseReduced, setIsNoiseReduced] = useState(false);
  const [colorCorrection, setColorCorrection] = useState(0);
  const [isAutoColorEnabled, setIsAutoColorEnabled] = useState(false);
  const [transitionSuggestions, setTransitionSuggestions] = useState<{ time: number; type: string; caption?: string; sfx?: string }[]>([]);
  const [isGeneratingTransitions, setIsGeneratingTransitions] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const DURATION = 90; // 1:30

  // Simulated audio waveform data
  const waveformData = useRef(Array.from({ length: 100 }, () => 20 + Math.random() * 60)).current;

  // Simulated AI-detected markers (e.g., kills, clutches, high-action moments)
  const [markers, setMarkers] = useState<{ time: number; label: string }[]>([
    { time: 15.0, label: "action_start" },
    { time: 32.5, label: "kill" },
    { time: 55.0, label: "clutch" },
    { time: 78.2, label: "victory" }
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSuggestingTrim, setIsSuggestingTrim] = useState(false);
  const [suggestedTrim, setSuggestedTrim] = useState<{ start: number; end: number } | null>(null);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [isReviewingTrim, setIsReviewingTrim] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [reviewProgress, setReviewProgress] = useState(0);
  const reviewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePublishContent = async () => {
    if (!id) {
      toast.error("No active clip ID found.");
      return;
    }
    setIsPublishing(true);
    triggerHaptic('medium');
    try {
      toast.loading("Submitting to content moderation and feed...", { id: "publish-clip" });

      await contentApi.publish(id, {
        title,
        description
      });

      // Poll the real backend for the moderation outcome (no fabricated success).
      const terminalStatuses = ["published", "moderation_rejected", "generation_failed", "deleted"];
      let finalStatus = "publishing";
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const item = await contentApi.getMyContentById(id, { suppressErrorLog: true });
          finalStatus = item?.status || finalStatus;
          if (item?.status && terminalStatuses.includes(item.status)) break;
        } catch {
          // Keep polling; transient failures shouldn't abort the wait.
        }
      }

      if (finalStatus === "published") {
        toast.success("Moderation cleared! Published successfully to your profile!", { id: "publish-clip" });
        triggerHaptic('success');
        setIsDirty(false);
        setTimeout(() => {
          navigate("/feed");
        }, 1000);
      } else if (finalStatus === "moderation_rejected") {
        toast.error("Clip was rejected by moderation.", {
          id: "publish-clip",
          description: "Edit the title or description, then publish again.",
        });
        triggerHaptic('error');
      } else {
        // Still publishing after the polling window — honest, not a fake "cleared".
        toast.info("Submitted for moderation.", {
          id: "publish-clip",
          description: "Your clip is still being reviewed and will appear once approved.",
        });
        setIsDirty(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to publish clip", {
        description: err?.message || "An unexpected error occurred during publication.",
        id: "publish-clip"
      });
      triggerHaptic('error');
    } finally {
      setIsPublishing(false);
    }
  };

  const scanHighlights = async () => {
    setIsScanning(true);
    setScanningProgress(0);
    
    // Simulated scanning progress
    const progressInterval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Analyze a gaming clip with the title "${title}". 
        Suggest 4-6 potential highlight timestamps (in seconds, between 0 and ${DURATION}) and labels for each (e.g., "Kill", "Clutch", "High Engagement"). 
        Return the result as a JSON array of objects with "time" (number) and "label" (string) properties.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (text) {
        const detectedMarkers = JSON.parse(text);
        if (Array.isArray(detectedMarkers)) {
          setMarkers(detectedMarkers.map(m => ({
            time: Math.max(0, Math.min(DURATION, Number(m.time))),
            label: String(m.label)
          })));
        }
      }
    } catch (error) {
      console.error("Error scanning highlights:", error);
    } finally {
      clearInterval(progressInterval);
      setScanningProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setScanningProgress(0);
      }, 500);
    }
  };

  const suggestSmartTrim = async () => {
    setIsSuggestingTrim(true);
    setScanningProgress(0);
    
    // Simulated scanning progress
    const progressInterval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Analyze a gaming clip with the title "${title}". 
        Suggest the single best trim range (start and end time in seconds) that captures the most viral or high-action moment.
        The duration of the clip is ${DURATION} seconds.
        Return the result as a JSON object with "start" (number) and "end" (number) properties.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (text) {
        const suggestion = JSON.parse(text);
        if (typeof suggestion.start === 'number' && typeof suggestion.end === 'number') {
          setSuggestedTrim({
            start: Math.max(0, Math.min(DURATION, suggestion.start)),
            end: Math.max(suggestion.start + 1, Math.min(DURATION, suggestion.end))
          });
        }
      }
    } catch (error) {
      console.error("Error suggesting smart trim:", error);
    } finally {
      clearInterval(progressInterval);
      setScanningProgress(100);
      setTimeout(() => {
        setIsSuggestingTrim(false);
        setScanningProgress(0);
      }, 500);
    }
  };

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case "arrowleft":
          e.preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 5));
          break;
        case "arrowright":
          e.preventDefault();
          setCurrentTime(prev => Math.min(DURATION, prev + 5));
          break;
        case "arrowup":
          e.preventDefault();
          setClipVolume(prev => Math.min(1, prev + 0.1));
          setIsClipMuted(false);
          break;
        case "arrowdown":
          e.preventDefault();
          setClipVolume(prev => Math.max(0, prev - 0.1));
          break;
        case "m":
          e.preventDefault();
          setIsClipMuted(prev => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [DURATION]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          // Loop within trim range
          if (next > trimEnd || next < trimStart) return trimStart;
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, trimStart, trimEnd]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      let newTime = Math.max(0, Math.min(DURATION, ((clientX - rect.left) / rect.width) * DURATION));
      
      // Snapping logic
      const nearestMarker = markers.find(m => Math.abs(m.time - newTime) < (DURATION / rect.width) * 15); // 15px snap zone
      if (nearestMarker !== undefined) {
        newTime = nearestMarker.time;
      }

      if (isDragging === "start") {
        if (newTime < trimEnd - 1) setTrimStart(newTime);
      } else if (isDragging === "end") {
        if (newTime > trimStart + 1) setTrimEnd(newTime);
      } else if (isDragging === "playhead") {
        setCurrentTime(newTime);
      }
    };

    const handleMouseUp = () => setIsDragging(null);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, trimStart, trimEnd]);

  const startPolishing = () => {
    if (reviewIntervalRef.current) {
      clearInterval(reviewIntervalRef.current);
      reviewIntervalRef.current = null;
    }
    setIsReviewingTrim(false);
    setIsPolishing(true);
    setPolishStep(0);
    setPolishProgress(0);
    
    let p = 0;
    const interval = setInterval(() => {
      p += 1;
      setPolishProgress(p);
      
      if (p === 33) setPolishStep(1);
      if (p === 66) setPolishStep(2);
      
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPolishing(false);
          setSearchParams({ step: "polish" });
        }, 800);
      }
    }, 40);
  };

  const handleApplyTrim = () => {
    setFinalTrim({ start: trimStart, end: trimEnd });
    setIsReviewingTrim(true);
    setCurrentTime(trimStart);
    setIsPlaying(true);
    setReviewProgress(0);
    
    if (reviewIntervalRef.current) clearInterval(reviewIntervalRef.current);
    
    // Auto-advance after 3 seconds of preview
    let progress = 0;
    reviewIntervalRef.current = setInterval(() => {
      progress += 1;
      setReviewProgress(progress);
      if (progress >= 100) {
        startPolishing();
      }
    }, 30);
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const playPromise = playPromiseRef.current;
      
      if (playPromise) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {
          audio.pause();
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
      
      audioRef.current = null;
      playPromiseRef.current = null;
    }
  }, []);

  const stopPreview = useCallback(() => {
    stopAudio();
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setPreviewingTrackId(null);
    setPreviewProgress(0);
  }, [stopAudio]);

  useEffect(() => {
    if (previewingTrackId) {
      const track = TRACKS.find(t => t.id === previewingTrackId);
      if (track) {
        // Stop any currently playing audio hardware-wise
        // But DON'T call stopPreview() as it resets the state we just set
        stopAudio();
        if (previewTimerRef.current) {
          clearInterval(previewTimerRef.current);
          previewTimerRef.current = null;
        }

        const audio = new Audio(track.url);
        audio.volume = isMusicMuted ? 0 : musicVolume;
        audioRef.current = audio;
        
        const playPromise = audio.play();
        playPromiseRef.current = playPromise;
        
        playPromise.catch(err => {
          if (err.name !== "AbortError") {
            console.error("Playback error:", err);
          }
        });
        
        setPreviewProgress(0);
        const startTime = Date.now();
        
        previewTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const progress = (elapsed / 15) * 100;
          
          if (elapsed >= 15) {
            stopPreview();
          } else {
            setPreviewProgress(progress);
          }
        }, 100);
      }
    } else {
      stopAudio();
    }

    return () => stopAudio();
  }, [previewingTrackId, stopAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMusicMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMusicMuted]);

  const handleTrackClick = (trackId: string) => {
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
      stopPreview();
    } else {
      setSelectedTrackId(trackId);
      setPreviewingTrackId(trackId);
    }
  };

  const generateAITitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Generate a catchy, viral gaming title for a clip. 
        Context/Prompt: ${prompt || "High-action gaming gameplay"}. 
        The clip is currently titled "${title}". 
        Return only the title, no quotes, no extra text. Keep it under 80 characters.`,
      });
      const text = response.text;
      if (text) {
        setTitle(text.trim().slice(0, 80));
      }
    } catch (error) {
      console.error("Error generating title:", error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const generateAICaption = async () => {
    if (!title) return;
    setIsGeneratingCaption(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Generate 3 catchy social media captions for a gaming clip titled "${title}". 
        Context: ${prompt || "Gaming gameplay"}.
        Return only the captions, one per line. Keep them short and use emojis.`,
      });
      const text = response.text;
      if (text) {
        const suggestions = text.split('\n')
          .filter(s => s.trim().length > 0)
          .map(s => s.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3);
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error generating caption:", error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    // Load from local storage on mount
    const savedData = safeLocalStorage.getItem('nexaclip_editor_autosave');
    if (savedData) {
      try {
        const { 
          trimStart: s, 
          trimEnd: e, 
          selectedTrackId: t,
          topText: tt,
          bottomText: bt,
          memeCaptionStyle: mcs
        } = JSON.parse(savedData);
        if (typeof s === 'number') setTrimStart(s);
        if (typeof e === 'number') setTrimEnd(e);
        if (t) setSelectedTrackId(t);
        if (tt) setTopText(tt);
        if (bt) setBottomText(bt);
        if (mcs) setMemeCaptionStyle(mcs);
      } catch (err) {
        console.error("Error loading autosave data:", err);
      }
    }
    const timer = setTimeout(() => {
      isLoaded.current = true;
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const saveToLocalStorage = useCallback(() => {
    const data = {
      trimStart,
      trimEnd,
      selectedTrackId,
      topText,
      bottomText,
      memeCaptionStyle,
      updatedAt: new Date().toISOString()
    };
    safeLocalStorage.setItem('nexaclip_editor_autosave', safeStringify(data));
  }, [trimStart, trimEnd, selectedTrackId, topText, bottomText, memeCaptionStyle]);

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, 30000);
    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  // Autosave when significant changes occur
  useEffect(() => {
    saveToLocalStorage();
  }, [trimStart, trimEnd, selectedTrackId, saveToLocalStorage]);

  // Track if any changes have been made (making the editor "dirty")
  useEffect(() => {
    if (isLoaded.current) {
      setIsDirty(true);
    }
  }, [trimStart, trimEnd, selectedTrackId, topText, bottomText, memeCaptionStyle, title, description, colorCorrection, isNoiseReduced]);

  // beforeunload event handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // React Router Navigation Block/Guard
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        return isDirty && currentLocation.pathname !== nextLocation.pathname;
      },
      [isDirty]
    )
  );

  const generateTransitionSuggestions = async () => {
    setIsGeneratingTransitions(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Analyze a gaming clip titled "${title}". 
        Suggest 3 optimal transition points (in seconds, between ${trimStart} and ${trimEnd}).
        For each point, suggest:
        1. The type of transition (e.g., "Zoom Blur", "Glitch", "Crossfade").
        2. A relevant AI-generated caption for that moment (max 3 words).
        3. A relevant sound effect (SFX) that would match the action (e.g., "Deep Impact", "Cyber Whoosh", "Kill Confirmed").
        Return the result as a JSON array of objects with "time" (number), "type" (string), "caption" (string), and "sfx" (string) properties.`,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (text) {
        const suggestions = JSON.parse(text);
        if (Array.isArray(suggestions)) {
          setTransitionSuggestions(suggestions.map(s => ({
            time: Math.max(trimStart, Math.min(trimEnd, Number(s.time))),
            type: String(s.type),
            caption: s.caption ? String(s.caption) : undefined,
            sfx: s.sfx ? String(s.sfx) : undefined
          })));
        }
      }
    } catch (error) {
      console.error("Error generating transitions:", error);
    } finally {
      setIsGeneratingTransitions(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomAmount = delta > 0 ? -0.2 : 0.2;
      const newZoom = Math.min(5, Math.max(1, zoomLevel + zoomAmount));
      
      if (newZoom !== zoomLevel && scrollContainerRef.current) {
        setZoomLevel(newZoom);
      }
    }
  };

  // Centering logic for zoom
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const playheadX = (currentTime / DURATION) * scrollWidth;
      
      container.scrollTo({
        left: playheadX - container.clientWidth / 2,
        behavior: zoomLevel > 1 ? "auto" : "smooth"
      });
    }
  }, [zoomLevel]);

  const polishSteps = [
    { label: "clip_editor.overlays.steps.transcribing", subtext: "clip_editor.overlays.steps.transcribing_sub" },
    { label: "clip_editor.overlays.steps.generating_captions", subtext: "clip_editor.overlays.steps.generating_captions_sub" },
    { label: "clip_editor.overlays.steps.suggesting_effects", subtext: "clip_editor.overlays.steps.suggesting_effects_sub" }
  ];

  useEffect(() => {
    if (isPlaying && scrollContainerRef.current && zoomLevel > 1) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const playheadX = (currentTime / DURATION) * scrollWidth;
      
      const scrollLeft = container.scrollLeft;
      const viewWidth = container.clientWidth;
      
      if (playheadX < scrollLeft + viewWidth * 0.2 || playheadX > scrollLeft + viewWidth * 0.8) {
        container.scrollTo({
          left: playheadX - viewWidth / 2,
          behavior: "smooth"
        });
      }
    }
  }, [currentTime, isPlaying, zoomLevel, DURATION]);

  return (
    <div className="space-y-8">
      <SEO 
        title="Advanced AI Video Clip Editor | NexaClip.ai"
        description="Trim, polish, and enhance your gaming clips with AI. Add captions, transitions, and viral effects in seconds."
      />
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-12 mb-8 md:mb-12 overflow-x-auto py-2 no-scrollbar">
          {[
            { id: "upload", label: t('clip_editor.steps.upload'), icon: CheckCircle2, active: true, done: true },
            { id: "trim", label: t('clip_editor.steps.trim'), icon: Scissors, active: step === "trim", done: step !== "trim" },
            { id: "polish", label: t('clip_editor.steps.polish'), icon: Sparkles, active: step === "polish", done: false },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                s.active ? "bg-primary border-primary text-primary-foreground shadow-lg" : 
                s.done ? "bg-muted border-border text-primary" : "bg-background border-border text-muted-foreground"
              }`}>
                <s.icon size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <span className={`text-[10px] md:text-sm font-bold whitespace-nowrap ${s.active ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < 2 && <div className="w-4 sm:w-8 md:w-12 h-0.5 bg-border ml-2 sm:ml-4 md:ml-6" />}
            </div>
          ))}
        </div>

        {step === "trim" && (
          <div className="space-y-8">
            {/* Video Player Area */}
            <div className="aspect-video bg-background rounded-xl overflow-hidden relative group shadow-soft-xl border border-border">
              <img 
                src="https://picsum.photos/seed/editor/1280/720" 
                className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
              
              {/* Auto-play indicator */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-popover/80 backdrop-blur-xl rounded-full border border-border">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[9px] md:text-[10px] font-bold text-foreground">{t('clip_editor.player.live_preview')}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={false}
                  animate={{ scale: isPlaying ? 0.9 : 1, opacity: isPlaying ? 0 : 1 }}
                  className="pointer-events-none"
                >
                  <Button 
                    size="icon-2xl"
                    variant="secondary"
                    className="md:size-20 bg-popover/80 backdrop-blur-xl rounded-full text-foreground border border-border shadow-soft-xl"
                  >
                    <Play size={28} fill="currentColor" className="ml-1" />
                  </Button>
                </motion.div>
              </div>
              
              {/* Tap to Play overlay for mobile */}
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
              />
              
              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="space-y-4 pointer-events-auto">
                  {/* Miniature Progress Bar */}
                  <div className="h-1 w-full bg-foreground/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      style={{ width: `${(currentTime / DURATION) * 100}%` }}
                      layoutId="playerProgress"
                    />
                  </div>

                  <div className="flex items-center justify-between text-foreground flex-wrap gap-3">
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                      {/* Play/Pause */}
                      <Button 
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="md:size-9 hover:bg-muted rounded-full text-foreground"
                        aria-label={isPlaying ? t('clip_editor.player.pause') : t('clip_editor.player.play')}
                      >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                      </Button>

                      {/* Volume Control */}
                      <div className="flex items-center gap-2 md:gap-3">
                        <Button 
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setIsClipMuted(!isClipMuted)}
                          className="md:size-9 hover:bg-muted rounded-full text-foreground"
                          aria-label={isClipMuted ? t('clip_editor.player.unmute') : t('clip_editor.player.mute')}
                          aria-pressed={isClipMuted}
                        >
                          {isClipMuted || clipVolume === 0 ? <VolumeX size={18} className="text-destructive" /> : <Volume2 size={18} />}
                        </Button>
                        <div className="hidden sm:flex w-24 items-center">
                          <Slider 
                            min={0}
                            max={1}
                            step={0.01}
                            value={[isClipMuted ? 0 : clipVolume]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setClipVolume(val);
                              if (isClipMuted) setIsClipMuted(false);
                            }}
                            className="w-full"
                            aria-label={t('clip_editor.player.adjust_volume')}
                          />
                        </div>
                      </div>

                      {/* Time Display */}
                      <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-muted/50 backdrop-blur-md rounded-lg border border-border" aria-label={t('clip_editor.player.playback_time')}>
                        <span className="text-[10px] md:text-xs font-bold font-mono tracking-tighter" aria-current="time">
                          {formatTime(currentTime)}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-bold text-foreground/40" aria-hidden="true">/</span>
                        <span className="text-[10px] md:text-xs font-bold font-mono tracking-tighter text-foreground/60">
                          {formatTime(DURATION)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTrimStart(0);
                          setTrimEnd(DURATION);
                          setCurrentTime(0);
                        }}
                        className="flex items-center gap-1.5 hover:bg-muted rounded-lg text-[9px] md:text-[10px] font-bold tracking-wider text-foreground"
                        aria-label={t('clip_editor.player.reset_trim')}
                      >
                        <RotateCcw size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="hidden xs:inline">{t('clip_editor.player.reset_trim')}</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="md:size-9 hover:bg-muted rounded-full text-foreground" aria-label={t('clip_editor.player.fullscreen')}>
                        <Maximize size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Area */}
            <div className="ui-card p-4 md:p-8 space-y-6 relative overflow-hidden">
              <AnimatePresence>
                {(isScanning || isSuggestingTrim) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6"
                  >
                    <div className="w-full max-w-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                          <Wand2 size={18} className="animate-pulse" />
                          <span className="text-xs md:text-sm font-bold">{isSuggestingTrim ? t('clip_editor.trim.calculating') : t('clip_editor.trim.scanning')}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground">{scanningProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${scanningProgress}%` }}
                          className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                        />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground font-medium tracking-wider leading-relaxed">
                        {isSuggestingTrim ? t('clip_editor.trim.action_moments') : t('clip_editor.trim.analyzing_cues')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold">{t('clip_editor.trim.timeline_trimmer')}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="default"
                          onClick={scanHighlights}
                          disabled={isScanning || isSuggestingTrim}
                          className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-all text-[10px] font-bold disabled:opacity-50"
                        >
                          <Search size={12} />
                          {t('clip_editor.trim.ai_scan')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('clip_editor.trim.ai_scan_tooltip')}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="default"
                          onClick={suggestSmartTrim}
                          disabled={isScanning || isSuggestingTrim}
                          className="gap-2 bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 hover:bg-brand-secondary/20 transition-all text-[10px] font-bold disabled:opacity-50"
                        >
                          <Scissors size={12} />
                          {t('clip_editor.trim.ai_smart_trim')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('clip_editor.trim.ai_smart_trim_tooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Precision Trim Slider */}
                  <div className="flex-1 min-w-[200px] flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-muted-foreground">{t('clip_editor.trim.precision_trim')}</span>
                        <Badge variant="outline" className="text-[8px] h-4 py-0 font-mono">
                          {formatTime(trimEnd - trimStart)}
                        </Badge>
                      </div>
                      <Slider 
                        min={0}
                        max={DURATION}
                        step={0.1}
                        value={[trimStart, trimEnd]}
                        onValueChange={(val) => {
                          if (Array.isArray(val) && val.length === 2) {
                            if (val[1] - val[0] >= 1) { // Min 1s duration
                              setTrimStart(val[0]);
                              setTrimEnd(val[1]);
                              // Sync playhead if out of bounds
                              if (currentTime < val[0]) setCurrentTime(val[0]);
                              if (currentTime > val[1]) setCurrentTime(val[1]);
                            }
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border border-border self-start md:self-auto">
                  <Button 
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
                    className="md:size-8 text-muted-foreground hover:text-primary transition-all"
                  >
                    <ZoomOut size={12} />
                  </Button>
                  <div className="w-16 md:w-24 px-1 md:px-2">
                    <Slider 
                      value={[zoomLevel]} 
                      min={1} 
                      max={5} 
                      step={0.1} 
                      onValueChange={(v) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        setZoomLevel(val);
                      }} 
                    />
                  </div>
                  <Button 
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
                    className="md:size-8 text-muted-foreground hover:text-primary transition-all"
                  >
                    <ZoomIn size={12} />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <span className="text-[9px] md:text-[10px] font-mono font-bold text-muted-foreground w-6 md:w-8 text-center text-primary">
                    {zoomLevel.toFixed(1)}x
                  </span>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground hidden md:block">
                  {DURATION.toFixed(1)}s {t('clip_editor.player.total')}
                </div>
              </div>

              <div className="relative">
                {/* Time Markers */}
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-2 px-1">
                  {[0, 0.25, 0.5, 0.75, 1].map(p => (
                    <span key={p}>{formatTime(DURATION * p)}</span>
                  ))}
                </div>

                <div 
                  ref={scrollContainerRef}
                  onWheel={handleWheel}
                  className="relative overflow-x-auto rounded-lg border border-border no-scrollbar touch-pan-x"
                >
                  <div 
                    ref={timelineRef}
                    style={{ width: `${zoomLevel * 100}%` }}
                    className="relative h-24 bg-muted group/timeline cursor-pointer min-w-full transition-[width] duration-300 ease-out"
                    onClick={(e) => {
                      if (isDragging) return;
                      const rect = timelineRef.current?.getBoundingClientRect();
                      if (rect) {
                        const newTime = ((e.clientX - rect.left) / rect.width) * DURATION;
                        setCurrentTime(Math.max(0, Math.min(DURATION, newTime)));
                      }
                    }}
                  >
                    {/* Waveform Visualization */}
                    <div className="absolute inset-0 flex items-center justify-between gap-[2px] px-4 pointer-events-none">
                      {waveformData.map((height, i) => {
                        const time = (i / waveformData.length) * DURATION;
                        const isWithinTrim = time >= trimStart && time <= trimEnd;
                        const isPlayed = currentTime > time;
                        
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "w-1 rounded-full transition-all duration-500",
                              isWithinTrim 
                                ? (isPlayed ? "bg-primary/60" : "bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]") 
                                : "bg-muted-foreground/20"
                            )}
                            style={{ 
                              height: `${height}%`,
                              opacity: isWithinTrim ? 1 : 0.4
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* AI Markers */}
                    {markers.map((marker, i) => (
                      <div 
                        key={i}
                        className="absolute inset-y-0 w-px bg-primary/30 z-10 group/marker"
                        style={{ left: `${(marker.time / DURATION) * 100}%` }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Zap size={8} className="text-primary fill-primary" />
                        </div>
                        
                        {/* Marker Label Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                          <div className="bg-popover text-popover-foreground text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-soft-lg border border-border">
                            {t(`clip_editor.trim.markers.${marker.label}`, { defaultValue: marker.label })}
                          </div>
                          <div className="w-1.5 h-1.5 bg-popover rotate-45 absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
                        </div>
                      </div>
                    ))}

                    {/* AI Suggested Trim Range */}
                    {suggestedTrim && (
                      <motion.div 
                        initial={{ opacity: 0, scaleY: 0.8 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        className="absolute inset-y-0 bg-brand-secondary/5 border-2 border-brand-secondary/30 border-dashed z-20"
                        style={{ 
                          left: `${(suggestedTrim.start / DURATION) * 100}%`, 
                          right: `${100 - (suggestedTrim.end / DURATION) * 100}%` 
                        }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className="bg-brand-secondary text-brand-secondary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-t">
                            {t('clip_editor.trim.ai_suggestion')}
                          </div>
                          <div className="bg-brand-secondary/20 backdrop-blur-sm border border-brand-secondary/30 px-2 py-0.5 rounded-b flex items-center gap-1">
                            <Sparkles size={8} className="text-brand-secondary" />
                            <span className="text-[9px] font-bold text-brand-secondary">
                              {formatTime(suggestedTrim.end - suggestedTrim.start)}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrimStart(suggestedTrim.start);
                            setTrimEnd(suggestedTrim.end);
                            setSuggestedTrim(null);
                          }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-secondary hover:bg-brand-secondary-strong text-brand-secondary-foreground text-[9px] font-bold shadow-lg"
                        >
                          {t('clip_editor.trim.apply_ai_trim')}
                        </Button>
                      </motion.div>
                    )}

                    {/* Trim Range Overlay */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                      className="absolute inset-y-0 bg-primary/10 border-x-2 border-primary/50"
                      style={{ 
                        left: `${(trimStart / DURATION) * 100}%`, 
                        right: `${100 - (trimEnd / DURATION) * 100}%` 
                      }}
                    >
                      {/* Floating Duration Label */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-border flex items-center gap-1.5 pointer-events-none">
                        <Clock size={10} className="text-primary" />
                        <span className="text-[9px] font-bold text-foreground">
                          {formatTime(trimEnd - trimStart)}
                        </span>
                      </div>
                    </motion.div>

                    {/* Start Handle */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                      className="absolute inset-y-0 z-30 flex items-center"
                      style={{ left: `${(trimStart / DURATION) * 100}%` }}
                    >
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging("start"); }}
                        onTouchStart={(e) => { e.stopPropagation(); setIsDragging("start"); }}
                        className={cn(
                          "w-10 h-16 md:w-6 md:h-14 bg-primary rounded-md -translate-x-1/2 cursor-ew-resize flex flex-col items-center justify-center shadow-xl transition-all touch-none border-2 border-primary-foreground/20",
                          isDragging === "start" ? "scale-110 ring-4 ring-primary/20 brightness-110" : "hover:scale-105"
                        )}
                      >
                        <div className="w-1 h-4 bg-primary-foreground/40 rounded-full mb-1" />
                        <GripVertical size={10} className="text-primary-foreground/80" />
                        <div className="w-1 h-4 bg-primary-foreground/40 rounded-full mt-1" />
                      </div>
                      
                      <AnimatePresence>
                        {isDragging === "start" && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full mb-4 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1.5 rounded-md shadow-[0_10px_30px_rgba(var(--primary),0.4)] border border-primary-strong whitespace-nowrap z-50 flex items-center gap-1.5"
                          >
                            <Clock size={10} />
                            {formatTime(trimStart)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="absolute top-full mt-2 -translate-x-1/2 bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary/30 backdrop-blur-sm">
                        {formatTime(trimStart)}
                      </div>
                    </motion.div>

                    {/* End Handle */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                      className="absolute inset-y-0 z-30 flex items-center"
                      style={{ left: `${(trimEnd / DURATION) * 100}%` }}
                    >
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging("end"); }}
                        onTouchStart={(e) => { e.stopPropagation(); setIsDragging("end"); }}
                        className={cn(
                          "w-10 h-16 md:w-6 md:h-14 bg-primary rounded-md -translate-x-1/2 cursor-ew-resize flex flex-col items-center justify-center shadow-xl transition-all touch-none border-2 border-primary-foreground/20",
                          isDragging === "end" ? "scale-110 ring-4 ring-primary/20 brightness-110" : "hover:scale-105"
                        )}
                      >
                        <div className="w-1 h-4 bg-primary-foreground/40 rounded-full mb-1" />
                        <GripVertical size={10} className="text-primary-foreground/80" />
                        <div className="w-1 h-4 bg-primary-foreground/40 rounded-full mt-1" />
                      </div>

                      <AnimatePresence>
                        {isDragging === "end" && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full mb-4 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1.5 rounded-md shadow-[0_10px_30px_rgba(var(--primary),0.4)] border border-primary-strong whitespace-nowrap z-50 flex items-center gap-1.5"
                          >
                            <Clock size={10} />
                            {formatTime(trimEnd)}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="absolute top-full mt-2 -translate-x-1/2 bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary/30 backdrop-blur-sm">
                        {formatTime(trimEnd)}
                      </div>
                    </motion.div>

                    {/* Playhead */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                      className="absolute inset-y-0 z-40 w-0.5 bg-primary-foreground shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)] pointer-events-none"
                      style={{ left: `${(currentTime / DURATION) * 100}%` }}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-foreground rounded-full shadow-lg" />
                      {/* Draggable playhead handle */}
                    <div 
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging("playhead"); }}
                        onTouchStart={(e) => { e.stopPropagation(); setIsDragging("playhead"); }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-6 md:h-6 bg-foreground/20 hover:bg-foreground/40 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center transition-colors touch-none"
                      >
                        <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full shadow-lg" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 md:pt-4">
                <div className="flex items-center justify-around md:justify-start gap-6 md:gap-8 bg-muted/20 p-4 rounded-xl md:bg-transparent md:p-0">
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground">{t('common.start') || 'Start'}</p>
                    <p className="text-lg md:text-xl font-display font-bold text-foreground">{formatTime(trimStart)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground">{t('common.end') || 'End'}</p>
                    <p className="text-lg md:text-xl font-display font-bold text-foreground">{formatTime(trimEnd)}</p>
                  </div>
                  <div className="px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] md:text-xs font-bold">
                    {formatTime(trimEnd - trimStart)}
                  </div>
                </div>
                <Button 
                  onClick={handleApplyTrim}
                  size="hero"
                  className="rounded-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 font-bold w-full md:w-auto"
                >
                  {t('clip_editor.trim.apply_continue')}
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "polish" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams({ step: "trim" })}
                className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="text-[11px] font-bold">{t('clip_editor.polish.editor')}</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-black px-3 py-1">
                  {t('clip_editor.polish.polishing')}
                </Badge>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 pb-32 md:pb-0">
              {/* Preview Column */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="aspect-[9/16] w-full max-w-[320px] sm:max-w-[340px] md:max-w-[420px] mx-auto bg-background rounded-xl overflow-hidden relative shadow-soft-2xl border border-border group">
                <img 
                  src="https://picsum.photos/seed/polished/1080/1920" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                
                {/* Auto-play progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-foreground/10 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                  />
                </div>

                {/* Preview Badge */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 pointer-events-none">
                  <div className="px-4 py-2 bg-popover/80 backdrop-blur-xl rounded-md border border-border shadow-soft-xl flex items-center gap-2">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-foreground">{t('clip_editor.polish.ai_enhanced_preview')}</span>
                  </div>
                </div>
                
                {/* Simulated Captions */}
                <div className="absolute bottom-32 left-0 right-0 px-8 text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-yellow-400 text-black font-black text-2xl py-2 px-4 inline-block transform -rotate-2 shadow-xl"
                  >
                    {t('clip_editor.polish.insane_clutch')}
                  </motion.div>
                </div>

                {/* UI Overlays */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-md" />
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-full bg-foreground/20 backdrop-blur-md" />
                      <div className="w-8 h-8 rounded-full bg-foreground/20 backdrop-blur-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Column */}
            <div className="space-y-6">
              <div className="ui-card p-0 overflow-hidden lg:border-border">
                <Tabs defaultValue="audio" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 bg-muted border-none rounded-none p-1 shrink-0 h-14">
                    <TabsTrigger value="details" className="text-[10px] md:text-[11px] font-bold py-0 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <div className="flex flex-col items-center gap-1">
                        <Settings size={14} className="md:hidden" />
                        {t('clip_editor.polish.tabs.details')}
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="meme" className="text-[10px] md:text-[11px] font-bold py-0 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <div className="flex flex-col items-center gap-1">
                        <Type size={14} className="md:hidden" />
                        {t('clip_editor.polish.tabs.meme')}
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="text-[10px] md:text-[11px] font-bold py-0 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <div className="flex flex-col items-center gap-1">
                        <Music size={14} className="md:hidden" />
                        {t('clip_editor.polish.tabs.audio')}
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="enhance" className="text-[10px] md:text-[11px] font-bold py-0 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles size={14} className="md:hidden" />
                        {t('clip_editor.polish.tabs.enhance')}
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4 sm:p-6">
                    <TabsContent value="details" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-base md:text-lg font-display font-bold text-foreground flex items-center gap-2">
                          <Settings size={18} className="text-primary" />
                          {t('clip_editor.polish.details.title')}
                        </h3>
                        {finalTrim && (
                          <div className="ui-badge bg-primary/5 text-primary border-primary/20 text-[10px] md:text-xs">
                            {formatTime(finalTrim.end - finalTrim.start)}
                          </div>
                        )}
                      </div>

                      {/* Trim Summary */}
                      <div className="p-3 md:p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="ui-icon-chip-primary w-8 h-8 md:w-10 md:h-10">
                            <Scissors size={14} className="md:size-18" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground leading-none mb-1">{t('clip_editor.polish.details.duration')}</p>
                            <p className="text-xs md:text-sm font-bold font-mono">{formatTime(finalTrim?.start || 0)} - {formatTime(finalTrim?.end || DURATION)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSearchParams({ step: "trim" })}
                          className="ui-link-primary text-[10px] font-black"
                        >
                          {t('clip_editor.polish.details.change')}
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-4">
                        {/* Creation Prompt (Optional Context for AI) */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.details.context_label')}</label>
                            <span className={cn(
                              "text-[9px] font-mono transition-colors",
                              prompt.length >= 180 ? "text-amber-500" : "text-muted-foreground"
                            )}>
                              {prompt.length}/200
                            </span>
                          </div>
                          <Input 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
                            placeholder={t('clip_editor.polish.details.context_placeholder')}
                            className="h-10 bg-muted/20 border-border rounded-md text-xs font-medium"
                          />
                          <p className="text-[9px] text-muted-foreground">{t('clip_editor.polish.details.context_help')}</p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.details.clip_title')}</label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={generateAITitle}
                                    disabled={isGeneratingTitle}
                                    className="h-auto p-0 flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {isGeneratingTitle ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Sparkles size={12} />
                                    )}
                                    {t('clip_editor.polish.details.ai_suggest')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {t('clip_editor.polish.details.title_tooltip')}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className={cn(
                              "text-[10px] font-mono",
                              title.length > 70 ? "text-orange-500" : "text-muted-foreground"
                            )}>
                              {title.length}/80
                            </span>
                          </div>
                          <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                            placeholder={t('clip_editor.polish.details.title_placeholder')}
                            className="h-12 bg-muted/30 border-border rounded-md text-sm font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.details.caption')}</label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={generateAICaption}
                                  disabled={isGeneratingCaption || !title}
                                  className="h-auto p-0 flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isGeneratingCaption ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Sparkles size={12} />
                                  )}
                                  {t('clip_editor.polish.details.ai_generate')}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {t('clip_editor.polish.details.caption_tooltip')}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('clip_editor.polish.details.caption_placeholder')}
                            rows={4}
                            className="bg-muted/30 border-border rounded-md text-sm font-medium resize-none"
                          />
                          
                          <AnimatePresence>
                            {aiSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                              >
                                <p className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.details.ai_suggestions_label')}</p>
                                <div className="grid gap-2">
                                  {aiSuggestions.map((suggestion, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      onClick={() => {
                                        setDescription(suggestion);
                                        setAiSuggestions([]);
                                      }}
                                      className="justify-start h-auto p-3 bg-primary/5 border-primary/10 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-all text-left whitespace-normal"
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="meme" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base md:text-lg font-display font-bold text-foreground flex items-center gap-2">
                          <Type size={18} className="text-primary" />
                          {t('clip_editor.polish.meme.title')}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-black px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                          {t('clip_editor.polish.meme.beta')}
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <label className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.meme.top_text')}</label>
                              <span className={cn(
                                "text-[9px] font-mono transition-colors",
                                topText.length >= 45 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {topText.length}/50
                              </span>
                            </div>
                            <Input 
                              placeholder={t('clip_editor.polish.meme.top_placeholder')} 
                              value={topText}
                              onChange={(e) => setTopText(e.target.value.slice(0, 50))}
                              className="h-10 text-xs bg-muted/30 border-border/50 rounded-lg focus:border-primary/50"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <label className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.meme.bottom_text')}</label>
                              <span className={cn(
                                "text-[9px] font-mono transition-colors",
                                bottomText.length >= 45 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {bottomText.length}/50
                              </span>
                            </div>
                            <Input 
                              placeholder={t('clip_editor.polish.meme.bottom_placeholder')} 
                              value={bottomText}
                              onChange={(e) => setBottomText(e.target.value.slice(0, 50))}
                              className="h-10 text-xs bg-muted/30 border-border/50 rounded-lg focus:border-primary/50"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1">{t('clip_editor.polish.meme.caption_style')}</label>
                            <Select value={memeCaptionStyle} onValueChange={setMemeCaptionStyle}>
                              <SelectTrigger className="h-10 text-xs bg-muted/30 border-border/50 rounded-lg">
                                <SelectValue placeholder={t('clip_editor.polish.meme.caption_style')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="impact">{t('clip_editor.polish.meme.styles.impact')}</SelectItem>
                                <SelectItem value="modern">{t('clip_editor.polish.meme.styles.modern')}</SelectItem>
                                <SelectItem value="classic">{t('clip_editor.polish.meme.styles.classic')}</SelectItem>
                                <SelectItem value="neon">{t('clip_editor.polish.meme.styles.neon')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-primary" />
                            <p className="text-[10px] font-bold text-foreground">{t('clip_editor.polish.meme.pro_tip')}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {t('clip_editor.polish.meme.tip_content')}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="audio" className="mt-0 space-y-6 md:space-y-8">
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <h3 className="text-base md:text-lg font-display font-bold text-foreground flex items-center gap-2">
                          <Volume2 size={18} className="text-primary" />
                          {t('clip_editor.polish.audio.title')}
                        </h3>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ 
                                height: isPlaying ? [4, 12, 6, 16, 4] : 4,
                                opacity: isPlaying ? [0.4, 1, 0.6, 1, 0.4] : 0.2
                              }}
                              transition={{ 
                                duration: 0.8, 
                                repeat: Infinity, 
                                delay: i * 0.05,
                                ease: "easeInOut"
                              }}
                              className="w-1 bg-primary rounded-full"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Master Volume */}
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                              <Zap size={18} fill="currentColor" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-primary/60">{t('clip_editor.polish.audio.master_mix')}</p>
                              <p className="text-[13px] font-bold">{t('clip_editor.polish.audio.final_output')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-primary">{Math.round((isMasterMuted ? 0 : masterVolume) * 100)}%</span>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsMasterMuted(!isMasterMuted)}
                              className="h-9 w-9 hover:bg-primary/10 rounded-lg"
                            >
                              {isMasterMuted || masterVolume === 0 ? <VolumeX size={16} className="text-destructive" /> : <Volume2 size={16} />}
                            </Button>
                          </div>
                        </div>
                        <div className="px-1 py-1">
                          <Slider 
                            min={0}
                            max={1.5}
                            step={0.01}
                            value={[isMasterMuted ? 0 : masterVolume]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setMasterVolume(val);
                              if (isMasterMuted) setIsMasterMuted(false);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Clip Volume */}
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Scissors size={14} />
                              </div>
                              <span className="text-xs font-bold text-foreground">{t('clip_editor.polish.audio.original_clip')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground">{Math.round((isClipMuted ? 0 : clipVolume) * 100)}%</span>
                              <Button 
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setIsClipMuted(!isClipMuted)}
                                className="hover:bg-muted rounded-md"
                              >
                                {isClipMuted || clipVolume === 0 ? <VolumeX size={14} className="text-destructive" /> : <Volume2 size={14} />}
                              </Button>
                            </div>
                          </div>
                          <Slider 
                            min={0}
                            max={1}
                            step={0.01}
                            value={[isClipMuted ? 0 : clipVolume]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setClipVolume(val);
                              if (isClipMuted) setIsClipMuted(false);
                            }}
                            className="w-full"
                          />
                        </div>

                        {/* Music Volume */}
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Music size={14} />
                              </div>
                              <span className="text-xs font-bold text-foreground">{t('clip_editor.polish.audio.background_music')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground">{Math.round((isMusicMuted ? 0 : musicVolume) * 100)}%</span>
                              <Button 
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setIsMusicMuted(!isMusicMuted)}
                                className="hover:bg-muted rounded-md"
                                disabled={!selectedTrackId}
                              >
                                {isMusicMuted || musicVolume === 0 ? <VolumeX size={14} className="text-destructive" /> : <Volume2 size={14} />}
                              </Button>
                            </div>
                          </div>
                          <Slider 
                            min={0}
                            max={1}
                            step={0.01}
                            value={[isMusicMuted ? 0 : musicVolume]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setMusicVolume(val);
                              if (isMusicMuted) setIsMusicMuted(false);
                            }}
                            className="w-full"
                            disabled={!selectedTrackId}
                          />
                        </div>
                      </div>

                      {/* Music Selection Carousel */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold text-muted-foreground leading-none">{t('clip_editor.polish.audio.sound_library')}</span>
                          <span className="text-[10px] font-bold text-primary leading-none">{t('clip_editor.polish.audio.previews')}</span>
                        </div>
                        
                        <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
                          <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                            <div className="flex gap-3 pb-4">
                              {TRACKS.map((track) => {
                                const isSelected = selectedTrackId === track.id;
                                const isPreviewing = previewingTrackId === track.id;
                                
                                return (
                                  <motion.div
                                    key={track.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex-shrink-0"
                                  >
                                    <Button
                                      variant={isSelected ? "default" : "outline"}
                                      onClick={() => handleTrackClick(track.id)}
                                      className={cn(
                                        "w-36 md:w-40 h-auto p-4 rounded-xl border transition-all text-left relative overflow-hidden flex flex-col items-start gap-4 active:scale-95",
                                        isSelected 
                                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                          : "bg-muted/30 border-border text-foreground hover:border-primary/50"
                                      )}
                                    >
                                      {isPreviewing && (
                                        <motion.div 
                                          className="absolute bottom-0 left-0 h-1 bg-foreground/40 z-10"
                                          style={{ width: `${previewProgress}%` }}
                                        />
                                      )}
                                      
                                      <div className="flex items-center justify-between w-full">
                                        <div className={cn(
                                          "w-7 h-7 rounded-lg flex items-center justify-center",
                                          isSelected ? "bg-primary-foreground/20" : "bg-muted"
                                        )}>
                                          {isPreviewing ? (
                                            <Volume2 size={14} className={isSelected ? "text-primary-foreground" : "text-primary"} />
                                          ) : (
                                            <Music size={14} className={isSelected ? "text-primary-foreground" : "text-primary"} />
                                          )}
                                        </div>
                                        <Badge variant="secondary" className={cn(
                                          "text-[8px] px-1.5 py-0 h-4 border-none",
                                          isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                          {track.genre}
                                        </Badge>
                                      </div>
                                      
                                      <div className="w-full min-w-0">
                                        <p className="text-[11px] font-bold truncate leading-tight">{track.title}</p>
                                        <p className="text-[9px] opacity-70 truncate tracking-tight">{track.artist}</p>
                                      </div>
                                    </Button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="enhance" className="mt-0 space-y-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                          <Sparkles size={18} className="text-primary" />
                          {t('clip_editor.polish.tabs.enhance')}
                        </h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                          Beta
                        </Badge>
                      </div>
                      
                      {/* Audio Enhancement Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 size={16} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.enhance.audio_polish')}</span>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => setIsNoiseReduced(!isNoiseReduced)}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer group",
                            isNoiseReduced 
                              ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5" 
                              : "bg-muted/30 border-border hover:border-primary/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    isNoiseReduced ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                  )}>
                                    <VolumeX size={18} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[200px]">
                                  {t('clip_editor.polish.enhance.noise_reduction_tooltip')}
                                </TooltipContent>
                              </Tooltip>
                              <div>
                                <p className="text-sm font-bold">{t('clip_editor.polish.enhance.noise_reduction')}</p>
                                <p className="text-[10px] text-muted-foreground tracking-wider">{t('clip_editor.polish.enhance.voice_isolation')}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-10 h-6 rounded-full relative transition-colors",
                              isNoiseReduced ? "bg-primary" : "bg-muted"
                            )}>
                              <motion.div 
                                animate={{ x: isNoiseReduced ? 18 : 2 }}
                                className="absolute top-1 left-0 w-4 h-4 bg-primary-foreground rounded-full shadow-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t('clip_editor.polish.enhance.noise_reduction_desc')}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-border/50" />

                      {/* Visual Enhancement Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wand2 size={16} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.enhance.visual_polish')}</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={() => {
                                  setIsAutoColorEnabled(!isAutoColorEnabled);
                                  if (!isAutoColorEnabled) setColorCorrection(75);
                                }}
                                className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded transition-colors",
                                  isAutoColorEnabled ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                {isAutoColorEnabled ? t('clip_editor.polish.enhance.auto_applied') : t('clip_editor.polish.enhance.auto_correct')}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {t('clip_editor.polish.enhance.auto_correct_tooltip')}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="space-y-6 p-4 bg-muted/30 rounded-xl border border-border">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold">{t('clip_editor.polish.enhance.smart_color')}</span>
                              <span className="text-xs font-mono font-bold text-primary">{colorCorrection}%</span>
                            </div>
                            <Slider 
                              value={[colorCorrection]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(v) => {
                                setColorCorrection(v[0]);
                                if (v[0] > 0) setIsAutoColorEnabled(false);
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground tracking-tighter">
                              <span>{t('clip_editor.polish.enhance.natural')}</span>
                              <span>{t('clip_editor.polish.enhance.vibrant')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border/50" />

                      {/* Transition Suggestions Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">{t('clip_editor.polish.enhance.transitions_title')}</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={generateTransitionSuggestions}
                                disabled={isGeneratingTransitions}
                                className="h-auto p-0 text-[10px] font-bold text-primary hover:bg-transparent"
                              >
                                {isGeneratingTransitions ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Sparkles size={12} className="mr-1.5" />}
                                {t('clip_editor.polish.enhance.analyze_clip')}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {t('clip_editor.polish.enhance.transitions_tooltip')}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="space-y-3">
                          {isGeneratingTransitions ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg border border-border/50" />
                              ))}
                            </div>
                          ) : transitionSuggestions.length > 0 ? (
                            <div className="grid gap-2">
                              {transitionSuggestions.map((s, i) => (
                                <div 
                                  key={i}
                                  className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg group hover:border-primary/30 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                      {formatTime(s.time)}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold">{s.type} {t('clip_editor.polish.enhance.transition', { defaultValue: 'Transition' })}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {s.caption && (
                                          <Badge variant="outline" className="text-[8px] bg-primary/5 border-primary/10 text-primary py-0 h-4">
                                            "{s.caption}"
                                          </Badge>
                                        )}
                                        {s.sfx && (
                                          <div className="flex items-center gap-2 text-[8px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-black tracking-tighter">
                                            <Volume2 size={8} />
                                            {s.sfx}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="px-2 text-[9px] font-bold text-primary hover:bg-primary/10"
                                  >
                                    {t('clip_editor.polish.enhance.apply_btn')}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3">
                              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <Layout size={20} />
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">{t('clip_editor.polish.enhance.no_transitions')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Recommendations Footer */}
                      <div className="p-4 sm:p-5 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden group">
                        <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Sparkles size={80} className="text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <BrainCircuit size={14} />
                          </div>
                          <p className="text-[10px] font-bold">{t('clip_editor.polish.enhance.coach_title')}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic relative z-10">
                          {t('clip_editor.polish.enhance.coach_tip')}
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="hidden lg:block space-y-3 pt-4">
                <Button 
                  size="hero" 
                  onClick={handlePublishContent}
                  disabled={isPublishing}
                  className="w-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 rounded-full font-bold bg-primary hover:bg-primary-strong transition-all"
                >
                  {isPublishing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      {t('clip_editor.polish.actions.publish')}
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="hero" 
                  onClick={() => {
                    setIsDirty(false);
                    toast.success(t('clip_editor.polish.actions.downloading', { defaultValue: 'Downloading high-quality render...' }));
                  }}
                  disabled={isPublishing}
                  className="w-full rounded-full font-bold transition-all"
                >
                  <Download size={18} className="mr-2" />
                  {t('clip_editor.polish.actions.download')}
                </Button>
              </div>

              {/* Mobile Sticky Footer */}
              <div className="lg:hidden fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 shadow-soft-xl">
                <div className="max-w-md mx-auto grid grid-cols-6 gap-2">
                  <Button 
                    onClick={() => {
                      setIsDirty(false);
                      toast.success(t('clip_editor.polish.actions.downloading', { defaultValue: 'Downloading high-quality render...' }));
                    }}
                    className="col-span-1 rounded-xl border-border bg-muted/50 hover:bg-muted active:scale-95" 
                    variant="outline" 
                    size="icon-2xl"
                    disabled={isPublishing}
                  >
                    <Download size={18} />
                  </Button>
                  <Button 
                    onClick={handlePublishContent}
                    size="2xl" 
                    disabled={isPublishing}
                    className="col-span-5 flex items-center justify-center gap-2 shadow-soft-lg rounded-xl font-bold text-sm bg-primary hover:bg-primary-strong transition-all active:scale-95 text-primary-foreground"
                  >
                    <div className="flex items-center gap-1.5 mr-1">
                      <TiktokIcon size={14} className="text-primary-foreground" />
                      <Instagram size={14} className="text-primary-foreground" />
                    </div>
                    {isPublishing ? "Publishing..." : t('clip_editor.polish.actions.publish_socials')}
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

        {/* Polishing Overlay */}
        <AnimatePresence>
          {isReviewingTrim && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            >
              <div className="ui-card w-full max-w-lg p-8 shadow-2xl text-center space-y-6">
                <div className="ui-icon-chip-primary w-20 h-20 bg-primary text-primary-foreground mx-auto shadow-lg shadow-primary/20">
                  <Play size={32} fill="currentColor" className="ml-1" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-foreground">{t('clip_editor.overlays.review_title')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('clip_editor.overlays.review_desc', { duration: formatTime(trimEnd - trimStart) })}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${reviewProgress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => {
                        setIsReviewingTrim(false);
                        if (reviewIntervalRef.current) {
                          clearInterval(reviewIntervalRef.current);
                          reviewIntervalRef.current = null;
                        }
                      }}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t('clip_editor.overlays.cancel')}
                    </button>
                    <Button 
                      onClick={startPolishing}
                      size="xl"
                      className="px-6 h-10 text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      {t('clip_editor.overlays.skip_polish')}
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {isPolishing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
            >
              <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={40} className="text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-display font-bold text-foreground">{t('clip_editor.overlays.polishing_title')}</h3>
                  <p className="text-muted-foreground">{t('clip_editor.overlays.polishing_desc')}</p>
                </div>

                <div className="space-y-6">
                  {polishSteps.map((s, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: polishStep >= i ? 1 : 0.3,
                        x: 0,
                        scale: polishStep === i ? 1.02 : 1
                      }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-md border transition-all",
                        polishStep === i ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5" : "bg-muted/30 border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center transition-colors",
                        polishStep > i ? "bg-brand-secondary text-primary-foreground" : 
                        polishStep === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {polishStep > i ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{t(s.label)}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{t(s.subtext)}</p>
                      </div>
                      {polishStep === i && (
                        <Loader2 size={18} className="text-primary animate-spin" />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-[0.2em]">
                    <span>{t('clip_editor.overlays.overall_progress')}</span>
                    <span>{polishProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${polishProgress}%` }}
                      className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {blocker.state === "blocked" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[110] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="ui-card w-full max-w-md p-8 shadow-2xl text-center space-y-6 border border-white/10 bg-zinc-950 rounded-3xl"
              >
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full mx-auto flex items-center justify-center border border-destructive/20">
                  <AlertTriangle size={28} className="text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-foreground">Unsaved Changes</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    You have unsaved changes on your video clip. If you leave now, these modifications will be lost.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      blocker.reset?.();
                    }}
                    className="flex-1 rounded-full text-xs font-bold"
                  >
                    Stay & Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setIsDirty(false);
                      setTimeout(() => {
                        blocker.proceed?.();
                      }, 0);
                    }}
                    className="flex-1 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-none"
                  >
                    Discard Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
