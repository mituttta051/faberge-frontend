/**
 * Lazy-init MSW в браузере. Импортируется только если NEXT_PUBLIC_USE_MOCKS=true.
 * Возвращает Promise, который резолвится когда воркер готов перехватывать запросы.
 */
export async function initMocks(): Promise<void> {
  if (typeof window === "undefined") return;
  const { worker } = await import("./browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
