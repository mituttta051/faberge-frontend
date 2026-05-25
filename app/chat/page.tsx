"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Spinner } from "@/components/ui/spinner";
import { ChatThread } from "@/components/chat/chat-thread";
import {
  useChatSession,
  useCreateChatSession,
  useExhibit,
  useSendChatMessage,
} from "@/lib/api/hooks";
import type { ChatMessage } from "@/lib/types";

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
  const sid = searchParams.get("sid");
  const exhibitIdParam = searchParams.get("exhibit");
  const exhibitId = exhibitIdParam ? Number(exhibitIdParam) : undefined;

  const createSession = useCreateChatSession();
  const sessionQuery = useChatSession(sid ?? undefined);
  const sendMessage = useSendChatMessage(sid ?? undefined);
  const { data: contextExhibit } = useExhibit(exhibitId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Создание сессии при первом заходе (если sid ещё нет в URL)
  useEffect(() => {
    if (sid) return;
    if (createSession.isPending || createSession.isSuccess) return;
    createSession.mutate(
      { exhibitId },
      {
        onSuccess: (sess) => {
          const params = new URLSearchParams();
          params.set("sid", sess.id);
          if (exhibitId) params.set("exhibit", String(exhibitId));
          router.replace(`/chat?${params.toString()}`);
        },
      },
    );
  }, [sid, exhibitId, createSession, router]);

  // Подтягиваем историю с бэка когда сессия загрузилась
  useEffect(() => {
    if (sessionQuery.data && messages.length === 0) {
      setMessages(sessionQuery.data.messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery.data]);

  const handleSubmit = (text: string) => {
    if (!sid) return;
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);
    sendMessage.mutate(text, {
      onSuccess: (assistantMsg) => {
        setMessages((prev) => [...prev, assistantMsg]);
        setThinking(false);
      },
      onError: () => {
        setThinking(false);
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Не получилось ответить. Попробуй ещё раз.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      },
    });
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const header = contextExhibit ? (
    <div className="border-border bg-muted/30 flex items-center gap-2 border px-3 py-2 text-xs">
      <Sparkles className="text-accent h-3.5 w-3.5 shrink-0" />
      <span className="text-muted-foreground">
        Спрашиваешь о <strong className="text-foreground font-medium">{contextExhibit.name}</strong>
        {contextExhibit.yearCreated && ` · ${contextExhibit.yearCreated}`}
      </span>
    </div>
  ) : null;

  const initializing = !sid || sessionQuery.isLoading;

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
          thinking={thinking}
          suggestions={!thinking && messages.length > 0 ? lastAssistant?.suggestions : undefined}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          header={header}
          disabled={sendMessage.isPending}
        />
      )}
    </Screen>
  );
}
