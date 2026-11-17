import type { Metadata } from "next";
import FollowUpApp from "../../FollowUpApp";
import TrainerNav from "../../TrainerNav";

export const metadata: Metadata = {
  title: "トレーナー用 定期フォロー資料",
  description: "経過報告・調整プラン・プログラム表・対策表をまとめ、PDFでお客様に共有します。",
  robots: { index: false, follow: false },
};

export default function FollowUp() {
  return (
    <main className="container">
      <h1 className="title sm">定期フォロー資料（トレーナー専用）</h1>
      <TrainerNav />
      <FollowUpApp />
    </main>
  );
}
