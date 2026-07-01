/** Базовый URL API. Пусто — относительный путь (для MSW в dev). */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

/** Ошибка от API: статус + тело. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`);
    this.name = "ApiError";
  }
}

/**
 * Admin Bearer-токен для `/admin/**`. Хранится в модуле (не в React),
 * чтобы `request()` мог добавлять `Authorization` без проброса через все вызовы.
 * Устанавливается из admin-сессии при логине/восстановлении (см. lib/api/admin.ts).
 */
let adminToken: string | null = null;

export function setAdminToken(token: string | null): void {
  adminToken = token;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body — будет сериализовано автоматически */
  json?: unknown;
  /** FormData / Blob / File — отправляется как есть, без Content-Type */
  body?: BodyInit;
  /** Query параметры */
  query?: Record<string, string | number | undefined>;
  /** Таймаут запроса (мс). По умолчанию 15s */
  timeoutMs?: number;
}

/**
 * Низкоуровневый fetch-клиент.
 * Бросает ApiError на не-2xx, поддерживает JSON-сериализацию, query-параметры, таймаут.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, query, timeoutMs = 15000, headers, ...init } = options;

  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const finalHeaders = new Headers(headers);
  // Все /admin/** требуют Bearer-токен администратора (кроме /admin/login,
  // которому он не мешает). Добавляем, если токен установлен.
  if (adminToken && path.startsWith("/admin")) {
    finalHeaders.set("Authorization", `Bearer ${adminToken}`);
  }
  let finalBody: BodyInit | undefined = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, null, "Request timeout");
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data: unknown = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

/** Постраничный ответ бэкенда: `{ items, total, limit, offset }`. */
export interface Paged<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Размер страницы при дозагрузке. Бэкенд режет `limit ≤ 100`. */
const PAGE_SIZE = 100;

/**
 * Дозагружает ВСЕ страницы ресурса постранично и возвращает плоский массив `items`.
 * Бэкенд ограничивает `limit` сотней, поэтому запрашиваем по {@link PAGE_SIZE},
 * увеличивая `offset`, пока не соберём `total` элементов (или пока страница
 * не вернётся неполной). `guard` страхует от бесконечного цикла при кривом `total`.
 */
export async function fetchAllPaged<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T[]> {
  const { query, ...rest } = options;
  const all: T[] = [];
  let offset = 0;
  for (let guard = 0; guard < 1000; guard++) {
    const page = await request<Paged<T>>(path, {
      ...rest,
      query: { ...query, limit: PAGE_SIZE, offset },
    });
    all.push(...page.items);
    offset += PAGE_SIZE;
    if (page.items.length < PAGE_SIZE || all.length >= (page.total ?? all.length)) break;
  }
  return all;
}
