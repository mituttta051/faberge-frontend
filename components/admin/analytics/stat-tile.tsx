import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatTileProps {
  label: string;
  value: string;
  /** Пояснение под числом: из чего оно посчитано. */
  hint?: string;
  /**
   * Как считается метрика — целиком, человеческими словами.
   *
   * Формулировки берём из `docs/analytics-metrics.md` бэкенда дословно: их
   * сверяли с кодом расчёта, и пересказ своими словами разошёлся бы с цифрой.
   */
  about?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Плитка ключевой цифры на дашборде.
 *
 * `hint` не украшение: «конверсия в диалог 43 %» без подписи «доля сессий,
 * где открывали чат» читается как угодно, и заказчик считает её по-своему.
 */
export function StatTile({ label, value, hint, about, loading, className }: StatTileProps) {
  return (
    <div className={cn("border-border bg-background flex flex-col gap-1 border p-4", className)}>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-widest uppercase">
        {label}
        {about && (
          // Подсказка нативным title: панель открывают с ноутбука, а свой
          // тултип ради одной строки тянул бы за собой позиционирование и
          // закрытие по клику вне. Текст дублируем в aria-label — с экранным
          // диктором иконка без него читается как «изображение».
          <span
            tabIndex={0}
            role="note"
            title={about}
            aria-label={`${label}: ${about}`}
            className="text-muted-foreground/70 hover:text-foreground focus-visible:text-foreground inline-flex cursor-help transition-colors outline-none"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-20" />
      ) : (
        <p className="font-display text-3xl tabular-nums">{value}</p>
      )}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
