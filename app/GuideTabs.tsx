import Link from "next/link";

const GUIDES = [
  { href: "/nutrients", key: "nutrients", label: "📖 栄養素" },
  { href: "/gut", key: "gut", label: "🌿 腸内環境" },
  { href: "/additives", key: "additives", label: "🏷️ 食品表示" },
];

// ガイドの3ページを、ワンタップで行き来する
export default function GuideTabs({ current }: { current: "nutrients" | "gut" | "additives" }) {
  return (
    <nav className="guidetabs" aria-label="ガイドの切りかえ">
      {GUIDES.map((g) => (
        <Link key={g.key} href={g.href} className={g.key === current ? "on" : undefined} aria-current={g.key === current ? "page" : undefined}>
          {g.label}
        </Link>
      ))}
    </nav>
  );
}
