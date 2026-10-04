"use client";

import { useEffect, useMemo, useState } from "react";

// 現在の体重と目標体重を入れると、トレーニング頻度ごとに目標まで落ちていくペースを折れ線で見せる。
// 体重の毎日の記録はとらない（入れるのは2つの数字だけ）
const PACES = [
  { id: "w1", label: "週1回トレーニング", perMonth: 2, cls: "w1" },
  { id: "w2", label: "週2回トレーニング", perMonth: 3, cls: "w2" },
];

const r1 = (n: number) => Math.round(n * 10) / 10;
const MAX_MONTHS = 12;

const W = 360;
const H = 250;
const M = { l: 42, r: 16, t: 16, b: 34 };

const whenText = (months: number) => {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(months * 30.4));
  return `${d.getFullYear()}年${d.getMonth() + 1}月ごろ`;
};

export default function WeightChart() {
  const [now, setNow] = useState("");
  const [goal, setGoal] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const n = localStorage.getItem("lg-now");
      const g = localStorage.getItem("lg-wgoal");
      if (n) setNow(n);
      if (g) setGoal(g);
      else {
        // 「目標を決める」で入れた目標体重があれば、最初の値に使う
        const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
        if (p?.weight) setGoal(String(p.weight));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-now", now);
      localStorage.setItem("lg-wgoal", goal);
    } catch {}
  }, [now, goal, loaded]);

  const w0 = parseFloat(now);
  const wt = parseFloat(goal);
  const okNow = w0 >= 20 && w0 <= 300;
  const okGoal = wt >= 20 && wt <= 300;
  const diff = okNow && okGoal ? r1(w0 - wt) : 0;

  const chart = useMemo(() => {
    if (!okNow || !okGoal || diff <= 0) return null;
    const rows = PACES.map((p) => ({ ...p, months: diff / p.perMonth }));
    const slowest = Math.max(...rows.map((r) => r.months));
    const span = Math.min(MAX_MONTHS, Math.max(2, Math.ceil(slowest)));
    const x = (m: number) => M.l + (m / span) * (W - M.l - M.r);
    const ymin = Math.floor(wt - 1);
    const ymax = Math.ceil(w0 + 1);
    const y = (v: number) => M.t + ((ymax - v) / (ymax - ymin)) * (H - M.t - M.b);
    const step = ymax - ymin > 12 ? 4 : ymax - ymin > 6 ? 2 : 1;
    const yTicks: number[] = [];
    for (let v = Math.ceil(ymin / step) * step; v <= ymax; v += step) yTicks.push(v);
    const xStep = span > 6 ? 2 : 1;
    const xTicks: number[] = [];
    for (let m = 0; m <= span; m += xStep) xTicks.push(m);
    // 各ペースの線：目標に着くまで（12か月を超える場合は12か月の位置まで）
    const lines = rows.map((r) => {
      const end = Math.min(r.months, span);
      const vEnd = w0 - r.perMonth * end;
      return { ...r, end, vEnd, reached: r.months <= span };
    });
    return { span, x, y, yTicks, xTicks, lines };
  }, [okNow, okGoal, diff, w0, wt]);

  return (
    <section className="card wchart" aria-label="目標体重までのペース">
      <h2 className="h2">⚖️ 目標体重までのペース</h2>
      <p className="wnote">
        現在の体重と目標体重を入れると、トレーニングの頻度ごとに、目標まで落ちていく平均的なペース（週1回で月2kg、週2回で月3kg）を折れ線で見られます。毎日の記録は必要ありません。
      </p>

      <div className="wform two">
        <label className="wlabel">
          現在の体重
          <span className="winput">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              placeholder="70.0"
              value={now}
              onChange={(e) => setNow(e.target.value)}
              aria-label="現在の体重（kg）"
            />
            <b>kg</b>
          </span>
        </label>
        <label className="wlabel">
          目標体重
          <span className="winput">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              placeholder="62.0"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              aria-label="目標体重（kg）"
            />
            <b>kg</b>
          </span>
        </label>
      </div>

      {!okNow || !okGoal ? (
        <p className="wempty">現在の体重と目標体重を入れると、グラフが表示されます。</p>
      ) : diff <= 0 ? (
        <p className="wempty">目標体重が、現在の体重より低くなるように入れてください。</p>
      ) : (
        chart && (
          <>
            <div className="wstats">
              <div>
                <span>現在</span>
                <b>{w0}kg</b>
              </div>
              <div>
                <span>目標</span>
                <b>{wt}kg</b>
              </div>
              <div>
                <span>減らす量</span>
                <b className="down">-{diff}kg</b>
              </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="wsvg" role="img" aria-label="目標体重までの体重の変化の目安">
              {chart.yTicks.map((v) => (
                <g key={v}>
                  <line x1={M.l} x2={W - M.r} y1={chart.y(v)} y2={chart.y(v)} className="wgrid" />
                  <text x={M.l - 6} y={chart.y(v) + 4} className="wtick" textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {chart.xTicks.map((m) => (
                <text
                  key={m}
                  x={chart.x(m)}
                  y={H - 12}
                  className="wtick"
                  textAnchor={m === chart.span ? "end" : m === 0 ? "start" : "middle"}
                >
                  {m === 0 ? "今" : `${m}か月`}
                </text>
              ))}
              <line x1={M.l} x2={W - M.r} y1={chart.y(wt)} y2={chart.y(wt)} className="wtarget" />
              <text x={M.l + 6} y={chart.y(wt) - 6} className="wtick" textAnchor="start">
                目標 {wt}kg
              </text>
              {chart.lines.map((l) => (
                <g key={l.id}>
                  <line
                    x1={chart.x(0)}
                    y1={chart.y(w0)}
                    x2={chart.x(l.end)}
                    y2={chart.y(l.vEnd)}
                    className={`wpace solid ${l.cls}`}
                  />
                  <circle cx={chart.x(l.end)} cy={chart.y(l.vEnd)} r="6" className={`wgoaldot ${l.cls}`} />
                </g>
              ))}
              <circle cx={chart.x(0)} cy={chart.y(w0)} r="6" className="wdot" />
              <text x={chart.x(0) + 8} y={chart.y(w0) - 8} className="wval">
                {w0}kg
              </text>
            </svg>

            <ul className="wresult">
              {chart.lines.map((l) => (
                <li key={l.id} className={l.cls}>
                  <i className={`lg ${l.cls}`} />
                  <span>
                    <b>
                      {l.label}（月{l.perMonth}kg減）
                    </b>
                    {l.reached ? (
                      <>
                        目標まで <strong>約{r1(l.months)}か月</strong>（{whenText(l.months)}）
                      </>
                    ) : (
                      <>
                        {MAX_MONTHS}か月で約{r1(l.perMonth * MAX_MONTHS)}kg減。目標までは約{r1(l.months)}か月
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {diff / PACES[1].perMonth > 6 && (
              <p className="wcompare">
                減らす量が大きいときは、1回で目標を決めず、まず3か月で「現在の体重の5%ほど」を目安にして、少しずつ進めるのがおすすめです。
              </p>
            )}
          </>
        )
      )}
      <p className="wnote small">
        ※ 一般的な平均の目安です。体重の減り方には個人差があり、食事・睡眠・体質でも変わります。無理な減量はせず、食事（PFC）と運動を合わせて進めましょう。
      </p>
    </section>
  );
}

