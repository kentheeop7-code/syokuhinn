"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ITEMS = [
  { href: "/", key: "record", icon: "📝", label: "記録" },
  { href: "/?tab=search", key: "search", icon: "🔍", label: "食品" },
  { href: "/tips", key: "tips", icon: "💡", label: "豆知識" },
  { href: "/nutrients", key: "guide", icon: "📖", label: "ガイド" },
];

// 画面の下に固定されるタブバー。親指で押しやすく、押すと沈んで、スマホは短く振動する
export default function BottomBar() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");

  const active = (key: string) => {
    if (path === "/") return key === (tab === "search" ? "search" : "record");
    if (path.startsWith("/tips")) return key === "tips";
    if (path.startsWith("/nutrients")) return key === "guide";
    return false;
  };

  const buzz = () => {
    try {
      if (typeof navigator.vibrate === "function") navigator.vibrate(12);
    } catch {
      /* 振動に対応していない端末では何もしない */
    }
  };

  return (
    <nav className="bbar" aria-label="下のメニュー">
      {ITEMS.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={active(it.key) ? "bb-item on" : "bb-item"}
          aria-current={active(it.key) ? "page" : undefined}
          onPointerDown={buzz}
          onClick={() => {
            if (active(it.key)) window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="bb-ico" aria-hidden>
            {it.icon}
          </span>
          <b>{it.label}</b>
        </Link>
      ))}
    </nav>
  );
}
