import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import logo from "../contents/images/nexa-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: string;
  textSize?: string;
  gap?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconSize = "w-10 h-10", 
  textSize = "text-xl", 
  gap = "gap-1.5",
  showText = true 
}) => {
  return (
    <Link to="/" className={cn("flex items-center cursor-pointer group", gap, className)}>
      <motion.div 
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className={cn("flex items-center", gap)}
      >
        <div className={cn("flex items-center justify-center overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow shrink-0", iconSize)}>
          <img 
            src={logo} 
            alt="nxclip.ai Logo" 
            className="w-full h-full object-contain" 
            referrerPolicy="no-referrer" 
          />
        </div>
        {showText && (
          <span className={cn("font-bold tracking-tight text-foreground lowercase whitespace-nowrap", textSize)}>
            nxclip.ai
          </span>
        )}
      </motion.div>
    </Link>
  );
};
