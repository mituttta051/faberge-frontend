"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Spinner } from "@/components/ui/spinner";
import { ChatThread } from "@/components/chat/chat-thread";
import { AudioButton } from "@/components/audio/audio-button";
import {
  useChatWithGuide,
  useExhibit,
  useGenerateStory,
  useHall,
} from "@/lib/api/hooks";
import type { ChatContext, ChatMessage } from "@/lib/types";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exhibitIdParam = searchParams.get("exhibit");
  const hallIdParam = searchParams.get("hall");
  const labelSlugParam = searchParams.get("label");
  const exhibitId = exhibitIdParam ? Number(exhibitIdParam) : undefined;
  const hallId = hallIdParam ? Number(hallIdParam) : undefined;
  const labelSlug = labelSlugParam ?? undefined;

  const context: ChatContext = { exhibitId, hallId, labelSlug };

  const story = useGenerateStory();
  const chat = useChatWithGuide();
  const { data: contextExhibit } = useExhibit(exhibitId);
  const { data: contextHall } = useHall(hallId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const bootstrapped = useRef(false);

  // Бутстрап: для контекста экспоната — сразу генерим вступительный рассказ
  // через /guide/story. Для зала просто стартуем пустой тред с подсказками.
  useEffect(() => {
    if (bootstrapped.current) return;
    if (story.isPending) return;
    bootstrapped.current = true;

    if (exhibitId === undefined && !labelSlug) {
      // Контекст зала — заранее рассказ не нужен, диалог стартует с вопроса пользователя
      return;
    }

    story.mutate(
      { exhibitId, labelSlug, maxQuestions: 4 },
      {
        onSuccess: (s) => {
          const assistantMsg: ChatMessage = {
            id: `story_${Date.now()}`,
            role: "assistant",
            content: s.text,
            createdAt: new Date().toISOString(),
            suggestions: s.suggestedQuestions,
            audioUrl: s.audioUrl,
          };
          setMessages([assistantMsg]);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibitId, labelSlug]);

  const handleSubmit = (text: string) => {
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    chat.mutate(
      { message: text, sessionId, context, maxQuestions: 3 },
      {
        onSuccess: (res) => {
          setSessionId(res.sessionId);
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: res.answer,
            createdAt: new Date().toISOString(),
            suggestions: res.suggestedQuestions,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "Не получилось ответить. Попробуй ещё раз.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      },
    );
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const headerContext = contextExhibit
    ? { label: contextExhibit.name, hint: contextExhibit.yearCreated?.toString() }
    : contextHall
      ? { label: contextHall.name ?? `Зал № ${contextHall.hallNumber}`, hint: `зал № ${contextHall.hallNumber}` }
      : null;

  const header = headerContext ? (
    <div className="border-border bg-muted/30 flex items-center gap-2 border px-3 py-2 text-xs">
      <Sparkles className="text-accent h-3.5 w-3.5 shrink-0" />
      <span className="text-muted-foreground">
        Спрашиваешь о <strong className="text-foreground font-medium">{headerContext.label}</strong>
        {headerContext.hint && ` · ${headerContext.hint}`}
      </span>
    </div>
  ) : null;

  // Первоначальная загрузка рассказа — экран ожидания
  const initializing = story.isPending && messages.length === 0;

  return (
    <Screen>
      <AppBar onBack={() => router.back()} title="AI-гид" />
      {initializing ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Открываем чат</p>
        </main>
      ) : (
        <ChatThread
          messages={messages}
          thinking={chat.isPending}
          suggestions={!chat.isPending && messages.length > 0 ? lastAssistant?.suggestions : undefined}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          header={header}
          disabled={chat.isPending}
          renderMessageTrailing={(m) =>
            m.role === "assistant" ? <AudioButton audioKey={m.id} text={m.content} /> : null
          }
        />
      )}
    </Screen>
  );
}
