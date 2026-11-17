"use client";

import { useEffect, useState } from "react";
import { dateLabel, readLog, saveDay, stOfDay, averageIntake, type DayLog } from "../lib/daylog";
import { goalOf, totals, type St } from "../lib/meals";
import { EXAMPLES, swapsFor } from "../lib/swaps";
import { readTarget, type Target } from "../lib/target";
import MealPicker from "./MealPicker";

// ② 昨日・一昨日の食事を、かんたんに入れる → ③ 目標のカロリーとの、差を見る
const DAYS = [
  { d: 1, t: "昨日" },
  { d: 2, t: "一昨日" },
  { d: 0, t: "今日" },
];
const r10 = (n: number) => Math.round(n / 10) * 10;

export default function DayCompare() {
  const [target, setTarget] = useState<Target | null>(null);
  const [log, setLog] = useState<DayLog>({});
  const [sel, setSel] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      setTarget(readTarget());
      setLog(readLog());
    };
    read();
    setReady(true);
    const evs = ["lg-profile-change", "lg-me-change", "lg-days2-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    return () => evs.forEach((e) => window.removeEventListener(e, read));
  }, []);

  if (!ready) return null;
  const st = stOfDay(log, sel);
  const change = (n: St) => {
    saveDay(sel, n);
    setLog(readLog());
  };

  const rows = DAYS.map((x) => ({ ...x, tot: totals(stOfDay(log, x.d)) }));
  const avg = averageIntake(log);
  const gl = target ? goalOf(target.sexKey, target.band) : null;
  const diff = target && avg ? avg.kcal - target.kcal : 0;
  const ratio = target && avg ? avg.kcal / target.kcal : 0;
  const state = !target || !avg ? "none" : ratio > 1.1 ? "over" : ratio < 0.9 ? "under" : "ok";
  const belowFloor = !!target && !!avg && avg.kcal < target.floor - 50;
  const swaps = avg ? swapsFor(stOfDay(log, [1, 2].find((d) => totals(stOfDay(log, d)).any) ?? 1)).slice(0, 3) : [];
  const gp = gl ? parseFloat(gl.p || "0") : 0;
  const gfi = gl ? parseFloat(gl.fi || "0") : 0;

  const bar = (v: number, max: number, color: string) => (
    <span className="dcbar" aria-hidden>
      <i style={{ width: `${Math.min(100, Math.round((v / max) * 100))}%`, background: color }} />
    </span>
  );

  return (
    <section className="card daycmp" id="qm" aria-label="昨日・一昨日の食事と、目標との差">
      <p className="dch">④ 今の食事を入れる（昨日・一昨日）</p>
      {!target && <p className="dcwarn">先に、上の「① 基本情報」（年齢・身長・体重・目標体重・運動量）を入れると、1日の目標カロリーが決まります。</p>}
      {target && (
        <div className="dctarget">
          <small>あなたの1日の目標</small>
          <b>約{target.kcal.toLocaleString()}kcal</b>
          <span>
            たんぱく質 {target.p}g・脂質 {target.f}g・炭水化物 {target.c}g
          </span>
        </div>
      )}
      <div className="dcseg" role="tablist" aria-label="どの日の食事か">
        {DAYS.map((x) => {
          const t = rows.find((r) => r.d === x.d)!.tot;
          return (
            <button key={x.d} type="button" role="tab" aria-selected={sel === x.d} className={sel === x.d ? "on" : ""} onClick={() => setSel(x.d)}>
              <b>{x.t}</b>
              <small>{dateLabel(x.d)}</small>
              <em>{t.any ? `✓ 約${r10(t.kcal).toLocaleString()}kcal` : "まだ"}</em>
            </button>
          );
        })}
      </div>
      <p className="qmone">{DAYS.find((x) => x.d === sel)!.t}の、朝・昼・夜・おやつを、タップで選びます（だいたいでOK）。</p>
      <div className="dcquick">
        <b>かんたん：1日のパターンを、1タップで入れる（あとで直せます）</b>
        <div>
          {EXAMPLES.slice(0, 8).map((ex) => (
            <button key={ex.id} type="button" onClick={() => change({ date: st.date, size: { ...ex.st.size }, ext: { ...ex.st.ext } })}>
              {ex.name}
            </button>
          ))}
        </div>
      </div>
      <MealPicker key={sel} value={st} onChange={change} />

      <p className="dch">⑤ 目標との差</p>
      {state === "none" && <p className="agnote">{target ? "昨日か一昨日の食事を、1つ以上、入れてください。" : "基本情報を入れてください。"}</p>}
      {target && (
        <ul className="dcrows">
          {rows
            .filter((r) => r.d !== 0 || r.tot.any)
            .map((r) => {
              const dk = r.tot.kcal - target.kcal;
              const ok = Math.abs(dk) <= target.kcal * 0.1;
              return (
                <li key={r.d}>
                  <div className="dcl">
                    <b>{r.t}</b>
                    <span>{r.tot.any ? `約${r10(r.tot.kcal).toLocaleString()}kcal` : "未入力"}</span>
                    {r.tot.any && (
                      <em className={ok ? "ok" : dk > 0 ? "high" : "low"}>
                        {ok ? "目標どおり" : dk > 0 ? `+${r10(dk).toLocaleString()}kcal 多い` : `${r10(dk).toLocaleString()}kcal 少ない`}
                      </em>
                    )}
                  </div>
                  {r.tot.any && (
                    <div className="dcb">
                      {bar(r.tot.kcal, Math.max(target.kcal, r.tot.kcal) * 1.05, ok ? "#2f9e75" : dk > 0 ? "#e8503c" : "#e0a526")}
                      <i className="dcmark" style={{ left: `${Math.round((target.kcal / (Math.max(target.kcal, r.tot.kcal) * 1.05)) * 100)}%` }} title="目標" />
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}

      {target && avg && (
        <div className={`dcverdict ${state}`}>
          <b>
            {avg.days === 1 ? "入力した1日" : "昨日・一昨日の平均"}：約{r10(avg.kcal).toLocaleString()}kcal（目標より {diff >= 0 ? "+" : ""}
            {r10(diff).toLocaleString()}kcal）
          </b>
          {state === "ok" && <p>目標に近い食べ方です。このまま続けましょう。体重の推移は、下の④で確かめます。</p>}
          {state === "over" && (
            <p>
              目標より多めです。この差が毎日続くと、1週間で約{r1((diff * 7) / 7200)}kgぶん、体重が減りにくく（増えやすく）なる計算です（体重1kg＝約7,200kcalの目安。個人差があります）。
            </p>
          )}
          {state === "under" && !belowFloor && <p>目標より少なめです。少しの差は問題ありませんが、続けて大きく下回ると、筋肉・代謝・疲れに影響します。</p>}
          {belowFloor && (
            <p className="dcbad">
              下限（{target.floor.toLocaleString()}kcal）を下回っています。食事が足りない状態が続くと、健康と運動能力に悪い影響が出ると報告されています（IOC REDs 2023）。まず、食事を増やしましょう。
            </p>
          )}
          <ul className="dcn">
            <li className={avg.p >= (gp || target.p) * 0.9 ? "ok" : "low"}>
              たんぱく質：約{Math.round(avg.p)}g（目標 {target.p}g）{avg.p < target.p * 0.8 ? " → 足りません。毎食、手のひら1枚ぶん（卵・納豆・魚・肉・豆腐）を。" : ""}
            </li>
            <li className={avg.fi >= gfi * 0.9 ? "ok" : "low"}>
              食物繊維：約{r1(avg.fi)}g（目安 {gfi}g以上）{gfi && avg.fi < gfi * 0.8 ? " → 野菜・きのこ・海藻・豆を足しましょう。" : ""}
            </li>
            <li className={avg.salt <= (gl?.salt ?? 7) ? "ok" : "high"}>
              食塩：約{r1(avg.salt)}g（目安 {gl?.salt}g未満）{gl && avg.salt > gl.salt ? " → 汁物は具を食べて汁は半分に。" : ""}
            </li>
          </ul>
          {state === "over" && swaps.length > 0 && (
            <div className="dcswap">
              <b>おすすめの置きかえ（増やす食事）</b>
              <ul>
                {swaps.map((s) => (
                  <li key={s.id}>
                    {s.from} → <b>{s.to}</b>
                    <small>（{s.why}）</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="agnote">目標は、体重・身長・年齢・運動量からの計算（{target.label}）で、減らす幅は維持の15%までです。診断ではなく目安です。</p>
        </div>
      )}
    </section>
  );
}
const r1 = (n: number) => Math.round(n * 10) / 10;



