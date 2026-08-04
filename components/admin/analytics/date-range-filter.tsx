"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import type { AnalyticsRange } from "@/lib/api/analytics";
import { PRESET_LABELS, detectPreset, presetRange, type RangePreset } from "@/lib/admin/date-range";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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

  function pick(preset: Exclude<RangePreset, "custom">) {
    onChange(presetRange(preset));
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
          value={value.from ?? ""}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          className="w-40"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          aria-label="Конец периода"
          value={value.to ?? ""}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          className="w-40"
        />
      </div>
    </div>
  );
}
