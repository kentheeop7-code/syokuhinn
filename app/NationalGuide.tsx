"use client";

import EvidenceBox from "./EvidenceBox";
import { BAND_SHORT, REF, useMe } from "./me";

// 厚生労働省の指針にある数値だけを載せる（確認できたものに限る）
export default function NationalGuide() {
  const me = useMe();
  if (!me.ready) return null;
  const b = me.band;
  const ref = REF[me.sexKey];
  const senior = b >= 5;
  const rows: { icon: string; name: string; val: string }[] = [
    { icon: "🔥", name: "エネルギー", val: `約${ref.kcal[b][me.pal].toLocaleString()}kcal（推定エネルギー必要量）` },
    { icon: "🥩", name: "たんぱく質", val: `${ref.protein[b]}g以上` },
    { icon: "🧂", name: "食塩相当量", val: `${ref.salt[b]}g未満` },
    { icon: "🥬", name: "野菜", val: "1日350g以上（健康日本21）" },
    { icon: "😴", name: "睡眠", val: me.isYouth ? "年齢により長めが必要（睡眠ガイド2023）" : senior ? "6〜8時間（60歳以上の目標）" : "6〜9時間（20〜59歳の目標）" },
    { icon: "🚶", name: "歩く・動く", val: me.isYouth ? "中強度以上の運動を1日60分以上（こどもの参考値）" : senior ? "歩行など1日40分以上（約6,000歩以上）" : "歩行など1日60分以上（約8,000歩以上）" },
  ];
  if (!me.isYouth) rows.push({ icon: "💪", name: "筋トレ", val: "週2〜3日" });
  return (
    <section className="card" aria-label="国の指針でみる1日の目安">
      <h2 className="h2" style={{ marginTop: 0 }}>🏛 国の指針でみる1日の目安</h2>
      <p className="agnote">
        {me.sexKey === "f" ? "女性" : "男性"}・{BAND_SHORT[b]}の目安です。厚生労働省の資料にある数値だけを載せています。
      </p>
      <ul className="mereflist">
        {rows.map((r) => (
          <li key={r.name}>
            <span>
              <span aria-hidden>{r.icon}</span> {r.name}
            </span>
            <b>{r.val}</b>
          </li>
        ))}
      </ul>
      <EvidenceBox ids={["dri2025", "japan21", "sleep2023", "activity2023"]} level="強い（国の基準）" note="食事・睡眠・運動の目安は、厚生労働省の基準・ガイドの数値です。個人差があり、持病のある方は医師の指示を優先してください。" />
    </section>
  );
}
