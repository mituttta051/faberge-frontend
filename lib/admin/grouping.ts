import type { Hall } from "@/lib/types";

/** Группа списка админки: зал + принадлежащие ему строки. */
export interface HallGroup<T> {
  /** Зал группы; `null` — корзина для строк без зала (или с удалённым залом). */
  hall: Hall | null;
  rows: T[];
}

/**
 * Разложить плоский список по залам для сворачиваемых групп.
 *
 * Порядок групп = порядок массива `halls`: сервер уже отдаёт залы по
 * `sort_order` (drag-n-drop в админке, C11), и пересортировывать их по номеру
 * здесь нельзя — это перебило бы заданный администратором порядок.
 * Строки внутри группы идут по `compareRows`. Пустые залы остаются в
 * результате: администратору нужно видеть, что зал есть, но пуст. Строки без
 * зала уезжают в последнюю группу с `hall: null`.
 */
export function groupByHall<T>(
  rows: T[],
  halls: Hall[],
  hallIdOf: (row: T) => number | undefined,
  compareRows?: (a: T, b: T) => number,
): HallGroup<T>[] {
  const buckets = new Map<number, T[]>(halls.map((h) => [h.id, []]));
  const orphans: T[] = [];

  for (const row of rows) {
    const hallId = hallIdOf(row);
    const bucket = hallId !== undefined ? buckets.get(hallId) : undefined;
    if (bucket) bucket.push(row);
    else orphans.push(row);
  }

  const groups: HallGroup<T>[] = halls.map((hall) => ({
    hall,
    rows: buckets.get(hall.id) ?? [],
  }));

  if (orphans.length > 0) groups.push({ hall: null, rows: orphans });
  if (compareRows) groups.forEach((g) => g.rows.sort(compareRows));

  return groups;
}
