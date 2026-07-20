import * as React from "react";
import { ChevronRight } from "lucide-react";

interface AccordionSectionProps {
  title: React.ReactNode;
  /** Правый край заголовка — обычно счётчик элементов. */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Сворачиваемая группа списка.
 *
 * Нативный <details>, а не собственное состояние: раскрытие работает с
 * клавиатуры и с скринридером бесплатно, а открытые группы живут в DOM — после
 * сохранения элемента и перерисовки таблицы они не схлопываются (React не
 * трогает атрибут `open`, пока не меняется `defaultOpen`).
 */
export function AccordionSection({ title, meta, defaultOpen, children }: AccordionSectionProps) {
  return (
    <details open={defaultOpen} className="group border-border border-b last:border-b-0">
      <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm select-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90" />
        <span className="flex-1 truncate font-medium">{title}</span>
        {meta && <span className="text-muted-foreground text-xs tabular-nums">{meta}</span>}
      </summary>
      <div className="border-border border-t">{children}</div>
    </details>
  );
}
