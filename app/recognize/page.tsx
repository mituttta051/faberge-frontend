"use client";

import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";

export default function RecognizePage() {
  const router = useRouter();
  return (
    <Screen>
      <AppBar onBack={() => router.back()} title="Распознавание" />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <Camera className="text-muted-foreground h-16 w-16" />
        <h1 className="font-display text-2xl tracking-tight">Камера</h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          Здесь будет камера и захват фото экспоната. Реализация в блоке Б8.
        </p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          На главную
        </Button>
      </main>
    </Screen>
  );
}
