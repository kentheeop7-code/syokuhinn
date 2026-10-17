"use client";

import { useEffect, useState, type ReactNode } from "react";

// カードの「くわしい中身」を、タップで開閉する。見出しと要点だけが、先に見える。
// #id のリンクで来たときは、開いた状態にする。
export default function Disclosure({
  id,
  head,
  label = "くわしく見る",
  children,
}: {
  id?: string;
  head: ReactNode;
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const go = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === id) {
        setOpen(true);
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 120);
      }
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [id]);

  return (
    <div className={open ? "disc open" : "disc"}>
      {head}
      <button type="button" className="disc-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "閉じる ▲" : `${label} ▼`}
      </button>
      <div className="disc-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
