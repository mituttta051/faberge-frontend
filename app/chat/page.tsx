"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/ui/screen";
import { AppBar } from "@/components/ui/app-bar";
import { ChatThread } from "@/components/chat/chat-thread";
import type { ChatMessage } from "@/lib/types";

// Временное демо чата с локальным state. Реальный API подключим в Б9.2.
const seed: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "**Яйцо «Бутон розы»** (1895)\n\nПервое императорское пасхальное яйцо Николая II. Мастер — Михаил Перхин. Внутри — раскрывающийся бутон розы с подвеской.",
    createdAt: new Date().toISOString(),
    suggestions: [
      "Кто заказал это яйцо?",
      "Сколько времени ушло на создание?",
      "Какие материалы использовались?",
    ],
  },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const handleSubmit = (text: string) => {
    const userMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);
    // Имитация ответа
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m_${Date.now() + 1}`,
        role: "assistant",
        content: `Ответ-заглушка на «${text}». Реальный AI подключим в Б9.2.`,
        createdAt: new Date().toISOString(),
        suggestions: ["А что было дальше?", "Расскажи подробнее", "Какие ещё яйца есть?"],
      };
      setMessages((prev) => [...prev, reply]);
      setThinking(false);
    }, 1500);
  };

  return (
    <Screen>
      <AppBar onBack={() => router.back()} title="AI-гид" />
      <ChatThread
        messages={messages}
        thinking={thinking}
        suggestions={!thinking ? lastAssistant?.suggestions : undefined}
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
