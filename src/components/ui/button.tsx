import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding ui-text-button whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background active:scale-[0.98] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
        brand: "bg-primary text-primary-foreground shadow-soft hover:shadow-soft-md hover:-translate-y-px",
        "brand-gradient": "text-primary-foreground bg-[linear-gradient(135deg,var(--color-brand-primary)_0%,var(--color-brand-tertiary)_100%)] shadow-[0_4px_15px_color-mix(in_srgb,var(--color-brand-primary)_20%,transparent)] hover:brightness-110 hover:-translate-y-px hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--color-brand-primary)_30%,transparent)]",
        "brand-premium": "text-primary-foreground bg-[linear-gradient(135deg,var(--color-brand-primary)_0%,var(--color-brand-tertiary)_100%)] shadow-[0_8px_25px_color-mix(in_srgb,var(--color-brand-primary)_30%,transparent),inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:brightness-110 hover:-translate-0.5 hover:scale-[1.02] hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--color-brand-primary)_40%,transparent),inset_0_0_0_1px_rgba(255,255,255,0.2)]",
        contrast: "bg-foreground text-background shadow-soft hover:opacity-90 hover:shadow-soft-md hover:-translate-y-px font-semibold",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 rounded-md px-2 ui-text-caption [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-md px-2.5 ui-text-caption [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-4",
        xl: "h-10 gap-2 px-5 ui-text-body-md rounded-md",
        "2xl": "h-12 gap-3 px-6 ui-text-body-md rounded-md shadow-md",
        hero: "h-14 gap-3 px-10 ui-text-card-title rounded-xl shadow-lg",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
        "icon-xl": "size-10",
        "icon-2xl": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : ButtonPrimitive
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
