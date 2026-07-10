"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ChatExhibitCard } from "@/lib/types";

interface Props {
  exhibit: ChatExhibitCard;
}

/** Мини-карточка распознанного экспоната внутри assistant-сообщения. */
export function ExhibitPlaque({ exhibit }: Props) {
  const meta = [exhibit.masterName, exhibit.yearCreated?.toString()].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/exhibits/${exhibit.id}`}
      className="group/plaque border-border hover:border-foreground/40 bg-background mb-3 flex items-stretch gap-3 border transition-colors"
    >
      {exhibit.photoUrl ? (
        <div className="border-border relative aspect-square w-20 shrink-0 overflow-hidden border-r">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exhibit.photoUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/plaque:scale-105"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase">На фото</p>
          <p className="font-display group-hover/plaque:text-accent mt-0.5 line-clamp-2 text-sm leading-snug transition-colors">
            {exhibit.name}
          </p>
          {meta && <p className="text-muted-foreground mt-0.5 truncate text-xs">{meta}</p>}
        </div>
        <ChevronRight className="text-muted-foreground group-hover/plaque:text-foreground h-4 w-4 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
