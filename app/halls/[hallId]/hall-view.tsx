"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHall, useHallShowcases, useHallExhibits } from "@/lib/api/hooks";

export function HallView({ hallId }: { hallId: number }) {
  const router = useRouter();
  const { data: hall, isLoading: hallLoading } = useHall(hallId);
  const { data: showcases } = useHallShowcases(hallId);
  const { data: exhibits } = useHallExhibits(hallId);

  return (
    <Screen>
      <AppBar onBack={() => router.back()} title={hall?.name ?? "Зал"} />
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
              <Badge>Зал № {hall.hallNumber}</Badge>
              <h1 className="font-display mt-3 text-2xl tracking-tight">{hall.name}</h1>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {hall.description ?? hall.shortDescription}
              </p>
            </div>

            <Button variant="accent" fullWidth>
              Спросить AI-гида о зале
            </Button>

            <section>
              <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                Витрины ({showcases?.length ?? 0})
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {showcases?.map((s) => (
                  <li
                    key={s.id}
                    className="border-border hover:bg-muted cursor-pointer border p-3 transition-colors"
                  >
                    <p className="text-muted-foreground text-xs">Витрина № {s.showcaseNumber}</p>
                    <p className="mt-1 text-sm">{s.name ?? "Без названия"}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                Экспонаты зала ({exhibits?.length ?? 0})
              </h2>
              <ul className="mt-3 flex flex-col gap-1">
                {exhibits?.map((e) => (
                  <li key={e.id} className="hover:bg-muted -mx-2 cursor-pointer px-2 py-2 text-sm">
                    {e.name}{" "}
                    {e.yearCreated && (
                      <span className="text-muted-foreground">· {e.yearCreated}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </Screen>
  );
}
