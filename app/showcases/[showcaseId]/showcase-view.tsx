"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useShowcase, useShowcaseExhibits } from "@/lib/api/hooks";

export function ShowcaseView({ showcaseId }: { showcaseId: number }) {
  const router = useRouter();
  const { data: showcase, isLoading } = useShowcase(showcaseId);
  const { data: exhibits } = useShowcaseExhibits(showcaseId);

  return (
    <Screen>
      <AppBar
        onBack={() => router.back()}
        title={showcase ? `Витрина № ${showcase.showcaseNumber}` : "Витрина"}
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
            <h1 className="font-display text-2xl tracking-tight">
              {showcase.name ?? "Без названия"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Витрина № {showcase.showcaseNumber}
            </p>
          </div>
        )}
        <section>
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
            Экспонаты ({exhibits?.length ?? 0})
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {exhibits?.map((e) => (
              <li key={e.id} className="hover:bg-muted -mx-2 cursor-pointer px-2 py-2 text-sm">
                {e.name}{" "}
                {e.yearCreated && <span className="text-muted-foreground">· {e.yearCreated}</span>}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Screen>
  );
}
