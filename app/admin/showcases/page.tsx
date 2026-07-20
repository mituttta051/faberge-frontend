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
import { hallLabel, showcaseLabel } from "@/lib/admin/labels";
import { groupByHall } from "@/lib/admin/grouping";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AccordionSection } from "@/components/admin/accordion-section";
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

  const groups = React.useMemo(
    () =>
      groupByHall(
        showcases,
        halls,
        (s) => s.hallId,
        (a, b) => a.showcaseNumber - b.showcaseNumber,
      ),
    [showcases, halls],
  );

  // Зал вынесен в заголовок группы, поэтому колонки «Зал» здесь нет.
  const columns: Column<Showcase>[] = [
    { header: "Витрина", cell: (s) => showcaseLabel(s) },
    {
      header: "Экспонатов",
      hideOnMobile: true,
      className: "w-28 text-right",
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="border-border border">
          {groups.map((group) => (
            <AccordionSection
              key={group.hall?.id ?? "no-hall"}
              title={hallLabel(group.hall)}
              meta={group.rows.length}
            >
              <DataTable
                embedded
                columns={columns}
                rows={group.rows}
                rowKey={(s) => s.id}
                emptyLabel="В этом зале пока нет витрин."
                onRowClick={openEdit}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            </AccordionSection>
          ))}
        </div>
      )}

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
        description={
          <>
            {showcaseLabel(deleting)} ({hallLabel(halls.find((h) => h.id === deleting?.hallId))}) и
            все её экспонаты будут удалены безвозвратно.
          </>
        }
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
