import type { Metadata } from "next";
import GuideApp from "../../GuideApp";
import TrainerNav from "../../TrainerNav";

export const metadata: Metadata = {
  title: "トレーナー向け 資料集",
  description: "お客様ごとの食事プラン・ダイエット方法・PFCバランス・食品データをまとめた、トレーナー専用の資料です。",
  robots: { index: false, follow: false },
};

export default function Guide() {
  return (
    <main className="container">
      <h1 className="title sm">トレーナー向け 資料集</h1>
      <TrainerNav />
      <GuideApp />
    </main>
  );
}
