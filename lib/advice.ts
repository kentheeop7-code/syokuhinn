// トレーナー用：現状の食事から、「気づき」「できていること」「アドバイスのたたき台」を、自動で作る。
// 数字の目安は、食事摂取基準（2025年版）。そのほかは、一般的な栄養の考え方（現場の工夫）。診断ではありません。
import { U } from "../app/BalanceCheck";
import { buildVals, goalOf, r10, totals, type St, type Tot } from "./meals";

export type Insight = { id: string; t: string; k?: number; a: string };
const AM = ["am-wa", "am-natto", "am-pan", "am-light", "am-yo", "am-oats"];
const R1 = (n: number) => Math.round(n * 10) / 10;

function stats(cur: St) {
  const cv = buildVals(cur);
  const sum = (ks: string[]) => ks.reduce((s, k) => s + (cv[k] ?? 0), 0);
  const kc = (ks: string[]) => ks.reduce((s, k) => s + (cv[k] ?? 0) * (U[k]?.kcal ?? 0), 0);
  return {
    veg: sum(["salad", "veg", "greenveg", "rootveg", "mush", "konjac"]),
    sweets: kc(["sugar", "cake", "snack", "alcohol"]),
    rich: sum(["fried", "out", "instant"]),
    hasAm: AM.some((id) => cur.size[id] !== undefined) && cur.size["am-none"] === undefined,
  };
}

export function makeInsights(cur: St, sex: "f" | "m", band: number, wantKcal: number): Insight[] {
  const ct = totals(cur);
  if (!ct.any) return [];
  const g = goalOf(sex, band);
  const s = stats(cur);
  const out: Insight[] = [];
  if (s.sweets >= 150) out.push({ id: "sweets", t: "甘い飲み物・お菓子・お酒が、多め。回数や量を、決める。", k: s.sweets, a: `甘い飲み物1杯を、水・お茶に替えると、約${U.sugar.kcal}kcal減ります。お菓子は、回数を決める。` });
  if (ct.salt > g.salt) out.push({ id: "salt", t: `食塩が約${R1(ct.salt)}g（国の目標は${g.salt}g未満）。汁物・漬物・麺の汁・加工品・外食を、見直す。`, a: "汁物は、具を食べて、汁は半分残す。漬物・加工品は、週の回数を決める。" });
  if (s.veg < 3) out.push({ id: "veg", t: `野菜・きのこ・海藻の小鉢が、約${R1(s.veg)}つ。毎食に、小鉢を1つ足す。`, a: "毎食に、野菜の小鉢を1つ。冷凍野菜・カット野菜・サラダでも、よい。" });
  if (ct.p < parseFloat(g.p || "0")) out.push({ id: "protein", t: `たんぱく質が約${Math.round(ct.p)}g（目安は${g.p}）。毎食に、肉・魚・卵・大豆・乳製品を、1つずつ。`, a: "毎食に、手のひら1枚ぶんのたんぱく質。まず、朝食に、卵か納豆を足す。" });
  if (s.rich >= 3) out.push({ id: "rich", t: `揚げ物・外食・インスタントが、1日に約${Math.round(s.rich)}回ぶん。頻度を、減らす。`, a: "揚げ物の日を、週の回数で決める。外食は、定食（焼き魚・煮物）を選ぶ。" });
  if (!s.hasAm) out.push({ id: "am", t: "朝食が、ない（または未入力）。たんぱく質＋果物かヨーグルトから、始める。", a: "ヨーグルト＋果物、または、卵＋パンから。まず、週3日。" });
  if (ct.fi < parseFloat(g.fi || "0")) out.push({ id: "fiber", t: `食物繊維が約${R1(ct.fi)}g（目安は${g.fi}）。野菜・きのこ・海藻・豆・玄米・麦を、足す。`, a: "ごはんに、麦・玄米を、1/3まぜる。豆・きのこを、汁物に足す。" });
  if (wantKcal > 0 && Math.abs(ct.kcal - wantKcal) > 150) out.push({ id: "kcal", t: `現状は、目標より、約${r10(Math.abs(ct.kcal - wantKcal)).toLocaleString()}kcal ${ct.kcal > wantKcal ? "多め" : "少なめ"}。`, k: Math.abs(ct.kcal - wantKcal), a: ct.kcal > wantKcal ? "上の、いちばん大きい項目から、1つだけ、変える。" : "減らしすぎは、疲れや筋力低下のもと。食べる量を、確かめる。" });
  return out;
}

export function goodPoints(cur: St, sex: "f" | "m", band: number): string[] {
  const ct = totals(cur);
  if (!ct.any) return [];
  const g = goalOf(sex, band);
  const s = stats(cur);
  const out: string[] = [];
  if (s.hasAm) out.push("朝食を、食べている");
  if (ct.p >= parseFloat(g.p || "0")) out.push(`たんぱく質が、目安（${g.p}）に届いている`);
  if (s.veg >= 3) out.push("野菜・きのこ・海藻を、3つ以上とれている");
  if (ct.salt <= g.salt) out.push(`食塩が、目標（${g.salt}g未満）の範囲`);
  if (ct.fi >= parseFloat(g.fi || "0")) out.push(`食物繊維が、目安（${g.fi}）に届いている`);
  if (s.sweets < 150) out.push("甘い飲み物・お菓子・お酒が、少なめ");
  return out;
}

const ORDER = ["sweets", "salt", "veg", "protein", "rich", "am", "fiber", "kcal"];
export function draftAdvice(a: { name: string; cur: St; plan: St; sex: "f" | "m"; band: number; wantKcal: number; nextDate: string }): string {
  const ins = makeInsights(a.cur, a.sex, a.band, a.wantKcal).sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));
  const good = goodPoints(a.cur, a.sex, a.band).slice(0, 2);
  const ct: Tot = totals(a.cur);
  const pt: Tot = totals(a.plan);
  const L: string[] = [`${a.name.trim() ? a.name.trim() + "さん、" : ""}今日は、ありがとうございました。`];
  if (good.length) L.push("", "✔ すでに、できていること", ...good.map((x) => `・${x}`));
  if (ins[0]) L.push("", "◎ まず、1つだけ、取り組むこと", `・${ins[0].t.replace(/。.*$/, "")}`, `　→ ${ins[0].a}`);
  if (ins[1]) L.push("", "○ 余裕があれば", `・${ins[1].a}`);
  if (pt.any) L.push("", `目安の食事は、1日 約${r10(pt.kcal).toLocaleString()}kcal です${ct.any ? `（いまは、約${r10(ct.kcal).toLocaleString()}kcal）` : ""}。`);
  if (a.nextDate.trim()) L.push("", `次回（${a.nextDate.trim()}）に、体重と食事の様子を、いっしょに確認しましょう。`);
  return L.join("\n");
}

// ヒアリングの質問（現場の聞き取り項目。一般的なもの）
export const ASK: { t: string; q: string[] }[] = [
  { t: "食事", q: ["朝・昼・夜は、何を、何時ごろ食べていますか？", "外食・コンビニは、週に何回ですか？", "間食・飲み物（甘い飲み物・お酒）は、1日に、どのくらいですか？", "ごはん・パン・麺は、1回に、どのくらいですか？"] },
  { t: "生活", q: ["睡眠は、何時間ですか？", "仕事・家事は、座りが多い？立ち仕事？夜勤は？", "歩く・運動する習慣は、ありますか？", "ストレスで、食べすぎることは、ありますか？"] },
  { t: "健康（先に確認）", q: ["持病・服薬は、ありますか？（甲状腺・糖尿病・高血圧・腎臓など）", "妊娠中・授乳中ですか？", "月経の乱れ・ひざや腰の痛み・アレルギーは？", "医師から、食事や運動の指示を受けていますか？"] },
  { t: "目標", q: ["いつまでに、何kg、なぜ減らしたいですか？", "過去のダイエットで、続いたこと・続かなかったことは？", "週に、どのくらいなら、続けられそうですか？"] },
];
export const ASK_CARE = "むちゃ食いを繰り返す・吐く・下剤を使う、などがあれば、摂食障害の可能性があります。ダイエットより先に、医療機関への受診を勧めてください。";