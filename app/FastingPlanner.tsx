"use client";

import { useEffect, useState } from "react";
import { readTarget, type Target } from "../lib/target";

// お客様向け：断食（食べない時間をつくる）プランナー。12時間 → 14時間 → 16時間と、段階的に。
const HOURS = [
  { h: 12, t: "12時間", d: "入門（夕食〜朝食の間）" },
  { h: 14, t: "14時間", d: "寝る4時間前〜起きて2時間" },
  { h: 16, t: "16時間", d: "食べる時間を8時間に" },
];
const pad = (n: number) => String(n).padStart(2, "0");
const hm = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export default function FastingPlanner() {
  const [hours, setHours] = useState(14);
  const [first, setFirst] = useState(11); // 最初の食事の時刻（時）
  const [t, setT] = useState<Target | null>(null);
  useEffect(() => {
    const read = () => setT(readTarget());
    read();
    window.addEventListener("lg-profile-change", read);
    return () => window.removeEventListener("lg-profile-change", read);
  }, []);

  const eat = 24 - hours;
  const start = first * 60;
  const end = start + eat * 60;
  const meals = eat >= 8 ? [{ n: "1回目", at: start, r: 0.4 }, { n: "2回目", at: start + Math.round(eat * 30), r: 0.15 }, { n: "3回目（最後）", at: end - 30, r: 0.45 }] : [{ n: "1回目", at: start, r: 0.5 }, { n: "2回目（最後）", at: end - 30, r: 0.5 }];
  const kcal = t?.kcal ?? 0;
  const pPer = t ? Math.round(t.p / meals.length) : 0;

  return (
    <section className="card fastplan" id="fasting" aria-label="断食プランナー">
      <p className="dch">⏱ 断食プランナー（任意）</p>
      <p className="agnote">食べる時間を決めて、食べない時間をつくる方法です。いきなり16時間にせず、12時間 → 14時間 → 16時間と、体を慣らします。</p>
      <p className="startlabel">食べない時間</p>
      <div className="startpal" role="radiogroup" aria-label="食べない時間">
        {HOURS.map((x) => (
          <button key={x.h} type="button" role="radio" aria-checked={hours === x.h} className={hours === x.h ? "on" : ""} onClick={() => setHours(x.h)}>
            <b>{x.t}</b>
            <small>{x.d}</small>
          </button>
        ))}
      </div>
      <label className="fpsel">
        <span>最初の食事の時刻</span>
        <select value={first} onChange={(e) => setFirst(+e.target.value)} aria-label="最初の食事の時刻">
          {Array.from({ length: 9 }, (_, i) => 6 + i).map((h) => (
            <option key={h} value={h}>{h}:00</option>
          ))}
        </select>
      </label>
      <div className="fpbar" aria-label="1日の時間割">
        <span className="eat" style={{ width: `${(eat / 24) * 100}%` }}>食べる {eat}時間</span>
        <span className="fast" style={{ width: `${(hours / 24) * 100}%` }}>食べない {hours}時間</span>
      </div>
      <p className="fpwin">
        食べる時間：<b>{hm(start)}〜{hm(end)}</b>　／　食べない時間：{hm(end)}〜{hm(start)}（翌日）
      </p>
      <ul className="fpmeals">
        {meals.map((m) => (
          <li key={m.n}>
            <em>{hm(m.at)}</em>
            <b>{m.n}</b>
            <span>{kcal ? `約${Math.round((kcal * m.r) / 10) * 10}kcal` : "目標カロリーの " + Math.round(m.r * 100) + "%"}{pPer ? `・たんぱく質 約${pPer}g` : "・たんぱく質を毎回"}</span>
          </li>
        ))}
      </ul>
      <p className="agnote">1日の合計カロリーは、断食をしても、目標どおりに。{kcal ? `（目標 約${kcal.toLocaleString()}kcal）` : "（基本情報を入れると、目標が出ます）"}水・お茶・無糖のコーヒーは、断食の間も、とってOKです。</p>
      <details className="trblock trev">
        <summary>根拠と、気をつけること</summary>
        <ul>
          <li>Liu 2022 NEJM（肥満の139人・12か月）：8時間だけ食べる群は、カロリー制限だけの群と、体重の減りに、差がなかった（−8.0kgと−6.3kg、P=0.11）。<a href="https://pubmed.ncbi.nlm.nih.gov/35443107/" target="_blank" rel="noreferrer">PubMed</a></li>
          <li>Lowe 2020 JAMA Intern Med（116人・12週間）：16:8は、3食を決めて食べる群と、体重の減りに、差がなかった。<a href="https://pubmed.ncbi.nlm.nih.gov/32986097/" target="_blank" rel="noreferrer">PubMed</a></li>
          <li>メタ分析（13試験・859人、2024）：朝に食べる時間制限食は、制限なしより、体重が約1.8kg、体脂肪が約1.1kg、多く減りました。<a href="https://pubmed.ncbi.nlm.nih.gov/38335858/" target="_blank" rel="noreferrer">PubMed</a></li>
          <li>メタ分析（30研究・1,341人、2026）：カロリーをそろえた比較でも、体重が約1.5kg多く減りましたが、除脂肪量も約0.4kg減りました。<a href="https://pubmed.ncbi.nlm.nih.gov/40298934/" target="_blank" rel="noreferrer">PubMed</a></li>
          <li>食べる時間が、遅い（昼の主な食事が15時より後）人は、減量が小さかった報告があります（Garaulet 2013）。<a href="https://pubmed.ncbi.nlm.nih.gov/23357955/" target="_blank" rel="noreferrer">PubMed</a></li>
          <li>つまり、断食そのものの上乗せ効果は、確認されていません。「食べる時間を決めると、食べすぎを防げる人」に向く方法です。</li>
        </ul>
        <p className="dcwarn">糖尿病の薬を使っている方、妊娠中・授乳中の方、未成年、摂食障害の心配がある方、低体重の方は、行わないか、必ず主治医に相談してください。めまい・強い空腹・強い疲れ・睡眠の悪化が出たら、やめて、もとに戻してください。</p>
      </details>
    </section>
  );
}
