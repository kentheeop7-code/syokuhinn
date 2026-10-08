"use client";

import { useMemo, useState } from "react";
import { ADDITIVES, type Additive } from "./additivesData";

const LV: Record<Additive["lv"], { label: string; cls: string; note: string }> = {
  ok: { label: "気にしすぎなくてOK", cls: "ok", note: "通常の食事の量なら、心配は小さいもの" },
  mid: { label: "量・頻度に注意", cls: "mid", note: "とりすぎ・偏りに注意したいもの" },
  care: { label: "体質・持病で注意", cls: "care", note: "人によっては、確認が必要なもの" },
};

function Card({ a }: { a: Additive }) {
  const [open, setOpen] = useState(false);
  const l = LV[a.lv];
  return (
    <div className={`adcard ${l.cls}`}>
      <button className="adhead" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="adname">{a.name}</span>
        <em className={`adlv ${l.cls}`}>{l.label}</em>
        <i aria-hidden>{open ? "−" : "＋"}</i>
      </button>
      <p className="adrole">
        <b>用途</b>
        {a.role}
      </p>
      {open && (
        <div className="adbody">
          <p>
            <b>よく入っている食品</b>
            {a.where}
          </p>
          <p>
            <b>知っておきたいこと</b>
            {a.know}
          </p>
          <p>
            <b>とくに気をつけたい人・場面</b>
            {a.who}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 辞典
function Dictionary() {
  const [q, setQ] = useState("");
  const [lv, setLv] = useState<"all" | Additive["lv"]>("all");
  const list = useMemo(() => {
    const s = q.trim();
    return ADDITIVES.filter((a) => (lv === "all" || a.lv === lv) && (!s || a.name.includes(s) || a.keys.some((k) => k.includes(s) || s.includes(k)) || a.role.includes(s) || a.where.includes(s)));
  }, [q, lv]);
  return (
    <div className="adbox">
      <h3>📖 添加物じてん</h3>
      <p className="adnote">名前・用途・食品名で、さがせます（例：乳化剤、甘味料、ハム、ゼリー）。</p>
      <input className="adsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="例：乳化剤 / 増粘 / ソーセージ" aria-label="添加物をさがす" />
      <div className="adtabs" role="tablist">
        {(
          [
            ["all", "すべて"],
            ["ok", "気にしすぎなくてOK"],
            ["mid", "量・頻度に注意"],
            ["care", "体質・持病で注意"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} className={lv === k ? "on" : ""} aria-selected={lv === k} onClick={() => setLv(k)}>
            {t}
          </button>
        ))}
      </div>
      <p className="adcount">{list.length}件</p>
      {list.map((a) => (
        <Card key={a.id} a={a} />
      ))}
      {list.length === 0 && <p className="adnote">見つかりませんでした。別の言葉で、さがしてみてください。</p>}
      <p className="adnote small">
        「気をつけたい度」は、このアプリの目安です（国の安全性評価や、摂取量調査、研究をもとに、日常でとる量を想定しました）。個人の診断ではありません。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- 原材料チェッカー
const SAMPLE = "小麦粉、砂糖、ショートニング、乳等を主要原料とする食品、食塩、卵／乳化剤、膨張剤、香料、酸化防止剤（ビタミンC）、増粘多糖類、調味料（アミノ酸等）、着色料（カロテン）";

function Checker() {
  const [text, setText] = useState("");
  const found = useMemo(() => {
    const t = text.replace(/\s+/g, "");
    if (!t) return [];
    return ADDITIVES.filter((a) => a.keys.some((k) => t.includes(k.replace(/\s+/g, ""))));
  }, [text]);
  const order = { care: 0, mid: 1, ok: 2 } as const;
  const sorted = [...found].sort((a, b) => order[a.lv] - order[b.lv]);
  const cnt = { care: found.filter((a) => a.lv === "care").length, mid: found.filter((a) => a.lv === "mid").length, ok: found.filter((a) => a.lv === "ok").length };
  // 「/」以降が添加物
  const afterSlash = text.includes("／") || text.includes("/") ? text.split(/[／/]/).slice(1).join("／") : "";
  return (
    <div className="adbox">
      <h3>🔍 原材料チェッカー</h3>
      <p className="adnote">
        商品の「原材料名」の欄を、そのまま入れてください。添加物を見つけて、説明を出します。<b>数が多い＝悪い、ではありません。</b>どれが、どんな意味かを、知るためのものです。
      </p>
      <textarea
        className="adtext"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例：小麦粉、砂糖、ショートニング／乳化剤、膨張剤、香料…"
        aria-label="原材料名"
      />
      <div className="adbtns">
        <button className="btn ghost" onClick={() => setText(SAMPLE)}>
          例を入れる
        </button>
        <button className="btn ghost" onClick={() => setText("")}>
          消す
        </button>
      </div>
      {text.trim() && (
        <>
          <p className="adsum">
            見つかった添加物・成分：<b>{found.length}種類</b>
            （体質・持病で注意 {cnt.care}・量や頻度に注意 {cnt.mid}・気にしすぎなくてOK {cnt.ok}）
          </p>
          {afterSlash && <p className="adnote">「／」以降は、添加物の表示です：{afterSlash.slice(0, 120)}</p>}
          {sorted.map((a) => (
            <Card key={a.id} a={a} />
          ))}
          {found.length === 0 && (
            <p className="adresult ok">辞典にある添加物は、見つかりませんでした（原材料がシンプルなようです）。</p>
          )}
          {found.length > 0 && (
            <p className="adresult mid">
              ここに出たのは、辞典にある範囲のものです。「一括名（乳化剤・香料・pH調整剤など）」は、中身が、複数ありえます。アレルギー・持病のある人は、パッケージの注意書きと、医師・薬剤師の指示を優先してください。
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function AdditiveTools() {
  return (
    <>
      <Checker />
      <Dictionary />
    </>
  );
}
