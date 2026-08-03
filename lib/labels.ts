import type { Hall, Showcase } from "@/lib/types";

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
