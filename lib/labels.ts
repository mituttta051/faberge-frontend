import type { Exhibit, Hall, Showcase } from "@/lib/types";

/**
 * Наименования зала и витрины в публичной части приложения.
 *
 * Номер зала и номер витрины стали необязательными: у зала «Вне постоянной
 * экспозиции» номера нет, а витрина без номера — это группа «не в витринах»
 * из путеводителя музея. Собрано в одном месте, чтобы нигде не всплыло
 * «Зал № undefined».
 */

/** Надпись с номером зала: «Зал № 3». `null`, если номера нет — подпись прячем. */
export function hallNumberCaption(hall: Pick<Hall, "hallNumber">): string | null {
  return hall.hallNumber != null ? `Зал № ${hall.hallNumber}` : null;
}

/** Заголовок зала: название, иначе номер, иначе просто «Зал». */
export function hallTitle(hall: Pick<Hall, "name" | "hallNumber">): string {
  return hall.name ?? hallNumberCaption(hall) ?? "Зал";
}

/** Заголовок витрины: «Витрина № 2», а без номера — группа «не в витринах». */
export function showcaseTitle(showcase: Pick<Showcase, "showcaseNumber">): string {
  return showcase.showcaseNumber != null ? `Витрина № ${showcase.showcaseNumber}` : "Не в витринах";
}

/** Сортировка витрин: без номера — в конец списка, как в путеводителе. */
export function byShowcaseNumber(a: Showcase, b: Showcase): number {
  return (a.showcaseNumber ?? Infinity) - (b.showcaseNumber ?? Infinity);
}

/**
 * Номер экспоната числом — для сортировки. Без номера — в конец, как у витрин.
 *
 * `exhibitNumber` приходит строкой, поэтому сравнивать надо числа: строковый
 * порядок поставил бы «10» перед «9».
 */
function exhibitOrder(exhibit: Pick<Exhibit, "exhibitNumber">): number {
  const n = Number(exhibit.exhibitNumber);
  return exhibit.exhibitNumber && Number.isFinite(n) ? n : Infinity;
}

/**
 * Сортировка экспонатов по номеру путеводителя.
 *
 * Бэкенд отдаёт экспонаты в порядке `id` — витрина №2 Рыцарского зала приезжает
 * как 6, 2, 8, 1, 3…, и посетитель не может сопоставить список с табличкой в зале.
 */
export function byExhibitNumber(
  a: Pick<Exhibit, "exhibitNumber">,
  b: Pick<Exhibit, "exhibitNumber">,
): number {
  const left = exhibitOrder(a);
  const right = exhibitOrder(b);
  // Равенство отдельной веткой: у двух записей без номера `Infinity - Infinity`
  // дало бы NaN, а с таким компаратором порядок сортировки не определён.
  return left === right ? 0 : left - right;
}
