"use client";

import Link from "next/link";
import type { ChatHallRef } from "@/lib/types";

interface Props {
  items: ChatHallRef[];
}

/** Список залов из структурированного ответа гида (C25) — ссылки на /halls/[id]. */
export function ReferencedHalls({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">Залы</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((h) => (
          <li key={h.id}>
            <Link
              href={`/halls/${h.id}`}
              className="border-border hover:border-foreground/40 hover:text-accent bg-background block border px-2.5 py-1 text-xs transition-colors"
            >
              <span className="text-muted-foreground">№{h.hallNumber}</span>
              {h.name ? ` ${h.name}` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
