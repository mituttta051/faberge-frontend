import { ArrowRight } from "lucide-react";
import type { AnalyticsRouteHall, AnalyticsRoutes } from "@/lib/types";
import { formatCount, formatDecimal } from "@/lib/admin/format";
import { eventTypeLabel } from "@/lib/admin/labels";
import { BarList } from "./bar-list";

/** «Зал 5 · Синяя гостиная» → в цепочках коротко: «Зал 5». */
function hallShort(h: AnalyticsRouteHall): string {
  return h.name ?? `Зал ${h.id}`;
}

/**
 * Маршрут посетителя: где бывают, откуда начинают, где заканчивают, как ходят.
 *
 * Полные маршруты рисуем цепочкой чипов, а не строкой с id: заказчику нужно
 * увидеть порядок обхода, а «2 → 5 → 9» без названий залов ничего не сообщает.
 *
 * Повторные визиты считаются по анонимному `device_id`. Пока фронт его не
 * шлёт, бэкенд считает каждую сессию отдельным устройством — поэтому рядом с
 * долей возвратов всегда показываем, от какого числа устройств она взята.
 */
export function RoutesReport({ data }: { data: AnalyticsRoutes }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Сессий с маршрутом:{" "}
        <span className="text-foreground tabular-nums">
          {formatCount(data.totalSessionsWithRoute)}
        </span>
        {" · "}В среднем залов за визит:{" "}
        <span className="text-foreground tabular-nums">
          {formatDecimal(data.avgHallsPerSession)}
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
            Популярные залы
          </h3>
          <BarList
            items={data.topHallVisits.map((h) => ({
              key: h.id,
              label: hallShort(h),
              count: h.count,
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
            С какого зала начинают
          </h3>
          <BarList
            items={data.topEntryHalls.map((h) => ({
              key: h.id,
              label: hallShort(h),
              count: h.count,
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
            На каком зале заканчивают
          </h3>
          <BarList
            items={data.topExitHalls.map((h) => ({
              key: h.id,
              label: hallShort(h),
              count: h.count,
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
            На каком экране уходят
          </h3>
          {/* Ключ по имени, а не по `id`: у экрана выхода сущности в каталоге
              нет, бэкенд присылает только тип события. */}
          <BarList
            items={data.topExitScreens.map((s) => ({
              key: s.name ?? s.count,
              label: eventTypeLabel(s.name),
              count: s.count,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
          Повторные визиты
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <BarList
            items={data.sessionsPerDeviceHist.map((b) => ({
              key: b.label,
              label: b.label,
              count: b.devices,
            }))}
            emptyLabel="Устройств за период не было."
          />
          <p className="border-border text-muted-foreground border p-3 text-sm">
            Устройств всего:{" "}
            <span className="text-foreground tabular-nums">{formatCount(data.totalDevices)}</span>,
            из них с двумя и более сессиями —{" "}
            <span className="text-foreground tabular-nums">
              {formatCount(data.returningDevices)}
            </span>
            . В среднем{" "}
            <span className="text-foreground tabular-nums">
              {formatDecimal(data.avgSessionsPerDevice, 2)}
            </span>{" "}
            сессии на устройство.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs tracking-widest uppercase">
          Переходы между залами
        </h3>
        <BarList
          items={data.topTransitions.map((t) => ({
            key: `${t.fromHallId}-${t.toHallId}`,
            label: `${t.fromHallName ?? `Зал ${t.fromHallId}`} → ${t.toHallName ?? `Зал ${t.toHallId}`}`,
            count: t.count,
          }))}
          emptyLabel="Переходов между залами пока не было."
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs tracking-widest uppercase">Частые маршруты</h3>
        {data.topPaths.length === 0 ? (
          <p className="text-muted-foreground border-border border border-dashed p-4 text-sm">
            Полных маршрутов пока нет.
          </p>
        ) : (
          <ul className="border-border flex flex-col border">
            {data.topPaths.map((path, i) => (
              <li
                key={i}
                className="border-border flex flex-wrap items-center gap-x-1 gap-y-2 border-b px-3 py-2 text-sm last:border-0"
              >
                {path.halls.map((h, hi) => (
                  <span key={`${h.id}-${hi}`} className="flex items-center gap-1">
                    <span className="border-border bg-muted border px-2 py-0.5 text-xs whitespace-nowrap">
                      {hallShort(h)}
                    </span>
                    {hi < path.halls.length - 1 && (
                      <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
                    )}
                  </span>
                ))}
                <span className="text-muted-foreground ml-auto tabular-nums">
                  {formatCount(path.count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
