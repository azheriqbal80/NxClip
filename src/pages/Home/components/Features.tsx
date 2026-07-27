import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Scissors, BrainCircuit, ArrowRight } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";

export default function Features() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    if (auth.currentUser) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      title: t('features.image_studio.title'),
      description: t('features.image_studio.description'),
      icon: ImageIcon,
      image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800&h=500",
      link: t('common.try_now') + " →",
      path: "/create/image",
      color: "from-blue-500/20 to-transparent"
    },
    {
      title: t('features.clip_trimmer.title'),
      description: t('features.clip_trimmer.description'),
      icon: Scissors,
      image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=800&h=500",
      link: t('common.try_now') + " →",
      path: "/create/clip",
      color: "from-purple-500/20 to-transparent"
    },
    {
      title: t('features.creator_coach.title'),
      description: t('features.creator_coach.description'),
      icon: BrainCircuit,
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800&h=500",
      link: t('common.try_now') + " →",
      badge: t('features.creator_coach.badge'),
      path: "/coach",
      color: "from-amber-500/20 to-transparent"
    },
  ];

  return (
    <section id="features" className="ui-landing-section">
      {/* Background Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="ui-container-landing">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('features.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title mx-auto max-w-4xl">
            {t('features.title_line1')} <br /><span className="brand-text-gradient">{t('features.title_line2')}</span>
          </h2>
          <p className="ui-landing-description mx-auto">
            {t('features.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleLinkClick(feature.path)}
              className="ui-glass-card group flex flex-col h-full rounded-xl overflow-hidden"
            >
              {/* Image Container */}
              <div className="ui-feature-card-image-wrap">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-60 group-hover:opacity-40 transition-opacity`} />
                
                {/* Floating Icon Capsule */}
                <div className="ui-feature-card-icon-capsule">
                  <feature.icon size={22} />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-grow p-6 pt-0">
                {feature.badge && (
                  <div className="inline-flex mb-4 w-fit px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                    {feature.badge}
                  </div>
                )}
                <h3 className="text-xl font-display font-black text-foreground mb-3 group-hover:text-primary transition-colors tracking-tight leading-none">{feature.title}</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-auto pt-8 flex items-center gap-2 text-[12px] font-black text-primary transition-all group-hover:gap-4">
                  <span>{t('features.elite_tooling')}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
