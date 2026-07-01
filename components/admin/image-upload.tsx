"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
// Верхняя планка исходника (до сжатия) — защита от OOM в canvas.
const MAX_SOURCE_MB = 30;

interface ImageUploadProps {
  /** Вызывается с готовым (при необходимости сжатым) файлом. Загрузку держит родитель. */
  onFile: (file: File) => void;
  loading?: boolean;
  label?: string;
}

/**
 * Кнопка выбора файла: валидирует тип, затем сжимает крупные изображения
 * (см. lib/image.ts) — иначе платформа (Yandex API Gateway, ~3.5 МБ) режет
 * запрос и браузер показывает «Failed to fetch».
 */
export function ImageUpload({ onFile, loading, label = "Загрузить фото" }: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяем выбрать тот же файл повторно
    if (!file) return;
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError("Только JPEG, PNG или WebP.");
      return;
    }
    if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
      setError(`Файл больше ${MAX_SOURCE_MB} МБ.`);
      return;
    }
    setProcessing(true);
    try {
      const prepared = await compressImage(file);
      onFile(prepared);
    } catch {
      setError("Не удалось обработать изображение.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<ImagePlus className="h-4 w-4" />}
        loading={loading || processing}
        onClick={() => inputRef.current?.click()}
      >
        {processing ? "Обработка…" : label}
      </Button>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
