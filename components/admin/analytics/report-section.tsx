"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { errorMessage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportSectionProps {
  title: string;
  /** Что означает отчёт — одной строкой, без этого таблицы читаются неоднозначно. */
  description?: string;
  loading?: boolean;
  error?: unknown;
  /** Отчёт загрузился, но данных за период нет. */
  empty?: boolean;
  emptyLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function ReportSection({
  title,
  description,
  loading,
  error,
  empty,
  emptyLabel = "За выбранный период данных нет.",
  action,
  children,
}: ReportSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </div>
        {action}
      </header>

      {loading ? (
        <div className="border-border flex flex-col gap-2 border p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-9/12" />
        </div>
      ) : error ? (
        <p className="border-destructive/40 text-destructive flex items-start gap-2 border border-dashed p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage(error, "Не удалось загрузить отчёт.")}
        </p>
      ) : empty ? (
        <p className="border-border text-muted-foreground border border-dashed p-4 text-sm">
          {emptyLabel}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
