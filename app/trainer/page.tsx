import type { Metadata } from "next";
import TrainerApp from "../TrainerApp";

export const metadata: Metadata = {
  title: "トレーナー用 指導メモ",
  description: "指導の結論・具体策・根拠・実績をまとめ、最後に公式LINEでお客様へ共有します。",
  robots: { index: false, follow: false },
};

export default function Trainer() {
  return (
    <main className="container">
      <h1 className="title sm">トレーナー用</h1>
      <TrainerApp />
    </main>
  );
}