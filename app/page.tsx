"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Search } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardBody, CardMedia, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useHalls, useSearchCatalog } from "@/lib/api/hooks";

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: halls, isLoading, error } = useHalls();
  const { data: searchData } = useSearchCatalog(searchQuery);

  return (
    <Screen>
      <AppBar
        title="Музей Фаберже"
        right={
          <IconButton aria-label="Поиск" variant="ghost" onClick={() => setSearchOpen(true)}>
            <Search />
          </IconButton>
        }
      />

      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <section className="text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">AI-гид</p>
          <h1 className="font-display mt-2 text-3xl tracking-tight">Знакомство с экспозицией</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            11 залов, шедевры коллекции и искусственный интеллект, который расскажет историю каждого
            экспоната.
          </p>
        </section>

        <Button
          leftIcon={<Camera className="h-5 w-5" />}
          size="lg"
          fullWidth
          onClick={() => alert("Камера будет в Б8")}
        >
          Распознать экспонат
        </Button>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
            Залы экспозиции
          </h2>

          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-40 w-full" />
                  <CardBody>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-4 w-48" />
                  </CardBody>
                </Card>
              ))}
            </>
          )}

          {error && (
            <p className="text-destructive text-sm">Не удалось загрузить залы: {String(error)}</p>
          )}

          {halls?.map((hall) => (
            <Card
              key={hall.id}
              interactive
              onClick={() => alert(`Открыть зал ${hall.id} (роутинг в Б3)`)}
            >
              <CardMedia className="h-40">
                {hall.coverImageUrl && (
                  <Image
                    src={hall.coverImageUrl}
                    alt={hall.name}
                    width={800}
                    height={500}
                    className="h-40 w-full object-cover"
                  />
                )}
              </CardMedia>
              <CardBody>
                <CardSubtitle>Зал № {hall.hallNumber}</CardSubtitle>
                <CardTitle className="mt-1">{hall.name}</CardTitle>
                <p className="text-muted-foreground mt-2 text-xs">{hall.shortDescription}</p>
              </CardBody>
            </Card>
          ))}
        </section>
      </main>

      <Sheet open={searchOpen} onOpenChange={setSearchOpen} title="Поиск по музею">
        <div className="p-4">
          <Input
            placeholder="Найти экспонат или зал"
            leftIcon={<Search />}
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="mt-4 flex flex-col">
            {!searchQuery && (
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Начни вводить запрос
              </p>
            )}
            {searchQuery && searchData?.results.length === 0 && (
              <p className="text-muted-foreground text-sm">Ничего не найдено</p>
            )}
            {searchData?.results.map((r, i) => (
              <button
                key={i}
                className="hover:bg-muted -mx-2 cursor-pointer px-2 py-3 text-left text-sm transition-colors"
                onClick={() => {
                  if (r.kind === "hall") alert(`Зал ${r.hall.name}`);
                  else alert(`Экспонат ${r.exhibit.name}`);
                }}
              >
                <span className="text-muted-foreground mr-2 text-xs tracking-widest uppercase">
                  {r.kind === "hall" ? "Зал" : "Экспонат"}
                </span>
                {r.kind === "hall" ? r.hall.name : r.exhibit.name}
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
