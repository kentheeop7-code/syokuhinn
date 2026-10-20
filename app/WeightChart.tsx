"use client";

import { useEffect, useMemo, useState } from "react";
import { ageBand, BAND_LABEL, MONTHLY_CAP_PCT } from "./ageInfo";
import { REF, useMe } from "./me";

// 現在の体重と目標体重から、目標に着く時期を予測する。毎日の記録はとらない。
// ペースをタップで選び、スライダーで「○か月後の体重」を見られる。
const PACES = [
  { id: "w1", label: "ゆっくり", sub: "週1回トレーニング", perMonth: 2, color: "#2f7d5b" },
  { id: "w2", label: "しっかり", sub: "週2回トレーニング", perMonth: 3, color: "#e07a3f" },
];

const r1 = (n: number) => Math.round(n * 10) / 10;
const MAX_MONTHS = 12;

const W = 360;
const H = 260;
const M = { l: 40, r: 18, t: 22, b: 34 };

const addMonths = (months: number) => {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(months * 30.4));
  return d;
};
const ymText = (months: number) => {
  const d = addMonths(months);
  return `${d.getFullYear()}年${d.getMonth() + 1}月ごろ`;
};
const mLabel = (months: number) => `${addMonths(months).getMonth() + 1}月`;

export default function WeightChart() {
  const me = useMe();
  const [now, setNow] = useState("");
  const [goal, setGoal] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [age, setAge] = useState(0);
  const [pace, setPace] = useState("w1");
  const [slide, setSlide] = useState(0); // 半月単位

  // 目標体重は「目標を決める」で入れた体重と連動する（入力のたびに更新される）
  useEffect(() => {
    const readGoal = () => {
      try {
        const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
        setGoal(p?.weight ? String(p.weight) : "");
        setAge(parseFloat(p?.age) || 0);
      } catch {}
    };
    try {
      const n = localStorage.getItem("lg-now");
      if (n) setNow(n);
      const pc = localStorage.getItem("lg-wpace");
      if (pc) setPace(pc);
    } catch {}
    readGoal();
    setLoaded(true);
    window.addEventListener("lg-profile-change", readGoal);
    window.addEventListener("storage", readGoal);
    return () => {
      window.removeEventListener("lg-profile-change", readGoal);
      window.removeEventListener("storage", readGoal);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-now", now);
      localStorage.setItem("lg-wpace", pace);
    } catch {}
  }, [now, pace, loaded]);

  const w0 = parseFloat(now);
  const wt = parseFloat(goal);
  const okNow = w0 >= 20 && w0 <= 300;
  const okGoal = wt >= 20 && wt <= 300;
  const diff = okNow && okGoal ? r1(w0 - wt) : 0;
  const band = age >= 18 && age <= 99 ? ageBand(age) : null;
  const capPct = band ? MONTHLY_CAP_PCT[band] : 0;
  const capKg = okNow && capPct ? r1((w0 * capPct) / 100) : 0;
  const paces = capKg > 0 && capKg < 1.9 ? [{ id: "age", label: "年齢に合わせて", sub: `${age}歳の目安`, perMonth: capKg, color: "#7a5bd0" }, ...PACES] : PACES;
  const cur = paces.find((p) => p.id === pace) ?? paces[0];

  const step = (d: number) => {
    const v = (okNow ? w0 : 60) + d;
    setNow(String(Math.min(300, Math.max(20, r1(v)))));
  };

  const chart = useMemo(() => {
    if (!okNow || !okGoal || diff <= 0) return null;
    const rows = paces.map((p) => ({ ...p, months: diff / p.perMonth }));
    const slowest = Math.max(...rows.map((r) => r.months));
    const span = Math.min(MAX_MONTHS, Math.max(2, Math.ceil(slowest)));
    const x = (m: number) => M.l + (m / span) * (W - M.l - M.r);
    const ymin = Math.floor(wt - 1);
    const ymax = Math.ceil(w0 + 1);
    const y = (v: number) => M.t + ((ymax - v) / (ymax - ymin)) * (H - M.t - M.b);
    const stepY = ymax - ymin > 12 ? 4 : ymax - ymin > 6 ? 2 : 1;
    const yTicks: number[] = [];
    for (let v = Math.ceil(ymin / stepY) * stepY; v <= ymax; v += stepY) yTicks.push(v);
    const xStep = span > 8 ? 3 : span > 4 ? 2 : 1;
    const xTicks: number[] = [];
    for (let m = 0; m <= span; m += xStep) xTicks.push(m);
    return { span, x, y, yTicks, xTicks, rows };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [okNow, okGoal, diff, w0, wt, capKg, age]);

  const row = chart?.rows.find((r) => r.id === cur.id) ?? chart?.rows[0];
  const maxSlide = chart ? chart.span * 2 : 0;
  const m = Math.min(slide, maxSlide) / 2;
  const wAt = row ? Math.max(wt, r1(w0 - row.perMonth * m)) : 0;
  const reached = row ? row.months <= (chart?.span ?? 0) : false;

  if (me.ready && me.isYouth) {
    return (
      <section className="card wchart2" aria-label="体重と成長">
        <h2 className="h2">⚖️ 体重と成長</h2>
        <p className="caution">
          ⚠ 中学生・高校生は、からだが大きく育つ時期です。体重を減らす目標や、到達の予測は、おすすめしません。1日に必要なエネルギーの目安は、約{REF[me.sexKey].kcal[me.band][me.pal].toLocaleString()}kcalです。食事を減らさず、毎日の朝・昼・夕のごはんと、運動・睡眠で、からだを整えましょう。体型や体重で悩んでいるときは、保護者・学校の先生・医師に相談してください。
        </p>
      </section>
    );
  }

  return (
    <section className="card wchart2" aria-label="目標体重までの予測">
      <h2 className="h2">⚖️ 目標体重に着く時期の予測</h2>

      <div className="wc2in">
        <div className="wc2box">
          <span>いまの体重</span>
          <div className="wc2step">
            <button type="button" onClick={() => step(-0.5)} aria-label="0.5kg へらす">
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              placeholder="60.0"
              value={now}
              onChange={(e) => setNow(e.target.value)}
              aria-label="現在の体重（kg）"
            />
            <button type="button" onClick={() => step(0.5)} aria-label="0.5kg ふやす">
              ＋
            </button>
          </div>
          <small>kg（±0.5kgずつ）</small>
        </div>
        <div className="wc2box goal">
          <span>目標体重</span>
          <b className="wc2goalv">{okGoal ? `${wt}kg` : "未設定"}</b>
          <small>
            <a
              href="#goal-setting"
              onClick={(e) => {
                e.preventDefault();
                const t = [...document.querySelectorAll("h2,h3,.agtitle")].find((el) => el.textContent?.includes("目標体重"));
                (t as HTMLElement | undefined)?.scrollIntoView({ block: "center", behavior: "smooth" });
              }}
            >
              変える（「目標を決める」へ）
            </a>
          </small>
        </div>
      </div>

      {!okNow || !okGoal ? (
        <p className="wc2empty">
          {okNow ? "目標体重を入れると、予測が出ます。下の「目標を決める」で、目標体重を入れてください。" : "いまの体重を入れると、目標に着く時期の予測が出ます。"}
        </p>
      ) : diff <= 0 ? (
        <p className="wc2empty">目標体重が、いまの体重より低くなるように入れてください。</p>
      ) : (
        chart &&
        row && (
          <>
            <p className="wc2label">ペースを選ぶ</p>
            <div className="wc2paces" role="tablist">
              {paces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={p.id === cur.id}
                  className={p.id === cur.id ? "on" : ""}
                  style={p.id === cur.id ? { borderColor: p.color, background: p.color } : undefined}
                  onClick={() => setPace(p.id)}
                >
                  <b>{p.label}</b>
                  <small>
                    {p.sub}・月{p.perMonth}kg
                  </small>
                </button>
              ))}
            </div>

            <div className="wc2hero" style={{ borderColor: cur.color }}>
              <span>目標まで あと</span>
              <b style={{ color: cur.color }}>{diff}kg</b>
              <p>
                {reached ? (
                  <>
                    約 <strong>{r1(row.months)}か月</strong>で到達（<strong>{ymText(row.months)}</strong>）
                  </>
                ) : (
                  <>
                    目標までは、約 <strong>{r1(row.months)}か月</strong>（{ymText(row.months)}）
                  </>
                )}
              </p>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="wc2svg" role="img" aria-label="目標体重までの体重の変化の予測">
              {chart.yTicks.map((v) => (
                <g key={v}>
                  <line x1={M.l} x2={W - M.r} y1={chart.y(v)} y2={chart.y(v)} stroke="#e4ece6" strokeWidth="1" />
                  <text x={M.l - 6} y={chart.y(v) + 4} fontSize="11" fill="#5c7266" textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {chart.xTicks.map((t) => (
                <text key={t} x={chart.x(t)} y={H - 12} fontSize="11" fill="#5c7266" textAnchor={t === 0 ? "start" : "middle"}>
                  {t === 0 ? "今" : mLabel(t)}
                </text>
              ))}
              <line x1={M.l} x2={W - M.r} y1={chart.y(wt)} y2={chart.y(wt)} stroke="#2f7d5b" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={W - M.r} y={chart.y(wt) - 6} fontSize="11" fontWeight="700" fill="#2f7d5b" textAnchor="end">
                目標 {wt}kg
              </text>
              {chart.rows.map((r) => {
                const end = Math.min(r.months, chart.span);
                const sel = r.id === cur.id;
                return (
                  <g key={r.id} opacity={sel ? 1 : 0.28}>
                    <line x1={chart.x(0)} y1={chart.y(w0)} x2={chart.x(end)} y2={chart.y(w0 - r.perMonth * end)} stroke={r.color} strokeWidth={sel ? 4 : 2.5} strokeLinecap="round" />
                    <circle cx={chart.x(end)} cy={chart.y(w0 - r.perMonth * end)} r={sel ? 7 : 4} fill="#fff" stroke={r.color} strokeWidth="3" />
                  </g>
                );
              })}
              {/* スライダーで選んだ時点 */}
              <line x1={chart.x(m)} x2={chart.x(m)} y1={M.t} y2={H - M.b} stroke={cur.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
              <circle cx={chart.x(m)} cy={chart.y(wAt)} r="8" fill={cur.color} stroke="#fff" strokeWidth="3" />
              <text
                x={Math.min(Math.max(chart.x(m), M.l + 24), W - M.r - 24)}
                y={chart.y(wAt) - 14}
                fontSize="13"
                fontWeight="800"
                fill={cur.color}
                textAnchor="middle"
              >
                {wAt}kg
              </text>
              <circle cx={chart.x(0)} cy={chart.y(w0)} r="5" fill="#1f3a2b" />
            </svg>

            <div className="wc2slide">
              <label htmlFor="wc2range">
                <b>{m === 0 ? "いま" : `${m}か月後`}</b>
                <span>（{m === 0 ? "今日" : ymText(m)}）</span>
                <em>
                  体重の目安 <strong style={{ color: cur.color }}>{wAt}kg</strong>
                </em>
              </label>
              <input id="wc2range" type="range" min="0" max={maxSlide} step="1" value={Math.min(slide, maxSlide)} onChange={(e) => setSlide(parseInt(e.target.value, 10))} />
              <small>つまみを動かして、○か月後の体重を見られます</small>
            </div>

            <details className="wc2more">
              <summary>ペースの考え方・年齢の目安を見る</summary>
              <p>
                体脂肪1kgは、約7,200kcalにあたります。月2kgなら1日約480kcal、月3kgなら1日約720kcalを、食事と運動で減らす計算です。食事を減らしすぎると筋肉も減りやすいので、たんぱく質をしっかりとって、運動と組み合わせましょう。
              </p>
              {band && (
                <p>
                  <b>
                    {age}歳（{BAND_LABEL[band]}）の目安：
                  </b>
                  1か月に減らすのは、体重の約{capPct}%（あなたの体重で約{capKg}kg）まで。
                  {band === "s60" ? "60歳以上は、筋肉と骨を守るため、ゆっくり進めるのが大切です。" : band === "m40" ? "40〜50代は、筋肉と骨の減りが始まる時期。急な減量は避けましょう。" : "30代前後は、骨量を保つため、BMI18.5未満にならないよう注意しましょう。"}
                </p>
              )}
              {capPct > 0 && (row.perMonth / w0) * 100 > capPct && <p className="wc2warn">選んだペースは、{age}歳の目安（月{capPct}%）を超えます。ゆっくりめがおすすめです。</p>}
              {diff / PACES[1].perMonth > 6 && <p>減らす量が大きいときは、まず3か月で「いまの体重の5%ほど」を目安に、少しずつ進めるのがおすすめです。</p>}
            </details>
          </>
        )
      )}
      <p className="wc2foot">※ 一般的な平均の目安です。体重の減り方には個人差があります。無理な減量はせず、食事（PFC）と運動を合わせて進めましょう。</p>
    </section>
  );
}

