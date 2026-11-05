"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

// 欄がたくさんあるページで、最初は上のいくつかだけを見せて、「ほかの項目」で残りを出す。
// 目次（#id）から、隠れている欄へ行こうとしたときは、自動で全部を出す。
export default function MoreFolds({ limit = 6, children }: { limit?: number; children: ReactNode }) {
  const items = Children.toArray(children);
  const [all, setAll] = useState(false);

  useEffect(() => {
    const go = () => {
      if (window.location.hash.length > 1) setAll(true);
    };
    go();
    window.addEventListener("hashchange", go);
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("a[href^='#']")) setAll(true);
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", go);
      document.removeEventListener("click", click);
    };
  }, []);

  const shown = all ? items : items.slice(0, limit);
  return (
    <>
      {shown}
      {!all && items.length > limit && (
        <button type="button" className="morebtn" onClick={() => setAll(true)}>
          ほかの項目を見る（あと{items.length - limit}件）
        </button>
      )}
    </>
  );
}
