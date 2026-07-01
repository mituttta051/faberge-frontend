"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, disabled, children, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "relative flex h-11 items-center border bg-white transition-colors duration-200",
        error ? "border-destructive" : "border-input focus-within:border-foreground",
        disabled && "bg-muted cursor-not-allowed opacity-50",
        className,
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "h-full flex-1 cursor-pointer appearance-none bg-transparent px-3 pr-8 text-sm outline-none",
          "disabled:cursor-not-allowed",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute right-2 h-4 w-4" />
    </div>
  );
});
