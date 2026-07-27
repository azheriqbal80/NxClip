import { Sparkles, Twitter, Github, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TiktokIcon } from "./TiktokIcon";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { cn } from "../lib/utils";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <footer className="relative pt-24 pb-12 overflow-hidden border-t border-border bg-background">
      {/* Subtle Bottom Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[30%] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 opacity-50" />

      <div className="ui-container-landing relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-4">
            <Logo 
              iconSize="w-10 h-10" 
              textSize="text-2xl" 
              className="mb-8"
              gap="gap-3"
            />
            <p className="text-lg text-muted-foreground max-w-sm mb-10 font-medium leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Instagram, Youtube, TiktokIcon].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className={cn(
                    "w-10 h-10 flex items-center justify-center border border-border rounded-lg transition-all",
                    Icon === TiktokIcon 
                      ? "bg-foreground/10 text-foreground border-foreground/20" 
                      : "bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted"
                  )}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className={cn(
              "text-sm font-bold text-foreground mb-8",
              isAr ? "tracking-normal" : "tracking-[0.2em]"
            )}>{t('footer.product')}</h4>
            <ul className="space-y-4">
              <li><Link to="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.tools')}</Link></li>
              <li><Link to="/image-studio" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.image_studio')}</Link></li>
              <li><Link to="/clip-editor" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.clip_editor')}</Link></li>
              <li><Link to="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('pricing.label')}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className={cn(
              "text-sm font-bold text-foreground mb-8",
              isAr ? "tracking-normal" : "tracking-[0.2em]"
            )}>{t('footer.platform')}</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-primary transition-colors font-medium">{t('nav.dashboard')}</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-primary transition-colors font-medium">{t('footer.how_it_works')}</Link></li>
              <li><Link to="/community" className="hover:text-primary transition-colors font-medium">{t('footer.community')}</Link></li>
              <li><Link to="/status" className="hover:text-primary transition-colors font-medium">{t('footer.status')}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="p-8 rounded-lg bg-card border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                 <Sparkles size={16} className="text-primary/20" />
              </div>
              <h4 className={cn(
                "text-sm font-bold text-foreground mb-4",
                isAr ? "tracking-normal" : "tracking-[0.2em]"
              )}>{t('footer.newsletter_title')}</h4>
              <p className="text-sm text-muted-foreground mb-8 font-medium">{t('footer.newsletter_desc')}</p>
              <div className="flex gap-2">
                <input 
                  id="footer-newsletter-email"
                  name="newsletterEmail"
                  type="email" 
                  autoComplete="email"
                  aria-label={t('footer.newsletter_title')}
                  placeholder={t('footer.newsletter_placeholder')}
                  className="bg-muted border border-border rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all flex-grow font-medium min-w-0" 
                />
                <Button variant="brand-premium" className={cn(
                  "px-5 py-6 font-bold tracking-widest shrink-0",
                  isAr ? "text-[12px]" : "text-[10px]"
                )}>
                  {t('footer.newsletter_button')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground font-bold tracking-widest opacity-40">
            &copy; {new Date().getFullYear()} nxclip.ai. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-bold tracking-[0.1em]">{t('footer.privacy')}</a>
            <a href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-bold tracking-[0.1em]">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
