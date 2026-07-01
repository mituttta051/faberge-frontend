"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { IconButton } from "@/components/ui/icon-button";
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
import { useChatStore } from "@/lib/store/chat-store";
import type { ChatContext } from "@/lib/types";

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

  const story = useGenerateStory();
  const chat = useChatWithGuide();
  const recognize = useRecognizeExhibit();

  const [localId, setLocalId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const initRef = useRef(false);

  // Активный чат из стора — единый источник правды для сообщений/контекста.
  const session = useChatStore((s) => (localId ? s.chats[localId] : undefined));
  const messages = session?.messages ?? [];
  const context = session?.context;

  const { data: contextExhibit } = useExhibit(context?.exhibitId);
  const { data: contextHall } = useHall(context?.hallId);

  // Инициализация: открыть сохранённый чат (?session=) либо создать новый.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const store = useChatStore.getState();

    const sessionParam = searchParams.get("session");
    if (sessionParam && store.getChat(sessionParam)) {
      setLocalId(sessionParam);
      return;
    }

    const exhibitId = searchParams.get("exhibit") ? Number(searchParams.get("exhibit")) : undefined;
    const hallId = searchParams.get("hall") ? Number(searchParams.get("hall")) : undefined;
    const labelSlug = searchParams.get("label") ?? undefined;
    const ctx: ChatContext = { exhibitId, hallId, labelSlug };
    const hasCtx = exhibitId !== undefined || hallId !== undefined || !!labelSlug;

    // Без контекста (общий чат с главной) — не создаём пустой чат заранее,
    // он появится в истории только после первого сообщения (см. ensureChat).
    if (!hasCtx) return;

    const id = store.createChat({ context: ctx });
    setLocalId(id);
    // Подменяем URL — reload/назад откроют этот же сохранённый чат.
    router.replace(`/chat?session=${id}`);

    // Для экспоната/label сразу генерируем вступительный рассказ.
    if (exhibitId !== undefined || labelSlug) {
      story.mutate(
        { exhibitId, labelSlug, maxQuestions: 4 },
        {
          onSuccess: (s) => {
            store.setMessages(id, [
              {
                id: uid("story"),
                role: "assistant",
                content: s.text,
                createdAt: new Date().toISOString(),
                suggestions: s.suggestedQuestions,
                audioUrl: s.audioUrl,
              },
            ]);
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Заголовок чата для истории: имя экспоната/зала или первый вопрос пользователя.
  useEffect(() => {
    if (!localId || !session || session.title !== "Новый чат") return;
    const firstUser = session.messages.find((m) => m.role === "user")?.content;
    const title =
      contextExhibit?.name ??
      (contextHall ? (contextHall.name ?? `Зал № ${contextHall.hallNumber}`) : undefined) ??
      (firstUser ? firstUser.slice(0, 48) : undefined);
    if (title) useChatStore.getState().setTitle(localId, title);
  }, [localId, session, contextExhibit, contextHall]);

  // Лениво создаём чат на первом действии (для общего чата без контекста).
  const ensureChat = (): string => {
    if (localId) return localId;
    const id = useChatStore.getState().createChat();
    setLocalId(id);
    router.replace(`/chat?session=${id}`);
    return id;
  };

  const handleSubmit = (text: string) => {
    const id = ensureChat();
    const store = useChatStore.getState();
    store.addMessage(id, {
      id: uid("local"),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    });

    chat.mutate(
      { message: text, sessionId: session?.serverSessionId, context, maxQuestions: 3 },
      {
        onSuccess: (res) => {
          store.setServerSessionId(id, res.sessionId);
          store.addMessage(id, {
            id: uid("msg"),
            role: "assistant",
            content: res.answer,
            createdAt: new Date().toISOString(),
            suggestions: res.suggestedQuestions,
          });
        },
        onError: () => {
          store.addMessage(id, {
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
    const id = ensureChat();
    const store = useChatStore.getState();
    const previewUrl = URL.createObjectURL(file);
    store.addMessage(id, {
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
        store.setContext(id, { exhibitId: ex.id, labelSlug: ex.labelSlug });
        store.setTitle(id, ex.name);
        const s = await story.mutateAsync({ exhibitId: ex.id, maxQuestions: 4 });
        store.addMessage(id, {
          id: uid("story"),
          role: "assistant",
          content: `На фото — **${ex.name}**.\n\n${s.text}`,
          createdAt: new Date().toISOString(),
          suggestions: s.suggestedQuestions,
          imageUrl: ex.photoUrl,
        });
      } else {
        const names = (res.candidates ?? []).map((c) => c.name).filter((n): n is string => !!n);
        store.addMessage(id, {
          id: uid("msg"),
          role: "assistant",
          content:
            "Не удалось уверенно распознать экспонат на фото. Попробуй снять крупнее или с другого ракурса.",
          createdAt: new Date().toISOString(),
          suggestions: names.length > 0 ? names : undefined,
        });
      }
    } catch {
      store.addMessage(id, {
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

  // Первоначальная загрузка рассказа — экран ожидания
  const initializing = story.isPending && messages.length === 0;

  return (
    <Screen>
      <AppBar
        onBack={() => router.back()}
        title="AI-гид"
        right={
          <IconButton aria-label="История чатов" variant="ghost" onClick={() => router.push("/chats")}>
            <History />
          </IconButton>
        }
      />
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
