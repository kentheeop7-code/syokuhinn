import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import QuoteBackground from "./QuoteBackground";
import TopNav from "./TopNav";
import BottomBar from "./BottomBar";

export const metadata: Metadata = {
  title: "専属の栄養士（女性向け） | LIFEGYM",
  description: "月経周期・骨・更年期など、女性のからだに寄りそう栄養アプリ。PFC・鉄・カルシウム・葉酸まで、食事を記録して整えられます",
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
        <Suspense fallback={null}>
          <BottomBar />
        </Suspense>
      </body>
    </html>
  );
}


