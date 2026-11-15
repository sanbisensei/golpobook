import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border-[1.5px] border-ink bg-card px-3 py-2 font-mono text-xs sm:text-sm text-foreground transition-all duration-150 outline-none placeholder:text-muted-foreground focus:border-terracotta focus:shadow-hard-sm focus:-translate-y-0.5 shadow-hard-xs disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
