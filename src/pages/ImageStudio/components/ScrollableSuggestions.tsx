import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

interface ScrollableSuggestionsProps {
  items: string[];
  onSelect: (s: string) => void;
  selectedValue?: string;
  truncateLimit?: number;
}

export function ScrollableSuggestions({ 
  items, 
  onSelect, 
  selectedValue, 
  truncateLimit = 18 
}: ScrollableSuggestionsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -120 : 120;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group/scroll flex items-center w-full overflow-hidden">
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            onClick={() => handleScroll('left')}
            className="absolute left-0 z-10 h-7 w-6 bg-gradient-to-r from-card/95 via-card/80 to-transparent flex items-center justify-start pointer-events-auto"
          >
            <ChevronLeft size={14} className="text-muted-foreground hover:text-primary transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth items-center py-1 flex-1 px-1"
      >
        {items.map((s, i) => (
          <Badge 
            key={`${s}-${i}`}
            variant="secondary" 
            className={cn(
              "whitespace-nowrap cursor-pointer hover:bg-primary/20 transition-all text-[10px] py-1 px-3 font-medium border border-border/10 rounded-full lowercase",
              selectedValue === s && "bg-primary/20 border-primary/30 text-primary"
            )}
            onClick={() => onSelect(s)}
          >
            {s.length > truncateLimit ? s.slice(0, truncateLimit) + "..." : s}
          </Badge>
        ))}
      </div>

      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            onClick={() => handleScroll('right')}
            className="absolute right-0 z-10 h-7 w-6 bg-gradient-to-l from-card/95 via-card/80 to-transparent flex items-center justify-end pointer-events-auto"
          >
            <ChevronRight size={14} className="text-muted-foreground hover:text-primary transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
