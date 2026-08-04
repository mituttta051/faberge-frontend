"use client";

import type { QueuedTelemetryEvent, TelemetryEvent } from "@/lib/types";
import { sendEvents } from "@/lib/api/endpoints";

/**
 * Сбор событий посетителя для админ-аналитики.
 *
 * Почему очередь, а не запрос на каждое действие: события идут очередями
 * (открыл зал → тут же экспонат → нажал «прослушать»), и по запросу на каждое
 * мы бы засыпали шлюз. Копим и отправляем пачкой.
 *
 * Почему флаш на `visibilitychange`, а не на `beforeunload`/`unload`: на мобильных
 * (а это основной сценарий в музее) выгрузочные события часто не срабатывают
 * вовсе — вкладку просто усыпляют. `visibilitychange` приходит надёжно и ещё
 * при живой странице.
 *
 * Два идентификатора и они разные по сроку жизни: `session_id` в
 * sessionStorage — один приход в музей, `device_id` в localStorage — устройство
 * между приходами. Без второго повторный визит того же человека неотличим от
 * нового посетителя, а заказчик просит именно частоту возвратов. Оба —
 * случайные UUID: никакого фингерпринтинга, UA и геолокации.
 */

const SESSION_KEY = "museum_telemetry_session";
const APP_OPEN_KEY = "museum_telemetry_app_open";
const ENTRY_KEY = "museum_telemetry_entry";
const DEVICE_KEY = "museum_telemetry_device";

/** Пауза перед отправкой: склеивает всплеск событий в одну пачку. */
const FLUSH_DELAY_MS = 3000;
/** Лимит бэкенда на батч: пачку длиннее он отклоняет целиком (422). */
const MAX_EVENTS_PER_BATCH = 50;
/**
 * Потолок очереди. Нужен на случай долгого офлайна: неотправленные пачки
 * возвращаются в очередь, и без потолка она росла бы до бесконечности.
 * Выбрасываем самые старые — свежие события ценнее для отчётов.
 */
const MAX_QUEUE = 200;
/** Столько же, сколько SESSION_TIMEOUT_MINUTES на бэкенде: визит рвётся по 30 минутам тишины. */
const INACTIVITY_MS = 30 * 60 * 1000;

let queue: QueuedTelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function newId(): string {
  // randomUUID есть только в защищённом контексте; на http-стенде его не будет.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(
      16,
    ),
  );
}

/** Приватный режим может запретить storage — тогда просто работаем без него. */
function read(store: "session" | "local", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (store === "session" ? window.sessionStorage : window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(store: "session" | "local", key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    (store === "session" ? window.sessionStorage : window.localStorage).setItem(key, value);
  } catch {
    /* см. read() */
  }
}

function drop(store: "session" | "local", key: string): void {
  if (typeof window === "undefined") return;
  try {
    (store === "session" ? window.sessionStorage : window.localStorage).removeItem(key);
  } catch {
    /* см. read() */
  }
}

/**
 * Идентификатор визита. Живёт в sessionStorage: у аналитики сессия — это один
 * приход в музей, а не человек навсегда. Новая вкладка = новый визит.
 */
function sessionId(): string | null {
  const existing = read("session", SESSION_KEY);
  if (existing) return existing;
  if (typeof window === "undefined") return null;
  const id = newId();
  write("session", SESSION_KEY, id);
  // Не смогли записать — storage запрещён, аналитику тихо выключаем.
  return read("session", SESSION_KEY) ? id : null;
}

/** Идентификатор устройства: переживает закрытие вкладки, но не очистку данных сайта. */
function deviceId(): string | undefined {
  const existing = read("local", DEVICE_KEY);
  if (existing) return existing;
  if (typeof window === "undefined") return undefined;
  const id = newId();
  write("local", DEVICE_KEY, id);
  return read("local", DEVICE_KEY) ?? undefined;
}

// ============================
// Точка входа (QR)
// ============================

interface EntryInfo {
  entry: string;
  qrId?: string;
  hallId?: number;
  showcaseId?: number;
  exhibitId?: number;
}

function num(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Откуда посетитель зашёл — из query первой открытой страницы.
 *
 * Читаем `window.location.search` напрямую, а не через `useSearchParams`:
 * `trackAppOpen` вызывается из `Providers`, где хука нет, и ради одного
 * значения тащить туда Suspense-границу незачем.
 *
 * `src` — договорённость с музеем о наклейках (`entrance`, `showcase`,
 * `exhibit`). Если его нет, но есть deep-link `hall`/`exhibit` (такие QR уже
 * напечатаны), точку входа выводим из них. Пусто — зашли по прямой ссылке.
 */
function readEntry(): EntryInfo {
  if (typeof window === "undefined") return { entry: "direct" };
  const params = new URLSearchParams(window.location.search);
  const hallId = num(params.get("hall"));
  const showcaseId = num(params.get("showcase"));
  const exhibitId = num(params.get("exhibit"));
  const src = params.get("src");
  const entry =
    src ??
    (showcaseId !== undefined
      ? "showcase"
      : exhibitId !== undefined
        ? "exhibit"
        : hallId !== undefined
          ? "hall"
          : "direct");
  return { entry, qrId: params.get("qr") ?? undefined, hallId, showcaseId, exhibitId };
}

function storedEntry(): EntryInfo {
  const raw = read("session", ENTRY_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as EntryInfo;
    } catch {
      /* мусор в storage — перечитаем из адреса */
    }
  }
  const info = readEntry();
  write("session", ENTRY_KEY, JSON.stringify(info));
  return info;
}

// ============================
// Очередь и отправка
// ============================

function enqueue(event: QueuedTelemetryEvent): void {
  queue.push(event);
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
}

/**
 * Отправить накопленное.
 *
 * Пачку режем по лимиту бэкенда: батч длиннее 50 событий он отклоняет целиком,
 * то есть активная сессия теряла бы всю пачку разом. Не ушедшие события
 * возвращаем в начало очереди — при обрыве сети они уйдут со следующим флашем,
 * а не пропадут молча.
 */
function flush(opts: { beacon?: boolean } = {}): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const id = sessionId();
  if (!id) {
    queue = [];
    return;
  }
  const device = deviceId();
  const pending = queue;
  queue = [];

  for (let i = 0; i < pending.length; i += MAX_EVENTS_PER_BATCH) {
    const chunk = pending.slice(i, i + MAX_EVENTS_PER_BATCH);
    void sendEvents({ sessionId: id, deviceId: device, events: chunk }, opts).then((ok) => {
      if (ok) return;
      queue = [...chunk, ...queue].slice(-MAX_QUEUE);
    });
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS);
}

// ============================
// Таймаут визита
// ============================

/**
 * Закрыть визит по тишине.
 *
 * `session_end` уходит немедленно, а не через дебаунс: следом мы сбрасываем
 * `session_id`, и отложенная отправка приписала бы событие уже новому визиту.
 * `device_id` при этом не трогаем — по нему и считаются повторные визиты.
 *
 * На мобильном вкладку могут усыпить и таймер не сработает — это нормально,
 * бэкенд всё равно режет визит по неактивности сам.
 */
function endSession(reason: string): void {
  if (!read("session", SESSION_KEY)) return; // визита и не было
  const lastScreen = typeof window !== "undefined" ? window.location.pathname : undefined;
  enqueue({
    type: "session_end",
    // Только путь, без query: в нём бывают и `?exhibit=…`, и что угодно ещё,
    // а персональные данные в аналитику попадать не должны.
    props: { reason, last_screen: lastScreen },
    ts: new Date().toISOString(),
  });
  flush();
  drop("session", SESSION_KEY);
  // Следующее действие начнёт новый визит — и должно снова открыться `app_open`,
  // иначе конверсии бэкенда считаются от неполного знаменателя.
  drop("session", APP_OPEN_KEY);
}

function resetIdleTimer(): void {
  if (typeof window === "undefined") return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => endSession("timeout"), INACTIVITY_MS);
}

function bindListeners(): void {
  if (listenersBound || typeof document === "undefined") return;
  listenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush({ beacon: true });
    else resetIdleTimer();
  });
  // Подстраховка для десктопных браузеров, где вкладку закрывают напрямую.
  window.addEventListener("pagehide", () => flush({ beacon: true }));
  // Живой посетитель, который читает, а не кликает, — тоже активность.
  for (const type of ["pointerdown", "keydown", "scroll"] as const) {
    window.addEventListener(type, resetIdleTimer, { passive: true });
  }
  resetIdleTimer();
}

// ============================
// Публичный API
// ============================

/** Поставить событие в очередь. Никогда не бросает и ничего не ждёт. */
export function track(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  bindListeners();
  ensureAppOpen();
  enqueue({ ...event, ts: new Date().toISOString() });
  resetIdleTimer();
  scheduleFlush();
}

/**
 * Открытие приложения — один раз за визит.
 *
 * Отметка лежит в sessionStorage, а не в модульной переменной: иначе перезагрузка
 * страницы считалась бы новым открытием и завышала метрику, хотя визит тот же.
 * Точка входа берётся из query первой страницы и запоминается на весь визит.
 */
export function trackAppOpen(): void {
  if (typeof window === "undefined") return;
  bindListeners();
  ensureAppOpen();
  resetIdleTimer();
  scheduleFlush();
}

/**
 * Отправить `app_open`, если в текущем визите его ещё не было.
 *
 * Вызывается и из `track()`: визит могли закрыть по таймауту прямо на живой
 * странице, и следующее действие открывает новый — без этого у нового визита
 * не было бы `app_open`, а он служит бэкенду знаменателем конверсий.
 */
function ensureAppOpen(): void {
  if (read("session", APP_OPEN_KEY)) return;
  if (!sessionId()) return; // storage запрещён — аналитики нет
  const info = storedEntry();
  write("session", APP_OPEN_KEY, "1");
  enqueue({
    type: "app_open",
    hallId: info.hallId,
    showcaseId: info.showcaseId,
    exhibitId: info.exhibitId,
    props: { entry: info.entry, qr_id: info.qrId },
    ts: new Date().toISOString(),
  });
}
