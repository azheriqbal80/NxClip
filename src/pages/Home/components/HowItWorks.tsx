import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Search, Zap, Rocket } from "lucide-react";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      title: t('how_it_works.steps.1.title'),
      description: t('how_it_works.steps.1.desc'),
      icon: Search,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: t('how_it_works.steps.2.title'),
      description: t('how_it_works.steps.2.desc'),
      icon: Zap,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: t('how_it_works.steps.3.title'),
      description: t('how_it_works.steps.3.desc'),
      icon: Rocket,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <section id="how-it-works" className="ui-landing-section">
      <div className="ui-container-landing">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('how_it_works.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title">
            {t('how_it_works.title')} <br /><span className="brand-text-gradient">{t('how_it_works.title_gradient')}</span>
          </h2>
          <p className="ui-landing-description mx-auto">
            {t('how_it_works.description')}
          </p>
        </div>

        <div className="relative">
          {/* Subtle Connecting Line - Refined */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent -z-10" />

          <div className="grid lg:grid-cols-3 gap-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-xl flex items-center justify-center mb-8 shadow-soft-xl border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-all relative">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                    <step.icon size={28} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-popover rounded-full flex items-center justify-center text-primary font-bold text-xs border border-border shadow-soft-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="ui-card-title group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="ui-card-description max-w-xs font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Background Subtle Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[140px] -z-10 opacity-30" />
    </section>
  );
}
