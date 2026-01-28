import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-base text-zinc-900 dark:text-white",
        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        "transition-colors outline-none",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "hover:border-zinc-300 dark:hover:border-zinc-600",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-900 dark:file:text-white",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
