"use client";

import * as React from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

/** Переставить элемент массива, не мутируя исходный. */
function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

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
  /**
   * Включает перетаскивание строк за ручку. Получает строки в новом порядке —
   * сохранение на сервере остаётся за родителем.
   */
  onReorder?: (rows: T[]) => void;
}

/**
 * Простая адаптивная таблица для админ-разделов с действиями строки.
 *
 * `onRowClick` — увеличенная зона попадания для мыши и тача. Роль кнопки на
 * <tr> намеренно не вешаем: внутри строки уже лежат кнопки действий, и вложенные
 * интерактивные элементы ломают навигацию с клавиатуры. Клавиатурный путь
 * остаётся прежним — через кнопку «Редактировать».
 *
 * `onReorder` — перетаскивание на нативном HTML5 drag-and-drop, без внешних
 * зависимостей. `draggable` включается только пока зажата ручка, иначе строка
 * перехватывала бы выделение текста. Для клавиатуры ручка — фокусируемая кнопка
 * со стрелками вверх/вниз. Тач-жеста нет: HTML5 DnD его не поддерживает, а
 * админкой пользуются с десктопа.
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
  onReorder,
}: DataTableProps<T>) {
  const [dragArmed, setDragArmed] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  function resetDrag() {
    setDragArmed(false);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDrop(target: number) {
    if (dragIndex !== null && dragIndex !== target) onReorder?.(move(rows, dragIndex, target));
    resetDrag();
  }

  function handleHandleKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (delta === 0) return;
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    e.preventDefault();
    onReorder?.(move(rows, index, target));
  }

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
            {onReorder && <th className="w-9 px-1 py-2" />}
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
          {rows.map((row, rowIndex) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              draggable={dragArmed}
              onDragStart={(e) => {
                setDragIndex(rowIndex);
                e.dataTransfer.effectAllowed = "move";
                // Firefox не начинает перетаскивание без установленных данных.
                e.dataTransfer.setData("text/plain", String(rowIndex));
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                setOverIndex(rowIndex);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(rowIndex);
              }}
              onDragEnd={resetDrag}
              className={cn(
                "border-border hover:bg-muted/50 border-b last:border-0",
                onRowClick && "cursor-pointer",
                dragIndex === rowIndex && "opacity-40",
                overIndex === rowIndex &&
                  dragIndex !== rowIndex &&
                  "border-accent border-b-2 last:border-b-2",
              )}
            >
              {onReorder && (
                // Ручка не должна открывать форму редактирования по клику строки.
                <td className="w-9 px-1 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label={`Переместить: ${rowIndex + 1} из ${rows.length}. Стрелки вверх и вниз меняют позицию.`}
                    onMouseDown={() => setDragArmed(true)}
                    onMouseUp={() => setDragArmed(false)}
                    onKeyDown={(e) => handleHandleKeyDown(e, rowIndex)}
                    className="text-muted-foreground hover:text-foreground hover:bg-border inline-flex h-7 w-7 cursor-grab items-center justify-center transition-colors active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
              )}
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
