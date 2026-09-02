"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatContext, ChatMessage } from "@/lib/types";

/**
 * Единственный локальный тред посетителя. Один на устройство/браузер.
 * История между экспонатами не сбрасывается — контекст меняется, сообщения копятся.
 */
export interface ChatSession {
  /** Локальный стабильный id (переживает reload). */
  id: string;
  /** session_id с бэка (/guide/chat). Появляется после первого ответа гида. */
  serverSessionId?: string;
  /** Текущий контекст: последний экспонат/зал/label, о котором говорим. */
  context?: ChatContext;
  /**
   * Контекст, который, насколько мы знаем, уже держит серверная сессия.
   *
   * Нужен, чтобы не слать `context` в каждой реплике: по договорённости от
   * 28.07.2026 присланное поле — это команда «поставь такой контекст», а
   * `{}` — команда «сбрось». Мы же слали его всегда, и общий чат уходил с
   * `context: {}` при каждом сообщении, то есть сбрасывал сессию на каждой
   * реплике. Поле опускается, пока контекст не изменился.
   */
  sentContext?: ChatContext;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatStore {
  chat: ChatSession | null;

  /** Гарантирует, что тред существует, и возвращает его. */
  getOrCreate: () => ChatSession;
  setContext: (context: ChatContext) => void;
  /** Запомнить контекст, принятый сервером. `undefined` — «сервер не держит ничего». */
  setSentContext: (context: ChatContext | undefined) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, patch: Partial<ChatMessage>) => void;
  setServerSessionId: (serverSessionId: string) => void;
  /** Полный сброс истории (например, кнопка «Начать заново» в будущем). */
  clear: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `chat_${Math.random().toString(36).slice(2)}`;
}

/**
 * Один ли это контекст с точки зрения сервера.
 *
 * `undefined` и «объект, у которого все поля пустые» — одно и то же состояние
 * «сессия не привязана ни к чему»: первое означает «мы ничего не присылали»,
 * второе — «мы прислали сброс, и он уже применён». Различать их незачем, а вот
 * посылать сброс поверх сброса — это и есть баг с пропадающими подсказками.
 */
export function contextEquals(a?: ChatContext, b?: ChatContext): boolean {
  return a?.exhibitId === b?.exhibitId && a?.hallId === b?.hallId && a?.labelSlug === b?.labelSlug;
}

function emptyChat(): ChatSession {
  const ts = nowIso();
  return { id: newId(), messages: [], createdAt: ts, updatedAt: ts };
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chat: null,

      getOrCreate() {
        const existing = get().chat;
        if (existing) return existing;
        const created = emptyChat();
        set({ chat: created });
        return created;
      },

      setContext(context) {
        set((s) => (s.chat ? { chat: { ...s.chat, context, updatedAt: nowIso() } } : s));
      },

      setSentContext(sentContext) {
        // Без updatedAt: это служебная отметка о состоянии сессии, а не правка
        // треда — «последнее изменение» от неё сдвигаться не должно.
        set((s) => (s.chat ? { chat: { ...s.chat, sentContext } } : s));
      },

      addMessage(message) {
        set((s) => {
          const chat = s.chat ?? emptyChat();
          return {
            chat: { ...chat, messages: [...chat.messages, message], updatedAt: nowIso() },
          };
        });
      },

      updateMessage(messageId, patch) {
        set((s) => {
          if (!s.chat) return s;
          return {
            chat: {
              ...s.chat,
              messages: s.chat.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
              updatedAt: nowIso(),
            },
          };
        });
      },

      setServerSessionId(serverSessionId) {
        set((s) => {
          if (!s.chat || s.chat.serverSessionId === serverSessionId) return s;
          // Сессия сменилась (прежняя истекла) — что за контекст в новой,
          // мы не знаем. Отметку снимаем, следующая реплика пошлёт его заново.
          return { chat: { ...s.chat, serverSessionId, sentContext: undefined } };
        });
      },

      clear() {
        set({ chat: null });
      },
    }),
    {
      name: "museum-chat-history",
      version: 2,
      migrate: (persisted, version) => {
        // v1: { chats: Record<string, ChatSession & {title}>, order: string[] }
        // v2: { chat: ChatSession | null } — сворачиваем самый свежий тред в единственный.
        if (version < 2 && persisted && typeof persisted === "object") {
          const legacy = persisted as {
            chats?: Record<string, ChatSession & { title?: string }>;
            order?: string[];
          };
          const chats = legacy.chats ?? {};
          const order = legacy.order ?? Object.keys(chats);
          const pick = order.map((id) => chats[id]).find((c) => c && c.messages.length > 0);
          if (pick) {
            const { title: _title, ...rest } = pick as ChatSession & { title?: string };
            return { chat: rest };
          }
          return { chat: null };
        }
        return persisted;
      },
      // blob:-превью загруженных фото мертвы после перезагрузки — не сохраняем их,
      // оставляем только постоянные URL (CDN-фото распознанного экспоната).
      partialize: (state) => ({
        chat: state.chat
          ? {
              ...state.chat,
              messages: state.chat.messages.map((m) =>
                m.imageUrl?.startsWith("blob:") ? { ...m, imageUrl: undefined } : m,
              ),
            }
          : null,
      }),
    },
  ),
);
