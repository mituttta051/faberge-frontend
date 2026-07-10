import type {
  ChatContext,
  ChatTurnResult,
  Exhibit,
  Hall,
  RecognitionCandidate,
  RecognizeResult,
  SearchResponse,
  Showcase,
  StoryResult,
} from "@/lib/types";
import { fetchAllPaged, request } from "./client";

// ============================
// Wire-типы (snake_case, как в OpenAPI).
// Маппим в camelCase сразу после fetch, чтобы UI не знал о snake_case.
// ============================

interface WireHall {
  id: number;
  hall_number: number;
  name?: string | null;
  description?: string | null;
  level?: number | null;
  cover_image_url?: string | null;
  showcase_count?: number | null;
  exhibit_count?: number | null;
}

interface WireHallBrief {
  id: number;
  hall_number: number;
  name?: string | null;
}

interface WireShowcase {
  id: number;
  hall_id: number;
  showcase_number: number;
  name?: string | null;
  exhibit_count?: number | null;
}

interface WireShowcaseBrief {
  id: number;
  showcase_number: number;
}

interface WireExhibitSummary {
  id: number;
  label_slug?: string | null;
  name: string;
  year_created?: number | null;
  master_name?: string | null;
  thumbnail_url?: string | null;
  hall_id?: number | null;
  showcase_id?: number | null;
}

interface WireExhibit {
  id: number;
  label_slug?: string | null;
  name: string;
  year_created?: number | null;
  master_name?: string | null;
  material?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  model_3d_url?: string | null;
  model_3d_embed?: string | null;
  audio_url?: string | null;
  source_url?: string | null;
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

interface WireChatResponse {
  session_id: string;
  answer: string;
  suggested_questions: string[];
  context?: {
    exhibit_id?: number | null;
    label_slug?: string | null;
    hall_id?: number | null;
  } | null;
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
    hallNumber: h.hall_number,
    name: h.name ?? undefined,
    description: h.description ?? undefined,
    level: h.level ?? undefined,
    coverImageUrl: h.cover_image_url ?? undefined,
    showcaseCount: h.showcase_count ?? undefined,
    exhibitCount: h.exhibit_count ?? undefined,
  };
}

function mapShowcase(s: WireShowcase): Showcase {
  return {
    id: s.id,
    hallId: s.hall_id,
    showcaseNumber: s.showcase_number,
    name: s.name ?? undefined,
    exhibitCount: s.exhibit_count ?? undefined,
  };
}

function mapExhibitSummary(e: WireExhibitSummary): Exhibit {
  return {
    id: e.id,
    labelSlug: e.label_slug ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    masterName: e.master_name ?? undefined,
    photoUrl: e.thumbnail_url ?? undefined,
    hallId: e.hall_id ?? undefined,
    showcaseId: e.showcase_id ?? undefined,
  };
}

function mapExhibit(e: WireExhibit): Exhibit {
  return {
    id: e.id,
    labelSlug: e.label_slug ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    masterName: e.master_name ?? undefined,
    material: e.material ?? undefined,
    shortDescription: e.short_description ?? undefined,
    photoUrl: e.image_url ?? undefined,
    model3dUrl: e.model_3d_url ?? undefined,
    model3dEmbed: e.model_3d_embed ?? undefined,
    audioUrl: e.audio_url ?? undefined,
    sourceUrl: e.source_url ?? undefined,
    hallId: e.hall?.id ?? undefined,
    showcaseId: e.showcase?.id ?? undefined,
    showcaseNumber: e.showcase?.showcase_number ?? undefined,
  };
}

function mapCandidate(c: WireRecognitionCandidate): RecognitionCandidate {
  return {
    labelSlug: c.label_slug,
    name: c.name ?? undefined,
    confidence: c.confidence,
  };
}

// ============================
// Каталог
// ============================

export async function getHalls(): Promise<Hall[]> {
  return (await fetchAllPaged<WireHall>("/halls")).map(mapHall);
}

export async function getHall(id: number): Promise<Hall> {
  const res = await request<WireHall>(`/halls/${id}`);
  return mapHall(res);
}

export async function getHallShowcases(hallId: number): Promise<Showcase[]> {
  const res = await request<WirePaged<WireShowcase>>(`/halls/${hallId}/showcases`, {
    query: { limit: 100 },
  });
  return res.items.map(mapShowcase);
}

export async function getHallExhibits(hallId: number): Promise<Exhibit[]> {
  const res = await request<WirePaged<WireExhibitSummary>>(`/halls/${hallId}/exhibits`, {
    query: { limit: 100 },
  });
  return res.items.map(mapExhibitSummary);
}

export async function getShowcase(id: number): Promise<Showcase> {
  const res = await request<WireShowcase>(`/showcases/${id}`);
  return mapShowcase(res);
}

export async function getShowcaseExhibits(id: number): Promise<Exhibit[]> {
  const res = await request<WirePaged<WireExhibitSummary>>(`/showcases/${id}/exhibits`, {
    query: { limit: 100 },
  });
  return res.items.map(mapExhibitSummary);
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
  };
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
