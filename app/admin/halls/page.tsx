"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { Hall, HallInput } from "@/lib/types";
import { useHalls } from "@/lib/api/hooks";
import {
  useCreateHall,
  useDeleteHall,
  useUpdateHall,
  useUploadHallCover,
} from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { hallLabel } from "@/lib/admin/labels";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { HallForm } from "@/components/admin/hall-form";

const columns: Column<Hall>[] = [
  // nowrap: иначе «Описание» съедает ширину и название зала ломается на 3 строки.
  { header: "Зал", className: "whitespace-nowrap", cell: (h) => hallLabel(h) },
  {
    header: "Витрин",
    hideOnMobile: true,
    className: "w-20 text-right",
    cell: (h) => <span className="tabular-nums">{h.showcaseCount ?? 0}</span>,
  },
  {
    header: "Экспонатов",
    hideOnMobile: true,
    className: "w-28 text-right",
    cell: (h) => <span className="tabular-nums">{h.exhibitCount ?? 0}</span>,
  },
  {
    header: "Описание",
    hideOnMobile: true,
    cell: (h) => <span className="text-muted-foreground line-clamp-2">{h.description ?? "—"}</span>,
  },
];

export default function HallsAdminPage() {
  const { data: halls = [], isLoading } = useHalls();
  const createMut = useCreateHall();
  const updateMut = useUpdateHall();
  const deleteMut = useDeleteHall();
  const coverMut = useUploadHallCover();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Hall | null>(null);
  const [deleting, setDeleting] = React.useState<Hall | null>(null);

  function openCreate() {
    setEditing(null);
    createMut.reset();
    updateMut.reset();
    coverMut.reset();
    setFormOpen(true);
  }

  function openEdit(hall: Hall) {
    setEditing(hall);
    createMut.reset();
    updateMut.reset();
    coverMut.reset();
    setFormOpen(true);
  }

  function handleSubmit(input: HallInput, coverFile?: File) {
    if (editing) {
      updateMut.mutate({ id: editing.id, input }, { onSuccess: () => setFormOpen(false) });
      return;
    }
    // Создание: сперва создаём зал, затем (если выбрана обложка) заливаем её к
    // новому id. Без файла — просто закрываем модалку.
    createMut.mutate(input, {
      onSuccess: (created) => {
        if (!coverFile) {
          setFormOpen(false);
          return;
        }
        coverMut.mutate(
          { hallId: created.id, file: coverFile },
          {
            onSuccess: () => setFormOpen(false),
            // Если обложка не залилась — зал уже создан, оставляем форму открытой
            // в режиме редактирования, чтобы можно было повторить загрузку.
            onError: () => setEditing(created),
          },
        );
      },
    });
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMut.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  const saving = createMut.isPending || updateMut.isPending || coverMut.isPending;
  const saveError = createMut.error ?? updateMut.error ?? coverMut.error;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Залы</h1>
          <p className="text-muted-foreground mt-1 text-sm">{halls.length} залов</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Добавить
        </Button>
      </header>

      <DataTable
        columns={columns}
        rows={halls}
        rowKey={(h) => h.id}
        loading={isLoading}
        onRowClick={openEdit}
        onEdit={openEdit}
        onDelete={setDeleting}
      />

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Редактировать зал" : "Новый зал"}>
        <HallForm
          initial={editing}
          hallId={editing?.id}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          loading={saving}
          error={saveError ? errorMessage(saveError) : null}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить зал?"
        description={
          <>
            {hallLabel(deleting)} и все его витрины и экспонаты будут удалены безвозвратно.
          </>
        }
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
