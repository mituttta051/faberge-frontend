"use client";

import { Suspense, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Camera, ChevronDown, MessageCircle, Search, Sparkles } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useHalls, useSearchCatalog } from "@/lib/api/hooks";
import { HallList } from "@/components/halls/hall-list";
import { hallTitle } from "@/lib/labels";
import { CoachMarkTour, type TourStep } from "@/components/tour/coach-mark-tour";
import { SiteFooter } from "@/components/layout/site-footer";

const TOUR_SEEN_KEY = "museum-tour-seen";

/** «1 зал», «3 зала», «10 залов» — склонение для счётчика в шапке. */
function hallsWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "залов";
  if (mod10 === 1) return "зал";
  if (mod10 >= 2 && mod10 <= 4) return "зала";
  return "залов";
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="recognize"]',
    title: "Распознать экспонат",
    text: "Наведите камеру на предмет, и AI подскажет, что это, и предложит рассказ.",
  },
  {
    selector: '[data-tour="chat"]',
    title: "Чат с AI-гидом",
    text: "Спросите о любой вещи в коллекции — от истории мастера до символики орнамента.",
  },
  {
    selector: '[data-tour="expositions"]',
    title: "Экспозиции музея",
    text: "Выбирайте, что посмотреть: постоянную коллекцию или временные выставки.",
  },
  {
    selector: '[data-tour="search"]',
    title: "Поиск по музею",
    text: "Ищите экспонат или зал по названию — результаты появляются на лету.",
  },
];

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
  const [showTour, setShowTour] = useState(false);

  const typeParam = searchParams.get("type");
  const expositionChosen = typeParam === "permanent" || typeParam === "temporary";

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
    // Первое посещение без QR-контекста и без выбранной экспозиции → тур по кнопкам.
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem(TOUR_SEEN_KEY) &&
      !searchParams.get("type")
    ) {
      setShowTour(true);
    }
  }, [searchParams, router]);

  const finishTour = () => {
    if (typeof window !== "undefined") localStorage.setItem(TOUR_SEEN_KEY, "1");
    setShowTour(false);
  };

  const { data: allHalls, isLoading, error } = useHalls();
  const numberedHallCount = (allHalls ?? []).filter((h) => h.hallNumber != null).length;
  const permanentHalls = (allHalls ?? []).filter((h) => !h.isTemporary);
  const temporaryHalls = (allHalls ?? []).filter((h) => !!h.isTemporary);
  const halls =
    typeParam === "temporary"
      ? temporaryHalls
      : typeParam === "permanent"
        ? permanentHalls
        : allHalls;
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
            {/* Число залов — из каталога, а не константой. Считаем только залы с
                номером: «Вне постоянной экспозиции» — группа для предметов вне
                экспозиции, и AI-гид её тоже не считает. Иначе главная обещала бы
                на один зал больше, чем называет гид. */}
            {numberedHallCount
              ? `${numberedHallCount} ${hallsWord(numberedHallCount)}, шедевры коллекции`
              : "Шедевры коллекции"}{" "}
            и искусственный интеллект, который расскажет историю каждого экспоната.
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

        {!expositionChosen && (
          <section data-tour="expositions" className="flex flex-col gap-3">
            <h2 className="text-muted-foreground text-xs tracking-widest uppercase">Экспозиции</h2>
            <Link
              href="/?type=permanent"
              className="border-border hover:bg-muted group/exp flex items-center gap-3 border p-4 transition-colors"
            >
              <Building2 className="text-accent h-6 w-6 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="font-display block text-base tracking-tight">
                  Основная экспозиция
                </span>
              </span>
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 -rotate-90" />
            </Link>
            <Link
              href="/?type=temporary"
              className="border-border hover:bg-muted group/exp flex items-center gap-3 border p-4 transition-colors"
            >
              <Sparkles className="text-accent h-6 w-6 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="font-display block text-base tracking-tight">
                  Временная выставка
                </span>
              </span>
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 -rotate-90" />
            </Link>
            {error && (
              <p className="text-destructive text-sm">Не удалось загрузить залы: {String(error)}</p>
            )}
          </section>
        )}

        {expositionChosen && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-muted-foreground text-[10px] tracking-widest uppercase">
                  {typeParam === "temporary" ? "Временная выставка" : "Основная экспозиция"}
                </h2>
                <Link href="/" className="text-muted-foreground hover:text-foreground text-xs">
                  ← сменить экспозицию
                </Link>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm">Не удалось загрузить залы: {String(error)}</p>
            )}

            <HallList halls={halls} isLoading={isLoading} />
          </section>
        )}
      </main>

      <SiteFooter />

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
                Начните вводить запрос
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
                  className="hover:bg-muted -mx-2 flex items-baseline gap-2 px-2 py-3 text-left text-sm transition-colors"
                >
                  <span className="text-muted-foreground text-xs tracking-widest uppercase">
                    Зал
                  </span>
                  <span className="min-w-0 flex-1 truncate">{hallTitle(h)}</span>
                  {h.isTemporary && (
                    <span className="border-border text-muted-foreground shrink-0 border px-1.5 py-px text-[10px] tracking-widest uppercase">
                      временная
                    </span>
                  )}
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
