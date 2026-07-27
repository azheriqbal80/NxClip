import { motion } from "motion/react";
import { BarChart3, Sparkles, Image as ImageIcon, Scissors, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { auth } from "../../../firebase";
import logo from "@/contents/images/nexa-logo.png";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProductShowcase() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLinkClick = (path: string) => {
    if (auth.currentUser) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="ui-landing-section">
      {/* Background Glows - Refined & Layered */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="ui-container-landing relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="ui-landing-label"
          >
            <Sparkles size={14} className="mr-2" />
            <span>{t('showcase.label')}</span>
          </motion.div>
          <h2 className="ui-landing-title mb-10">
            {t('showcase.title')} <br />
            <span className="brand-text-gradient">{t('showcase.title_gradient')}</span>
          </h2>
          <p className="ui-landing-description mx-auto">
            {t('showcase.description')}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="ui-showcase-panel group">
            <div className="bg-card/40 rounded-xl overflow-hidden border border-border flex flex-col md:flex-row h-[750px] backdrop-blur-xl">
              {/* Sidebar UI - Premium Refinement */}
              <div className="ui-showcase-sidebar">
                <div className="flex items-center gap-3.5 mb-14">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg shadow-soft-xl">
                    <img src={logo} alt="nxclip.ai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-bold text-foreground text-lg tracking-tight lowercase">nxclip.ai</span>
                </div>
                
                <nav className="space-y-4 flex-grow">
                  {[
                    { icon: BarChart3, label: t('showcase.pulse.title'), active: true, path: "/analytics" },
                    { icon: ImageIcon, label: t('nav.image_studio'), path: "/create/image" },
                    { icon: Scissors, label: t('nav.clip_editor'), path: "/create/clip" },
                    { icon: MessageSquare, label: t('nav.creator_coach'), path: "/coach" },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      whileHover={{ x: 4 }}
                      onClick={() => handleLinkClick(item.path)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 rounded-lg text-[13px] font-bold transition-all cursor-pointer",
                        item.active 
                          ? "bg-primary/10 text-primary shadow-soft-lg shadow-primary/5 border border-primary/50" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto p-6 bg-muted/40 rounded-xl border border-border">
                  <div className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3">VRAM Capacity</div>
                  <div className="h-1.5 bg-muted rounded-full w-full mb-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "82%" }}
                      transition={{ duration: 2, delay: 0.8 }}
                      className="h-full bg-primary" 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-muted-foreground text-xs font-mono">8.2 / 10 GB</span>
                    <span className="text-primary italic">Optimized</span>
                  </div>
                </div>
              </div>

              {/* Main Content UI - Sharp & Clear */}
              <div className="flex-grow p-10 overflow-hidden bg-muted/5">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">{t('showcase.pulse.title')}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest opacity-70">{t('showcase.pulse.subtitle')}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg border border-border">
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold bg-background border border-border">30d</Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">90d</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {[
                    { label: t('showcase.stats.impressions'), value: "2.8M", trend: "+18.4%", color: "text-brand-secondary" },
                    { label: t('showcase.stats.gain'), value: "12.4K", trend: "+9.2%", color: "text-brand-secondary" },
                    { label: t('showcase.stats.score'), value: "94/100", trend: "+2.1%", color: "text-brand-secondary" },
                  ].map((stat) => (
                    <motion.div 
                      key={stat.label} 
                      whileHover={{ y: -4, backgroundColor: "var(--muted)" }}
                      className="p-8 bg-card rounded-lg border border-border shadow-soft transition-all cursor-pointer group"
                    >
                      <div className="text-[9px] font-black text-muted-foreground tracking-[0.2em] mb-3 leading-none">{stat.label}</div>
                      <div className="text-4xl font-display font-black text-foreground mb-2 tracking-tighter">{stat.value}</div>
                      <div className={cn("text-[10px] font-bold italic h-4 flex items-center gap-1.5", stat.color)}>
                        <div className="size-1 rounded-full bg-current animate-pulse" />
                        {stat.trend} {t('showcase.stats.efficiency')}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-card/50 backdrop-blur-xl rounded-lg border border-border h-80 flex flex-col group">
                    <div className="flex items-center justify-between mb-8">
                      <div className="font-bold text-foreground text-lg tracking-tight">{t('showcase.charts.sentiment')}</div>
                      <div className="flex gap-1.5 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                      </div>
                    </div>
                    <div className="flex-grow flex items-end gap-2 px-2">
                      {[40, 70, 45, 90, 65, 80, 50, 85, 60, 75, 40, 95, 60, 80].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.03 }}
                          className="flex-grow bg-primary/20 rounded-t-lg hover:bg-primary/40 transition-all cursor-pointer relative group/bar"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-10 bg-card/50 backdrop-blur-xl rounded-lg border border-border h-80 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="font-bold text-foreground text-lg tracking-tight">{t('showcase.charts.pipeline')}</div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold px-3">Active</Badge>
                    </div>
                    <div className="space-y-4 pr-1">
                      {/* Item 1: COMPLETED */}
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/50">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 overflow-hidden border border-primary/30 flex items-center justify-center">
                          <Sparkles size={16} className="text-primary" />
                        </div>
                        <div className="flex-grow">
                          <div className="h-1.5 w-full bg-primary rounded-full overflow-hidden shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-[9px] text-primary font-bold tracking-widest leading-none">Clip #01 • {t('showcase.charts.completed')}</div>
                            <div className="text-[9px] text-muted-foreground font-bold font-mono">100%</div>
                          </div>
                        </div>
                      </div>

                      {/* Item 2: PROCESSING */}
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 overflow-hidden border border-border flex items-center justify-center">
                          <Sparkles size={16} className="text-primary animate-pulse" />
                        </div>
                        <div className="flex-grow">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              animate={{ x: ["-100%", "100%"] }} 
                              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} 
                              className="w-1/3 h-full bg-primary/60" 
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-[9px] text-muted-foreground font-bold tracking-widest leading-none">Clip #02 • {t('showcase.charts.analyzing')}</div>
                            <div className="text-[9px] text-muted-foreground font-bold font-mono animate-pulse">42%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Floating Cards - Art-Directed */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-16 w-72 ui-glass-card p-8 rounded-lg border border-border hidden lg:block z-20 shadow-soft-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                <BarChart3 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">{t('showcase.insights.discovery')}</div>
                <div className="text-[9px] text-muted-foreground font-bold tracking-widest">{t('showcase.insights.nexa')}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              "{t('showcase.insights.peak')}"
            </p>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-8 -left-20 w-80 ui-glass-card p-8 rounded-lg border border-border hidden lg:block z-20 shadow-soft-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">{t('showcase.insights.suggestion')}</div>
                <div className="text-[9px] text-muted-foreground font-bold tracking-widest">{t('showcase.insights.auto')}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium italic">
              "{t('showcase.insights.neon')}"
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
