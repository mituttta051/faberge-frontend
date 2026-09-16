import Link from "next/link";
import type { RecognitionCandidate } from "@/lib/types/recognize";
import { markExhibitSource } from "@/lib/telemetry";

interface CandidateListProps {
  candidates: RecognitionCandidate[];
  /** Заголовок секции: «Возможно, это» при неудаче, «Другие варианты» рядом с ответом. */
  title: string;
}

/**
 * Список вариантов распознавания по убыванию уверенности.
 *
 * Модель отдаёт ранжированный список, а не один ответ, и следующие по вероятности
 * варианты полезны в обоих случаях: и когда мы не уверены, и когда уверены —
 * похожие предметы в витрине посетитель различает хуже модели (запрос музея
 * 16.09.2026). У кандидата без `exhibitId` карточки нет, ведём в чат по слагу.
 */
export function CandidateList({ candidates, title }: CandidateListProps) {
  if (candidates.length === 0) return null;
  return (
    <section>
      <h2 className="text-muted-foreground text-xs tracking-widest uppercase">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {candidates.map((c) => (
          <li key={c.labelSlug}>
            <Link
              href={c.exhibitId ? `/exhibits/${c.exhibitId}` : `/chat?label=${c.labelSlug}`}
              onClick={() => markExhibitSource("recognition")}
              className="group/cand border-border hover:border-foreground/40 flex items-stretch gap-3 border transition-colors"
            >
              {c.thumbnailUrl ? (
                <div className="border-border relative aspect-square w-16 shrink-0 overflow-hidden border-r">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/cand:scale-105"
                  />
                </div>
              ) : null}
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2">
                <span className="group-hover/cand:text-accent min-w-0 flex-1 text-sm leading-snug transition-colors">
                  {c.name ?? c.labelSlug}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {Math.round(c.confidence * 100)}%
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
