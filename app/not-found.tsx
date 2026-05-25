import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Screen>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">404</p>
        <h1 className="font-display text-3xl tracking-tight">Страница не найдена</h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          Возможно, экспонат больше не выставлен или ссылка устарела.
        </p>
        <Link href="/">
          <Button variant="secondary">На главную</Button>
        </Link>
      </main>
    </Screen>
  );
}
