/** Зал музея (этаж, помещение). */
export interface Hall {
  id: number;
  /** Номер зала на плане экспозиции (1-11 для Музея Фаберже) */
  hallNumber: number;
  /** Название зала (напр. «Синяя гостиная») */
  name?: string;
  /** Описание зала (для блока «Описание зала» и шапки) */
  description?: string;
  /** Этаж/уровень в здании музея */
  level?: number;
  /** Заглавное фото зала */
  coverImageUrl?: string;
  showcaseCount?: number;
  exhibitCount?: number;
}
