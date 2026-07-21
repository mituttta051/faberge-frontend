"use client";

import * as React from "react";
import { track } from "./tracker";

export { track, trackAppOpen } from "./tracker";

/**
 * Разово отправить просмотр зала или экспоната, когда появится id.
 *
 * Пока данные грузятся, id ещё `undefined` — событие не шлётся.
 *
 * Ref, а не только зависимости эффекта: в StrictMode (dev) React прогоняет
 * эффект дважды, и просмотр уходил бы в аналитику в двойном объёме — а dev
 * ходит в тот же прод-бэкенд. Ref переживает повторный прогон, но не переживает
 * настоящий размонтаж, поэтому возврат на ту же карточку считается заново.
 */
export function useTrackView(type: "hall_view" | "exhibit_view", id: number | undefined): void {
  const trackedId = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (id === undefined || trackedId.current === id) return;
    trackedId.current = id;
    track(type === "hall_view" ? { type, hallId: id } : { type, exhibitId: id });
  }, [type, id]);
}
