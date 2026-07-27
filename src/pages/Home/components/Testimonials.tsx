import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonialList = [
    {
      id: "viper",
      name: t('testimonials.data.viper.name'),
      handle: "@ViperGaming",
      tag: t('testimonials.data.viper.tag'),
      quote: t('testimonials.data.viper.quote'),
      avatar: "https://picsum.photos/seed/alex/100/100",
    },
    {
      id: "luna",
      name: t('testimonials.data.luna.name'),
      handle: "@LunaPlays",
      tag: t('testimonials.data.luna.tag'),
      quote: t('testimonials.data.luna.quote'),
      avatar: "https://picsum.photos/seed/sarah/100/100",
    },
    {
      id: "tank",
      name: t('testimonials.data.tank.name'),
      handle: "@TankBuilds",
      tag: t('testimonials.data.tank.tag'),
      quote: t('testimonials.data.tank.quote'),
      avatar: "https://picsum.photos/seed/marcus/100/100",
    },
  ];

  // Duplicate the list to create a seamless loop
  const duplicatedTestimonials = [...testimonialList, ...testimonialList];

  return (
    <section id="testimonials" className="ui-landing-section bg-muted/10">
      <div className="ui-container-landing relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('testimonials.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title">
            {t('testimonials.title')} <br /><span className="brand-text-gradient">{t('testimonials.title_gradient')}</span>
          </h2>
          <p className="ui-landing-description mx-auto">
            {t('testimonials.description')}
          </p>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative flex overflow-hidden group">
          {/* Gradient Overlays for smooth fading at edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-8 px-4"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {duplicatedTestimonials.map((t, index) => (
              <div
                key={`${t.handle}-${index}`}
                className="w-[400px] shrink-0 ui-testimonial-card flex flex-col group/card"
              >
                <div className="flex items-center gap-1.5 mb-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} className="text-primary fill-primary/10" />
                  ))}
                </div>
                
                <p className="text-base text-foreground/90 font-medium leading-relaxed mb-10 flex-grow">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-4 pt-8 border-t border-border">
                  <div className="w-12 h-12 rounded-lg overflow-hidden glass border-border group-hover/card:border-primary/40 transition-colors">
                    <img src={t.avatar} alt={t.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground tracking-tight">{t.name}</h4>
                    <div className="text-[10px] text-muted-foreground font-bold tracking-widest flex items-center gap-2">
                       <span>{t.handle}</span>
                       <span className="w-1 h-1 rounded-full bg-border" />
                       <span className="text-primary">{t.tag}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Background Accent Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[50%] bg-primary/5 rounded-full blur-[140px] -z-10" />
    </section>
  );
}
