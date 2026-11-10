// 「減らす」ではなく「増やす」置きかえ：いまの食事の代わりに、「こちらを食べてください」と示すための一覧。
// 量・栄養は、BalanceCheckと同じ食品の目安値から、自動で計算（kcal・たんぱく質・食物繊維の差）。
import { U } from "../app/BalanceCheck";
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
];
export const exampleTotals = (st: St) => totals(st);