import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-[1.25rem] border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
