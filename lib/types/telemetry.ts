/**
 * События посетителя для админ-аналитики.
 *
 * Набор типов не произвольный — бэкенд агрегирует ровно эти строки:
 * `app_open` и `recognition` считаются поштучно, `recognition` дополнительно
 * разбирается по `props.recognized`, а `hall_view` / `exhibit_view` дают
 * топы залов и экспонатов и маршрут посетителя. Добавлять новый тип имеет
 * смысл только вместе с правкой аналитики на бэке.
 */
export type TelemetryEventType =
  | "app_open"
  | "hall_view"
  | "exhibit_view"
  | "recognition"
  | "audio_play";

export interface TelemetryEvent {
  type: TelemetryEventType;
  exhibitId?: number;
  hallId?: number;
  labelSlug?: string;
  /** Детали события. Аналитика читает `recognized` у `recognition`. */
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
