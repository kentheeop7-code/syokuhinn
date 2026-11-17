"use client";

import { useEffect, useState } from "react";
import { averageIntake, readLog } from "../lib/daylog";
import { NUTS, foodsFor, unitLabel, type NutKey } from "../lib/foodlist";
import { goalOf } from "../lib/meals";
import { readTarget } from "../lib/target";

// 必要な栄養素と、量を入れると、それをとれる食品が、出てくる。
const MAIN: NutKey[] = ["p", "fi", "ca", "fe", "c", "f"];
const num = (s: string) => parseFloat(s) || 0;

export default function NutrientFoods() {
  const [key, setKey] = useState<NutKey>("p");
  const [amt, setAmt] = useState("");
  const [more, setMore] = useState(false);
  const [gap, setGap] = useState<Partial<Record<NutKey, number>>>({});
  const [ready, setReady] = useState(false);
  const nut = NUTS.find((n) => n.key === key)!;
  const value = num(amt) > 0 ? num(amt) : nut.defaults[0];

  useEffect(() => {
    const read = () => {
      const t = readTarget();
      const a = averageIntake(readLog());
      if (!t || !a) return setGap({});
      const gl = goalOf(t.sexKey, t.band);
      const g: Partial<Record<NutKey, number>> = {};
      const dp = Math.round(t.p - a.p);
      if (dp > 5) g.p = dp;
      const gfi = parseFloat(gl.fi || "0");
      const dfi = Math.round((gfi - a.fi) * 10) / 10;
      if (dfi > 1) g.fi = dfi;
      setGap(g);
    };
    read();
    setReady(true);
    const evs = ["lg-days2-change", "lg-profile-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    return () => evs.forEach((e) => window.removeEventListener(e, read));
  }, []);

  if (!ready) return null;
  const rows = foodsFor(key, value);
  const max = Math.max(...rows.map((r) => r.g), 1);
  const pick = (k: NutKey) => {
    setKey(k);
    setAmt(gap[k] ? String(gap[k]) : "");
  };
  const list = more ? NUTS.map((n) => n.key) : MAIN;
  const quick = nut.defaults.concat(nut.key === "p" ? [30, 40] : nut.key === "c" ? [30, 100] : nut.key === "f" ? [5, 20] : []).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <section className="card foodfind" id="food" aria-label="栄養素から、食品をさがす">
      <p className="dch">⑥ 足りない栄養から、食品をさがす</p>
      <p className="agnote">必要な栄養素と、量を入れると、それをとれる食品が出ます。少ない量でとれる食品が、上に出ます。</p>
      <div className="ffchips" role="tablist" aria-label="栄養素">
        {list.map((k) => {
          const n = NUTS.find((x) => x.key === k)!;
          return (
            <button key={k} type="button" role="tab" aria-selected={key === k} className={key === k ? "on" : ""} onClick={() => pick(k)}>
              {n.label}
              {gap[k] ? <i>足りないかも</i> : null}
            </button>
          );
        })}
        <button type="button" className="ffmore" onClick={() => setMore((v) => !v)}>
          {more ? "▲ 少なくする" : "▼ ビタミン・ミネラルも"}
        </button>
      </div>
      <div className="ffamt">
        <label>
          <span>とりたい量（{nut.label}）</span>
          <b>
            <input inputMode="decimal" value={amt} placeholder={String(nut.defaults[0])} onChange={(e) => setAmt(e.target.value)} aria-label={`${nut.label}の量（${nut.unit}）`} />
            {nut.unit}
          </b>
        </label>
        <div className="ffq">
          {quick.map((v) => (
            <button key={v} type="button" onClick={() => setAmt(String(v))}>{v}{nut.unit}</button>
          ))}
        </div>
      </div>
      {gap[key] ? <p className="ffgap">昨日・一昨日の食事では、約{gap[key]}{nut.unit}、足りないようです。この量を入れています。</p> : null}
      <p className="ffhint">{nut.label}（{nut.hint}）を {value}{nut.unit} とれる食品：{rows.length}件</p>
      <ul className="fflist">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="ffrow">
              <b>{r.name}</b>
              <span>{r.g}g　<em>約{r.kcal}kcal</em></span>
            </div>
            <small>{unitLabel(r) || "目安量は、グラムで"}</small>
            <div className="ffbar" aria-hidden><i style={{ width: `${Math.max(4, Math.round((r.g / max) * 100))}%` }} /></div>
          </li>
        ))}
        {rows.length === 0 && <li className="agnote">この量では、見つかりませんでした。量を、少なくしてみてください。</li>}
      </ul>
      <p className="agnote">日本食品標準成分表をもとにした目安です（調理法・商品で変わります）。</p>
    </section>
  );
}
