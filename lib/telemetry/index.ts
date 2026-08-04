"use client";

import * as React from "react";
import type { ExhibitViewSource } from "@/lib/types";
import { track } from "./tracker";

export { track, trackAppOpen } from "./tracker";

/**
 * Откуда пришёл следующий переход на карточку экспоната.
 *
 * Лежит в sessionStorage, а не в модульной переменной: переходы по ссылкам в
 * этом приложении идут полной перезагрузкой документа (`trailingSlash` + dev),
 * и модульное состояние до карточки не доживает — источник всегда получался бы
 * «direct». Значение одноразовое и живёт секунды: иначе метка от давнего
 * перехода приклеилась бы к карточке, открытой позже напрямую.
 *
 * Персональных данных тут нет — ни referrer, ни URL, только категория из
 * контракта.
 */
const SOURCE_KEY = "museum_telemetry_source";
/** Дольше этого метка протухает: переход по ссылке занимает секунды, не минуты. */
const SOURCE_TTL_MS = 60_000;

/** Вызывать в обработчике клика по ссылке на карточку экспоната. */
export function markExhibitSource(source: ExhibitViewSource): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SOURCE_KEY, JSON.stringify({ source, at: Date.now() }));
  } catch {
    // Приватный режим запретил storage — источник будет «direct», не беда.
  }
}

function takeExhibitSource(): ExhibitViewSource {
  if (typeof window === "undefined") return "direct";
  try {
    const raw = window.sessionStorage.getItem(SOURCE_KEY);
    window.sessionStorage.removeItem(SOURCE_KEY);
    if (!raw) return "direct";
    const parsed = JSON.parse(raw) as { source?: ExhibitViewSource; at?: number };
    if (!parsed.source || !parsed.at || Date.now() - parsed.at > SOURCE_TTL_MS) return "direct";
    return parsed.source;
  } catch {
    return "direct";
  }
}

type ViewType = "hall_view" | "showcase_view" | "exhibit_view";

/**
 * Разово отправить просмотр зала, витрины или экспоната, когда появится id.
 *
 * Пока данные грузятся, id ещё `undefined` — событие не шлётся.
 *
 * Ref, а не только зависимости эффекта: в StrictMode (dev) React прогоняет
 * эффект дважды, и просмотр уходил бы в аналитику в двойном объёме — а dev
 * ходит в тот же прод-бэкенд. Ref переживает повторный прогон, но не переживает
 * настоящий размонтаж, поэтому возврат на ту же карточку считается заново.
 */
export function useTrackView(
  type: ViewType,
  id: number | undefined,
  extra: { hallId?: number } = {},
): void {
  const { hallId } = extra;
  const trackedId = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (id === undefined || trackedId.current === id) return;
    trackedId.current = id;
    if (type === "hall_view") track({ type, hallId: id });
    else if (type === "showcase_view") track({ type, showcaseId: id, hallId });
    else track({ type, exhibitId: id, props: { source: takeExhibitSource() } });
  }, [type, id, hallId]);
}
