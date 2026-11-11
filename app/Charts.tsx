// 印刷にも強い、かんたんなグラフ（SVG）。外部のライブラリは、使わない。
type Slice = { label: string; value: number; color: string };

export function Pie({ data, size = 130, title }: { data: Slice[]; size?: number; title?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 4;
  const c = size / 2;
  let a0 = -Math.PI / 2;
  const arcs = data.map((d) => {
    const a1 = a0 + (d.value / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = c + r * Math.cos(a0);
    const y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1);
    const y1 = c + r * Math.sin(a1);
    const full = d.value / total > 0.999;
    const path = full ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z` : `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    a0 = a1;
    return { path, color: d.color, label: d.label, pct: Math.round((d.value / total) * 100) };
  });
  return (
    <figure className="pie">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${title ?? "円グラフ"}：${arcs.map((a) => `${a.label}${a.pct}%`).join("、")}`}>
        {arcs.map((a) => (
          <path key={a.label} d={a.path} fill={a.color} stroke="#fff" strokeWidth="1.5" />
        ))}
        <circle cx={c} cy={c} r={r * 0.42} fill="#fff" />
      </svg>
      <ul>
        {arcs.map((a) => (
          <li key={a.label}>
            <i style={{ background: a.color }} />
            {a.label} <b>{a.pct}%</b>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function LineChart({ pts, unit = "kg", target, marks, width = 520, height = 220 }: { pts: { x: number; y: number }[]; unit?: string; target?: number; marks?: { week: number; kg: number }[]; width?: number; height?: number }) {
  if (pts.length < 2) return null;
  const P = { l: 44, r: 16, t: 18, b: 34 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y).concat(target ? [target] : []);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const pad = Math.max(0.5, (y1 - y0) * 0.15);
  y0 -= pad;
  y1 += pad;
  const sx = (x: number) => P.l + ((x - x0) / (x1 - x0 || 1)) * (width - P.l - P.r);
  const sy = (y: number) => height - P.b - ((y - y0) / (y1 - y0 || 1)) * (height - P.t - P.b);
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const yt = [0, 1, 2, 3].map((i) => y0 + ((y1 - y0) * i) / 3);
  const step = x1 <= 12 ? 2 : x1 <= 26 ? 4 : 8;
  const xt: number[] = [];
  for (let i = 0; i <= x1; i += step) xt.push(i);
  if (xt[xt.length - 1] !== x1) xt.push(x1);
  const first = pts[0];
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="lchart" role="img" aria-label={`体重の道すじ：${first.y}${unit}から、${x1}週間で、${last.y}${unit}`}>
      {yt.map((v) => (
        <g key={v}>
          <line x1={P.l} x2={width - P.r} y1={sy(v)} y2={sy(v)} stroke="#e3e6ea" />
          <text x={P.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="#667">
            {(Math.round(v * 10) / 10).toString()}
          </text>
        </g>
      ))}
      {xt.map((v) => (
        <text key={v} x={sx(v)} y={height - 14} textAnchor="middle" fontSize="11" fill="#667">
          {v === 0 ? "いま" : `${v}週`}
        </text>
      ))}
      {target ? (
        <g>
          <line x1={P.l} x2={width - P.r} y1={sy(target)} y2={sy(target)} stroke="#d9822b" strokeDasharray="5 4" />
          <text x={width - P.r} y={sy(target) - 5} textAnchor="end" fontSize="11" fill="#b8651a">
            ゴール {target}
            {unit}
          </text>
        </g>
      ) : null}
      <path d={d} fill="none" stroke="#2e9e6a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {(marks ?? []).map((m) => (
        <g key={m.week}>
          <circle cx={sx(m.week)} cy={sy(m.kg)} r="4.5" fill="#fff" stroke="#2e9e6a" strokeWidth="2.5" />
          <text x={sx(m.week)} y={sy(m.kg) - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f5f41">
            {m.kg}
          </text>
        </g>
      ))}
      <circle cx={sx(first.x)} cy={sy(first.y)} r="5" fill="#2e9e6a" />
      <text x={sx(first.x) + 8} y={sy(first.y) - 8} fontSize="12" fontWeight="700" fill="#1f5f41">
        {first.y}
        {unit}
      </text>
    </svg>
  );
}

export function Bars({ items, unit = "回" }: { items: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="tbars" aria-label="筋トレの回数">
      {items.map((i) => (
        <li key={i.label}>
          <span>{i.label}</span>
          <div>
            <i style={{ width: `${Math.max(4, Math.round((i.value / max) * 100))}%` }} />
          </div>
          <b>
            {i.value}
            {unit}
          </b>
        </li>
      ))}
    </ul>
  );
}
// レーダーチャート：目安（1日）に対する、割合。100%の輪が、目安。
export function Radar({ axes, size = 260 }: { axes: { label: string; plan: number; cur?: number }[]; size?: number }) {
  const n = axes.length;
  if (n < 3) return null;
  const c = size / 2;
  const R = size / 2 - 56;
  const max = 1.3;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = (Math.min(max, Math.max(0, v)) / max) * R;
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
  };
  const poly = (f: (a: (typeof axes)[number]) => number) => axes.map((a, i) => pt(i, f(a)).map((x) => x.toFixed(1)).join(",")).join(" ");
  const hasCur = axes.some((a) => a.cur !== undefined);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label={`栄養のレーダーチャート：${axes.map((a) => `${a.label}${Math.round(a.plan * 100)}%`).join("、")}`}>
      {[0.5, 1].map((r) => (
        <polygon key={r} points={axes.map((_, i) => pt(i, r).map((x) => x.toFixed(1)).join(",")).join(" ")} fill="none" stroke={r === 1 ? "#2e9e6a" : "#d6dbe0"} strokeDasharray={r === 1 ? "4 3" : undefined} strokeWidth={r === 1 ? 1.5 : 1} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = pt(i, max);
        const [lx, ly] = pt(i, max + 0.2);
        return (
          <g key={a.label}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="#e3e6ea" />
            <text x={lx} y={ly + 4} textAnchor={lx < c - 6 ? "end" : lx > c + 6 ? "start" : "middle"} fontSize="10" fill="#334">
              {a.label}
            </text>
          </g>
        );
      })}
      {hasCur && <polygon points={poly((a) => a.cur ?? 0)} fill="rgba(120,135,150,.12)" stroke="#8a97a3" strokeWidth="1.5" strokeDasharray="3 2" />}
      <polygon points={poly((a) => a.plan)} fill="rgba(46,158,106,.28)" stroke="#2e9e6a" strokeWidth="2.2" />
    </svg>
  );
}

// 横棒グラフ：項目ごとの、大きさをくらべる。target があれば、縦線で示す。
export function HBars({ items, unit = "", target, targetLabel, color = "#2e9e6a" }: { items: { label: string; value: number; color?: string }[]; unit?: string; target?: number; targetLabel?: string; color?: string }) {
  const max = Math.max(...items.map((i) => i.value), target ?? 0, 1) * 1.08;
  return (
    <ul className="hbars" aria-label="比較グラフ">
      {items.map((i) => (
        <li key={i.label}>
          <span>{i.label}</span>
          <div>
            <i style={{ width: `${Math.max(2, (i.value / max) * 100)}%`, background: i.color ?? color }} />
            {target ? <u style={{ left: `${(target / max) * 100}%` }} /> : null}
          </div>
          <b>
            {Math.round(i.value * 10) / 10}
            {unit}
          </b>
        </li>
      ))}
      {target && targetLabel ? (
        <li className="hbt">
          <span />
          <div>
            <em style={{ left: `${(target / max) * 100}%` }}>{targetLabel}</em>
          </div>
          <b />
        </li>
      ) : null}
    </ul>
  );
}
// ゲージ：区分（帯）の上に、印（いま・目標）を置く。BMIや内臓脂肪レベルに使う。
export function Gauge({ bands, min, max, marks, unit = "" }: { bands: { from: number; to: number; label: string; color: string }[]; min: number; max: number; marks: { v: number; label: string; color?: string }[]; unit?: string }) {
  const W = 520;
  const H = 96;
  const x = (v: number) => 14 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (W - 28);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gauge" role="img" aria-label={`ゲージ：${marks.map((m) => `${m.label}${m.v}${unit}`).join("、")}`}>
      {bands.map((b) => (
        <g key={b.label}>
          <rect x={x(b.from)} y={44} width={x(b.to) - x(b.from)} height={18} fill={b.color} />
          <text x={(x(b.from) + x(b.to)) / 2} y={78} textAnchor="middle" fontSize="10" fill="#445">
            {b.label}
          </text>
          <text x={x(b.from)} y={92} textAnchor="middle" fontSize="9" fill="#889">
            {b.from}
          </text>
        </g>
      ))}
      {marks.map((m, i) => (
        <g key={m.label}>
          <path d={`M ${x(m.v)} 44 l -6 -10 h 12 z`} fill={m.color ?? "#223"} />
          <text x={x(m.v)} y={i % 2 === 0 ? 22 : 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={m.color ?? "#223"}>
            {m.label} {m.v}
            {unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

// 積み上げ棒：体の中身（体脂肪・除脂肪）を、いま と ゴールで、くらべる。
export function StackBars({ rows, unit = "kg" }: { rows: { label: string; parts: { label: string; value: number; color: string }[] }[]; unit?: string }) {
  const max = Math.max(...rows.map((r) => r.parts.reduce((s, p) => s + p.value, 0)), 1);
  return (
    <div className="stackbars" aria-label="体の中身のくらべ">
      {rows.map((r) => {
        const total = r.parts.reduce((s, p) => s + p.value, 0);
        return (
          <div key={r.label} className="sbrow">
            <span>{r.label}</span>
            <div className="sbtrack" style={{ width: `${(total / max) * 100}%` }}>
              {r.parts.map((p) => (
                <i key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label} ${p.value}${unit}`}>
                  {p.value > 0 && (p.value / total) * 100 > 14 ? `${p.label} ${p.value}${unit}` : ""}
                </i>
              ))}
            </div>
            <b>
              {Math.round(total * 10) / 10}
              {unit}
            </b>
          </div>
        );
      })}
    </div>
  );
}

// 絵の数で見せる：「ごはん 茶碗3杯」のように。
export function IconRow({ icon, n, label, note }: { icon: string; n: number; label: string; note?: string }) {
  const full = Math.floor(n + 0.25);
  const half = n - full >= 0.25;
  return (
    <div className="iconrow">
      <span className="irl">{label}</span>
      <span className="iri" aria-label={`${label} ${n}`}>
        {Array.from({ length: Math.max(0, Math.min(full, 10)) }).map((_, i) => (
          <i key={i}>{icon}</i>
        ))}
        {half && <i className="half">{icon}</i>}
      </span>
      <b>{n}</b>
      {note && <small>{note}</small>}
    </div>
  );
}