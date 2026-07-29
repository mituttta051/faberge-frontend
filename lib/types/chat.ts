export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Текст сообщения (markdown допустим в ответах ассистента) */
  content: string;
  /** ISO timestamp */
  createdAt: string;
  /** Url озвучки от Yandex SpeechKit (только для assistant, появляется после первого "Прослушать") */
  audioUrl?: string;
  /** Контекстные подсказки-кнопки внизу чата (только у assistant) */
  suggestions?: string[];
  /** Прикреплённое фото: blob:-превью загрузки или CDN-фото распознанного экспоната. */
  imageUrl?: string;
  /** Плашка распознанного/упомянутого экспоната внутри сообщения (ссылка на карточку). */
  exhibit?: ChatExhibitCard;
  /** Экспонаты, на которые ссылается ответ гида (C23) — плашки-ссылки под текстом. */
  referencedExhibits?: ChatExhibitRef[];
  /** Заголовок над списком referencedExhibits (напр. «Возможно, это» для кандидатов). */
  referencedExhibitsLabel?: string;
  /** Залы из ответа-списка (C25). */
  referencedHalls?: ChatHallRef[];
  /** Навигационная подсказка «зал + витрина» (C24). */
  location?: ChatLocation;
}

/** Мини-карточка экспоната, встраиваемая в assistant-сообщение. Кликабельна → /exhibits/[id]. */
export interface ChatExhibitCard {
  id: number;
  name: string;
  photoUrl?: string;
  yearCreated?: number;
  masterName?: string;
}

/** Экспонат, упомянутый в ответе гида (C23) — ссылка-плашка на карточку. */
export interface ChatExhibitRef {
  id: number;
  name: string;
  exhibitNumber?: string;
  thumbnailUrl?: string;
  hallNumber?: number;
  showcaseNumber?: number;
}

/** Зал, упомянутый в ответе гида (C25) — ссылка на /halls/[id]. */
export interface ChatHallRef {
  id: number;
  /** Номера может не быть — зал «Вне постоянной экспозиции». */
  hallNumber?: number;
  name?: string;
}

/** Навигационная подсказка «зал + витрина» в ответе гида (C24). */
export interface ChatLocation {
  hallNumber?: number;
  hallName?: string;
  showcaseNumber?: number;
}

/** Контекст разговора — что обсуждаем (экспонат, зал или распознанный label). */
export interface ChatContext {
  exhibitId?: number;
  hallId?: number;
  labelSlug?: string;
}

/** Ответ генерации рассказа об экспонате (POST /guide/story). */
export interface StoryResult {
  exhibitId?: number;
  labelSlug?: string;
  style?: string;
  text: string;
  suggestedQuestions: string[];
  audioUrl?: string;
  model?: string;
}

/** Ответ одного хода диалога с гидом (POST /guide/chat). */
export interface ChatTurnResult {
  sessionId: string;
  answer: string;
  suggestedQuestions: string[];
  context?: ChatContext;
  /** Экспонаты, упомянутые в ответе (C23). */
  referencedExhibits: ChatExhibitRef[];
  /** Залы из ответа-списка (C25). */
  referencedHalls: ChatHallRef[];
  /** Навигационная подсказка «зал + витрина» (C24). */
  location?: ChatLocation;
}
