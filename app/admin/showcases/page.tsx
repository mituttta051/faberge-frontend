"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { Showcase, ShowcaseInput } from "@/lib/types";
import { useHalls } from "@/lib/api/hooks";
import {
  useAllShowcases,
  useCreateShowcase,
  useDeleteShowcase,
  useUpdateShowcase,
} from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ShowcaseForm } from "@/components/admin/showcase-form";

export default function ShowcasesAdminPage() {
  const { data: halls = [] } = useHalls();
  const { data: showcases = [], isLoading } = useAllShowcases();
  const createMut = useCreateShowcase();
  const updateMut = useUpdateShowcase();
  const deleteMut = useDeleteShowcase();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Showcase | null>(null);
  const [deleting, setDeleting] = React.useState<Showcase | null>(null);

  const hallLabel = React.useCallback(
    (hallId: number) => {
      const hall = halls.find((h) => h.id === hallId);
      return hall ? `${hall.hallNumber}. ${hall.name ?? "Без названия"}` : `#${hallId}`;
    },
    [halls],
  );

  const columns: Column<Showcase>[] = [
    { header: "№", cell: (s) => <span className="tabular-nums">{s.showcaseNumber}</span> },
    { header: "Название", cell: (s) => s.name ?? "—" },
    { header: "Зал", hideOnMobile: true, cell: (s) => hallLabel(s.hallId) },
    {
      header: "Экспонатов",
      hideOnMobile: true,
      cell: (s) => <span className="tabular-nums">{s.exhibitCount ?? 0}</span>,
    },
  ];

  function openCreate() {
    setEditing(null);
    createMut.reset();
    updateMut.reset();
    setFormOpen(true);
  }

  function openEdit(showcase: Showcase) {
    setEditing(showcase);
    createMut.reset();
    updateMut.reset();
    setFormOpen(true);
  }

  function handleSubmit(input: ShowcaseInput) {
    const onSuccess = () => setFormOpen(false);
    if (editing) updateMut.mutate({ id: editing.id, input }, { onSuccess });
    else createMut.mutate(input, { onSuccess });
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
          <h1 className="font-display text-2xl">Витрины</h1>
          <p className="text-muted-foreground mt-1 text-sm">{showcases.length} витрин</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Добавить
        </Button>
      </header>

      <DataTable
        columns={columns}
        rows={showcases}
        rowKey={(s) => s.id}
        loading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleting}
      />

      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать витрину" : "Новая витрина"}
      >
        <ShowcaseForm
          initial={editing}
          halls={halls}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          loading={saving}
          error={saveError ? errorMessage(saveError) : null}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить витрину?"
        description="Витрина и её экспонаты будут удалены безвозвратно."
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
