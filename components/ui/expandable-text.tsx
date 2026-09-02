"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  /** Текст целиком. */
  children: string;
  /**
   * Готовая видимая часть от бэкенда, обрезанная по границе предложения. Есть —
   * показываем её; нет — обрезаем текст сами, по строкам средствами CSS.
   */
  preview?: string;
  /**
   * Есть ли что раскрывать. Имеет смысл только вместе с `preview`: у своей
   * обрезки ответ считается замером, а не приходит извне.
   */
  hasMore?: boolean;
  /** Сколько строк видно, пока текст свёрнут (только для своей обрезки). */
  lines?: number;
  /** Подпись кнопки раскрытия — «Подробнее о зале», «Подробнее об экспонате». */
  moreLabel?: string;
  /** Классы абзаца с текстом (размер, цвет) — рамка сама ничего не задаёт. */
  className?: string;
}

/**
 * Длинный текст, свёрнутый до нескольких строк, с кнопкой «подробнее».
 *
 * Описание зала занимало весь первый экран, и посетитель не видел, что ниже
 * есть витрины — заказчик просил показывать обе сущности сразу, чтобы было
 * видно, с чего начать знакомство с залом (фидбэк 31.08.2026, п.1.3).
 *
 * Обрезка бывает двух видов, и различие видно посетителю:
 *
 *   • `preview` от бэкенда — по границе предложения, фраза не рвётся посреди
 *     слова. Пока свёрнуто, в DOM лежит только превью;
 *   • своя, по строкам средствами CSS, — запасная. Текст при ней лежит в DOM
 *     целиком и обрезан только визуально, поэтому его находит поиск по странице
 *     и читает скринридер.
 *
 * В обоих случаях «Прослушать» получает полный текст, а не видимый огрызок:
 * озвучку собирает вызывающий из `description`, мимо этой рамки.
 *
 * Кнопка появляется, только если есть что раскрывать: короткое описание не
 * должно предлагать «подробнее», за которым ничего нет. У серверной обрезки это
 * говорит `hasMore`, у своей — замер по факту вёрстки, а не порог по длине
 * строки: на разной ширине экрана в четыре строки помещается разное число
 * символов.
 */
export function ExpandableText({
  children,
  preview,
  hasMore,
  lines = 4,
  moreLabel = "Подробнее",
  className,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [clipped, setClipped] = React.useState(false);
  const ref = React.useRef<HTMLParagraphElement>(null);

  // Бэкенд прислал превью — режем по нему, по границе предложения. Своя обрезка
  // остаётся запасной: развёрнутый прод превью пока не отдаёт, и до деплоя текст
  // должен обрезаться хоть как-то, а не разворачиваться на весь экран.
  // Совпало превью с полным текстом — раскрывать нечего, это просто короткий зал.
  const serverCut = preview !== undefined && preview !== children;

  // Замер только в свёрнутом состоянии: у раскрытого абзаца переполнения нет по
  // определению, и повторный замер погасил бы кнопку «Свернуть».
  //
  // useLayoutEffect, а не useEffect: иначе кнопка «подробнее» появлялась бы
  // отдельным кадром после текста и подпрыгивала бы вёрстка. На сервере хук не
  // выполняется и предупреждения не даёт — экраны рисуют описание только после
  // клиентской загрузки данных, в SSR-разметке этого абзаца нет.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded || serverCut) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    // Ширина абзаца меняется при повороте экрана — с ней меняется и вердикт.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lines, expanded, serverCut]);

  const showToggle = serverCut ? (hasMore ?? true) : clipped || expanded;

  return (
    <div>
      <p
        ref={ref}
        className={cn("text-sm leading-relaxed", className)}
        style={
          expanded || serverCut
            ? undefined
            : ({
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              } as React.CSSProperties)
        }
      >
        {serverCut && !expanded ? preview : children}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "text-accent hover:text-foreground mt-2 text-xs tracking-wide",
            "underline underline-offset-4 transition-colors duration-200",
          )}
        >
          {expanded ? "Свернуть" : moreLabel}
        </button>
      )}
    </div>
  );
}
