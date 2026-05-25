export type ChatRole = "user" | "assistant";

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
}

/** Контекст разговора — что обсуждаем (экспонат или распознанный label). */
export interface ChatContext {
  exhibitId?: number;
  labelSlug?: string;
}

export interface ChatSession {
  id: string;
  context?: ChatContext;
  messages: ChatMessage[];
  createdAt: string;
}
