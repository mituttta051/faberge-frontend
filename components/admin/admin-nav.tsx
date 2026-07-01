"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Grid3x3, LayoutDashboard, LogOut, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./auth-gate";

const NAV = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/halls", label: "Залы", icon: DoorOpen },
  { href: "/admin/showcases", label: "Витрины", icon: Grid3x3 },
  { href: "/admin/exhibits", label: "Экспонаты", icon: Box },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const { session, logout } = useAdminAuth();

  return (
    <nav className="border-border bg-background flex shrink-0 flex-row gap-1 border-b p-2 md:h-screen md:w-60 md:flex-col md:border-r md:border-b-0 md:p-4">
      <div className="hidden md:mb-4 md:block">
        <p className="font-display text-base">Музей Фаберже</p>
        <p className="text-muted-foreground text-xs">Админ-панель</p>
      </div>

      <div className="flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={logout}
        title={`Выйти (${session.username})`}
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex shrink-0 items-center gap-2 px-3 py-2 text-sm transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Выйти</span>
      </button>
    </nav>
  );
}
