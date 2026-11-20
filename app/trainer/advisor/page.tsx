import type { Metadata } from "next";
import AdvisorApp from "../../AdvisorApp";
import TrainerNav from "../../TrainerNav";

export const metadata: Metadata = {
  title: "トレーナー用 相談アシスタント",
  description: "お客様の状態から、原因・対策・今後の流れ・根拠を出す、トレーナー専用の相談アシスタントです。",
  robots: { index: false, follow: false },
};

export default function Advisor() {
  return (
    <main className="container">
      <h1 className="title sm">相談アシスタント（トレーナー専用）</h1>
      <TrainerNav />
      <AdvisorApp />
    </main>
  );
}
