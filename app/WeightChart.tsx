"use client";

import { useEffect, useMemo, useState } from "react";

// 体重の記録（日付 → kg）。端末のブラウザにだけ保存される
type Weights = Record<string, number>;

const PACES = [
  { id: "w1", label: "週1回トレーニング（月2kg減）", perMonth: 2, cls: "w1" },
  { id: "w2", label: "週2回トレーニング（月3kg減）", perMonth: 3, cls: "w2" },
];

const DAY = 86400000;
const toDate = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const daysBetween = (a: string, b: string) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
const r1 = (n: number) => Math.round(n * 10) / 10;

const W = 360;
const H = 250;
const M = { l: 42, r: 14, t: 14, b: 34 };

export default function WeightChart({ date }: { date: string }) {
  const [data, setData] = useState<Weights>({});
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState(0);

  useEffect(() => {
    try {
      const w = JSON.parse(localStorage.getItem("lg-weight") || "null");
      if (w && typeof w === "object") setData(w);
      const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
      const t = parseFloat(p?.weight);
      if (t > 0) setTarget(t);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-weight", JSON.stringify(data));
    } catch {}
  }, [data, loaded]);

  // 選んだ日の体重が入っていれば、入力欄に出す
  useEffect(() => {
    setInput(data[date] ? String(data[date]) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, loaded]);

  const keys = useMemo(() => Object.keys(data).sort(), [data]);
  const first = keys[0];
  const last = keys[keys.length - 1];

  const save = () => {
    const v = parseFloat(input);
    if (!(v >= 20 && v <= 300)) return;
    setData((d) => ({ ...d, [date]: r1(v) }));
  };
  const clear = () =>
    setData((d) => {
      const n = { ...d };
      delete n[date];
      return n;
    });

  const chart = useMemo(() => {
    if (!first) return null;
    const w0 = data[first];
    const lastOff = daysBetween(first, last);
    const span = Math.max(30, Math.ceil((lastOff + 1) / 30) * 30);
    const proj = (perMonth: number, d: number) => w0 - (perMonth * d) / 30;
    const vals = [
      ...keys.map((k) => data[k]),
      ...PACES.flatMap((p) => [proj(p.perMonth, 0), proj(p.perMonth, span)]),
    ];
    if (target > 0) vals.push(target);
    const ymin = Math.floor(Math.min(...vals) - 1);
    const ymax = Math.ceil(Math.max(...vals) + 1);
    const x = (d: number) => M.l + (d / span) * (W - M.l - M.r);
    const y = (v: number) => M.t + ((ymax - v) / (ymax - ymin)) * (H - M.t - M.b);
    const step = ymax - ymin > 12 ? 4 : ymax - ymin > 6 ? 2 : 1;
    const yTicks: number[] = [];
    for (let v = Math.ceil(ymin / step) * step; v <= ymax; v += step) yTicks.push(v);
    const xTicks = Array.from({ length: span / 30 + 1 }, (_, i) => i * 30);
    const pts = keys.map((k) => ({ k, d: daysBetween(first, k), v: data[k] }));
    return { w0, span, proj, x, y, yTicks, xTicks, pts, lastOff };
  }, [data, keys, first, last, target]);

  const lastW = last ? data[last] : 0;
  const diff = first ? r1(lastW - data[first]) : 0;

  return (
    <section className="card wchart" aria-label="体重の折れ線グラフ">
      <h2 className="h2">⚖️ 体重のグラフ</h2>
      <p className="wnote">
        体重を記録すると、折れ線で表示されます。点線は、トレーニングを続けた場合の平均的な減り方（週1回で月2kg、週2回で月3kg）です。
      </p>

      <div className="wform">
        <label className="wlabel">
          {date.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, "$1年$2月$3日")}の体重
          <span className="winput">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              placeholder="65.0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              aria-label="体重（kg）"
            />
            <b>kg</b>
          </span>
        </label>
        <button className="btn" onClick={save} disabled={!(parseFloat(input) >= 20)}>
          記録する
        </button>
        {data[date] !== undefined && (
          <button className="btn ghost" onClick={clear}>
            この日を消す
          </button>
        )}
      </div>

      {!chart ? (
        <p className="wempty">まだ記録がありません。今日の体重を入れてみましょう。</p>
      ) : (
        <>
          <div className="wstats">
            <div>
              <span>開始</span>
              <b>{data[first]}kg</b>
            </div>
            <div>
              <span>最新</span>
              <b>{lastW}kg</b>
            </div>
            <div>
              <span>増減</span>
              <b className={diff < 0 ? "down" : diff > 0 ? "up" : ""}>
                {diff > 0 ? "+" : ""}
                {diff}kg
              </b>
            </div>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="wsvg" role="img" aria-label="体重の推移と、トレーニング頻度ごとの目安">
            {chart.yTicks.map((v) => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={chart.y(v)} y2={chart.y(v)} className="wgrid" />
                <text x={M.l - 6} y={chart.y(v) + 4} className="wtick" textAnchor="end">
                  {v}
                </text>
              </g>
            ))}
            {chart.xTicks.map((d) => (
              <text key={d} x={chart.x(d)} y={H - 12} className="wtick" textAnchor={d === chart.span ? "end" : d === 0 ? "start" : "middle"}>
                {d === 0 ? "開始" : `${d / 30}か月`}
              </text>
            ))}
            {target > 0 && (
              <g>
                <line x1={M.l} x2={W - M.r} y1={chart.y(target)} y2={chart.y(target)} className="wtarget" />
                <text x={W - M.r - 2} y={chart.y(target) - 4} className="wtick" textAnchor="end">
                  目標 {target}kg
                </text>
              </g>
            )}
            {PACES.map((p) => (
              <line
                key={p.id}
                x1={chart.x(0)}
                y1={chart.y(chart.proj(p.perMonth, 0))}
                x2={chart.x(chart.span)}
                y2={chart.y(chart.proj(p.perMonth, chart.span))}
                className={`wpace ${p.cls}`}
              />
            ))}
            <polyline
              className="wline"
              points={chart.pts.map((p) => `${chart.x(p.d)},${chart.y(p.v)}`).join(" ")}
            />
            {chart.pts.map((p, idx) => (
              <g key={p.k}>
                <circle cx={chart.x(p.d)} cy={chart.y(p.v)} r="5" className="wdot" />
                {(idx === 0 || idx === chart.pts.length - 1) && (
                  <text x={chart.x(p.d)} y={chart.y(p.v) - 10} className="wval" textAnchor="middle">
                    {p.v}
                  </text>
                )}
              </g>
            ))}
          </svg>

          <ul className="wlegend">
            <li>
              <i className="lg actual" />
              記録した体重
            </li>
            {PACES.map((p) => (
              <li key={p.id}>
                <i className={`lg ${p.cls}`} />
                {p.label}
              </li>
            ))}
            {target > 0 && (
              <li>
                <i className="lg tgt" />
                目標体重
              </li>
            )}
          </ul>

          {chart.lastOff > 0 && (
            <p className="wcompare">
              開始から{chart.lastOff}日で、記録は{diff > 0 ? "+" : ""}
              {diff}kg。平均的な目安は、週1回で{r1((-2 * chart.lastOff) / 30)}kg、週2回で
              {r1((-3 * chart.lastOff) / 30)}kgです。
            </p>
          )}
        </>
      )}
      <p className="wnote small">※ 一般的な目安です。体重の増減には個人差があり、体調や食事・睡眠でも日々変わります。</p>
    </section>
  );
}


