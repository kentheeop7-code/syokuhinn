"use client";

import { useEffect, useState } from "react";

// 長いページで、ワンタップで先頭にもどるボタン
export default function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > 700);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  if (!show) return null;
  return (
    <button type="button" className="totop" aria-label="ページの先頭にもどる" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      ↑
    </button>
  );
}
