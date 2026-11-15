import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-sans font-bold uppercase tracking-wider transition-all duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-terracotta text-white border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm hover:bg-terracotta-dark",
        primary:
          "bg-terracotta text-white border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm hover:bg-terracotta-dark",
        secondary:
          "bg-canary text-ink border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm hover:bg-canary-light",
        outline:
          "bg-card text-foreground border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm hover:bg-muted",
        ghost:
          "border-[1.5px] border-transparent text-foreground hover:border-ink hover:bg-muted hover:shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-white border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm hover:bg-destructive/90",
        link: "border-transparent text-terracotta underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-xs gap-1.5",
        xs: "h-6 px-2 text-[10px] gap-1",
        sm: "h-8 px-3 text-[11px] gap-1.5",
        lg: "h-11 px-6 text-sm gap-2",
        xl: "h-14 px-8 text-base gap-3",
        icon: "size-9 border-[1.5px]",
        "icon-sm": "size-7 border-[1.5px]",
        "icon-lg": "size-10 border-[1.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
