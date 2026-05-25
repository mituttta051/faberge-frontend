"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Volume2 } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExhibit, useRelatedExhibits } from "@/lib/api/hooks";

export function ExhibitView({ exhibitId }: { exhibitId: number }) {
  const router = useRouter();
  const { data: exhibit, isLoading } = useExhibit(exhibitId);
  const { data: related } = useRelatedExhibits(exhibitId);

  return (
    <Screen>
      <AppBar onBack={() => router.back()} title={exhibit?.name ?? "Экспонат"} />
      <main className="flex flex-1 flex-col gap-6">
        {isLoading && (
          <>
            <Skeleton className="aspect-square w-full" />
            <div className="px-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-3/4" />
            </div>
          </>
        )}
        {exhibit && (
          <>
            {exhibit.photoUrl && (
              <Image
                src={exhibit.photoUrl}
                alt={exhibit.name}
                width={800}
                height={800}
                className="aspect-square w-full object-cover"
              />
            )}
            <div className="flex flex-col gap-3 px-6">
              <div className="flex items-center gap-2">
                {exhibit.yearCreated && <Badge variant="outline">{exhibit.yearCreated}</Badge>}
                {exhibit.masterName && (
                  <span className="text-muted-foreground text-xs">{exhibit.masterName}</span>
                )}
              </div>
              <h1 className="font-display text-2xl tracking-tight">{exhibit.name}</h1>
              {exhibit.material && (
                <p className="text-muted-foreground text-xs">
                  <span className="tracking-widest uppercase">Материалы:</span> {exhibit.material}
                </p>
              )}
              <p className="text-sm leading-relaxed">{exhibit.shortDescription}</p>

              <div className="mt-2 flex gap-2">
                <Button variant="accent" fullWidth>
                  Спросить AI-гида
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Volume2 className="h-4 w-4" />}
                  aria-label="Прослушать"
                >
                  Прослушать
                </Button>
              </div>

              {related && related.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                    Другие экспонаты зала
                  </h2>
                  <ul className="-mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-2">
                    {related.map((r) => (
                      <li key={r.id} className="border-border w-40 shrink-0 cursor-pointer border">
                        {r.photoUrl && (
                          <Image
                            src={r.photoUrl}
                            alt={r.name}
                            width={400}
                            height={400}
                            className="aspect-square w-full object-cover"
                          />
                        )}
                        <p className="p-2 text-xs leading-tight">{r.name}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </Screen>
  );
}
