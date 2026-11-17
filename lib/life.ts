// 生活習慣（仕事の動き・歩数・運動・睡眠）から、身体活動レベル（PAL）を、細かく見積もる。
// 土台：日本人の食事摂取基準（2025年版）の身体活動レベル：低い1.50（座位中心）・ふつう1.75（座位中心＋移動・立位・家事・軽い運動）・高い2.00（移動や立位の多い仕事／活発な運動習慣）。
// その間の値は、このアプリが、生活習慣の入力から補った目安です（論文の数値ではありません）。
export type Life = {
  job: "sit" | "mix" | "stand" | "heavy";
  steps: string; // 1日の歩数
  strength: string; // 筋トレ 週何回
  cardio: string; // 有酸素運動 週何分
  sleep: string; // 睡眠 時間
  bodyFat: string; // 体脂肪率（任意）
  bmr: string; // 基礎代謝（体組成計の値・任意）
  condition: boolean; // 持病・服薬あり
  pace: "slow" | "mid";
};
export const DEFAULT_LIFE: Life = { job: "mix", steps: "", strength: "", cardio: "", sleep: "", bodyFat: "", bmr: "", condition: false, pace: "slow" };
export const LIFE_KEY = "lg-life";

export const JOBS: { k: Life["job"]; t: string; d: string }[] = [
  { k: "sit", t: "ほぼ座り仕事", d: "デスクワーク・在宅" },
  { k: "mix", t: "座り＋移動", d: "立ったり歩いたり、家事・育児" },
  { k: "stand", t: "立ち仕事", d: "接客・販売・介護・保育" },
  { k: "heavy", t: "体を動かす仕事", d: "運搬・工事・農業など" },
];
const num = (s: string) => parseFloat(s) || 0;

export function readLife(): Life {
  try {
    const s = JSON.parse(localStorage.getItem(LIFE_KEY) || "null");
    return s ? { ...DEFAULT_LIFE, ...s } : DEFAULT_LIFE;
  } catch {
    return DEFAULT_LIFE;
  }
}

// 生活習慣が、ほとんど入っていないときは null（＝3段階の活動量を使う）
export function palFromLife(l: Life): { v: number; parts: string[] } | null {
  const steps = num(l.steps);
  const st = num(l.strength);
  const cd = num(l.cardio);
  const any = steps > 0 || st > 0 || cd > 0;
  if (!any) return null;
  const base = { sit: 1.4, mix: 1.55, stand: 1.7, heavy: 1.9 }[l.job];
  const parts = [`仕事・日常の動き ${base.toFixed(2)}`];
  let v = base;
  if (steps > 0) {
    const a = steps < 4000 ? -0.05 : steps < 7000 ? 0 : steps < 10000 ? 0.05 : 0.1;
    v += a;
    parts.push(`歩数 ${a >= 0 ? "+" : ""}${a.toFixed(2)}`);
  }
  if (st > 0) {
    const a = Math.min(0.08, st * 0.02);
    v += a;
    parts.push(`筋トレ +${a.toFixed(2)}`);
  }
  if (cd > 0) {
    const a = Math.min(0.12, (cd / 60) * 0.02);
    v += a;
    parts.push(`有酸素 +${a.toFixed(2)}`);
  }
  v = Math.min(2.1, Math.max(1.4, Math.round(v * 100) / 100));
  return { v, parts };
}
