"use client";

import { useEffect, useState } from "react";

// 文字の大きさを、ワンタップで切りかえる（標準 → 大 → 特大）。選んだ大きさは、保存される。
const SIZES = [
  { key: "m", label: "標準", px: 17 },
  { key: "l", label: "大", px: 19 },
  { key: "xl", label: "特大", px: 22 },
];

export default function TextSize() {
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      const k = localStorage.getItem("lg-fs");
      const n = SIZES.findIndex((s) => s.key === k);
      if (n >= 0) setI(n);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${SIZES[i].px}px`;
    try {
      localStorage.setItem("lg-fs", SIZES[i].key);
    } catch {}
  }, [i]);

  return (
    <button type="button" className="textsize" aria-label={`文字の大きさ：${SIZES[i].label}。押すと変わります`} onClick={() => setI((x) => (x + 1) % SIZES.length)}>
      <b>あ</b>
      <span>文字 {SIZES[i].label}</span>
    </button>
  );
}

