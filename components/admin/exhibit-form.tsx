"use client";

import * as React from "react";
import type { AdminExhibit, ExhibitInput, Hall, Showcase } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { hallLabel, showcaseLabel } from "@/lib/admin/labels";
import { Field, FormActions } from "./field";
import { ExhibitGallery } from "./exhibit-gallery";

interface ExhibitFormProps {
  initial?: AdminExhibit | null;
  /** ID существующего экспоната — нужен для галереи фото (загрузка к /admin/exhibits/{id}/media). */
  exhibitId?: number;
  halls: Hall[];
  showcases: Showcase[];
  onSubmit: (input: ExhibitInput) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ExhibitForm({
  initial,
  exhibitId,
  halls,
  showcases,
  onSubmit,
  onCancel,
  loading,
  error,
}: ExhibitFormProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [hallId, setHallId] = React.useState(String(initial?.hallId ?? halls[0]?.id ?? ""));
  const [showcaseId, setShowcaseId] = React.useState(String(initial?.showcaseId ?? ""));
  const [labelSlug, setLabelSlug] = React.useState(initial?.labelSlug ?? "");
  const [yearCreated, setYearCreated] = React.useState(String(initial?.yearCreated ?? ""));
  const [masterName, setMasterName] = React.useState(initial?.masterName ?? "");
  const [material, setMaterial] = React.useState(initial?.material ?? "");
  const [shortDescription, setShortDescription] = React.useState(initial?.shortDescription ?? "");
  const [photoUrl, setPhotoUrl] = React.useState(initial?.photoUrl ?? "");
  const [rawHistory, setRawHistory] = React.useState(initial?.rawHistory ?? "");

  // Витрины, доступные для выбранного зала.
  const hallShowcases = React.useMemo(
    () => showcases.filter((s) => s.hallId === Number(hallId)),
    [showcases, hallId],
  );

  // При смене зала сбрасываем витрину, если она больше не принадлежит залу.
  React.useEffect(() => {
    if (showcaseId && !hallShowcases.some((s) => String(s.id) === showcaseId)) {
      setShowcaseId("");
    }
  }, [hallShowcases, showcaseId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      hallId: hallId ? Number(hallId) : undefined,
      showcaseId: showcaseId ? Number(showcaseId) : undefined,
      labelSlug: labelSlug.trim() || undefined,
      yearCreated: yearCreated ? Number(yearCreated) : undefined,
      masterName: masterName.trim() || undefined,
      material: material.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      rawHistory: rawHistory.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
      <Field label="Название" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Зал">
          <Select value={hallId} onChange={(e) => setHallId(e.target.value)}>
            <option value="">—</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {hallLabel(h)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Витрина">
          <Select
            value={showcaseId}
            onChange={(e) => setShowcaseId(e.target.value)}
            disabled={hallShowcases.length === 0}
          >
            <option value="">—</option>
            {hallShowcases.map((s) => (
              <option key={s.id} value={s.id}>
                {showcaseLabel(s)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Год создания">
          <Input
            type="number"
            inputMode="numeric"
            value={yearCreated}
            onChange={(e) => setYearCreated(e.target.value)}
          />
        </Field>
        <Field label="Label slug (YOLO)" hint="напр. faberge_egg_winter">
          <Input value={labelSlug} onChange={(e) => setLabelSlug(e.target.value)} />
        </Field>
      </div>

      <Field label="Мастер">
        <Input value={masterName} onChange={(e) => setMasterName(e.target.value)} />
      </Field>
      <Field label="Материалы">
        <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
      </Field>
      <Field label="Краткое описание">
        <Textarea
          rows={3}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
      </Field>
      <Field label="URL фото" hint="Можно вставить ссылку вручную или загрузить фото ниже.">
        <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
      </Field>

      {exhibitId !== undefined ? (
        <ExhibitGallery exhibitId={exhibitId} />
      ) : (
        <p className="border-border text-muted-foreground border-t pt-3 text-[11px]">
          Сохраните экспонат, чтобы загрузить фотографии.
        </p>
      )}

      <Field label="raw_history (факты для LLM)" hint="Буллиты фактов: мастер, заказчик, материалы…">
        <Textarea rows={4} value={rawHistory} onChange={(e) => setRawHistory(e.target.value)} />
      </Field>

      <FormActions
        onCancel={onCancel}
        loading={loading}
        error={error}
        submitLabel={initial ? "Сохранить" : "Создать"}
      />
    </form>
  );
}
