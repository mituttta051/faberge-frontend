"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary hover:shadow-sm active:shadow-none",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-muted hover:border-foreground/30 active:bg-border",
  ghost: "bg-transparent text-foreground hover:bg-muted active:bg-border",
} as const;

const sizes = {
  sm: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
  md: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-12 w-12 [&_svg]:h-6 [&_svg]:w-6",
} as const;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant = "ghost", size = "md", type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        "transition-all duration-300 ease-out select-none",
        "active:translate-y-px",
        "focus:outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
