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
}

/** Мини-карточка экспоната, встраиваемая в assistant-сообщение. Кликабельна → /exhibits/[id]. */
export interface ChatExhibitCard {
  id: number;
  name: string;
  photoUrl?: string;
  yearCreated?: number;
  masterName?: string;
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
}
