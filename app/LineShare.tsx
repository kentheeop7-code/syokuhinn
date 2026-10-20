"use client";

import { useState } from "react";
import { BANDS, PAL_TEXT, readMe } from "./me";

// 公式LINEのID（例："@123abcde"）。入れると、公式アカウントのトークに、直接つながる。
// 空のままなら、LINEの「送り先を選ぶ画面」が開く。
export const LINE_OA_ID: string = process.env.NEXT_PUBLIC_LINE_OA_ID ?? "";

export function lineUrl(text: string): string {
  const q = encodeURIComponent(text);
  return LINE_OA_ID ? `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${q}` : `https://line.me/R/msg/text/?${q}`;
}

// 結果を、公式LINEに送る（共通のボタン）。buildは、送る文章（本文）をつくる関数。
export default function LineShare({ title, build }: { title: string; build: () => string }) {
  const [nick, setNick] = useState("");
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const message = () => {
    const me = readMe();
    const d = new Date();
    const head = [`【LIFEGYM ${title}】`, `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日${nick.trim() ? `　${nick.trim()}さん` : ""}`, `■ ${me.sex === 2 ? "男性" : "女性"}・${BANDS[me.band]}・活動量${PAL_TEXT[me.pal]}`, ""];
    return head.join("\n") + build() + "\n\n※ ざっくり計算した目安です。";
  };
  const isYouth = readMe().band <= 1;

  const send = () => window.open(lineUrl(message()), "_blank", "noopener");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setShow(true);
    }
  };

  return (
    <div className="linebox">
      <p className="balh">📨 この結果を、公式LINEに送る</p>
      <label className="linenick">
        <span>お名前（あれば）</span>
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="例：さくら" maxLength={20} aria-label="お名前（任意）" />
      </label>
      <button type="button" className="linebtn" onClick={send}>
        <span aria-hidden>💬</span> LINEで送る
      </button>
      <div className="linesub">
        <button type="button" className="btn ghost" onClick={copy}>
          {copied ? "✓ コピーしました" : "文章をコピー"}
        </button>
        <button type="button" className="btn ghost" onClick={() => setShow((v) => !v)}>
          {show ? "送る内容を閉じる" : "送る内容を見る"}
        </button>
      </div>
      {show && <textarea className="linetext" readOnly value={message()} rows={10} aria-label="LINEに送る文章" onFocus={(e) => e.currentTarget.select()} />}
      {isYouth && <p className="agnote">中学生・高校生は、保護者の方と一緒に、内容を確認してから送りましょう。</p>}
      <p className="agnote small">※ お名前は、送る文章にだけ入ります（保存されません）。診断ではなく、ざっくりした目安です。</p>
    </div>
  );
}
