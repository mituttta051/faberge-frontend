"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mocksReady, setMocksReady] = useState(!USE_MOCKS);

  useEffect(() => {
    if (!USE_MOCKS) return;
    let cancelled = false;
    import("@/mocks/init")
      .then(({ initMocks }) => initMocks())
      .then(() => {
        if (!cancelled) setMocksReady(true);
      })
      .catch((err) => {
        console.error("MSW init failed:", err);
        if (!cancelled) setMocksReady(true); // продолжаем без моков
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mocksReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-xs tracking-widest uppercase">Загрузка моков</p>
      </div>
    );
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
