import { Outlet, useLocation } from "react-router-dom";
import AppShell from "../AppShell";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * DashboardLayout wraps authenticated routes with the AppShell.
 * It provides a consistent navigation experience across the dashboard.
 */
export default function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Basic title mapping based on current path
    const path = location.pathname;
    const pathMap: Record<string, string> = {
      "/feed": t('nav.home_feed'),
      "/dashboard": t('nav.dashboard'),
      "/create": t('nav.create_hub'),
      "/analytics": t('nav.analytics'),
      "/coach": t('nav.coach'),
      "/my-content": t('nav.content_library'),
      "/profile": t('top_bar.actions.profile'),
      "/settings": t('nav.settings'),
      "/admin": t('nav.admin_panel'),
      "/upgrade": t('nav.upgrade_pro'),
    };

    // Handle dynamic paths like /feed/post/:id or /users/:id
    if (path.startsWith("/feed/post/")) setTitle(t('post.detail'));
    else if (path.startsWith("/users/")) setTitle(t('user.profile'));
    else if (path.startsWith("/create/image")) setTitle(t('nav.image_studio'));
    else if (path.startsWith("/create/clip")) {
       if (path.includes("/edit")) setTitle(t('nav.clip_editor'));
       else setTitle(t('nav.clip_editor')); // or upload
    }
    else setTitle(pathMap[path] || t('nav.dashboard'));
  }, [location.pathname, t]);

  return (
    <AppShell title={title}>
      <Outlet />
    </AppShell>
  );
}
