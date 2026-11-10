// かんたん入力の、共通の部品（ホームと、トレーナー用で使う）。
import { U } from "../app/BalanceCheck";
import { amountOf } from "./microLookup";

export type Tile = { id: string; icon: string; label: string; vals: Record<string, number>; cat?: string };
export type Slot = { id: string; icon: string; label: string; tiles: Tile[] };

const T = (id: string, icon: string, label: string, vals: Record<string, number>, cat: string): Tile => ({ id, icon, label, vals, cat });
const NONE = (id: string, label: string): Tile => ({ id, icon: "⭕", label, vals: {}, cat: "定番" });

// 昼・夜で、共通の、メニュー（外食・料理の種類）。量は「ふつうの1人前」の目安。食品の組み合わせからの計算で、店・量で、ずれます。
const MAIN: [string, string, string, Record<string, number>, string][] = [
  ["teishoku-tonkatsu", "🍱", "とんかつ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["teishoku-shoga", "🍱", "生姜焼き定食", { rice: 1, meat: 1, stir: 0.5, veg: 1, soup: 1 }, "和食"],
  ["teishoku-karaage", "🍱", "から揚げ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["nimono", "🍲", "煮物・おでん定食", { rice: 1, soy: 1, rootveg: 1, egg: 1, soup: 1 }, "和食"],
  ["sushi", "🍣", "寿司（8〜10貫）", { rice: 1.5, fish: 1.5, out: 0.5 }, "和食"],
  ["tendon", "🍤", "天丼・天ぷら定食", { rice: 2, fried: 1, out: 1 }, "和食"],
  ["pasta-tomato", "🍝", "パスタ（トマト・オイル系）", { noodle: 1, out: 0.5 }, "洋食・イタリアン"],
  ["pasta-cream", "🍝", "パスタ（クリーム・カルボナーラ）", { noodle: 1, stir: 1, processed: 0.5, out: 1 }, "洋食・イタリアン"],
  ["pasta-meat", "🍝", "パスタ（ミートソース）", { noodle: 1, meat: 0.5, out: 0.5 }, "洋食・イタリアン"],
  ["pizza", "🍕", "ピザ（3切れ）", { bread: 2, yogurt: 1.5, processed: 1, out: 1 }, "洋食・イタリアン"],
  ["risotto", "🍚", "リゾット・ドリア", { rice: 1.5, yogurt: 1, stir: 0.5, out: 1 }, "洋食・イタリアン"],
  ["italian-set", "🥗", "イタリアン（前菜サラダ＋パスタ少なめ＋魚）", { salad: 1, noodle: 0.7, fish: 1, veg: 1 }, "洋食・イタリアン"],
  ["hamburg", "🍔", "ハンバーグ定食", { rice: 1, meat: 1, stir: 0.5, veg: 1, soup: 1 }, "洋食・イタリアン"],
  ["omurice", "🍳", "オムライス", { rice: 2, egg: 2, stir: 0.5, out: 0.5 }, "洋食・イタリアン"],
  ["stew", "🥘", "シチュー・グラタン＋パン", { yogurt: 1, veg: 1, meat: 0.5, stir: 0.5, bread: 1, out: 1 }, "洋食・イタリアン"],
  ["steak", "🥩", "ステーキ・グリル（サラダ・ごはん）", { meat: 1.5, salad: 1, rice: 1 }, "洋食・イタリアン"],
  ["chahan", "🍚", "チャーハン", { rice: 2, egg: 1, stir: 1, out: 0.5 }, "中華"],
  ["gyoza", "🥟", "餃子定食（6個）", { rice: 1, meat: 0.5, stir: 1, veg: 0.5, soup: 1, out: 0.5 }, "中華"],
  ["mabo", "🍛", "麻婆豆腐定食", { rice: 1, soy: 1.5, stir: 1, soup: 1, out: 0.5 }, "中華"],
  ["chukadon", "🥘", "中華丼・八宝菜", { rice: 1.5, seafood: 0.5, veg: 2, stir: 0.5, out: 0.5 }, "中華"],
  ["subuta", "🍖", "酢豚・揚げ物の中華定食", { rice: 1, meat: 0.5, fried: 1, veg: 0.5, soup: 1 }, "中華"],
  ["tanmen", "🍜", "タンメン（野菜たっぷりの麺）", { noodle: 1, veg: 2, out: 0.5 }, "中華"],
  ["dimsum", "🥢", "点心・飲茶（蒸し料理）", { meat: 0.5, seafood: 0.5, veg: 1, soy: 0.5, rice: 0.5 }, "中華"],
  ["bibimbap", "🍲", "ビビンバ", { rice: 1.5, egg: 1, greenveg: 1, veg: 1, meat: 0.5, out: 0.5 }, "韓国・焼肉"],
  ["sundubu", "🍲", "スンドゥブ（豆腐チゲ）＋ごはん", { rice: 1, soy: 1.5, seafood: 0.5, veg: 1, out: 0.5 }, "韓国・焼肉"],
  ["yakiniku", "🥓", "焼肉（肉・野菜・ごはん）", { rice: 1, meat: 2, veg: 1, salad: 1, out: 0.5 }, "韓国・焼肉"],
  ["yakiniku-lean", "🥩", "焼肉（赤身中心・野菜多め）", { rice: 1, meat: 1.5, veg: 2, salad: 1 }, "韓国・焼肉"],
  ["chijimi", "🥞", "チヂミ・ナムル＋ごはん", { veg: 1.5, egg: 1, stir: 0.5, rice: 1 }, "韓国・焼肉"],
  ["ramen", "🍜", "ラーメン", { noodle: 1.2, processed: 0.5, out: 1 }, "麺・丼"],
  ["tsukemen", "🍜", "つけ麺", { noodle: 1.5, processed: 0.5, out: 1 }, "麺・丼"],
  ["udon", "🍜", "かけうどん・そば", { noodle: 1, soy: 0.3 }, "麺・丼"],
  ["yakisoba", "🍝", "焼きそば", { noodle: 1, stir: 1, veg: 0.5, processed: 0.5 }, "麺・丼"],
  ["gyudon", "🍚", "牛丼", { rice: 2, meat: 1, out: 1 }, "麺・丼"],
  ["oyakodon", "🍳", "親子丼", { rice: 2, chicken: 1, egg: 1.5, out: 0.5 }, "麺・丼"],
  ["katsudon", "🍳", "カツ丼", { rice: 2, fried: 1, egg: 1, out: 0.5 }, "麺・丼"],
  ["curry", "🍛", "カレーライス", { rice: 2, stir: 1.5, veg: 0.5, meat: 0.5, out: 0.5 }, "麺・丼"],
  ["burger", "🍔", "ハンバーガー＋ポテト", { bread: 2, meat: 1, fried: 1.5, out: 1 }, "ファスト・カフェ"],
  ["fried-chicken", "🍗", "フライドチキン・ナゲット", { fried: 2, bread: 0.5, out: 1 }, "ファスト・カフェ"],
  ["cafe-sand", "🥪", "カフェのサンドイッチ＋ラテ", { bread: 2, egg: 1, milk: 1, out: 0.5 }, "ファスト・カフェ"],
  ["cafe-pasta", "🍝", "カフェランチ（パスタ＋サラダ）", { noodle: 1, salad: 1, out: 1 }, "ファスト・カフェ"],
  ["bowl", "🥗", "サラダボウル（チキン・野菜・穀物）", { salad: 2, chicken: 1, brown: 1, veg: 1 }, "ファスト・カフェ"],
  ["salad-only", "🥗", "サラダだけ", { salad: 2, veg: 1 }, "軽め"],
  ["soup-salad", "🥣", "スープ＋サラダ", { soup: 1, salad: 1, veg: 1 }, "軽め"],
  ["tofu-light", "🫘", "豆腐・納豆＋野菜（軽め）", { soy: 2, veg: 2, rice: 0.5 }, "軽め"],
  ["shake", "🥤", "プロテイン・牛乳＋バナナ", { milk: 1, fruit: 1, nuts: 0.5 }, "軽め"],
  ["juice-only", "🧃", "ジュース・ゼリーだけ", { sugar: 1.5 }, "軽め"],
  ["veg-juice", "🥬", "野菜ジュース・スープだけ", { veg: 1, sugar: 0.3, soup: 0.5 }, "軽め"],
];
const main = (p: string): Tile[] => MAIN.map(([k, icon, label, vals, cat]) => T(`${p}-x-${k}`, icon, label, vals, cat));

export const SLOTS: Slot[] = [
  {
    id: "am",
    icon: "SUN",
    label: "朝",
    tiles: [
      T("am-wa", "🍚", "ごはん・卵・みそ汁", { rice: 1, egg: 1, soup: 1 }, "定番"),
      T("am-natto", "🫘", "納豆ごはん", { rice: 1, soy: 1, soup: 1 }, "定番"),
      T("am-pan", "🥐", "パン・卵", { bread: 2, egg: 1 }, "定番"),
      T("am-light", "🥖", "パン・牛乳", { bread: 1, milk: 1 }, "定番"),
      T("am-yo", "🍓", "ヨーグルト・果物", { yogurt: 1, fruit: 1 }, "定番"),
      T("am-oats", "🥣", "シリアル・オートミール", { oats: 1, milk: 1 }, "定番"),
      T("am-x-onigiri", "🍙", "おにぎり＋みそ汁", { rice: 1.5, soup: 1 }, "和食"),
      T("am-x-tkg", "🥚", "卵かけごはん・納豆卵", { rice: 1.5, egg: 1, soy: 0.5 }, "和食"),
      T("am-x-fish", "🐟", "焼き魚の和朝食", { rice: 1, fish: 1, greenveg: 1, soup: 1 }, "和食"),
      T("am-x-toast", "🍞", "トースト・ゆで卵・ヨーグルト", { bread: 1, egg: 1, yogurt: 1 }, "パン・カフェ"),
      T("am-x-cafe", "☕", "カフェのモーニング", { bread: 2, egg: 1, milk: 0.5, out: 0.5 }, "パン・カフェ"),
      T("am-x-conv", "🏪", "コンビニ（おにぎり＋ヨーグルト）", { rice: 1, yogurt: 1, out: 0.5 }, "パン・カフェ"),
      T("am-x-pastry", "🥐", "菓子パン＋コーヒー", { cake: 1 }, "パン・カフェ"),
      T("am-x-cereal", "🥣", "シリアル・牛乳・バナナ", { oats: 1, milk: 1, fruit: 1 }, "軽め"),
      T("am-x-smoothie", "🥤", "スムージー＋ゆで卵", { fruit: 1.5, milk: 0.5, egg: 1 }, "軽め"),
      T("am-x-juice", "🧃", "ジュースだけ", { sugar: 1.5 }, "軽め"),
      NONE("am-none", "食べない"),
    ],
  },
  {
    id: "noon",
    icon: "SUNNY",
    label: "昼",
    tiles: [
      T("no-set", "🍱", "定食（ごはん・主菜・汁）", { rice: 1, chicken: 1, veg: 1, soup: 1 }, "定番"),
      T("no-men", "🍜", "麺類", { noodle: 1, out: 1 }, "定番"),
      T("no-don", "🍛", "丼・カレー", { rice: 2, stir: 1, out: 1 }, "定番"),
      T("no-conv", "🍙", "コンビニ弁当", { rice: 1, fried: 1, out: 1 }, "定番"),
      T("no-onigiri", "🥗", "おにぎり・サラダチキン", { rice: 1, chicken: 1, salad: 1 }, "定番"),
      T("no-sand", "🥪", "サンドイッチ・パン", { bread: 2, egg: 1, out: 1 }, "定番"),
      ...main("no"),
      NONE("no-none", "食べない"),
    ],
  },
  {
    id: "pm",
    icon: "MOON",
    label: "夜",
    tiles: [
      T("pm-fish", "🐟", "魚の定食", { rice: 1, fish: 1, greenveg: 1, soup: 1 }, "定番"),
      T("pm-meat", "🍖", "肉料理", { rice: 1, meat: 1, veg: 1, stir: 1 }, "定番"),
      T("pm-nabe", "🍲", "鍋・煮物", { chicken: 1, veg: 2, soy: 1, mush: 1 }, "定番"),
      T("pm-fry", "🍤", "揚げ物", { rice: 1, fried: 1, salad: 1 }, "定番"),
      T("pm-men", "🍝", "麺類", { noodle: 1 }, "定番"),
      T("pm-out", "🍻", "外食・居酒屋", { out: 1, fried: 1, rice: 1 }, "定番"),
      ...main("pm"),
      NONE("pm-none", "食べない"),
    ],
  },
  {
    id: "snack",
    icon: "COOKIE",
    label: "おやつ・飲み物",
    tiles: [
      T("sn-cake", "🍰", "菓子パン・ケーキ", { cake: 1 }, "定番"),
      T("sn-choco", "🍫", "チョコ・スナック", { snack: 1 }, "定番"),
      T("sn-fruit", "🍎", "果物", { fruit: 1 }, "定番"),
      T("sn-yo", "🥛", "ヨーグルト", { yogurt: 1 }, "定番"),
      T("sn-sugar", "🥤", "甘い飲み物", { sugar: 1 }, "定番"),
      T("sn-juice", "🧃", "ジュースのみ", { sugar: 1.5 }, "定番"),
      T("sn-alc", "🍺", "お酒", { alcohol: 1 }, "定番"),
      T("sn-x-wagashi", "🍡", "和菓子（大福・どら焼き）", { cake: 0.8 }, "甘いもの"),
      T("sn-x-ice", "🍨", "アイスクリーム", { snack: 1 }, "甘いもの"),
      T("sn-x-frappe", "🧋", "甘いカフェドリンク", { sugar: 1.5, milk: 0.5 }, "甘いもの"),
      T("sn-x-cracker", "🍘", "せんべい・おかき", { snack: 0.7 }, "甘いもの"),
      T("sn-x-latte", "☕", "カフェラテ（砂糖なし）", { milk: 1 }, "軽め"),
      T("sn-x-vegjuice", "🥬", "野菜ジュース", { veg: 1, sugar: 0.3 }, "軽め"),
      T("sn-x-nutsfruit", "🥜", "ナッツ＋ドライフルーツ", { nuts: 1, fruit: 0.5 }, "軽め"),
      T("sn-x-granola", "🥣", "ヨーグルト＋グラノーラ", { yogurt: 1, oats: 0.5, fruit: 0.5 }, "軽め"),
      T("sn-x-protein", "🥛", "プロテイン・牛乳", { milk: 1 }, "軽め"),
      T("sn-x-onigiri", "🍙", "おにぎり（夜食）", { rice: 1 }, "軽め"),
      NONE("sn-none", "とらない"),
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