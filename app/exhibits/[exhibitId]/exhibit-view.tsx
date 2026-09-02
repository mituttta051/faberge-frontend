"use client";

import Image from "next/image";
import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AudioButton } from "@/components/audio/audio-button";
import { ChatEntryButton } from "@/components/chat/chat-entry-button";
import { useExhibit, useRelatedExhibits } from "@/lib/api/hooks";
import { exhibitLocation } from "@/lib/labels";
import { markExhibitSource, useTrackView } from "@/lib/telemetry";

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
  useTrackView("exhibit_view", exhibit?.id);
  const location = exhibit ? exhibitLocation(exhibit) : null;
  // «Дата создания и место» с макета музея — одной строкой: место без даты
  // встречается, дата без места — сплошь и рядом, а отдельная строка «Место
  // создания» ради одного города ломала бы ритм списка.
  const created = [exhibit?.yearCreated, exhibit?.originPlace].filter(Boolean).join(", ") || null;

  return (
    <Screen>
      <AppBar onBack={safeBack} title={exhibit?.name ?? "Экспонат"} right={<ChatEntryButton />} />
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
              {/* Название дублировало заголовок в шапке — заказчик вычеркнул его
                  на макете карточки (фидбэк 31.08.2026, п.1.2). Оставляем h1
                  скрытым: у страницы должен быть заголовок для скринридера и
                  поисковика, а видимый висит в AppBar. */}
              <h1 className="sr-only">{exhibit.name}</h1>

              {/* Порядок полей — с макета заказчика: расположение → дата и
                  место → фирма и мастер → материалы → техники → описание.
                  Одинаковый на всех карточках, чтобы посетитель искал нужное на
                  одном и том же месте. */}
              <dl className="text-muted-foreground flex flex-col gap-1.5 text-xs">
                {location && (
                  <div>
                    <dt className="inline font-medium">Расположение:</dt>{" "}
                    <dd className="inline">{location}</dd>
                  </div>
                )}
                {created && (
                  <div>
                    <dt className="inline font-medium">Дата создания:</dt>{" "}
                    <dd className="inline">{created}</dd>
                  </div>
                )}
                {/* Одна строка, а не две: фирма и мастер лежат в одном поле и
                    приходят с собственными словами-маркерами («Фирма К. Фаберже,
                    мастер М. Перхин») — под заголовком «Фирма:» они бы
                    задвоились. Бэкенд отдаёт и разобранные части; разделять ли
                    их — открытый вопрос к музею. */}
                {exhibit.masterName && (
                  <div>
                    <dt className="inline font-medium">Фирма и мастер:</dt>{" "}
                    <dd className="inline">{exhibit.masterName}</dd>
                  </div>
                )}
                {exhibit.material && (
                  <div>
                    <dt className="inline font-medium">Материалы:</dt>{" "}
                    <dd className="inline">{exhibit.material}</dd>
                  </div>
                )}
                {exhibit.techniques && (
                  <div>
                    <dt className="inline font-medium">Техники:</dt>{" "}
                    <dd className="inline">{exhibit.techniques}</dd>
                  </div>
                )}
              </dl>

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
                        className="text-accent whitespace-nowrap hover:underline"
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
                          onClick={() => markExhibitSource("hall")}
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
