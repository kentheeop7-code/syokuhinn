import type { Metadata } from "next";
import "./globals.css";
import QuoteBackground from "./QuoteBackground";

export const metadata: Metadata = {
  title: "マッチョ飯ラボ | LIFEGYM",
  description: "写真で食品のPFCがわかる、目標に合う食品も見つかるアプリ",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <QuoteBackground />
        {children}
      </body>
    </html>
  );
}
