import type {
  ChatContext,
  ChatExhibitRef,
  ChatHallRef,
  ChatLocation,
  ChatTurnResult,
  Exhibit,
  Hall,
  QueuedTelemetryEvent,
  RecognitionCandidate,
  RecognizeResult,
  SearchResponse,
  Showcase,
  StoryResult,
} from "@/lib/types";
import { apiUrl, fetchAllPaged, request } from "./client";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// ============================
// Wire-типы (snake_case, как в OpenAPI).
// Маппим в camelCase сразу после fetch, чтобы UI не знал о snake_case.
// ============================

interface WireHall {
  id: number;
  hall_number?: number | null;
  name?: string | null;
  description?: string | null;
  level?: number | null;
  cover_image_url?: string | null;
  is_temporary?: boolean | null;
  is_service?: boolean | null;
  sort_order?: number | null;
  showcase_count?: number | null;
  exhibit_count?: number | null;
  // Превью описания зала (I-3 фидбэка 31.08.2026). На неразвёрнутом проде полей
  // нет — их отсутствие и есть сигнал обрезать текст на клиенте.
  description_preview?: string | null;
  description_has_more?: boolean | null;
}

interface WireHallBrief {
  id: number;
  hall_number?: number | null;
  name?: string | null;
}

interface WireShowcase {
  id: number;
  hall_id: number;
  showcase_number?: number | null;
  name?: string | null;
  exhibit_count?: number | null;
}

interface WireShowcaseBrief {
  id: number;
  showcase_number?: number | null;
  name?: string | null;
}

/**
 * Расположение предмета готовой строкой + структурой (с 31.08.2026).
 *
 * Объект присутствует всегда и пустеет внутрь — но только на обновлённом
 * бэкенде: развёрнутый прод его пока не отдаёт вовсе, поэтому поле
 * необязательное, а маппер откатывается на legacy-дубли `hall`/`showcase`.
 */
interface WireExhibitLocation {
  hall_id?: number | null;
  hall_number?: number | null;
  hall_name?: string | null;
  showcase_id?: number | null;
  showcase_number?: number | null;
  showcase_name?: string | null;
  /** «Зал 4 «Синяя гостиная», витрина 5» — плашка над названием. */
  text?: string | null;
  /** «в зале 4 «Синяя гостиная», витрина 5» — оборот для ответа гида. */
  text_in?: string | null;
}

/** «Фирма и мастер»: `text` — дословный `master_name`, части — его разбор. */
interface WireExhibitMaker {
  text?: string | null;
  firm?: string | null;
  master?: string | null;
}

interface WireExhibitSummary {
  id: number;
  exhibit_number?: string | null;
  label_slug?: string | null;
  name: string;
  year_created?: string | null;
  master_name?: string | null;
  thumbnail_url?: string | null;
  hall_id?: number | null;
  showcase_id?: number | null;
  /** Номер витрины прямо в списке (null — экспонат вне витрин). */
  showcase_number?: number | null;
  is_temporary?: boolean | null;
}

interface WireExhibit {
  id: number;
  exhibit_number?: string | null;
  label_slug?: string | null;
  name: string;
  year_created?: string | null;
  master_name?: string | null;
  material?: string | null;
  techniques?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  model_3d_url?: string | null;
  model_3d_embed?: string | null;
  audio_url?: string | null;
  source_url?: string | null;
  origin_place?: string | null;
  location?: WireExhibitLocation | null;
  maker?: WireExhibitMaker | null;
  // Legacy-дубли location.*: бэкенд оставил их специально, и на текущем проде
  // это единственный источник зала и витрины.
  hall?: WireHallBrief | null;
  showcase?: WireShowcaseBrief | null;
}

interface WirePaged<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

interface WireRecognitionCandidate {
  label_slug: string;
  name?: string | null;
  confidence: number;
  exhibit_id?: number | null;
  thumbnail_url?: string | null;
}

interface WireRecognitionResponse {
  recognized: boolean;
  label_slug?: string | null;
  confidence?: number | null;
  exhibit?: WireExhibit | null;
  candidates?: WireRecognitionCandidate[];
  request_id?: string;
  processing_ms?: number | null;
}

interface WireSearchResponse {
  query: string;
  halls: WireHall[];
  exhibits: WireExhibitSummary[];
  total?: number;
}

interface WireStoryResponse {
  exhibit_id?: number | null;
  label_slug?: string | null;
  style?: string | null;
  text: string;
  suggested_questions: string[];
  audio_url?: string | null;
  model?: string | null;
  generated_at?: string | null;
}

interface WireReferencedExhibit {
  id: number;
  name: string;
  exhibit_number?: string | null;
  thumbnail_url?: string | null;
  hall_number?: number | null;
  showcase_number?: number | null;
}

interface WireReferencedHall {
  id: number;
  hall_number?: number | null;
  name?: string | null;
}

interface WireGuideLocation {
  hall_number?: number | null;
  hall_name?: string | null;
  showcase_number?: number | null;
}

interface WireChatResponse {
  session_id: string;
  answer: string;
  suggested_questions: string[];
  context?: {
    exhibit_id?: number | null;
    label_slug?: string | null;
    hall_id?: number | null;
  } | null;
  referenced_exhibits?: WireReferencedExhibit[];
  referenced_halls?: WireReferencedHall[];
  location?: WireGuideLocation | null;
}

interface WireSpeechResponse {
  audio_url: string;
  format: string;
  voice: string;
  duration_ms?: number | null;
  characters?: number | null;
  cached?: boolean | null;
}

// ============================
// Мапперы wire → domain
// ============================

function mapHall(h: WireHall): Hall {
  return {
    id: h.id,
    hallNumber: h.hall_number ?? undefined,
    name: h.name ?? undefined,
    description: h.description ?? undefined,
    descriptionPreview: h.description_preview ?? undefined,
    descriptionHasMore: h.description_has_more ?? undefined,
    level: h.level ?? undefined,
    coverImageUrl: h.cover_image_url ?? undefined,
    showcaseCount: h.showcase_count ?? undefined,
    exhibitCount: h.exhibit_count ?? undefined,
    isTemporary: h.is_temporary ?? undefined,
    isService: h.is_service ?? undefined,
    sortOrder: h.sort_order ?? undefined,
  };
}

function mapShowcase(s: WireShowcase): Showcase {
  return {
    id: s.id,
    hallId: s.hall_id,
    showcaseNumber: s.showcase_number ?? undefined,
    name: s.name ?? undefined,
    exhibitCount: s.exhibit_count ?? undefined,
  };
}

function mapExhibitSummary(e: WireExhibitSummary): Exhibit {
  return {
    id: e.id,
    exhibitNumber: e.exhibit_number ?? undefined,
    labelSlug: e.label_slug ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    masterName: e.master_name ?? undefined,
    photoUrl: e.thumbnail_url ?? undefined,
    hallId: e.hall_id ?? undefined,
    showcaseId: e.showcase_id ?? undefined,
    showcaseNumber: e.showcase_number ?? undefined,
    isTemporary: e.is_temporary ?? undefined,
  };
}

function mapExhibit(e: WireExhibit): Exhibit {
  return {
    id: e.id,
    exhibitNumber: e.exhibit_number ?? undefined,
    labelSlug: e.label_slug ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    originPlace: e.origin_place ?? undefined,
    // `maker.text` — дословная копия master_name; legacy-поле остаётся запасным
    // на время, пока обновлённый бэкенд не развёрнут.
    masterName: e.maker?.text ?? e.master_name ?? undefined,
    material: e.material ?? undefined,
    techniques: e.techniques ?? undefined,
    shortDescription: e.short_description ?? undefined,
    photoUrl: e.image_url ?? undefined,
    model3dUrl: e.model_3d_url ?? undefined,
    model3dEmbed: e.model_3d_embed ?? undefined,
    audioUrl: e.audio_url ?? undefined,
    sourceUrl: e.source_url ?? undefined,
    // Расположение: сначала `location`, затем legacy-дубли `hall`/`showcase`.
    // Оба источника несут одно и то же — но `location` есть только на
    // обновлённом бэкенде, а `hall`/`showcase` бэкенд обещал не удалять.
    locationText: e.location?.text ?? undefined,
    hallId: e.location?.hall_id ?? e.hall?.id ?? undefined,
    hallNumber: e.location?.hall_number ?? e.hall?.hall_number ?? undefined,
    hallName: e.location?.hall_name ?? e.hall?.name ?? undefined,
    showcaseId: e.location?.showcase_id ?? e.showcase?.id ?? undefined,
    showcaseNumber: e.location?.showcase_number ?? e.showcase?.showcase_number ?? undefined,
  };
}

function mapCandidate(c: WireRecognitionCandidate): RecognitionCandidate {
  return {
    labelSlug: c.label_slug,
    name: c.name ?? undefined,
    confidence: c.confidence,
    exhibitId: c.exhibit_id ?? undefined,
    thumbnailUrl: c.thumbnail_url ?? undefined,
  };
}

function mapReferencedExhibit(e: WireReferencedExhibit): ChatExhibitRef {
  return {
    id: e.id,
    name: e.name,
    exhibitNumber: e.exhibit_number ?? undefined,
    thumbnailUrl: e.thumbnail_url ?? undefined,
    hallNumber: e.hall_number ?? undefined,
    showcaseNumber: e.showcase_number ?? undefined,
  };
}

function mapReferencedHall(h: WireReferencedHall): ChatHallRef {
  return {
    id: h.id,
    hallNumber: h.hall_number ?? undefined,
    name: h.name ?? undefined,
  };
}

function mapGuideLocation(l: WireGuideLocation): ChatLocation {
  return {
    hallNumber: l.hall_number ?? undefined,
    hallName: l.hall_name ?? undefined,
    showcaseNumber: l.showcase_number ?? undefined,
  };
}

// ============================
// Каталог
// ============================

export async function getHalls(
  opts: { isTemporary?: boolean; includeService?: boolean } = {},
): Promise<Hall[]> {
  const query = {
    is_temporary: opts.isTemporary !== undefined ? String(opts.isTemporary) : undefined,
    // Служебные записи каталога (Парадная лестница) бэкенд из `GET /halls`
    // исключает — посетителю их видеть незачем. Админке наоборот: без флага
    // служебный зал пропадает и из панели, и управлять им становится нечем.
    include_service: opts.includeService ? "true" : undefined,
  };
  return (await fetchAllPaged<WireHall>("/halls", { query })).map(mapHall);
}

export async function getHall(id: number): Promise<Hall> {
  const res = await request<WireHall>(`/halls/${id}`);
  return mapHall(res);
}

export async function getHallShowcases(hallId: number): Promise<Showcase[]> {
  const items = await fetchAllPaged<WireShowcase>(`/halls/${hallId}/showcases`);
  return items.map(mapShowcase);
}

/**
 * Все экспонаты зала, а не первая сотня.
 *
 * `limit` у бэкенда ограничен сотней, а в Аванзале 259 экспонатов, в Бежевом 215:
 * одностраничный запрос молча обрезал список, и заказчик видел это как «часть
 * витрин пустая, экспонаты не завели» (баг-репорт 06.08.2026).
 */
export async function getHallExhibits(hallId: number): Promise<Exhibit[]> {
  const items = await fetchAllPaged<WireExhibitSummary>(`/halls/${hallId}/exhibits`);
  return items.map(mapExhibitSummary);
}

export async function getShowcase(id: number): Promise<Showcase> {
  const res = await request<WireShowcase>(`/showcases/${id}`);
  return mapShowcase(res);
}

export async function getShowcaseExhibits(id: number): Promise<Exhibit[]> {
  const items = await fetchAllPaged<WireExhibitSummary>(`/showcases/${id}/exhibits`);
  return items.map(mapExhibitSummary);
}

export async function getExhibit(id: number): Promise<Exhibit> {
  const res = await request<WireExhibit>(`/exhibits/${id}`);
  return mapExhibit(res);
}

export async function getExhibitBySlug(labelSlug: string): Promise<Exhibit> {
  const res = await request<WireExhibit>(`/exhibits/by-slug/${labelSlug}`);
  return mapExhibit(res);
}

export async function getRelatedExhibits(id: number): Promise<Exhibit[]> {
  const res = await request<WirePaged<WireExhibitSummary>>(`/exhibits/${id}/related`);
  return res.items.map(mapExhibitSummary);
}

// ============================
// Поиск
// ============================

export async function searchCatalog(query: string): Promise<SearchResponse> {
  const res = await request<WireSearchResponse>("/search", { query: { q: query } });
  return {
    query: res.query,
    halls: res.halls.map(mapHall),
    exhibits: res.exhibits.map(mapExhibitSummary),
    total: res.total,
  };
}

// ============================
// Распознавание фото
// ============================

export interface RecognizeInput {
  photo: Blob;
  hallId?: number;
  topK?: number;
}

export async function recognizeExhibit(input: RecognizeInput | Blob): Promise<RecognizeResult> {
  const { photo, hallId, topK } = input instanceof Blob ? { photo: input } : input;
  const formData = new FormData();
  formData.append("file", photo, "exhibit.jpg");
  if (hallId !== undefined) formData.append("hall_id", String(hallId));
  if (topK !== undefined) formData.append("top_k", String(topK));
  const res = await request<WireRecognitionResponse>("/recognition", {
    method: "POST",
    body: formData,
    timeoutMs: 30_000,
  });
  return {
    recognized: res.recognized,
    labelSlug: res.label_slug ?? undefined,
    confidence: res.confidence ?? undefined,
    exhibit: res.exhibit ? mapExhibit(res.exhibit) : undefined,
    candidates: res.candidates?.map(mapCandidate),
    requestId: res.request_id,
    processingMs: res.processing_ms ?? undefined,
  };
}

// ============================
// ИИ-гид: рассказ и диалог
// ============================

export interface StoryInput {
  exhibitId?: number;
  labelSlug?: string;
  style?: "engaging" | "historical" | "short" | "kids" | "expert";
  language?: string;
  includeAudio?: boolean;
  maxQuestions?: number;
}

export async function generateStory(input: StoryInput): Promise<StoryResult> {
  const res = await request<WireStoryResponse>("/guide/story", {
    method: "POST",
    json: {
      exhibit_id: input.exhibitId,
      label_slug: input.labelSlug,
      style: input.style,
      language: input.language,
      include_audio: input.includeAudio,
      max_questions: input.maxQuestions,
    },
    timeoutMs: 60_000,
  });
  return {
    exhibitId: res.exhibit_id ?? undefined,
    labelSlug: res.label_slug ?? undefined,
    style: res.style ?? undefined,
    text: res.text,
    suggestedQuestions: res.suggested_questions ?? [],
    audioUrl: res.audio_url ?? undefined,
    model: res.model ?? undefined,
  };
}

export interface ChatTurnInput {
  message: string;
  sessionId?: string;
  context?: ChatContext;
  language?: string;
  maxQuestions?: number;
}

export async function chatWithGuide(input: ChatTurnInput): Promise<ChatTurnResult> {
  const res = await request<WireChatResponse>("/guide/chat", {
    method: "POST",
    json: {
      session_id: input.sessionId,
      // Пустой объект здесь — не то же самое, что отсутствие поля: `context: {}`
      // бэкенд трактует как явный сброс контекста сессии, а пропущенное поле —
      // как «оставь сохранённый». Схлопывать одно в другое нельзя.
      context: input.context
        ? {
            exhibit_id: input.context.exhibitId,
            label_slug: input.context.labelSlug,
            hall_id: input.context.hallId,
          }
        : undefined,
      message: input.message,
      language: input.language,
      max_questions: input.maxQuestions,
    },
    timeoutMs: 60_000,
  });
  return {
    sessionId: res.session_id,
    answer: res.answer,
    suggestedQuestions: res.suggested_questions ?? [],
    context: res.context
      ? {
          exhibitId: res.context.exhibit_id ?? undefined,
          labelSlug: res.context.label_slug ?? undefined,
          hallId: res.context.hall_id ?? undefined,
        }
      : undefined,
    referencedExhibits: (res.referenced_exhibits ?? []).map(mapReferencedExhibit),
    referencedHalls: (res.referenced_halls ?? []).map(mapReferencedHall),
    location: res.location ? mapGuideLocation(res.location) : undefined,
  };
}

// ============================
// Телеметрия
// ============================

export interface TelemetryBatch {
  sessionId: string;
  /** Анонимный ID устройства — по нему бэкенд считает повторные визиты. */
  deviceId?: string;
  events: QueuedTelemetryEvent[];
}

function toWireEvent(e: QueuedTelemetryEvent) {
  return {
    type: e.type,
    exhibit_id: e.exhibitId,
    hall_id: e.hallId,
    showcase_id: e.showcaseId,
    label_slug: e.labelSlug,
    props: e.props,
    ts: e.ts,
  };
}

/**
 * Отправить пачку событий. Возвращает `true`, если пачку удалось отдать, —
 * трекер по этому признаку решает, возвращать ли события в очередь. Ошибку
 * наружу не бросаем никогда: аналитика не должна ронять вызывающий код.
 *
 * `beacon` — для финального флаша (уход со страницы, закрытие вкладки).
 * `navigator.sendBeacon` переживает выгрузку документа, тогда как обычный
 * запрос браузер в этот момент вправе оборвать — а это ровно те события,
 * которые дают точку выхода и длительность визита. Ответ beacon недоступен,
 * поэтому успехом считаем сам факт постановки в очередь браузера.
 *
 * В мок-режиме beacon не используем: MSW перехватывает fetch и XHR, но не
 * `sendBeacon`, — события демо-стенда ушли бы в реальную аналитику.
 */
export async function sendEvents(
  batch: TelemetryBatch,
  opts: { beacon?: boolean } = {},
): Promise<boolean> {
  if (batch.events.length === 0) return true;
  const body = {
    session_id: batch.sessionId,
    device_id: batch.deviceId,
    events: batch.events.map(toWireEvent),
  };

  if (opts.beacon && !USE_MOCKS && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      if (navigator.sendBeacon(apiUrl("/telemetry/events"), blob)) return true;
    } catch {
      // Не поддержали Blob или превысили лимит — уходим в обычный запрос.
    }
  }

  try {
    const res = await request<{ accepted: number; rejected: number }>("/telemetry/events", {
      method: "POST",
      keepalive: true,
      json: body,
    });
    // `rejected` — события с типом вне словаря бэкенда. В проде это тихая
    // потеря данных, поэтому шумим в консоль на деве, где ошибку ещё чинят.
    if (process.env.NODE_ENV !== "production" && res?.rejected) {
      console.warn(`Телеметрия: бэкенд отбросил ${res.rejected} событий (неизвестный type)`);
    }
    return true;
  } catch {
    return false;
  }
}

// ============================
// TTS (озвучка)
// ============================

export interface SpeechInput {
  text?: string;
  exhibitId?: number;
  voice?: "alena" | "filipp" | "jane" | "omazh" | "zahar" | "ermil";
  format?: "mp3" | "oggopus" | "wav";
  speed?: number;
  emotion?: "neutral" | "good" | "evil";
}

export interface SpeechResult {
  audioUrl: string;
  format: string;
  voice: string;
  durationMs?: number;
  characters?: number;
  cached?: boolean;
}

export async function synthesizeSpeech(input: SpeechInput | string): Promise<SpeechResult> {
  const body: SpeechInput = typeof input === "string" ? { text: input } : input;
  const res = await request<WireSpeechResponse>("/speech", {
    method: "POST",
    json: {
      text: body.text,
      exhibit_id: body.exhibitId,
      voice: body.voice,
      format: body.format,
      speed: body.speed,
      emotion: body.emotion,
    },
    timeoutMs: 30_000,
  });
  return {
    audioUrl: res.audio_url,
    format: res.format,
    voice: res.voice,
    durationMs: res.duration_ms ?? undefined,
    characters: res.characters ?? undefined,
    cached: res.cached ?? undefined,
  };
}
