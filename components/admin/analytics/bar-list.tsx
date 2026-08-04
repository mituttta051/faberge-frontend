import { formatCount } from "@/lib/admin/format";

export interface BarItem {
  key: React.Key;
  label: string;
  count: number;
  /** Подпись справа вместо числа — например «43 %» для долей. */
  valueLabel?: string;
}

/**
 * Список с пропорциональными полосами: топ залов, экранов выхода, корзины
 * длительности.
 *
 * Полоса — фон строки, а не отдельный элемент: так длинное название зала не
 * ужимается ради места под график, а соотношение всё равно читается. Масштаб
 * берём от максимума в списке, а не от суммы — сравнивать нужно позиции между
 * собой, а не долю каждой в целом.
 */
export function BarList({
  items,
  emptyLabel = "Нет данных.",
}: {
  items: BarItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground border-border border border-dashed p-4 text-sm">
        {emptyLabel}
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="border-border flex flex-col border">
      {items.map((item) => (
        <li
          key={item.key}
          className="border-border relative flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-0"
        >
          <span
            aria-hidden
            className="bg-accent/15 absolute inset-y-0 left-0"
            style={{ width: `${(item.count / max) * 100}%` }}
          />
          <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
          <span className="relative tabular-nums">
            {item.valueLabel ?? formatCount(item.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}
