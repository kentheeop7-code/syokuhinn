import type { Metadata } from "next";
import ReportView from "../../ReportView";

export const metadata: Metadata = {
  title: "お客様用のまとめ（PDF）",
  description: "お客様に渡す、食事・トレーニングのまとめ。PDFとして保存して、公式LINEで送れます。",
  robots: { index: false },
};

export default function Report() {
  return (
    <main className="container">
      <ReportView />
    </main>
  );
}