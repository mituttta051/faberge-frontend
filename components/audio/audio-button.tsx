"use client";

import { AlertCircle, Pause, Volume2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/lib/store/audio-store";

interface AudioButtonProps {
  /** Уникальный ключ — кто играет. Обычно `message.id` или `exhibit_${id}`. */
  audioKey: string;
  /** Текст, который пойдёт в TTS. */
  text: string;
  /** Стиль: иконка (для чата) или кнопка с подписью (для карточки экспоната). */
  variant?: "icon" | "labeled";
}

export function AudioButton({ audioKey, text, variant = "icon" }: AudioButtonProps) {
  const currentKey = useAudioStore((s) => s.currentKey);
  const status = useAudioStore((s) => s.status);
  const toggle = useAudioStore((s) => s.toggle);

  const isActive = currentKey === audioKey;
  const isLoading = isActive && status === "loading";
  const isPlaying = isActive && status === "playing";
  const isError = isActive && status === "error";

  const icon = isLoading ? (
    <Spinner size="sm" />
  ) : isPlaying ? (
    <Pause />
  ) : isError ? (
    <AlertCircle />
  ) : (
    <Volume2 />
  );

  const label = isLoading ? "Загрузка…" : isPlaying ? "Пауза" : isError ? "Ошибка" : "Прослушать";

  const handleClick = () => {
    void toggle(audioKey, text);
  };

  if (variant === "icon") {
    return (
      <IconButton
        aria-label={isPlaying ? "Пауза" : "Прослушать"}
        variant="ghost"
        size="sm"
        onClick={handleClick}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Button variant="secondary" leftIcon={icon} onClick={handleClick}>
      {label}
    </Button>
  );
}
