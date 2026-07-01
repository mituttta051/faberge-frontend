"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { Markdown } from "./markdown";

interface MessageBubbleProps {
  message: ChatMessage;
  /** Слот под кнопку «Прослушать» (только assistant). Передаётся снаружи в Б10. */
  trailing?: React.ReactNode;
}

export function MessageBubble({ message, trailing }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    return (
      <div className="flex gap-3">
        <div className="border-border bg-muted flex h-8 w-8 shrink-0 items-center justify-center border">
          <Sparkles className="text-accent h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="border-border bg-muted/40 inline-block max-w-full border px-3 py-2 text-sm leading-relaxed">
            {message.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.imageUrl}
                alt=""
                className="border-border mb-2 max-h-48 w-auto border object-cover"
              />
            )}
            <Markdown>{message.content}</Markdown>
          </div>
          {trailing && <div className="mt-2">{trailing}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "bg-primary text-primary-foreground max-w-[80%] border px-3 py-2 text-sm leading-relaxed",
          "border-primary",
        )}
      >
        {message.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageUrl}
            alt=""
            className="border-primary-foreground/30 mb-2 max-h-48 w-auto border object-cover"
          />
        )}
        {message.content}
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="border-border bg-muted flex h-8 w-8 shrink-0 items-center justify-center border">
        <Sparkles className="text-accent h-4 w-4 animate-pulse" />
      </div>
      <div className="border-border bg-muted/40 flex items-center gap-1 border px-3 py-3">
        <span className="bg-muted-foreground h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:0ms]" />
        <span className="bg-muted-foreground h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
        <span className="bg-muted-foreground h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
      </div>
    </div>
  );
}
