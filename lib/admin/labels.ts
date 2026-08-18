import type { Hall, Showcase } from "@/lib/types";

/**
 * Единый формат наименований в админке.
 *
 * Заказчик просил видеть полную структуру «зал → витрина → номер» везде, где
 * элемент упоминается: в списках, в селектах форм, в диалогах удаления. Формат
 * задан здесь один раз, чтобы номер зала и витрины читался одинаково во всех
 * разделах панели.
 */

const SEP = " · ";

/** «Зал 5 · Синяя гостиная» — заголовки групп и опции селектов. */
export function hallLabel(hall?: Hall | null): string {
  if (!hall) return "Без зала";
  const base = hall.hallNumber != null ? `Зал ${hall.hallNumber}` : "Зал без номера";
  return hall.name ? base + SEP + hall.name : base;
}

/** «Витрина 3 · Часы и галантерея» — строки списка витрин и опции селектов. */
export function showcaseLabel(showcase?: Showcase | null): string {
  if (!showcase) return "Без витрины";
  const base =
    showcase.showcaseNumber != null ? `Витрина ${showcase.showcaseNumber}` : "Не в витринах";
  // Группы без номера в базе так и называются «Не в витринах» — не дублируем.
  return showcase.name && showcase.name !== base ? base + SEP + showcase.name : base;
}

/**
 * Тип события телеметрии по-русски: «На каком экране уходят» показывает именно
 * типы событий (`chat_message`, `exhibit_view`), и без расшифровки отчёт
 * читается только тем, кто помнит контракт телеметрии.
 *
 * Неизвестный тип отдаём как есть: словарь на бэкенде может пополниться раньше,
 * чем здесь, и «chat_reaction» полезнее прочерка.
 */
const EVENT_TYPE_LABELS: Record<string, string> = {
  app_open: "Открытие приложения",
  hall_view: "Зал",
  showcase_view: "Витрина",
  exhibit_view: "Карточка экспоната",
  recognition: "Распознавание",
  chat_open: "Чат с гидом",
  chat_message: "Вопрос гиду",
  tts_play: "Озвучка",
  search_query: "Поиск",
  session_end: "Завершение сессии",
};

export function eventTypeLabel(type?: string): string {
  if (!type) return "Неизвестный экран";
  return EVENT_TYPE_LABELS[type] ?? type;
}

/**
 * Размещение одной строкой, только по номерам: «Зал 5 · Витрина 3».
 * Названия сюда не попадают — иначе строка таблицы разъезжается.
 */
export function placementLabel(hall?: Hall | null, showcase?: Showcase | null): string {
  const parts: string[] = [];
  if (hall) parts.push(hall.hallNumber != null ? `Зал ${hall.hallNumber}` : "Зал без номера");
  if (showcase) {
    parts.push(
      showcase.showcaseNumber != null ? `Витрина ${showcase.showcaseNumber}` : "Не в витринах",
    );
  }
  return parts.length > 0 ? parts.join(SEP) : "Не размещён";
}
