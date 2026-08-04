"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { AnalyticsQuestionItem } from "@/lib/types";
import { formatCount } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

interface QuestionTableProps {
  items: AnalyticsQuestionItem[];
  /** Что показывать в правой колонке: «Раз» для частых, «Формулировок» и т.п. */
  countHeader?: string;
}

/**
 * Таблица вопросов к гиду.
 *
 * Своя вёрстка, а не `DataTable`: у вопроса есть раскрывающийся список
 * формулировок кластера, а таблица админ-каталога строк-подстрок не умеет.
 *
 * Текст вопроса не обрезаем в одну строку — заказчику важно прочитать
 * формулировку целиком; вместо этого ограничиваем ширину колонки, чтобы
 * длинный вопрос переносился, а не разрывал таблицу.
 */
export function QuestionTable({ items, countHeader = "Раз" }: QuestionTableProps) {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="border-border overflow-x-auto border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted text-muted-foreground border-b text-left">
            <th className="px-3 py-2 font-medium tracking-wide">Вопрос</th>
            <th className="w-24 px-3 py-2 text-right font-medium tracking-wide whitespace-nowrap">
              {countHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const variants = item.variants ?? [];
            const open = expanded.has(i);
            return (
              <React.Fragment key={`${item.question}-${i}`}>
                <tr className="border-border border-b align-top last:border-0">
                  <td className="px-3 py-2">
                    <p className="max-w-2xl">{item.question}</p>
                    {variants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        aria-expanded={open}
                        className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs transition-colors"
                      >
                        <ChevronDown
                          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
                        />
                        {open
                          ? "Свернуть формулировки"
                          : `Ещё ${variants.length} ${formsWord(variants.length)}`}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCount(item.count)}</td>
                </tr>
                {open && (
                  <tr className="border-border bg-muted/40 border-b last:border-0">
                    <td colSpan={2} className="px-3 py-2">
                      <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                        {variants.map((v, vi) => (
                          <li key={vi} className="max-w-2xl">
                            {v}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** «1 формулировка», «3 формулировки», «7 формулировок». */
function formsWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "формулировок";
  if (mod10 === 1) return "формулировка";
  if (mod10 >= 2 && mod10 <= 4) return "формулировки";
  return "формулировок";
}
