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
import { hallLabel, placementLabel, showcaseLabel } from "@/lib/admin/labels";
import { groupByHall } from "@/lib/admin/grouping";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AccordionSection } from "@/components/admin/accordion-section";
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

  const showcaseById = React.useMemo(() => new Map(showcases.map((s) => [s.id, s])), [showcases]);

  // Экспонатов сотни — плоским списком в них не сориентироваться, поэтому
  // раскладываем по залам и держим группы свёрнутыми.
  const groups = React.useMemo(
    () =>
      groupByHall(
        exhibits,
        halls,
        (e) => e.hallId,
        (a, b) => {
          const sa = a.showcaseId
            ? (showcaseById.get(a.showcaseId)?.showcaseNumber ?? Infinity)
            : Infinity;
          const sb = b.showcaseId
            ? (showcaseById.get(b.showcaseId)?.showcaseNumber ?? Infinity)
            : Infinity;
          return sa - sb || a.name.localeCompare(b.name, "ru");
        },
      ),
    [exhibits, halls, showcaseById],
  );

  const showcaseOf = React.useCallback(
    (e: AdminExhibit) => (e.showcaseId ? showcaseById.get(e.showcaseId) : undefined),
    [showcaseById],
  );

  // Зал вынесен в заголовок группы, поэтому в строке остаётся витрина.
  const columns: Column<AdminExhibit>[] = [
    {
      header: "Витрина",
      hideOnMobile: true,
      className: "text-muted-foreground whitespace-nowrap",
      cell: (e) => showcaseLabel(showcaseOf(e)),
    },
    {
      header: "Название",
      cell: (e) => (
        <>
          {e.name}
          {/* На узком экране колонка «Витрина» скрыта — не теряем её из наименования. */}
          <span className="text-muted-foreground block text-xs md:hidden">
            {showcaseLabel(showcaseOf(e))}
          </span>
        </>
      ),
    },
    {
      header: "Год",
      hideOnMobile: true,
      cell: (e) => <span className="tabular-nums">{e.yearCreated ?? "—"}</span>,
    },
    { header: "Мастер", hideOnMobile: true, cell: (e) => e.masterName ?? "—" },
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
                rowKey={(e) => e.id}
                emptyLabel="В этом зале пока нет экспонатов."
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
        description={
          <>
            Экспонат «{deleting?.name}» (
            {placementLabel(
              halls.find((h) => h.id === deleting?.hallId),
              deleting ? showcaseOf(deleting) : undefined,
            )}
            ) будет удалён безвозвратно.
          </>
        }
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
