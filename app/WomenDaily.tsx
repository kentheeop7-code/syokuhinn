"use client";

import { useMemo } from "react";
import { FOODS } from "../lib/foods";

type Entry = { id: string; name: string; grams: number };
type Goal = { p: string; f: string; c: string };

const byName = new Map(FOODS.map((f) => [f.name, f]));

// 女性に大切な栄養素の、1日の目安（日本人の食事摂取基準2025年版・骨粗鬆症ガイドラインなど）
const ITEMS = [
  { key: "p", label: "たんぱく質", unit: "g", target: 50, note: "推奨量（女性・18〜64歳）。目標を設定していれば、その値", kind: "min" },
  { key: "ca", label: "カルシウム", unit: "mg", target: 700, note: "骨を守る目安（700〜800mg）", kind: "min" },
  { key: "fe", label: "鉄", unit: "mg", target: 10.5, note: "月経のある30〜49歳の推奨量", kind: "min" },
  { key: "fol", label: "葉酸", unit: "μg", target: 240, note: "推奨量（成人）。妊娠を考える人は、さらにサプリで400μg", kind: "min" },
  { key: "vd", label: "ビタミンD", unit: "μg", target: 9, note: "目安量", kind: "min" },
  { key: "fi", label: "食物繊維", unit: "g", target: 18, note: "目標量（女性）の目安", kind: "min" },
  { key: "salt", label: "塩分", unit: "g", target: 6.5, note: "目標量（女性）。これ未満に", kind: "max" },
] as const;

type K = (typeof ITEMS)[number]["key"];

// 足りないときの、おすすめ食品（1回分の量）
const SUGGEST: Partial<Record<K, { name: string; g: number; label: string }[]>> = {
  ca: [
    { name: "牛乳", g: 200, label: "牛乳 200ml" },
    { name: "無糖ヨーグルト", g: 100, label: "ヨーグルト 100g" },
    { name: "プロセスチーズ", g: 25, label: "チーズ 25g" },
    { name: "小松菜", g: 100, label: "小松菜 100g" },
  ],
  fe: [
    { name: "豚レバー", g: 50, label: "豚レバー 50g" },
    { name: "牛もも肉（赤身）", g: 100, label: "牛赤身肉 100g" },
    { name: "カツオ", g: 100, label: "カツオ 100g" },
    { name: "小松菜", g: 100, label: "小松菜 100g" },
  ],
  fol: [
    { name: "ほうれん草", g: 80, label: "ほうれん草 80g" },
    { name: "ブロッコリー", g: 80, label: "ブロッコリー 80g" },
    { name: "枝豆", g: 60, label: "枝豆 60g" },
    { name: "納豆", g: 45, label: "納豆 1パック" },
  ],
  vd: [
    { name: "サケ（焼き）", g: 80, label: "サケ 1切れ" },
    { name: "サンマ", g: 100, label: "サンマ 1尾" },
    { name: "しらす干し", g: 20, label: "しらす干し 20g" },
    { name: "まいたけ", g: 50, label: "まいたけ 50g" },
  ],
  fi: [
    { name: "オートミール", g: 30, label: "オートミール 30g" },
    { name: "ごぼう", g: 50, label: "ごぼう 50g" },
    { name: "枝豆", g: 60, label: "枝豆 60g" },
    { name: "納豆", g: 45, label: "納豆 1パック" },
  ],
  p: [
    { name: "卵", g: 50, label: "卵 1個" },
    { name: "鶏むね肉（皮なし）", g: 100, label: "鶏むね肉 100g" },
    { name: "木綿豆腐", g: 150, label: "豆腐 1/2丁" },
    { name: "納豆", g: 45, label: "納豆 1パック" },
  ],
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export default function WomenDaily({
  entries,
  goal,
  onAdd,
}: {
  entries: Entry[];
  goal: Goal;
  onAdd: (name: string, grams: number) => void;
}) {
  const totals = useMemo(() => {
    const t: Record<K, number> = { p: 0, ca: 0, fe: 0, fol: 0, vd: 0, fi: 0, salt: 0 };
    for (const e of entries) {
      const f = byName.get(e.name);
      if (!f) continue;
      const k = e.grams / 100;
      t.p += f.p * k;
      t.ca += f.ca * k;
      t.fe += f.fe * k;
      t.fol += f.fol * k;
      t.vd += f.vd * k;
      t.fi += f.fi * k;
      t.salt += f.salt * k;
    }
    return t;
  }, [entries]);

  const gp = parseFloat(goal.p);
  const rows = ITEMS.map((it) => {
    const target = it.key === "p" && gp > 0 ? gp : it.target;
    return { ...it, target, val: totals[it.key] };
  });
  const has = entries.length > 0;
  // いちばん足りない栄養（最大2つ）に、おすすめ食品を出す
  const lacking = rows
    .filter((r) => r.kind === "min" && r.key !== "p")
    .map((r) => ({ r, ratio: r.val / r.target }))
    .filter((x) => x.ratio < 1)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2);

  return (
    <section className="card wdaily" aria-label="今日の、女性に大切な栄養チェック">
      <h2 className="h2">✅ 今日の「女性に大切な栄養」チェック</h2>
      <p className="wdnote">
        食べたものを記録すると、鉄・カルシウム・葉酸・ビタミンD・食物繊維などが、女性の目安に届いているか分かります。
      </p>

      <div className="wdrows">
        {rows.map((r) => {
          const pct = Math.min(100, (r.val / r.target) * 100);
          const over = r.kind === "max" && r.val > r.target;
          const done = r.kind === "min" && r.val >= r.target;
          return (
            <div key={r.key} className={over ? "wdrow over" : done ? "wdrow done" : "wdrow"}>
              <div className="wdhead">
                <b>{r.label}</b>
                <span>
                  <strong>{r1(r.val)}</strong> / {r.kind === "max" ? "上限 " : ""}
                  {r1(r.target)}
                  {r.unit}
                  {done ? " ✓" : over ? " ⚠" : ""}
                </span>
              </div>
              <div className="wdbar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="wdfoot">
        目安：カルシウム700mg（骨粗鬆症ガイドライン700〜800mg）・鉄10.5mg（月経のある30〜49歳。閉経後は必要量が下がります）・葉酸240μg・ビタミンD 9.0μg・食物繊維18g・塩分6.5g未満。調味料の塩分は、含まれていない場合があります。
      </p>

      {has && lacking.length > 0 && (
        <div className="wdsug">
          <b>足りない栄養を、足してみませんか？（タップで今日の記録に追加）</b>
          {lacking.map(({ r }) => (
            <div key={r.key}>
              <span>
                {r.label}（あと約{r1(Math.max(0, r.target - r.val))}
                {r.unit}）
              </span>
              <div className="wdchips">
                {(SUGGEST[r.key] ?? []).map((s) => {
                  const f = byName.get(s.name);
                  const v = f ? (f[r.key as "ca" | "fe" | "fol" | "vd" | "fi"] * s.g) / 100 : 0;
                  return (
                    <button key={s.label} onClick={() => onAdd(s.name, s.g)}>
                      ＋ {s.label}
                      <small>
                        +{r1(v)}
                        {r.unit}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {has && lacking.length === 0 && <p className="wdok">今日は、主な栄養素が、目安に届いています。すばらしい！</p>}
      {!has && <p className="wdempty">まだ、この日の食事の記録がありません。「食品を探す」から追加してみましょう。</p>}
    </section>
  );
}
