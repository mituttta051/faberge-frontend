"use client";

import * as React from "react";
import { Camera as CameraIcon, CameraOff, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useCamera, type CameraError } from "@/lib/hooks/use-camera";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  className?: string;
}

const errorMessages: Record<CameraError, string> = {
  permission_denied: "Доступ к камере запрещён. Разреши в настройках браузера.",
  no_device: "Камера не найдена на устройстве.",
  unsupported: "Этот браузер не поддерживает камеру.",
  unknown: "Не удалось включить камеру.",
};

export function CameraCapture({ onCapture, className }: CameraCaptureProps) {
  const { videoRef, ready, error, capture } = useCamera();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [capturing, setCapturing] = React.useState(false);

  const handleShutter = async () => {
    if (capturing || !ready) return;
    setCapturing(true);
    try {
      const blob = await capture();
      if (blob) onCapture(blob);
    } finally {
      setCapturing(false);
    }
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  return (
    <div className={cn("relative flex flex-1 flex-col bg-black text-white", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          (!ready || error) && "opacity-0",
        )}
      />

      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs tracking-widest uppercase opacity-70">Включаем камеру…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <CameraOff className="h-12 w-12 opacity-70" />
          <p className="max-w-xs text-sm opacity-90">{errorMessages[error]}</p>
          <Button
            variant="secondary"
            leftIcon={<ImagePlus className="h-4 w-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Выбрать фото из галереи
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileFallback}
          />
        </div>
      )}

      {ready && (
        <>
          {/* Прицельная рамка */}
          <div className="pointer-events-none absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-white/70" />

          <p className="absolute top-6 right-0 left-0 text-center text-xs tracking-widest uppercase opacity-80">
            Наведи камеру на экспонат
          </p>

          {/* Кнопка спуска */}
          <div className="absolute right-0 bottom-10 left-0 flex justify-center">
            <button
              type="button"
              aria-label="Сделать снимок"
              onClick={handleShutter}
              disabled={capturing}
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full border-4 border-white",
                "bg-white/10 backdrop-blur transition-transform duration-150 ease-out",
                "active:scale-95 disabled:opacity-60",
              )}
            >
              {capturing ? <Spinner size="lg" /> : <CameraIcon className="h-8 w-8" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
