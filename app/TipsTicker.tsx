"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TIPS, TIP_GROUPS } from "./tipsData";

const INTERVAL_MS = 7000;

// 3つの分類の豆知識が、順番に交ざって自動で流れる
const ORDER = (() => {
  const groups = TIP_GROUPS.map((g) => TIPS.filter((t) => t.group === g.key));
  const out: typeof TIPS = [];
  const max = Math.max(...groups.map((g) => g.length));
  // 女性向けの豆知識は、1周に2つずつ出す
  for (let i = 0; i < max; i++)
    groups.forEach((g, gi) => {
      if (TIP_GROUPS[gi].key === "women") {
        if (g[2 * i]) out.push(g[2 * i]);
        if (g[2 * i + 1]) out.push(g[2 * i + 1]);
      } else if (g[i]) out.push(g[i]);
    });
  return out;
})();
export default function TipsTicker() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setI((cur) => (cur + 1) % ORDER.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const go = (d: number) => setI((i + d + ORDER.length) % ORDER.length);

  return (
    <section className="ticker" aria-label="豆知識">
      <div className="tickhead">
        <span className="ticktitle">💡 今日の豆知識</span>
        <span className="tickctl">
          <button aria-label="前の豆知識" onClick={() => go(-1)}>
            ‹
          </button>
          <span>
            {i + 1} / {ORDER.length}
          </span>
          <button aria-label="次の豆知識" onClick={() => go(1)}>
            ›
          </button>
        </span>
      </div>
      <div className="tickstage">
        {(() => {
          const t = ORDER[i];
          return (
            <div key={t.id} className="tk on">
              <span className={t.group === "myth" ? "tkgroup myth" : "tkgroup"}>
                {TIP_GROUPS.find((g) => g.key === t.group)?.label}
              </span>
              <b>{t.title}</b>
              {t.myth && <p className="tkmyth">✕ 思い込み：{t.myth}</p>}
              <p>{t.myth ? `◎ 実は… ${t.lead}` : t.lead}</p>
              <Link href={`/tips#${t.id}`}>くわしく読む ›</Link>
            </div>
          );
        })()}
      </div>    </section>
  );
}

