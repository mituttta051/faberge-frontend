import type { Exhibit } from "./exhibit";

/** Кандидат при неуверенном распознавании. */
export interface RecognitionCandidate {
  labelSlug: string;
  name?: string;
  confidence: number;
}

/** Результат распознавания фото от YOLO (POST /recognition). */
export interface RecognizeResult {
  /** Распознан ли экспонат с уверенностью выше порога. */
  recognized: boolean;
  labelSlug?: string;
  confidence?: number;
  /** Найденная карточка экспоната (если распознано). */
  exhibit?: Exhibit;
  /** Вероятные классы при неуверенном распознавании. */
  candidates?: RecognitionCandidate[];
  requestId?: string;
  processingMs?: number;
}
