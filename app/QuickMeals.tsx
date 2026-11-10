"use client";

import { useEffect, useState } from "react";
import MealPicker from "./MealPicker";
import { goalOf, r10, today, totals, buildVals, type St } from "../lib/meals";
import { readMe } from "./me";
import { swapsFor } from "../lib/swaps";
import { microStatus } from "../lib/micro";
import { Pie, Radar } from "./Charts";
import NutrientBars, { stateOf, type NRow } from "./NutrientBars";

// かんたん入力（ホーム）：朝・昼・夜・おやつを、タップで選ぶだけ。合計が、1日の食事（推定カロリー）になる。
const KEY = "lg-qm2";
const EMPTY = (): St => ({ date: today(), size: {}, ext: {} });

export default function QuickMeals() {
  const [st, setSt] = useState<St>(EMPTY());
  const [prev, setPrev] = useState<St | null>(null);
  const [kcal, setKcal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object" && s.size) {
        if (s.date === today()) setSt({ date: s.date, size: s.size, ext: s.ext || {} });
        else if (Object.keys(s.size).length) setPrev({ date: s.date, size: s.size, ext: s.ext || {} });
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        const x = JSON.parse(localStorage.getItem("lg-status") || "null");
        setKcal(x && x.touched ? x.kcal : 0);
      } catch {}
    };
    read();
    window.addEventListener("lg-status-change", read);
    return () => window.removeEventListener("lg-status-change", read);
  }, []);

  const save = (n: St) => {
    setSt(n);
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {}
    window.dispatchEvent(new CustomEvent("lg-meals", { detail: buildVals(n) }));
  };
  if (!loaded) return null;
  const tot = totals(st);
  const me = readMe();
  const sk = me.sex === 2 ? "m" : "f";
  const g = goalOf(sk, me.band);
  const swaps = swapsFor(st).slice(0, 4);
  const ms = tot.any ? microStatus(st, sk, me.band) : null;
  const nrows: NRow[] = tot.any
    ? [
        { label: "たんぱく質", unit: "g", plan: Math.round(tot.p), goal: parseFloat(g.p || "0"), kind: "min" },
        { label: "食物繊維", unit: "g", plan: Math.round(tot.fi * 10) / 10, goal: parseFloat(g.fi || "0"), kind: "min" },
        { label: "食塩", unit: "g", plan: Math.round(tot.salt * 10) / 10, goal: g.salt, kind: "max" },
        ...(ms?.rows ?? []).filter((r) => r.goal > 0).map((r) => ({ label: r.label, unit: r.unit, plan: Math.round(r.value * 10) / 10, goal: r.goal, kind: "min" as const })),
      ]
    : [];
  const okN = nrows.filter((r) => stateOf(r, r.plan) === "ok").length;
  const radar = (ms?.rows ?? []).filter((r) => r.goal > 0 && ["ca", "fe", "va", "vc", "b1", "b2", "mg", "zn"].includes(r.key)).map((r) => ({ label: r.label.replace("ビタミン", "V"), plan: r.pct }));
  if (tot.any && parseFloat(g.p || "0") > 0) radar.unshift({ label: "たんぱく質", plan: tot.p / parseFloat(g.p || "1") });
  const has = Object.keys(st.size).length > 0 || Object.keys(st.ext).length > 0;
  return (
    <section className="card qm" aria-label="かんたん入力">
      <p className="balh">🍽 今日の食事を、タップで選ぶ</p>
      <p className="agnote">朝・昼・夜・おやつを選ぶと、上の推定カロリーに、すぐ反映されます。量も、足したものも、直せます。</p>
      {prev && !has && (
        <button type="button" className="btn ghost qmprev" onClick={() => save({ date: today(), size: prev.size, ext: prev.ext })}>
          前回の内容を、今日にコピーする
        </button>
      )}
      <MealPicker value={st} onChange={save} />
      <p className="qmsum">
        {kcal > 0 ? (
          <>
            いまの合計：約<b>{r10(kcal).toLocaleString()}</b>kcal / 日
          </>
        ) : (
          "選ぶと、合計が出ます"
        )}
        {has && (
          <button type="button" className="btn ghost" onClick={() => save(EMPTY())}>
            選びなおす
          </button>
        )}
      </p>
      {tot.any && (
        <ul className="qmtot" aria-label="1日の合計の内訳">
          <li>
            <small>たんぱく質</small>
            <b>{Math.round(tot.p)}g</b>
            <em>目安 {g.p}</em>
          </li>
          <li>
            <small>脂質</small>
            <b>{Math.round(tot.f)}g</b>
          </li>
          <li>
            <small>炭水化物</small>
            <b>{Math.round(tot.c)}g</b>
          </li>
          <li>
            <small>食物繊維</small>
            <b>{Math.round(tot.fi * 10) / 10}g</b>
            <em>目安 {g.fi}</em>
          </li>
          <li className={tot.salt > g.salt ? "over" : ""}>
            <small>食塩</small>
            <b>{Math.round(tot.salt * 10) / 10}g</b>
            <em>目標 {g.salt}g未満</em>
          </li>
        </ul>
      )}
      {tot.any && (
        <>
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
          <details className="qmdet">
            <summary>
              くわしい栄養のチェック（ビタミン・ミネラル）　目安を満たした数 {okN}/{nrows.length}
            </summary>
            <NutrientBars rows={nrows} hasCur={false} />
            <p className="agnote small">重さの決められる食品（ごはん・肉・魚・卵・野菜・乳製品など）だけで計算しています。外食・お菓子・汁物の分は含まないため、実際より少なめに出ます。目安は食事摂取基準（2025年版）。</p>
          </details>
        </>
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
      <p className="agnote small">量は目安です。ごはんの杯数や野菜の量を、細かく直したいときは、下の「くわしく直す」へ。</p>
    </section>
  );
}