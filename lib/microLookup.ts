import { DRI_TABLE } from "./driTable";
import { REF } from "../app/me";

// 栄養素の名前から、その人（性別・年齢）の1日の目安を、文字で返す。分からない名前は、null。
const KEY: Record<string, string> = {
  ビタミンA: "vA",
  ビタミンD: "vD",
  ビタミンE: "vE",
  ビタミンK: "vK",
  ビタミンC: "vC",
  ビタミンB1: "b1",
  ビタミンB2: "b2",
  ビタミンB6: "b6",
  ビタミンB12: "b12",
  ナイアシン: "nia",
  葉酸: "fol",
  カルシウム: "ca",
  マグネシウム: "mg",
  鉄: "fe",
  亜鉛: "zn",
  銅: "cu",
  ヨウ素: "io",
  セレン: "se",
};
const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : String(Math.round(n * 10) / 10));

export function amountOf(name: string, sexKey: "f" | "m", band: number): string | null {
  const n = name.replace(/\s/g, "");
  if (n === "たんぱく質") return `${REF[sexKey].protein[band]}g以上`;
  if (n === "食物繊維") return `${REF[sexKey].fiber[band]}g以上`;
  if (n === "カリウム") return `${REF[sexKey].k[band].toLocaleString()}mg以上`;
  const k = KEY[n];
  if (!k) return null;
  const r = DRI_TABLE.find((x) => x.key === k);
  if (!r) return null;
  return `${fmt((sexKey === "f" ? r.f : r.m)[band])}${r.unit}`;
}

// 「ビタミンB2・B6」のような、まとめた名前を、ばらして返す
export function splitNames(name: string): string[] {
  const m = name.match(/^ビタミン(B\d+)・(B\d+)$/);
  if (m) return [`ビタミン${m[1]}`, `ビタミン${m[2]}`];
  return [name];
}
