"use client";

import Link from "next/link";
import type { Exhibit } from "@/lib/types";

interface Props {
  items: Exhibit[];
  /** Не показывать экспонат с этим id (текущий контекст диалога). */
  excludeId?: number;
  /** Сколько карточек максимум. */
  limit?: number;
}

/** Мини-карусель «Похожие экспонаты» под последним ответом AI-гида. */
export function RelatedRecommendations({ items, excludeId, limit = 3 }: Props) {
  const list = items.filter((e) => e.id !== excludeId).slice(0, limit);
  if (list.length === 0) return null;

  return (
    <div className="mt-3 pl-11">
      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
        Похожие экспонаты
      </p>
      <ul className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {list.map((ex) => (
          <li key={ex.id} className="w-32 shrink-0">
            <Link
              href={`/exhibits/${ex.id}`}
              className="border-border group/rec hover:border-foreground/40 block border transition-all duration-300 ease-out hover:shadow-sm"
            >
              {ex.photoUrl && (
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ex.photoUrl}
                    alt={ex.name}
                    className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover/rec:scale-105"
                  />
                </div>
              )}
              <p className="group-hover/rec:text-accent p-2 text-[11px] leading-tight transition-colors">
                {ex.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
