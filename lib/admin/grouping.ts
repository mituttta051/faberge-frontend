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
 * Залы идут по номеру, строки внутри группы — в порядке `compareRows`.
 * Пустые залы попадают в результат: администратору нужно видеть, что зал есть,
 * но пуст. Строки без зала уезжают в последнюю группу с `hall: null`.
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

  const groups: HallGroup<T>[] = [...halls]
    .sort((a, b) => a.hallNumber - b.hallNumber)
    .map((hall) => ({ hall, rows: buckets.get(hall.id) ?? [] }));

  if (orphans.length > 0) groups.push({ hall: null, rows: orphans });
  if (compareRows) groups.forEach((g) => g.rows.sort(compareRows));

  return groups;
}
