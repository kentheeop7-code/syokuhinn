// お客様ごとの食事例：目標のカロリーとPFC（%）に合わせて、量（少なめ／ふつう／多め）と、ごはんの量を調整し、
// 近い順に、いろいろな種類を、選ぶ。持病（脂質異常症）では、揚げ物の多い例を、避ける。
import { describe, SLOTS, totals, type St, type Tot } from "./meals";
import { EXAMPLES } from "./swaps";
import { METHODS, exampleSt, type MethodId, type Pct } from "./methods";
import { U } from "../app/BalanceCheck";

export type PersonalDay = { id: string; name: string; note: string; st: St; tot: Tot; lines: string[]; dk: number; pct: Pct; score: number };
const noneIds = new Set(SLOTS.flatMap((s) => s.tiles.filter((t) => t.id.endsWith("-none")).map((t) => t.id)));
const friedOf = (st: St) => SLOTS.some((s) => s.tiles.some((t) => st.size[t.id] !== undefined && ((t.vals.fried ?? 0) > 0.5 || (t.vals.out ?? 0) >= 1)));

const withSize = (st: St, z: number): St => ({ ...st, size: Object.fromEntries(Object.keys(st.size).map((k) => [k, noneIds.has(k) ? 1 : z])) });
const pctOf = (t: Tot): Pct => {
  const e = t.p * 4 + t.f * 9 + t.c * 4 || 1;
  return { p: Math.round(((t.p * 4) / e) * 100), f: Math.round(((t.f * 9) / e) * 100), c: Math.round(((t.c * 4) / e) * 100) };
};

function fit(st: St, target: number): St {
  let best = st;
  let bd = Infinity;
  for (const z of [0, 1, 2]) {
    const c = withSize(st, z);
    const d = Math.abs(totals(c).kcal - target);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  // まだ足りないときは、ごはんを足す（茶碗1杯＝約250kcal）
  for (const key of ["pm:rice", "noon:rice"]) {
    const k = totals(best).kcal;
    if (target - k > 200) {
      const ext = { ...best.ext, [key]: (best.ext[key] ?? 0) + 1 };
      const c = { ...best, ext };
      if (Math.abs(totals(c).kcal - target) < Math.abs(k - target)) best = c;
    }
  }
  return best;
}

export function personalDays(target: number, want: Pct, methodId: MethodId, opts: { lipid: boolean; n?: number }): PersonalDay[] {
  if (!target) return [];
  const sum = want.p + want.f + want.c || 100;
  const w = { p: (want.p / sum) * 100, f: (want.f / sum) * 100, c: (want.c / sum) * 100 };
  const pool = [...EXAMPLES.map((e) => ({ id: e.id, name: e.name, note: e.note, st: e.st, method: "" })), ...METHODS.map((m) => ({ id: "m-" + m.id, name: m.example.name, note: m.example.note, st: exampleSt(m), method: m.id }))];
  const out: PersonalDay[] = [];
  for (const c of pool) {
    if (c.method === "keto" && methodId !== "keto") continue;
    const st = fit(c.st, target);
    const tot = totals(st);
    const pct = pctOf(tot);
    const dk = Math.round(tot.kcal) - target;
    let score = (Math.abs(dk) / target) * 100 + (Math.abs(pct.p - w.p) + Math.abs(pct.f - w.f) + Math.abs(pct.c - w.c)) * 0.5;
    if (opts.lipid && friedOf(st)) score += 15;
    if (c.method === methodId) score -= 12;
    out.push({ id: c.id, name: c.name, note: c.note, st, tot, lines: describe(st).map((l) => l.replace(/（約\d[\d,]*kcal）$/, "")), dk, pct, score });
  }
  // ほぼ同じ内容を、避ける（名前が同じものは、1つ）
  const seen = new Set<string>();
  return out
    .sort((a, b) => a.score - b.score)
    .filter((d) => (seen.has(d.name) ? false : (seen.add(d.name), true)))
    .slice(0, opts.n ?? 6);
}
void U;