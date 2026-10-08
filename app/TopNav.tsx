"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SuppBar from "./SuppBar";

const ITEMS = [
  { href: "/", key: "record", icon: "📝", label: "記録" },
  { href: "/?tab=women", key: "women", icon: "🌸", label: "からだ" },
  { href: "/tips", key: "tips", icon: "💡", label: "豆知識" },
  { href: "/nutrients", key: "guide", icon: "📖", label: "ガイド" },
];

// どの画面でも、画面の上に固定されて、右上から行きたい画面へ移れるバー
export default function TopNav() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");

  const active = (key: string) => {
    if (path === "/") return key === (tab === "women" ? "women" : tab === "search" ? "record" : "record");
    if (path.startsWith("/tips")) return key === "tips";
    if (path.startsWith("/nutrients") || path.startsWith("/gut")) return key === "guide";
    return false;
  };

  return (
    <>
    <header className="topnav">
      <div className="topnav-in">
        <Link href="/" className="tn-brand">
          LIFEGYM
        </Link>
        <nav className="tn-items" aria-label="画面の移動">
          {ITEMS.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className={active(it.key) ? "tn-item on" : "tn-item"}
              aria-current={active(it.key) ? "page" : undefined}
            >
              <span aria-hidden>{it.icon}</span>
              <b>{it.label}</b>
            </Link>
          ))}
        </nav>
      </div>
    </header>
    <SuppBar />
    </>
  );
}



