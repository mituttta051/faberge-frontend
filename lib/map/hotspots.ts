/**
 * Интерактивная карта экспозиции (2-й этаж Музея Фаберже).
 *
 * Подложка — официальный план экспозиции музея:
 * https://fabergemuseum.ru/posetitelyam/plan-ekspozitsii
 *
 * Координаты хотспотов заданы в процентах от размеров изображения плана,
 * поэтому корректно масштабируются при зуме/ресайзе. Каждый хотспот стоит
 * поверх номерного бейджа зала на плане и ведёт на /halls/{id}.
 */

export const MAP_PLAN = {
  src: "/map/exposition.jpg",
  width: 794,
  height: 533,
  /** Источник изображения — для атрибуции. */
  source: "https://fabergemuseum.ru/posetitelyam/plan-ekspozitsii",
} as const;

export interface MapHotspot {
  /** Номер зала на плане (1–11). Совпадает с цифрой на бейдже. */
  hallNumber: number;
  /** X центра бейджа, % от ширины плана. */
  x: number;
  /** Y центра бейджа, % от высоты плана. */
  y: number;
}

/**
 * Позиции номерных бейджей на плане exposition.jpg (794×533).
 * Центры определены детекцией бейджей по изображению плана.
 */
export const MAP_HOTSPOTS: MapHotspot[] = [
  { hallNumber: 1, x: 43.7, y: 62.7 },
  { hallNumber: 2, x: 27.8, y: 63.0 },
  { hallNumber: 3, x: 37.8, y: 76.5 },
  { hallNumber: 4, x: 52.9, y: 71.9 },
  { hallNumber: 5, x: 59.3, y: 54.1 },
  { hallNumber: 6, x: 51.1, y: 44.1 },
  { hallNumber: 7, x: 42.1, y: 32.0 },
  { hallNumber: 8, x: 56.0, y: 23.5 },
  { hallNumber: 9, x: 69.6, y: 14.5 },
  { hallNumber: 10, x: 56.2, y: 33.9 },
  { hallNumber: 11, x: 19.8, y: 53.0 },
];
