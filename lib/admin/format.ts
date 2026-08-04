/** Форматирование чисел и времени для отчётов админ-аналитики. */

const NUMBER_FMT = new Intl.NumberFormat("ru-RU");

export function formatCount(n: number | undefined): string {
  return n === undefined ? "—" : NUMBER_FMT.format(n);
}

/** Доля 0…1 → «43 %». Бэкенд отдаёт именно долю, не проценты. */
export function formatShare(share: number | undefined): string {
  if (share === undefined) return "—";
  return `${Math.round(share * 100)} %`;
}

export function formatDecimal(n: number | undefined, digits = 1): string {
  if (n === undefined) return "—";
  return n.toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

/**
 * Секунды → «4 мин 30 с».
 *
 * Секунды показываем только у коротких визитов: для получаса «32 мин» читается
 * лучше, чем «32 мин 17 с», а точность здесь никому не нужна.
 */
export function formatDuration(sec: number | undefined): string {
  if (sec === undefined) return "—";
  const total = Math.round(sec);
  if (total < 60) return `${total} с`;
  const min = Math.floor(total / 60);
  const rest = total % 60;
  if (min >= 10 || rest === 0) return `${min} мин`;
  return `${min} мин ${rest} с`;
}

const DATETIME_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : DATETIME_FMT.format(d);
}
