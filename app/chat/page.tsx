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
  useRecognizeExhibit,
} from "@/lib/api/hooks";
import { getExhibit, getExhibitBySlug } from "@/lib/api/endpoints";
import { useChatStore } from "@/lib/store/chat-store";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import type { ChatContext, ChatExhibitCard, Exhibit } from "@/lib/types";

/** Подсказки для общего чата (без контекста экспоната/зала). */
const DEFAULT_PROMPTS = [
  "Расскажи о музее Фаберже",
  "Что обязательно посмотреть?",
  "Кто такой Карл Фаберже?",
];

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function toPlaque(ex: Exhibit): ChatExhibitCard {
  return {
    id: ex.id,
    name: ex.name,
    photoUrl: ex.photoUrl,
    yearCreated: ex.yearCreated,
    masterName: ex.masterName,
  };
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const searchParams = useSearchParams();

  const story = useGenerateStory();
  const chat = useChatWithGuide();
  const recognize = useRecognizeExhibit();

  const [input, setInput] = useState("");
  // Zustand + persist гидрируется на клиенте — ждём mount, чтобы избежать SSR-рассинхрона.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Единственный тред — источник правды для сообщений/контекста.
  const session = useChatStore((s) => s.chat);
  const messages = session?.messages ?? [];
  const context = session?.context;

  const { data: contextExhibit } = useExhibit(context?.exhibitId);
  const { data: contextHall } = useHall(context?.hallId);

  // Реакция на URL-контекст (QR-переходы: /chat?exhibit=42, /chat?hall=3, /chat?label=slug).
  // Обновляем контекст треда и добавляем вступительный рассказ, не стирая историю.
  const processedContextRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const exhibitRaw = searchParams.get("exhibit");
    const hallRaw = searchParams.get("hall");
    const labelSlug = searchParams.get("label") ?? undefined;
    const exhibitId = exhibitRaw ? Number(exhibitRaw) : undefined;
    const hallId = hallRaw ? Number(hallRaw) : undefined;
    const hasCtx = exhibitId !== undefined || hallId !== undefined || !!labelSlug;
    if (!hasCtx) return;

    const key = `${exhibitId ?? ""}|${hallId ?? ""}|${labelSlug ?? ""}`;
    if (processedContextRef.current === key) return;
    processedContextRef.current = key;

    const store = useChatStore.getState();
    store.getOrCreate();
    const ctx: ChatContext = { exhibitId, hallId, labelSlug };
    store.setContext(ctx);

    // Для экспоната/label — параллельно тянем сам экспонат (для плашки) и story-рассказ,
    // потом кладём одним сообщением с плашкой + текстом. История не стирается.
    if (exhibitId !== undefined || labelSlug) {
      const exhibitPromise: Promise<Exhibit | null> = exhibitId !== undefined
        ? getExhibit(exhibitId).catch(() => null)
        : labelSlug
          ? getExhibitBySlug(labelSlug).catch(() => null)
          : Promise.resolve(null);
      const storyPromise = story.mutateAsync({ exhibitId, labelSlug, maxQuestions: 4 });
      Promise.all([exhibitPromise, storyPromise])
        .then(([ex, s]) => {
          useChatStore.getState().addMessage({
            id: uid("story"),
            role: "assistant",
            content: s.text,
            createdAt: new Date().toISOString(),
            suggestions: s.suggestedQuestions,
            audioUrl: s.audioUrl,
            exhibit: ex ? toPlaque(ex) : undefined,
          });
        })
        .catch(() => {
          /* story ошибку React Query отобразит через isPending/isError; специальный fallback не нужен. */
        });
    }

    // Чистим query — reload не будет плодить повторные story.
    router.replace("/chat");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  const handleSubmit = (text: string) => {
    const store = useChatStore.getState();
    store.getOrCreate();
    store.addMessage({
      id: uid("local"),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    });

    chat.mutate(
      { message: text, sessionId: session?.serverSessionId, context, maxQuestions: 3 },
      {
        onSuccess: (res) => {
          const st = useChatStore.getState();
          st.setServerSessionId(res.sessionId);
          st.addMessage({
            id: uid("msg"),
            role: "assistant",
            content: res.answer,
            createdAt: new Date().toISOString(),
            suggestions: res.suggestedQuestions,
          });
        },
        onError: () => {
          useChatStore.getState().addMessage({
            id: uid("err"),
            role: "assistant",
            content: "Не получилось ответить. Попробуй ещё раз.",
            createdAt: new Date().toISOString(),
          });
        },
      },
    );
  };

  // Загрузка фото: распознаём экспонат (/recognition) и заземляем на нём диалог.
  const handleAttachPhoto = async (file: File) => {
    const store = useChatStore.getState();
    store.getOrCreate();
    const previewUrl = URL.createObjectURL(file);
    store.addMessage({
      id: uid("photo"),
      role: "user",
      content: "Что это за экспонат?",
      createdAt: new Date().toISOString(),
      imageUrl: previewUrl,
    });

    try {
      const res = await recognize.mutateAsync(file);
      if (res.recognized && res.exhibit) {
        const ex = res.exhibit;
        const st = useChatStore.getState();
        st.setContext({ exhibitId: ex.id, labelSlug: ex.labelSlug });
        const s = await story.mutateAsync({ exhibitId: ex.id, maxQuestions: 4 });
        st.addMessage({
          id: uid("story"),
          role: "assistant",
          content: s.text,
          createdAt: new Date().toISOString(),
          suggestions: s.suggestedQuestions,
          exhibit: toPlaque(ex),
        });
      } else {
        const names = (res.candidates ?? []).map((c) => c.name).filter((n): n is string => !!n);
        useChatStore.getState().addMessage({
          id: uid("msg"),
          role: "assistant",
          content:
            "Не удалось уверенно распознать экспонат на фото. Попробуй снять крупнее или с другого ракурса.",
          createdAt: new Date().toISOString(),
          suggestions: names.length > 0 ? names : undefined,
        });
      }
    } catch {
      useChatStore.getState().addMessage({
        id: uid("err"),
        role: "assistant",
        content: "Не получилось обработать фото. Попробуй ещё раз.",
        createdAt: new Date().toISOString(),
      });
    }
  };

  const busy = chat.isPending || story.isPending || recognize.isPending;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const suggestions = busy
    ? undefined
    : messages.length === 0
      ? DEFAULT_PROMPTS
      : lastAssistant?.suggestions;

  const headerContext = contextExhibit
    ? { label: contextExhibit.name, hint: contextExhibit.yearCreated?.toString() }
    : contextHall
      ? {
          label: contextHall.name ?? `Зал № ${contextHall.hallNumber}`,
          hint: `зал № ${contextHall.hallNumber}`,
        }
      : null;

  const header = headerContext ? (
    <div className="border-border bg-muted/30 flex items-center gap-2 border px-3 py-2 text-xs">
      <Sparkles className="text-accent h-3.5 w-3.5 shrink-0" />
      <span className="text-muted-foreground">
        Спрашиваешь о <strong className="text-foreground font-medium">{headerContext.label}</strong>
        {headerContext.hint && ` · ${headerContext.hint}`}
      </span>
    </div>
  ) : messages.length === 0 ? (
    <div className="text-center">
      <Sparkles className="text-accent mx-auto h-7 w-7" />
      <h1 className="font-display mt-3 text-xl tracking-tight">Чат с AI-гидом</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Спроси что угодно о коллекции или пришли фото экспоната — я подскажу, что это.
      </p>
    </div>
  ) : null;

  // Первоначальная загрузка рассказа — экран ожидания только для пустого треда.
  const initializing = story.isPending && messages.length === 0;

  return (
    <Screen>
      <AppBar onBack={safeBack} title="AI-гид" />
      {initializing ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Открываем чат</p>
        </main>
      ) : (
        <ChatThread
          messages={messages}
          thinking={busy}
          suggestions={suggestions}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          onAttachPhoto={handleAttachPhoto}
          header={header}
          disabled={busy}
          renderMessageTrailing={(m) =>
            m.role === "assistant" ? <AudioButton audioKey={m.id} text={m.content} /> : null
          }
        />
      )}
    </Screen>
  );
}
