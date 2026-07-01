import { http, HttpResponse, delay } from "msw";
import { halls, type MockHall } from "./data/halls";
import { showcases } from "./data/showcases";
import { exhibits, type MockExhibit } from "./data/exhibits";

/** Имитация сетевой задержки — даём UI показать лоадеры. */
const NETWORK_DELAY_MS = 300;

/** In-memory история диалога по session_id (живёт в рамках вкладки). */
const chatHistory = new Map<string, { role: "user" | "assistant"; content: string }[]>();

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function paged<T>(items: T[], url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  };
}

// ============================
// Мапперы mock → wire (snake_case как в OpenAPI)
// ============================

function hallWire(h: MockHall) {
  return {
    id: h.id,
    hall_number: h.hallNumber,
    name: h.name,
    description: h.description ?? h.shortDescription,
    cover_image_url: h.coverImageUrl ?? null,
    showcase_count: showcases.filter((s) => s.hallId === h.id).length,
    exhibit_count: exhibits.filter((e) => e.hallId === h.id).length,
  };
}

function hallBriefWire(h: MockHall) {
  return { id: h.id, hall_number: h.hallNumber, name: h.name };
}

function showcaseWire(s: (typeof showcases)[number]) {
  return {
    id: s.id,
    hall_id: s.hallId,
    showcase_number: s.showcaseNumber,
    name: s.name ?? null,
    exhibit_count: exhibits.filter((e) => e.showcaseId === s.id).length,
  };
}

function showcaseBriefWire(s: (typeof showcases)[number]) {
  return { id: s.id, showcase_number: s.showcaseNumber };
}

function exhibitSummaryWire(e: MockExhibit) {
  return {
    id: e.id,
    label_slug: e.labelSlug,
    name: e.name,
    year_created: e.yearCreated ?? null,
    master_name: e.masterName ?? null,
    thumbnail_url: e.photoUrl ?? null,
    hall_id: e.hallId,
    showcase_id: e.showcaseId,
  };
}

function exhibitWire(e: MockExhibit) {
  const hall = halls.find((h) => h.id === e.hallId);
  const showcase = showcases.find((s) => s.id === e.showcaseId);
  return {
    id: e.id,
    label_slug: e.labelSlug,
    name: e.name,
    year_created: e.yearCreated ?? null,
    master_name: e.masterName ?? null,
    material: e.material ?? null,
    short_description: e.shortDescription ?? null,
    image_url: e.photoUrl ?? null,
    model_3d_url: null,
    audio_url: null,
    hall: hall ? hallBriefWire(hall) : null,
    showcase: showcase ? showcaseBriefWire(showcase) : null,
  };
}

/** Admin-представление экспоната: как exhibitWire, но с raw_history и *_id. */
function adminExhibitWire(e: MockExhibit) {
  return {
    id: e.id,
    showcase_id: e.showcaseId,
    hall_id: e.hallId,
    label_slug: e.labelSlug,
    name: e.name,
    year_created: e.yearCreated ?? null,
    master_name: e.masterName ?? null,
    material: e.material ?? null,
    short_description: e.shortDescription ?? null,
    image_url: e.photoUrl ?? null,
    raw_history: e.rawHistory ?? null,
  };
}

/** Следующий свободный id для коллекции. */
function nextId(items: { id: number }[]): number {
  return items.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

interface WireHallBody {
  hall_number?: number;
  name?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
}
interface WireShowcaseBody {
  hall_id?: number;
  showcase_number?: number;
  name?: string | null;
}
interface WireExhibitBody {
  showcase_id?: number | null;
  hall_id?: number | null;
  label_slug?: string | null;
  name?: string;
  year_created?: number | null;
  master_name?: string | null;
  material?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  raw_history?: string | null;
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

  http.get("*/halls", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    return HttpResponse.json(paged(halls.map(hallWire), new URL(request.url)));
  }),

  http.get("*/halls/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const hall = halls.find((h) => h.id === Number(params.id));
    if (!hall) return HttpResponse.json({ detail: "Зал не найден." }, { status: 404 });
    return HttpResponse.json(hallWire(hall));
  }),

  http.get("*/halls/:id/showcases", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const hallId = Number(params.id);
    const list = showcases.filter((s) => s.hallId === hallId).map(showcaseWire);
    return HttpResponse.json(paged(list, new URL(request.url)));
  }),

  http.get("*/halls/:id/exhibits", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const hallId = Number(params.id);
    const list = exhibits.filter((e) => e.hallId === hallId).map(exhibitSummaryWire);
    return HttpResponse.json(paged(list, new URL(request.url)));
  }),

  http.get("*/showcases/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const showcase = showcases.find((s) => s.id === Number(params.id));
    if (!showcase) return HttpResponse.json({ detail: "Витрина не найдена." }, { status: 404 });
    return HttpResponse.json(showcaseWire(showcase));
  }),

  http.get("*/showcases/:id/exhibits", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const showcaseId = Number(params.id);
    const list = exhibits.filter((e) => e.showcaseId === showcaseId).map(exhibitSummaryWire);
    return HttpResponse.json(paged(list, new URL(request.url)));
  }),

  http.get("*/exhibits/by-slug/:slug", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const exhibit = exhibits.find((e) => e.labelSlug === String(params.slug));
    if (!exhibit) return HttpResponse.json({ detail: "Экспонат не найден." }, { status: 404 });
    return HttpResponse.json(exhibitWire(exhibit));
  }),

  http.get("*/exhibits/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const exhibit = exhibits.find((e) => e.id === Number(params.id));
    if (!exhibit) return HttpResponse.json({ detail: "Экспонат не найден." }, { status: 404 });
    return HttpResponse.json(exhibitWire(exhibit));
  }),

  http.get("*/exhibits/:id/related", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const id = Number(params.id);
    const exhibit = exhibits.find((e) => e.id === id);
    const related = exhibit
      ? exhibits.filter((e) => e.hallId === exhibit.hallId && e.id !== id)
      : [];
    return HttpResponse.json(paged(related.map(exhibitSummaryWire), new URL(request.url)));
  }),

  // ============================
  // Admin: списки всех витрин / экспонатов
  // ============================

  http.get("*/showcases", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    return HttpResponse.json(paged(showcases.map(showcaseWire), new URL(request.url)));
  }),

  http.get("*/exhibits", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    return HttpResponse.json(paged(exhibits.map(adminExhibitWire), new URL(request.url)));
  }),

  // ============================
  // Admin CRUD: залы
  // ============================

  http.post("*/halls", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json().catch(() => ({}))) as WireHallBody;
    const hall: MockHall = {
      id: nextId(halls),
      hallNumber: body.hall_number ?? nextId(halls),
      name: body.name ?? "",
      shortDescription: body.description ?? "",
      description: body.description ?? undefined,
      coverImageUrl: body.cover_image_url ?? undefined,
    };
    halls.push(hall);
    return HttpResponse.json(hallWire(hall), { status: 201 });
  }),

  http.patch("*/halls/:id", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const hall = halls.find((h) => h.id === Number(params.id));
    if (!hall) return HttpResponse.json({ detail: "Зал не найден." }, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as WireHallBody;
    if (body.hall_number !== undefined) hall.hallNumber = body.hall_number;
    if (body.name !== undefined) hall.name = body.name ?? "";
    if (body.description !== undefined) {
      hall.description = body.description ?? undefined;
      hall.shortDescription = body.description ?? "";
    }
    if (body.cover_image_url !== undefined) hall.coverImageUrl = body.cover_image_url ?? undefined;
    return HttpResponse.json(hallWire(hall));
  }),

  http.delete("*/halls/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const id = Number(params.id);
    const idx = halls.findIndex((h) => h.id === id);
    if (idx === -1) return HttpResponse.json({ detail: "Зал не найден." }, { status: 404 });
    // Каскад: удаляем витрины зала и их экспонаты.
    const showcaseIds = showcases.filter((s) => s.hallId === id).map((s) => s.id);
    for (let i = exhibits.length - 1; i >= 0; i--) {
      if (exhibits[i].hallId === id || showcaseIds.includes(exhibits[i].showcaseId)) {
        exhibits.splice(i, 1);
      }
    }
    for (let i = showcases.length - 1; i >= 0; i--) {
      if (showcases[i].hallId === id) showcases.splice(i, 1);
    }
    halls.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================
  // Admin CRUD: витрины
  // ============================

  http.post("*/showcases", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json().catch(() => ({}))) as WireShowcaseBody;
    const showcase = {
      id: nextId(showcases),
      hallId: body.hall_id ?? 0,
      showcaseNumber: body.showcase_number ?? nextId(showcases),
      name: body.name ?? "",
    };
    showcases.push(showcase);
    return HttpResponse.json(showcaseWire(showcase), { status: 201 });
  }),

  http.patch("*/showcases/:id", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const showcase = showcases.find((s) => s.id === Number(params.id));
    if (!showcase) return HttpResponse.json({ detail: "Витрина не найдена." }, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as WireShowcaseBody;
    if (body.hall_id !== undefined) showcase.hallId = body.hall_id;
    if (body.showcase_number !== undefined) showcase.showcaseNumber = body.showcase_number;
    if (body.name !== undefined) showcase.name = body.name ?? "";
    return HttpResponse.json(showcaseWire(showcase));
  }),

  http.delete("*/showcases/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const id = Number(params.id);
    const idx = showcases.findIndex((s) => s.id === id);
    if (idx === -1) return HttpResponse.json({ detail: "Витрина не найдена." }, { status: 404 });
    for (let i = exhibits.length - 1; i >= 0; i--) {
      if (exhibits[i].showcaseId === id) exhibits.splice(i, 1);
    }
    showcases.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================
  // Admin CRUD: экспонаты
  // ============================

  http.post("*/exhibits", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json().catch(() => ({}))) as WireExhibitBody;
    const id = nextId(exhibits);
    const exhibit: MockExhibit = {
      id,
      showcaseId: body.showcase_id ?? 0,
      hallId: body.hall_id ?? 0,
      labelSlug: body.label_slug ?? `exhibit_${id}`,
      name: body.name ?? "",
      yearCreated: body.year_created ?? undefined,
      masterName: body.master_name ?? undefined,
      material: body.material ?? undefined,
      shortDescription: body.short_description ?? "",
      photoUrl: body.image_url ?? undefined,
      rawHistory: body.raw_history ?? undefined,
    };
    exhibits.push(exhibit);
    return HttpResponse.json(adminExhibitWire(exhibit), { status: 201 });
  }),

  http.patch("*/exhibits/:id", async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS);
    const exhibit = exhibits.find((e) => e.id === Number(params.id));
    if (!exhibit) return HttpResponse.json({ detail: "Экспонат не найден." }, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as WireExhibitBody;
    if (body.showcase_id !== undefined) exhibit.showcaseId = body.showcase_id ?? 0;
    if (body.hall_id !== undefined) exhibit.hallId = body.hall_id ?? 0;
    if (body.label_slug !== undefined) exhibit.labelSlug = body.label_slug ?? exhibit.labelSlug;
    if (body.name !== undefined) exhibit.name = body.name;
    if (body.year_created !== undefined) exhibit.yearCreated = body.year_created ?? undefined;
    if (body.master_name !== undefined) exhibit.masterName = body.master_name ?? undefined;
    if (body.material !== undefined) exhibit.material = body.material ?? undefined;
    if (body.short_description !== undefined)
      exhibit.shortDescription = body.short_description ?? "";
    if (body.image_url !== undefined) exhibit.photoUrl = body.image_url ?? undefined;
    if (body.raw_history !== undefined) exhibit.rawHistory = body.raw_history ?? undefined;
    return HttpResponse.json(adminExhibitWire(exhibit));
  }),

  http.delete("*/exhibits/:id", async ({ params }) => {
    await delay(NETWORK_DELAY_MS);
    const idx = exhibits.findIndex((e) => e.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ detail: "Экспонат не найден." }, { status: 404 });
    exhibits.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================
  // Поиск
  // ============================

  http.get("*/search", async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) {
      return HttpResponse.json({ query: "", halls: [], exhibits: [], total: 0 });
    }
    const hallHits = halls.filter(
      (h) => h.name.toLowerCase().includes(q) || h.shortDescription.toLowerCase().includes(q),
    );
    const exhibitHits = exhibits.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q) ||
        (e.masterName ?? "").toLowerCase().includes(q),
    );
    return HttpResponse.json({
      query: q,
      halls: hallHits.map(hallWire),
      exhibits: exhibitHits.map(exhibitSummaryWire),
      total: hallHits.length + exhibitHits.length,
    });
  }),

  // ============================
  // Распознавание фото (YOLO)
  // ============================

  http.post("*/recognition", async () => {
    await delay(1200);
    const exhibit = pickRandom(exhibits);
    const confidence = 0.85 + Math.random() * 0.14;
    return HttpResponse.json({
      recognized: true,
      label_slug: exhibit.labelSlug,
      confidence,
      exhibit: exhibitWire(exhibit),
      candidates: [],
      request_id: crypto.randomUUID(),
      processing_ms: 300 + Math.floor(Math.random() * 200),
    });
  }),

  // ============================
  // ИИ-гид: рассказ
  // ============================

  http.post("*/guide/story", async ({ request }) => {
    await delay(1200);
    const body = (await request.json().catch(() => ({}))) as {
      exhibit_id?: number;
      label_slug?: string;
    };
    const exhibit =
      (body.exhibit_id ? exhibits.find((e) => e.id === body.exhibit_id) : undefined) ??
      (body.label_slug ? exhibits.find((e) => e.labelSlug === body.label_slug) : undefined);
    if (!exhibit) {
      return HttpResponse.json({ detail: "Экспонат не найден." }, { status: 404 });
    }
    return HttpResponse.json({
      exhibit_id: exhibit.id,
      label_slug: exhibit.labelSlug,
      style: "engaging",
      text: `**${exhibit.name}** (${exhibit.yearCreated ?? "—"})\n\n${exhibit.rawHistory ?? exhibit.shortDescription}`,
      suggested_questions: makeSuggestions(exhibit.name),
      audio_url: null,
      model: "yandexgpt/latest",
    });
  }),

  // ============================
  // ИИ-гид: диалог
  // ============================

  http.post("*/guide/chat", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      session_id?: string;
      message?: string;
      context?: { exhibit_id?: number; label_slug?: string; hall_id?: number };
    };

    const sessionId = body.session_id ?? crypto.randomUUID();
    const history = chatHistory.get(sessionId) ?? [];
    history.push({ role: "user", content: body.message ?? "" });

    await delay(1500);

    const hall = body.context?.hall_id
      ? halls.find((h) => h.id === body.context!.hall_id)
      : undefined;
    const exhibit =
      (body.context?.exhibit_id
        ? exhibits.find((e) => e.id === body.context!.exhibit_id)
        : undefined) ??
      (body.context?.label_slug
        ? exhibits.find((e) => e.labelSlug === body.context!.label_slug)
        : undefined);

    let answer: string;
    let suggestions: string[];
    if (exhibit) {
      answer = `Об экспонате «${exhibit.name}»: ${exhibit.rawHistory ?? exhibit.shortDescription}`;
      suggestions = makeSuggestions(exhibit.name);
    } else if (hall) {
      answer = `${hall.description ?? hall.shortDescription}`;
      suggestions = [
        `Какие экспонаты в зале «${hall.name}»?`,
        "Что самое интересное?",
        "С чего начать осмотр?",
      ];
    } else {
      answer = "Я пока не знаю об этом. Попробуйте указать конкретный зал или экспонат.";
      suggestions = [];
    }

    history.push({ role: "assistant", content: answer });
    chatHistory.set(sessionId, history);

    return HttpResponse.json({
      session_id: sessionId,
      answer,
      suggested_questions: suggestions,
      context: body.context
        ? {
            exhibit_id: body.context.exhibit_id ?? null,
            label_slug: body.context.label_slug ?? null,
            hall_id: body.context.hall_id ?? null,
          }
        : null,
    });
  }),

  // ============================
  // TTS — синтез речи (Yandex SpeechKit)
  // ============================

  http.post("*/speech", async () => {
    await delay(800);
    return HttpResponse.json({
      audio_url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/BWV_543-fugue.ogg",
      format: "mp3",
      voice: "alena",
      duration_ms: 21000,
      characters: 250,
      cached: false,
    });
  }),
];
