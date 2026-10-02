import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PFC",
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
      <body>{children}</body>
    </html>
  );
}
