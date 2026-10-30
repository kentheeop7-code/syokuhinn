"use client";

import { useMemo, useState } from "react";
import { FOODS, type NutrientKey } from "../lib/foods";

// 食品データ全部（約1,900品）から、その栄養素の多い食品を探して、追加できる。
export default function FoodFinder({
  nutrient,
  label,
  unit,
  grams = 100,
  onPick,
}: {
  nutrient: NutrientKey;
  label: string;
  unit: string;
  grams?: number;
  onPick: (name: string, grams: number) => void;
}) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(8);
  const hits = useMemo(() => {
    const s = q.trim();
    // 検索しないときは、ふつうに食べる量でとれる食品を上に（香辛料・粉末・乾物は、100gではとらないので除く）
    const usual = (f: (typeof FOODS)[number]) => f.cat !== "調味料・油" && !/乾|粉|素干し|干し|加工品|パウダー/.test(f.name);
    return FOODS.filter((f) => (s ? f.name.includes(s) : usual(f)) && f[nutrient] > 0).sort((a, b) => b[nutrient] - a[nutrient]);
  }, [q, nutrient]);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return (
    <div className="ffinder">
      <p className="balh">🔎 ほかの食品も探す（約{Math.floor(FOODS.length / 100) * 100}品から）</p>
      <input
        className="adsearch"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setLimit(8);
        }}
        placeholder={`食品名で検索（空のままなら、${label}が多い順）`}
        aria-label="食品を探す"
      />
      <p className="adcount">
        {hits.length}件（100gあたりの{label}が多い順）
      </p>
      <ul className="ffl">
        {hits.slice(0, limit).map((f) => (
          <li key={f.name}>
            <button type="button" onClick={() => onPick(f.name, grams)}>
              <span className="ffn">{f.name}</span>
              <span className="ffv">
                <b>{r1(f[nutrient])}</b>
                {unit}
                <small>/100g</small>
              </span>
              <span className="ffp" aria-hidden>
                ＋
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hits.length > limit && (
        <button type="button" className="morebtn" onClick={() => setLimit((n) => n + 8)}>
          もっと見る（あと{hits.length - limit}件）
        </button>
      )}
      <p className="agnote small">追加すると、{grams}gぶんとして計算します。量は、ほかの食品と同じように、見直してください。</p>
    </div>
  );
}
