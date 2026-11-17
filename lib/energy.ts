// お客様の体のデータから、1日の目標カロリーを、自動で計算する。
// 使う方法は、入力できたデータで、決まる（上から順に）：
//  ① 基礎代謝（体組成計などの値）が、ある ② 体脂肪率がある → 除脂肪量から ③ 身長・年齢・体重がある → Mifflin-St Jeor式 ④ どれもない → 食事摂取基準の、推定エネルギー必要量
// 中学生・高校生は、大人の式を使わない（④のみ）。診断や処方ではなく、目安です。
import { REF } from "../app/me";
import { paceRate, type Pace } from "./goal";

export type EnergyIn = { sex: "f" | "m"; band: number; age: number; height: number; weight: number; bmr: number; bodyFat: number; muscle: number; pal: number; targetWeight: number; pace: Pace; palValue?: number };
export type EnergyOut = {
  method: "measured" | "ffm" | "mifflin" | "dri";
  label: string;
  bmr: number; // 0＝使わない
  ffm: number; // 除脂肪量（kg）。0＝不明
  pal: number;
  tdee: number; // 維持のカロリー
  target: number; // 1日の目標
  diff: number; // 維持との差（kcal/日）。負＝減らす
  kind: "lose" | "gain" | "keep";
  floored: boolean;
  capped: boolean;
  floorKcal: number; // これ以下には、しない（代謝を守る下限）
  protein: number;
  fat: number;
  carb: number;
  notes: string[];
  refs: { label: string; pmid: string }[];
};
export const PAL_VAL = [1.5, 1.75, 2.0];
const r10 = (n: number) => Math.round(n / 10) * 10;

export function calcEnergy(i: EnergyIn): EnergyOut | null {
  const youth = i.band <= 1 || (i.age > 0 && i.age < 18);
  const pal = Math.min(2, Math.max(0, i.pal));
  const notes: string[] = [];
  const refs: EnergyOut["refs"] = [];
  let method: EnergyOut["method"] = "dri";
  let bmr = 0;
  let ffm = 0;
  if (!youth && i.weight > 0) {
    if (i.bodyFat > 0 && i.bodyFat < 70) ffm = i.weight * (1 - i.bodyFat / 100);
    if (i.bmr > 400) {
      method = "measured";
      bmr = i.bmr;
      notes.push("体組成計などの基礎代謝の値を、そのまま使っています。機器による誤差があります。");
    } else if (ffm > 0) {
      method = "ffm";
      bmr = 19.7 * ffm + 413;
      refs.push({ label: "Mifflin 1990 Am J Clin Nutr（除脂肪量からの式：19.7×除脂肪量＋413）", pmid: "2305711" });
      notes.push("体脂肪率から、除脂肪量を出し、式で基礎代謝を求めています。体脂肪率の機器の誤差が、そのまま入ります。");
    } else if (i.height > 0 && i.age > 0) {
      method = "mifflin";
      bmr = 10 * i.weight + 6.25 * i.height - 5 * i.age + (i.sex === "m" ? 5 : -161);
      refs.push({ label: "Mifflin 1990 Am J Clin Nutr（Mifflin-St Jeor式。498人・間接熱量測定）", pmid: "2305711" });
      refs.push({ label: "Frankenfield 2005 J Am Diet Assoc（系統的レビュー：この式が、最も信頼できた）", pmid: "15883556" });
    }
  }
  const palV = i.palValue && i.palValue >= 1.3 && i.palValue <= 2.3 ? i.palValue : PAL_VAL[pal];
  const tdee = bmr > 0 ? bmr * palV : i.palValue && REF[i.sex].kcal[i.band] ? (REF[i.sex].kcal[i.band][1] / PAL_VAL[1]) * palV : REF[i.sex].kcal[i.band]?.[pal] ?? 0;
  if (!tdee) return null;
  const label = method === "measured" ? "基礎代謝（入力値）× 活動量" : method === "ffm" ? "体脂肪率から（除脂肪量の式）× 活動量" : method === "mifflin" ? "Mifflin-St Jeor式（身長・年齢・体重）× 活動量" : "食事摂取基準の、推定エネルギー必要量（性別・年代・活動量）";
  if (method === "dri") {
    refs.push({ label: "厚生労働省 日本人の食事摂取基準（2025年版）の、推定エネルギー必要量", pmid: "" });
    if (youth) notes.push("中学生・高校生は、大人の計算式を使わず、年代の目安だけを使います。減量の計算は、行いません。");
    else notes.push("体のデータが足りないため、年代・性別の目安を使っています。基礎代謝などを入れると、より個人に合います。");
  } else notes.push(`活動量の係数は、${palV}（食事摂取基準の区分：低い1.50・ふつう1.75・高い2.00。生活習慣の入力がある場合は、その間を、このアプリが補っています）です。`);

  const w = i.weight;
  const kind: EnergyOut["kind"] = youth || !w || !i.targetWeight || Math.abs(w - i.targetWeight) < 0.4 ? "keep" : i.targetWeight < w ? "lose" : "gain";
  let target = tdee;
  let capped = false;
  let floored = false;
  if (kind === "lose") {
    const want = (paceRate(w, "lose", i.pace) * 7200) / 7;
    // 代謝を落としにくくするため、減らす幅は、維持の15%まで（しっかり＝20%まで）
    const cap = tdee * (i.pace === "fast" ? 0.2 : 0.15);
    capped = want > cap;
    target = tdee - Math.min(want, cap);
    const floor = Math.max(i.sex === "f" ? 1200 : 1500, bmr > 0 ? bmr : 0);
    if (target < floor) {
      target = floor;
      floored = true;
    }
    refs.push({ label: "Hall 2011 Lancet（体重の変化は、ゆっくり。減るにつれて、減りかたが緩やかになる）", pmid: "21872751" });
    notes.push(capped ? `ペースが速すぎるため、代謝を守るよう、維持のカロリーの${i.pace === "fast" ? 20 : 15}%までの減らしかたに、抑えています。` : "維持のカロリーから、ペースに応じた分を引いています（体重1kg＝約7,200kcalの目安）。");
    if (floored) notes.push("目標が低くなりすぎないよう、下限（女性1,200・男性1,500kcal、または基礎代謝）に、そろえました。");
  } else if (kind === "gain") {
    target = tdee + 250;
    notes.push("増量は、維持のカロリーに、約250kcalを足す、ゆるやかな設定です。");
  }
  target = r10(target);
  const protein = Math.round(Math.min(1.6 * (w || 0), (0.35 * target) / 4) || (REF[i.sex].protein[i.band] ?? 50));
  const fat = Math.round((0.25 * target) / 9);
  const carb = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  if (w > 0 && !youth) refs.push({ label: "Morton 2018 Br J Sports Med（たんぱく質：体重1kgあたり 約1.6g/日）", pmid: "28698222" });
  const floorKcal = r10(Math.max(i.sex === "f" ? 1200 : 1500, bmr > 0 ? bmr : 0));
  return { method, label, floorKcal, bmr: Math.round(bmr), ffm: Math.round(ffm * 10) / 10, pal: palV, tdee: r10(tdee), target, diff: target - r10(tdee), kind, floored, capped, protein, fat, carb, notes, refs };
}
// 体重が減るにつれて、必要なカロリーも、少し変わる。4週ごとに、その時の体重で、計算し直した「カロリー計画」。
export type Phase = { from: number; to: number; weight: number; target: number; tdee: number; floor: number };
export function energyPhases(i: EnergyIn, pts: { x: number; y: number }[], weeks: number): Phase[] {
  if (!pts.length || weeks <= 0 || i.weight <= 0) return [];
  const ffm = i.bodyFat > 0 ? i.weight * (1 - i.bodyFat / 100) : 0;
  const out: Phase[] = [];
  for (let start = 0; start < Math.min(weeks, 26); start += 4) {
    const W = pts[Math.min(start, pts.length - 1)].y;
    const bf2 = ffm > 0 ? Math.max(5, ((W - ffm) / W) * 100) : 0;
    const bmr2 = i.bmr > 400 ? i.bmr + 10 * (W - i.weight) : 0; // 体重1kgで、基礎代謝が、約10kcal（Mifflin式の体重の係数）変わる
    const e = calcEnergy({ ...i, weight: W, bodyFat: bf2, bmr: bmr2 });
    if (!e) continue;
    out.push({ from: start + 1, to: Math.min(start + 4, weeks), weight: W, target: e.target, tdee: e.tdee, floor: e.floorKcal });
  }
  return out;
}
