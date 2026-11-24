"use client";

import { useState } from "react";
import { TIPS, getTip, tipText } from "../lib/knowledge";
import TipView from "./TipView";
import ShareButtons from "./ShareButtons";
import PdfButton from "./PdfButton";
import Link from "next/link";

// トレーナー資料集：お客様に送れる、豆知識（食物繊維・腸内細菌・睡眠・ダイエット方法 など）。
// 読む・文面をコピー・PDFにする。定期フォローでは、自動で選んで、資料に組み込める。
export default function TipsTab() {
  const [id, setId] = useState(TIPS[0].id);
  const t = getTip(id) ?? TIPS[0];
  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>
        お客様に送れる、豆知識です。論文の数字は、PubMedの要旨で確認したものだけで、分かっていないことも、分けて書いています。
        <b>定期フォロー資料では、状況から、自動で選んで、そのまま、資料に組み込めます</b>（<Link href="/trainer/followup">定期フォローを開く</Link>）。
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TIPS.map((x) => (
          <button key={x.id} type="button" className={id === x.id ? "trchip on" : "trchip"} aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            {x.icon} {x.name.replace(/（.*$/, "")}
          </button>
        ))}
      </div>
      <div id="tipstab" style={{ margin: "10px 0" }}>
        <PdfButton target="#tipstab" title={`豆知識：${t.name}`} base="lifegym-tip" />
        <h3 style={{ margin: "6px 0" }}>{t.icon} {t.name}</h3>
        <TipView id={t.id} />
      </div>
      <p style={{ margin: "8px 0 4px" }}>LINE・メールに、貼る文面：</p>
      <ShareButtons text={tipText(t.id)} label="この豆知識の文面" />
    </section>
  );
}
