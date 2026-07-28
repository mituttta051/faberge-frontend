"use client";

import { MapPin } from "lucide-react";
import type { ChatLocation } from "@/lib/types";

interface Props {
  location: ChatLocation;
}

/** Навигационная подсказка «зал + витрина» под ответом гида (C24). */
export function LocationHint({ location }: Props) {
  const parts: string[] = [];
  if (location.hallNumber != null) {
    parts.push(`Зал ${location.hallNumber}` + (location.hallName ? ` «${location.hallName}»` : ""));
  } else if (location.hallName) {
    parts.push(`Зал «${location.hallName}»`);
  }
  if (location.showcaseNumber != null) parts.push(`витрина ${location.showcaseNumber}`);
  if (parts.length === 0) return null;

  return (
    <div className="border-border bg-background text-foreground mt-2 flex items-center gap-2 border px-3 py-2 text-xs">
      <MapPin className="text-accent h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0">
        <span className="text-muted-foreground">Где искать: </span>
        {parts.join(", ")}
      </span>
    </div>
  );
}
