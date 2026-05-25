import type {
  ChatMessage,
  ChatSession,
  Exhibit,
  Hall,
  RecognizeResult,
  SearchResponse,
  Showcase,
} from "@/lib/types";
import { request } from "./client";

// ============================
// Каталог
// ============================

export function getHalls() {
  return request<Hall[]>("/halls");
}

export function getHall(id: number) {
  return request<Hall>(`/halls/${id}`);
}

export function getHallShowcases(hallId: number) {
  return request<Showcase[]>(`/halls/${hallId}/showcases`);
}

export function getHallExhibits(hallId: number) {
  return request<Exhibit[]>(`/halls/${hallId}/exhibits`);
}

export function getShowcase(id: number) {
  return request<Showcase>(`/showcases/${id}`);
}

export function getShowcaseExhibits(id: number) {
  return request<Exhibit[]>(`/showcases/${id}/exhibits`);
}

export function getExhibit(id: number) {
  return request<Exhibit>(`/exhibits/${id}`);
}

export function getRelatedExhibits(id: number) {
  return request<Exhibit[]>(`/exhibits/${id}/related`);
}

// ============================
// Поиск
// ============================

export function searchCatalog(query: string) {
  return request<SearchResponse>("/search", { query: { q: query } });
}

// ============================
// Распознавание фото
// ============================

export function recognizeExhibit(photo: Blob) {
  const formData = new FormData();
  formData.append("photo", photo, "exhibit.jpg");
  return request<RecognizeResult>("/recognize", {
    method: "POST",
    body: formData,
  });
}

// ============================
// Чат с AI-гидом
// ============================

export interface CreateChatSessionInput {
  exhibitId?: number;
  labelSlug?: string;
}

export function createChatSession(input: CreateChatSessionInput = {}) {
  return request<ChatSession>("/chat/sessions", {
    method: "POST",
    json: input,
  });
}

export function getChatSession(sessionId: string) {
  return request<ChatSession>(`/chat/sessions/${sessionId}`);
}

export function sendChatMessage(sessionId: string, content: string) {
  return request<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    json: { content },
  });
}

// ============================
// TTS (озвучка)
// ============================

export function synthesizeSpeech(text: string) {
  return request<{ audioUrl: string }>("/tts", {
    method: "POST",
    json: { text },
  });
}
