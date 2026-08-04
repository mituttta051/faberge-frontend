import type {
  AnalyticsDurationBucket,
  AnalyticsEngagement,
  AnalyticsExhibitRow,
  AnalyticsExhibits,
  AnalyticsExhibitsOrder,
  AnalyticsOverview,
  AnalyticsQuestionItem,
  AnalyticsQuestions,
  AnalyticsRecognition,
  AnalyticsRouteHall,
  AnalyticsRoutePath,
  AnalyticsRoutes,
  AnalyticsRouteTransition,
  AnalyticsSessionsPerDeviceBucket,
  AnalyticsTopItem,
  AnalyticsUnanswered,
  AnalyticsUnansweredItem,
} from "@/lib/types";
import { request, requestFile } from "./client";

/**
 * Чтение отчётов админ-аналитики (`GET /admin/analytics/*`).
 *
 * Отдельный модуль, а не часть `admin.ts`: тот про CRUD каталога с мутациями и
 * инвалидацией кэша, здесь — только чтение. Bearer-токен добавляет `request()`
 * по префиксу `/admin`, как и для остальных ручек панели.
 */

/** Границы периода в формате `YYYY-MM-DD`. Пусто — за всё время. */
export interface AnalyticsRange {
  from?: string;
  to?: string;
}

/**
 * Даты уходят ровно теми, что выбрал администратор.
 *
 * Обе границы у бэкенда включающие (`to=2026-07-31` отдаёт и события 31 июля),
 * поэтому подгонять их здесь на ±1 день не нужно и нельзя: такая правка
 * молча сдвинула бы период на сутки, и заметить это было бы нечем.
 */
function rangeQuery(range: AnalyticsRange): Record<string, string | undefined> {
  return { from: range.from || undefined, to: range.to || undefined };
}

// ============================
// Wire-типы (snake_case) + мапперы
// ============================

interface WirePeriod {
  from?: string | null;
  to?: string | null;
  updated_at?: string | null;
}

function mapPeriod(w: WirePeriod) {
  return {
    from: w.from ?? undefined,
    to: w.to ?? undefined,
    updatedAt: w.updated_at ?? undefined,
  };
}

interface WireTopItem {
  id?: number | null;
  name?: string | null;
  count: number;
}

function mapTopItem(w: WireTopItem): AnalyticsTopItem {
  return { id: w.id ?? undefined, name: w.name ?? undefined, count: w.count };
}

interface WireOverview extends WirePeriod {
  total_sessions: number;
  total_app_opens: number;
  total_recognitions: number;
  recognition_success_rate: number;
  total_chat_messages: number;
  total_audio_plays: number;
  top_exhibits: WireTopItem[];
  top_halls: WireTopItem[];
}

interface WireQuestionItem {
  question: string;
  count: number;
  variants?: string[] | null;
}

function mapQuestionItem(w: WireQuestionItem): AnalyticsQuestionItem {
  return { question: w.question, count: w.count, variants: w.variants ?? [] };
}

interface WireQuestions extends WirePeriod {
  total_questions: number;
  unique_questions: number;
  total_clusters: number;
  frequent: WireQuestionItem[];
  rare: WireQuestionItem[];
}

interface WireBucket {
  label: string;
  count: number;
}

interface WireEngagement extends WirePeriod {
  total_sessions: number;
  total_visits: number;
  avg_duration_sec: number;
  median_duration_sec: number;
  max_duration_sec: number;
  avg_events_per_session: number;
  avg_exhibits_per_session: number;
  avg_questions_per_session: number;
  sessions_with_chat: number;
  sessions_with_questions: number;
  sessions_with_app_open: number;
  chat_conversion_rate: number;
  question_conversion_rate: number;
  buckets: WireBucket[];
}

interface WireRouteHall {
  id: number;
  name?: string | null;
  count: number;
}

function mapRouteHall(w: WireRouteHall): AnalyticsRouteHall {
  return { id: w.id, name: w.name ?? undefined, count: w.count };
}

interface WireTransition {
  from_hall_id: number;
  from_hall_name?: string | null;
  to_hall_id: number;
  to_hall_name?: string | null;
  count: number;
}

interface WirePath {
  halls: WireRouteHall[];
  count: number;
}

interface WireDeviceBucket {
  label: string;
  devices: number;
}

interface WireRoutes extends WirePeriod {
  total_sessions_with_route: number;
  avg_halls_per_session: number;
  top_hall_visits: WireRouteHall[];
  top_entry_halls: WireRouteHall[];
  top_transitions: WireTransition[];
  top_paths: WirePath[];
  top_exit_halls: WireRouteHall[];
  top_exit_screens: WireTopItem[];
  total_devices: number;
  returning_devices: number;
  avg_sessions_per_device: number;
  sessions_per_device_hist: WireDeviceBucket[];
}

interface WireUnansweredItem extends WireQuestionItem {
  fail_reasons?: Record<string, number> | null;
  exhibits?: WireTopItem[] | null;
}

interface WireUnanswered extends WirePeriod {
  total_unanswered: number;
  total_answered: number;
  unanswered_rate: number;
  unclassified: number;
  fail_reasons?: Record<string, number> | null;
  items: WireUnansweredItem[];
}

interface WireExhibitRow {
  id: number;
  name?: string | null;
  hall_number?: number | null;
  views: number;
  questions: number;
  tts_plays: number;
  recognitions: number;
}

interface WireExhibits extends WirePeriod {
  order: AnalyticsExhibitsOrder;
  total_exhibits: number;
  never_viewed: number;
  items: WireExhibitRow[];
}

interface WireRecognition extends WirePeriod {
  total: number;
  success: number;
  success_rate: number;
  fallback_shown: number;
  fallback_rate: number;
  fallback_converted: number;
  fallback_conversion_rate: number;
  failed: number;
  abandoned_after_fail: number;
  abandonment_rate: number;
  retry_after_fail: number;
  avg_confidence: number;
}

// ============================
// Запросы
// ============================

/** Размер топов внутри отчёта. Бэкенд ограничивает его своими потолками. */
export interface AnalyticsLimit {
  limit?: number;
}

export async function getAnalyticsOverview(
  range: AnalyticsRange,
  opts: AnalyticsLimit = {},
): Promise<AnalyticsOverview> {
  const w = await request<WireOverview>("/admin/analytics/overview", {
    query: { ...rangeQuery(range), limit: opts.limit },
  });
  return {
    ...mapPeriod(w),
    totalSessions: w.total_sessions,
    totalAppOpens: w.total_app_opens,
    totalRecognitions: w.total_recognitions,
    recognitionSuccessRate: w.recognition_success_rate,
    totalChatMessages: w.total_chat_messages,
    totalAudioPlays: w.total_audio_plays,
    topExhibits: (w.top_exhibits ?? []).map(mapTopItem),
    topHalls: (w.top_halls ?? []).map(mapTopItem),
  };
}

export async function getAnalyticsQuestions(
  range: AnalyticsRange,
  opts: AnalyticsLimit = {},
): Promise<AnalyticsQuestions> {
  const w = await request<WireQuestions>("/admin/analytics/questions", {
    query: { ...rangeQuery(range), limit: opts.limit },
  });
  return {
    ...mapPeriod(w),
    totalQuestions: w.total_questions,
    uniqueQuestions: w.unique_questions,
    totalClusters: w.total_clusters,
    frequent: (w.frequent ?? []).map(mapQuestionItem),
    rare: (w.rare ?? []).map(mapQuestionItem),
  };
}

export async function getAnalyticsEngagement(range: AnalyticsRange): Promise<AnalyticsEngagement> {
  const w = await request<WireEngagement>("/admin/analytics/engagement", {
    query: rangeQuery(range),
  });
  return {
    ...mapPeriod(w),
    totalSessions: w.total_sessions,
    totalVisits: w.total_visits,
    avgDurationSec: w.avg_duration_sec,
    medianDurationSec: w.median_duration_sec,
    maxDurationSec: w.max_duration_sec,
    avgEventsPerSession: w.avg_events_per_session,
    avgExhibitsPerSession: w.avg_exhibits_per_session,
    avgQuestionsPerSession: w.avg_questions_per_session,
    sessionsWithChat: w.sessions_with_chat,
    sessionsWithQuestions: w.sessions_with_questions,
    sessionsWithAppOpen: w.sessions_with_app_open,
    chatConversionRate: w.chat_conversion_rate,
    questionConversionRate: w.question_conversion_rate,
    buckets: (w.buckets ?? []).map((b): AnalyticsDurationBucket => ({ ...b })),
  };
}

export async function getAnalyticsRoutes(
  range: AnalyticsRange,
  opts: AnalyticsLimit = {},
): Promise<AnalyticsRoutes> {
  const w = await request<WireRoutes>("/admin/analytics/routes", {
    query: { ...rangeQuery(range), limit: opts.limit },
  });
  return {
    ...mapPeriod(w),
    totalSessionsWithRoute: w.total_sessions_with_route,
    avgHallsPerSession: w.avg_halls_per_session,
    topHallVisits: (w.top_hall_visits ?? []).map(mapRouteHall),
    topEntryHalls: (w.top_entry_halls ?? []).map(mapRouteHall),
    topTransitions: (w.top_transitions ?? []).map(
      (t): AnalyticsRouteTransition => ({
        fromHallId: t.from_hall_id,
        fromHallName: t.from_hall_name ?? undefined,
        toHallId: t.to_hall_id,
        toHallName: t.to_hall_name ?? undefined,
        count: t.count,
      }),
    ),
    topPaths: (w.top_paths ?? []).map(
      (p): AnalyticsRoutePath => ({ halls: (p.halls ?? []).map(mapRouteHall), count: p.count }),
    ),
    topExitHalls: (w.top_exit_halls ?? []).map(mapRouteHall),
    topExitScreens: (w.top_exit_screens ?? []).map(mapTopItem),
    totalDevices: w.total_devices,
    returningDevices: w.returning_devices,
    avgSessionsPerDevice: w.avg_sessions_per_device,
    sessionsPerDeviceHist: (w.sessions_per_device_hist ?? []).map(
      (b): AnalyticsSessionsPerDeviceBucket => ({ ...b }),
    ),
  };
}

export async function getAnalyticsUnanswered(
  range: AnalyticsRange,
  opts: AnalyticsLimit = {},
): Promise<AnalyticsUnanswered> {
  const w = await request<WireUnanswered>("/admin/analytics/unanswered", {
    query: { ...rangeQuery(range), limit: opts.limit },
  });
  return {
    ...mapPeriod(w),
    totalUnanswered: w.total_unanswered,
    totalAnswered: w.total_answered,
    unansweredRate: w.unanswered_rate,
    unclassified: w.unclassified,
    failReasons: w.fail_reasons ?? {},
    items: (w.items ?? []).map(
      (i): AnalyticsUnansweredItem => ({
        ...mapQuestionItem(i),
        failReasons: i.fail_reasons ?? {},
        exhibits: (i.exhibits ?? []).map(mapTopItem),
      }),
    ),
  };
}

/** `order` — по просмотрам, по вопросам или по возрастанию (почти не открывают). */
export async function getAnalyticsExhibits(
  range: AnalyticsRange,
  opts: { order?: AnalyticsExhibitsOrder; limit?: number } = {},
): Promise<AnalyticsExhibits> {
  const w = await request<WireExhibits>("/admin/analytics/exhibits", {
    query: { ...rangeQuery(range), order: opts.order, limit: opts.limit },
  });
  return {
    ...mapPeriod(w),
    order: w.order,
    totalExhibits: w.total_exhibits,
    neverViewed: w.never_viewed,
    items: (w.items ?? []).map(
      (e): AnalyticsExhibitRow => ({
        id: e.id,
        name: e.name ?? undefined,
        hallNumber: e.hall_number ?? undefined,
        views: e.views,
        questions: e.questions,
        ttsPlays: e.tts_plays,
        recognitions: e.recognitions,
      }),
    ),
  };
}

// ============================
// Выгрузка отчётов
// ============================

/** Отчёты, которые бэкенд умеет отдавать файлом. */
export type AnalyticsExportReport =
  | "overview"
  | "questions"
  | "unanswered"
  | "exhibits"
  | "routes"
  | "recognition";

export type AnalyticsExportFormat = "xlsx" | "pdf";

/** Имя файла на случай, если CORS не отдал `Content-Disposition`. */
function fallbackFileName(
  report: AnalyticsExportReport,
  range: AnalyticsRange,
  format: AnalyticsExportFormat,
): string {
  const parts = [range.from, range.to].filter(Boolean);
  const period = parts.length > 0 ? `-${parts.join("-")}` : "-all";
  return `faberge-${report}${period}.${format}`;
}

/**
 * Скачать отчёт файлом.
 *
 * Возвращает имя сохранённого файла — вызывающий код показывает его в
 * подтверждении. Сам клик по невидимой ссылке и освобождение `objectURL`
 * делаются здесь: забытый `revokeObjectURL` держит файл в памяти вкладки до
 * её закрытия, а выгрузок за сессию может быть много.
 */
export async function downloadAnalyticsReport(
  report: AnalyticsExportReport,
  format: AnalyticsExportFormat,
  range: AnalyticsRange,
): Promise<string> {
  const file = await requestFile("/admin/analytics/export", {
    query: { report, format, ...rangeQuery(range) },
  });
  const name = file.filename ?? fallbackFileName(report, range, format);

  const url = URL.createObjectURL(file.blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Отзываем не сразу: Safari успевает начать скачивание не всегда, если
    // ссылку убить в том же кадре.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return name;
}

export async function getAnalyticsRecognition(
  range: AnalyticsRange,
): Promise<AnalyticsRecognition> {
  const w = await request<WireRecognition>("/admin/analytics/recognition", {
    query: rangeQuery(range),
  });
  return {
    ...mapPeriod(w),
    total: w.total,
    success: w.success,
    successRate: w.success_rate,
    fallbackShown: w.fallback_shown,
    fallbackRate: w.fallback_rate,
    fallbackConverted: w.fallback_converted,
    fallbackConversionRate: w.fallback_conversion_rate,
    failed: w.failed,
    abandonedAfterFail: w.abandoned_after_fail,
    abandonmentRate: w.abandonment_rate,
    retryAfterFail: w.retry_after_fail,
    avgConfidence: w.avg_confidence,
  };
}
