"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ChatThread } from "@/components/chat/chat-thread";
import { AudioButton } from "@/components/audio/audio-button";
import {
  useChatWithGuide,
  useExhibit,
  useGenerateStory,
  useHall,
  useRecognizeExhibit,
  useRelatedExhibits,
} from "@/lib/api/hooks";
import { getExhibit, getExhibitBySlug } from "@/lib/api/endpoints";
import { useChatStore } from "@/lib/store/chat-store";
import { compressImage } from "@/lib/image";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { RelatedRecommendations } from "@/components/chat/related-recommendations";
import { hallTitle } from "@/lib/labels";
import { errorMessage } from "@/lib/utils";
import { track } from "@/lib/telemetry";
import type { ChatContext, ChatExhibitCard, ChatExhibitRef, Exhibit } from "@/lib/types";

/** Подсказки для общего чата (без контекста экспоната/зала). */
const DEFAULT_PROMPTS = [
  "Расскажи о музее Фаберже",
  "Что обязательно посмотреть?",
  "Кто такой Карл Фаберже?",
];

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `${prefix}_${crypto.randomUUID()}`;
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

  /*
   * Открытие чата — знаменатель конверсии «дошли до диалога», поэтому событие
   * шлём один раз за монтирование экрана, а не на каждое изменение контекста.
   *
   * Контекст берём из query, а из треда — только как запасной вариант: эффект
   * ниже, который переносит `?exhibit=…` в стор, отрабатывает уже после этого,
   * и чат, открытый с карточки, уходил бы в аналитику как чат без контекста.
   * Порядок эффектов тут значим — этот объявлен раньше и query ещё не стёрт
   * `router.replace`.
   */
  const chatOpenSentRef = useRef(false);
  useEffect(() => {
    if (!mounted || chatOpenSentRef.current) return;
    chatOpenSentRef.current = true;
    const ctx = useChatStore.getState().chat?.context;
    const fromUrl = (name: string) => {
      const raw = searchParams.get(name);
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };
    track({
      type: "chat_open",
      exhibitId: fromUrl("exhibit") ?? ctx?.exhibitId,
      hallId: fromUrl("hall") ?? ctx?.hallId,
    });
    // searchParams в зависимости не кладём: событие одноразовое, а замена
    // адреса на «/chat» повторно эффект дёргать не должна.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const { data: contextExhibit } = useExhibit(context?.exhibitId);
  const { data: contextHall } = useHall(context?.hallId);
  const { data: relatedExhibits } = useRelatedExhibits(context?.exhibitId);

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
    if (!hasCtx) {
      // Контекст из URL уже применён в этом монтировании, а параметры пропали
      // из-за router.replace («/chat» ниже) — это не «посетитель открыл общий чат».
      if (processedContextRef.current !== null) return;
      // Общий чат (кнопка с главного экрана): контекст прошлого зала не должен
      // сужать ответы — иначе на общий вопрос гид отвечает «в материалах о зале
      // такого нет». Пустой контекст бэкенд трактует как явный сброс сессии.
      const store = useChatStore.getState();
      const current = store.chat?.context;
      if (current && Object.values(current).some((v) => v !== undefined)) {
        store.setContext({});
      }
      return;
    }

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
      const exhibitPromise: Promise<Exhibit | null> =
        exhibitId !== undefined
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
    // Текст вопроса нужен отчёту «частые вопросы»; экспонат и зал — чтобы
    // понять, у какой карточки не хватает описания.
    track({
      type: "chat_message",
      exhibitId: context?.exhibitId,
      hallId: context?.hallId,
      props: { text },
    });
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
            referencedExhibits: res.referencedExhibits,
            referencedHalls: res.referencedHalls,
            location: res.location,
          });
        },
        onError: () => {
          useChatStore.getState().addMessage({
            id: uid("err"),
            role: "assistant",
            content: "Не получилось ответить. Попробуйте ещё раз.",
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
    // Снимок с телефона — это 3–6 МБ, а API Gateway режет запрос на 3.5 МБ и
    // отвечает без CORS-заголовков: браузер видит «Failed to fetch», и вместо
    // распознавания в чат падала ошибка (баг-репорт 06.08.2026). Экран
    // сканирования не ломался, потому что берёт кадр из canvas.
    // Превью тоже рисуем по сжатому файлу — держать в памяти оригинал незачем.
    // Не смогли декодировать (экзотический формат) — отправляем как есть:
    // решение об отказе тогда за сервером, а не за нами.
    const photo = await compressImage(file).catch(() => file);
    const previewUrl = URL.createObjectURL(photo);
    store.addMessage({
      id: uid("photo"),
      role: "user",
      content: "Что это за экспонат?",
      createdAt: new Date().toISOString(),
      imageUrl: previewUrl,
    });

    try {
      const res = await recognize.mutateAsync(photo);
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
        // E19 — топ-3 кандидата: у кого есть карточка, показываем плашкой с фото,
        // остальных (без exhibitId) оставляем подсказками-именами для дозапроса.
        const candidates = res.candidates ?? [];
        const refs: ChatExhibitRef[] = candidates
          .filter((c): c is typeof c & { exhibitId: number } => c.exhibitId !== undefined)
          .map((c) => ({
            id: c.exhibitId,
            name: c.name ?? c.labelSlug,
            thumbnailUrl: c.thumbnailUrl,
          }));
        const names = candidates
          .filter((c) => c.exhibitId === undefined)
          .map((c) => c.name)
          .filter((n): n is string => !!n);
        useChatStore.getState().addMessage({
          id: uid("msg"),
          role: "assistant",
          content:
            "Не удалось уверенно распознать экспонат на фото. Попробуйте снять крупнее или с другого ракурса.",
          createdAt: new Date().toISOString(),
          referencedExhibits: refs.length > 0 ? refs : undefined,
          referencedExhibitsLabel: "Возможно, это",
          suggestions: names.length > 0 ? names : undefined,
        });
      }
    } catch (err) {
      useChatStore.getState().addMessage({
        id: uid("err"),
        role: "assistant",
        // Причину показываем словами: «не дошло до сервера» и «сервер отказал» —
        // это разные действия посетителя, а раньше оба выглядели одинаково.
        content: errorMessage(err, "Не получилось обработать фото. Попробуйте ещё раз."),
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Сброс треда — за подтверждением: переписка живёт только в браузере
  // посетителя, восстановить её после случайного нажатия нечем.
  const [resetOpen, setResetOpen] = useState(false);
  const handleReset = () => {
    useChatStore.getState().clear();
    setInput("");
    setResetOpen(false);
  };

  const busy = chat.isPending || story.isPending || recognize.isPending;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const suggestions = busy
    ? undefined
    : messages.length === 0
      ? DEFAULT_PROMPTS
      : lastAssistant?.suggestions;

  const headerContext = contextExhibit
    ? { label: contextExhibit.name, hint: contextExhibit.yearCreated }
    : contextHall
      ? {
          label: hallTitle(contextHall),
          hint: contextHall.hallNumber != null ? `зал № ${contextHall.hallNumber}` : undefined,
        }
      : null;

  const header = headerContext ? (
    <div className="border-border bg-muted/30 flex items-center gap-2 border px-3 py-2 text-xs">
      <Sparkles className="text-accent h-3.5 w-3.5 shrink-0" />
      <span className="text-muted-foreground">
        Спрашиваете о <strong className="text-foreground font-medium">{headerContext.label}</strong>
        {headerContext.hint && ` · ${headerContext.hint}`}
      </span>
    </div>
  ) : messages.length === 0 ? (
    <div className="text-center">
      <Sparkles className="text-accent mx-auto h-7 w-7" />
      <h1 className="font-display mt-3 text-xl tracking-tight">Чат с AI-гидом</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Спросите что угодно о коллекции или пришлите фото экспоната — я подскажу, что это.
      </p>
    </div>
  ) : null;

  // Первоначальная загрузка рассказа — экран ожидания только для пустого треда.
  const initializing = story.isPending && messages.length === 0;

  return (
    <Screen>
      <AppBar
        onBack={safeBack}
        title="AI-гид"
        right={
          messages.length > 0 ? (
            <IconButton
              aria-label="Начать заново"
              title="Начать заново"
              variant="ghost"
              size="md"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw />
            </IconButton>
          ) : null
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
          belowSuggestions={
            relatedExhibits && relatedExhibits.length > 0 ? (
              <RelatedRecommendations items={relatedExhibits} excludeId={context?.exhibitId} />
            ) : null
          }
        />
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Начать диалог заново?"
        description="Переписка с гидом сотрётся — она хранится только в этом браузере."
        confirmLabel="Начать заново"
        onConfirm={handleReset}
      />
    </Screen>
  );
}
