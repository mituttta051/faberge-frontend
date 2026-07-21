"use client";

import { create } from "zustand";
import { synthesizeSpeech } from "@/lib/api";
import { track } from "@/lib/telemetry";

/** Ключи вида `exhibit_42` приходят с карточки; в чате это id сообщения. */
function exhibitIdFromKey(key: string): number | undefined {
  const m = /^exhibit_(\d+)$/.exec(key);
  return m ? Number(m[1]) : undefined;
}

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface AudioState {
  /** Уникальный ключ источника, обычно message.id или `exhibit_${id}`. */
  currentKey: string | null;
  status: AudioStatus;
  /** Внутреннее: HTMLAudioElement и кеш URL по ключу. */
  _audio: HTMLAudioElement | null;
  _cache: Map<string, string>;

  /** Запустить/поставить на паузу. Если ключ другой — заменяет текущее. */
  toggle: (key: string, text: string) => Promise<void>;
  /** Жёстко остановить и сбросить. */
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentKey: null,
  status: "idle",
  _audio: null,
  _cache: new Map(),

  async toggle(key, text) {
    const state = get();

    // Тот же источник — toggle play/pause
    if (state.currentKey === key && state._audio) {
      if (state.status === "playing") {
        state._audio.pause();
        set({ status: "paused" });
      } else if (state.status === "paused") {
        try {
          await state._audio.play();
          set({ status: "playing" });
        } catch {
          set({ status: "error" });
        }
      }
      return;
    }

    // Другой источник — остановить текущий, начать новый
    if (state._audio) {
      state._audio.pause();
      state._audio.currentTime = 0;
    }

    set({ currentKey: key, status: "loading", _audio: null });

    try {
      let url = state._cache.get(key);
      if (!url) {
        const res = await synthesizeSpeech({ text });
        url = res.audioUrl;
        state._cache.set(key, url);
      }

      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        if (get().currentKey === key) set({ status: "idle", currentKey: null, _audio: null });
      });
      audio.addEventListener("error", () => {
        if (get().currentKey === key) set({ status: "error" });
      });

      await audio.play();
      // Проверка что за время загрузки пользователь не сменил источник
      if (get().currentKey === key) {
        set({ _audio: audio, status: "playing" });
        // Считаем только реально начавшееся воспроизведение нового источника:
        // возобновление с паузы выше по функции сюда не доходит.
        track({ type: "audio_play", exhibitId: exhibitIdFromKey(key) });
      } else {
        audio.pause();
      }
    } catch {
      if (get().currentKey === key) set({ status: "error" });
    }
  },

  stop() {
    const state = get();
    if (state._audio) {
      state._audio.pause();
      state._audio.currentTime = 0;
    }
    set({ currentKey: null, status: "idle", _audio: null });
  },
}));
