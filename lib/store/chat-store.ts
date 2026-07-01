"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatContext, ChatMessage } from "@/lib/types";

/** Один сохранённый чат — живёт локально (бэк не отдаёт историю списком). */
export interface ChatSession {
  /** Локальный стабильный id чата (для маршрута /chat?session=…). */
  id: string;
  /** session_id с бэка (/guide/chat). Появляется после первого ответа гида. */
  serverSessionId?: string;
  /** Заголовок для списка истории. */
  title: string;
  /** О чём говорим: экспонат, зал или распознанный label. */
  context?: ChatContext;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatStore {
  /** Чаты по локальному id. */
  chats: Record<string, ChatSession>;
  /** Порядок отображения в истории — свежие сверху. */
  order: string[];

  /** Создать пустой чат, вернуть его локальный id. */
  createChat: (init?: { id?: string; title?: string; context?: ChatContext }) => string;
  getChat: (id: string) => ChatSession | undefined;
  /** Полный список для экрана истории (свежие сверху). */
  list: () => ChatSession[];

  setMessages: (id: string, messages: ChatMessage[]) => void;
  addMessage: (id: string, message: ChatMessage) => void;
  /** Заменить последнее сообщение (например — плейсхолдер на финальный ответ). */
  updateMessage: (id: string, messageId: string, patch: Partial<ChatMessage>) => void;
  setServerSessionId: (id: string, serverSessionId: string) => void;
  setContext: (id: string, context: ChatContext) => void;
  setTitle: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `chat_${Math.random().toString(36).slice(2)}`;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: {},
      order: [],

      createChat(init) {
        const id = init?.id ?? newId();
        const ts = nowIso();
        set((s) => ({
          chats: {
            ...s.chats,
            [id]: {
              id,
              title: init?.title ?? "Новый чат",
              context: init?.context,
              messages: [],
              createdAt: ts,
              updatedAt: ts,
            },
          },
          order: [id, ...s.order.filter((x) => x !== id)],
        }));
        return id;
      },

      getChat(id) {
        return get().chats[id];
      },

      list() {
        const { chats, order } = get();
        return order.map((id) => chats[id]).filter(Boolean) as ChatSession[];
      },

      setMessages(id, messages) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return {
            chats: { ...s.chats, [id]: { ...chat, messages, updatedAt: nowIso() } },
            order: [id, ...s.order.filter((x) => x !== id)],
          };
        });
      },

      addMessage(id, message) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return {
            chats: {
              ...s.chats,
              [id]: { ...chat, messages: [...chat.messages, message], updatedAt: nowIso() },
            },
            order: [id, ...s.order.filter((x) => x !== id)],
          };
        });
      },

      updateMessage(id, messageId, patch) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return {
            chats: {
              ...s.chats,
              [id]: {
                ...chat,
                messages: chat.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      setServerSessionId(id, serverSessionId) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat || chat.serverSessionId === serverSessionId) return s;
          return { chats: { ...s.chats, [id]: { ...chat, serverSessionId } } };
        });
      },

      setContext(id, context) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return { chats: { ...s.chats, [id]: { ...chat, context } } };
        });
      },

      setTitle(id, title) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return { chats: { ...s.chats, [id]: { ...chat, title } } };
        });
      },

      deleteChat(id) {
        set((s) => {
          const next = { ...s.chats };
          delete next[id];
          return { chats: next, order: s.order.filter((x) => x !== id) };
        });
      },
    }),
    {
      name: "museum-chat-history",
      version: 1,
      // blob:-превью загруженных фото мертвы после перезагрузки — не сохраняем их,
      // оставляем только постоянные URL (CDN-фото распознанного экспоната).
      partialize: (state) => ({
        order: state.order,
        chats: Object.fromEntries(
          Object.entries(state.chats).map(([id, chat]) => [
            id,
            {
              ...chat,
              messages: chat.messages.map((m) =>
                m.imageUrl?.startsWith("blob:") ? { ...m, imageUrl: undefined } : m,
              ),
            },
          ]),
        ),
      }),
    },
  ),
);
