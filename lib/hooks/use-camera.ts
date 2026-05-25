"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraError = "permission_denied" | "no_device" | "unsupported" | "unknown";

interface UseCameraOptions {
  /** Стороной какой камеры запрашивать (по умолчанию rear). */
  facingMode?: "environment" | "user";
  /** Автозапуск при mount. По умолчанию true. */
  autoStart?: boolean;
}

export function useCamera({ facingMode = "environment", autoStart = true }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);

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
      setReady(true);
      setError(null);
    } catch (err) {
      const name = (err as DOMException)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") setError("permission_denied");
      else if (name === "NotFoundError") setError("no_device");
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

  useEffect(() => {
    if (autoStart) void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, ready, error, start, stop, capture };
}
