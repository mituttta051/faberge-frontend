import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatTileProps {
  label: string;
  value: string;
  /** Пояснение под числом: из чего оно посчитано. */
  hint?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Плитка ключевой цифры на дашборде.
 *
 * `hint` не украшение: «конверсия в диалог 43 %» без подписи «доля сессий,
 * где открывали чат» читается как угодно, и заказчик считает её по-своему.
 */
export function StatTile({ label, value, hint, loading, className }: StatTileProps) {
  return (
    <div className={cn("border-border bg-background flex flex-col gap-1 border p-4", className)}>
      <p className="text-muted-foreground text-xs tracking-widest uppercase">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-20" />
      ) : (
        <p className="font-display text-3xl tabular-nums">{value}</p>
      )}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
