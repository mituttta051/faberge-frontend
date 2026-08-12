/**
 * События посетителя для админ-аналитики.
 *
 * Набор типов не произвольный — это словарь бэкенда (`schemas.EventType`,
 * контракт от 03.08.2026). Событие с типом вне словаря бэкенд отбрасывает
 * поштучно и возвращает в `rejected`: опечатка на фронте не уронит батч, но и
 * в отчёты не попадёт. Добавлять новый тип имеет смысл только вместе с правкой
 * аналитики на бэке.
 *
 * `audio_play` больше не используем: канонический тип озвучки — `tts_play`.
 * Бэкенд нормализует старое имя в новое, чтобы накопленные данные не
 * раздвоились в отчётах, но слать нужно каноническое.
 */
export type TelemetryEventType =
  | "app_open"
  | "hall_view"
  | "showcase_view"
  | "exhibit_view"
  | "recognition"
  | "chat_open"
  | "chat_message"
  | "tts_play"
  | "search_query"
  | "session_end";

/**
 * Откуда посетитель попал на карточку экспоната — `props.source` у
 * `exhibit_view`. Нужен для отчёта «откуда приходят на карточки»: переход из
 * зала и переход из фолбэка распознавания говорят о разном.
 */
export type ExhibitViewSource = "hall" | "showcase" | "search" | "recognition" | "chat" | "direct";

export interface TelemetryEvent {
  type: TelemetryEventType;
  exhibitId?: number;
  hallId?: number;
  showcaseId?: number;
  labelSlug?: string;
  /**
   * Детали события. Бэкенд хранит только ключи из белого списка своего типа
   * события (`app_open`: entry/qr_id; `exhibit_view`: source; `recognition`:
   * recognized/confidence/fallback/candidates_count/retry; `chat_message` и
   * `search_query`: text/results_count; `session_end`: reason/last_screen) —
   * всё остальное отбрасывается на приёме. Персональных данных здесь быть не
   * должно: ни UA, ни referrer, ни полного URL с query.
   *
   * `retry` у `recognition` — повторная съёмка после неудачной попытки. Знать
   * это точно может только фронт; без него бэкенд восстанавливал бы признак
   * эвристикой по порядку событий.
   */
  props?: Record<string, unknown>;
}

/**
 * Событие, лежащее в очереди отправки.
 *
 * `ts` проставляется в момент действия, а не отправки: события уходят пачками
 * и с задержкой, и если бы время бралось при отправке, все метки в пачке
 * схлопнулись бы в один момент — метрика «от первого открытия до последнего
 * взаимодействия» стала бы нулевой.
 */
export interface QueuedTelemetryEvent extends TelemetryEvent {
  ts: string;
}
