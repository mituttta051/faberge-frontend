"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CameraCapture } from "@/components/camera/camera-capture";
import { useRecognizeExhibit } from "@/lib/api/hooks";
import { track } from "@/lib/telemetry";

type RecognizeStep = "camera" | "recognizing" | "result" | "not_recognized" | "error";

export default function RecognizePage() {
  const safeBack = useSafeBack();
  const [step, setStep] = useState<RecognizeStep>("camera");
  const recognize = useRecognizeExhibit();

  const handleCapture = async (blob: Blob) => {
    setStep("recognizing");
    try {
      const result = await recognize.mutateAsync(blob);
      const ok = result.recognized && !!result.exhibit;
      // `recognized` — то, по чему бэк считает долю удачных распознаваний.
      track({
        type: "recognition",
        exhibitId: result.exhibit?.id,
        labelSlug: result.labelSlug,
        props: { recognized: ok, confidence: result.confidence },
      });
      setStep(ok ? "result" : "not_recognized");
    } catch {
      track({ type: "recognition", props: { recognized: false, failed: true } });
      setStep("error");
    }
  };

  const handleRetry = () => {
    recognize.reset();
    setStep("camera");
  };

  const exhibit = recognize.data?.exhibit;
  const candidates = recognize.data?.candidates ?? [];

  return (
    <Screen>
      {step === "camera" && (
        <>
          <AppBar onBack={safeBack} title="Распознавание" />
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

      {step === "not_recognized" && (
        <>
          <AppBar onBack={handleRetry} title="Не уверены" />
          <main className="flex flex-1 flex-col gap-4 px-6 py-6">
            <div className="text-center">
              <AlertCircle className="text-muted-foreground mx-auto h-12 w-12" />
              <h1 className="font-display mt-4 text-2xl tracking-tight">Не распознали уверенно</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Попробуй сделать снимок крупнее или с другого ракурса.
              </p>
            </div>

            {candidates.length > 0 && (
              <section>
                <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
                  Возможно, это
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {candidates.map((c) => (
                    <li key={c.labelSlug}>
                      <Link
                        href={`/chat?label=${c.labelSlug}`}
                        className="border-border hover:bg-muted block border px-3 py-2 text-sm"
                      >
                        <span>{c.name ?? c.labelSlug}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {Math.round(c.confidence * 100)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-2 flex flex-col gap-2">
              <Button fullWidth onClick={handleRetry}>
                Сделать ещё снимок
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
