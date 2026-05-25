"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { useBodyScrollLock, useEscapeKey, useMountedVisible } from "@/lib/hooks/use-mounted-portal";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Закрывать ли по клику на оверлей. По умолчанию true. */
  dismissible?: boolean;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  dismissible = true,
  className,
}: SheetProps) {
  const { mounted, visible } = useMountedVisible(open, 300);
  useBodyScrollLock(mounted);
  useEscapeKey(mounted && dismissible, () => onOpenChange(false));

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end" aria-modal="true" role="dialog">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={dismissible ? () => onOpenChange(false) : undefined}
      />
      <div
        className={cn(
          "border-border bg-background relative flex max-h-[85vh] flex-col border-t shadow-lg",
          "transition-transform duration-300 ease-out",
          "pb-[env(safe-area-inset-bottom)]",
          visible ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {(title || dismissible) && (
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-display text-base tracking-tight">{title}</h2>
            {dismissible && (
              <IconButton
                aria-label="Закрыть"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X />
              </IconButton>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
