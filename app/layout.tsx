import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-гид Музея Фаберже",
  description:
    "Интерактивный гид по экспозиции Музея Фаберже с распознаванием экспонатов и AI-помощником.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="bg-background text-foreground flex min-h-full flex-col">{children}</body>
    </html>
  );
}
