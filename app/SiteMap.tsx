import Link from "next/link";
import { FOODS } from "../lib/foods";

// ホームのメニュー：やりたいことを選ぶ。くわしい内容は、それぞれ別のページにあります。
type Tile = { href: string; icon: string; name: string; desc?: string; here?: boolean };

const MAIN: Tile[] = [
  { href: "#bal", icon: "🥗", name: "食事を細かく入力", desc: "結果・栄養チェック", here: true },
  { href: "#cause", icon: "🔍", name: "悩みの原因を知る", desc: "疲れ・便秘・体重など", here: true },
  { href: "/?tab=plan", icon: "⚖️", name: "体重と目標", desc: "到達時期・カロリー" },
  { href: "/nutrients#diet-nutrients", icon: "🧪", name: "必要な栄養素", desc: "食物繊維・たんぱく質…" },
];

const OTHER: Tile[] = [
  { href: "/?tab=search", icon: "🔎", name: `食品をしらべる（${FOODS.length}品）` },
  { href: "/?tab=products", icon: "🛒", name: "商品をさがす" },
  { href: "/nutrients", icon: "📖", name: "栄養素ガイド" },
  { href: "/gut", icon: "🌿", name: "腸内環境ガイド" },
  { href: "/additives", icon: "🏷️", name: "食品表示・添加物" },
  { href: "/tips", icon: "💡", name: "豆知識" },
  { href: "/?tab=women", icon: "🌸", name: "からだのケア（女性）" },
  { href: "/nutrients#h-guide", icon: "🏛", name: "国の指針の目安" },
];

function T({ t, big }: { t: Tile; big?: boolean }) {
  const inner = (
    <>
      <span className="smi" aria-hidden>
        {t.icon}
      </span>
      <span className="smt">
        <b>{t.name}</b>
        {big && t.desc && <small>{t.desc}</small>}
      </span>
    </>
  );
  return t.here ? <a href={t.href}>{inner}</a> : <Link href={t.href}>{inner}</Link>;
}

export default function SiteMap() {
  return (
    <section className="sitemap menu" id="sitemap" aria-label="メニュー">
      <p className="balh">やりたいこと</p>
      <ul className="smmain">
        {MAIN.map((t) => (
          <li key={t.href}>
            <T t={t} big />
          </li>
        ))}
      </ul>
      <p className="balh">ほかのページ</p>
      <ul className="smother">
        {OTHER.map((t) => (
          <li key={t.href}>
            <T t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
