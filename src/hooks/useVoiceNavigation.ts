import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface VoiceCommand {
  name: string;
  path: string;
  triggers: string[];
}

export type VoiceStatus = "idle" | "listening" | "success" | "error" | "unsupported";

export function useVoiceNavigation() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastRecognizedCommand, setLastRecognizedCommand] = useState<string | null>(null);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set language dynamically matching user locale
      recognition.lang = i18n.language === "ar" ? "ar-SA" : "en-US";
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setStatus("unsupported");
    }
  }, [i18n.language]);

  // Command mappings for routing
  const commands: VoiceCommand[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      triggers: [
        "dashboard",
        "go to dashboard",
        "open dashboard",
        "show dashboard",
        "navigate to dashboard",
        "لوحة التحكم",
        "اللوحة",
        "لوحه التحكم",
        "لوحه"
      ]
    },
    {
      name: "Editor",
      path: "/create/clip",
      triggers: [
        "editor",
        "clip editor",
        "video editor",
        "go to editor",
        "open editor",
        "show editor",
        "navigate to editor",
        "go to clip editor",
        "المحرر",
        "معدل المقاطع",
        "محرر الفيديو",
        "تعديل",
        "تعديل الفيديو",
        "افتح المحرر"
      ]
    },
    {
      name: "Analytics",
      path: "/analytics",
      triggers: [
        "analytics",
        "go to analytics",
        "open analytics",
        "show analytics",
        "navigate to analytics",
        "insights",
        "التحليلات",
        "إحصائيات",
        "احصائيات",
        "تحليلات",
        "افتح التحليلات"
      ]
    },
    {
      name: "Create Hub",
      path: "/create",
      triggers: [
        "create hub",
        "go to create hub",
        "open create hub",
        "create",
        "hub",
        "مركز الإنشاء",
        "مركز الانشاء",
        "إنشاء",
        "انشاء",
        "صناعة"
      ]
    },
    {
      name: "Home Feed",
      path: "/feed",
      triggers: [
        "home feed",
        "go to feed",
        "open feed",
        "feed",
        "home",
        "الرئيسية",
        "الرئيسيه",
        "الخلاصة",
        "خلاصة",
        "المنشورات"
      ]
    },
    {
      name: "Profile",
      path: "/profile",
      triggers: [
        "profile",
        "go to profile",
        "open profile",
        "my profile",
        "الملف الشخصي",
        "الملف الشخصى",
        "ملفي",
        "ملفى",
        "بروفايل"
      ]
    },
    {
      name: "Settings",
      path: "/settings",
      triggers: [
        "settings",
        "go to settings",
        "open settings",
        "الإعدادات",
        "الاعدادات",
        "إعدادات",
        "اعدادات"
      ]
    },
    {
      name: "AI Coach",
      path: "/coach",
      triggers: [
        "coach",
        "ai coach",
        "creator coach",
        "go to coach",
        "open coach",
        "المدرب",
        "مدرب الذكاء الاصطناعي",
        "مدرب الذكاء الاصطناعى",
        "مدرب"
      ]
    }
  ];

  // Match voice input against defined commands
  const parseCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim();
    
    for (const cmd of commands) {
      const isMatched = cmd.triggers.some(trigger => {
        const normalizedTrigger = trigger.toLowerCase();
        // Match exact phrase or strong keyword inclusion
        return normalizedText === normalizedTrigger || normalizedText.includes(normalizedTrigger);
      });
      
      if (isMatched) {
        return cmd;
      }
    }
    return null;
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping SpeechRecognition:", err);
      }
      setIsListening(false);
      if (status === "listening") {
        setStatus("idle");
      }
    }
  }, [isListening, status]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      toast.error(i18n.language === "ar" ? "التعرف على الصوت غير مدعوم في متصفحك." : "Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setTranscript("");
    setErrorMessage(null);
    setStatus("listening");
    setIsListening(true);

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const activeTranscript = finalTranscript || interimTranscript;
      setTranscript(activeTranscript);

      if (activeTranscript) {
        const matched = parseCommand(activeTranscript);
        if (matched) {
          // Success state
          setLastRecognizedCommand(matched.name);
          setStatus("success");
          setIsListening(false);
          
          try {
            recognition.stop();
          } catch (e) {}

          const successMsg = i18n.language === "ar" 
            ? `جاري الانتقال إلى: ${matched.name}`
            : `Navigating to: ${matched.name}`;
          
          toast.success(successMsg, {
            description: `Command: "${activeTranscript}"`,
            duration: 3000,
          });

          // Execute navigation
          navigate(matched.path);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setStatus("error");
      
      let msg = "";
      if (event.error === "not-allowed") {
        msg = i18n.language === "ar" 
          ? "تم رفض الوصول للميكروفون. يرجى تفعيل الصلاحية."
          : "Microphone access denied. Please enable permission.";
      } else if (event.error === "no-speech") {
        msg = i18n.language === "ar"
          ? "لم يتم كشف أي صوت. حاول مجدداً."
          : "No speech detected. Try again.";
      } else {
        msg = i18n.language === "ar"
          ? `خطأ في الصوت: ${event.error}`
          : `Speech error: ${event.error}`;
      }
      
      setErrorMessage(msg);
      toast.error(msg);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Only reset state back to idle if we didn't end with success/error
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setStatus("error");
      setErrorMessage("Could not start microphone stream.");
    }
  }, [isSupported, isListening, parseCommand, navigate, i18n.language, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    lastRecognizedCommand,
    status,
    errorMessage,
    startListening,
    stopListening,
    commands,
  };
}
