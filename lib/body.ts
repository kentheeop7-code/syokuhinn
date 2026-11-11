// お客様の体のデータ（任意）から、BMI・体脂肪量・除脂肪量などを、計算する。
// BMIの区分：日本肥満学会の基準（18.5未満＝低体重、18.5〜25未満＝普通体重、25以上＝肥満（1度25〜30、2度30〜35、3度35〜40、4度40以上））。
// 体脂肪率・内臓脂肪レベルの区分は、体組成計の機器ごとに、ちがう。ここでは、値を示すだけにして、判定は、しない（内臓脂肪レベルのみ、一般的な区分）。
export type BodyIn = { height: number; weight: number; targetWeight: number; bodyFat: number; fatMass: number; muscle: number; visceral: number; bmiIn: number };
export type BmiBand = { from: number; to: number; label: string; color: string };
export const BMI_BANDS: BmiBand[] = [
  { from: 14, to: 18.5, label: "低体重", color: "#7fb3e6" },
  { from: 18.5, to: 25, label: "普通", color: "#6cc08b" },
  { from: 25, to: 30, label: "肥満1度", color: "#f0c25a" },
  { from: 30, to: 35, label: "肥満2度", color: "#ee9a4d" },
  { from: 35, to: 40, label: "肥満3度", color: "#e0694f" },
];
export const bmiLabel = (b: number) => (b < 18.5 ? "低体重" : b < 25 ? "普通体重" : b < 30 ? "肥満（1度）" : b < 35 ? "肥満（2度）" : b < 40 ? "肥満（3度）" : "肥満（4度）");
export const visceralLabel = (v: number) => (v <= 0 ? "" : v <= 9 ? "標準" : v <= 14 ? "やや高い" : "高い");
export type BodyOut = {
  bmi: number;
  bmiCat: string;
  bmiGoal: number;
  bmiGoalCat: string;
  std22: number; // BMI22の体重（標準体重）
  fatPct: number;
  fatKg: number;
  ffm: number;
  goalFatKg: number;
  goalFatPct: number;
  musclePct: number;
  visceral: number;
  visceralCat: string;
  notes: string[];
  has: boolean; // 体組成（脂肪・除脂肪）が、そろっているか
};
const R1 = (n: number) => Math.round(n * 10) / 10;

export function analyzeBody(i: BodyIn): BodyOut | null {
  const h = i.height / 100;
  const w = i.weight;
  const notes: string[] = [];
  // 小数第1位で、丸めてから、区分する（25.0が、浮動小数点の誤差で、24.99…になるのを、防ぐ）
  const bmi = R1(i.bmiIn > 0 ? i.bmiIn : h > 0 && w > 0 ? w / (h * h) : 0);
  const bmiGoal = R1(h > 0 && i.targetWeight > 0 ? i.targetWeight / (h * h) : 0);
  let fatPct = 0;
  if (i.bodyFat > 0 && i.bodyFat < 70) fatPct = i.bodyFat;
  else if (i.fatMass > 0 && w > 0) fatPct = (i.fatMass / w) * 100;
  const fatKg = w > 0 && fatPct > 0 ? (w * fatPct) / 100 : 0;
  const ffm = fatKg > 0 ? w - fatKg : 0;
  if (i.bodyFat > 0 && i.fatMass > 0 && w > 0 && Math.abs((i.fatMass / w) * 100 - i.bodyFat) > 2) notes.push("体脂肪率と体脂肪量が、合っていません。入力を、確かめてください（体脂肪率を、使っています）。");
  let goalFatKg = 0;
  let goalFatPct = 0;
  if (ffm > 0 && i.targetWeight > 0) {
    goalFatKg = i.targetWeight - ffm;
    if (goalFatKg > 0) goalFatPct = (goalFatKg / i.targetWeight) * 100;
    else {
      goalFatKg = 0;
      notes.push("目標の体重が、いまの除脂肪量より小さく、筋肉などを減らす計算になります。目標を見直してください。");
    }
  }
  const musclePct = i.muscle > 0 && w > 0 ? (i.muscle / w) * 100 : 0;
  if (!bmi && !fatPct && !i.muscle && !i.visceral) return null;
  if (fatPct > 0) notes.push("体脂肪の値は、体組成計の機器・測る時間（食事・水分・運動の後）で、変わります。1回の値より、同じ条件での、変化を見ます。");
  return {
    bmi: R1(bmi),
    bmiCat: bmi ? bmiLabel(bmi) : "",
    bmiGoal: R1(bmiGoal),
    bmiGoalCat: bmiGoal ? bmiLabel(bmiGoal) : "",
    std22: h > 0 ? R1(h * h * 22) : 0,
    fatPct: R1(fatPct),
    fatKg: R1(fatKg),
    ffm: R1(ffm),
    goalFatKg: R1(goalFatKg),
    goalFatPct: R1(goalFatPct),
    musclePct: R1(musclePct),
    visceral: i.visceral,
    visceralCat: visceralLabel(i.visceral),
    notes,
    has: fatPct > 0 && ffm > 0,
  };
}