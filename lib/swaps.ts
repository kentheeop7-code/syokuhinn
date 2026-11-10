// 「減らす」ではなく「増やす」置きかえ：いまの食事の代わりに、「こちらを食べてください」と示すための一覧。
// 量・栄養は、BalanceCheckと同じ食品の目安値から、自動で計算（kcal・たんぱく質・食物繊維の差）。
import { U } from "../app/BalanceCheck";
import { FOODS } from "./foods";
import { SIZES, SLOTS, totals, type St } from "./meals";

export type Swap = { id: string; from: string; to: string; why: string; vals: Record<string, number> };
const S = (id: string, to: string, why: string, vals: Record<string, number>): [string, { to: string; why: string; vals: Record<string, number> }] => [id, { to, why, vals }];
const TABLE = Object.fromEntries([
  S("am-none", "ヨーグルト＋果物（または、卵＋パン）", "朝に、たんぱく質と食物繊維を、足す", { yogurt: 1, fruit: 1 }),
  S("am-pan", "全粒粉パン＋卵＋牛乳", "食物繊維とたんぱく質が、増える", { wbread: 2, egg: 1, milk: 1 }),
  S("am-light", "パン＋卵＋ヨーグルト", "たんぱく質が、増える", { bread: 1, egg: 1, yogurt: 1 }),
  S("no-men", "具だくさんの麺＋ゆで卵＋サラダ", "たんぱく質と野菜が、増える", { noodle: 1, egg: 1, salad: 1, out: 1 }),
  S("no-don", "鶏の定食（ごはん1杯・緑黄色野菜・みそ汁）", "野菜とたんぱく質が、増える", { rice: 1, chicken: 1, greenveg: 1, soup: 1 }),
  S("no-conv", "おにぎり＋サラダチキン＋サラダ", "たんぱく質と野菜が、増える", { rice: 1, chicken: 1, salad: 1 }),
  S("no-sand", "サンドイッチ＋ヨーグルト＋サラダ", "たんぱく質と野菜が、増える", { bread: 2, egg: 1, yogurt: 1, salad: 1, out: 1 }),
  S("pm-fry", "焼き魚の定食（魚・緑黄色野菜・みそ汁）", "魚の脂（n-3）と野菜が、増える", { rice: 1, fish: 1, greenveg: 1, soup: 1 }),
  S("pm-out", "魚か豆腐の定食（外食でも、定食を選ぶ）", "たんぱく質と野菜が、増える", { rice: 1, fish: 1, soy: 1, greenveg: 1, out: 1 }),
  S("pm-men", "麺＋豆腐＋野菜2つ", "たんぱく質と野菜が、増える", { noodle: 1, soy: 1, veg: 2 }),
  S("pm-meat", "肉料理＋野菜2つ＋みそ汁", "野菜と汁物が、増える", { rice: 1, meat: 1, veg: 2, soup: 1 }),
  S("sn-cake", "ヨーグルト＋果物", "たんぱく質・カルシウム・食物繊維が、増える", { yogurt: 1, fruit: 1 }),
  S("sn-choco", "ナッツ ひとつかみ（または、チーズ）", "たんぱく質と、よい脂質が、増える", { nuts: 1 }),
  S("sn-sugar", "豆乳1杯（または、無糖のお茶・水）", "たんぱく質が、増える", { soymilk: 1 }),
  S("sn-alc", "冷奴・枝豆を、足す（量は、決める）", "たんぱく質が、増える", { soy: 1 }),
]) as Record<string, { to: string; why: string; vals: Record<string, number> }>;

const sum = (vals: Record<string, number>, m = 1) => {
  const t = { kcal: 0, p: 0, fi: 0 };
  for (const [k, v] of Object.entries(vals)) {
    const u = U[k];
    if (!u) continue;
    t.kcal += u.kcal * v * m;
    t.p += u.p * v * m;
    t.fi += u.fi * v * m;
  }
  return t;
};

export type SwapRow = Swap & { dk: number; dp: number; dfi: number };
// いま選んでいる食事のうち、置きかえの案があるものを、返す
export function swapsFor(cur: St): SwapRow[] {
  const out: SwapRow[] = [];
  for (const s of SLOTS) {
    for (const t of s.tiles) {
      const z = cur.size[t.id];
      const sw = TABLE[t.id];
      if (z === undefined || !sw) continue;
      const a = sum(t.vals, SIZES[z].m);
      const b = sum(sw.vals, SIZES[z].m);
      out.push({ id: t.id, from: t.label, to: sw.to, why: sw.why, vals: sw.vals, dk: Math.round((b.kcal - a.kcal) / 10) * 10, dp: Math.round(b.p - a.p), dfi: Math.round((b.fi - a.fi) * 10) / 10 });
    }
  }
  return out;
}

// 食事の例（1日）。目標のカロリーに近いものを、すすめる。
const mk = (ids: string[], ext: Record<string, number> = {}, big: string[] = []): St => ({ date: "", size: Object.fromEntries(ids.map((i) => [i, big.includes(i) ? 2 : 1])), ext });
export const EXAMPLES: { id: string; name: string; note: string; st: St }[] = [
  { id: "wa", name: "和食の日", note: "魚・大豆・野菜が、そろう", st: mk(["am-wa", "no-set", "pm-fish", "sn-yo"], { "am:fruit": 1, "noon:veg": 1, "pm:salad": 1 }) },
  { id: "pan", name: "パン・外食の日", note: "パンの日も、卵・ヨーグルト・野菜を足す", st: mk(["am-pan", "no-onigiri", "pm-nabe", "sn-fruit"], { "am:fruit": 1, "noon:soup": 1, "pm:rice": 1 }) },
  { id: "pro", name: "たんぱく質しっかりの日", note: "筋トレの日におすすめ", st: mk(["am-oats", "no-set", "pm-meat", "sn-yo"], { "am:egg": 1, "noon:salad": 1, "pm:salad": 1, "pm:soy": 1 }, ["no-set"]) },
  { id: "conv", name: "コンビニ中心の日", note: "おにぎり＋サラダチキン＋サラダ、ヨーグルトで整える", st: mk(["am-light", "no-onigiri", "pm-nabe", "sn-yo"], { "am:egg": 1, "noon:salad": 1, "noon:soup": 1 }) },
  { id: "men", name: "麺が好きな日", note: "麺に、卵・サラダ・野菜を足す", st: mk(["am-yo", "no-men", "pm-fish", "sn-fruit"], { "am:egg": 1, "noon:egg": 1, "noon:salad": 1, "pm:veg": 1 }) },
  { id: "quick", name: "時短・自炊少なめの日", note: "オートミール・鍋で、手早く", st: mk(["am-oats", "no-set", "pm-nabe", "sn-yo"], { "am:egg": 1, "am:fruit": 1, "pm:rice": 1 }) },
  { id: "out", name: "外食でも整える日", note: "外食は、定食を選ぶ。足りない野菜を足す", st: mk(["am-pan", "no-set", "pm-fish", "sn-fruit"], { "am:fruit": 1, "pm:soy": 1, "pm:salad": 1 }) },
  { id: "late", name: "夜が遅い日", note: "夜は、鍋・煮物で軽く。たんぱく質は、ほしい", st: mk(["am-wa", "no-set", "pm-nabe", "sn-yo"], { "noon:veg": 1 }) },
];
export const exampleTotals = (st: St) => totals(st);

// 増やしたい食品（目的別）。量は「1回ぶんの目安」。栄養は、日本食品標準成分表をもとにした100gあたりの目安値（lib/foods.ts）から、計算。
const byName = new Map(FOODS.map((f) => [f.name, f]));
export type IncItem = { label: string; kcal: number; p: number; fi: number; ca: number; fe: number };
const inc = (name: string, g: number, label: string): IncItem | null => {
  const f = byName.get(name);
  if (!f) return null;
  const x = g / 100;
  return { label, kcal: Math.round((f.p * 4 + f.f * 9 + f.c * 4) * x), p: Math.round(f.p * x * 10) / 10, fi: Math.round((f.fi ?? 0) * x * 10) / 10, ca: Math.round((f.ca ?? 0) * x), fe: Math.round((f.fe ?? 0) * x * 10) / 10 };
};
const list = (a: (IncItem | null)[]) => a.filter((x): x is IncItem => !!x);
export const INCREASE: { title: string; why: string; items: IncItem[] }[] = [
  {
    title: "たんぱく質を増やす（筋肉・満腹感）",
    why: "毎食に、手のひら1枚ぶんを、そろえる",
    items: list([inc("卵", 50, "卵 1個"), inc("納豆", 45, "納豆 1パック"), inc("木綿豆腐", 150, "豆腐 1/2丁"), inc("鶏むね肉（皮なし）", 90, "鶏むね肉 手のひら1枚"), inc("サケ（焼き）", 80, "焼きざけ 1切れ"), inc("無糖ヨーグルト", 100, "無糖ヨーグルト 1個"), inc("牛乳", 200, "牛乳 コップ1杯"), inc("豆乳（無調整）", 200, "豆乳 コップ1杯"), inc("カッテージチーズ", 50, "カッテージチーズ 大さじ3")]),
  },
  {
    title: "野菜・食物繊維を増やす（おなかの調子・満腹感）",
    why: "毎食に、野菜の小鉢を1つ。主食を、玄米・麦・全粒粉に",
    items: list([inc("ブロッコリー", 70, "ブロッコリー 小鉢1つ"), inc("ほうれん草", 70, "ほうれん草 小鉢1つ"), inc("小松菜", 70, "小松菜 小鉢1つ"), inc("キャベツ", 70, "キャベツ 小鉢1つ"), inc("トマト", 100, "トマト 1/2〜1個"), inc("しいたけ", 50, "しいたけ 2〜3個"), inc("こんにゃく", 50, "こんにゃく 1/4枚"), inc("玄米ごはん", 150, "玄米ごはん 茶碗1杯"), inc("オートミール", 30, "オートミール 30g"), inc("全粒粉パン", 60, "全粒粉パン 1枚"), inc("ゆでひよこ豆", 50, "ひよこ豆 50g")]),
  },
  {
    title: "カルシウム・鉄を増やす（骨・貧血）",
    why: "乳製品・小松菜・魚・赤身肉・レバーを、週に何回か",
    items: list([inc("牛乳", 200, "牛乳 コップ1杯"), inc("小松菜", 70, "小松菜 小鉢1つ"), inc("木綿豆腐", 150, "豆腐 1/2丁"), inc("いわし缶（味付け）", 50, "いわし缶 1/2缶"), inc("鶏レバー", 50, "レバー 50g"), inc("豚もも肉（赤身）", 90, "豚の赤身 手のひら1枚"), inc("ひじき（乾）", 5, "ひじき（乾）5g")]),
  },
  {
    title: "間食を、栄養のあるものに（おやつの置きかえ）",
    why: "お菓子の代わりに、足りない栄養をとれるものを",
    items: list([inc("アーモンド", 20, "アーモンド ひとつかみ"), inc("くるみ", 20, "くるみ ひとつかみ"), inc("枝豆", 70, "枝豆 70g"), inc("バナナ", 100, "バナナ 1本"), inc("りんご", 100, "りんご 1/2個"), inc("みかん", 100, "みかん 1個"), inc("無糖ヨーグルト", 100, "無糖ヨーグルト 1個"), inc("さつまいも", 100, "焼きいも 1/2本")]),
  },
];
export const GENERIC_SWAPS: [string, string][] = [
  ["菓子パン・ケーキ", "ヨーグルト＋果物、焼きいも"],
  ["甘い飲み物", "豆乳・牛乳・無糖のお茶・水"],
  ["スナック菓子", "ナッツ ひとつかみ・チーズ・枝豆"],
  ["丼・麺だけ", "野菜の小鉢・卵・豆腐を、足す"],
  ["揚げ物の定食", "焼き魚・煮魚の定食"],
  ["朝食なし", "ヨーグルト＋果物、卵＋パン、納豆ごはん"],
  ["白ごはん", "玄米・麦ごはん、もち麦を、1/3まぜる"],
  ["食パン", "全粒粉パン・ライ麦パン"],
  ["カップ麺", "具だくさんのみそ汁＋おにぎり、ゆで卵を足す"],
  ["ポテトチップス", "素焼きナッツ・のり・小魚"],
  ["ジュース", "果物そのもの（みかん・りんご）"],
  ["おやつのクッキー", "ヨーグルト＋ナッツ"],
];