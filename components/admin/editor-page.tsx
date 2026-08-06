import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface EditorPageProps {
  /** Куда возвращает ссылка «назад» — обычно список раздела. */
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Каркас страницы-редактора в админке.
 *
 * Формы залов, витрин и экспонатов заказчик попросил вынести из модалок на
 * отдельные страницы (баг-репорт 06.08.2026): в окне поверх списка длинная форма
 * скроллилась внутри себя, а ссылку на редактирование нельзя было ни открыть
 * напрямую, ни переслать. Каркас общий, чтобы три раздела не разъехались по
 * вёрстке.
 */
export function EditorPage({ backHref, backLabel, title, subtitle, children }: EditorPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="font-display text-2xl">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
