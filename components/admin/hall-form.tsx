"use client";

import * as React from "react";
import Image from "next/image";
import type { Hall, HallInput } from "@/lib/types";
import { useUploadHallCover } from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormActions } from "./field";
import { ImageUpload } from "./image-upload";

interface HallFormProps {
  initial?: Hall | null;
  /** ID существующего зала. Если есть — обложка грузится сразу; если нет — файл
   *  откладывается и заливается родителем после создания зала (см. coverFile в onSubmit). */
  hallId?: number;
  onSubmit: (input: HallInput, coverFile?: File) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function HallForm({ initial, hallId, onSubmit, onCancel, loading, error }: HallFormProps) {
  const [hallNumber, setHallNumber] = React.useState(String(initial?.hallNumber ?? ""));
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(initial?.coverImageUrl ?? "");
  // Отложенный файл обложки для режима создания (зал ещё без id).
  const [pendingCover, setPendingCover] = React.useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = React.useState<string | null>(null);
  const uploadCover = useUploadHallCover();

  // Чистим object URL превью, чтобы не течь памятью.
  React.useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  function handleCover(file: File) {
    if (hallId !== undefined) {
      // Зал уже существует — заливаем сразу.
      uploadCover.mutate(
        { hallId, file },
        { onSuccess: (hall) => setCoverImageUrl(hall.coverImageUrl ?? "") },
      );
    } else {
      // Создание — откладываем файл и показываем локальное превью.
      setPendingCover(file);
      setPendingPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(
      {
        hallNumber: Number(hallNumber) || 0,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      },
      pendingCover ?? undefined,
    );
  }

  const previewUrl = pendingPreview ?? (coverImageUrl || null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Номер зала" required>
        <Input
          type="number"
          inputMode="numeric"
          value={hallNumber}
          onChange={(e) => setHallNumber(e.target.value)}
          required
        />
      </Field>
      <Field label="Название">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Синяя гостиная" />
      </Field>
      <Field label="Описание">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="URL обложки" hint="Можно вставить ссылку вручную или загрузить файл ниже.">
        <Input
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <div className="border-border flex flex-col gap-2 border-t pt-3">
        <span className="text-muted-foreground text-xs">Обложка</span>
        <div className="flex items-center gap-3">
          {previewUrl && (
            <div className="border-border relative h-16 w-24 shrink-0 border">
              <Image src={previewUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
            </div>
          )}
          <ImageUpload onFile={handleCover} loading={uploadCover.isPending} label="Загрузить обложку" />
        </div>
        {pendingCover && (
          <span className="text-muted-foreground text-[11px]">
            Обложка загрузится после сохранения зала.
          </span>
        )}
        {uploadCover.error && (
          <p className="text-destructive text-[11px]">{errorMessage(uploadCover.error)}</p>
        )}
      </div>

      <FormActions
        onCancel={onCancel}
        loading={loading}
        error={error}
        submitLabel={initial ? "Сохранить" : "Создать"}
      />
    </form>
  );
}
