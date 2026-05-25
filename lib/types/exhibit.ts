/** Экспонат — основная сущность каталога. */
export interface Exhibit {
  id: number;
  showcaseId: number;
  /** Денормализованный id зала для быстрого фильтра (без join'а на бэке) */
  hallId: number;
  /** Slug, который возвращает YOLO. Уникальный. Напр. 'faberge_egg_winter' */
  labelSlug: string;
  /** Название экспоната */
  name: string;
  yearCreated?: number;
  masterName?: string;
  /** Материалы (горный хрусталь, эмаль и т.п.) */
  material?: string;
  /** Краткое описание для карточки */
  shortDescription: string;
  /** Главное фото экспоната */
  photoUrl?: string;
  /** Embed-URL 3D-модели Koinovo (опционально, придёт позже) */
  koinovoEmbedUrl?: string;
  /** Сырые факты для LLM — на фронте показывать не нужно, только для контекста чата */
  rawHistory?: string;
}
