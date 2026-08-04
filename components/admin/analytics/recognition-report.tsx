import type { AnalyticsRecognition } from "@/lib/types";
import { formatCount, formatDecimal, formatShare } from "@/lib/admin/format";
import { StatTile } from "./stat-tile";

/**
 * Качество распознавания по фото.
 *
 * Долю уходов показываем рядом с долей фолбэка не случайно: фолбэк с топ-3
 * оправдан ровно настолько, насколько он удерживает посетителя — если после
 * него всё равно уходят, список кандидатов не помогает.
 *
 * У долей разные знаменатели, поэтому каждый назван в подписи: успех и фолбэк
 * считаются от всех попыток, конверсия фолбэка — от его показов, уход — от
 * неудач. Без этого «19 %» и «12 %» на соседних плитках выглядят сравнимыми,
 * хотя сравнивать их нельзя.
 */
export function RecognitionReport({ data }: { data: AnalyticsRecognition }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatTile
        label="Успешных"
        value={formatShare(data.successRate)}
        hint={`${formatCount(data.success)} из ${formatCount(data.total)} попыток`}
      />
      <StatTile
        label="Неудачных"
        value={formatCount(data.failed)}
        hint={`средняя уверенность ${formatDecimal(data.avgConfidence, 2)}`}
      />
      <StatTile
        label="Фолбэк топ-3"
        value={formatShare(data.fallbackRate)}
        hint={`показов ${formatCount(data.fallbackShown)} из ${formatCount(data.total)} попыток`}
      />
      <StatTile
        label="Выбрали кандидата"
        value={formatShare(data.fallbackConversionRate)}
        hint={`${formatCount(data.fallbackConverted)} из ${formatCount(data.fallbackShown)} показов фолбэка`}
      />
      <StatTile
        label="Ушли после неудачи"
        value={formatShare(data.abandonmentRate)}
        hint={`${formatCount(data.abandonedAfterFail)} из ${formatCount(data.failed)} неудач`}
      />
      <StatTile
        label="Сняли повторно"
        value={formatCount(data.retryAfterFail)}
        hint="повторных попыток после неудачи"
      />
    </div>
  );
}
