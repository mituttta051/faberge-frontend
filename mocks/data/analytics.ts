import { halls } from "./halls";
import { exhibits } from "./exhibits";

/**
 * Фикстуры админ-аналитики (wire-формат, snake_case — как отдаёт бэкенд).
 *
 * Отчёты не константы, а функции от периода: фильтр по датам иначе нечем
 * проверить — цифры не менялись бы при переключении «7 дней / 30 дней», и
 * сломанный фильтр выглядел бы как рабочий.
 *
 * Числа детерминированы (псевдослучайность от индекса, без `Math.random`):
 * перерисовка страницы не должна менять таблицу под курсором, а скриншот в
 * ревью — совпадать с тем, что видит следующий человек.
 */

/** Сколько суток в периоде. Пустой период — «всё время», берём 90 дней. */
function periodDays(from?: string | null, to?: string | null): number {
  if (!from && !to) return 90;
  const start = from ? new Date(from) : new Date(to as string);
  const end = to ? new Date(to) : new Date();
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, Number.isFinite(days) ? days : 1);
}

/** Псевдослучайное, но стабильное число: одинаковый seed → одинаковый результат. */
function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Счётчик, растущий с длиной периода: 30 дней дают втрое больше, чем 10. */
function scaled(base: number, days: number, seed: number): number {
  return Math.max(0, Math.round(base * days * (0.6 + pseudo(seed) * 0.8)));
}

const publicHalls = halls.filter((h) => !h.isService);

const FREQUENT_QUESTIONS: { question: string; variants: string[]; weight: number }[] = [
  {
    question: "Сколько стоит это яйцо?",
    variants: ["какая цена яйца", "сколько это стоит", "во сколько оценивают яйцо"],
    weight: 34,
  },
  {
    question: "Кто сделал этот экспонат?",
    variants: ["кто мастер", "чья это работа", "кто автор"],
    weight: 27,
  },
  {
    question: "Где находится Коронационное яйцо?",
    variants: ["в каком зале коронационное яйцо", "как пройти к коронационному"],
    weight: 21,
  },
  {
    question: "Какие есть залы в музее?",
    variants: ["сколько всего залов", "перечисли залы"],
    weight: 18,
  },
  {
    question: "Сколько всего яиц Фаберже в музее?",
    variants: ["сколько пасхальных яиц"],
    weight: 14,
  },
  {
    question: "Что внутри яйца?",
    variants: ["какой сюрприз внутри", "что за сюрприз"],
    weight: 11,
  },
  { question: "Кому подарили это яйцо?", variants: ["для кого сделали"], weight: 9 },
  { question: "Из чего сделан этот предмет?", variants: ["какой материал"], weight: 7 },
];

const RARE_QUESTIONS = [
  "Правда ли, что курочку внутри можно завести?",
  "Почему у Фаберже не было учеников из Сибири?",
  "Какая температура нужна для хранения эмали?",
  "Сколько весит корзина с анютиными глазками в граммах?",
  "Кто реставрировал этот предмет последним?",
  "Можно ли сфотографировать со вспышкой?",
  "Есть ли в музее предметы из коллекции Юсуповых?",
];

/**
 * Причин у кластера может быть несколько: он собирает формулировки за весь
 * период, и один и тот же по смыслу вопрос упирается то в отсутствие справки,
 * то в отказ модели. Мок отдаёт смешанные причины специально — на одной
 * причине вёрстка колонки не проверяется.
 */
const UNANSWERED_QUESTIONS: {
  question: string;
  variants?: string[];
  exhibitIndexes: number[];
  reasons: Record<string, number>;
}[] = [
  {
    question: "Сколько стоит это яйцо сейчас?",
    variants: ["какая рыночная цена", "за сколько его продали бы"],
    exhibitIndexes: [2, 0],
    reasons: { not_found: 4, llm_refusal: 2 },
  },
  {
    question: "Где сейчас вторая часть сервиза?",
    exhibitIndexes: [5],
    reasons: { no_context: 5 },
  },
  {
    question: "Кто владел им между 1917 и 1930 годами?",
    variants: ["чья это была коллекция после революции"],
    exhibitIndexes: [3, 1],
    reasons: { no_context: 3, not_found: 1 },
  },
  {
    question: "Можно ли купить копию в магазине музея?",
    exhibitIndexes: [],
    reasons: { llm_refusal: 3 },
  },
  {
    question: "Какая страховая стоимость коллекции?",
    exhibitIndexes: [],
    reasons: { llm_refusal: 2, error: 1 },
  },
];

function period(from?: string | null, to?: string | null) {
  return { from: from ?? null, to: to ?? null, updated_at: "2026-08-03T04:00:00+03:00" };
}

export function overviewMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const sessions = scaled(38, days, 1);
  const recognitions = scaled(9, days, 2);
  return {
    ...period(from, to),
    total_sessions: sessions,
    total_app_opens: Math.round(sessions * 1.08),
    total_recognitions: recognitions,
    recognition_success_rate: 0.71,
    total_chat_messages: scaled(24, days, 3),
    total_audio_plays: scaled(13, days, 4),
    top_exhibits: exhibits.slice(0, 5).map((e, i) => ({
      id: e.id,
      name: e.name,
      count: scaled(6 - i * 0.9, days, 10 + i),
    })),
    top_halls: publicHalls.slice(0, 5).map((h, i) => ({
      id: h.id,
      name: h.name,
      count: scaled(7 - i, days, 20 + i),
    })),
  };
}

export function questionsMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const frequent = FREQUENT_QUESTIONS.map((q) => ({
    question: q.question,
    count: Math.max(2, Math.round((q.weight * days) / 30)),
    variants: q.variants,
  }));
  const rare = RARE_QUESTIONS.map((q) => ({ question: q, count: 1, variants: [] }));
  const total = frequent.reduce((s, q) => s + q.count, 0) + rare.length;
  // Формулировок всегда больше, чем кластеров: представитель + его варианты.
  const variants = frequent.reduce((s, q) => s + q.variants.length, 0);
  return {
    ...period(from, to),
    total_questions: total,
    unique_questions: frequent.length + rare.length + variants,
    total_clusters: frequent.length + rare.length,
    frequent,
    rare,
  };
}

export function engagementMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const sessions = scaled(38, days, 1);
  // Визитов больше, чем сессий: вкладку, ожившую после паузы дольше 30 минут,
  // бэкенд считает новым визитом. Мок держит это расхождение, иначе панель,
  // которая показывает оба числа, на моках выглядит подозрительно ровной.
  const visits = Math.round(sessions * 1.17);
  return {
    ...period(from, to),
    total_sessions: sessions,
    total_visits: visits,
    avg_duration_sec: 764.4,
    median_duration_sec: 612,
    max_duration_sec: 4821,
    avg_events_per_session: 14.3,
    avg_exhibits_per_session: 5.2,
    avg_questions_per_session: 1.8,
    sessions_with_chat: Math.round(visits * 0.43),
    sessions_with_questions: Math.round(visits * 0.31),
    sessions_with_app_open: visits,
    chat_conversion_rate: 0.43,
    question_conversion_rate: 0.31,
    buckets: [
      { label: "0–1 мин", count: Math.round(visits * 0.14) },
      { label: "1–5 мин", count: Math.round(visits * 0.27) },
      { label: "5–15 мин", count: Math.round(visits * 0.38) },
      { label: "15+ мин", count: Math.round(visits * 0.21) },
    ],
  };
}

export function routesMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const brief = (i: number) => ({ id: publicHalls[i].id, name: publicHalls[i].name });
  const sessions = scaled(38, days, 1);
  // Устройств меньше, чем сессий, ровно на число повторных визитов.
  const returning = Math.round(sessions * 0.12);
  const devices = sessions - returning;
  return {
    ...period(from, to),
    total_sessions_with_route: scaled(31, days, 5),
    avg_halls_per_session: 4.6,
    top_hall_visits: publicHalls.map((h, i) => ({
      id: h.id,
      name: h.name,
      count: scaled(6 - i * 0.5, days, 30 + i),
    })),
    top_entry_halls: [0, 1, 3].map((i) => ({
      ...brief(i),
      count: scaled(9 - i * 2, days, 40 + i),
    })),
    top_transitions: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 7],
      [1, 4],
    ].map(([a, b], i) => ({
      from_hall_id: publicHalls[a].id,
      from_hall_name: publicHalls[a].name,
      to_hall_id: publicHalls[b].id,
      to_hall_name: publicHalls[b].name,
      count: scaled(5 - i * 0.6, days, 50 + i),
    })),
    top_paths: [
      [0, 1, 2, 3],
      [1, 2, 3, 7],
      [0, 3],
    ].map((path, i) => ({
      halls: path.map((idx) => ({ ...brief(idx), count: 1 })),
      count: scaled(3 - i * 0.7, days, 60 + i),
    })),
    top_exit_halls: [7, 3, 8].map((i) => ({
      ...brief(i),
      count: scaled(4 - i * 0.2, days, 70 + i),
    })),
    // У экрана выхода нет сущности в каталоге: `id` пустой, в `name` — тип
    // события. Расшифровку на русский делает фронт (`eventTypeLabel`).
    top_exit_screens: [
      { id: null, name: "exhibit_view", count: scaled(5, days, 80) },
      { id: null, name: "chat_message", count: scaled(3, days, 81) },
      { id: null, name: "recognition", count: scaled(1.5, days, 82) },
    ],
    total_devices: devices,
    returning_devices: returning,
    avg_sessions_per_device: devices ? Number((sessions / devices).toFixed(2)) : 0,
    sessions_per_device_hist: [
      { label: "1 визит", devices: devices - returning },
      { label: "2 визита", devices: Math.round(returning * 0.7) },
      { label: "3+ визита", devices: returning - Math.round(returning * 0.7) },
    ],
  };
}

export function unansweredMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const items = UNANSWERED_QUESTIONS.map((q, i) => {
    const count = Math.max(1, Math.round((6 - i) * (days / 30)));
    return {
      question: q.question,
      count,
      variants: q.variants ?? [],
      fail_reasons: q.reasons,
      exhibits: q.exhibitIndexes.map((idx, ei) => ({
        id: exhibits[idx].id,
        name: exhibits[idx].name,
        count: Math.max(1, count - ei),
      })),
    };
  });
  const totalUnanswered = items.reduce((s, i) => s + i.count, 0);
  const totalAnswered = Math.round(totalUnanswered * 7.5);
  // Сводка причин — сумма по кластерам: панель показывает её отдельно от
  // таблицы, и расхождение сразу выдало бы ошибку маппинга.
  const failReasons: Record<string, number> = {};
  for (const item of items) {
    for (const [reason, n] of Object.entries(item.fail_reasons)) {
      failReasons[reason] = (failReasons[reason] ?? 0) + n;
    }
  }
  return {
    ...period(from, to),
    total_unanswered: totalUnanswered,
    total_answered: totalAnswered,
    unanswered_rate: Number((totalUnanswered / (totalUnanswered + totalAnswered)).toFixed(4)),
    // Диалоги до 03.08.2026 признака не имеют и в долю не входят.
    unclassified: 12,
    fail_reasons: failReasons,
    items,
  };
}

export function exhibitsMock(
  from: string | null | undefined,
  to: string | null | undefined,
  order: string,
  limit: number,
) {
  const days = periodDays(from, to);
  const rows = exhibits.map((e, i) => {
    // Каждый третий экспонат — «мёртвый»: отчёт «почти не открывают» должен на
    // чём-то проверяться, а без нулей он выглядит пустым.
    const dead = i % 3 === 2;
    const views = dead ? 0 : scaled(4 - i * 0.3, days, 90 + i);
    return {
      id: e.id,
      name: e.name,
      hall_number: e.hallId,
      views,
      questions: dead ? 0 : Math.round(views * (0.2 + pseudo(100 + i) * 0.3)),
      tts_plays: dead ? 0 : Math.round(views * 0.4),
      recognitions: dead ? 0 : Math.round(views * 0.15),
    };
  });
  const sorted = [...rows].sort((a, b) => {
    if (order === "questions") return b.questions - a.questions;
    if (order === "asc") return a.views - b.views;
    return b.views - a.views;
  });
  return {
    ...period(from, to),
    order,
    // Счётчики — от всего каталога, а не от выданной страницы: иначе «Показать
    // ещё» пропадает после первой же подгрузки.
    total_exhibits: rows.length,
    never_viewed: rows.filter((r) => r.views === 0).length,
    items: sorted.slice(0, limit),
  };
}

export function recognitionMock(from?: string | null, to?: string | null) {
  const days = periodDays(from, to);
  const total = scaled(9, days, 2);
  const success = Math.round(total * 0.71);
  const failed = total - success;
  const fallback = Math.round(total * 0.19);
  const converted = Math.round(fallback * 0.55);
  const abandoned = Math.round(failed * 0.34);
  // Знаменатели у долей разные — те же, что считает бэкенд: успех и фолбэк от
  // всех попыток, конверсия фолбэка от его показов, уход от неудач.
  const rate = (part: number, whole: number) => (whole ? Number((part / whole).toFixed(4)) : 0);
  return {
    ...period(from, to),
    total,
    success,
    success_rate: rate(success, total),
    fallback_shown: fallback,
    fallback_rate: rate(fallback, total),
    fallback_converted: converted,
    fallback_conversion_rate: rate(converted, fallback),
    failed,
    abandoned_after_fail: abandoned,
    abandonment_rate: rate(abandoned, failed),
    retry_after_fail: Math.round(failed * 0.4),
    avg_confidence: 0.68,
  };
}
