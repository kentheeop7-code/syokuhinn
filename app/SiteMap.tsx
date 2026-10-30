import Link from "next/link";
import { FOODS } from "../lib/foods";

// アプリ全体の「ページ案内」。どこに何があるかを、行きたい目的から選べる。
const GROUPS: { title: string; items: { href: string; icon: string; name: string; desc: string; here?: boolean }[] }[] = [
  {
    title: "いまの食事を調べる（このページ）",
    items: [
      { href: "#bal", icon: "🥗", name: "今の食事のバランス", desc: "いつもの食事を選ぶだけで分かる", here: true },
      { href: "#cause", icon: "🔍", name: "悩みの原因を知る", desc: "疲れ・便秘・体重など、食事から予測", here: true },
      { href: "#h-nutr", icon: "🧪", name: "ダイエットに必要な栄養素", desc: "食物繊維・たんぱく質・鉄など", here: true },
      { href: "#r-weight", icon: "⚖️", name: "体重の予測", desc: "目標に着く時期と、変われる目安", here: true },
    ],
  },
  {
    title: "食品・商品を探す",
    items: [
      { href: "/?tab=search", icon: "🔎", name: "食品をしらべる", desc: `${FOODS.length}品の栄養を、検索・比較` },
      { href: "/?tab=products", icon: "🛒", name: "商品をさがす", desc: "サプリ・プロテインの価格と選び方" },
    ],
  },
  {
    title: "くわしく学ぶ",
    items: [
      { href: "/nutrients", icon: "📖", name: "栄養素ガイド", desc: "目的別のとり方・栄養素のはたらき" },
      { href: "/gut", icon: "🌿", name: "腸内環境ガイド", desc: "便の状態・食物繊維・7日プラン" },
      { href: "/additives", icon: "🏷️", name: "食品表示・添加物", desc: "表示の読み方・添加物じてん" },
      { href: "/tips", icon: "💡", name: "豆知識", desc: "1つずつ読める、食事のコツ" },
    ],
  },
  {
    title: "からだのケア（女性）",
    items: [{ href: "/?tab=women", icon: "🌸", name: "からだのケア", desc: "月経周期・年代別・骨・更年期・気になること" }],
  },
];

export default function SiteMap() {
  return (
    <section className="card sitemap" id="sitemap" aria-label="ページ案内">
      <h2 className="h2" style={{ marginTop: 0 }}>
        📍 ページ案内
      </h2>
      <p className="agnote">行きたい場所を、タップしてください。画面の下のバーからも、行き来できます。</p>
      {GROUPS.map((g) => (
        <div key={g.title} className="smgroup">
          <p className="balh">{g.title}</p>
          <ul>
            {g.items.map((it) => (
              <li key={it.href}>
                {it.here ? (
                  <a href={it.href}>
                    <span className="smi" aria-hidden>
                      {it.icon}
                    </span>
                    <span className="smt">
                      <b>{it.name}</b>
                      <small>{it.desc}</small>
                    </span>
                    <i aria-hidden>↑</i>
                  </a>
                ) : (
                  <Link href={it.href}>
                    <span className="smi" aria-hidden>
                      {it.icon}
                    </span>
                    <span className="smt">
                      <b>{it.name}</b>
                      <small>{it.desc}</small>
                    </span>
                    <i aria-hidden>›</i>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
