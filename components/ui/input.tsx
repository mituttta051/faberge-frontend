"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightSlot, error, type = "text", disabled, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "group relative flex h-11 items-center border bg-white transition-colors duration-200",
        error ? "border-destructive" : "border-input focus-within:border-foreground",
        disabled && "bg-muted cursor-not-allowed opacity-50",
        className,
      )}
    >
      {leftIcon && (
        <span className="text-muted-foreground pointer-events-none ml-3 inline-flex [&_svg]:h-4 [&_svg]:w-4">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "placeholder:text-muted-foreground flex-1 bg-transparent px-3 text-sm outline-none",
          "disabled:cursor-not-allowed",
        )}
        {...props}
      />
      {rightSlot && <span className="mr-2 inline-flex items-center">{rightSlot}</span>}
    </div>
  );
});
