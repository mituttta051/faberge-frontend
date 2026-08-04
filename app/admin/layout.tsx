import type { Metadata } from "next";
import { AuthGate } from "@/components/admin/auth-gate";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Админ-панель — Музей Фаберже",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {/*
        `shrink-0` обязателен: в `globals.css` у `body` жёсткая `height: 100%`,
        и как flex-элемент эта обёртка ужималась до высоты экрана. Контент при
        этом вылезал за её коробку, а фон красился только на первый экран —
        дальше при прокрутке шёл белый `body`.
      */}
      <div className="bg-muted/40 flex min-h-screen shrink-0 flex-col md:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </AuthGate>
  );
}
