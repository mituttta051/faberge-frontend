"use client";

import { Suspense, useDeferredValue, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, List, Map as MapIcon, MessageCircle, Search } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardBody, CardMedia, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useHalls, useSearchCatalog } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { CoachMarkTour, type TourStep } from "@/components/tour/coach-mark-tour";

const TOUR_SEEN_KEY = "museum-tour-seen";

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="recognize"]',
    title: "Распознать экспонат",
    text: "Наведи камеру на предмет, и AI подскажет, что это, и предложит рассказ.",
  },
  {
    selector: '[data-tour="chat"]',
    title: "Чат с AI-гидом",
    text: "Спроси о любой вещи в коллекции — от истории мастера до символики орнамента.",
  },
  {
    selector: '[data-tour="map"]',
    title: "Карта залов",
    text: "Тапни на номер зала, чтобы открыть его. Жесты — зум и перемещение.",
  },
  {
    selector: '[data-tour="search"]',
    title: "Поиск по музею",
    text: "Ищи экспонат или зал по названию — результаты появляются на лету.",
  },
];

// Карта тянет react-zoom-pan-pinch (клиентская), грузим только в браузере.
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => <Skeleton className="aspect-[794/533] w-full" />,
  },
);

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hallsView, setHallsView] = useState<"map" | "list">("map");
  const [showTour, setShowTour] = useState(false);

  // QR deep-link: /?hall=4 → /halls/4, /?exhibit=1001 → /exhibits/1001
  useEffect(() => {
    const hall = searchParams.get("hall");
    const exhibit = searchParams.get("exhibit");
    if (hall) {
      router.replace(`/halls/${hall}`);
      return;
    }
    if (exhibit) {
      router.replace(`/exhibits/${exhibit}`);
      return;
    }
    // Первое посещение без QR-контекста → показать тур по кнопкам.
    if (typeof window !== "undefined" && !localStorage.getItem(TOUR_SEEN_KEY)) {
      setShowTour(true);
    }
  }, [searchParams, router]);

  const finishTour = () => {
    if (typeof window !== "undefined") localStorage.setItem(TOUR_SEEN_KEY, "1");
    setShowTour(false);
  };

  const { data: halls, isLoading, error } = useHalls();
  // Отложенный запрос сглаживает набор — React не бьёт по сети на каждую букву,
  // а результаты не пропадают между кадрами (см. `placeholderData` в хуке).
  const deferredQuery = useDeferredValue(searchQuery);
  const { data: searchData } = useSearchCatalog(deferredQuery);

  return (
    <Screen>
      <AppBar
        title="Музей Фаберже"
        right={
          <IconButton
            aria-label="Поиск"
            variant="ghost"
            onClick={() => setSearchOpen(true)}
            data-tour="search"
          >
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

        <div className="flex flex-col gap-3">
          <Link href="/recognize" className="block" data-tour="recognize">
            <Button leftIcon={<Camera className="h-5 w-5" />} size="lg" fullWidth>
              Распознать экспонат
            </Button>
          </Link>

          <Link href="/chat" className="block" data-tour="chat">
            <Button
              variant="secondary"
              leftIcon={<MessageCircle className="h-5 w-5" />}
              size="lg"
              fullWidth
            >
              Чат с AI-гидом
            </Button>
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
              Залы экспозиции
            </h2>

            <div className="border-border flex border" role="group" aria-label="Вид залов">
              <button
                type="button"
                aria-pressed={hallsView === "map"}
                onClick={() => setHallsView("map")}
                className={cn(
                  "flex h-8 items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                  hallsView === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Карта
              </button>
              <button
                type="button"
                aria-pressed={hallsView === "list"}
                onClick={() => setHallsView("list")}
                className={cn(
                  "border-border flex h-8 items-center gap-1.5 border-l px-3 text-xs font-medium transition-colors",
                  hallsView === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <List className="h-3.5 w-3.5" />
                Список
              </button>
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm">Не удалось загрузить залы: {String(error)}</p>
          )}

          {hallsView === "map" && (
            <>
              <div data-tour="map">
                <InteractiveMap halls={halls ?? []} />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Нажмите на номер зала, чтобы открыть его. Жесты — зум и перемещение.
              </p>
            </>
          )}

          {hallsView === "list" && (
            <>
              {isLoading &&
                [1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-40 w-full" />
                    <CardBody>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="mt-2 h-4 w-48" />
                    </CardBody>
                  </Card>
                ))}

              {halls?.map((hall) => (
                <Link key={hall.id} href={`/halls/${hall.id}`} className="block">
                  <Card interactive>
                    <CardMedia className="h-40">
                      {hall.coverImageUrl && (
                        <Image
                          src={hall.coverImageUrl}
                          alt={hall.name ?? `Зал № ${hall.hallNumber}`}
                          width={800}
                          height={500}
                          className="h-40 w-full object-cover"
                        />
                      )}
                    </CardMedia>
                    <CardBody>
                      <CardSubtitle>Зал № {hall.hallNumber}</CardSubtitle>
                      <CardTitle className="mt-1">
                        {hall.name ?? `Зал № ${hall.hallNumber}`}
                      </CardTitle>
                      {hall.description && (
                        <p className="text-muted-foreground mt-2 text-xs">{hall.description}</p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </>
          )}
        </section>
      </main>

      <Sheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Поиск по музею"
        className="h-[85vh]"
      >
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
            {searchQuery &&
              searchData &&
              searchData.halls.length === 0 &&
              searchData.exhibits.length === 0 && (
                <p className="text-muted-foreground text-sm">Ничего не найдено</p>
              )}
            {searchQuery &&
              searchData?.halls.map((h) => (
                <Link
                  key={`hall-${h.id}`}
                  href={`/halls/${h.id}`}
                  onClick={() => setSearchOpen(false)}
                  className="hover:bg-muted -mx-2 px-2 py-3 text-left text-sm transition-colors"
                >
                  <span className="text-muted-foreground mr-2 text-xs tracking-widest uppercase">
                    Зал
                  </span>
                  {h.name ?? `Зал № ${h.hallNumber}`}
                </Link>
              ))}
            {searchQuery &&
              searchData?.exhibits.map((e) => (
                <Link
                  key={`exhibit-${e.id}`}
                  href={`/exhibits/${e.id}`}
                  onClick={() => setSearchOpen(false)}
                  className="hover:bg-muted -mx-2 px-2 py-3 text-left text-sm transition-colors"
                >
                  <span className="text-muted-foreground mr-2 text-xs tracking-widest uppercase">
                    Экспонат
                  </span>
                  {e.name}
                </Link>
              ))}
          </div>
        </div>
      </Sheet>

      {showTour && <CoachMarkTour steps={TOUR_STEPS} onDone={finishTour} />}
    </Screen>
  );
}
