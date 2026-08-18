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
  /** Пусто — зал без номера («Вне постоянной экспозиции»), бэкенд примет null. */
  hallNumber?: number;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  /**
   * Служебная запись (Парадная лестница и т.п.): зал остаётся в каталоге и в
   * админке, но пропадает из публичной выдачи, с карты и из ответов гида.
   */
  isService?: boolean;
  /** Зал временной выставки: попадает в отдельный каталог и получает бейдж. */
  isTemporary?: boolean;
}

/** Данные формы витрины. */
export interface ShowcaseInput {
  hallId: number;
  /** Пусто — витрина без номера, то есть группа «не в витринах». */
  showcaseNumber?: number;
  name?: string;
}

/** Данные формы экспоната (включая admin-only `rawHistory`). */
export interface ExhibitInput {
  showcaseId?: number;
  hallId?: number;
  labelSlug?: string;
  /** Номер экспоната в витрине по путеводителю («1», «12а»). */
  exhibitNumber?: string;
  name: string;
  /** Датировка строкой, как в путеводителе: «1899–1903», «конец XIX века». */
  yearCreated?: string;
  masterName?: string;
  material?: string;
  /** Техники исполнения — отдельным полем, не внутри материалов. */
  techniques?: string;
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
