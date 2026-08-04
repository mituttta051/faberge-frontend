"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { AnalyticsExhibitRow, AnalyticsExhibitsOrder } from "@/lib/types";
import { formatCount } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/** Порядок сортировки — тот же, что понимает `GET /admin/analytics/exhibits`. */
export type ExhibitsOrder = AnalyticsExhibitsOrder;

interface ExhibitsTableProps {
  items: AnalyticsExhibitRow[];
  order: ExhibitsOrder;
  onOrderChange: (order: ExhibitsOrder) => void;
  hasMore?: boolean;
  onShowMore?: () => void;
}

/**
 * Экспонаты: просмотры, вопросы к гиду, озвучки, распознавания.
 *
 * Сортировку делает бэкенд, а не таблица: «почти не открывают» — это экспонаты
 * с нулём просмотров, которых в текущей выдаче может не быть вовсе, и
 * пересортировать загруженную страницу для них недостаточно.
 */
export function ExhibitsTable({
  items,
  order,
  onOrderChange,
  hasMore,
  onShowMore,
}: ExhibitsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="border-border overflow-x-auto border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border bg-muted text-muted-foreground border-b text-left">
              <th className="px-3 py-2 font-medium tracking-wide">Экспонат</th>
              <th className="hidden w-20 px-3 py-2 text-right font-medium tracking-wide md:table-cell">
                Зал
              </th>
              {/* Одна колонка на два порядка: клик переключает «сначала
                  популярные» ↔ «сначала те, что почти не открывают». */}
              <SortableHeader
                label="Просмотры"
                active={order === "views" || order === "asc"}
                direction={order === "asc" ? "asc" : "desc"}
                onClick={() => onOrderChange(order === "views" ? "asc" : "views")}
              />
              <SortableHeader
                label="Вопросы"
                active={order === "questions"}
                direction="desc"
                onClick={() => onOrderChange("questions")}
              />
              <th className="hidden w-24 px-3 py-2 text-right font-medium tracking-wide md:table-cell">
                Озвучки
              </th>
              <th className="hidden w-28 px-3 py-2 text-right font-medium tracking-wide md:table-cell">
                Распознан
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-border border-b align-top last:border-0">
                <td className="max-w-sm px-3 py-2">
                  <Link
                    href={`/admin/exhibits?exhibit=${row.id}`}
                    className="hover:text-accent underline underline-offset-2"
                  >
                    {row.name ?? `Экспонат ${row.id}`}
                  </Link>
                </td>
                <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">
                  {row.hallNumber ?? "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right tabular-nums",
                    // Ноль просмотров — то, ради чего заказчик просил этот отчёт.
                    row.views === 0 && "text-destructive",
                  )}
                >
                  {formatCount(row.views)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.questions)}</td>
                <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">
                  {formatCount(row.ttsPlays)}
                </td>
                <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">
                  {formatCount(row.recognitions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && onShowMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="border-border hover:bg-muted self-start border px-3 py-2 text-sm transition-colors"
        >
          Показать ещё
        </button>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="w-28 px-3 py-2 text-right font-medium tracking-wide">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 transition-colors",
          active && "text-foreground",
        )}
      >
        {label}
        {active && <Icon className="h-3 w-3" />}
      </button>
    </th>
  );
}
