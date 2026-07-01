"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquareText, Trash2 } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useChatStore, type ChatSession } from "@/lib/store/chat-store";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lastSnippet(chat: ChatSession): string {
  const last = chat.messages[chat.messages.length - 1];
  if (!last) return "Пустой чат";
  const prefix = last.role === "assistant" ? "" : "Вы: ";
  return `${prefix}${last.content}`.slice(0, 80);
}

export default function ChatsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Стор гидрируется из localStorage только на клиенте — ждём mount,
  // чтобы избежать рассинхрона SSR/CSR.
  useEffect(() => setMounted(true), []);

  const order = useChatStore((s) => s.order);
  const chats = useChatStore((s) => s.chats);
  const deleteChat = useChatStore((s) => s.deleteChat);

  const list = mounted
    ? (order.map((id) => chats[id]).filter((c): c is ChatSession => !!c && c.messages.length > 0))
    : [];

  return (
    <Screen>
      <AppBar onBack={() => router.push("/")} title="История чатов" />

      <main className="flex flex-1 flex-col gap-4 px-6 py-6">
        <Button
          leftIcon={<MessageSquarePlus className="h-5 w-5" />}
          fullWidth
          onClick={() => router.push("/chat")}
        >
          Новый чат
        </Button>

        {mounted && list.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <MessageSquareText className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground text-sm">
              Здесь появятся твои диалоги с AI-гидом.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {list.map((chat) => (
            <li
              key={chat.id}
              className="border-border hover:bg-muted group flex items-center gap-2 border transition-colors"
            >
              <button
                type="button"
                onClick={() => router.push(`/chat?session=${chat.id}`)}
                className="min-w-0 flex-1 px-3 py-3 text-left"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{chat.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatWhen(chat.updatedAt)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-xs">{lastSnippet(chat)}</p>
              </button>
              <IconButton
                aria-label="Удалить чат"
                variant="ghost"
                size="sm"
                className="mr-1"
                onClick={() => deleteChat(chat.id)}
              >
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      </main>
    </Screen>
  );
}
