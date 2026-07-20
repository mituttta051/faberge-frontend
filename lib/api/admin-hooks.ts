"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExhibitInput, HallInput, ShowcaseInput } from "@/lib/types";
import {
  createExhibit,
  createHall,
  createShowcase,
  deleteExhibit,
  deleteExhibitMedia,
  deleteHall,
  deleteShowcase,
  getAllExhibits,
  getAllShowcases,
  listExhibitMedia,
  reorderHalls,
  updateExhibit,
  updateHall,
  updateShowcase,
  uploadExhibitMedia,
  uploadHallCover,
} from "./admin";

// ============================
// Запросы (admin-таблицы)
// ============================

export function useAllShowcases() {
  return useQuery({ queryKey: ["admin", "showcases"], queryFn: getAllShowcases });
}

export function useAllExhibits() {
  return useQuery({ queryKey: ["admin", "exhibits"], queryFn: getAllExhibits });
}

/**
 * Сбрасывает все каталожные кэши (публичные + админские), чтобы изменения
 * сразу отражались и в админке, и на витрине посетителя.
 */
function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["halls"] });
    qc.invalidateQueries({ queryKey: ["hall"] });
    qc.invalidateQueries({ queryKey: ["showcase"] });
    qc.invalidateQueries({ queryKey: ["exhibit"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
  };
}

// ============================
// Мутации: залы
// ============================

export function useCreateHall() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: HallInput) => createHall(input),
    onSuccess: invalidate,
  });
}

export function useUpdateHall() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: HallInput }) => updateHall(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHall() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => deleteHall(id),
    onSuccess: invalidate,
  });
}

/** Новый порядок залов (C11). Список id — в желаемом порядке. */
export function useReorderHalls() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (hallIds: number[]) => reorderHalls(hallIds),
    onSuccess: invalidate,
  });
}

// ============================
// Мутации: витрины
// ============================

export function useCreateShowcase() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ShowcaseInput) => createShowcase(input),
    onSuccess: invalidate,
  });
}

export function useUpdateShowcase() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ShowcaseInput }) => updateShowcase(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteShowcase() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => deleteShowcase(id),
    onSuccess: invalidate,
  });
}

// ============================
// Мутации: экспонаты
// ============================

export function useCreateExhibit() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ExhibitInput) => createExhibit(input),
    onSuccess: invalidate,
  });
}

export function useUpdateExhibit() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExhibitInput }) => updateExhibit(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteExhibit() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => deleteExhibit(id),
    onSuccess: invalidate,
  });
}

// ============================
// Медиа экспоната (галерея) + обложка зала
// ============================

export function useExhibitMedia(exhibitId: number | undefined) {
  return useQuery({
    queryKey: ["admin", "exhibit-media", exhibitId],
    queryFn: () => listExhibitMedia(exhibitId!),
    enabled: exhibitId !== undefined,
  });
}

export function useUploadExhibitMedia() {
  const qc = useQueryClient();
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ exhibitId, file, isPrimary }: { exhibitId: number; file: File; isPrimary?: boolean }) =>
      uploadExhibitMedia(exhibitId, file, isPrimary),
    onSuccess: (_data, { exhibitId }) => {
      qc.invalidateQueries({ queryKey: ["admin", "exhibit-media", exhibitId] });
      invalidate();
    },
  });
}

export function useDeleteExhibitMedia() {
  const qc = useQueryClient();
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ exhibitId, imageId }: { exhibitId: number; imageId: number }) =>
      deleteExhibitMedia(exhibitId, imageId),
    onSuccess: (_data, { exhibitId }) => {
      qc.invalidateQueries({ queryKey: ["admin", "exhibit-media", exhibitId] });
      invalidate();
    },
  });
}

export function useUploadHallCover() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ hallId, file }: { hallId: number; file: File }) => uploadHallCover(hallId, file),
    onSuccess: invalidate,
  });
}
