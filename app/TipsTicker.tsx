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
  for (let i = 0; i < max; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
})();
export default function TipsTicker() {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);

  useEffect(() => {
    const id = setInterval(() => {
      setI((cur) => {
        setPrev(cur);
        return (cur + 1) % ORDER.length;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const go = (d: number) => {
    setPrev(i);
    setI((i + d + ORDER.length) % ORDER.length);
  };

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
        {ORDER.map((t, n) => (
          <div
            key={t.id}
            className={`tk${n === i ? " on" : n === prev ? " out" : ""}`}
            aria-hidden={n !== i}
          >
            <span className="tkgroup">
              {TIP_GROUPS.find((g) => g.key === t.group)?.label}
            </span>
            <b>{t.title}</b>
            <p>{t.lead}</p>
            <Link href={`/tips#${t.id}`} tabIndex={n === i ? 0 : -1}>
              くわしく読む ›
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
