"use client";

import * as React from "react";
import { Download } from "lucide-react";
import {
  downloadAnalyticsReport,
  type AnalyticsExportFormat,
  type AnalyticsExportReport,
  type AnalyticsRange,
} from "@/lib/api/analytics";
import { cn, errorMessage } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface ExportButtonsProps {
  report: AnalyticsExportReport;
  /** Тот же период, что показан на экране: выгрузка не должна расходиться с таблицей. */
  range: AnalyticsRange;
  className?: string;
}

const FORMATS: { format: AnalyticsExportFormat; label: string }[] = [
  { format: "xlsx", label: "XLSX" },
  { format: "pdf", label: "PDF" },
];

/**
 * Кнопки выгрузки отчёта файлом.
 *
 * Скачивание идёт через fetch с Bearer-токеном, а не обычной ссылкой: к
 * переходу по `<a href>` заголовок авторизации не приложить, а `/admin/**` без
 * него отвечает 401.
 *
 * Ошибку показываем рядом с кнопками, а не глотаем: у PDF есть штатный отказ —
 * бэкенд отвечает 503, если на сервере нет шрифта с кириллицей, и молчаливое
 * бездействие кнопки выглядело бы поломкой панели.
 */
export function ExportButtons({ report, range, className }: ExportButtonsProps) {
  const [busy, setBusy] = React.useState<AnalyticsExportFormat | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function download(format: AnalyticsExportFormat) {
    // Второй клик по той же кнопке заказал бы второй файл: блокируем обе,
    // пока идёт выгрузка.
    if (busy) return;
    setBusy(format);
    setError(null);
    try {
      await downloadAnalyticsReport(report, format, range);
    } catch (err) {
      setError(errorMessage(err, "Не удалось выгрузить отчёт."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <div className="flex items-center gap-2">
        {FORMATS.map(({ format, label }) => (
          <button
            key={format}
            type="button"
            onClick={() => download(format)}
            disabled={busy !== null}
            aria-busy={busy === format}
            title={`Скачать отчёт в формате ${label}`}
            className="border-border hover:bg-muted flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === format ? <Spinner size="sm" /> : <Download className="h-3.5 w-3.5" />}
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-destructive max-w-sm text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
