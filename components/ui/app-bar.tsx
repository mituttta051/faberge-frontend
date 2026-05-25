"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

interface AppBarProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  /** Если задан — слева отрисуется back-кнопка с этим обработчиком. */
  onBack?: () => void;
  /** Прозрачный header без border и фона (для hero-страниц с фото) */
  transparent?: boolean;
  className?: string;
}

export function AppBar({
  left,
  title,
  right,
  onBack,
  transparent = false,
  className,
}: AppBarProps) {
  const resolvedLeft =
    left ??
    (onBack ? (
      <IconButton aria-label="Назад" variant="ghost" size="md" onClick={onBack}>
        <ChevronLeft />
      </IconButton>
    ) : null);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 px-2",
        transparent ? "bg-transparent" : "border-border bg-background/95 border-b backdrop-blur",
        className,
      )}
    >
      <div className="flex min-w-11 items-center justify-start">{resolvedLeft}</div>
      <div className="font-display flex-1 truncate text-center text-base tracking-tight">
        {title}
      </div>
      <div className="flex min-w-11 items-center justify-end">{right}</div>
    </header>
  );
}
