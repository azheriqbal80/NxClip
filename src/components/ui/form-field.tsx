import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

interface FormFieldProps {
  label?: string
  description?: string
  error?: string
  children: React.ReactNode
  className?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

export function FormField({
  label,
  description,
  error,
  children,
  className,
  id,
  required,
  disabled
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} data-disabled={disabled}>
      {label && (
        <div className="flex justify-between items-center px-1">
          <Label 
            htmlFor={id} 
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
              disabled ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          >
            {label}
            {required && <span className="text-primary ms-1">*</span>}
          </Label>
        </div>
      )}
      
      {description && (
        <p className={cn(
          "px-1 text-[10px] font-medium transition-colors",
          disabled ? "text-muted-foreground/30" : "text-muted-foreground/60"
        )}>
          {description}
        </p>
      )}

      <div className="relative">
        {children}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="flex items-center gap-1.5 px-1 pt-1 text-destructive overflow-hidden"
          >
            <AlertCircle size={12} className="shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
