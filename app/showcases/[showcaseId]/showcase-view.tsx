"use client";

import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { byExhibitNumber, showcaseTitle } from "@/lib/labels";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatEntryButton } from "@/components/chat/chat-entry-button";
import { useShowcase, useShowcaseExhibits } from "@/lib/api/hooks";
import { markExhibitSource, useTrackView } from "@/lib/telemetry";

export function ShowcaseView({ showcaseId }: { showcaseId: number }) {
  const safeBack = useSafeBack();
  const { data: showcase, isLoading } = useShowcase(showcaseId);
  const { data: exhibits } = useShowcaseExhibits(showcaseId);
  // Зал передаём вместе с витриной: маршрут по музею строится по залам, и без
  // него просмотр витрины выпадает из цепочки.
  useTrackView("showcase_view", showcase?.id, { hallId: showcase?.hallId });

  return (
    <Screen>
      <AppBar
        onBack={safeBack}
        title={showcase ? showcaseTitle(showcase) : "Витрина"}
        right={<ChatEntryButton />}
      />
      <main className="flex flex-1 flex-col gap-6 px-6 py-6">
        {isLoading && (
          <>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </>
        )}
        {showcase && (
          <div>
            {/* Заголовок — «Витрина № N», а у витрины без номера «Не в витринах»:
                имён у витрин в каталоге нет, и «Без названия» крупным шрифтом
                читалось как незаполненные данные (баг-репорт 06.08.2026). */}
            <h1 className="font-display text-2xl tracking-tight">{showcaseTitle(showcase)}</h1>
            {showcase.name && showcase.name !== showcaseTitle(showcase) && (
              <p className="text-muted-foreground mt-2 text-sm">{showcase.name}</p>
            )}
          </div>
        )}
        <section>
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
            Экспонаты ({exhibits?.length ?? 0})
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {[...(exhibits ?? [])].sort(byExhibitNumber).map((e) => (
              <li key={e.id}>
                <Link
                  href={`/exhibits/${e.id}`}
                  onClick={() => markExhibitSource("showcase")}
                  className="hover:bg-muted -mx-2 flex items-baseline gap-2 px-2 py-2 text-sm"
                >
                  {/* Номер по путеводителю — посетитель сверяется с табличкой
                      в самой витрине, без него список не сопоставить. */}
                  {e.exhibitNumber && (
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {e.exhibitNumber}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    {e.name}
                    {e.yearCreated && (
                      <span className="text-muted-foreground"> · {e.yearCreated}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Screen>
  );
}
