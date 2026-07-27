import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, 
  PlusSquare, 
  LayoutDashboard, 
  BarChart3, 
  User,
  ShieldCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "../types";
import { ADMIN_EMAILS } from "../constants";
import { useAppSelector } from "../store/hooks";
import { selectAuthProfile } from "../store/slices/authSlice";

const mobileItems = [
  { icon: Home, label: "nav.home_feed", href: "/feed" },
  { icon: LayoutDashboard, label: "nav.dashboard", href: "/dashboard" },
  { icon: PlusSquare, label: "nav.create", href: "/create" },
  { icon: BarChart3, label: "nav.analytics", href: "/analytics" },
  { icon: User, label: "nav.creator", href: "/profile" },
];

export default function MobileNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const profile = useAppSelector(selectAuthProfile);

  const isAdmin = profile?.role === "admin" || (auth.currentUser?.email && ADMIN_EMAILS.includes(auth.currentUser.email.toLowerCase()));

  const items = [...mobileItems];
  if (isAdmin) {
    // Only add if not already there, though mobileItems is static so it's fine
    if (!items.find(i => i.href === "/admin")) {
      items.push({ icon: ShieldCheck, label: "nav.admin_panel", href: "/admin" });
    }
  }

  return (
    <nav 
      aria-label="Main Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 px-2 pb-safe"
    >
      <div className="flex items-center justify-between h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const translatedLabel = t(item.label);
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label={translatedLabel}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-card p-1 rounded-sm",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} className={cn(isActive && "animate-in zoom-in-75 duration-300")} />
              <span className="text-[10px] font-bold tracking-wider">{translatedLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
