"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useHallExhibits, useHallShowcases } from "@/lib/api/hooks";
import { byShowcaseNumber, hallNumberCaption, hallTitle, showcaseTitle } from "@/lib/labels";
import type { Exhibit, Hall, Showcase } from "@/lib/types";

/**
 * Список залов выбранной экспозиции — сразу целиком, без промежуточного выбора.
 * Каждый зал раскрывается на месте: описание, витрины и их экспонаты видны, не
 * уводя посетителя на другой экран (баг-репорт 28.07.2026, «Главный экран», п.4).
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
  const [open, setOpen] = useState(false);
  const title = hallTitle(hall);
  const numberCaption = hallNumberCaption(hall);
  // Витрины и экспонаты тянем только у раскрытого зала — иначе первый экран
  // отправил бы по два запроса на каждый из десяти залов.
  const { data: showcases, isLoading: showcasesLoading } = useHallShowcases(
    open ? hall.id : undefined,
  );
  const { data: exhibits, isLoading: exhibitsLoading } = useHallExhibits(
    open ? hall.id : undefined,
  );

  return (
    <li className="border-border border-b">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-muted flex w-full items-center gap-3 px-1 py-3 text-left transition-colors"
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
          {(numberCaption || hall.isTemporary) && (
            <p className="text-muted-foreground flex items-center gap-2 text-[10px] tracking-widest uppercase">
              {numberCaption}
              {hall.isTemporary && (
                <span className="border-border border px-1.5 py-px tracking-normal normal-case">
                  временная
                </span>
              )}
            </p>
          )}
          <p className="mt-0.5 truncate text-sm font-medium">{title}</p>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-4 px-1 pb-4">
          {hall.description && (
            // Описания залов из каталога — на несколько экранов текста; в раскрытии
            // показываем начало, полное — на странице зала.
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
              {hall.description}
            </p>
          )}

          {showcasesLoading || exhibitsLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : (
            <HallShowcases showcases={showcases} exhibits={exhibits} />
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/halls/${hall.id}`}
              className="border-border hover:bg-muted border px-3 py-2 text-xs tracking-widest uppercase transition-colors"
            >
              Открыть зал
            </Link>
            <Link
              href={`/chat?hall=${hall.id}`}
              className="border-border hover:bg-muted border px-3 py-2 text-xs tracking-widest uppercase transition-colors"
            >
              Спросить AI-гида
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

function HallShowcases({ showcases, exhibits }: { showcases?: Showcase[]; exhibits?: Exhibit[] }) {
  const items = exhibits ?? [];
  const known = new Set((showcases ?? []).map((s) => s.id));
  // Экспонаты вне витрин — в путеводителе это отдельная группа с пустым квадратом.
  const loose = items.filter((e) => e.showcaseId === undefined || !known.has(e.showcaseId));
  const hasUnnumberedShowcase = (showcases ?? []).some((s) => s.showcaseNumber == null);

  if (!showcases?.length && !items.length) {
    return <p className="text-muted-foreground text-xs">Состав зала пока не заполнен.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {[...(showcases ?? [])].sort(byShowcaseNumber).map((s) => (
        <ShowcaseGroup
          key={s.id}
          title={showcaseTitle(s)}
          subtitle={s.name}
          items={items.filter((e) => e.showcaseId === s.id)}
        />
      ))}
      {/* Экспонаты, не привязанные ни к одной витрине. Когда у зала есть витрина
          без номера, «не в витринах» уже пришло от бэкенда — второй раз не рисуем. */}
      {loose.length > 0 && !hasUnnumberedShowcase && (
        <ShowcaseGroup title="Не в витринах" items={loose} />
      )}
    </div>
  );
}

function ShowcaseGroup({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Exhibit[];
}) {
  return (
    <div className="border-border border-l pl-3">
      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
        {title}
        {/* У витрины без номера название часто совпадает с заголовком группы —
            «Не в витринах · Не в витринах» читается как ошибка. */}
        {subtitle && subtitle !== title && (
          <span className="tracking-normal normal-case"> · {subtitle}</span>
        )}
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground mt-1 text-xs">Экспонаты не заполнены.</p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {items.map((e) => (
            <li key={e.id}>
              <Link
                href={`/exhibits/${e.id}`}
                className="hover:bg-muted -mx-2 flex items-baseline gap-2 px-2 py-1.5 text-sm"
              >
                {e.exhibitNumber && (
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {e.exhibitNumber}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  {e.name}
                  {e.yearCreated && (
                    <span className="text-muted-foreground"> · {e.yearCreated}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
