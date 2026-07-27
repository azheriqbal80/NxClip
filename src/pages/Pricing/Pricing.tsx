import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { SEO } from "../../components/SEO";
import Footer from "../../components/Footer";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { TooltipProvider } from "../../components/ui/tooltip";
import { PRICING_PLANS, PLAN_RECOMMENDATIONS } from "../../lib/pricing-data";

export const metadata = {
  title: "Pricing & Plans",
  description: "Simple, creator-first pricing. Start for free and scale with Pro features as your creator brand grows."
};

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen ui-bg-landing flex flex-col">
      <SEO title={t('pricing.page.title')} description={t('pricing.page.subtitle')} />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-[100%]" />
        </div>

        <div className="ui-container-landing">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Badge variant="outline" className="ui-landing-label mb-6 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] font-bold border-primary/30 bg-primary/5 text-primary">
                {t('pricing.page.badge')}
              </Badge>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight mb-6 leading-[1.05] text-foreground">
              {t('pricing.page.title')}
            </h1>
            <p className="max-w-2xl text-base sm:text-lg font-normal text-muted-foreground leading-relaxed mx-auto px-4 sm:px-0">
              {t('pricing.page.subtitle')}
            </p>

            <div className="mt-12 flex flex-col items-center gap-5 px-4">
              <Tabs 
                value={billingCycle} 
                onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
                className="w-full max-w-[280px]"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted/80 border border-border/60 h-12 p-1 rounded-xl shadow-inner">
                  <TabsTrigger 
                    value="monthly" 
                    className="text-[11px] uppercase tracking-[0.2em] font-extrabold transition-all duration-200 data-active:bg-background data-active:text-foreground data-active:shadow-sm text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    {t('pricing.monthly')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="yearly" 
                    className="text-[11px] uppercase tracking-[0.2em] font-extrabold transition-all duration-200 data-active:bg-background data-active:text-foreground data-active:shadow-sm text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    {t('pricing.yearly')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                <Sparkles size={13} fill="currentColor" className="shrink-0" />
                <span>{t('pricing.page.discount')}</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-28 items-stretch">
            {PRICING_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "relative flex flex-col p-8 sm:p-9 rounded-2xl border transition-all duration-300",
                  plan.popular 
                    ? "bg-card/95 border-primary ring-1 ring-primary/30 shadow-2xl shadow-primary/10 lg:scale-[1.03] z-10" 
                    : "bg-card/80 border-border/80 hover:border-primary/40 shadow-lg shadow-black/5"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-[0.25em] rounded-full shadow-lg shadow-primary/25 whitespace-nowrap">
                    {t('pricing.popular')}
                  </div>
                )}

                <div className="mb-8 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-6 mx-auto transition-transform hover:scale-105 duration-300",
                    plan.popular ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/80 text-primary border border-border/60"
                  )}>
                    <plan.icon size={28} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-1.5 uppercase tracking-tight">{t(`pricing.plans.${plan.id}.name`)}</h3>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-8">{t(`pricing.plans.${plan.id}.who`)}</p>
                  
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-5xl sm:text-6xl font-display font-black text-foreground tracking-tight leading-none">
                      ${billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-[0.15em]">
                      / {i18n.language === 'ar' ? 'شهر' : 'mo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 font-semibold uppercase tracking-[0.08em] opacity-80">
                    {plan.priceMonthly === 0 ? t('pricing.infinite_potential') : 
                     billingCycle === "yearly" ? `${t('pricing.billing_annually')} $${plan.priceYearly * 12}/${i18n.language === 'ar' ? 'سنة' : 'yr'}` : t('pricing.billed_monthly')}
                  </p>
                </div>

                <div className="space-y-6 mb-10 flex-grow">
                  <div className="pt-6 border-t border-border/60">
                    <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em] mb-4">{t('pricing.page.capabilities_label')}</h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight text-left">{t('pricing.page.upload_limit')}</div>
                      <div className="text-[11px] font-extrabold text-foreground text-right">{plan.limits.clips}</div>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight text-left">{t('pricing.page.generations')}</div>
                      <div className="text-[11px] font-extrabold text-foreground text-right">{plan.limits.memes}</div>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight text-left">{t('pricing.page.quality_cap')}</div>
                      <div className="text-[11px] font-extrabold text-foreground text-right uppercase">{plan.limits.quality}</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 pt-6 border-t border-border/60">
                    {(t(`pricing.plans.${plan.id}.features`, { returnObjects: true }) as string[]).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={cn(
                          "size-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5",
                          plan.popular ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted border-border/80 text-muted-foreground"
                        )}>
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground/90 leading-snug tracking-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: plan.popular ? "default" : "outline", size: "lg" }),
                    "w-full h-13 font-black text-xs uppercase tracking-[0.2em] transition-all group rounded-xl",
                    plan.popular 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-muted/60 border-border hover:bg-muted hover:border-primary/40"
                  )}
                >
                  {plan.cta}
                  <ChevronRight size={15} className="ml-1.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Detailed Feature Comparison */}
          <div className="mb-28">
            <div className="text-center mb-14 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tight leading-none">{t('pricing.page.breakdown_title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-normal text-base sm:text-lg leading-relaxed">
                {t('pricing.page.breakdown_desc')}
              </p>
            </div>
            
            <div className="rounded-2xl border border-border/80 bg-card/90 overflow-x-auto shadow-xl shadow-black/5">
              <TooltipProvider>
                <Table className="min-w-[800px] lg:min-w-full">
                  <TableHeader className="bg-muted/60">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="w-[320px] h-16 px-8 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{t('pricing.page.capabilities_label')}</TableHead>
                      <TableHead className="text-center h-16 text-[11px] font-extrabold uppercase tracking-[0.2em] text-foreground/80">{t('pricing.plans.starter.name')}</TableHead>
                      <TableHead className="text-center h-16 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary bg-primary/10 border-x border-primary/20">{t('pricing.plans.pro.name')}</TableHead>
                      <TableHead className="text-center h-16 text-[11px] font-extrabold uppercase tracking-[0.2em] text-foreground/80">{t('pricing.plans.studio.name')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: 'content_creation', title: t('pricing.comparison.categories.content_creation'), features: [
                        { name: t('pricing.comparison.features.gen'), starter: `5 ${t('pricing.values.per_day')}`, pro: t('pricing.values.unlimited'), studio: t('pricing.values.unlimited') },
                        { name: t('pricing.comparison.features.upload'), starter: `${t('pricing.values.up_to')} 500MB`, pro: `${t('pricing.values.up_to')} 5GB`, studio: `${t('pricing.values.up_to')} 5GB` },
                        { name: t('pricing.comparison.features.edit'), starter: true, pro: true, studio: true },
                        { name: t('pricing.comparison.features.meme'), starter: t('pricing.values.limited'), pro: t('pricing.values.unlimited'), studio: t('pricing.values.unlimited') },
                        { name: t('pricing.comparison.features.image'), starter: t('pricing.values.limited'), pro: t('pricing.values.unlimited'), studio: t('pricing.values.unlimited') },
                      ]},
                      { id: 'ai_coach', title: t('pricing.comparison.categories.ai_coach'), features: [
                        { name: t('pricing.comparison.features.coach_msg'), starter: `3 / ${i18n.language === 'ar' ? 'شهر' : 'mo'}`, pro: t('pricing.values.unlimited'), studio: t('pricing.values.unlimited') },
                        { name: t('pricing.comparison.features.ai_sugg'), starter: t('pricing.values.basic'), pro: t('pricing.values.advanced'), studio: `${t('pricing.values.advanced')} + Teams` },
                        { name: t('pricing.comparison.features.growth_plan'), starter: t('pricing.values.basic'), pro: true, studio: true },
                        { name: t('pricing.comparison.features.ai_report'), starter: t('pricing.values.preview'), pro: true, studio: true },
                      ]},
                      { id: 'analytics', title: t('pricing.comparison.categories.analytics'), features: [
                        { name: t('pricing.comparison.features.basic_analytics'), starter: true, pro: true, studio: true },
                        { name: t('pricing.comparison.features.engagement_rate'), starter: false, pro: true, studio: true },
                        { name: t('pricing.comparison.features.full_dashboard'), starter: false, pro: true, studio: true },
                        { name: t('pricing.comparison.features.platform_comp'), starter: t('pricing.values.preview'), pro: true, studio: true },
                        { name: t('pricing.comparison.features.performance_insights'), starter: t('pricing.values.limited'), pro: true, studio: t('pricing.values.advanced') },
                        { name: t('pricing.comparison.features.posting_time'), starter: false, pro: true, studio: true },
                      ]},
                      { id: 'publishing', title: t('pricing.comparison.categories.publishing'), features: [
                        { name: t('pricing.comparison.features.tiktok'), starter: true, pro: true, studio: true },
                        { name: t('pricing.comparison.features.youtube'), starter: true, pro: true, studio: true },
                        { name: t('pricing.comparison.features.instagram'), starter: false, pro: true, studio: true },
                        { name: t('pricing.comparison.features.scheduled'), starter: false, pro: true, studio: true },
                        { name: t('pricing.comparison.features.cross_platform'), starter: t('pricing.values.basic'), pro: true, studio: true },
                      ]}
                    ].map((category) => (
                      <React.Fragment key={category.id}>
                        <TableRow className="bg-muted/80 border-border/60 hover:bg-muted/80">
                          <TableCell colSpan={4} className="h-11 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            {category.title}
                          </TableCell>
                        </TableRow>
                        {category.features.map((feature) => (
                          <TableRow key={feature.name} className="border-border/40 hover:bg-primary/5 transition-colors group">
                            <TableCell className="px-8 flex items-center gap-2 h-13">
                              <span className="text-[13px] font-semibold text-foreground/80 group-hover:text-primary transition-colors">{feature.name}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {typeof feature.starter === "boolean" ? (
                                feature.starter ? <CheckCircle2 size={16} className="mx-auto text-primary" /> : <XCircle size={16} className="mx-auto text-muted-foreground/50" />
                              ) : (
                                <span className="text-[12px] font-bold text-foreground/70">{feature.starter}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center bg-primary/5 border-x border-primary/10">
                              {typeof feature.pro === "boolean" ? (
                                feature.pro ? <CheckCircle2 size={16} className="mx-auto text-primary" /> : <XCircle size={16} className="mx-auto text-muted-foreground/50" />
                              ) : (
                                <span className="text-[12px] font-extrabold text-primary">{feature.pro}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {typeof feature.studio === "boolean" ? (
                                feature.studio ? <CheckCircle2 size={16} className="mx-auto text-primary" /> : <XCircle size={16} className="mx-auto text-muted-foreground/50" />
                              ) : (
                                <span className="text-[12px] font-bold text-foreground/70">{feature.studio}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          </div>

          {/* Upgrade Triggers Section */}
          <div className="mb-28">
            <div className="text-center mb-14 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tight leading-none">{t('pricing.page.triggers_title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-normal text-base sm:text-lg leading-relaxed">
                {t('pricing.page.triggers_desc')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(t('pricing.triggers', { returnObjects: true }) as {title: string, desc: string}[]).map((trigger, i) => (
                <div key={i} className="bg-card/80 border border-border/80 rounded-2xl p-7 hover:border-primary/40 hover:bg-card transition-all duration-300 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-2.5">{trigger.title}</h3>
                  <p className="text-sm font-normal text-muted-foreground leading-relaxed">{trigger.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Recommendation Section */}
          <div className="mb-28 grid md:grid-cols-3 gap-6 lg:gap-8">
            {PLAN_RECOMMENDATIONS.map((recommendation, i) => (
              <div 
                key={i} 
                className={cn(
                  "bg-card/80 border rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 group relative overflow-hidden shadow-sm",
                  recommendation.variant === "premium" ? "border-primary/80 ring-1 ring-primary/30 bg-card/95" : "border-border/80 hover:border-primary/30 hover:bg-card"
                )}
              >
                {recommendation.variant === "premium" && (
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={100} className="text-primary" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative z-10 transition-transform group-hover:scale-105 duration-300",
                  recommendation.variant === "premium" 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "bg-primary/10 border border-primary/20 text-primary"
                )}>
                  <recommendation.icon size={22} />
                </div>
                <h3 className="text-lg font-display font-black text-foreground mb-3 uppercase tracking-tight relative z-10">{t(`pricing.recommendations.${i}.name`)}</h3>
                <p className="text-sm font-normal text-muted-foreground leading-relaxed relative z-10">
                  {t(`pricing.recommendations.${i}.desc`)}
                </p>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-28 px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tight leading-none">{t('pricing.page.faq_title')}</h2>
              <p className="text-muted-foreground font-normal text-base sm:text-lg">{t('pricing.page.faq_desc')}</p>
            </div>
            <Accordion defaultValue={["item-0"]} className="space-y-3.5">
              {(t('pricing.faqs', { returnObjects: true }) as {q: string, a: string}[]).map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border/80 bg-card/80 rounded-2xl px-6 sm:px-8 overflow-hidden transition-all duration-200 hover:border-primary/40 group">
                  <AccordionTrigger className="hover:no-underline py-5 sm:py-6">
                    <span className="text-left font-extrabold text-sm uppercase tracking-tight text-foreground group-hover:text-primary transition-colors pr-4">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-sm font-normal text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Final CTA */}
          <div className="relative rounded-3xl bg-primary/5 border border-primary/20 p-10 sm:p-16 md:p-20 text-center overflow-hidden shadow-2xl shadow-primary/10">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Sparkles size={180} className="text-primary" /></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground tracking-tight leading-tight mb-6">{t('pricing.page.final_cta_title')}</h2>
              <p className="text-base sm:text-lg font-normal text-muted-foreground mb-10 leading-relaxed">
                {t('pricing.page.final_cta_desc')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link 
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: "brand-premium", size: "lg" }),
                    "w-full sm:w-auto h-14 px-10 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/25 rounded-xl"
                  )}
                >
                  {t('pricing.page.final_cta_pro')}
                </Link>
                <Link 
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto h-14 px-10 text-xs font-black uppercase tracking-[0.2em] bg-card border-border hover:bg-muted/80 rounded-xl"
                  )}
                >
                  {t('pricing.page.final_cta_free')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

