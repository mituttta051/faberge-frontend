"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
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
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Авто-скролл к низу при новых сообщениях / thinking
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking, suggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    onValueChange("");
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
            <div className="mt-1 pl-11">
              <PromptChips suggestions={suggestions} onSelect={onSubmit} />
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-border bg-background flex gap-2 border-t p-3 pb-[max(env(safe-area-inset-bottom),12px)]"
      >
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
