import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-muted-foreground border-border",
  outline: "bg-transparent text-foreground border-foreground",
  accent: "bg-accent text-accent-foreground border-accent",
  destructive: "bg-destructive text-destructive-foreground border-destructive",
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center border px-2 text-[10px] font-medium tracking-widest uppercase",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
