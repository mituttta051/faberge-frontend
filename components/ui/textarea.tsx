"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, rows = 4, disabled, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={cn(
        "placeholder:text-muted-foreground w-full border bg-white px-3 py-2 text-sm outline-none transition-colors duration-200",
        error ? "border-destructive" : "border-input focus:border-foreground",
        disabled && "bg-muted cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    />
  );
});
