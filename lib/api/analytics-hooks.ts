"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsExhibitsOrder } from "@/lib/types";
import {
  getAnalyticsEngagement,
  getAnalyticsExhibits,
  getAnalyticsOverview,
  getAnalyticsQuestions,
  getAnalyticsRecognition,
  getAnalyticsRoutes,
  getAnalyticsUnanswered,
  type AnalyticsRange,
} from "./analytics";

/**
 * Хуки отчётов аналитики.
 *
 * Период — часть ключа кэша: смена дат должна перезапрашивать отчёт, а возврат
 * к прошлому периоду — отдавать уже загруженное без нового запроса.
 *
 * `staleTime` большой: агрегаты пересчитываются раз в сутки ночным джобом,
 * поэтому перезапрашивать их при каждом переключении вкладки бессмысленно.
 */

const STALE_TIME_MS = 10 * 60 * 1000;

function key(report: string, range: AnalyticsRange, extra?: unknown) {
  return ["admin", "analytics", report, range.from ?? "", range.to ?? "", extra ?? null];
}

export function useAnalyticsOverview(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("overview", range),
    queryFn: () => getAnalyticsOverview(range),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsQuestions(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("questions", range),
    queryFn: () => getAnalyticsQuestions(range),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsEngagement(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("engagement", range),
    queryFn: () => getAnalyticsEngagement(range),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsRoutes(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("routes", range),
    queryFn: () => getAnalyticsRoutes(range),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsUnanswered(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("unanswered", range),
    queryFn: () => getAnalyticsUnanswered(range),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsExhibits(
  range: AnalyticsRange,
  opts: { order?: AnalyticsExhibitsOrder; limit?: number } = {},
) {
  return useQuery({
    queryKey: key("exhibits", range, opts),
    queryFn: () => getAnalyticsExhibits(range, opts),
    staleTime: STALE_TIME_MS,
  });
}

export function useAnalyticsRecognition(range: AnalyticsRange) {
  return useQuery({
    queryKey: key("recognition", range),
    queryFn: () => getAnalyticsRecognition(range),
    staleTime: STALE_TIME_MS,
  });
}
