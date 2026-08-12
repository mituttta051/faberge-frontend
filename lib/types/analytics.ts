/**
 * Отчёты админ-аналитики.
 *
 * Зеркало схем бэкенда (`AnalyticsOverview`, `AnalyticsQuestions`,
 * `AnalyticsUnanswered`, `AnalyticsEngagement`, `AnalyticsRoutes`,
 * `AnalyticsExhibits`, `AnalyticsRecognition`), приведённое к camelCase.
 * Сверено с `app/schemas.py` на коммите 9fe6153 от 05.08.2026.
 *
 * Необязательными помечены только те поля, которых у сущности может не быть по
 * смыслу (имя зала, номер зала у экспоната). Числовые метрики бэкенд отдаёт
 * всегда — у них в схеме есть значения по умолчанию, поэтому «поле не пришло»
 * здесь означало бы сломанный контракт, а не незаполненный отчёт.
 */

/** Период отчёта — то, что бэкенд эхом возвращает на фильтр по датам. */
export interface AnalyticsPeriod {
  from?: string;
  /** Граница включающая: `to=2026-07-31` отдаёт и события 31 июля. */
  to?: string;
  /** Когда агрегаты пересчитывались последний раз (ночной джоб). */
  updatedAt?: string;
}

/**
 * Элемент топа.
 *
 * `id` необязателен: у «экранов выхода» сущности в каталоге нет — там значимо
 * только имя (тип последнего события визита).
 */
export interface AnalyticsTopItem {
  id?: number;
  name?: string;
  count: number;
}

export interface AnalyticsOverview extends AnalyticsPeriod {
  totalSessions: number;
  totalAppOpens: number;
  totalRecognitions: number;
  /** Доля от 0 до 1, не проценты. */
  recognitionSuccessRate: number;
  totalChatMessages: number;
  totalAudioPlays: number;
  topExhibits: AnalyticsTopItem[];
  topHalls: AnalyticsTopItem[];
}

export interface AnalyticsQuestionItem {
  /** Представитель кластера — самая частая формулировка. */
  question: string;
  /** Суммарно по кластеру, а не по одной формулировке. */
  count: number;
  /** Другие формулировки того же смысла (до 5). */
  variants: string[];
}

export interface AnalyticsQuestions extends AnalyticsPeriod {
  totalQuestions: number;
  /** Различных формулировок после нормализации. */
  uniqueQuestions: number;
  /** Смысловых групп — их всегда меньше, чем формулировок. */
  totalClusters: number;
  frequent: AnalyticsQuestionItem[];
  /** Кластеры не чаще порога бэкенда; с `frequent` не пересекаются. */
  rare: AnalyticsQuestionItem[];
}

export interface AnalyticsDurationBucket {
  label: string;
  count: number;
}

export interface AnalyticsEngagement extends AnalyticsPeriod {
  totalSessions: number;
  /**
   * Визитов: поток событий сессии режется по неактивности дольше 30 минут,
   * поэтому визитов может быть больше, чем сессий, и длительность считается
   * по ним.
   */
  totalVisits: number;
  avgDurationSec: number;
  medianDurationSec: number;
  maxDurationSec: number;
  avgEventsPerSession: number;
  /** Уникальных `exhibit_view` за визит. */
  avgExhibitsPerSession: number;
  avgQuestionsPerSession: number;
  /** Визитов хотя бы с одним `chat_open`. */
  sessionsWithChat: number;
  /** Визитов хотя бы с одним `chat_message`. */
  sessionsWithQuestions: number;
  /**
   * Знаменатель конверсий — визитов с `app_open`. Фронт это событие шлёт
   * (`ensureAppOpen` в `lib/telemetry/tracker.ts`, с переоткрытием после
   * таймаута визита), но у бэкенда остался фолбэк на все визиты, если
   * `app_open` нет ни одного, — он срабатывает на данных, накопленных до
   * того, как событие начали слать. Поэтому число показываем рядом с
   * конверсией: иначе непонятно, от чего она посчитана.
   */
  sessionsWithAppOpen: number;
  chatConversionRate: number;
  questionConversionRate: number;
  buckets: AnalyticsDurationBucket[];
}

export interface AnalyticsRouteHall {
  id: number;
  name?: string;
  count: number;
}

export interface AnalyticsRouteTransition {
  fromHallId: number;
  fromHallName?: string;
  toHallId: number;
  toHallName?: string;
  count: number;
}

export interface AnalyticsRoutePath {
  halls: AnalyticsRouteHall[];
  count: number;
}

/** «1 визит», «2 визита», «3+ визита» — гистограмма повторных визитов. */
export interface AnalyticsSessionsPerDeviceBucket {
  label: string;
  devices: number;
}

export interface AnalyticsRoutes extends AnalyticsPeriod {
  totalSessionsWithRoute: number;
  avgHallsPerSession: number;
  topHallVisits: AnalyticsRouteHall[];
  topEntryHalls: AnalyticsRouteHall[];
  topTransitions: AnalyticsRouteTransition[];
  topPaths: AnalyticsRoutePath[];
  /** Последний зал визита. */
  topExitHalls: AnalyticsRouteHall[];
  /**
   * Тип последнего содержательного события визита — часть посетителей уходит
   * из чата, а не из зала. В `name` лежит тип события (`chat_message`), `id`
   * пустой: сущности в каталоге у экрана нет.
   */
  topExitScreens: AnalyticsTopItem[];
  totalDevices: number;
  /** Устройств с двумя и более сессиями (по анонимному `device_id`). */
  returningDevices: number;
  avgSessionsPerDevice: number;
  sessionsPerDeviceHist: AnalyticsSessionsPerDeviceBucket[];
}

/**
 * Вопрос без ответа гида.
 *
 * Причина не одна: кластер собирает формулировки за период, и один и тот же по
 * смыслу вопрос мог упереться то в отсутствие справки, то в отказ модели —
 * поэтому `failReasons` это счётчик по причинам, а не единственный ярлык.
 */
export interface AnalyticsUnansweredItem extends AnalyticsQuestionItem {
  /** `no_context` | `llm_refusal` | `not_found` | `error` → сколько раз. */
  failReasons: Record<string, number>;
  /** Экспонаты, у карточек которых спрашивали — там и не хватает описания. */
  exhibits: AnalyticsTopItem[];
}

export interface AnalyticsUnanswered extends AnalyticsPeriod {
  totalUnanswered: number;
  totalAnswered: number;
  /** Доля 0…1 среди вопросов с проставленным признаком. */
  unansweredRate: number;
  /** Вопросы без признака (накоплены до 03.08.2026) — в долю не входят. */
  unclassified: number;
  /** Сводка причин по всему периоду. */
  failReasons: Record<string, number>;
  items: AnalyticsUnansweredItem[];
}

/** Статистика по экспонатам. Экспонаты с нулём просмотров тоже здесь. */
export interface AnalyticsExhibitRow {
  id: number;
  name?: string;
  hallNumber?: number;
  views: number;
  /** `chat_message` с этим экспонатом в контексте — это не просмотры. */
  questions: number;
  ttsPlays: number;
  recognitions: number;
}

export type AnalyticsExhibitsOrder = "views" | "questions" | "asc";

export interface AnalyticsExhibits extends AnalyticsPeriod {
  order: AnalyticsExhibitsOrder;
  /** Всего экспонатов в каталоге, а не в текущей выдаче. */
  totalExhibits: number;
  /** Ни одного просмотра за период — то, ради чего заказчик просил отчёт. */
  neverViewed: number;
  items: AnalyticsExhibitRow[];
}

/** Качество распознавания по фото. */
export interface AnalyticsRecognition extends AnalyticsPeriod {
  total: number;
  success: number;
  successRate: number;
  /** Показан топ-3 кандидатов. */
  fallbackShown: number;
  fallbackRate: number;
  /** После фолбэка открыли карточку из кандидатов. */
  fallbackConverted: number;
  fallbackConversionRate: number;
  failed: number;
  /** После неудачи в визите не было содержательных событий. */
  abandonedAfterFail: number;
  abandonmentRate: number;
  retryAfterFail: number;
  avgConfidence: number;
}
