import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shadow-sm",
        destructive:
          "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20",
        outline:
          "border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:text-white text-zinc-300",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/50",
        ghost:
          "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100",
        link:
          "text-zinc-400 underline-offset-4 hover:underline hover:text-zinc-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-sm font-semibold",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
