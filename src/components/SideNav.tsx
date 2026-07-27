import { motion } from "motion/react";
import { 
  Home, 
  PlusSquare, 
  BarChart3, 
  MessageSquare, 
  Library, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  ShieldCheck,
  LucideIcon,
  Image as ImageIcon,
  Video,
  LayoutDashboard,
  Swords,
  Cpu
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "../types";
import { Button, buttonVariants } from "./ui/button";
import { Badge } from "./ui/badge";
import { Logo } from "./Logo";
import { CreatorAvatar } from "./CreatorAvatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { ADMIN_EMAILS } from "../constants";
import { useAppSelector } from "../store/hooks";
import { selectAuthProfile } from "../store/slices/authSlice";

const navItems = [
  { icon: Home, label: "Home Feed", href: "/feed", translationKey: "nav.home_feed" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", translationKey: "nav.dashboard" },
  { icon: PlusSquare, label: "Create Hub", href: "/create", id: "tour-create-hub", translationKey: "nav.create_hub" },
];

const toolItems = [
  { icon: ImageIcon, label: "Image Studio", href: "/create/image", translationKey: "nav.image_studio" },
  { icon: Video, label: "Clip Editor", href: "/create/clip", translationKey: "nav.clip_editor" },
];

const supportItems = [
  { icon: BarChart3, label: "Analytics", href: "/analytics", translationKey: "nav.analytics" },
  { icon: MessageSquare, label: "Creator Coach", href: "/coach", id: "tour-coach", translationKey: "nav.coach" },
  { icon: Library, label: "Content Library", href: "/my-content", translationKey: "nav.content_library" },
  { icon: Swords, label: "Battles", href: "#", comingSoon: true, translationKey: "nav.battles" },
];

interface SideNavProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function SideNav({ isCollapsed, setIsCollapsed }: SideNavProps) {
  const { t, i18n } = useTranslation();
  const profile = useAppSelector(selectAuthProfile);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = profile?.role === "admin" || (auth.currentUser?.email && ADMIN_EMAILS.includes(auth.currentUser.email.toLowerCase()));

  const NavLink = ({ item, isActive }: { item: { icon: LucideIcon; label: string; href: string; comingSoon?: boolean; id?: string; translationKey?: string }, isActive: boolean }) => {
    const label = item.translationKey ? t(item.translationKey) : item.label;
    const content = (
      <Link
        to={item.href}
        id={item.id}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-all group relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card",
          isActive 
            ? "bg-muted text-foreground" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon size={18} className={cn("shrink-0", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
        {!isCollapsed && (
          <span className="text-[13px] font-medium whitespace-nowrap">
            {label}
          </span>
        )}
        {item.comingSoon && !isCollapsed && (
          <span className="ms-auto text-[8px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t('nav.soon') || "Soon"}</span>
        )}
        {isActive && (
          <motion.div 
            layoutId="active-indicator"
            className={cn(
              "absolute w-0.5 h-4 bg-primary rounded-full",
              i18n.language === 'ar' ? "right-0 rounded-l-full" : "left-0 rounded-r-full"
            )}
          />
        )}
      </Link>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side={i18n.language === 'ar' ? "left" : "right"} className="font-bold text-[10px] tracking-widest">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <motion.nav
      aria-label="Sidebar Navigation"
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      className={cn(
        "fixed top-0 h-screen bg-card border-r border-border z-50 hidden lg:flex flex-col transition-colors duration-300",
        i18n.language === 'ar' ? "right-0 border-l border-r-0" : "left-0"
      )}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <Logo 
                showText={!isCollapsed} 
                iconSize="w-9 h-9" 
                textSize="text-lg" 
                gap="gap-2"
                className="hover:scale-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card rounded-md" // Disable Link scaling here as Tooltip handles focus
              />
              {!isCollapsed && (
                <span className="ms-auto text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  v2.0
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side={i18n.language === 'ar' ? "left" : "right"} className="font-bold text-[10px] tracking-widest">
            {t('nav.home_tooltip') || "nxclip.ai Home"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-grow px-3 py-4">
        <div className="space-y-6">
          {/* Main Nav */}
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={location.pathname === item.href} />
            ))}
          </div>

          {/* Tools Section */}
          <div className="space-y-2">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest">{t('nav.tools')}</p>
            )}
            <div className="space-y-0.5">
              {toolItems.map((item) => {
                const isActive = item.label === "Clip Editor"
                  ? location.pathname.startsWith("/create/clip")
                  : location.pathname === item.href;
                return <NavLink key={item.href} item={item} isActive={isActive} />;
              })}
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-2">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest">{t('nav.insights')}</p>
            )}
            <div className="space-y-0.5">
              {supportItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={location.pathname === item.href} />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-3 space-y-0.5 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/pricing"
              className={cn(
                buttonVariants({ variant: "brand-gradient", size: "lg" }),
                "w-full justify-center gap-3 px-3"
              )}
            >
              <Zap size={16} className="shrink-0 text-primary-foreground" fill="currentColor" />
              {!isCollapsed && (
                <span className="text-[12px] font-bold tracking-wider">
                  {t('nav.upgrade_pro')}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-bold text-[10px] tracking-widest">
            {t('nav.upgrade_pro')}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card",
                location.pathname === "/settings" && "bg-muted text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Settings size={18} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap">
                  {t('nav.settings')}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-bold text-[10px] tracking-widest">
            {t('nav.settings')}
          </TooltipContent>
        </Tooltip>

        {isAdmin && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card",
                    location.pathname === "/admin" && "bg-muted text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <ShieldCheck size={18} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      {t('nav.admin_panel')}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-[10px] tracking-widest">
                {t('nav.admin_panel')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin/dev-suite"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card",
                    location.pathname === "/admin/dev-suite" && "bg-muted text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Cpu size={18} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      Developer Suite
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-[10px] tracking-widest">
                Developer Suite
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? t('nav.expand') : t('nav.collapse')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground mt-1",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              {isCollapsed ? (
                i18n.language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
              ) : (
                i18n.language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
              )}
              {!isCollapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap">
                  {isCollapsed ? t('nav.expand') : t('nav.collapse')}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-bold text-[10px] tracking-widest">
            {isCollapsed ? t('nav.expand') : t('nav.collapse')}
          </TooltipContent>
        </Tooltip>
      </div>
      {/* User Area */}
      <div className="p-3 border-t border-border mt-auto">
        {!isCollapsed && profile?.plan === "free" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2 text-primary">
              <Zap size={14} fill="currentColor" />
              <p className="text-[10px] font-bold tracking-wider">{t('nav.growth_tip.title')}</p>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium leading-tight">
              {t('nav.growth_tip.description')}
            </p>
            <Link 
              to="/upgrade" 
              className="block w-full py-1.5 bg-primary text-white text-[10px] font-bold text-center rounded tracking-widest hover:bg-primary/90 transition-all"
            >
              {t('nav.growth_tip.cta')}
            </Link>
          </motion.div>
        )}

        {/* User Area Avatar and Info */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card",
          isCollapsed && "justify-center"
        )} 
        tabIndex={0}
        role="button"
        aria-label="View My Profile"
        onKeyDown={(e) => e.key === 'Enter' && navigate("/profile")}
        onClick={() => navigate("/profile")}>
          <CreatorAvatar 
            src={profile?.photoURL} 
            email={profile?.email} 
            className="w-8 h-8 rounded border border-border overflow-hidden shrink-0" 
          />
          {!isCollapsed && (
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-foreground truncate leading-none">
                  {profile?.displayName || "Creator"}
                </p>
                <Badge variant={profile?.plan === "free" ? "secondary" : "brand-gradient"} className="h-4 px-1.5 text-[8px] tracking-tighter shrink-0 border-none">
                  {profile?.plan === "pro" ? "Pro" : profile?.plan === "studio" ? "Studio" : "Free"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate font-medium">
                {profile?.email}
              </p>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute -top-1 -right-1">
              <div className={cn(
                "w-2 h-2 rounded-full border border-card",
                profile?.plan === "free" ? "bg-muted" : "bg-primary"
              )} />
            </div>
          )}
        </div>
      </div>

      {/* Nav Items Section ends here, User Area is outside ScrollArea */}
    </motion.nav>
  );
}
