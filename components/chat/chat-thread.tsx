"use client";

import { useEffect, useRef } from "react";
import { ImagePlus, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble, ThinkingBubble } from "./message-bubble";
import { PromptChips } from "./prompt-chips";

interface ChatThreadProps {
  messages: ChatMessage[];
  thinking?: boolean;
  /** Подсказки под последним assistant-ответом. */
  suggestions?: string[];
  /** Введённый пользователем текст. */
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: (text: string) => void;
  /** Слот под кнопку «Прослушать» (Б10) — рендерится в bubble assistant-сообщения. */
  renderMessageTrailing?: (message: ChatMessage) => React.ReactNode;
  /** Дополнительный контент над тредом (например — заголовок про какой экспонат). */
  header?: React.ReactNode;
  disabled?: boolean;
  /** Загрузка фото — отправляется на распознавание. Если не задан, кнопка скрыта. */
  onAttachPhoto?: (file: File) => void;
  /** Дополнительный контент под подсказками (например — рекомендации похожих экспонатов). */
  belowSuggestions?: React.ReactNode;
}

export function ChatThread({
  messages,
  thinking,
  suggestions,
  value,
  onValueChange,
  onSubmit,
  renderMessageTrailing,
  header,
  disabled,
  onAttachPhoto,
  belowSuggestions,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessage = messages[messages.length - 1];

  // Скролл после нового сообщения. Ответ гида длинный, а под ним ещё подсказки и
  // рекомендации, поэтому «в самый низ» уводило окно мимо начала ответа — читать
  // приходилось, листая чат вверх. Теперь на ответ гида подводим окно к его началу,
  // а к низу скроллим только своё сообщение и индикатор «печатает».
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!thinking && lastMessage?.role === "assistant") {
      const node = el.querySelector<HTMLElement>(`[data-message-id="${lastMessage.id}"]`);
      if (node) {
        const top =
          node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
        el.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
        return;
      }
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastMessage?.id, lastMessage?.role, thinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    onValueChange("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяем выбрать тот же файл повторно
    if (file && onAttachPhoto) onAttachPhoto(file);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {header && <div className="mb-4">{header}</div>}
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} trailing={renderMessageTrailing?.(m)} />
          ))}
          {thinking && <ThinkingBubble />}
          {!thinking && suggestions && suggestions.length > 0 && (
            // pl-14, а не pl-11: 44px — это левый край пузыря гида (аватар 32 + gap 12),
            // а текст ответа внутри пузыря сдвинут ещё на его px-3. С отступом по краю
            // пузыря чипы вставали на 12px левее текста и «плыли» относительно ответа
            // (баг-репорт 06.08.2026). Теперь текст ответа, кнопка озвучки и чипы
            // начинаются на одной вертикали.
            <div className="mt-1 pl-14">
              <PromptChips suggestions={suggestions} onSelect={onSubmit} />
            </div>
          )}
          {!thinking && belowSuggestions}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-border bg-background flex gap-2 border-t p-3 pb-[max(env(safe-area-inset-bottom),12px)]"
      >
        {onAttachPhoto && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <IconButton
              aria-label="Прикрепить фото"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <ImagePlus />
            </IconButton>
          </>
        )}
        <Input
          placeholder="Спросите что угодно об экспонате"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <IconButton
          aria-label="Отправить"
          variant="primary"
          type="submit"
          disabled={disabled || !value.trim()}
        >
          <Send />
        </IconButton>
      </form>
    </div>
  );
}
