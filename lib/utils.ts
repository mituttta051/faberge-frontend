import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Человекочитаемое сообщение из произвольной ошибки (ApiError, Error, …). */
export function errorMessage(err: unknown, fallback = "Что-то пошло не так."): string {
  if (!err) return fallback;
  if (typeof err === "object" && err !== null && "body" in err) {
    const body = (err as { body?: unknown }).body;
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === "string") return detail;
    }
  }
  if (err instanceof Error) {
    // fetch отклоняется TypeError'ом «Failed to fetch» при сетевом/CORS-сбое или
    // когда платформа отрезает запрос (напр. слишком большой файл) без CORS-заголовков.
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return "Не удалось связаться с сервером. Проверьте соединение; если это загрузка файла — он может быть слишком большим.";
    }
    return err.message;
  }
  return fallback;
}
