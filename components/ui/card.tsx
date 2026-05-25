import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-border group/card bg-background border",
        interactive &&
          "hover:border-foreground/40 cursor-pointer transition-all duration-300 ease-out hover:shadow-sm active:translate-y-px",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardMedia({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div className="transition-transform duration-500 ease-out group-hover/card:scale-105">
        {children}
      </div>
    </div>
  );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display group-hover/card:text-accent text-base leading-snug transition-colors duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardSubtitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground mt-1 text-xs", className)} {...props}>
      {children}
    </p>
  );
}
