"use client";

import { Camera, Search, ArrowRight, Volume2 } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  return (
    <Screen>
      <main className="flex flex-1 flex-col gap-10 px-6 py-10">
        <section className="text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Музей Фаберже</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">AI-гид</h1>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-wider uppercase">Кнопки</h2>
          <Button leftIcon={<Camera className="h-5 w-5" />} size="lg" fullWidth>
            Распознать экспонат
          </Button>
          <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />} fullWidth>
            Открыть карту
          </Button>
          <Button variant="accent" fullWidth>
            Спросить AI-гида
          </Button>
          <Button variant="ghost" fullWidth>
            Отмена
          </Button>
          <div className="flex gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex gap-2">
            <Button loading>Загрузка</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-wider uppercase">
            Иконки и состояния
          </h2>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Поиск" variant="secondary">
              <Search />
            </IconButton>
            <IconButton aria-label="Прослушать" variant="primary">
              <Volume2 />
            </IconButton>
            <IconButton aria-label="Камера" variant="ghost">
              <Camera />
            </IconButton>
            <div className="ml-2 flex items-center gap-2">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </div>
        </section>
      </main>
    </Screen>
  );
}
