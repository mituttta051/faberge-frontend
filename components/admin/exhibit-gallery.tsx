"use client";

import * as React from "react";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import {
  useDeleteExhibitMedia,
  useExhibitMedia,
  useUploadExhibitMedia,
} from "@/lib/api/admin-hooks";
import { errorMessage } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ImageUpload } from "./image-upload";

/** Управление фото экспоната: список, загрузка, выбор главной, удаление. */
export function ExhibitGallery({ exhibitId }: { exhibitId: number }) {
  const media = useExhibitMedia(exhibitId);
  const upload = useUploadExhibitMedia();
  const remove = useDeleteExhibitMedia();
  const [makePrimary, setMakePrimary] = React.useState(false);

  const images = media.data ?? [];
  const isEmpty = images.length === 0;

  function handleFile(file: File) {
    // Первое фото всегда делаем главным; дальше — по галочке.
    upload.mutate({ exhibitId, file, isPrimary: makePrimary || isEmpty });
  }

  const actionError = upload.error ?? remove.error;

  return (
    <div className="border-border flex flex-col gap-2 border-t pt-3">
      <span className="text-muted-foreground text-xs">Фотографии</span>

      <div className="flex items-center justify-between gap-3">
        <ImageUpload onFile={handleFile} loading={upload.isPending} label="Добавить фото" />
        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <input
            type="checkbox"
            checked={makePrimary}
            onChange={(e) => setMakePrimary(e.target.checked)}
          />
          Сделать главным
        </label>
      </div>

      {actionError && <p className="text-destructive text-[11px]">{errorMessage(actionError)}</p>}

      {media.isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : isEmpty ? (
        <p className="text-muted-foreground text-[11px]">Фото пока нет.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="border-border group relative aspect-square border">
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                fill
                sizes="120px"
                className="object-cover"
              />
              {img.isPrimary && (
                <span className="bg-accent text-accent-foreground absolute top-1 left-1 inline-flex items-center gap-0.5 px-1 text-[10px]">
                  <Star className="h-2.5 w-2.5" /> главная
                </span>
              )}
              <button
                type="button"
                aria-label="Удалить фото"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ exhibitId, imageId: img.id })}
                className="bg-background/80 text-destructive absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
