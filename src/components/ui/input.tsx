import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-input bg-background px-4 py-2.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

/**
 * Input with leading/trailing adornments (e.g. a search icon).
 * Pass `children` to render the icon slot(s); use `data-side="leading|trailing"`.
 */
function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative w-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function InputGroupIcon({
  className,
  side = "leading",
  ...props
}: React.ComponentProps<"span"> & { side?: "leading" | "trailing" }) {
  return (
    <span
      data-slot="input-group-icon"
      className={cn(
        "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-muted-foreground",
        side === "leading" ? "left-4" : "right-4",
        className
      )}
      {...props}
    />
  )
}

export { Input, InputGroup, InputGroupIcon }
