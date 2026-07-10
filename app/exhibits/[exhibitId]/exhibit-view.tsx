"use client";

import Image from "next/image";
import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioButton } from "@/components/audio/audio-button";
import { useExhibit, useRelatedExhibits } from "@/lib/api/hooks";

const ELLIPSIS_RE = /(?:…|\.{3})\s*$/;

function isTruncated(text: string): boolean {
  return ELLIPSIS_RE.test(text.trimEnd());
}

function stripTrailingEllipsis(text: string): string {
  return text.replace(ELLIPSIS_RE, "").trimEnd();
}

export function ExhibitView({ exhibitId }: { exhibitId: number }) {
  const safeBack = useSafeBack();
  const { data: exhibit, isLoading } = useExhibit(exhibitId);
  const { data: related } = useRelatedExhibits(exhibitId);

  return (
    <Screen>
      <AppBar onBack={safeBack} title={exhibit?.name ?? "Экспонат"} />
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
              <div className="flex flex-wrap items-center gap-2">
                {exhibit.showcaseNumber !== undefined && (
                  <Badge>Витрина № {exhibit.showcaseNumber}</Badge>
                )}
                {exhibit.yearCreated && <Badge variant="outline">{exhibit.yearCreated}</Badge>}
                {exhibit.masterName && (
                  <span className="text-muted-foreground text-xs">{exhibit.masterName}</span>
                )}
              </div>
              <h1 className="font-display text-2xl tracking-tight">{exhibit.name}</h1>
              {exhibit.material && (
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">Материалы:</span> {exhibit.material}
                </p>
              )}
              {exhibit.shortDescription && (
                <p className="text-sm leading-relaxed">
                  {stripTrailingEllipsis(exhibit.shortDescription)}
                  {isTruncated(exhibit.shortDescription) && exhibit.sourceUrl && (
                    <>
                      {"… "}
                      <a
                        href={exhibit.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline whitespace-nowrap"
                      >
                        читать полностью →
                      </a>
                    </>
                  )}
                  {isTruncated(exhibit.shortDescription) && !exhibit.sourceUrl && "…"}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                <Link href={`/chat?exhibit=${exhibit.id}`} className="block flex-1">
                  <Button variant="accent" fullWidth>
                    Спросить AI-гида
                  </Button>
                </Link>
                {exhibit.shortDescription && (
                  <AudioButton
                    audioKey={`exhibit_${exhibit.id}`}
                    text={`${exhibit.name}. ${exhibit.shortDescription}`}
                    variant="labeled"
                  />
                )}
              </div>

              {related && related.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                    Другие экспонаты зала
                  </h2>
                  <ul className="-mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-2">
                    {related.map((r) => (
                      <li key={r.id} className="w-40 shrink-0">
                        <Link
                          href={`/exhibits/${r.id}`}
                          className="border-border group/related hover:border-foreground/40 block border transition-all duration-300 ease-out hover:shadow-sm"
                        >
                          {r.photoUrl && (
                            <div className="overflow-hidden">
                              <Image
                                src={r.photoUrl}
                                alt={r.name}
                                width={400}
                                height={400}
                                className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover/related:scale-105"
                              />
                            </div>
                          )}
                          <p className="group-hover/related:text-accent p-2 text-xs leading-tight transition-colors">
                            {r.name}
                          </p>
                        </Link>
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
