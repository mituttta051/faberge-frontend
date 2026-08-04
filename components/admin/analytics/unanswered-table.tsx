"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AnalyticsUnansweredItem } from "@/lib/types";
import { formatCount } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";

/** Расшифровка причин отказа гида (`fail_reason` бэкенда). */
const REASON_LABELS: Record<string, string> = {
  no_context: "Нет контекста",
  llm_refusal: "Отказ модели",
  not_found: "Экспонат не найден",
  error: "Ошибка",
};

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

/**
 * Вопросы, на которые гид не смог ответить.
 *
 * Причин у строки может быть несколько: кластер собирает формулировки за весь
 * период, и один и тот же по смыслу вопрос мог упереться то в отсутствие
 * справки, то в отказ модели. Показываем все с числами — «нет контекста ×7»
 * означает «допишите описание», а «отказ модели ×7» — совсем другую работу.
 *
 * Ссылка на карточку ведёт в админку, а не в приложение посетителя: смысл
 * отчёта в том, чтобы сразу пойти и дописать описание экспоната.
 */
export function UnansweredTable({ items }: { items: AnalyticsUnansweredItem[] }) {
  return (
    <div className="border-border overflow-x-auto border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted text-muted-foreground border-b text-left">
            <th className="px-3 py-2 font-medium tracking-wide">Вопрос</th>
            <th className="hidden px-3 py-2 font-medium tracking-wide md:table-cell">Экспонаты</th>
            <th className="hidden w-52 px-3 py-2 font-medium tracking-wide md:table-cell">
              Причины
            </th>
            <th className="w-20 px-3 py-2 text-right font-medium tracking-wide">Раз</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const reasons = Object.entries(item.failReasons).sort((a, b) => b[1] - a[1]);
            return (
              <tr
                key={`${item.question}-${i}`}
                className="border-border border-b align-top last:border-0"
              >
                <td className="max-w-md px-3 py-2">
                  <p>{item.question}</p>
                  {item.variants.length > 0 && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Также: {item.variants.join(" · ")}
                    </p>
                  )}
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  {item.exhibits.length === 0 ? (
                    <span className="text-muted-foreground">Без привязки</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {item.exhibits.map((e) => (
                        <li key={e.id ?? e.name}>
                          {e.id === undefined ? (
                            <span>{e.name ?? "—"}</span>
                          ) : (
                            <Link
                              href={`/admin/exhibits?exhibit=${e.id}`}
                              className="hover:text-accent inline-flex items-center gap-1 underline underline-offset-2"
                            >
                              {e.name ?? `Экспонат ${e.id}`}
                              <ArrowUpRight className="h-3 w-3 shrink-0" />
                            </Link>
                          )}
                          {e.count > 1 && (
                            <span className="text-muted-foreground ml-1 text-xs tabular-nums">
                              ×{e.count}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  {reasons.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {reasons.map(([reason, count]) => (
                        <Badge key={reason}>
                          {reasonLabel(reason)}
                          {count > 1 && <span className="ml-1 tabular-nums">×{count}</span>}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(item.count)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
