import type { Showcase } from "@/lib/types";

/**
 * Витрины внутри залов. В каждом зале — 1–2 витрины для демо.
 * Реальные номера и названия уточним при наполнении БД с командой музея.
 */
export const showcases = [
  // Hall 2 — Рыцарский зал
  { id: 21, hallId: 2, showcaseNumber: 1, name: "Холодное оружие" },
  { id: 22, hallId: 2, showcaseNumber: 2, name: "Военная миниатюра" },

  // Hall 3 — Красная гостиная
  { id: 31, hallId: 3, showcaseNumber: 1, name: "Парадное серебро" },
  { id: 32, hallId: 3, showcaseNumber: 2, name: "Серебряная скульптура" },

  // Hall 4 — Синяя гостиная (главная — пасхальные яйца)
  { id: 41, hallId: 4, showcaseNumber: 1, name: "Императорские пасхальные яйца" },
  { id: 42, hallId: 4, showcaseNumber: 2, name: "Подарочные пасхальные яйца" },

  // Hall 5 — Золотая гостиная
  { id: 51, hallId: 5, showcaseNumber: 1, name: "Фантазийные предметы" },
  { id: 52, hallId: 5, showcaseNumber: 2, name: "Императорские подарки" },

  // Hall 6 — Аванзал
  { id: 61, hallId: 6, showcaseNumber: 1, name: "Часы и часовые механизмы" },
  { id: 62, hallId: 6, showcaseNumber: 2, name: "Ювелирные украшения" },

  // Hall 7 — Белая и Голубая
  { id: 71, hallId: 7, showcaseNumber: 1, name: "Эмалевые изделия" },
  { id: 72, hallId: 7, showcaseNumber: 2, name: "Русский фарфор" },

  // Hall 8 — Выставочный
  { id: 81, hallId: 8, showcaseNumber: 1, name: "Камнерезные фигурки" },

  // Hall 9 — Готический (иконы)
  { id: 91, hallId: 9, showcaseNumber: 1, name: "Древние иконы XVI–XVII вв." },
  { id: 92, hallId: 9, showcaseNumber: 2, name: "Иконы в окладах работы Фаберже" },

  // Hall 10 — Верхняя буфетная
  { id: 101, hallId: 10, showcaseNumber: 1, name: "Импрессионисты" },

  // Hall 11 — Бежевый
  { id: 111, hallId: 11, showcaseNumber: 1, name: "Парадная эмалевая посуда" },
] satisfies Showcase[];
