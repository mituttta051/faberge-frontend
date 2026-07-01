"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import {
  clearAdminSession,
  getAdminSession,
  loginAdmin,
  setAdminSession,
} from "@/lib/api/admin";
import type { AdminSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface AdminAuthValue {
  session: AdminSession;
  logout: () => void;
}

const AdminAuthContext = React.createContext<AdminAuthValue | null>(null);

/** Доступ к данным админ-сессии и выходу из неё. Только внутри <AuthGate>. */
export function useAdminAuth(): AdminAuthValue {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth должен использоваться внутри <AuthGate>");
  return ctx;
}

/**
 * Заглушка авторизации админки. Хранит сессию в localStorage.
 * Когда появится бэкенд-эндпоинт — менять только `loginAdmin` в lib/api/admin.ts.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AdminSession | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setSession(getAdminSession());
    setReady(true);
  }, []);

  const logout = React.useCallback(() => {
    clearAdminSession();
    setSession(null);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSuccess={setSession} />;
  }

  return (
    <AdminAuthContext.Provider value={{ session, logout }}>{children}</AdminAuthContext.Provider>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: (session: AdminSession) => void }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginAdmin({ username, password });
      setAdminSession(session);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-background w-full max-w-sm border p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="bg-accent text-accent-foreground flex h-11 w-11 items-center justify-center">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="font-display text-lg">Админ-панель</h1>
          <p className="text-muted-foreground text-xs">Музей Фаберже — управление каталогом</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Логин</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Пароль</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!error}
            />
          </label>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <Button type="submit" loading={loading} fullWidth className="mt-2">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
