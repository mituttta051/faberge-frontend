"use client";

import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHall, useHallShowcases, useHallExhibits } from "@/lib/api/hooks";
import { useTrackView } from "@/lib/telemetry";
import { byShowcaseNumber, hallNumberCaption, hallTitle, showcaseTitle } from "@/lib/labels";

export function HallView({ hallId }: { hallId: number }) {
  const safeBack = useSafeBack();
  const { data: hall, isLoading: hallLoading } = useHall(hallId);
  // Считаем просмотром только подтверждённый сервером зал: по битой ссылке
  // маршрут посетителя рисоваться не должен.
  useTrackView("hall_view", hall?.id);
  const { data: showcases } = useHallShowcases(hallId);
  const { data: exhibits } = useHallExhibits(hallId);

  return (
    <Screen>
      <AppBar onBack={safeBack} title={hall ? hallTitle(hall) : "Зал"} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-6">
        {hallLoading && (
          <>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </>
        )}

        {hall && (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Зал без номера («Вне постоянной экспозиции») — бейдж не рисуем. */}
                {hallNumberCaption(hall) && <Badge>{hallNumberCaption(hall)}</Badge>}
                {hall.isTemporary && <Badge variant="outline">Временная выставка</Badge>}
              </div>
              <h1 className="font-display mt-3 text-2xl tracking-tight">{hallTitle(hall)}</h1>
              {hall.description && (
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {hall.description}
                </p>
              )}
            </div>

            <Link href={`/chat?hall=${hall.id}`} className="block">
              <Button variant="accent" fullWidth>
                Спросить AI-гида о зале
              </Button>
            </Link>

            <section>
              <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                Витрины ({showcases?.length ?? 0})
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {[...(showcases ?? [])].sort(byShowcaseNumber).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/showcases/${s.id}`}
                      className="border-border hover:bg-muted block border p-3 transition-colors"
                    >
                      <p className="text-muted-foreground text-xs">{showcaseTitle(s)}</p>
                      <p className="mt-1 text-sm">{s.name ?? "Без названия"}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                Экспонаты зала ({exhibits?.length ?? 0})
              </h2>
              <ul className="mt-3 flex flex-col gap-1">
                {exhibits?.map((e) => {
                  // Номер витрины приходит прямо в списке — джойн с выборкой
                  // витрин здесь больше не нужен.
                  const num = e.showcaseNumber;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/exhibits/${e.id}`}
                        className="hover:bg-muted -mx-2 flex items-baseline gap-2 px-2 py-2 text-sm"
                      >
                        {/* Номер экспоната по путеводителю; номер витрины — отдельной
                            подписью справа, иначе две разные нумерации сливаются. */}
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
                        {num !== undefined && (
                          <span className="text-muted-foreground shrink-0 text-xs">
                            витрина {num}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
    </Screen>
  );
}
