import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ChevronRight, ChevronLeft, Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectAuthUser, logoutUser } from "../store/slices/authSlice";
import { identityApi } from "../services/apiClient";
import { clearPersistedUser } from "../services/auth/authService";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeHash, setActiveHash] = useState("");

  const handleLogout = async () => {
    try {
      await identityApi.logout();
    } catch (err) {
      console.warn("Logout request did not complete on server, clearing session locally:", err);
    } finally {
      clearPersistedUser();
      dispatch(logoutUser());
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Intersection Observer for active section highlighting
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
    );

    const sections = ["hero", "features", "pricing", "how-it-works"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: t('nav.home'), href: "/#hero" },
    { name: t('nav.features'), href: "/#features" },
    { name: t('nav.pricing'), href: "/#pricing" },
    { name: t('nav.how_it_works'), href: "/#how-it-works" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6",
        isScrolled ? "py-4" : "py-8"
      )}
    >
      <div className={cn(
        "ui-container-landing flex items-center justify-between px-6 py-2.5 rounded-full transition-all duration-700 ease-in-out",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border border-border shadow-soft-lg" 
          : "bg-transparent border-transparent"
      )}>
        {/* Logo */}
        <Logo className={isAr ? "origin-right" : "origin-left"} />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isHomePage = location.pathname === "/";
            const linkHash = link.href.split("#")[1];
            const isActive = isHomePage 
              ? activeHash === `#${linkHash}` || (activeHash === "" && linkHash === "hero")
              : false;
              
            return (
              <Button
                key={link.name}
                variant="ghost"
                asChild
                className={cn(
                  "transition-all px-4 h-9 rounded-full text-sm font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm shadow-primary/5" 
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                )}
              >
                <Link to={link.href}>
                  {link.name}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="link"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-primary transition-all px-4"
              >
                {t('nav.dashboard')}
                {isAr ? (
                  <ChevronLeft size={14} className="mr-1" />
                ) : (
                  <ChevronRight size={14} className="ml-1" />
                )}
              </Button>
              <Button 
                variant="link"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary transition-all px-4"
              >
                {t('nav.signout')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 p-0 rounded-full overflow-hidden border border-border"
                onClick={() => navigate("/profile")}
              >
                <img src={user.photoURL || undefined} alt={user.displayName || t('nav.creator')} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="text-muted-foreground hover:text-primary transition-all px-4"
              >
                {t('nav.signin')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate("/signup")}
                className="text-muted-foreground hover:text-primary transition-all px-4"
              >
                {t('nav.signup')}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-muted-foreground"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[51] md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-6 right-6 mt-4 p-1 bg-popover/90 backdrop-blur-xl rounded-lg md:hidden shadow-soft-lg z-[52] overflow-hidden border border-border"
            >
              <div className="bg-card/30 p-5 flex flex-col gap-1">
                {navLinks.map((link, idx) => {
                  const isHomePage = location.pathname === "/";
                  const linkHash = link.href.split("#")[1];
                  const isActive = isHomePage 
                    ? activeHash === `#${linkHash}` || (activeHash === "" && linkHash === "hero")
                    : false;

                  return (
                    <Button
                      key={link.name}
                      variant="ghost"
                      asChild
                      className={cn(
                        "flex items-center justify-between p-3 h-auto rounded-lg transition-colors group cursor-pointer w-full text-left justify-start",
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      )}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          navigate(link.href);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span className={cn(
                          "text-[15px] font-semibold",
                          isActive ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                        )}>{link.name}</span>
                        {isAr ? (
                          <ChevronLeft size={14} className={cn(
                            "transition-all",
                            isActive ? "text-primary translate-x-0 opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                          )} />
                        ) : (
                          <ChevronRight size={14} className={cn(
                            "transition-all",
                            isActive ? "text-primary translate-x-0 opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                          )} />
                        )}
                      </motion.div>
                    </Button>
                  );
                })}
                
                <div className="h-px bg-border/40 my-3 mx-2" />
                
                {user ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                      <img src={user.photoURL || undefined} className="w-10 h-10 rounded-full border border-border" referrerPolicy="no-referrer" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-tight">{user.displayName}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">{t('nav.creator')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { navigate("/dashboard"); setIsMobileMenuOpen(false); }} 
                        className="rounded-lg h-10 font-bold text-xs bg-muted/50"
                      >
                        {t('nav.dashboard')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogout} 
                        className="rounded-lg h-10 font-bold text-xs text-muted-foreground"
                      >
                        {t('nav.signout')}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2 p-1"
                  >
                    <Button
                      onClick={() => navigate("/login")}
                      variant="ghost"
                      className="w-full h-12 rounded-lg font-bold text-sm"
                    >
                      {t('nav.signin')}
                    </Button>
                    <Button
                      onClick={() => navigate("/signup")}
                      className="w-full h-12 rounded-lg font-bold text-sm bg-primary shadow-soft"
                    >
                      {t('nav.signup')}
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
