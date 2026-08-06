"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Hall } from "@/lib/types";
import { useHalls } from "@/lib/api/hooks";
import { useDeleteHall, useReorderHalls } from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { hallLabel } from "@/lib/admin/labels";
import { plural } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const columns: Column<Hall>[] = [
  // nowrap: иначе «Описание» съедает ширину и название зала ломается на 3 строки.
  {
    header: "Зал",
    className: "whitespace-nowrap",
    cell: (h) => (
      <span className="flex items-center gap-2">
        {hallLabel(h)}
        {/* Служебный зал виден только здесь — без пометки не отличить от обычного,
            и админ не поймёт, почему зала нет в приложении. То же и с временной
            выставкой: посетитель видит её в отдельном списке, а в панели без
            бейджа непонятно, почему зал не в основной экспозиции. */}
        {h.isService && <Badge>Служебный</Badge>}
        {h.isTemporary && <Badge>Временная</Badge>}
      </span>
    ),
  },
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

/**
 * Зал с витринами бэкенд удалять отказывается: `DELETE /admin/halls/{id}`
 * отвечает 409, пока не передан `?force=true`. Каскад мы намеренно не шлём —
 * одним кликом он уносит витрины, экспонаты и их фотографии, а отменить это
 * нечем. Поэтому диалог не обещает каскад, а объясняет, что удалить нельзя.
 */
function hasShowcases(hall: Hall | null): boolean {
  return (hall?.showcaseCount ?? 0) > 0;
}

/**
 * Текст подтверждения удаления зала.
 *
 * Три разных случая, и раньше все три описывались одной фразой про каскад:
 * витрины — отказ бэкенда; экспонаты без витрин — молчаливое удаление вместе с
 * залом (409 бэкенд даёт только по витринам, экспонаты уходят по каскаду БД);
 * пустой зал — обычное подтверждение.
 */
function DeleteHallDescription({ hall }: { hall: Hall | null }) {
  if (!hall) return null;
  const showcases = hall.showcaseCount ?? 0;
  const exhibits = hall.exhibitCount ?? 0;

  if (showcases > 0) {
    return (
      <>
        В зале {showcases} {plural(showcases, "витрина", "витрины", "витрин")}
        {exhibits > 0 && (
          <>
            {" "}
            и {exhibits} {plural(exhibits, "экспонат", "экспоната", "экспонатов")}
          </>
        )}
        . Удалить такой зал нельзя — сначала перенесите или удалите его витрины.
      </>
    );
  }
  if (exhibits > 0) {
    return (
      <>
        {hallLabel(hall)} будет удалён безвозвратно вместе с {exhibits}{" "}
        {plural(exhibits, "экспонатом", "экспонатами", "экспонатами")}: витрин в зале нет, экспонаты
        привязаны к нему напрямую.
      </>
    );
  }
  return <>{hallLabel(hall)} будет удалён безвозвратно. Витрин и экспонатов в нём нет.</>;
}

export default function HallsAdminPage() {
  // includeService: служебные залы не отдаются публично, но управлять ими нужно
  // именно отсюда — иначе запись становится недоступной после включения флага.
  const { data, isLoading } = useHalls({ includeService: true });
  // Не `data = []` в деструктуризации: литерал создавал бы новый массив на
  // каждом рендере, эффект синхронизации порядка ниже видел бы «новые» залы
  // и уходил в бесконечный цикл, пока запрос не выполнен.
  const halls = React.useMemo(() => data ?? [], [data]);
  const router = useRouter();
  const deleteMut = useDeleteHall();
  const reorderMut = useReorderHalls();

  const [deleting, setDeleting] = React.useState<Hall | null>(null);

  // Локальная копия порядка: перетаскивание должно быть мгновенным, а не ждать
  // ответа сервера. React Query держит ссылку на data стабильной, пока данные
  // не изменились, поэтому эффект срабатывает только на реальном обновлении.
  const [rows, setRows] = React.useState<Hall[]>(halls);
  React.useEffect(() => setRows(halls), [halls]);

  function handleReorder(next: Hall[]) {
    const previous = rows;
    setRows(next);
    reorderMut.mutate(
      next.map((h) => h.id),
      { onError: () => setRows(previous) },
    );
  }

  function openEdit(hall: Hall) {
    router.push(`/admin/halls/${hall.id}`);
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMut.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Залы</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {halls.length} залов · порядок задаётся перетаскиванием за ручку
          </p>
        </div>
        <Link href="/admin/halls/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Добавить</Button>
        </Link>
      </header>

      {reorderMut.error && (
        <p className="text-destructive mb-3 text-sm">
          Не удалось сохранить порядок: {errorMessage(reorderMut.error)}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(h) => h.id}
        loading={isLoading}
        onRowClick={openEdit}
        onEdit={openEdit}
        onDelete={setDeleting}
        onReorder={handleReorder}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Удалить зал?"
        description={<DeleteHallDescription hall={deleting} />}
        confirmDisabled={hasShowcases(deleting)}
        loading={deleteMut.isPending}
        error={deleteMut.error ? errorMessage(deleteMut.error) : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
