import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border font-sans font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-terracotta text-white border-ink shadow-hard-xs",
        secondary:
          "bg-canary text-ink border-ink shadow-hard-xs",
        amber:
          "bg-amber text-ink border-ink shadow-hard-xs",
        outline:
          "bg-card text-foreground border-ink",
        free:
          "bg-muted text-ink-muted border-ink/40",
        plus:
          "bg-amber text-ink border-ink shadow-hard-xs",
        premium:
          "bg-terracotta text-white border-ink shadow-hard-xs",
      },
      size: {
        default: "px-2 py-0.5 text-[10px] leading-tight",
        sm: "px-1.5 py-0.2 text-[9px] leading-none",
        lg: "px-2.5 py-1 text-xs",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
