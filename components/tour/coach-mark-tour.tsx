"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  /** CSS-селектор таргета. Обычно `[data-tour="..."]`. */
  selector: string;
  title: string;
  text: string;
}

interface CoachMarkTourProps {
  steps: TourStep[];
  /** Вызывается когда тур завершён/пропущен/закрыт. Тут сохраняем флаг и снимаем оверлей. */
  onDone: () => void;
}

const SPOTLIGHT_PAD = 8;
const TOOLTIP_GAP = 12;
const TOOLTIP_WIDTH = 288;
const TOOLTIP_ESTIMATED_HEIGHT = 180;

/**
 * Оверлей-тур: подсвечивает по очереди элементы страницы («окошко» в тёмной подложке)
 * и показывает подсказку рядом. Никаких внешних либ.
 */
export function CoachMarkTour({ steps, onDone }: CoachMarkTourProps) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[idx];

  // Блокируем скролл боди, пока тур идёт, чтобы rect не «уплывал» под пальцем.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) {
        setRect(null);
        return;
      }
      // Плавный скролл затянет измерение — используем instant.
      el.scrollIntoView({ block: "center", inline: "center" });
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  if (!step) return null;

  const isLast = idx === steps.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 375;
  const vh = typeof window !== "undefined" ? window.innerHeight : 640;
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, vw - 24);

  const centerX = rect ? rect.left + rect.width / 2 : vw / 2;
  const preferBelow = rect ? rect.bottom + TOOLTIP_GAP + TOOLTIP_ESTIMATED_HEIGHT <= vh : true;
  const tooltipTop = rect
    ? preferBelow
      ? rect.bottom + TOOLTIP_GAP
      : Math.max(12, rect.top - TOOLTIP_GAP - TOOLTIP_ESTIMATED_HEIGHT)
    : vh / 2 - TOOLTIP_ESTIMATED_HEIGHT / 2;
  const tooltipLeft = Math.max(12, Math.min(vw - tooltipWidth - 12, centerX - tooltipWidth / 2));

  const next = () => (isLast ? onDone() : setIdx((i) => i + 1));

  return (
    <div className="fixed inset-0 z-50">
      {rect ? (
        <div
          className="border-accent pointer-events-none absolute border-2 transition-[top,left,width,height] duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15, 15, 15, 0.65)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/65" />
      )}

      <div
        className="border-border bg-background absolute border p-4 shadow-xl"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
              Шаг {idx + 1} из {steps.length}
            </p>
            <h3 className="font-display mt-1 text-base leading-snug tracking-tight">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Закрыть подсказку"
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.text}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground text-xs tracking-widest uppercase"
          >
            Пропустить
          </button>
          <Button size="sm" onClick={next}>
            {isLast ? "Готово" : "Далее"}
          </Button>
        </div>
      </div>
    </div>
  );
}
