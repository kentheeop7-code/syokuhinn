import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import QuoteBackground from "./QuoteBackground";
import TopNav from "./TopNav";

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
        <Suspense fallback={null}>
          <TopNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
