import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";

export default function FinalCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="ui-landing-section">
      {/* Centered Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      
      <div className="ui-container-landing relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('cta.label')}</span>
          </motion.div>
          
          <h2 className="ui-landing-title mx-auto">
            {t('cta.title')} <br />
            <span className="brand-text-gradient">{t('cta.title_gradient')}</span>
          </h2>
          
          <p className="max-w-2xl text-lg font-medium text-muted-foreground leading-relaxed mx-auto mb-16">
            {t('cta.description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              variant="brand-premium"
              size="hero"
              className="px-12"
              onClick={() => navigate("/signup")}
            >
              {t('cta.button_start')}
              <ChevronRight size={20} className="rtl:rotate-180" />
            </Button>
            <Button 
              variant="ghost"
              size="hero"
              className="px-12 py-8 bg-muted border border-border font-bold text-sm"
              onClick={() => navigate("/#pricing")}
            >
              {t('cta.button_pricing')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
