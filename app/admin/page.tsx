"use client";

import Link from "next/link";
import { Box, Grid3x3, DoorOpen, ArrowRight } from "lucide-react";
import { useHalls } from "@/lib/api/hooks";
import { useAllExhibits, useAllShowcases } from "@/lib/api/admin-hooks";

export default function AdminOverviewPage() {
  const halls = useHalls();
  const showcases = useAllShowcases();
  const exhibits = useAllExhibits();

  const cards = [
    {
      href: "/admin/halls",
      label: "Залы",
      icon: DoorOpen,
      count: halls.data?.length,
      loading: halls.isLoading,
    },
    {
      href: "/admin/showcases",
      label: "Витрины",
      icon: Grid3x3,
      count: showcases.data?.length,
      loading: showcases.isLoading,
    },
    {
      href: "/admin/exhibits",
      label: "Экспонаты",
      icon: Box,
      count: exhibits.data?.length,
      loading: exhibits.isLoading,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl">Обзор</h1>
        <p className="text-muted-foreground mt-1 text-sm">Управление каталогом экспозиции</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ href, label, icon: Icon, count, loading }) => (
          <Link
            key={href}
            href={href}
            className="border-border bg-background hover:border-foreground/40 group flex flex-col gap-3 border p-5 transition-all hover:shadow-sm"
          >
            <div className="text-muted-foreground flex items-center justify-between">
              <Icon className="h-5 w-5" />
              <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <p className="font-display text-3xl tabular-nums">{loading ? "…" : (count ?? 0)}</p>
              <p className="text-muted-foreground text-sm">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
