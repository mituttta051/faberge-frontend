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
      <div className="bg-muted/40 flex min-h-screen flex-col md:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </AuthGate>
  );
}
