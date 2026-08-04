import type { AnalyticsRange } from "@/lib/api/analytics";

/**
 * Период для отчётов аналитики.
 *
 * Границы — календарные даты (`YYYY-MM-DD`), а не таймстемпы: заказчик мыслит
 * днями работы музея, и отчёт «с 1 по 31 июля» не должен зависеть от того, в
 * котором часу его открыли.
 */

export type RangePreset = "today" | "7d" | "30d" | "all" | "custom";

export const PRESET_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  all: "Всё время",
};

/**
 * Дата в `YYYY-MM-DD` по местному времени.
 *
 * Не `toISOString().slice(0, 10)`: тот переводит в UTC, и вечером по Москве
 * «сегодня» превращалось бы в завтрашний день.
 */
export function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Границы пресета. «Всё время» — пустой диапазон, бэкенд считает по всей таблице. */
export function presetRange(preset: Exclude<RangePreset, "custom">): AnalyticsRange {
  const today = isoDate(new Date());
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: isoDate(daysAgo(6)), to: today };
    case "30d":
      return { from: isoDate(daysAgo(29)), to: today };
    case "all":
      return {};
  }
}

/** Какому пресету соответствует период — чтобы подсветить активную кнопку. */
export function detectPreset(range: AnalyticsRange): RangePreset {
  if (!range.from && !range.to) return "all";
  for (const p of ["today", "7d", "30d"] as const) {
    const r = presetRange(p);
    if (r.from === range.from && r.to === range.to) return p;
  }
  return "custom";
}

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

/** «1 июля — 31 июля» для подписи над отчётами. */
export function formatRangeLabel(range: AnalyticsRange): string {
  if (!range.from && !range.to) return "за всё время";
  const from = range.from ? DATE_FMT.format(new Date(range.from)) : "начало";
  const to = range.to ? DATE_FMT.format(new Date(range.to)) : "сегодня";
  return from === to ? from : `${from} — ${to}`;
}
