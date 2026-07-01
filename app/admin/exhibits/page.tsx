"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { AdminExhibit, ExhibitInput } from "@/lib/types";
import { useHalls } from "@/lib/api/hooks";
import {
  useAllExhibits,
  useAllShowcases,
  useCreateExhibit,
  useDeleteExhibit,
  useUpdateExhibit,
} from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ExhibitForm } from "@/components/admin/exhibit-form";

export default function ExhibitsAdminPage() {
  const { data: halls = [] } = useHalls();
  const { data: showcases = [] } = useAllShowcases();
  const { data: exhibits = [], isLoading } = useAllExhibits();
  const createMut = useCreateExhibit();
  const updateMut = useUpdateExhibit();
  const deleteMut = useDeleteExhibit();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminExhibit | null>(null);
  const [deleting, setDeleting] = React.useState<AdminExhibit | null>(null);

  const hallLabel = React.useCallback(
    (hallId?: number) => {
      const hall = halls.find((h) => h.id === hallId);
      return hall ? `${hall.hallNumber}. ${hall.name ?? ""}`.trim() : "—";
    },
    [halls],
  );

  const columns: Column<AdminExhibit>[] = [
    { header: "Название", cell: (e) => e.name },
    {
      header: "Год",
      hideOnMobile: true,
      cell: (e) => <span className="tabular-nums">{e.yearCreated ?? "—"}</span>,
    },
    { header: "Мастер", hideOnMobile: true, cell: (e) => e.masterName ?? "—" },
    { header: "Зал", hideOnMobile: true, cell: (e) => hallLabel(e.hallId) },
  ];

  function openCreate() {
    setEditing(null);
    createMut.reset();
    updateMut.reset();
    setFormOpen(true);
  }

  function openEdit(exhibit: AdminExhibit) {
    setEditing(exhibit);
    createMut.reset();
    updateMut.reset();
    setFormOpen(true);
  }

  function handleSubmit(input: ExhibitInput) {
    if (editing) {
      updateMut.mutate({ id: editing.id, input }, { onSuccess: () => setFormOpen(false) });
    } else {
      // Бесшовно: после создания переходим в режим редактирования того же
      // экспоната (не закрывая модалку), чтобы сразу стала доступна загрузка фото.
      createMut.mutate(input, { onSuccess: (created) => setEditing(created) });
    }
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMut.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  const saving = createMut.isPending || updateMut.isPending;
  const saveError = createMut.error ?? updateMut.error;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Экспонаты</h1>
          <p className="text-muted-foreground mt-1 text-sm">{exhibits.length} экспонатов</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Добавить
        </Button>
      </header>

      <DataTable
        columns={columns}
        rows={exhibits}
        rowKey={(e) => e.id}
        loading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleting}
      />

      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать экспонат" : "Новый экспонат"}
        className="max-w-lg"
      >
        <ExhibitForm
          initial={editing}
          exhibitId={editing?.id}
          halls={halls}
          showcases={showcases}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          loading={saving}
          error={saveError ? errorMessage(saveError) : null}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить экспонат?"
        description={<>Экспонат «{deleting?.name}» будет удалён безвозвратно.</>}
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
