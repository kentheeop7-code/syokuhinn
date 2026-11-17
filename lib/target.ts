// お客様の入力（性別・年齢・身長・体重・目標体重・1日の運動量）から、1日のカロリーとPFCの目標を出す（ブラウザの保存データを読む）。
import { readMe } from "../app/me";
import { calcEnergy } from "./energy";
import { palFromLife, readLife } from "./life";

export type Target = {
  kcal: number; // 1日の目標
  tdee: number; // 維持のカロリー
  floor: number; // これ以下には、しない
  p: number;
  f: number;
  c: number;
  weight: number;
  targetWeight: number;
  kind: "lose" | "gain" | "keep";
  youth: boolean;
  sexKey: "f" | "m";
  band: number;
  label: string;
  floored: boolean;
  capped: boolean;
  bmr: number;
  pal: number;
  palParts: string[];
  accuracy: "高" | "中" | "標準";
  accuracyText: string;
  notes: string[];
  refs: { label: string; pmid: string }[];
  pace: "slow" | "mid";
  condition: boolean;
};
const num = (s: unknown) => parseFloat(String(s ?? "")) || 0;
export const bandOfAge = (age: number) => (age < 15 ? 0 : age < 18 ? 1 : age < 30 ? 2 : age < 50 ? 3 : age < 65 ? 4 : age < 75 ? 5 : 6);

export function readTarget(): Target | null {
  try {
    const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
    const now = num(localStorage.getItem("lg-now"));
    if (!p || now <= 0) return null;
    const age = num(p.age);
    const height = num(p.height);
    if (age < 12 || height < 100) return null;
    const me = readMe();
    const band = bandOfAge(age);
    const sexKey: "f" | "m" = me.sex === 2 ? "m" : "f";
    const life = readLife();
    const palL = palFromLife(life);
    const pace: "slow" | "mid" = life.condition ? "slow" : life.pace;
    const e = calcEnergy({ sex: sexKey, band, age, height, weight: now, bmr: num(life.bmr), bodyFat: num(life.bodyFat), muscle: 0, pal: me.pal, targetWeight: num(p.weight), pace, palValue: palL?.v });
    if (!e) return null;
    const accuracy: Target["accuracy"] = e.method === "measured" ? "高" : e.method === "ffm" || e.method === "mifflin" ? (palL ? "高" : "中") : "標準";
    const accuracyText = e.method === "measured" ? "体組成計の基礎代謝を使っているため、精度が高い計算です。" : e.method === "ffm" ? "体脂肪率から除脂肪量を出して計算しています。" : e.method === "mifflin" ? "身長・年齢・体重から基礎代謝を出して、生活習慣の活動量を掛けています。" : "年代・性別の目安です。年齢・身長・体重を入れると、より正確になります。";
    return { kcal: e.target, tdee: e.tdee, floor: e.floorKcal, p: e.protein, f: e.fat, c: e.carb, weight: now, targetWeight: num(p.weight), kind: e.kind, youth: band <= 1, sexKey, band, label: e.label, floored: e.floored, capped: e.capped, bmr: e.bmr, pal: e.pal, palParts: palL?.parts ?? [], accuracy, accuracyText, notes: e.notes, refs: e.refs, pace, condition: life.condition };
  } catch {
    return null;
  }
}

