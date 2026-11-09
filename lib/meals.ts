// かんたん入力の、共通の部品（ホームと、トレーナー用で使う）。
import { U } from "../app/BalanceCheck";
import { amountOf } from "./microLookup";

export type Tile = { id: string; icon: string; label: string; vals: Record<string, number> };
export type Slot = { id: string; icon: string; label: string; tiles: Tile[] };

export const SLOTS: Slot[] = [
  {
    id: "am",
    icon: "SUN",
    label: "朝",
    tiles: [
      { id: "am-wa", icon: "🍚", label: "ごはん・卵・みそ汁", vals: { rice: 1, egg: 1, soup: 1 } },
      { id: "am-natto", icon: "🫘", label: "納豆ごはん", vals: { rice: 1, soy: 1, soup: 1 } },
      { id: "am-pan", icon: "🥐", label: "パン・卵", vals: { bread: 2, egg: 1 } },
      { id: "am-light", icon: "🥖", label: "パン・牛乳", vals: { bread: 1, milk: 1 } },
      { id: "am-yo", icon: "🍓", label: "ヨーグルト・果物", vals: { yogurt: 1, fruit: 1 } },
      { id: "am-oats", icon: "🥣", label: "シリアル・オートミール", vals: { oats: 1, milk: 1 } },
      { id: "am-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "noon",
    icon: "SUNNY",
    label: "昼",
    tiles: [
      { id: "no-set", icon: "🍱", label: "定食（ごはん・主菜・汁）", vals: { rice: 1, chicken: 1, veg: 1, soup: 1 } },
      { id: "no-men", icon: "🍜", label: "麺類", vals: { noodle: 1, out: 1 } },
      { id: "no-don", icon: "🍛", label: "丼・カレー", vals: { rice: 2, stir: 1, out: 1 } },
      { id: "no-conv", icon: "🍙", label: "コンビニ弁当", vals: { rice: 1, fried: 1, out: 1 } },
      { id: "no-onigiri", icon: "🥗", label: "おにぎり・サラダチキン", vals: { rice: 1, chicken: 1, salad: 1 } },
      { id: "no-sand", icon: "🥪", label: "サンドイッチ・パン", vals: { bread: 2, egg: 1, out: 1 } },
      { id: "no-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "pm",
    icon: "MOON",
    label: "夜",
    tiles: [
      { id: "pm-fish", icon: "🐟", label: "魚の定食", vals: { rice: 1, fish: 1, greenveg: 1, soup: 1 } },
      { id: "pm-meat", icon: "🍖", label: "肉料理", vals: { rice: 1, meat: 1, veg: 1, stir: 1 } },
      { id: "pm-nabe", icon: "🍲", label: "鍋・煮物", vals: { chicken: 1, veg: 2, soy: 1, mush: 1 } },
      { id: "pm-fry", icon: "🍤", label: "揚げ物", vals: { rice: 1, fried: 1, salad: 1 } },
      { id: "pm-men", icon: "🍝", label: "麺類", vals: { noodle: 1 } },
      { id: "pm-out", icon: "🍻", label: "外食・居酒屋", vals: { out: 1, fried: 1, rice: 1 } },
      { id: "pm-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "snack",
    icon: "COOKIE",
    label: "おやつ・飲み物",
    tiles: [
      { id: "sn-cake", icon: "🍰", label: "菓子パン・ケーキ", vals: { cake: 1 } },
      { id: "sn-choco", icon: "🍫", label: "チョコ・スナック", vals: { snack: 1 } },
      { id: "sn-fruit", icon: "🍎", label: "果物", vals: { fruit: 1 } },
      { id: "sn-yo", icon: "🥛", label: "ヨーグルト", vals: { yogurt: 1 } },
      { id: "sn-sugar", icon: "🥤", label: "甘い飲み物", vals: { sugar: 1 } },
      { id: "sn-alc", icon: "🍺", label: "お酒", vals: { alcohol: 1 } },
      { id: "sn-none", icon: "⭕", label: "とらない", vals: {} },
    ],
  },
];
export const ICON: Record<string, string> = { SUN: "🌅", SUNNY: "☀", MOON: "🌙", COOKIE: "🍪" };

export const SIZES = [
  { t: "少なめ", m: 0.7 },
  { t: "ふつう", m: 1 },
  { t: "多め", m: 1.4 },
];
// 「足したもの」：1食に、ちょっと足したもの。タップするたびに、0→1→2→0。
export const EXTRAS: { k: string; icon: string; label: string }[] = [
  { k: "salad", icon: "🥗", label: "サラダ" },
  { k: "veg", icon: "🥦", label: "野菜" },
  { k: "soup", icon: "🍲", label: "汁物" },
  { k: "egg", icon: "🥚", label: "卵" },
  { k: "soy", icon: "🫘", label: "納豆・豆腐" },
  { k: "meat", icon: "🍖", label: "肉" },
  { k: "fish", icon: "🐟", label: "魚" },
  { k: "rice", icon: "🍚", label: "ごはん" },
  { k: "fruit", icon: "🍎", label: "果物" },
  { k: "fried", icon: "🍤", label: "揚げ物" },
  { k: "sugar", icon: "🥤", label: "甘い飲み物" },
];
export type St = { date: string; size: Record<string, number>; ext: Record<string, number> };
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export const kc = (vals: Record<string, number>, m = 1) => Object.entries(vals).reduce((s, [k, v]) => s + (U[k]?.kcal ?? 0) * v * m, 0);
export const r10 = (n: number) => Math.round(n / 10) * 10;


// 食事の選びかたから、1日ぶんの食品の数（BalanceCheckの入力）に直す
export function buildVals(n: St): Record<string, number> {
  const vals: Record<string, number> = {};
  SLOTS.forEach((s) =>
    s.tiles.forEach((t) => {
      const z = n.size[t.id];
      if (z !== undefined) for (const [k, v] of Object.entries(t.vals)) vals[k] = (vals[k] ?? 0) + v * SIZES[z].m;
    })
  );
  for (const [key, c] of Object.entries(n.ext)) {
    const k = key.split(":")[1];
    if (c > 0) vals[k] = (vals[k] ?? 0) + c;
  }
  return vals;
}

// 1日の合計（調理の油・調味料の分を、1日1回ぶん足す。くわしい入力と、同じ計算）
export type Tot = { any: boolean; kcal: number; p: number; f: number; c: number; fi: number; salt: number };
export function totals(n: St): Tot {
  const all = buildVals(n);
  const t: Tot = { any: Object.keys(all).length > 0, kcal: 0, p: 0, f: 0, c: 0, fi: 0, salt: 0 };
  if (!t.any) return t;
  for (const [k, v] of Object.entries({ ...all, base: 1 })) {
    const u = U[k];
    if (!u) continue;
    t.kcal += u.kcal * v;
    t.p += u.p * v;
    t.f += u.f * v;
    t.c += u.c * v;
    t.fi += u.fi * v;
    t.salt += u.salt * v;
  }
  return t;
}

export function slotKcal(n: St, s: Slot): number {
  let v = 0;
  s.tiles.forEach((t) => {
    const z = n.size[t.id];
    if (z !== undefined) v += kc(t.vals, SIZES[z].m);
  });
  for (const [key, c] of Object.entries(n.ext)) if (key.startsWith(s.id + ":")) v += kc({ [key.split(":")[1]]: c });
  return v;
}

// 文章にする（お客様に送る用）：「朝：ごはん・卵・みそ汁（ふつう）＋サラダ」
export function describe(n: St): string[] {
  const out: string[] = [];
  for (const s of SLOTS) {
    const parts: string[] = [];
    s.tiles.forEach((t) => {
      const z = n.size[t.id];
      if (z !== undefined) parts.push(t.id.endsWith("-none") ? t.label : `${t.label}（${SIZES[z].t}）`);
    });
    for (const [key, c] of Object.entries(n.ext)) {
      if (!key.startsWith(s.id + ":")) continue;
      const x = EXTRAS.find((e) => e.k === key.split(":")[1]);
      if (x) parts.push(`＋${x.label}${c > 1 ? `×${c}` : ""}`);
    }
    if (parts.length) out.push(`${s.label}：${parts.join("、")}（約${r10(slotKcal(n, s)).toLocaleString()}kcal）`);
  }
  return out;
}

export const goalOf = (sexKey: "f" | "m", band: number) => ({ p: amountOf("たんぱく質", sexKey, band), fi: amountOf("食物繊維", sexKey, band), salt: sexKey === "m" ? 7.5 : 6.5 });