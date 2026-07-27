import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { BadgeCheck } from "lucide-react";
import { searchGamingPhotos } from "../../../services/pexelsService";

interface Creator {
  id: string;
  handle: string;
  niche: string;
  quote: string;
  avatar: string;
  photographer?: string;
  photographer_url?: string;
}

export default function CreatorSpotlight() {
  const { t, i18n } = useTranslation();
  
  const initialCreators: Creator[] = [
    {
      id: "aura",
      handle: t('spotlight.creators.aura.handle'),
      niche: t('spotlight.creators.aura.niche'),
      quote: t('spotlight.creators.aura.quote'),
      avatar: "https://picsum.photos/seed/aura/400/400",
    },
    {
      id: "sage",
      handle: t('spotlight.creators.sage.handle'),
      niche: t('spotlight.creators.sage.niche'),
      quote: t('spotlight.creators.sage.quote'),
      avatar: "https://picsum.photos/seed/sage/400/400",
    },
    {
      id: "pixel",
      handle: t('spotlight.creators.pixel.handle'),
      niche: t('spotlight.creators.pixel.niche'),
      quote: t('spotlight.creators.pixel.quote'),
      avatar: "https://picsum.photos/seed/pixel/400/400",
    },
    {
      id: "knight",
      handle: t('spotlight.creators.knight.handle'),
      niche: t('spotlight.creators.knight.niche'),
      quote: t('spotlight.creators.knight.quote'),
      avatar: "https://picsum.photos/seed/knight/400/400",
    },
  ];

  const [creators, setCreators] = useState<Creator[]>(initialCreators);

  useEffect(() => {
    async function loadPexelsImages() {
      // Searching for gaming portraits or people gaming
      const photos = await searchGamingPhotos("gamer portrait gaming", 8);
      
      if (photos.length > 0) {
        const updatedCreators = initialCreators.map((creator, index) => {
          const photo = photos[index % photos.length];
          return {
            ...creator,
            avatar: photo.src.large2x || photo.src.large,
            photographer: photo.photographer,
            photographer_url: photo.photographer_url
          };
        });
        setCreators(updatedCreators);
      }
    }

    loadPexelsImages();
  }, [i18n.language]); // Sync if language changes, though rendering uses direct t() now

  return (
    <section className="ui-landing-section bg-muted/20">
      <div className="ui-container-landing relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('spotlight.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title mx-auto max-w-4xl">
            {t('spotlight.title')} <br /><span className="brand-text-gradient">{t('spotlight.title_gradient')}</span>
          </h2>
          <p className="ui-landing-description mx-auto">
            {t('spotlight.description')}
          </p>
          
          <div className="flex items-center justify-center mt-12">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {creators.map((c, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-background overflow-hidden glass">
                   <img src={c.avatar} alt="Creator" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-foreground glass">
                {t('spotlight.counts')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="ui-glass-card group flex flex-col p-4 rounded-xl border-border/5 h-full bg-card/10 backdrop-blur-md"
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-6">
                <img 
                  src={creator.avatar} 
                  alt={creator.handle}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute inset-x-6 bottom-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-out fade-out shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-white/90 uppercase">{t(`spotlight.creators.${creator.id}.niche`)}</span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">{t(`spotlight.creators.${creator.id}.handle`)}</h3>
                </div>

                {/* Attribution - Subtle */}
                {creator.photographer && (
                  <div className="absolute top-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={creator.photographer_url} target="_blank" rel="noopener" className="glass px-2 py-1 rounded text-[8px] text-white/60">
                      {t('common.via')} Pexels
                    </a>
                  </div>
                )}
              </div>

              <div className="px-3 pb-4 flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground italic leading-relaxed font-medium mb-8">
                  "{t(`spotlight.creators.${creator.id}.quote`)}"
                </p>
                <div className="mt-auto pt-6 border-t border-border/10 flex items-center justify-between">
                  <BadgeCheck size={16} className="text-primary fill-primary/10" />
                  <span className="text-[9px] font-bold text-muted-foreground tracking-widest group-hover:text-primary transition-colors">{t('spotlight.verified')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ambient Section Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[70%] bg-primary/5 rounded-full blur-[160px]" />
      </div>
    </section>
  );
}
