"use client";

import { Camera, Search, ArrowRight, Volume2 } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Card, CardMedia, CardBody, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <Screen>
      <main className="flex flex-1 flex-col gap-12 px-6 py-10">
        <section className="text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Музей Фаберже</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">AI-гид</h1>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">Кнопки</h2>
          <Button leftIcon={<Camera className="h-5 w-5" />} size="lg" fullWidth>
            Распознать экспонат
          </Button>
          <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />} fullWidth>
            Открыть карту
          </Button>
          <div className="flex gap-2">
            <Button variant="accent">Спросить AI</Button>
            <Button variant="ghost">Отмена</Button>
            <Button loading>Загрузка</Button>
          </div>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Поиск" variant="secondary">
              <Search />
            </IconButton>
            <IconButton aria-label="Прослушать" variant="primary">
              <Volume2 />
            </IconButton>
            <Spinner size="md" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">Поля ввода</h2>
          <Input placeholder="Найти экспонат или зал" leftIcon={<Search />} />
          <Input placeholder="Заполнено" defaultValue="Синяя гостиная" />
          <Input placeholder="С ошибкой" error defaultValue="не найдено" />
          <Input placeholder="Заблокировано" disabled />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">Бэйджи</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Зал № 4</Badge>
            <Badge variant="outline">1898</Badge>
            <Badge variant="accent">Шедевр</Badge>
            <Badge variant="destructive">Скрыт</Badge>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
            Карточки (наведи)
          </h2>
          <Card interactive>
            <CardMedia className="h-40">
              <div className="from-muted to-border h-40 w-full bg-gradient-to-br" />
            </CardMedia>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardSubtitle>Зал № 4 · Синяя гостиная</CardSubtitle>
                  <CardTitle className="mt-1">Императорское пасхальное яйцо «Зимнее»</CardTitle>
                </div>
                <Badge variant="outline">1913</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Карточка без hover</CardTitle>
              <CardSubtitle>Просто контейнер</CardSubtitle>
            </CardBody>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">Скелетон</h2>
          <Card>
            <Skeleton className="h-40 w-full" />
            <CardBody>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-4 w-48" />
            </CardBody>
          </Card>
        </section>
      </main>
    </Screen>
  );
}
