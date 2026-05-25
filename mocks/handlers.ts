import { http, HttpResponse, delay } from "msw";
import type {
  ChatMessage,
  ChatSession,
  RecognizeResult,
  SearchResponse,
  SearchResult,
} from "@/lib/types";
import { halls, showcases, exhibits } from "./data";

/** Имитация сетевой задержки — даём UI показать лоадеры. */
const NETWORK_DELAY_MS = 300;

/** In-memory хранилище чат-сессий (живёт в рамках вкладки). */
const chatSessions = new Map<string, ChatSession>();

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeSuggestions(exhibitName: string): string[] {
  return [
    `Кто создал ${exhibitName}?`,
    "Сколько времени ушло на создание?",
    "Какие материалы использовались?",
  ];
}

export const handlers = [
  // ============================
  // Каталог: залы, витрины, экспонаты
  // ============================

  http.get("*/halls", async () => {
    await delay(NETWORK_DELAY_MS);
    return HttpResponse.json(halls);
  }),

  http.get("*/halls/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const hall = halls.find((h) => h.id === Number(params.id));
    if (!hall) return HttpResponse.json({ error: "Hall not found" }, { status: 404 });
    return HttpResponse.json(hall);
  }),

  http.get("*/halls/:id/showcases", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const hallId = Number(params.id);
    const list = showcases.filter((s) => s.hallId === hallId);
    return HttpResponse.json(list);
  }),

  http.get("*/halls/:id/exhibits", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const hallId = Number(params.id);
    const list = exhibits.filter((e) => e.hallId === hallId);
    return HttpResponse.json(list);
  }),

  http.get("*/showcases/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const showcase = showcases.find((s) => s.id === Number(params.id));
    if (!showcase) return HttpResponse.json({ error: "Showcase not found" }, { status: 404 });
    return HttpResponse.json(showcase);
  }),

  http.get("*/showcases/:id/exhibits", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const showcaseId = Number(params.id);
    const list = exhibits.filter((e) => e.showcaseId === showcaseId);
    return HttpResponse.json(list);
  }),

  http.get("*/exhibits/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const exhibit = exhibits.find((e) => e.id === Number(params.id));
    if (!exhibit) return HttpResponse.json({ error: "Exhibit not found" }, { status: 404 });
    return HttpResponse.json(exhibit);
  }),

  http.get("*/exhibits/:id/related", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const id = Number(params.id);
    const exhibit = exhibits.find((e) => e.id === id);
    if (!exhibit) return HttpResponse.json([]);
    const related = exhibits.filter((e) => e.hallId === exhibit.hallId && e.id !== id);
    return HttpResponse.json(related);
  }),

  // ============================
  // Поиск
  // ============================

  http.get("*/search", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) {
      return HttpResponse.json({ query: "", results: [] } satisfies SearchResponse);
    }
    const results: SearchResult[] = [
      ...halls
        .filter(
          (h) => h.name.toLowerCase().includes(q) || h.shortDescription.toLowerCase().includes(q),
        )
        .map((hall) => ({ kind: "hall", hall }) as const),
      ...exhibits
        .filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.shortDescription.toLowerCase().includes(q) ||
            (e.masterName ?? "").toLowerCase().includes(q),
        )
        .map((exhibit) => ({ kind: "exhibit", exhibit }) as const),
    ];
    return HttpResponse.json({ query: q, results } satisfies SearchResponse);
  }),

  // ============================
  // Распознавание фото (YOLO)
  // ============================

  http.post("*/recognize", async () => {
    // Имитируем работу модели — задержка побольше
    await delay(1200);
    const exhibit = pickRandom(exhibits);
    const result: RecognizeResult = {
      labelSlug: exhibit.labelSlug,
      confidence: 0.85 + Math.random() * 0.14,
      exhibitId: exhibit.id,
    };
    return HttpResponse.json(result);
  }),

  // ============================
  // Чат с AI-гидом
  // ============================

  http.post("*/chat/sessions", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json().catch(() => ({}))) as {
      exhibitId?: number;
      labelSlug?: string;
    };
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session: ChatSession = {
      id: sessionId,
      context: { exhibitId: body.exhibitId, labelSlug: body.labelSlug },
      messages: [],
      createdAt: new Date().toISOString(),
    };
    chatSessions.set(sessionId, session);
    return HttpResponse.json(session);
  }),

  http.get("*/chat/sessions/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const session = chatSessions.get(String(params.id));
    if (!session) return HttpResponse.json({ error: "Session not found" }, { status: 404 });
    return HttpResponse.json(session);
  }),

  http.post("*/chat/sessions/:id/messages", async ({ params, request }) => {
    const session = chatSessions.get(String(params.id));
    if (!session) return HttpResponse.json({ error: "Session not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as { content?: string };
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: body.content ?? "",
      createdAt: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // Имитируем "размышление" LLM
    await delay(1500);

    const exhibit = session.context?.exhibitId
      ? exhibits.find((e) => e.id === session.context!.exhibitId)
      : session.context?.labelSlug
        ? exhibits.find((e) => e.labelSlug === session.context!.labelSlug)
        : pickRandom(exhibits);

    const reply = exhibit
      ? `**${exhibit.name}** (${exhibit.yearCreated ?? "—"})\n\n${exhibit.rawHistory ?? exhibit.shortDescription}`
      : "Я пока не знаю об этом экспонате. Попробуйте указать конкретный зал или название.";

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString(),
      suggestions: exhibit ? makeSuggestions(exhibit.name) : undefined,
    };
    session.messages.push(assistantMsg);

    return HttpResponse.json(assistantMsg);
  }),

  // ============================
  // TTS — синтез речи (Yandex SpeechKit)
  // ============================

  http.post("*/tts", async () => {
    await delay(800);
    // В реальности — стрим/blob. Здесь — заглушка с публичным sample mp3.
    return HttpResponse.json({
      audioUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/BWV_543-fugue.ogg",
    });
  }),
];
