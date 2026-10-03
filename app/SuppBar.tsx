"use client";

import { useEffect, useRef, useState } from "react";
import { SUPPS, SUPP_UPDATED } from "./supplementsData";

const INTERVAL_MS = 6000;

// ヘッダーの下で、サプリの相場・種類・効果が横にスライドして流れる（スワイプ・矢印でも操作できる）
export default function SuppBar() {
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);

  const goto = (n: number) => {
    const el = track.current;
    if (!el) return;
    const k = (n + SUPPS.length) % SUPPS.length;
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
    setI(k);
  };

  useEffect(() => {
    if (hold || open) return;
    const id = setInterval(() => goto(i + 1), INTERVAL_MS);
    return () => clearInterval(id);
  });

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const k = Math.round(el.scrollLeft / el.clientWidth);
    if (k !== i && k >= 0 && k < SUPPS.length) setI(k);
  };

  return (
    <div
      className={open ? "supp open" : "supp"}
      onTouchStart={() => setHold(true)}
      onTouchEnd={() => setTimeout(() => setHold(false), 4000)}
    >
      <span className="supp-label">💰 最新のサプリメント値段（日本・2026年10月）</span>
      <button className="supp-arrow" aria-label="前のサプリ" onClick={() => goto(i - 1)}>
        ‹
      </button>
      <div className="supp-track" ref={track} onScroll={onScroll}>
        {SUPPS.map((s) => (
          <div key={s.id} className="supp-slide">
            <button className="supp-card" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              <span className="supp-top">
                <span aria-hidden>{s.icon}</span>
                <b>{s.name}</b>
                <em>{s.kind}</em>
              </span>
              <span className="supp-price">{s.price}</span>
              <span className="supp-effect">{s.effect}</span>
              {open && (
                <span className="supp-more">
                  <span>目安：{s.unit}</span>
                  <span>ポイント：{s.tip}</span>
                  <span className="supp-date">日本の相場・{SUPP_UPDATED}。価格は店やセールで変わります。</span>
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
      <button className="supp-arrow" aria-label="次のサプリ" onClick={() => goto(i + 1)}>
        ›
      </button>
      <span className="supp-count">
        {i + 1}/{SUPPS.length}
      </span>
    </div>
  );
}

