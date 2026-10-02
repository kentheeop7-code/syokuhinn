import type { Metadata } from "next";
import "./globals.css";
import QuoteBackground from "./QuoteBackground";

export const metadata: Metadata = {
  title: "専属の栄養士 | LIFEGYM",
  description: "食品のPFC・ビタミン・ミネラル・塩分がわかり、目標に近づく食事を記録できるアプリ",
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
