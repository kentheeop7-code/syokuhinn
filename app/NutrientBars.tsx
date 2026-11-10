// 栄養素のチェック（横棒グラフ）。目安（1日）に対して、どのくらいか。印刷にも強い、かんたんな図。
export type NRow = { label: string; unit: string; cur?: number; plan: number; goal?: number; lo?: number; hi?: number; kind: "min" | "max" | "range"; note?: string };
export type NState = "ok" | "near" | "low" | "over" | "adj";
const fmt = (n: number) => (Math.abs(n) >= 100 ? Math.round(n).toLocaleString() : String(Math.round(n * 10) / 10));

export function stateOf(r: NRow, v: number): NState {
  if (r.kind === "range") return v >= (r.lo ?? 0) && v <= (r.hi ?? 0) ? "ok" : "adj";
  const g = r.goal ?? 0;
  if (r.kind === "max") return v <= g ? "ok" : "over";
  return v >= g ? "ok" : v >= g * 0.7 ? "near" : "low";
}
const MARK: Record<NState, string> = { ok: "✔", near: "△", low: "▲", over: "▲", adj: "△" };
const WORD: Record<NState, string> = { ok: "OK", near: "もう少し", low: "足りない", over: "多め", adj: "調整" };

export default function NutrientBars({ rows, hasCur }: { rows: NRow[]; hasCur: boolean }) {
  return (
    <ul className="nbars" aria-label="栄養素のチェック">
      {rows.map((r) => {
        const scaleMax = r.kind === "range" ? (r.hi ?? 1) * 1.6 : (r.goal ?? 1) * 1.5;
        const w = (v: number) => `${Math.max(1, Math.min(100, (v / scaleMax) * 100))}%`;
        const st = stateOf(r, r.plan);
        const goalText = r.kind === "range" ? `${r.lo}〜${r.hi}${r.unit}` : `${r.kind === "max" ? "" : ""}${fmt(r.goal ?? 0)}${r.unit}${r.kind === "max" ? "未満" : "以上"}`;
        return (
          <li key={r.label} className={`nb ${st}`}>
            <div className="nbh">
              <span>{r.label}</span>
              <b>
                {hasCur && r.cur !== undefined ? `${fmt(r.cur)} → ` : ""}
                {fmt(r.plan)}
                {r.unit}
              </b>
              <em>
                {MARK[st]} {WORD[st]}
              </em>
            </div>
            <div className="nbt" aria-hidden>
              {r.kind === "range" ? <i className="nbband" style={{ left: w(r.lo ?? 0), width: `calc(${w(r.hi ?? 0)} - ${w(r.lo ?? 0)})` }} /> : <i className="nbgoal" style={{ left: w(r.goal ?? 0) }} />}
              {hasCur && r.cur !== undefined && <span className="nbcur" style={{ width: w(r.cur) }} />}
              <span className="nbplan" style={{ width: w(r.plan) }} />
            </div>
            <small>
              目安：{goalText}
              {r.note ? `　${r.note}` : ""}
            </small>
          </li>
        );
      })}
    </ul>
  );
}