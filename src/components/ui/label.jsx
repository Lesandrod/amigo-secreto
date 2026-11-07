import * as React from "react"
import { cn } from "@/lib/utils"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-zinc-300 leading-none select-none",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
