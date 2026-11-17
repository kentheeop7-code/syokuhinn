"use client";

// ホームの上に、ずっと出る、ジャンプメニュー（やりたいことへ、1タップで行ける）
const ITEMS = [
  { href: "#start", t: "① 基本情報" },
  { href: "#plan", t: "③ 目安" },
  { href: "#qm", t: "④ 今の食事" },
  { href: "#food", t: "⑥ 栄養→食品" },
  { href: "#trend", t: "⑦ 体重" },
  { href: "#shareall", t: "⑧ 共有" },
];

export default function HomeNav() {
  return (
    <nav className="homenav" aria-label="ホームの目次">
      {ITEMS.map((i) => (
        <a key={i.href} href={i.href}>
          {i.t}
        </a>
      ))}
    </nav>
  );
}
