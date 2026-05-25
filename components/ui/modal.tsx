"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { useBodyScrollLock, useEscapeKey, useMountedVisible } from "@/lib/hooks/use-mounted-portal";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  dismissible = true,
  className,
}: ModalProps) {
  const { mounted, visible } = useMountedVisible(open, 200);
  useBodyScrollLock(mounted);
  useEscapeKey(mounted && dismissible, () => onOpenChange(false));

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={dismissible ? () => onOpenChange(false) : undefined}
      />
      <div
        className={cn(
          "border-border bg-background relative flex w-full max-w-sm flex-col border shadow-lg",
          "transition-all duration-200 ease-out",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
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
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
