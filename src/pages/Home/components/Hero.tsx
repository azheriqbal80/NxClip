import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { 
  Sparkles, 
  Play, 
  ChevronRight, 
  BarChart3, 
  Layout,
  Video,
  X
} from "lucide-react";

import { auth } from "../../../firebase";
import HeroParticleWave from "../../../components/ui/HeroParticleWave";

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const prompts = t('hero.prompts', { returnObjects: true }) as string[] || [
    "Cyberpunk neon gaming setup with dual monitors",
    "Viral Valorant clutch cinematic highlight",
    "Professional streamer setup with RGB lighting"
  ];

  useEffect(() => {
    let typingInterval: NodeJS.Timeout;
    const fullText = prompts[currentPromptIndex];
    
    if (isTyping) {
      let i = 0;
      typingInterval = setInterval(() => {
        i++;
        if (i >= fullText.length) {
          clearInterval(typingInterval);
          setTimeout(() => {
            setIsTyping(false);
            setTimeout(() => {
              setIsTyping(true);
              setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
            }, 3000);
          }, 1000);
        }
      }, 50);
    }

    return () => clearInterval(typingInterval);
  }, [currentPromptIndex, isTyping]);

  const handleCardClick = (path: string) => {
    if (auth.currentUser) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <section id="hero" className="ui-hero-shell min-h-screen">
      {/* Layered Ambient Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] opacity-40 animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/15 rounded-full blur-[140px] opacity-30" />
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[70%] bg-brand-tertiary/10 rounded-full blur-[180px] opacity-40" />
        <div className="absolute inset-0 dots-pattern opacity-5" />
        <HeroParticleWave density={72} speed={0.8} opacity={0.6} />
      </div>

      <div className="ui-container-hero relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Row 1: Elite Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="ui-hero-badge">
              <Sparkles size={16} className="mr-3" />
              <span>{t('hero.badge')}</span>
            </div>
          </motion.div>
          
          {/* Row 2: Centered Heading & Subtitle */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="ui-hero-title"
          >
            {t('hero.title_line1')} <br />
            <span className="brand-text-gradient">{t('hero.title_line2')}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="ui-hero-subtitle"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Row 3: Four boxes of Core Features */}
          <div className="ui-hero-feature-grid">
            {[
              { 
                title: t('hero.image_editor'), 
                detail: t('hero.imaging_detail'),
                Icon: Sparkles, 
                path: "/create/image"
              },
              { 
                title: t('hero.clip_editor'), 
                detail: t('hero.video_detail'),
                Icon: Video, 
                path: "/create/clip"
              },
              { 
                title: t('hero.analytics'), 
                detail: t('hero.growth_detail'),
                Icon: BarChart3, 
                path: "/analytics"
              },
              { 
                title: t('hero.feed'), 
                detail: t('hero.curated_detail'),
                Icon: Layout, 
                path: "/feed"
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + (idx * 0.1) }}
                onClick={() => handleCardClick(feature.path)}
                className="group hero-feature-box"
              >
                {/* Glowing Icon Wrapper */}
                <div className="hero-feature-icon-wrapper">
                  {/* Subtle Tiny Particles */}
                  {[
                    { x: [25, -35, 15], y: [-25, 35, -15], s: 2.5, d: 0 },
                    { x: [-45, 25, -15], y: [15, -35, 25], s: 3.5, d: 1.2 },
                    { x: [35, -15, 45], y: [45, 15, -25], s: 2, d: 2.4 },
                    { x: [-25, 45, -35], y: [-35, 25, 15], s: 2.5, d: 0.8 },
                    { x: [15, -25, 35], y: [35, -15, -45], s: 3, d: 1.8 },
                    { x: [-35, 35, -25], y: [-45, 25, 45], s: 2.8, d: 3.2 },
                    { x: [45, -45, 25], y: [25, 45, -35], s: 3.2, d: 4.0 },
                    { x: [-15, 35, -45], y: [-25, -45, 35], s: 2.2, d: 0.5 }
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute rounded-full blur-[0.5px]",
                        idx % 3 === 0 ? "bg-primary/90" : idx % 3 === 1 ? "bg-brand-tertiary/90" : "bg-brand-secondary/90"
                      )}
                      style={{
                        width: p.s,
                        height: p.s,
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        x: p.x,
                        y: p.y,
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.4, 0.8],
                      }}
                      transition={{
                        duration: 8 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: p.d
                      }}
                    />
                  ))}

                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.5
                    }}
                  >
                    <feature.Icon 
                      size={42} 
                      strokeWidth={1.2}
                      className={cn(
                        "transition-all duration-500",
                        idx % 3 === 0 ? "text-primary" : idx % 3 === 1 ? "text-brand-tertiary" : "text-brand-secondary"
                      )} 
                    />
                  </motion.div>
                </div>
                
                <h3 className="hero-feature-title">{feature.title}</h3>
                <p className="hero-feature-detail">{feature.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Row 4: Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="ui-hero-actions"
          >
            <Button 
              variant="brand-premium"
              size="hero"
              className="shadow-xl shadow-primary/20 min-w-[220px]"
              onClick={() => navigate("/signup")}
            >
              {t('hero.cta_start')}
              <ChevronRight size={18} />
            </Button>
            <Button 
              variant="ghost"
              size="hero"
              className="bg-muted/30 border border-border/50 hover:bg-muted/80 min-w-[220px] backdrop-blur-sm"
              onClick={() => setShowDemoModal(true)}
            >
              <Play size={18} fill="currentColor" className="text-primary" />
              {t('hero.cta_demo')}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
    
    {/* Demo Video Modal */}
    <AnimatePresence>
      {showDemoModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemoModal(false)}
            className="ui-demo-modal-overlay"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="ui-demo-modal-content focus:outline-none"
          >
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setShowDemoModal(false)}
              className="absolute top-6 right-6 z-20 bg-popover/80 hover:bg-muted rounded-full text-foreground transition-colors backdrop-blur-xl border border-border"
            >
              <X size={24} />
            </Button>
            
            <div className="relative w-full h-full">
              {/* Top gradient overlay with pointer-events-auto to block sharing and watch later/save clicks */}
              <div className="absolute top-0 left-0 right-0 h-[15%] bg-gradient-to-b from-black/80 to-transparent pointer-events-auto z-10" />
              
              <iframe
                className="w-full h-full border-none relative z-0"
                src="https://www.youtube.com/embed/dD9U5NSB4eU?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1"
                title="nxclip.ai Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}

