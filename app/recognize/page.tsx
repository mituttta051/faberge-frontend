"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CameraCapture } from "@/components/camera/camera-capture";
import { useExhibit, useRecognizeExhibit } from "@/lib/api/hooks";

type RecognizeStep = "camera" | "recognizing" | "result" | "error";

export default function RecognizePage() {
  const router = useRouter();
  const [step, setStep] = useState<RecognizeStep>("camera");
  const recognize = useRecognizeExhibit();
  const { data: exhibit } = useExhibit(recognize.data?.exhibitId);

  const handleCapture = async (blob: Blob) => {
    setStep("recognizing");
    try {
      await recognize.mutateAsync(blob);
      setStep("result");
    } catch {
      setStep("error");
    }
  };

  const handleRetry = () => {
    recognize.reset();
    setStep("camera");
  };

  return (
    <Screen>
      {step === "camera" && (
        <>
          <AppBar onBack={() => router.back()} title="Распознавание" />
          <CameraCapture onCapture={handleCapture} className="flex-1" />
        </>
      )}

      {step === "recognizing" && (
        <>
          <AppBar title="Распознавание" />
          <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <Sparkles className="text-accent h-12 w-12 animate-pulse" />
            <Spinner size="lg" />
            <div>
              <h1 className="font-display text-2xl tracking-tight">AI ищет экспонат</h1>
              <p className="text-muted-foreground mt-2 text-sm">Обычно занимает пару секунд…</p>
            </div>
          </main>
        </>
      )}

      {step === "result" && exhibit && (
        <>
          <AppBar onBack={handleRetry} title="Найдено" />
          <main className="flex flex-1 flex-col gap-6 px-6 py-6">
            <div className="flex flex-col gap-3 text-center">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Уверенность {Math.round((recognize.data?.confidence ?? 0) * 100)}%
              </p>
              {exhibit.photoUrl && (
                <div className="border-border mx-auto border">
                  <Image
                    src={exhibit.photoUrl}
                    alt={exhibit.name}
                    width={500}
                    height={500}
                    className="aspect-square w-64 object-cover"
                  />
                </div>
              )}
              <h1 className="font-display text-2xl tracking-tight">{exhibit.name}</h1>
              {(exhibit.yearCreated || exhibit.masterName) && (
                <p className="text-muted-foreground text-sm">
                  {exhibit.masterName}
                  {exhibit.yearCreated && ` · ${exhibit.yearCreated}`}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link href={`/exhibits/${exhibit.id}`} className="block">
                <Button variant="accent" fullWidth>
                  Открыть карточку
                </Button>
              </Link>
              <Button variant="secondary" fullWidth onClick={handleRetry}>
                Сделать ещё снимок
              </Button>
            </div>
          </main>
        </>
      )}

      {step === "error" && (
        <>
          <AppBar onBack={handleRetry} title="Ошибка" />
          <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <AlertCircle className="text-destructive h-12 w-12" />
            <h1 className="font-display text-2xl tracking-tight">Не удалось распознать</h1>
            <p className="text-muted-foreground max-w-xs text-sm">
              Попробуй сделать ещё одно фото или вернись к карте, чтобы выбрать экспонат вручную.
            </p>
            <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
              <Button fullWidth onClick={handleRetry}>
                Попробовать снова
              </Button>
              <Link href="/" className="block">
                <Button variant="ghost" fullWidth>
                  На главную
                </Button>
              </Link>
            </div>
          </main>
        </>
      )}
    </Screen>
  );
}
