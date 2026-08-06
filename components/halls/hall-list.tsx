"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { hallTitle } from "@/lib/labels";
import type { Hall } from "@/lib/types";

/**
 * Список залов выбранной экспозиции — сразу целиком, без промежуточного выбора.
 *
 * Карточка зала целиком — ссылка на страницу зала: раскрытие на месте заказчик
 * попросил убрать, там дублировалось то же, что и на самой странице
 * (баг-репорт 06.08.2026, «Список залов»). Заодно ушли по два запроса витрин
 * и экспонатов на каждый раскрытый зал.
 */
export function HallList({ halls, isLoading }: { halls?: Hall[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <ul className="border-border flex flex-col border-t">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="border-border flex items-center gap-3 border-b px-1 py-3">
            <Skeleton className="h-14 w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2 h-3.5 w-40" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!halls?.length) {
    return <p className="text-muted-foreground text-sm">В этой экспозиции пока нет залов.</p>;
  }

  return (
    <ul className="border-border flex flex-col border-t">
      {halls.map((hall) => (
        <HallRow key={hall.id} hall={hall} />
      ))}
    </ul>
  );
}

function HallRow({ hall }: { hall: Hall }) {
  return (
    <li className="border-border border-b">
      <Link
        href={`/halls/${hall.id}`}
        className="hover:bg-muted flex w-full items-center gap-3 px-1 py-3 transition-colors"
      >
        <div className="border-border relative h-14 w-20 shrink-0 overflow-hidden border">
          {hall.coverImageUrl && (
            <Image
              src={hall.coverImageUrl}
              alt=""
              width={200}
              height={140}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* Номер зала заказчик просил убрать — остаётся только название.
              Пометка временной выставки не про нумерацию и остаётся. */}
          {hall.isTemporary && (
            <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
              <span className="border-border border px-1.5 py-px tracking-normal normal-case">
                временная
              </span>
            </p>
          )}
          <p className="mt-0.5 truncate text-sm font-medium">{hallTitle(hall)}</p>
        </div>
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      </Link>
    </li>
  );
}
