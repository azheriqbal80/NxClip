import { ReactNode, useState } from "react";
import SideNav from "./SideNav";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="min-h-screen ui-bg-dashboard flex transition-colors duration-300">
      {/* Skip to main content link for screen readers & keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:m-4 focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <SideNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div 
        className={cn(
          "flex-grow flex flex-col transition-all duration-300 min-w-0",
          "pb-20 lg:pb-0", // Space for mobile nav
          isCollapsed ? "lg:ms-16" : "lg:ms-60"
        )}
      >
        <TopBar title={title} />
        <main id="main-content" className="flex-grow p-4 md:p-8 w-full outline-none" tabIndex={-1}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
