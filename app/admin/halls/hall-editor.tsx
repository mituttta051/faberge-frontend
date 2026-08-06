"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { HallInput } from "@/lib/types";
import { useHalls } from "@/lib/api/hooks";
import { useCreateHall, useUpdateHall, useUploadHallCover } from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { hallLabel } from "@/lib/admin/labels";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorPage } from "@/components/admin/editor-page";
import { HallForm } from "@/components/admin/hall-form";

const LIST_HREF = "/admin/halls";

/**
 * Страница создания и редактирования зала.
 *
 * Зал берём из общего списка, а не отдельным запросом: список уже в кэше после
 * перехода из таблицы, а `includeService` нужен, чтобы служебный зал вообще
 * открывался — публичная выдача его прячет.
 */
export function HallEditor({ hallId }: { hallId?: number }) {
  const router = useRouter();
  const { data, isLoading } = useHalls({ includeService: true });
  const hall = hallId !== undefined ? (data ?? []).find((h) => h.id === hallId) : undefined;

  const createMut = useCreateHall();
  const updateMut = useUpdateHall();
  const coverMut = useUploadHallCover();

  const saving = createMut.isPending || updateMut.isPending || coverMut.isPending;
  const saveError = createMut.error ?? updateMut.error ?? coverMut.error;

  function handleSubmit(input: HallInput, coverFile?: File) {
    if (hallId !== undefined) {
      updateMut.mutate({ id: hallId, input }, { onSuccess: () => router.push(LIST_HREF) });
      return;
    }
    // Создание: сперва зал, потом (если выбрана обложка) заливка к новому id.
    createMut.mutate(input, {
      onSuccess: (created) => {
        if (!coverFile) {
          router.push(LIST_HREF);
          return;
        }
        coverMut.mutate(
          { hallId: created.id, file: coverFile },
          {
            onSuccess: () => router.push(LIST_HREF),
            // Обложка не залилась — зал уже создан. Переводим на его страницу
            // редактирования, чтобы повторить загрузку, а не создавать второй зал.
            onError: () => router.replace(`${LIST_HREF}/${created.id}`),
          },
        );
      },
    });
  }

  if (hallId !== undefined && isLoading) {
    return (
      <EditorPage backHref={LIST_HREF} backLabel="Залы" title="Редактировать зал">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </EditorPage>
    );
  }

  if (hallId !== undefined && !hall) {
    return (
      <EditorPage backHref={LIST_HREF} backLabel="Залы" title="Зал не найден">
        <p className="text-muted-foreground text-sm">
          Зал №{hallId} не существует или был удалён. Вернитесь к списку залов.
        </p>
      </EditorPage>
    );
  }

  return (
    <EditorPage
      backHref={LIST_HREF}
      backLabel="Залы"
      title={hall ? "Редактировать зал" : "Новый зал"}
      subtitle={hall ? hallLabel(hall) : "Появится в списке экспозиции после сохранения"}
    >
      <HallForm
        initial={hall}
        hallId={hallId}
        onSubmit={handleSubmit}
        onCancel={() => router.push(LIST_HREF)}
        loading={saving}
        error={saveError ? errorMessage(saveError) : null}
      />
    </EditorPage>
  );
}
