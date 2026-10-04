"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SUPPS, SUPP_UPDATED } from "./supplementsData";

const INTERVAL_MS = 7000;

// 種類を5つのグループにまとめて、絞り込めるようにする
const GROUPS = [
  { key: "all", label: "すべて", kinds: [] as string[] },
  { key: "protein", label: "プロテイン", kinds: ["プロテイン"] },
  { key: "amino", label: "アミノ酸", kinds: ["アミノ酸", "筋肉サポート"] },
  { key: "perf", label: "運動", kinds: ["パフォーマンス", "エネルギー"] },
  { key: "vm", label: "ビタミン・ミネラル", kinds: ["ビタミン", "ミネラル"] },
  { key: "health", label: "健康・美容", kinds: ["脂肪酸", "美容・関節", "腸活", "リラックス"] },
];

// ヘッダーの下で、サプリの実商品の価格・種類・効果が横にスライドして流れる
export default function SuppBar() {
  const track = useRef<HTMLDivElement>(null);
  const [group, setGroup] = useState("all");
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);

  const list = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    return !g || g.key === "all" ? SUPPS : SUPPS.filter((s) => g.kinds.includes(s.kind));
  }, [group]);

  const goto = (n: number) => {
    const el = track.current;
    if (!el || list.length === 0) return;
    const k = (n + list.length) % list.length;
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
    setI(k);
  };

  const pickGroup = (k: string) => {
    setGroup(k);
    setI(0);
    setOpen(false);
    track.current?.scrollTo({ left: 0 });
  };

  useEffect(() => {
    if (hold || open) return;
    const id = setInterval(() => goto(i + 1), INTERVAL_MS);
    return () => clearInterval(id);
  });

  // 今見えているスライドの高さに合わせる（短いスライドの下に余白が出ないように）
  useEffect(() => {
    const fit = () => {
      const el = track.current;
      const slide = el?.children[i] as HTMLElement | undefined;
      if (el && slide) el.style.height = `${slide.offsetHeight}px`;
    };
    fit();
    const slide = track.current?.children[i] as HTMLElement | undefined;
    const ro = typeof ResizeObserver !== "undefined" && slide ? new ResizeObserver(fit) : null;
    if (ro && slide) ro.observe(slide);
    window.addEventListener("resize", fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [i, open, group]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const k = Math.round(el.scrollLeft / el.clientWidth);
    if (k !== i && k >= 0 && k < list.length) setI(k);
  };

  return (
    <div
      className={open ? "supp open" : "supp"}
      onTouchStart={() => setHold(true)}
      onTouchEnd={() => setTimeout(() => setHold(false), 5000)}
    >
      <div className="supp-head">
        <span className="supp-label">💰 最新のサプリメント値段</span>
        <span className="supp-count">
          {i + 1} / {list.length}
        </span>
      </div>
      <div className="supp-tabs" role="tablist" aria-label="サプリの種類">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            role="tab"
            aria-selected={group === g.key}
            className={group === g.key ? "on" : ""}
            onClick={() => pickGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="supp-body">
        <button className="supp-arrow" aria-label="前のサプリ" onClick={() => goto(i - 1)}>
          ‹
        </button>
        <div className="supp-track" ref={track} onScroll={onScroll}>
          {list.map((s) => (
            <div key={s.id} className="supp-slide">
              <button className="supp-card" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                <span className="supp-ico" aria-hidden>
                  {s.icon}
                </span>
                <span className="supp-main">
                  <span className="supp-name">{s.name}</span>
                  <span className="supp-badges">
                    <em className={s.real ? "real" : ""}>{s.real ? "実商品" : "相場"}</em>
                    <em>{s.kind}</em>
                  </span>
                  <span className="supp-price">{s.price}</span>
                  <span className="supp-unit">{s.unit}</span>
                  <span className="supp-effect">{s.effect}</span>
                  {open && (
                    <span className="supp-more">
                      <span>ポイント：{s.tip}</span>
                      <span className="supp-date">
                        {s.real
                          ? `出典：${s.src}。税込。価格は店やセールで変わります。`
                          : `日本の相場・${SUPP_UPDATED}。商品ごとの価格は店やセールで変わります。`}
                      </span>
                    </span>
                  )}
                  <span className="supp-hint">{open ? "▲ 閉じる" : "▼ 詳しく見る"}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
        <button className="supp-arrow" aria-label="次のサプリ" onClick={() => goto(i + 1)}>
          ›
        </button>
      </div>
    </div>
  );
}
