"use client";

import { useState } from "react";

// サーバーなしで、体重などの記録を別の端末（スマホ⇔パソコン）へ引き継ぐ「引き継ぎコード」
const PREFIX = "LGSYNC1:";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const read = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch {
    return null;
  }
};

const encode = (s: string) => PREFIX + btoa(unescape(encodeURIComponent(s)));
const decode = (code: string) => {
  const t = code.trim();
  if (!t.startsWith(PREFIX)) throw new Error("prefix");
  return decodeURIComponent(escape(atob(t.slice(PREFIX.length))));
};

export default function SyncCard() {
  const [withMeals, setWithMeals] = useState(true);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const build = () => {
    const payload: Record<string, unknown> = { v: 1, weight: read("lg-weight") ?? {} };
    if (withMeals) {
      payload.log = read("lg-log") ?? {};
      payload.goal = read("lg-goal");
      payload.profile = read("lg-profile");
    }
    return encode(JSON.stringify(payload));
  };

  const share = async () => {
    const text = build();
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "LIFEGYM 引き継ぎコード", text });
        setMsg("共有しました。受け取った端末で、コードを貼り付けて取り込んでください。");
        return;
      }
    } catch {
      /* 共有をやめた場合は、コピーに切り替える */
    }
    try {
      await navigator.clipboard.writeText(text);
      setMsg("コードをコピーしました。もう一方の端末で貼り付けて、取り込んでください。");
    } catch {
      setCode(text);
      setMsg("下の欄のコードを、全部コピーしてください。");
    }
  };

  const importCode = () => {
    try {
      const data = JSON.parse(decode(code));
      if (!data || data.v !== 1 || typeof data.weight !== "object") throw new Error("shape");

      const w: Record<string, number> = { ...(read("lg-weight") ?? {}) };
      let nW = 0;
      for (const [k, v] of Object.entries(data.weight as Record<string, unknown>)) {
        if (DATE_RE.test(k) && typeof v === "number" && v >= 20 && v <= 300) {
          w[k] = v;
          nW++;
        }
      }
      localStorage.setItem("lg-weight", JSON.stringify(w));

      let nL = 0;
      if (data.log && typeof data.log === "object") {
        const log: Record<string, unknown> = { ...(read("lg-log") ?? {}) };
        for (const [k, v] of Object.entries(data.log as Record<string, unknown>)) {
          if (DATE_RE.test(k) && Array.isArray(v)) {
            log[k] = v;
            nL++;
          }
        }
        localStorage.setItem("lg-log", JSON.stringify(log));
      }
      if (data.goal && typeof data.goal === "object") localStorage.setItem("lg-goal", JSON.stringify(data.goal));
      if (data.profile && typeof data.profile === "object")
        localStorage.setItem("lg-profile", JSON.stringify(data.profile));

      setMsg(`取り込みました（体重 ${nW}日分、食事 ${nL}日分）。画面を更新します…`);
      setTimeout(() => location.reload(), 900);
    } catch {
      setMsg("コードを読み取れませんでした。「LGSYNC1:」から最後まで、全部貼り付けているか確認してください。");
    }
  };

  return (
    <details className="sync">
      <summary>📲 スマホ・パソコンで記録を共有する</summary>
      <p className="syncnote">
        記録はこの端末のブラウザにだけ保存されています。「引き継ぎコード」を作って、もう一方の端末に貼り付けると、同じ記録が見られます。
      </p>

      <label className="synccheck">
        <input type="checkbox" checked={withMeals} onChange={(e) => setWithMeals(e.target.checked)} />
        食事の記録・目標もいっしょに共有する
      </label>
      <button className="btn" onClick={share}>
        ① 引き継ぎコードを作って共有
      </button>

      <p className="syncstep">② もう一方の端末で、このページを開き、コードを貼り付けます</p>
      <textarea
        className="synctext"
        rows={3}
        placeholder="LGSYNC1:…"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="引き継ぎコード"
      />
      <button className="btn ghost" onClick={importCode} disabled={!code.trim()}>
        取り込む
      </button>

      {msg && <p className="syncmsg">{msg}</p>}
      <p className="syncnote small">
        ※ 同じ日付の記録は、取り込んだ内容で上書きされます。コードには体重などの個人の記録が入っているので、他の人に見せないでください。自動で同期する機能ではありません。
      </p>
    </details>
  );
}
