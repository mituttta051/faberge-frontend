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
 * при живой странице, так что CORS-предзапрос успевает пройти.
 */

const SESSION_KEY = "museum_telemetry_session";
const APP_OPEN_KEY = "museum_telemetry_app_open";
/** Пауза перед отправкой: склеивает всплеск событий в одну пачку. */
const FLUSH_DELAY_MS = 3000;

let queue: QueuedTelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
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

/**
 * Идентификатор визита. Живёт в sessionStorage: у аналитики сессия — это один
 * приход в музей, а не человек навсегда. Новая вкладка = новый визит.
 */
function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = newId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Приватный режим может запретить storage — тогда без аналитики.
    return null;
  }
}

function flush(): void {
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
  const batch = queue;
  queue = [];
  void sendEvents(id, batch);
}

function bindListeners(): void {
  if (listenersBound || typeof document === "undefined") return;
  listenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  // Подстраховка для десктопных браузеров, где вкладку закрывают напрямую.
  window.addEventListener("pagehide", flush);
}

/** Поставить событие в очередь. Никогда не бросает и ничего не ждёт. */
export function track(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  bindListeners();
  queue.push({ ...event, ts: new Date().toISOString() });
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
}

/**
 * Открытие приложения — один раз за визит.
 *
 * Отметка лежит в sessionStorage, а не в модульной переменной: иначе перезагрузка
 * страницы считалась бы новым открытием и завышала метрику, хотя визит тот же.
 */
export function trackAppOpen(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(APP_OPEN_KEY)) return;
    window.sessionStorage.setItem(APP_OPEN_KEY, "1");
  } catch {
    return;
  }
  track({ type: "app_open" });
}
