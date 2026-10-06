"use client";

import { AGE_SOURCES, ageBand, ageNotes } from "./ageInfo";

type Row = { label: string; a: string; b: string };

// 30歳前後と60歳前後で、ダイエットの考え方がどう変わるか
const ROWS: Row[] = [
  {
    label: "基礎代謝（男性・体重1kgあたり）",
    a: "30〜49歳：22.5 kcal/日",
    b: "50〜64歳：21.8 kcal/日（女性は20.7）",
  },
  {
    label: "筋肉",
    a: "ピークを過ぎて、ゆっくり減り始める",
    b: "減り方が速まり、サルコペニアの心配が出てくる",
  },
  {
    label: "骨",
    a: "最大骨量を保っている時期。女性は無月経に注意",
    b: "女性は閉経後に急に減る。骨粗しょう症・骨折のリスク",
  },
  {
    label: "減量ペース（1か月）",
    a: "体重の約3〜4%まで",
    b: "体重の約1〜2%まで。急がない",
  },
  {
    label: "食事を減らす幅",
    a: "維持カロリーの約1割減",
    b: "約1割弱減（アプリは7%減）。低栄養に注意",
  },
  {
    label: "たんぱく質",
    a: "体重1kgあたり約1.6g（アプリの計算）",
    b: "体重1kgあたり1.0〜1.3g前後。毎食に分けて。腎臓病は医師へ",
  },
  {
    label: "カルシウム・ビタミンD",
    a: "カルシウム 男750/女650mg・ビタミンD 9.0μg",
    b: "同じ量を、毎日欠かさず。日光、納豆・魚・きのこも",
  },
  {
    label: "運動",
    a: "筋トレ＋有酸素。強めでもOK",
    b: "筋トレは必須。荷重運動（歩行）とバランス運動。転倒に注意",
  },
  {
    label: "目標BMI",
    a: "18.5〜24.9（18.5未満は避ける）",
    b: "50〜64歳：20.0〜24.9／65歳以上：21.5〜24.9",
  },
];

export function AgeNotesBox({ age, sex }: { age: number; sex: "m" | "f" | null }) {
  if (!(age >= 18 && age <= 99)) return null;
  const n = ageNotes(ageBand(age), sex);
  return (
    <div className="agebox">
      <b>🧭 あなたの年齢（{age}歳）のダイエットの注意</b>
      <p className="agetitle">{n.title}</p>
      <ul>
        {n.items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {sex === "f" && age >= 40 && (
        <>
          <p className="agetitle">女性の{age}歳：ホルモンの変化もいっしょに</p>
          <ul>
            <li>女性ホルモン（エストロゲン）が減る時期で、骨量・LDLコレステロール・内臓脂肪・血圧が変わりやすくなります。食事を減らすより、筋トレ＋たんぱく質＋骨を守る栄養を。</li>
            <li>骨粗鬆症検診（40歳から5歳ごと）と、乳がん検診（2年に1回）を、あわせて受けましょう。</li>
            <li>月経がある間は、鉄（赤身肉・レバー・あさり）を。閉経後は、カルシウム700〜800mg・ビタミンD・ビタミンKを重点的に。</li>
            <li>ほてりや眠れないなど、更年期のつらい症状は、婦人科で相談できます。くわしくは、下の「女性のからだと食事：年代別ガイド」へ。</li>
          </ul>
        </>
      )}
    </div>
  );
}

export default function AgeCompare() {
  return (
    <section className="card agecmp" aria-label="30歳と60歳のダイエットの違い">
      <h2 className="h2">🧓 30歳と60歳の、ダイエットの違い</h2>
      <p className="agelead">
        年齢によって、筋肉・骨・代謝が違うので、「やせ方」も変わります。同じ減量でも、60歳では、筋肉と骨を守ることが第一です。
      </p>

      <div className="agetable" role="table" aria-label="年齢別の比較">
        <div className="agehead" role="row">
          <span role="columnheader" />
          <span role="columnheader" className="ca">
            30歳前後
          </span>
          <span role="columnheader" className="cb">
            60歳前後
          </span>
        </div>
        {ROWS.map((r) => (
          <div className="agerow" role="row" key={r.label}>
            <b role="rowheader">{r.label}</b>
            <span role="cell" className="ca">
              {r.a}
            </span>
            <span role="cell" className="cb">
              {r.b}
            </span>
          </div>
        ))}
      </div>

      <p className="agenote">
        骨量は20歳前後でピークになり、40代ごろまで保たれ、その後はゆっくり減ります。女性は閉経後に急に減ります。また、高齢者の肥満の診療ガイドラインでは、運動を併用した減量では骨密度は減少しないとされ、サルコペニア肥満の減量は、エネルギー制限・十分なたんぱく質・レジスタンス運動が推奨されています。
      </p>
      <p className="agenote small">
        ※ 一般的な目安です。骨粗しょう症や、糖尿病・腎臓病などの持病、服薬がある人は、始める前に医師に相談してください。出典：
        {AGE_SOURCES.map((s, i) => (
          <span key={s.url}>
            {i > 0 && "／"}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}

