import type { Metadata } from "next";
import Link from "next/link";
import FollowUpApp from "../../FollowUpApp";

export const metadata: Metadata = {
  title: "トレーナー用 定期フォロー資料",
  description: "経過報告・調整プラン・プログラム表・対策表をまとめ、PDFでお客様に共有します。",
  robots: { index: false, follow: false },
};

export default function FollowUp() {
  return (
    <main className="container">
      <h1 className="title sm">定期フォロー資料（トレーナー専用）</h1>
      <p style={{ margin: "0 0 12px" }}>
        <Link href="/trainer">← 指導メモ（開始時の総合まとめ）</Link>
      </p>
      <FollowUpApp />
    </main>
  );
}
