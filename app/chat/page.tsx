"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";

export default function ChatPage() {
  const router = useRouter();
  return (
    <Screen>
      <AppBar onBack={() => router.back()} title="AI-гид" />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <h1 className="font-display text-2xl tracking-tight">Чат с AI-гидом</h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          Тут будет тред с ассистентом, подсказки и плеер озвучки. Реализация в блоке Б9.
        </p>
      </main>
    </Screen>
  );
}
