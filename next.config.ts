import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `output: "export"` несовместимо с динамическим бэкендом — оно требует
  // перечислить все возможные ID в generateStaticParams, что невозможно для
  // живой БД. Если понадобится статика — генерим параметры из API в билде.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "cdn.example.cloud" },
      { protocol: "https", hostname: "*.cdn.yandexcloud.net" },
      { protocol: "https", hostname: "storage.yandexcloud.net" },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
