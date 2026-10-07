"use client";

import { useMemo, useState } from "react";
import { FOODS } from "../lib/foods";

type Pick = { name: string; g: number; label: string };
type Group = { key: "ca" | "vd" | "fe"; title: string; unit: string; foods: Pick[] };

const byName = new Map(FOODS.map((f) => [f.name, f]));

// よく食べる量（1回分）で並べた、おすすめ食品
const GROUPS: Group[] = [
  {
    key: "ca",
    title: "カルシウム",
    unit: "mg",
    foods: [
      { name: "牛乳", g: 200, label: "牛乳 コップ1杯（200ml）" },
      { name: "無糖ヨーグルト", g: 100, label: "無糖ヨーグルト 100g" },
      { name: "プロセスチーズ", g: 25, label: "チーズ 25g（1〜2切れ）" },
      { name: "小松菜", g: 100, label: "小松菜 100g（1/3束）" },
      { name: "木綿豆腐", g: 150, label: "木綿豆腐 150g（1/2丁）" },
      { name: "厚揚げ", g: 100, label: "厚揚げ 100g" },
      { name: "しらす干し", g: 20, label: "しらす干し 20g（大さじ3）" },
      { name: "ししゃも（生干し）", g: 50, label: "ししゃも 3尾（50g）" },
      { name: "いわし缶（味付け）", g: 50, label: "いわし缶 50g" },
    ],
  },
  {
    key: "vd",
    title: "ビタミンD",
    unit: "μg",
    foods: [
      { name: "サケ（焼き）", g: 80, label: "サケ 1切れ（80g）" },
      { name: "サンマ", g: 100, label: "サンマ 1尾（可食部100g）" },
      { name: "ブリ", g: 80, label: "ブリ 1切れ（80g）" },
      { name: "ニジマス", g: 80, label: "ニジマス 80g" },
      { name: "しらす干し", g: 20, label: "しらす干し 20g" },
      { name: "卵", g: 50, label: "卵 1個（50g）" },
      { name: "まいたけ", g: 50, label: "まいたけ 50g" },
      { name: "しいたけ", g: 30, label: "しいたけ 2枚（30g）" },
    ],
  },
  {
    key: "fe",
    title: "鉄",
    unit: "mg",
    foods: [
      { name: "豚レバー", g: 50, label: "豚レバー 50g" },
      { name: "鶏レバー", g: 50, label: "鶏レバー 50g" },
      { name: "牛もも肉（赤身）", g: 100, label: "牛赤身肉 100g" },
      { name: "カツオ", g: 100, label: "カツオ 100g（刺身5切れほど）" },
      { name: "アサリ", g: 50, label: "あさり 50g（むき身）" },
      { name: "小松菜", g: 100, label: "小松菜 100g" },
      { name: "ほうれん草", g: 80, label: "ほうれん草 80g" },
      { name: "納豆", g: 45, label: "納豆 1パック（45g）" },
      { name: "厚揚げ", g: 100, label: "厚揚げ 100g" },
    ],
  },
];

// 目安：カルシウムは骨粗鬆症ガイドライン（700〜800mg）、ビタミンDは食事摂取基準の目安量、鉄は月経のある30〜49歳の推奨量
const TARGETS = { ca: 750, vd: 9, fe: 10.5 };
const LABEL = { ca: "カルシウム", vd: "ビタミンD", fe: "鉄" };
const UNIT = { ca: "mg", vd: "μg", fe: "mg" };

const val = (p: Pick, k: "ca" | "vd" | "fe") => {
  const f = byName.get(p.name);
  return f ? (f[k] * p.g) / 100 : 0;
};
const r1 = (n: number) => Math.round(n * 10) / 10;

export default function BoneMenu({ onAdd }: { onAdd: (name: string, grams: number) => void }) {
  const [tab, setTab] = useState<"ca" | "vd" | "fe">("ca");
  const [picked, setPicked] = useState<Pick[]>([]);
  const [added, setAdded] = useState(false);

  const totals = useMemo(() => {
    const t = { ca: 0, vd: 0, fe: 0 };
    for (const p of picked) {
      t.ca += val(p, "ca");
      t.vd += val(p, "vd");
      t.fe += val(p, "fe");
    }
    return t;
  }, [picked]);

  const group = GROUPS.find((g) => g.key === tab) ?? GROUPS[0];
  const add = (p: Pick) => {
    setPicked((a) => [...a, p]);
    setAdded(false);
  };
  const keys = ["ca", "vd", "fe"] as const;

  return (
    <section className="card bmenu" aria-label="骨と血をつくる食品メーカー">
      <h2 className="h2">🥛 骨と血をつくる「食品メーカー」</h2>
      <p className="bmnote">
        カルシウム・ビタミンD・鉄の目安に届くように、食品をタップして足していきましょう。1日の合計が、メーターで見られます。
      </p>

      <div className="bmmeters">
        {keys.map((k) => {
          const pct = Math.min(100, (totals[k] / TARGETS[k]) * 100);
          const done = totals[k] >= TARGETS[k];
          return (
            <div key={k} className={done ? "bmm done" : "bmm"}>
              <div className="bmmhead">
                <b>{LABEL[k]}</b>
                <span>
                  <strong>{r1(totals[k])}</strong> / {TARGETS[k]}
                  {UNIT[k]}
                  {done ? " ✓" : ""}
                </span>
              </div>
              <div className="bmbar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <p className="bmfoot">
          目安：カルシウム 700〜800mg（骨粗鬆症ガイドライン）／ビタミンD 9.0μg（食事摂取基準の目安量）／鉄 10.5mg（月経のある30〜49歳の推奨量。閉経後は必要量が下がります）
        </p>
      </div>

      <div className="bmtabs" role="tablist">
        {GROUPS.map((g) => (
          <button key={g.key} role="tab" aria-selected={tab === g.key} className={tab === g.key ? "on" : ""} onClick={() => setTab(g.key)}>
            {g.title}の多い食品
          </button>
        ))}
      </div>

      <ul className="bmfoods">
        {group.foods.map((p) => {
          const v = val(p, group.key);
          return (
            <li key={p.label}>
              <button onClick={() => add(p)}>
                <span className="bmname">{p.label}</span>
                <span className="bmval">
                  <b>{r1(v)}</b>
                  {group.unit}
                </span>
                <span className="bmplus" aria-hidden>
                  ＋
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="bmpicked">
        <b>今日とる予定（{picked.length}品）</b>
        {picked.length === 0 ? (
          <p className="bmnote">まだ選んでいません。上の食品をタップしてください。</p>
        ) : (
          <>
            <ul>
              {picked.map((p, i) => (
                <li key={`${p.label}-${i}`}>
                  <span>{p.label}</span>
                  <button aria-label={`${p.label}を外す`} onClick={() => setPicked((a) => a.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="bmactions">
              <button
                className="btn"
                onClick={() => {
                  picked.forEach((p) => onAdd(p.name, p.g));
                  setAdded(true);
                }}
              >
                {added ? "✓ 今日の記録に追加しました" : "＋ 今日の記録に追加"}
              </button>
              <button className="btn ghost" onClick={() => setPicked([])}>
                全部外す
              </button>
            </div>
          </>
        )}
      </div>
      <p className="bmnote small">
        数値は、日本食品標準成分表（八訂増補2023年）をもとにした、アプリ内の食品データです。レバーは、とりすぎるとビタミンAが多くなるため、週に1〜2回までが目安です（妊娠中は特に注意）。ビタミンKの多い納豆・緑黄色野菜は、ワルファリンを飲んでいる人は医師に相談を。
      </p>
    </section>
  );
}
