import type { Exhibit } from "./exhibit";

/**
 * Типы для административной панели (CRUD).
 *
 * Input-типы — то, что форма отправляет на сервер (camelCase, маппится в
 * snake_case в `lib/api/admin.ts`). Поля совпадают с доменными сущностями,
 * но без `id` (его присваивает сервер) и с обязательными ключевыми полями.
 */

/** Данные формы зала. */
export interface HallInput {
  hallNumber: number;
  name?: string;
  description?: string;
  coverImageUrl?: string;
}

/** Данные формы витрины. */
export interface ShowcaseInput {
  hallId: number;
  showcaseNumber: number;
  name?: string;
}

/** Данные формы экспоната (включая admin-only `rawHistory`). */
export interface ExhibitInput {
  showcaseId?: number;
  hallId?: number;
  labelSlug?: string;
  name: string;
  yearCreated?: number;
  masterName?: string;
  material?: string;
  shortDescription?: string;
  photoUrl?: string;
  /** Факты для LLM — не отдаётся в публичном API, но редактируется в админке. */
  rawHistory?: string;
}

/**
 * Экспонат в админ-контексте: публичная карточка + `rawHistory`,
 * который скрыт от посетителей, но нужен администратору.
 */
export type AdminExhibit = Exhibit & { rawHistory?: string };

/** Сессия администратора: Bearer-токен от POST /admin/login. */
export interface AdminSession {
  token: string;
  username: string;
}

/** Фото из галереи экспоната (GET /admin/exhibits/{id}/media). */
export interface ExhibitImage {
  id: number;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  /** Главное фото экспоната (= exhibits.image_url). */
  isPrimary: boolean;
}
