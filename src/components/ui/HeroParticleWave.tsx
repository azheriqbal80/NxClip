import { motion } from "motion/react";
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Twitch, 
  Video, 
  Play, 
  Share2,
  Youtube,
  Instagram
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn } from "../../lib/utils";

import { TiktokIcon } from "../TiktokIcon";

interface Particle {
  id: number;
  Icon: any;
  color: string;
  size: number;
  initialY: number;
  delay: number;
  duration: number;
  amplitude: number;
  frequency: number;
  glowScale: number;
  baseOpacity: number;
}

interface HeroParticleWaveProps {
  density?: number;
  speed?: number;
  opacity?: number;
  className?: string;
}

const ICONS = [
  Youtube, Instagram, TiktokIcon, // Social platforms
  Zap, Sparkles, TrendingUp, // Status icons
  Youtube, Instagram, TiktokIcon, // Repeat for higher frequency
  Youtube, Instagram, TiktokIcon, // Repeat for higher frequency
  Twitch, Video, Play, Share2
];

const COLORS = [
  "text-primary",
  "text-brand-primary-soft",
  "text-brand-secondary",
  "text-brand-tertiary"
];

export default function HeroParticleWave({ 
  density = 25, 
  speed = 0.8, 
  opacity = 0.35,
  className 
}: HeroParticleWaveProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const count = useMemo(() => isMobile ? Math.floor(density * 0.4) : density, [density, isMobile]);

  useEffect(() => {
    const baselineY = 40; // Center-ish of the hero
    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * (32 - 10) + 10, // High randomness: 10px to 32px
      initialY: baselineY + (Math.random() * 30 - 15), 
      delay: Math.random() * 40 - 40,
      duration: (Math.random() * (35 - 25) + 25) / speed,
      amplitude: Math.random() * (50 - 30) + 30,
      frequency: 2.2,
      glowScale: Math.random() * (1.2 - 0.8) + 0.8,
      baseOpacity: Math.random() * (1 - 0.4) + 0.4, // Random opacity: 0.4 to 1.0
    }));
    setParticles(newParticles);
  }, [count, speed]);

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden z-0",
        className
      )}
      style={{ opacity }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: "-10vw", y: `${p.initialY}vh`, opacity: 0 }}
          animate={{ 
            x: "110vw",
            opacity: [0, p.baseOpacity, p.baseOpacity, 0] // Randomize peak opacity
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
            opacity: {
              times: [0, 0.2, 0.8, 1],
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear"
            }
          }}
          className="absolute top-0 left-0"
        >
          <motion.div
            animate={{ 
              y: [0, p.amplitude, 0, -p.amplitude, 0],
              scale: [0.95, 1.05, 0.95],
              filter: [
                `drop-shadow(0 0 ${2 * p.glowScale}px currentColor) drop-shadow(0 0 ${4 * p.glowScale}px currentColor)`,
                `drop-shadow(0 0 ${4 * p.glowScale}px currentColor) drop-shadow(0 0 ${8 * p.glowScale}px currentColor)`,
                `drop-shadow(0 0 ${2 * p.glowScale}px currentColor) drop-shadow(0 0 ${4 * p.glowScale}px currentColor)`
              ]
            }}
            transition={{
              y: {
                duration: p.duration / p.frequency,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay
              },
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay % 2
              },
              filter: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay % 2
              }
            }}
            className={cn("flex items-center justify-center p-2 rounded-full", p.color)}
          >
            <p.Icon 
              size={p.size} 
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Subtle edge fades (Reduced width to prevent masking) */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
    </div>
  );
}
