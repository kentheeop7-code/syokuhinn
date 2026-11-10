"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { goalOf, r10, totals, today, type St } from "../lib/meals";
import { microStatus } from "../lib/micro";
import { swapsFor } from "../lib/swaps";
import { Pie, Radar } from "./Charts";
import NutrientBars, { stateOf, type NRow } from "./NutrientBars";
import { readMe } from "./me";

// 他のページでも、ホームで選んだ食事（かんたん入力）の、栄養バランスを見られる。選んでいなければ、ホームへ案内する。
export default function MyNutrition() {
  const [st, setSt] = useState<St | null>(null);
  const [me, setMe] = useState({ sex: 1, band: 3 });
  useEffect(() => {
    const read = () => {
      try {
        const s = JSON.parse(localStorage.getItem("lg-qm2") || "null");
        setSt(s && s.size && Object.keys(s.size).length + Object.keys(s.ext || {}).length > 0 ? { date: s.date || today(), size: s.size, ext: s.ext || {} } : null);
        const m = readMe();
        setMe({ sex: m.sex, band: m.band });
      } catch {}
    };
    read();
    window.addEventListener("lg-status-change", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("lg-status-change", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  if (!st)
    return (
      <div className="mynut">
        <p className="agnote">ホームで、今日の食事を選ぶと、ここに、栄養のバランス（円グラフ・レーダー・ビタミン・ミネラル）が出ます。</p>
        <Link href="/" className="btn ghost">
          ホームで、食事を選ぶ
        </Link>
      </div>
    );
  const sk: "f" | "m" = me.sex === 2 ? "m" : "f";
  const tot = totals(st);
  const g = goalOf(sk, me.band);
  const ms = microStatus(st, sk, me.band);
  const rows: NRow[] = [
    { label: "たんぱく質", unit: "g", plan: Math.round(tot.p), goal: parseFloat(g.p || "0"), kind: "min" },
    { label: "食物繊維", unit: "g", plan: Math.round(tot.fi * 10) / 10, goal: parseFloat(g.fi || "0"), kind: "min" },
    { label: "食塩", unit: "g", plan: Math.round(tot.salt * 10) / 10, goal: g.salt, kind: "max" },
    ...ms.rows.filter((r) => r.goal > 0).map((r) => ({ label: r.label, unit: r.unit, plan: Math.round(r.value * 10) / 10, goal: r.goal, kind: "min" as const })),
  ];
  const okN = rows.filter((r) => stateOf(r, r.plan) === "ok").length;
  const radar = ms.rows.filter((r) => r.goal > 0 && ["ca", "fe", "va", "vc", "b1", "b2", "mg", "zn"].includes(r.key)).map((r) => ({ label: r.label.replace("ビタミン", "V"), plan: r.pct }));
  if (parseFloat(g.p || "0") > 0) radar.unshift({ label: "たんぱく質", plan: tot.p / parseFloat(g.p || "1") });
  const low = ms.rows.filter((r) => r.goal > 0 && r.pct < 0.7).sort((a, b) => a.pct - b.pct).slice(0, 3);
  const swaps = swapsFor(st).slice(0, 4);
  return (
    <div className="mynut">
      <p className="trgoal">
        いまの食事：約<b>{(r10(tot.kcal) + 90).toLocaleString()}</b> kcal／日　栄養チェック <b>{okN}</b>/{rows.length}
      </p>
      <div className="rchartrow">
        <Pie
          size={110}
          title="エネルギーの割合"
          data={[
            { label: "たんぱく質", value: tot.p * 4, color: "#2e9e6a" },
            { label: "脂質", value: tot.f * 9, color: "#e0a030" },
            { label: "炭水化物", value: tot.c * 4, color: "#4a7fd0" },
          ]}
        />
        {radar.length >= 3 && <Radar axes={radar} size={220} />}
      </div>
      <NutrientBars rows={rows} hasCur={false} />
      {low.length > 0 && (
        <div className="rshort">
          <b>足りにくい栄養と、おすすめの食品</b>
          <ul>
            {low.map((r) => (
              <li key={r.key}>
                <b>{r.label}</b>（目安の{Math.round(r.pct * 100)}%）→ {r.foods}
              </li>
            ))}
          </ul>
        </div>
      )}
      {swaps.length > 0 && (
        <div className="qmswap">
          <p className="balh sub">こちらを食べてみませんか？（増やす食事）</p>
          <ul className="trswap">
            {swaps.map((x) => (
              <li key={x.id}>
                <span>
                  <em>いま：{x.from}</em>
                  <b>→ {x.to}</b>
                  <small>{x.why}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="agnote small">ホームで選んだ食事から、計算しています（食べ物の量は「ふつうの1食ぶん」の目安）。重さの決められる食品だけで計算するため、ビタミン・ミネラルは、実際より少なめに出ます。目安は食事摂取基準（2025年版）。</p>
      <Link href="/" className="btn ghost">
        ホームで、食事を直す
      </Link>
    </div>
  );
}