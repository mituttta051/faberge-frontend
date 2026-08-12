"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import type { AnalyticsRange } from "@/lib/api/analytics";
import { PRESET_LABELS, detectPreset, presetRange, type RangePreset } from "@/lib/admin/date-range";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Пауза в наборе, после которой период уходит в URL. */
const COMMIT_DELAY_MS = 500;

interface DateRangeFilterProps {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

/**
 * Фильтр периода: пресеты + произвольные даты.
 *
 * Пресеты закрывают повседневный сценарий («что было за неделю»), поля с датами —
 * отчётный («выгрузи июль»). Произвольные поля показываем всегда, а не прячем за
 * кнопкой «Период…»: иначе администратор не видит, какими именно датами
 * ограничен отчёт, когда пришёл по ссылке с чужим периодом.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const active = detectPreset(value);
  const { from, to } = value;

  /**
   * Черновик полей с датами.
   *
   * Пока дата набрана не до конца, `input type="date"` отдаёт пустую строку.
   * Период живёт в URL, поэтому такая пустая строка сразу уезжала в адрес и
   * возвращалась в поле — браузер стирал уже набранные сегменты, и ввести дату
   * с клавиатуры было невозможно (баг-репорт 06.08.2026). Держим набор внутри
   * компонента и отдаём наружу только законченную дату.
   */
  const [draft, setDraft] = React.useState<AnalyticsRange>({ from, to });

  // Что сейчас применено — для сравнения из отложенного коммита, куда props
  // приезжают только теми, какими были в момент набора.
  const applied = React.useRef<AnalyticsRange>({ from, to });
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = React.useRef<AnalyticsRange | null>(null);

  React.useEffect(() => {
    applied.current = { from, to };
    setDraft({ from, to });
  }, [from, to]);

  React.useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function push(next: AnalyticsRange) {
    const now = applied.current;
    if (next.from !== now.from || next.to !== now.to) onChange(next);
  }

  /**
   * Применить период: сразу или после паузы в наборе.
   *
   * Пауза нужна из-за года: пока набираешь 2026, поле успевает побывать 0002,
   * 0020 и 0202 — это законченные даты, и без задержки каждая уезжала в URL и
   * дёргала все семь отчётов. Пресеты и уход из поля применяются немедленно.
   */
  function commit(next: AnalyticsRange, delay = 0) {
    setDraft(next);
    clearTimeout(timer.current ?? undefined);
    timer.current = null;
    pending.current = null;
    if (delay === 0) {
      push(next);
      return;
    }
    pending.current = next;
    timer.current = setTimeout(() => {
      timer.current = null;
      const queued = pending.current;
      pending.current = null;
      if (queued) push(queued);
    }, delay);
  }

  /** Не ждать паузу: дальше уже не наберут. */
  function flush() {
    const queued = pending.current;
    clearTimeout(timer.current ?? undefined);
    timer.current = null;
    pending.current = null;
    if (queued) push(queued);
  }

  function pick(preset: Exclude<RangePreset, "custom">) {
    commit(presetRange(preset));
  }

  function edit(field: "from" | "to", raw: string) {
    const date = raw || undefined;
    const next: AnalyticsRange =
      field === "from" ? { ...draft, from: date } : { ...draft, to: date };
    setDraft(next);
    // Пустое поле — это либо середина набора, либо осознанная очистка;
    // отличить их можно только по уходу из поля, см. leave().
    if (!date) return;
    // Перевёрнутый период набирается только с клавиатуры — в календаре его
    // закрывают min/max. Снимаем противоположную границу вместо того, чтобы
    // молча не применить ввод: пустая граница у нас значит «без ограничения».
    if (next.from && next.to && next.from > next.to) {
      commit(field === "from" ? { from: next.from } : { to: next.to }, COMMIT_DELAY_MS);
      return;
    }
    commit(next, COMMIT_DELAY_MS);
  }

  function leave(el: HTMLInputElement) {
    // Законченная дата ждёт в отложенном коммите — применяем не дожидаясь паузы.
    if (el.value) {
      flush();
      return;
    }
    // Пустое поле — снятая граница: «с начала» или «по сегодня». Заодно стираем
    // недобранные сегменты: Chrome держит их на экране, хотя value уже пустой,
    // и получалась дата, которой нет в отчёте.
    el.value = "";
    commit(draft);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(PRESET_LABELS) as Exclude<RangePreset, "custom">[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => pick(preset)}
            className={cn(
              "border px-3 py-2 text-sm transition-colors",
              active === preset
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-muted",
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <CalendarRange className="text-muted-foreground h-4 w-4 shrink-0" />
        <Input
          type="date"
          aria-label="Начало периода"
          value={draft.from ?? ""}
          max={draft.to || undefined}
          onChange={(e) => edit("from", e.target.value)}
          onBlur={(e) => leave(e.target)}
          className="w-40"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          aria-label="Конец периода"
          value={draft.to ?? ""}
          min={draft.from || undefined}
          onChange={(e) => edit("to", e.target.value)}
          onBlur={(e) => leave(e.target)}
          className="w-40"
        />
      </div>
    </div>
  );
}
