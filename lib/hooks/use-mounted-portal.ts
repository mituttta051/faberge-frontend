"use client";

import { useEffect, useState } from "react";

/**
 * Управляет mount/visible циклом для анимированных оверлеев.
 * - mounted: true пока открыто и пока играет exit-анимация
 * - visible: true сразу после mount (используем для CSS-перехода)
 */
export function useMountedVisible(open: boolean, exitMs = 300) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const id = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(id);
  }, [open, exitMs]);

  return { mounted, visible };
}

/**
 * Блокирует скролл body, пока компонент смонтирован с active=true.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

/**
 * Закрытие по Escape.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}
