import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  pageSizeOptions = [6, 12, 24],
  className,
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSizeOptions[0] || 6))) {
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-border/60 text-xs font-medium text-muted-foreground", className)}>
      {/* Items count & Page Size selector */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && pageSize !== undefined && totalItems > 0 && (
          <span className="text-[11px] font-bold text-muted-foreground">
            Showing <span className="text-foreground font-extrabold">{startItem}</span>–<span className="text-foreground font-extrabold">{endItem}</span> of <span className="text-foreground font-extrabold">{totalItems}</span> posts
          </span>
        )}

        {pageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground/80">Per page:</span>
            <div className="flex gap-1">
              {pageSizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onPageSizeChange(option)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all border",
                    pageSize === option
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 hover:bg-muted text-foreground disabled:opacity-30"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 hover:bg-muted text-foreground disabled:opacity-30"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </Button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground font-bold">
                    •••
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "h-8 min-w-[32px] px-2 text-xs font-black rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft border-primary"
                      : "border-border/70 hover:border-primary/40 hover:bg-muted text-foreground"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 hover:bg-muted text-foreground disabled:opacity-30"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 hover:bg-muted text-foreground disabled:opacity-30"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};
