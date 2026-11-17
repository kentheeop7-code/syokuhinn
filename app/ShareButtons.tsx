"use client";

import { useState } from "react";
import { lineUrl } from "./LineShare";

// 文章を、コピー／公式LINEで送る／端末の共有（LINE・メールなど）で、共有する。
export default function ShareButtons({ text, label = "この内容" }: { text: string; label?: string }) {
  const [done, setDone] = useState("");
  const flash = (k: string) => {
    setDone(k);
    setTimeout(() => setDone(""), 1800);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash("copy");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        flash("copy");
      } catch {}
      ta.remove();
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const share = async () => {
    try {
      await navigator.share({ text });
    } catch {}
  };
  return (
    <div className="sharebtns">
      <button type="button" className="main" onClick={copy}>
        {done === "copy" ? "✓ コピーしました" : `📋 ${label}をコピー`}
      </button>
      <a href={lineUrl(text)} target="_blank" rel="noopener noreferrer">
        公式LINEで送る
      </a>
      {canShare && (
        <button type="button" onClick={share}>
          📤 ほかのアプリで共有
        </button>
      )}
    </div>
  );
}
