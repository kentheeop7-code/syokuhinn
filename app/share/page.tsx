import type { Metadata } from "next";
import ReportView from "../ReportView";

export const metadata: Metadata = {
  title: "あなたの食事・運動のまとめ | LIFEGYM",
  description: "トレーナーから届いた、あなた専用の、食事・運動のまとめです。",
  robots: { index: false, follow: false },
};

export default function Share() {
  return (
    <main className="container">
      <ReportView mode="client" />
    </main>
  );
}