"use client";

import * as React from "react";
import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccordionSection } from "@/components/ui/accordion-section";
import { AudioButton } from "@/components/audio/audio-button";
import { ChatEntryButton } from "@/components/chat/chat-entry-button";
import { useHall, useHallShowcases, useHallExhibits } from "@/lib/api/hooks";
import { markExhibitSource, track, useTrackView } from "@/lib/telemetry";
import {
  byExhibitNumber,
  byShowcaseNumber,
  hallNumberCaption,
  hallTitle,
  showcaseTitle,
} from "@/lib/labels";
import type { Exhibit, Showcase } from "@/lib/types";

export function HallView({ hallId }: { hallId: number }) {
  const safeBack = useSafeBack();
  const { data: hall, isLoading: hallLoading } = useHall(hallId);
  // Считаем просмотром только подтверждённый сервером зал: по битой ссылке
  // маршрут посетителя рисоваться не должен.
  useTrackView("hall_view", hall?.id);
  const { data: showcases } = useHallShowcases(hallId);
  const { data: exhibits } = useHallExhibits(hallId);

  const items = React.useMemo(() => exhibits ?? [], [exhibits]);
  // Экспонаты, не привязанные ни к одной витрине зала. Когда у зала есть витрина
  // без номера, «не в витринах» уже пришло от бэкенда — второй раз не рисуем.
  const loose = React.useMemo(() => {
    const known = new Set((showcases ?? []).map((s) => s.id));
    const hasUnnumbered = (showcases ?? []).some((s) => s.showcaseNumber == null);
    if (hasUnnumbered) return [];
    return items
      .filter((e) => e.showcaseId === undefined || !known.has(e.showcaseId))
      .sort(byExhibitNumber);
  }, [items, showcases]);

  return (
    <Screen>
      <AppBar
        onBack={safeBack}
        title={hall ? hallTitle(hall) : "Зал"}
        right={<ChatEntryButton />}
      />
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

            {/* Озвучка описания зала: `POST /speech` принимает произвольный текст,
                отдельной ручки под зал не нужно. Ключ — чтобы зал и экспонат не
                заиграли одновременно: стор аудио держит один активный источник. */}
            {hall.description && (
              <div className="flex">
                <AudioButton
                  audioKey={`hall_${hall.id}`}
                  text={hall.description}
                  variant="labeled"
                />
              </div>
            )}

            <Link href={`/chat?hall=${hall.id}`} className="block">
              <Button variant="accent" fullWidth>
                Спросить AI-гида о зале
              </Button>
            </Link>

            <section>
              <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                Витрины ({showcases?.length ?? 0})
              </h2>
              {/* Витрины раскрываются на месте: сплошной список экспонатов зала
                  заказчик просил заменить составом каждой витрины
                  (баг-репорт 06.08.2026, «Окно зала»). */}
              <div className="border-border mt-3 border">
                {[...(showcases ?? [])].sort(byShowcaseNumber).map((s) => (
                  <ShowcaseSection
                    key={s.id}
                    showcase={s}
                    hallId={hall.id}
                    items={items.filter((e) => e.showcaseId === s.id).sort(byExhibitNumber)}
                  />
                ))}
                {loose.length > 0 && (
                  <AccordionSection title="Не в витринах" meta={loose.length}>
                    <ExhibitList items={loose} />
                  </AccordionSection>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </Screen>
  );
}

function ShowcaseSection({
  showcase,
  hallId,
  items,
}: {
  showcase: Showcase;
  hallId: number;
  items: Exhibit[];
}) {
  // Просмотр витрины считаем один раз за визит на страницу: посетитель может
  // складывать и раскладывать секцию сколько угодно, отчёт от этого не должен
  // раздуваться.
  const tracked = React.useRef(false);

  return (
    <AccordionSection
      title={showcaseTitle(showcase)}
      meta={items.length}
      onOpen={() => {
        if (tracked.current) return;
        tracked.current = true;
        track({ type: "showcase_view", showcaseId: showcase.id, hallId });
      }}
    >
      <ExhibitList items={items} />
      <div className="px-3 pt-1 pb-3">
        <Link
          href={`/showcases/${showcase.id}`}
          className="text-muted-foreground hover:text-foreground text-xs tracking-widest uppercase transition-colors"
        >
          Открыть витрину
        </Link>
      </div>
    </AccordionSection>
  );
}

function ExhibitList({ items }: { items: Exhibit[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground px-3 py-3 text-xs">Экспонаты не заполнены.</p>;
  }

  return (
    <ul className="flex flex-col py-1">
      {items.map((e) => (
        <li key={e.id}>
          <Link
            href={`/exhibits/${e.id}`}
            onClick={() => markExhibitSource("hall")}
            className="hover:bg-muted flex items-baseline gap-2 px-3 py-2 text-sm"
          >
            {/* Номер экспоната по путеводителю — по нему посетитель сверяется
                с табличкой в витрине. */}
            {e.exhibitNumber && (
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {e.exhibitNumber}
              </span>
            )}
            <span className="min-w-0 flex-1">
              {e.name}
              {e.yearCreated && <span className="text-muted-foreground"> · {e.yearCreated}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
