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
    <ul className="bars" aria-label="筋トレの回数">
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