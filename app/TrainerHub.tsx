"use client";

import Link from "next/link";
import { useState } from "react";

// トレーナー専用の入口：すべてのトレーナー用ページと、お客様に案内するページへ、ここから行ける。
const FLOW = [
  { n: "1", t: "ダイエット開始時", href: "/trainer", icon: "📝", name: "指導メモ", d: "お客様の情報を入れて、目標カロリー・PFC・食事例・運動・対策を作る。最後にPDF・リンク・LINEで共有。", cta: "指導メモを開く" },
  { n: "1", t: "ダイエット開始時", href: "/trainer/report", icon: "📄", name: "レポート（共有用）", d: "指導メモで作ったお客様向けまとめを、PDF・画像・専用リンク・LINE文章にする。", cta: "レポートを開く" },
  { n: "2", t: "定期的に（2回目以降）", href: "/trainer/followup", icon: "🔄", name: "定期フォロー資料", d: "体重・実績を入れて、判定・原因・調整・プログラム表・対策表・宿題を作り、PDFで送る。", cta: "定期フォローを開く" },
  { n: "3", t: "いつでも（相談したいとき）", href: "/trainer/advisor", icon: "🧭", name: "相談アシスタント", d: "お客様の状態（例：2ヶ月減っていない・筋肉量が落ちた・中学生の指導）を書くと、原因の候補・確認する質問・対策・今後の流れ・他の可能性・根拠を出す。", cta: "相談アシスタントを開く" },
  { n: "3", t: "いつでも（トレーナーの参考）", href: "/trainer/guide", icon: "📚", name: "資料集", d: "お客様別の食事法のレコメンド、食品PFC表と献立づくり、短期プログラム（ファスティング・16時間断食・腸活・短期ダイエット）、停滞・代謝・不調の対処、持病向けの身体づくり、最新論文の自動取得。", cta: "資料集を開く" },
];
const CUSTOMER = [
  { href: "/", t: "ホーム（基本情報→1日の目安→食事の入力→体重の推移→共有）" },
  { href: "/nutrients", t: "栄養素ガイド" },
  { href: "/gut", t: "腸と食事" },
  { href: "/tips", t: "豆知識・コツ" },
  { href: "/additives", t: "食品添加物" },
];
const LINE = "https://lin.ee/WuBfrAq";

export default function TrainerHub() {
  const [copied, setCopied] = useState("");
  const copy = async (path: string) => {
    const url = path.startsWith("http") ? path : `${location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(path);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  };
  return (
    <div className="trhub">
      <p className="trhub-lead">トレーナー専用のページへ、ここから、すべて行けます。お客様の状況に合わせて、使い分けてください。</p>

      <h2>お客様対応の流れ</h2>
      <div className="trhub-cards">
        {FLOW.map((f) => (
          <Link key={f.href} href={f.href} className="trhub-card">
            <span className="trhub-step">{f.n}　{f.t}</span>
            <b>
              <span aria-hidden>{f.icon}</span> {f.name}
            </b>
            <small>{f.d}</small>
            <em>{f.cta} ›</em>
          </Link>
        ))}
      </div>

      <h2>お客様に案内するページ</h2>
      <p className="agnote">お客様が自分で使うページです。リンクをコピーして、LINEなどで送れます。</p>
      <ul className="trhub-list">
        {CUSTOMER.map((c) => (
          <li key={c.href}>
            <Link href={c.href}>{c.t}</Link>
            <button type="button" onClick={() => copy(c.href)}>{copied === c.href ? "✓ コピーしました" : "リンクをコピー"}</button>
          </li>
        ))}
        <li>
          <a href={LINE} target="_blank" rel="noopener noreferrer">公式LINE</a>
          <button type="button" onClick={() => copy(LINE)}>{copied === LINE ? "✓ コピーしました" : "リンクをコピー"}</button>
        </li>
      </ul>

      <h2>トレーナー専用ページのリンク</h2>
      <p className="agnote">トレーナー専用です。お客様には送らないでください。</p>
      <ul className="trhub-list">
        {[
          { href: "/trainer/hub", t: "このハブ（入口）" },
          { href: "/trainer", t: "指導メモ" },
          { href: "/trainer/followup", t: "定期フォロー資料" },
          { href: "/trainer/advisor", t: "相談アシスタント" },
          { href: "/trainer/guide", t: "資料集" },
          { href: "/trainer/report", t: "レポート（共有用）" },
        ].map((c) => (
          <li key={c.href}>
            <Link href={c.href}>{c.t}</Link>
            <button type="button" onClick={() => copy(c.href)}>{copied === c.href ? "✓ コピーしました" : "リンクをコピー"}</button>
          </li>
        ))}
      </ul>

      <div className="trhub-note">
        <b>お客様ごとの専用リンクについて</b>
        <p>指導メモの「リンクをコピー」で作ります。お客様のデータがリンクの中に入るため、お客様ごとに別のリンクを送ってください。</p>
        <p>入力した内容は、このブラウザに保存されます。別のお客様に切り替える前に、PDFにして保存してください。</p>
      </div>
    </div>
  );
}
