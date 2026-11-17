// 1日のカロリー・PFC・食事量を、LINEなどで共有できる文章にする。
import { goalOf } from "./meals";
import { mealGuide } from "./mealguide";
import type { Target } from "./target";

export const SPLIT = [
  { label: "朝", r: 0.25 },
  { label: "昼", r: 0.35 },
  { label: "夜", r: 0.3 },
  { label: "間食", r: 0.1 },
];
const r10 = (n: number) => Math.round(n / 10) * 10;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function planNumbers(t: Target) {
  const pPct = Math.round(((t.p * 4) / t.kcal) * 100);
  const fPct = Math.round(((t.f * 9) / t.kcal) * 100);
  const cPct = 100 - pPct - fPct;
  const gl = goalOf(t.sexKey, t.band);
  const guide = mealGuide(t.kcal, t.p, t.c);
  const weeks = t.kind === "lose" && t.tdee - t.kcal > 50 ? Math.min(104, Math.ceil(((t.weight - t.targetWeight) * 7200) / (t.tdee - t.kcal) / 7)) : 0;
  return {
    pPct,
    fPct,
    cPct,
    fiber: parseFloat(gl.fi || "0"),
    salt: gl.salt,
    guide,
    weeks,
    perKg: t.weight > 0 ? r1(t.p / t.weight) : 0,
    meals: SPLIT.map((s) => ({ label: s.label, kcal: r10(t.kcal * s.r), p: Math.round(t.p * s.r), f: Math.round(t.f * s.r), c: Math.round(t.c * s.r) })),
  };
}

export function buildPlanText(t: Target): string {
  const n = planNumbers(t);
  const L: string[] = [];
  L.push("【あなたの1日の目安】");
  L.push(`目標：約${t.kcal.toLocaleString()}kcal／日（維持 約${t.tdee.toLocaleString()}kcal${t.bmr ? `・基礎代謝 約${t.bmr.toLocaleString()}kcal` : ""}）`);
  if (t.kind === "lose") L.push(`体重：${t.weight}kg → ${t.targetWeight}kg${n.weeks ? `（約${n.weeks}週間）` : ""}`);
  L.push(`たんぱく質 ${t.p}g（${n.pPct}%）／脂質 ${t.f}g（${n.fPct}%）／炭水化物 ${t.c}g（${n.cPct}%）`);
  L.push("");
  L.push("【食事ごとの目安】");
  n.meals.forEach((m) => L.push(`${m.label}：約${m.kcal}kcal（P${m.p}・F${m.f}・C${m.c}g）`));
  L.push("");
  L.push("【1日の食事量の目安】");
  L.push(`ごはん 茶碗${n.guide.rice}杯ぶん（1食 約${n.guide.perMeal.rice}杯）`);
  L.push(`肉・魚・卵・大豆 手のひら${n.guide.palms}枚ぶん（1食 約${n.guide.perMeal.palms}枚）`);
  L.push(`野菜 ${n.guide.veg}皿（小鉢）／乳製品 ${n.guide.dairy}つ／果物 ${n.guide.fruit}つ`);
  L.push(`食物繊維 ${n.fiber}g以上／食塩 ${n.salt}g未満／水分 水・お茶で4杯以上`);
  L.push("");
  L.push(`※ ${t.accuracyText}${t.floored ? "下限（女性1,200・男性1,500kcalか基礎代謝）に合わせています。" : ""}診断ではなく目安です。持病・服薬のある方は、主治医・管理栄養士の指示が優先です。`);
  return L.join("\n");
}

