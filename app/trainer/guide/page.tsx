import type { Metadata } from "next";
import Link from "next/link";
import GuideApp from "../../GuideApp";

export const metadata: Metadata = {
  title: "トレーナー向け 資料集",
  description: "お客様ごとの食事プラン・ダイエット方法・PFCバランス・食品データをまとめた、トレーナー専用の資料です。",
  robots: { index: false, follow: false },
};

export default function Guide() {
  return (
    <main className="container">
      <h1 className="title sm">トレーナー向け 資料集</h1>
      <p style={{ margin: "0 0 12px" }}>
        <Link href="/trainer">← 指導メモに戻る</Link>
      </p>
      <GuideApp />
    </main>
  );
}
