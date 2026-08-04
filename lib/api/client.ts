/** Базовый URL API. Пусто — относительный путь (для MSW в dev). */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

/**
 * Тот же базовый URL для запросов мимо `request()`.
 *
 * Нужен телеметрии: финальный флаш уходит через `navigator.sendBeacon`, а он
 * принимает только готовый URL — обёртку с заголовками и таймаутом ему не
 * передать.
 */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

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

/** Файл из API: содержимое плюс имя, если сервер его отдал. */
export interface FileResponse {
  blob: Blob;
  /** Имя из `Content-Disposition`; пусто, если заголовок недоступен. */
  filename?: string;
}

/**
 * Достать имя файла из `Content-Disposition`.
 *
 * Заголовок может и не дойти: он не входит в список простых ответных
 * заголовков, и браузер покажет его, только если CORS явно разрешил через
 * `Access-Control-Expose-Headers`. Поэтому вызывающий код обязан иметь
 * собственное имя на замену.
 */
function filenameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* кривая кодировка — попробуем обычный filename */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : undefined;
}

/**
 * Скачать файл (выгрузки аналитики).
 *
 * Отдельно от `request()`: тот разбирает ответ как JSON или текст, а тут нужен
 * бинарный `Blob`. Простой ссылкой `<a href>` обойтись нельзя — `/admin/**`
 * требует Bearer-токен, а заголовки к переходу по ссылке не приложить.
 *
 * Таймаут больше обычного: отчёт за большой период бэкенд формирует несколько
 * секунд, и стандартные 15 с рвали бы выгрузку на ровном месте.
 */
export async function requestFile(
  path: string,
  options: RequestOptions = {},
): Promise<FileResponse> {
  const { query, timeoutMs = 60000, headers, ...init } = options;

  const url = new URL(
    path.startsWith("http") ? path : apiUrl(path),
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const finalHeaders = new Headers(headers);
  if (adminToken && path.startsWith("/admin")) {
    finalHeaders.set("Authorization", `Bearer ${adminToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers: finalHeaders,
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

  if (!response.ok) {
    // Ошибку бэкенд отдаёт JSON'ом (напр. 503 «нет шрифта для PDF») — читаем
    // её как JSON, чтобы `errorMessage` показал администратору причину.
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, body);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get("content-disposition")),
  };
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
export async function fetchAllPaged<T>(path: string, options: RequestOptions = {}): Promise<T[]> {
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
