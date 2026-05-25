import { Screen } from "@/components/ui/screen";

export default function HomePage() {
  return (
    <Screen>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-muted-foreground font-sans text-xs tracking-widest uppercase">
          Музей Фаберже
        </p>
        <h1 className="font-display mt-4 text-4xl tracking-tight">AI-гид</h1>
        <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
          Каркас приложения. Дальше — карта залов, каталог, чат с AI и распознавание экспонатов.
        </p>

        <div className="mt-12 flex flex-col gap-3 text-left text-xs">
          <div className="border-border bg-muted rounded-lg border p-3">
            <span className="font-sans">Inter (sans)</span>
            <span className="text-muted-foreground"> — кириллица читается?</span>
          </div>
          <div className="border-border bg-muted rounded-lg border p-3">
            <span className="font-display text-base">Playfair Display</span>
            <span className="text-muted-foreground"> — заголовки</span>
          </div>
          <div className="border-border rounded-lg border p-3">
            Акцент: <span className="font-medium text-[color:var(--color-accent)]">золотой</span>
          </div>
        </div>
      </main>
    </Screen>
  );
}
