import * as React from "react";
import { ChevronRight } from "lucide-react";

interface AccordionSectionProps {
  title: React.ReactNode;
  /** Правый край заголовка — обычно счётчик элементов. */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  /**
   * Ключ, под которым секция запоминает свою открытость в sessionStorage и
   * восстанавливает её после ухода со страницы и возврата. Сохранённое значение
   * сильнее `defaultOpen`. Без ключа состояние живёт только в DOM.
   */
  persistKey?: string;
  /** Вызывается при каждом раскрытии — например, чтобы отправить просмотр в аналитику. */
  onOpen?: () => void;
  children: React.ReactNode;
}

/**
 * sessionStorage, а не localStorage: раскрытые секции — состояние одного визита,
 * назавтра посетитель должен увидеть зал в исходном виде. И не модульная
 * переменная — по той же причине, что и метка источника в telemetry: в dev
 * переходы идут полной перезагрузкой документа, модульное состояние не выживает.
 */
const STORAGE_PREFIX = "museum_accordion_open:";

function readPersisted(key: string | undefined): boolean | undefined {
  if (!key || typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? undefined : raw === "1";
  } catch {
    return undefined;
  }
}

function writePersisted(key: string | undefined, open: boolean): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, open ? "1" : "0");
  } catch {
    // Приватный режим запретил storage — секция просто не запомнится.
  }
}

/**
 * Сворачиваемая группа списка: витрины зала в публичной части, группировка
 * таблиц в админке.
 *
 * Нативный <details>, а не собственное состояние: раскрытие работает с
 * клавиатуры и с скринридером бесплатно, а открытые группы живут в DOM — после
 * сохранения элемента и перерисовки таблицы они не схлопываются (React не
 * трогает атрибут `open`, пока не меняется начальное значение).
 *
 * DOM-состояние не переживает размонтаж экрана (уход на карточку экспоната и
 * возврат) — для этого есть `persistKey`.
 */
export function AccordionSection({
  title,
  meta,
  defaultOpen,
  persistKey,
  onOpen,
  children,
}: AccordionSectionProps) {
  // Лениво и однократно: сохранённое состояние читается прямо в первом рендере,
  // а не в эффекте — иначе восстановленная секция мигала бы «закрыто → открыто».
  // Расхождения гидрации это не создаёт: экраны с секциями рисуют их только
  // после клиентской загрузки данных, в SSR-разметке секций нет.
  const [initialOpen] = React.useState(() => readPersisted(persistKey) ?? defaultOpen);

  return (
    <details
      open={initialOpen}
      onToggle={(e) => {
        writePersisted(persistKey, e.currentTarget.open);
        if (e.currentTarget.open) onOpen?.();
      }}
      className="group border-border border-b last:border-b-0"
    >
      <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm select-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90" />
        <span className="flex-1 truncate font-medium">{title}</span>
        {meta && <span className="text-muted-foreground text-xs tabular-nums">{meta}</span>}
      </summary>
      <div className="border-border border-t">{children}</div>
    </details>
  );
}
