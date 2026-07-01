"use client";

/**
 * Клиентское сжатие изображения перед загрузкой.
 *
 * Зачем: Yandex API Gateway / Cloud Function режут запрос примерно от 3.5 МБ
 * (тело ещё и раздувается base64 на ~33%), и платформа отвечает без CORS —
 * браузер видит «Failed to fetch». Поэтому ужимаем картинку до безопасного
 * размера прямо в браузере (canvas → JPEG), не трогая бэкенд.
 */

interface CompressOptions {
  /** Максимальная сторона (px) после уменьшения. */
  maxDim?: number;
  /** Целевой максимум байт результата. */
  maxBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDim: 2000,
  // С запасом ниже платформенного лимита (~3.5 МБ) с учётом base64.
  maxBytes: 2_500_000,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось прочитать изображение."));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Возвращает файл, гарантированно не превышающий `maxBytes` (по возможности).
 * Если исходник уже достаточно мал — отдаёт его как есть.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDim, maxBytes } = { ...DEFAULTS, ...opts };

  if (file.size <= maxBytes) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file; // нет canvas — отдаём оригинал, пусть валидация решает
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.85;
    let blob = await toBlob(canvas, quality);
    while (blob && blob.size > maxBytes && quality > 0.4) {
      quality -= 0.15;
      blob = await toBlob(canvas, quality);
    }
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
