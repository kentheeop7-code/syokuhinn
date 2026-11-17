"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// トレーナー専用ページ共通の、上のメニュー（どのページからでも、ほかのページへ行ける）
export const TRAINER_LINKS = [
  { href: "/trainer/hub", icon: "🏠", t: "ハブ", d: "トレーナー用の入口（すべてのリンク）" },
  { href: "/trainer", icon: "📝", t: "指導メモ", d: "ダイエット開始時の総合まとめを作る" },
  { href: "/trainer/followup", icon: "🔄", t: "定期フォロー", d: "経過報告・プログラム表・対策表をPDFで送る" },
  { href: "/trainer/guide", icon: "📚", t: "資料集", d: "食事法・食品PFC・最新論文・お客様別レコメンド" },
  { href: "/trainer/report", icon: "📄", t: "レポート", d: "開始時のまとめ（PDF・リンク・LINE）" },
];

export default function TrainerNav() {
  const path = usePathname() || "";
  return (
    <nav className="trnav noprint" aria-label="トレーナー用メニュー">
      {TRAINER_LINKS.map((l) => {
        const on = l.href === "/trainer" ? path === "/trainer" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
            <span aria-hidden>{l.icon}</span>
            {l.t}
          </Link>
        );
      })}
    </nav>
  );
}
