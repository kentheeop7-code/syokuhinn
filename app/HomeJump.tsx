// ホームの、ページ内ジャンプ（長いページを、1タップで行き来できる）
const JUMPS = [
  { href: "#bal", icon: "🥗", label: "今の食事" },
  { href: "#cause", icon: "🔍", label: "原因を知る" },
  { href: "#h-nutr", icon: "🧪", label: "必要な栄養素" },
  { href: "#r-weight", icon: "⚖️", label: "体重の予測" },
  { href: "#r-goal", icon: "🎯", label: "目標を入れる" },
];

export default function HomeJump() {
  return (
    <nav className="homejump" aria-label="このページの目次">
      {JUMPS.map((j) => (
        <a key={j.href} href={j.href}>
          <span aria-hidden>{j.icon}</span>
          {j.label}
        </a>
      ))}
    </nav>
  );
}
