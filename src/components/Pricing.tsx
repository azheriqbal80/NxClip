import { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { PRICING_PLANS } from "../lib/pricing-data";

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="pricing" className="ui-landing-section overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="ui-container-landing relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <span>{t('pricing.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title">
            {t('pricing.title')}
          </h2>
          
          <div className="mt-8 flex flex-col items-center gap-4 px-4 w-full">
            <Tabs 
              value={billingCycle} 
              onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
              className="w-full max-w-[280px]"
            >
              <TabsList className="ui-tabs-list grid w-full grid-cols-2 h-11 mb-2">
                <TabsTrigger 
                  value="monthly" 
                  className="ui-tabs-trigger"
                >
                  {t('pricing.monthly')}
                </TabsTrigger>
                <TabsTrigger 
                  value="yearly" 
                  className="ui-tabs-trigger"
                >
                  {t('pricing.yearly')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider"
            >
              <Sparkles size={11} fill="currentColor" className="shrink-0" />
              <span>{t('pricing.page.discount')}</span>
            </motion.div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={cn(
                "relative flex flex-col p-8 rounded-lg border transition-all duration-300",
                plan.popular 
                  ? "bg-card border-primary shadow-xl shadow-primary/5 md:scale-105 z-10" 
                  : "bg-card border-border hover:border-primary/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] rounded-full shadow-xl">
                  {t('pricing.popular')}
                </div>
              )}

              <div className="mb-8">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-6",
                  plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
                )}>
                  <plan.icon size={20} />
                </div>
                <h3 className="ui-card-title mb-1">{t(`pricing.plans.${plan.id}.name`)}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-6 tracking-tight">{t(`pricing.plans.${plan.id}.who`)}</p>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl lg:text-5xl font-display font-bold text-foreground">
                    ${billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-muted-foreground text-xs font-bold tracking-widest">
                    /{t('pricing.mo')}
                  </span>
                </div>
                {billingCycle === "yearly" && plan.priceYearly > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{t('pricing.billing_annually')} ${plan.priceYearly * 12}</p>
                )}
                {billingCycle === "monthly" && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{plan.priceMonthly === 0 ? t('pricing.infinite_potential') : t('pricing.billed_monthly')}</p>
                )}
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {(t(`pricing.plans.${plan.id}.features`, { returnObjects: true }) as string[]).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-foreground/80">
                    <CheckCircle2 size={14} className={cn("mt-0.5 shrink-0", plan.popular ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[13px]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "default" : "outline"}
                asChild
                className={cn(
                  "w-full py-6 font-bold text-sm",
                  plan.popular && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                )}
              >
                <Link to="/signup" className="w-full h-full flex items-center justify-center">
                  {plan.popular ? t('pricing.upgrade') : t('pricing.get_started')}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/pricing" className="inline-flex items-center gap-2 font-bold text-sm text-muted-foreground hover:text-primary transition-colors group">
            {t('pricing.compare')}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

