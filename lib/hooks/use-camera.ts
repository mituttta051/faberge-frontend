"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraError = "permission_denied" | "no_device" | "unsupported" | "unknown";

interface UseCameraOptions {
  /** Стороной какой камеры запрашивать (по умолчанию rear). */
  facingMode?: "environment" | "user";
  /**
   * Включать камеру самим, как только известно, что разрешение уже выдано.
   * Спрашивать доступ без действия посетителя мы не будем в любом случае.
   */
  autoStart?: boolean;
}

/**
 * Отметка «этот браузер уже давал доступ к камере».
 *
 * Safari не поддерживает `navigator.permissions.query({name: 'camera'})`, а
 * заказчик жаловался, что система спрашивает разрешение при каждом заходе на
 * сканер (баг-репорт 06.08.2026). Собственный флаг позволяет на повторных
 * заходах включать камеру сразу: если браузер решение запомнил — запроса не
 * будет, а если забыл — мы окажемся ровно там же, где и раньше.
 */
const GRANTED_KEY = "museum_camera_granted";

function rememberGranted(): void {
  try {
    window.localStorage.setItem(GRANTED_KEY, "1");
  } catch {
    // Приватный режим запретил storage — просто спросим ещё раз.
  }
}

function wasGrantedBefore(): boolean {
  try {
    return window.localStorage.getItem(GRANTED_KEY) === "1";
  } catch {
    return false;
  }
}

function forgetGranted(): void {
  try {
    window.localStorage.removeItem(GRANTED_KEY);
  } catch {
    // см. выше
  }
}

export function useCamera({ facingMode = "environment", autoStart = true }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  /** true — камера ещё не запрашивалась и ждёт явного действия посетителя. */
  const [awaitingConsent, setAwaitingConsent] = useState(true);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  const start = useCallback(async () => {
    setAwaitingConsent(false);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      rememberGranted();
      setReady(true);
      setError(null);
    } catch (err) {
      const name = (err as DOMException)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        // Доступ отозвали — прошлая отметка врёт, иначе мы будем биться в отказ
        // при каждом заходе.
        forgetGranted();
        setError("permission_denied");
      } else if (name === "NotFoundError") setError("no_device");
      else setError("unknown");
      setReady(false);
    }
  }, [facingMode]);

  /** Делает снимок текущего кадра, возвращает Blob (jpeg). */
  const capture = useCallback(async (quality = 0.9): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
    );
  }, []);

  /*
   * Сами включаем камеру только там, где системного запроса заведомо не будет:
   * Permissions API говорит `granted`, либо этот браузер уже давал доступ.
   * В остальных случаях ждём нажатия — тогда запрос выглядит ответом на
   * действие посетителя, а не всплывает сам при открытии экрана.
   */
  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;

    const decide = async () => {
      if (wasGrantedBefore()) return true;
      try {
        const status = await navigator.permissions?.query({
          name: "camera" as PermissionName,
        });
        return status?.state === "granted";
      } catch {
        // Safari не умеет query для камеры — решаем по своей отметке выше.
        return false;
      }
    };

    void decide().then((mayStart) => {
      if (cancelled || !mayStart) return;
      void start();
    });

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, ready, error, awaitingConsent, start, stop, capture };
}
