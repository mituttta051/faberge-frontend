/** Витрина внутри зала. */
export interface Showcase {
  id: number;
  hallId: number;
  /** Номер витрины в пределах зала */
  showcaseNumber: number;
  /** Опциональное название (напр. «Часы и галантерея»). Может отсутствовать. */
  name?: string;
}
