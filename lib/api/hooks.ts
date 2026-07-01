"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  chatWithGuide,
  generateStory,
  getExhibit,
  getExhibitBySlug,
  getHall,
  getHallExhibits,
  getHallShowcases,
  getHalls,
  getRelatedExhibits,
  getShowcase,
  getShowcaseExhibits,
  recognizeExhibit,
  searchCatalog,
  synthesizeSpeech,
  type ChatTurnInput,
  type RecognizeInput,
  type SpeechInput,
  type StoryInput,
} from "./endpoints";

// ============================
// Каталог
// ============================

export function useHalls() {
  return useQuery({ queryKey: ["halls"], queryFn: getHalls });
}

export function useHall(id: number | undefined) {
  return useQuery({
    queryKey: ["hall", id],
    queryFn: () => getHall(id!),
    enabled: id !== undefined,
  });
}

export function useHallShowcases(hallId: number | undefined) {
  return useQuery({
    queryKey: ["hall", hallId, "showcases"],
    queryFn: () => getHallShowcases(hallId!),
    enabled: hallId !== undefined,
  });
}

export function useHallExhibits(hallId: number | undefined) {
  return useQuery({
    queryKey: ["hall", hallId, "exhibits"],
    queryFn: () => getHallExhibits(hallId!),
    enabled: hallId !== undefined,
  });
}

export function useShowcase(id: number | undefined) {
  return useQuery({
    queryKey: ["showcase", id],
    queryFn: () => getShowcase(id!),
    enabled: id !== undefined,
  });
}

export function useShowcaseExhibits(id: number | undefined) {
  return useQuery({
    queryKey: ["showcase", id, "exhibits"],
    queryFn: () => getShowcaseExhibits(id!),
    enabled: id !== undefined,
  });
}

export function useExhibit(id: number | undefined) {
  return useQuery({
    queryKey: ["exhibit", id],
    queryFn: () => getExhibit(id!),
    enabled: id !== undefined,
  });
}

export function useExhibitBySlug(labelSlug: string | undefined) {
  return useQuery({
    queryKey: ["exhibit", "by-slug", labelSlug],
    queryFn: () => getExhibitBySlug(labelSlug!),
    enabled: !!labelSlug,
  });
}

export function useRelatedExhibits(id: number | undefined) {
  return useQuery({
    queryKey: ["exhibit", id, "related"],
    queryFn: () => getRelatedExhibits(id!),
    enabled: id !== undefined,
  });
}

// ============================
// Поиск
// ============================

export function useSearchCatalog(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCatalog(q),
    enabled: q.length > 0,
    // Пока подгружаются новые результаты, показываем предыдущие —
    // иначе список мигает пустым списком между вводом символов.
    placeholderData: (prev) => prev,
  });
}

// ============================
// Распознавание + ИИ-гид + TTS — мутации
// ============================

export function useRecognizeExhibit() {
  return useMutation({
    mutationFn: (input: RecognizeInput | Blob) => recognizeExhibit(input),
  });
}

export function useGenerateStory() {
  return useMutation({
    mutationFn: (input: StoryInput) => generateStory(input),
  });
}

export function useChatWithGuide() {
  return useMutation({
    mutationFn: (input: ChatTurnInput) => chatWithGuide(input),
  });
}

export function useSynthesizeSpeech() {
  return useMutation({
    mutationFn: (input: SpeechInput | string) => synthesizeSpeech(input),
  });
}
