/** Результат распознавания фото от YOLO. */
export interface RecognizeResult {
  /** Slug экспоната, который вернула модель */
  labelSlug: string;
  /** Уверенность модели от 0 до 1 */
  confidence: number;
  /** ID экспоната в БД, если slug найден (иначе экспонат не в базе) */
  exhibitId?: number;
}
