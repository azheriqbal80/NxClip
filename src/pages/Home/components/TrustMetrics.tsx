import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

const games = [
  "Valorant",
  "Fortnite",
  "CS2",
  "Apex Legends",
  "FIFA",
  "Minecraft",
];

export default function TrustMetrics() {
  const { t } = useTranslation();
  // Triple the items to ensure there's always enough content to cover the screen
  // and make the loop seamless regardless of width
  const items = [...games, ...games, ...games];

  return (
    <section id="trust-metrics" className="h-20 bg-background/50 border-y border-white/5 flex items-center overflow-hidden relative transition-colors duration-500">
      <div className="ui-container-landing flex items-center w-full flex-nowrap">
        <span className="text-[10px] font-bold text-neutral-500 tracking-[0.4em] whitespace-nowrap mr-12 shrink-0 select-none">
          {t('common.trusted_by')}
        </span>
        
        <div className="flex-grow overflow-hidden relative">
          {/* Marquee Container with enhanced Fades using Masking */}
          <div 
            className="flex-nowrap"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
            }}
          >
            <motion.div 
              className="flex items-center gap-16 md:gap-24 flex-nowrap"
              animate={{ x: ["0%", "-33.33%"] }}
              transition={{ 
                duration: 30, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ width: "fit-content" }}
            >
              {items.map((game, index) => (
                <div 
                  key={`${game}-${index}`} 
                  className="group flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity duration-500 cursor-default shrink-0 select-none"
                >
                  <div className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                  <span className="text-sm font-display font-medium text-foreground tracking-wide whitespace-nowrap">
                    {game}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
