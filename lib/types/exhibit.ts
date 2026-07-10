/** Экспонат — основная сущность каталога. */
export interface Exhibit {
  id: number;
  showcaseId?: number;
  /** ID зала. У полной карточки приходит через `hall.id`, у summary — как `hall_id`. */
  hallId?: number;
  /** Номер витрины (в пределах зала). Приходит только у detail (`showcase.showcase_number`). */
  showcaseNumber?: number;
  /** Slug, который возвращает YOLO. Напр. 'faberge_egg_winter' */
  labelSlug?: string;
  /** Название экспоната */
  name: string;
  yearCreated?: number;
  masterName?: string;
  /** Материалы (горный хрусталь, эмаль и т.п.) */
  material?: string;
  /** Краткое описание для карточки */
  shortDescription?: string;
  /** Главное фото (для карточки — image_url, для summary — thumbnail_url). */
  photoUrl?: string;
  /** Ссылка на 3D-модель Koinovo */
  model3dUrl?: string;
  /** HTML/iframe embed-код 3D-модели */
  model3dEmbed?: string;
  /** Предсинтезированная озвучка краткого описания */
  audioUrl?: string;
  /** Первоисточник описания на сайте музея */
  sourceUrl?: string;
}
