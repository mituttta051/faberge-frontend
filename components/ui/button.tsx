"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary disabled:bg-primary/40 hover:shadow-sm active:shadow-none",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-muted hover:border-foreground/30 active:bg-border disabled:opacity-50",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent disabled:opacity-50 hover:shadow-sm active:shadow-none",
  ghost: "bg-transparent text-foreground hover:bg-muted active:bg-border disabled:opacity-50",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "group/btn inline-flex shrink-0 items-center justify-center font-medium",
        "transition-all duration-300 ease-out select-none",
        "active:translate-y-px",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:active:translate-y-0",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "lg" ? "md" : "sm"} />
      ) : leftIcon ? (
        <span className="inline-flex transition-transform duration-300 ease-out group-hover/btn:-translate-x-0.5">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="inline-flex transition-transform duration-300 ease-out group-hover/btn:translate-x-1">
          {rightIcon}
        </span>
      )}
    </button>
  );
});
