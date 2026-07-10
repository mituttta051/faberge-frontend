"use client";

import { useRouter } from "next/navigation";

/**
 * Возвращает обработчик кнопки «Назад» с фолбэком на `fallback` (по умолчанию главная).
 * Нужен для сценариев QR-переходов, когда страница открылась первой в новой вкладке
 * и `router.back()` привёл бы к `about:blank` / вылету за пределы приложения.
 */
export function useSafeBack(fallback: string = "/"): () => void {
  const router = useRouter();
  return () => {
    // window.history.length == 1 → это первая страница в вкладке, откатываться некуда.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  };
}
