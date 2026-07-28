"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ChatExhibitRef } from "@/lib/types";

interface Props {
  items: ChatExhibitRef[];
  /** Не показывать экспонат с этим id (обсуждаемый в контексте). */
  excludeId?: number;
  limit?: number;
  /** Заголовок над списком. По умолчанию — «Упомянуто в ответе» (C23). */
  label?: string;
}

function locationLabel(e: ChatExhibitRef): string | null {
  const parts: string[] = [];
  if (e.hallNumber != null) parts.push(`зал ${e.hallNumber}`);
  if (e.showcaseNumber != null) parts.push(`витрина ${e.showcaseNumber}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Плашки-ссылки на карточки экспонатов, упомянутых в ответе гида (C23). */
export function ReferencedExhibits({ items, excludeId, limit = 4, label = "Упомянуто в ответе" }: Props) {
  const list = items.filter((e) => e.id !== excludeId).slice(0, limit);
  if (list.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">{label}</p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {list.map((e) => {
          const where = locationLabel(e);
          return (
            <li key={e.id}>
              <Link
                href={`/exhibits/${e.id}`}
                className="group/ref border-border hover:border-foreground/40 bg-background flex items-stretch gap-2.5 border transition-colors"
              >
                {e.thumbnailUrl ? (
                  <div className="border-border relative aspect-square w-12 shrink-0 overflow-hidden border-r">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/ref:scale-105"
                    />
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="group-hover/ref:text-accent line-clamp-1 text-xs leading-snug transition-colors">
                      {e.exhibitNumber ? `№${e.exhibitNumber} ` : ""}
                      {e.name}
                    </p>
                    {where && <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{where}</p>}
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover/ref:text-foreground h-4 w-4 shrink-0 transition-colors" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
