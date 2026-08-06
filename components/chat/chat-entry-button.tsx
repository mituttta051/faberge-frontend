import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Вход в диалог с AI-гидом из шапки любого экрана.
 *
 * Тред у посетителя один, поэтому это всегда возврат в текущий разговор, а не
 * новый чат. Постоянная кнопка появилась после баг-репорта 06.08.2026: выйдя из
 * чата «назад», посетитель оказывался в зале или на карточке, откуда попасть
 * обратно в переписку было неоткуда, и она выглядела потерянной.
 *
 * Ссылка, а не кнопка: работает средний клик, «открыть в новой вкладке» и
 * предзагрузка маршрута.
 */
export function ChatEntryButton({ href = "/chat", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Диалог с AI-гидом"
      title="Диалог с AI-гидом"
      className={cn(
        "text-foreground hover:bg-muted active:bg-border inline-flex h-11 w-11 shrink-0",
        "items-center justify-center transition-all duration-300 ease-out select-none active:translate-y-px",
        className,
      )}
    >
      <MessageCircle className="h-5 w-5" />
    </Link>
  );
}
