// 食品の早見表：「たんぱく質10gをとれる食品」「炭水化物50gの食品」など。
// 栄養は、日本食品標準成分表をもとにした、100gあたりの目安値（lib/foods.ts）から、計算。量は、1回ぶんの目安（unit）の何個ぶんか、で示す。
import { FOODS } from "./foods";

export type NutKey = "p" | "c" | "f" | "fi" | "ca" | "fe";
export const NUTS: { key: NutKey; label: string; unit: string; defaults: number[]; hint: string }[] = [
  { key: "p", label: "たんぱく質", unit: "g", defaults: [10, 20], hint: "筋肉・満腹感" },
  { key: "c", label: "炭水化物", unit: "g", defaults: [50], hint: "エネルギー源（高炭水化物の食品）" },
  { key: "f", label: "脂質", unit: "g", defaults: [10], hint: "ホルモン・脂溶性ビタミン" },
  { key: "fi", label: "食物繊維", unit: "g", defaults: [5], hint: "おなかの調子・満腹感" },
  { key: "ca", label: "カルシウム", unit: "mg", defaults: [200], hint: "骨・歯" },
  { key: "fe", label: "鉄", unit: "mg", defaults: [3], hint: "貧血・疲れ" },
];
// [食品名, 1回ぶんの重さ(g), 1回ぶんの呼びかた]
const L: Record<NutKey, [string, number, string][]> = {
  p: [["卵", 50, "個"], ["納豆", 45, "パック"], ["木綿豆腐", 150, "丁の半分"], ["鶏むね肉（皮なし）", 90, "手のひら1枚"], ["鶏ささみ", 50, "本"], ["サケ（焼き）", 80, "切れ"], ["牛もも肉（赤身）", 90, "手のひら1枚"], ["豚ヒレ肉", 90, "手のひら1枚"], ["いわし缶（味付け）", 100, "缶"], ["牛乳", 200, "杯"], ["無糖ヨーグルト", 100, "個"], ["カッテージチーズ", 50, "大さじ3"], ["豆乳（無調整）", 200, "杯"], ["高野豆腐（乾）", 16, "個"]],
  c: [["白ごはん", 150, "杯"], ["玄米ごはん", 150, "杯"], ["もち麦ごはん", 150, "杯"], ["食パン", 60, "枚"], ["全粒粉パン", 60, "枚"], ["ゆでうどん", 220, "玉"], ["ゆでそば", 170, "玉"], ["パスタ（ゆで）", 200, "皿"], ["さつまいも", 150, "中1/2本"], ["じゃがいも", 100, "中1個"], ["バナナ", 100, "本"], ["オートミール", 30, "30g"], ["りんご", 125, "1/2個"]],
  f: [["アーモンド", 20, "ひとつかみ"], ["くるみ", 20, "ひとつかみ"], ["ピーナッツバター", 15, "大さじ1"], ["サラダ油（調合油）", 12, "大さじ1"], ["プロセスチーズ", 20, "個"], ["卵黄", 18, "個"], ["サケ（生）", 80, "切れ"], ["豚バラ肉", 80, "3枚"], ["牛ひき肉", 100, "100g"]],
  fi: [["ブロッコリー", 70, "小鉢1つ"], ["ほうれん草", 70, "小鉢1つ"], ["ごぼう", 70, "小鉢1つ"], ["小松菜", 70, "小鉢1つ"], ["しいたけ", 50, "2〜3個"], ["オートミール", 30, "30g"], ["玄米ごはん", 150, "杯"], ["ゆでひよこ豆", 50, "50g"], ["レンズ豆（ゆで）", 50, "50g"], ["こんにゃく", 50, "1/4枚"], ["かぼちゃ", 100, "100g"]],
  ca: [["牛乳", 200, "杯"], ["無糖ヨーグルト", 100, "個"], ["小松菜", 70, "小鉢1つ"], ["木綿豆腐", 150, "丁の半分"], ["ひじき（乾）", 5, "5g"], ["プロセスチーズ", 20, "個"], ["いわし缶（味付け）", 100, "缶"], ["高野豆腐（乾）", 16, "個"]],
  fe: [["鶏レバー", 50, "50g"], ["豚レバー", 50, "50g"], ["牛もも肉（赤身）", 90, "手のひら1枚"], ["小松菜", 70, "小鉢1つ"], ["ほうれん草", 70, "小鉢1つ"], ["納豆", 45, "パック"], ["ひじき（乾）", 5, "5g"], ["木綿豆腐", 150, "丁の半分"]],
};
const byName = new Map(FOODS.map((f) => [f.name, f]));
export type FoodRow = { name: string; g: number; units: number; unitText: string; kcal: number; share: number };

// key の栄養を amount だけ、とれる量を、食品ごとに、出す（多い食品＝少ない量で、とれる順）
export function foodsFor(key: NutKey, amount: number): FoodRow[] {
  const rows: FoodRow[] = [];
  for (const [name, unitG, unitName] of L[key]) {
    const f = byName.get(name);
    const per100 = f ? ((f as unknown as Record<string, number>)[key] ?? 0) : 0;
    if (!f || per100 <= 0 || amount <= 0) continue;
    const g = (amount / per100) * 100;
    const units = g / unitG;
    const kcal = ((f.p * 4 + f.f * 9 + f.c * 4) * g) / 100;
    rows.push({ name, g: Math.round(g), units: Math.round(units * 10) / 10, unitText: unitName, kcal: Math.round(kcal), share: per100 });
  }
  return rows.sort((a, b) => a.g - b.g);
}
const COUNTERS = new Set(["個", "パック", "本", "枚", "玉", "切れ", "缶", "皿", "杯"]);
export const unitLabel = (r: FoodRow) => (COUNTERS.has(r.unitText) ? `約${r.units}${r.unitText}` : /g$/.test(r.unitText) ? "" : `${r.unitText}の約${r.units}倍`);