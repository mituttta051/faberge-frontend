"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PromptChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  /** Задержка перед появлением, мс. По умолчанию 1000ms — стимулирует интерес после ответа. */
  delayMs?: number;
}

export function PromptChips({ suggestions, onSelect, delayMs = 1000 }: PromptChipsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [suggestions, delayMs]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 transition-opacity duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className={cn(
            "border-border hover:border-foreground/60 hover:bg-muted",
            "active:translate-y-px",
            "border px-3 py-1.5 text-xs transition-all duration-200 ease-out",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
