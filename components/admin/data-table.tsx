"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Скрывать колонку на узких экранах. */
  hideOnMobile?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  loading?: boolean;
  emptyLabel?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** Клик в любом месте строки. Кнопки действий продолжают работать как раньше. */
  onRowClick?: (row: T) => void;
  /** Таблица вложена в аккордеон — рамку и фон шапки рисует родитель. */
  embedded?: boolean;
}

/**
 * Простая адаптивная таблица для админ-разделов с действиями строки.
 *
 * `onRowClick` — увеличенная зона попадания для мыши и тача. Роль кнопки на
 * <tr> намеренно не вешаем: внутри строки уже лежат кнопки действий, и вложенные
 * интерактивные элементы ломают навигацию с клавиатуры. Клавиатурный путь
 * остаётся прежним — через кнопку «Редактировать».
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyLabel = "Пока пусто.",
  onEdit,
  onDelete,
  onRowClick,
  embedded,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground py-16 text-center text-sm",
          !embedded && "border-border border border-dashed",
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const hasActions = !!onEdit || !!onDelete;

  return (
    <div className={cn("overflow-x-auto", !embedded && "border-border border")}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted border-b text-left">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "text-muted-foreground px-3 py-2 font-medium tracking-wide whitespace-nowrap",
                  col.hideOnMobile && "hidden md:table-cell",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
            {hasActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-border hover:bg-muted/50 border-b last:border-0",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((col, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-3 py-2 align-top",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
              {hasActions && (
                // Клик по действиям не должен всплывать в onRowClick: «Удалить»
                // иначе открыло бы ещё и форму редактирования под диалогом.
                <td
                  className="px-3 py-2 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        aria-label="Редактировать"
                        onClick={() => onEdit(row)}
                        className="hover:bg-border text-foreground inline-flex h-8 w-8 items-center justify-center transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        aria-label="Удалить"
                        onClick={() => onDelete(row)}
                        className="text-destructive hover:bg-destructive/10 inline-flex h-8 w-8 items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
