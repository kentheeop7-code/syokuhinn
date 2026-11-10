// お客様に示す「明確なアクション」。何を・どう変えるかを、番号つきで、短くまとめる。
// 現状の食事と、提案する食事の差、置きかえ、運動、水分、記録から、自動で作る。トレーナーが、チェックで、選べる。
import { SIZES, SLOTS, r10, slotKcal, type St } from "./meals";
import type { SwapRow } from "./swaps";
import { labelOf, type OtherEx } from "./exercise";
import type { Insight } from "./advice";

export type Action = { id: string; tag: string; text: string; detail?: string };

const labelsOf = (st: St, slotId: string): string[] => {
  const s = SLOTS.find((x) => x.id === slotId)!;
  return s.tiles.filter((t) => st.size[t.id] !== undefined).map((t) => (t.id.endsWith("-none") ? t.label : t.label));
};
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function buildActions(a: { cur: St; plan: St; swaps: SwapRow[]; insights: Insight[]; days: number; others: OtherEx[]; water: number; hasCur: boolean }): Action[] {
  const out: Action[] = [];
  // ① 食事：現状と、提案が、ちがう時間帯
  for (const s of SLOTS) {
    const cl = labelsOf(a.cur, s.id);
    const pl = labelsOf(a.plan, s.id);
    if (pl.length === 0 || sameSet(cl, pl)) continue;
    const dk = r10(slotKcal(a.plan, s) - slotKcal(a.cur, s));
    out.push({
      id: `meal-${s.id}`,
      tag: "食事",
      text: `${s.label}：${cl.length ? `「${cl.join("・")}」を、` : ""}「${pl.join("・")}」にする`,
      detail: cl.length ? `${dk > 0 ? "+" : ""}${dk}kcal。毎日（または、できる日から、週3日以上）` : "毎日（または、できる日から、週3日以上）",
    });
    if (out.filter((x) => x.tag === "食事").length >= 3) break;
  }
  // ② 置きかえ（食事の差で、まだ出ていないもの）
  for (const sw of a.swaps.slice(0, 3)) {
    if (out.some((x) => x.tag === "食事" && x.text.includes(sw.to.slice(0, 6)))) continue;
    out.push({ id: `swap-${sw.id}`, tag: "置きかえ", text: `「${sw.from}」の代わりに、「${sw.to}」を食べる`, detail: `${sw.why}。${sw.dk > 0 ? "+" : ""}${sw.dk}kcal／たんぱく質 ${sw.dp > 0 ? "+" : ""}${sw.dp}g／食物繊維 ${sw.dfi > 0 ? "+" : ""}${sw.dfi}g` });
  }
  // ③ 食事の気づきから（置きかえに、出ていないもの）
  for (const ins of a.insights.slice(0, 2)) {
    if (["sweets", "am"].includes(ins.id) && out.length >= 4) continue;
    out.push({ id: `ins-${ins.id}`, tag: "食事", text: ins.a });
  }
  // ④ 運動
  if (a.days > 0) out.push({ id: "rt", tag: "運動", text: `筋トレを、週${a.days}回（全身を、各種目2〜3セット）`, detail: a.days === 1 ? "週1回でも、続ければ、筋力は伸びます（1週間の総量が同じなら、回数による差は、見られませんでした）" : undefined });
  a.others.slice(0, 2).forEach((x) => out.push({ id: `ex-${x.id}`, tag: "運動", text: `${labelOf(x.id)}を、1回${x.min}分 × 週${x.days}回` }));
  if (!a.others.length) out.push({ id: "steps", tag: "運動", text: "いまより、1日+1,000歩、歩く（目標は、まず7,000歩）" });
  // ⑤ 水分・記録
  if (a.water > 0 && a.water <= 2) out.push({ id: "water", tag: "水分", text: "水・お茶を、1日コップ4杯以上（朝起きたら1杯、食事ごとに1杯）" });
  out.push({ id: "log", tag: "記録", text: "夜の食事だけ、写真で残す。体重は、毎朝はかり、週の平均を見る", detail: "記録と減量の関連は、22研究で一貫して見られました（ただし、根拠は弱い）" });
  return out.slice(0, 8);
}

export const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];
export const sizeText = (z: number) => SIZES[z]?.t ?? "ふつう";