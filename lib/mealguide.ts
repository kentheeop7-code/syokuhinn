// 1日の目標カロリーから、「食べる量のめやす」（手ばかり）を出す。
// ごはん：茶碗1杯＝150g（炭水化物 約56g）。主菜：手のひら1枚＝肉・魚 約90g（たんぱく質 約19g）。野菜：小鉢1つ＝約70g。
// 野菜は、1日350g以上（約70gの小鉢で5つ）が、国の目標（健康日本21）。量は、平均的な目安。
export type MealGuide = { rice: number; palms: number; veg: number; dairy: number; fruit: number; perMeal: { rice: number; palms: number; veg: number }; split: { label: string; kcal: number }[] };
const half = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);
export function mealGuide(target: number, protein: number, carb: number): MealGuide {
  const p = protein > 0 ? protein : (target * 0.17) / 4;
  const c = carb > 0 ? carb : (target * 0.58) / 4;
  const rice = half((c * 0.6) / 55.7);
  const palms = half((p * 0.6) / 19);
  return {
    rice,
    palms,
    veg: 5,
    dairy: 2,
    fruit: 1,
    perMeal: { rice: half(rice / 3), palms: half(palms / 3), veg: 1.5 },
    split: [
      { label: "朝", kcal: Math.round((target * 0.25) / 10) * 10 },
      { label: "昼", kcal: Math.round((target * 0.35) / 10) * 10 },
      { label: "夜", kcal: Math.round((target * 0.3) / 10) * 10 },
      { label: "おやつ", kcal: Math.round((target * 0.1) / 10) * 10 },
    ],
  };
}