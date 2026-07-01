"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, Maximize } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Hall } from "@/lib/types";
import { MAP_PLAN, MAP_HOTSPOTS } from "@/lib/map/hotspots";
import { cn } from "@/lib/utils";

interface InteractiveMapProps {
  halls: Hall[];
  className?: string;
}

/**
 * Интерактивная карта экспозиции: план музея как подложка + кликабельные
 * хотспоты поверх номеров залов. Зум/пан — react-zoom-pan-pinch.
 */
export function InteractiveMap({ halls, className }: InteractiveMapProps) {
  const router = useRouter();
  const byNumber = new Map(halls.map((h) => [h.hallNumber, h]));

  return (
    <div
      className={cn(
        "border-border bg-muted relative w-full overflow-hidden border",
        className,
      )}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        doubleClick={{ mode: "zoomIn", step: 0.7 }}
        wheel={{ step: 0.2 }}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%" }}
            >
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MAP_PLAN.src}
                  alt="План экспозиции Музея Фаберже"
                  width={MAP_PLAN.width}
                  height={MAP_PLAN.height}
                  draggable={false}
                  className="pointer-events-none h-auto w-full select-none"
                />

                {MAP_HOTSPOTS.map((spot) => {
                  const hall = byNumber.get(spot.hallNumber);
                  const id = hall?.id ?? spot.hallNumber;
                  const label = hall?.name
                    ? `Зал № ${spot.hallNumber} — ${hall.name}`
                    : `Зал № ${spot.hallNumber}`;

                  return (
                    <button
                      key={spot.hallNumber}
                      type="button"
                      aria-label={label}
                      title={label}
                      onClick={() => router.push(`/halls/${id}`)}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className="group/spot absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    >
                      {/* Невидимая кликабельная зона поверх номерного бейджа */}
                      <span className="block aspect-square w-[clamp(28px,8vw,44px)]" />
                      {/* Подпись зала при наведении/фокусе */}
                      {hall?.name && (
                        <span
                          className={cn(
                            "bg-foreground text-background pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-opacity duration-200",
                            "group-hover/spot:opacity-100 group-focus-visible/spot:opacity-100",
                          )}
                        >
                          {spot.hallNumber}. {hall.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </TransformComponent>

            {/* Контролы зума */}
            <div className="absolute right-2 bottom-2 z-20 flex flex-col gap-1">
              <MapControl label="Приблизить" onClick={() => zoomIn()}>
                <Plus className="h-4 w-4" />
              </MapControl>
              <MapControl label="Отдалить" onClick={() => zoomOut()}>
                <Minus className="h-4 w-4" />
              </MapControl>
              <MapControl label="Сбросить масштаб" onClick={() => resetTransform()}>
                <Maximize className="h-4 w-4" />
              </MapControl>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

function MapControl({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="border-border bg-background/90 text-foreground hover:bg-muted active:bg-border flex h-8 w-8 items-center justify-center border shadow-sm backdrop-blur transition-colors"
    >
      {children}
    </button>
  );
}
