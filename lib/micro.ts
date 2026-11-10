// 食事の選びかた（食品の数）から、ビタミン・ミネラルの量を、おおよそ計算する。
// 食品ごとの量は、日本食品標準成分表をもとにした「100gあたりの目安値」（lib/foods.ts）×「1回の重さ」。
// ケーキ・スナック・外食・みそ汁など、重さの決められない食品は、含みません（＝実際より、少なめに出ます）。
import { FOODS } from "./foods";
import { U } from "../app/BalanceCheck";
import { amountOf } from "./microLookup";

const byName = new Map(FOODS.map((f) => [f.name, f]));
// 食品の種類 → [代表的な食品, 1回のグラム]
const MAP: Record<string, [string, number]> = {
  rice: ["白ごはん", 150],
  brown: ["玄米ごはん", 150],
  bread: ["食パン", 60],
  wbread: ["全粒粉パン", 60],
  oats: ["オートミール", 30],
  noodle: ["ゆでうどん", 250],
  imo: ["さつまいも", 100],
  meat: ["豚もも肉（赤身）", 90],
  chicken: ["鶏むね肉（皮なし）", 90],
  liver: ["鶏レバー", 50],
  fish: ["サケ（焼き）", 80],
  egg: ["卵", 50],
  soy: ["納豆", 45],
  beans: ["ゆでひよこ豆", 50],
  veg: ["キャベツ", 70],
  salad: ["キャベツ", 70],
  greenveg: ["ほうれん草", 70],
  rootveg: ["ごぼう", 70],
  mush: ["しいたけ", 50],
  konjac: ["こんにゃく", 50],
  milk: ["牛乳", 200],
  soymilk: ["豆乳（無調整）", 200],
  yogurt: ["無糖ヨーグルト", 100],
  fruit: ["りんご", 100],
  nuts: ["アーモンド", 20],
  processed: ["ロースハム", 40],
  fried: ["とりから揚げ", 80],
};

export type MicroKey = "va" | "vd" | "b1" | "b2" | "b6" | "b12" | "vc" | "fol" | "ca" | "mg" | "fe" | "zn" | "k";
export const MICRO_ROWS: { key: MicroKey; label: string; unit: string; dri: string; foods: string }[] = [
  { key: "ca", label: "カルシウム", unit: "mg", dri: "カルシウム", foods: "牛乳・ヨーグルト・小松菜・豆腐・小魚" },
  { key: "fe", label: "鉄", unit: "mg", dri: "鉄", foods: "赤身肉・レバー・あさり・小松菜・大豆" },
  { key: "mg", label: "マグネシウム", unit: "mg", dri: "マグネシウム", foods: "ナッツ・大豆・海藻・玄米" },
  { key: "zn", label: "亜鉛", unit: "mg", dri: "亜鉛", foods: "肉・貝・卵・チーズ" },
  { key: "k", label: "カリウム", unit: "mg", dri: "カリウム", foods: "野菜・果物・豆・いも" },
  { key: "va", label: "ビタミンA", unit: "μg", dri: "ビタミンA", foods: "にんじん・ほうれん草・卵・レバー" },
  { key: "vd", label: "ビタミンD", unit: "μg", dri: "ビタミンD", foods: "さけ・さんま・きのこ" },
  { key: "vc", label: "ビタミンC", unit: "mg", dri: "ビタミンC", foods: "野菜・果物（ブロッコリー・キウイ・みかん）" },
  { key: "b1", label: "ビタミンB1", unit: "mg", dri: "ビタミンB1", foods: "豚肉・大豆・玄米" },
  { key: "b2", label: "ビタミンB2", unit: "mg", dri: "ビタミンB2", foods: "卵・乳製品・納豆" },
  { key: "b6", label: "ビタミンB6", unit: "mg", dri: "ビタミンB6", foods: "魚・鶏肉・バナナ" },
  { key: "b12", label: "ビタミンB12", unit: "μg", dri: "ビタミンB12", foods: "魚・貝・肉・卵・乳製品" },
  { key: "fol", label: "葉酸", unit: "μg", dri: "葉酸", foods: "緑の野菜・豆・レバー" },
];

export type Micro = { values: Record<MicroKey, number>; coverage: number };
export function microTotals(vals: Record<string, number>): Micro {
  const values = Object.fromEntries(MICRO_ROWS.map((r) => [r.key, 0])) as Record<MicroKey, number>;
  let kAll = 0;
  let kMap = 0;
  for (const [k, n] of Object.entries(vals)) {
    const u = U[k];
    if (u) kAll += u.kcal * n;
    const m = MAP[k];
    const food = m ? byName.get(m[0]) : undefined;
    if (!m || !food) continue;
    if (u) kMap += u.kcal * n;
    const x = (n * m[1]) / 100;
    for (const r of MICRO_ROWS) values[r.key] += ((food as unknown as Record<string, number>)[r.key] ?? 0) * x;
  }
  return { values, coverage: kAll > 0 ? kMap / kAll : 0 };
}

export const goalOfMicro = (key: MicroKey, sex: "f" | "m", band: number): number => {
  const r = MICRO_ROWS.find((x) => x.key === key)!;
  const s = amountOf(r.dri, sex, band);
  return s ? parseFloat(s.replace(/,/g, "")) || 0 : 0;
};
// 食事（St）から、ビタミン・ミネラルの量と、目安に対する割合
import { buildVals, type St } from "./meals";
export type MicroRow = { key: MicroKey; label: string; unit: string; foods: string; value: number; goal: number; pct: number };
export function microStatus(st: St, sex: "f" | "m", band: number): { rows: MicroRow[]; coverage: number } {
  const t = microTotals(buildVals(st));
  const rows = MICRO_ROWS.map((r) => {
    const goal = goalOfMicro(r.key, sex, band);
    const value = t.values[r.key];
    return { key: r.key, label: r.label, unit: r.unit, foods: r.foods, value, goal, pct: goal > 0 ? value / goal : 0 };
  });
  return { rows, coverage: t.coverage };
}