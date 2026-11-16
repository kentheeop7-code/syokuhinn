// 食品データベース（lib/foods.ts）の、どの食品でも、1回ぶん（目安の量）として、食事の選択に足せるようにする。
// キーは "f~食品名"。1回ぶん＝その食品の、最初の目安の量（1個・1杯・1切れなど）。
import { U } from "../app/BalanceCheck";
import { COMMON_FOODS, FOODS, portionsOf, type Food } from "./foods";

export const FP = "f~";
const byName = new Map(FOODS.map((f) => [f.name, f]));

export const foodKey = (name: string) => FP + name;
export const isFoodKey = (k: string) => k.startsWith(FP);
export const foodOfKey = (k: string): Food | undefined => byName.get(k.slice(FP.length));
export const portionOf = (f: Food) => portionsOf(f)[0] ?? { label: "100g", g: 100 };
export const kcalOf = (f: Food, g: number) => Math.round(((f.p * 4 + f.f * 9 + f.c * 4) * g) / 100);

// "f~食品名" の1回ぶんの栄養を、U（食品の目安表）に登録する（まだなら）。登録できたら true。
export function registerFood(k: string): boolean {
  if (!isFoodKey(k)) return false;
  if (U[k]) return true;
  const f = foodOfKey(k);
  if (!f) return false;
  const r = portionOf(f).g / 100;
  U[k] = { p: f.p * r, f: f.f * r, c: f.c * r, fi: f.fi * r, kcal: (f.p * 4 + f.f * 9 + f.c * 4) * r, salt: (f.salt ?? 0) * r, ca: (f.ca ?? 0) * r };
  return true;
}

// 食品の探しかた：ひらがな・カタカナを区別せず、よく使う食品（COMMON_FOODS）を先に出す
const ALIAS: [string, string][] = [["鮭", "さけ"], ["鯖", "さば"], ["鶏", "とり"], ["豚", "ぶた"], ["牛乳", "ぎゅうにゅう"], ["牛", "うし"], ["卵", "たまご"], ["豆腐", "とうふ"], ["納豆", "なっとう"], ["米", "こめ"], ["鯵", "あじ"], ["海老", "えび"], ["蛸", "たこ"], ["烏賊", "いか"]];
export const norm = (s: string) => {
  let t = s.trim();
  for (const [a, b] of ALIAS) t = t.split(a).join(b);
  return t.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
};
const common = new Set(COMMON_FOODS.map((f) => f.name));
const ok = (f: Food) => !f.name.includes(":") && !f.name.includes("~");

export function searchFoods(q: string, cat: string, limit = 30): Food[] {
  const k = norm(q);
  if (!k) return COMMON_FOODS.filter((f) => ok(f) && (!cat || f.cat === cat)).slice(0, limit);
  const hit = FOODS.filter((f) => ok(f) && (!cat || f.cat === cat) && norm(f.name).includes(k));
  hit.sort((a, b) => Number(common.has(b.name)) - Number(common.has(a.name)) || a.name.length - b.name.length);
  return hit.slice(0, limit);
}
