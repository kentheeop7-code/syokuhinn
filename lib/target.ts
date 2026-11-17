// お客様の入力（性別・年齢・身長・体重・目標体重・1日の運動量）から、1日のカロリーとPFCの目標を出す（ブラウザの保存データを読む）。
import { readMe } from "../app/me";
import { calcEnergy } from "./energy";

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
    const e = calcEnergy({ sex: sexKey, band, age, height, weight: now, bmr: 0, bodyFat: 0, muscle: 0, pal: me.pal, targetWeight: num(p.weight), pace: "slow" });
    if (!e) return null;
    return { kcal: e.target, tdee: e.tdee, floor: e.floorKcal, p: e.protein, f: e.fat, c: e.carb, weight: now, targetWeight: num(p.weight), kind: e.kind, youth: band <= 1, sexKey, band, label: e.label, floored: e.floored, capped: e.capped };
  } catch {
    return null;
  }
}
