"use client";

import { useEffect, useState, type ReactNode } from "react";

// 長いページを、タップで開閉できる「見出しの一覧」にする。
// ページ内メニュー（#id）を押すと、その項目が開く。
export default function Fold({
  id,
  title,
  sub,
  defaultOpen = false,
  cls = "",
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  defaultOpen?: boolean;
  cls?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const go = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      const target = document.getElementById(h);
      // この項目そのもの、または、この項目の中にある要素（豆知識など）へのリンクのとき、開く
      if (h === id || (target && document.getElementById(`${id}-body`)?.contains(target))) {
        setOpen(true);
        setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "start" }), 80);
      }
    };
    go();
    window.addEventListener("hashchange", go);
    // すでに同じ場所（#id）にいて、もう一度リンクを押したときも、開く
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (a) setTimeout(go, 30);
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", go);
      document.removeEventListener("click", click);
    };
  }, [id]);

  return (
    <section className={`fold${open ? " open" : ""}${cls ? " " + cls : ""}`}>
      <h2 className="h2 foldh" id={id}>
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)}>
          <span>
            {title}
            {sub && <small>{sub}</small>}
          </span>
          <i aria-hidden>{open ? "閉じる" : "開く"}</i>
        </button>
      </h2>
      <div id={`${id}-body`} className="foldbody" hidden={!open}>
        {children}
      </div>
    </section>
  );
}


