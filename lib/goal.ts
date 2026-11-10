// ゴールの目安：いまの体重・目標の体重・ペース・筋トレの回数から、「何週間で、何kg」を計算する。
// 週の変化の目安：減量は、体重の0.5〜1%／週（Helms 2014 / Garthe 2011。競技選手の研究）。増量は、体重の約0.25%／週（現場の目安）。
// 1kgあたり約7,200kcalは、よく使われる目安で、個人差があります。
export type Pace = "slow" | "mid" | "fast";
export const PACES: { id: Pace; t: string; d: string }[] = [
  { id: "slow", t: "ゆっくり", d: "月1kg" },
  { id: "mid", t: "ふつう", d: "週に体重の0.5%" },
  { id: "fast", t: "しっかり", d: "週に体重の0.75%" },
];
export type GoalPlan = {
  kind: "lose" | "gain";
  rate: number; // kg/週
  weeks: number;
  capped: boolean;
  pts: { x: number; y: number }[];
  marks: { week: number; kg: number; sessions: number }[];
  sessions: number;
  perDay: number; // 1日あたりのkcalの差（目安）
};
const R1 = (n: number) => Math.round(n * 10) / 10;
export function computeGoal(w: number, wt: number, days: number, pace: Pace): GoalPlan | null {
  if (!w || !wt || w === wt) return null;
  const kind = wt < w ? "lose" : "gain";
  const rate = kind === "gain" ? w * 0.0025 : pace === "slow" ? 12 / 52 : pace === "mid" ? w * 0.005 : w * 0.0075;
  const real = Math.ceil(Math.abs(w - wt) / rate);
  const weeks = Math.min(real, 52);
  const sign = kind === "lose" ? -1 : 1;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= weeks; i++) pts.push({ x: i, y: R1(real > 52 ? w + sign * rate * i : Math.abs(w - wt) <= rate * i ? wt : w + sign * rate * i) });
  const marks: { week: number; kg: number; sessions: number }[] = [];
  const step = weeks <= 12 ? 2 : weeks <= 26 ? 4 : 8;
  for (let i = step; i < weeks; i += step) marks.push({ week: i, kg: pts[i].y, sessions: i * days });
  marks.push({ week: weeks, kg: pts[weeks].y, sessions: weeks * days });
  return { kind, rate: R1(rate * 100) / 100, weeks: real, capped: real > 52, pts, marks, sessions: real * days, perDay: Math.round((rate * 7200) / 7 / 10) * 10 };
}