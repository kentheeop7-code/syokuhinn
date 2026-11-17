"use client";

import { useEffect, useState } from "react";
import { averageIntake, dateLabel, readLog } from "../lib/daylog";
import { readTarget, type Target } from "../lib/target";
import { TROUBLES } from "../lib/troubles";
import { analyzeTrend, type TrendOut } from "../lib/trend";

// ④ 体重の推移と、いまの状況を入れる → 判定・原因・対策・今後のアクション（根拠つき）
const ROWS = [
  { i: 0, t: "今日" },
  { i: 1, t: "1週間前" },
  { i: 2, t: "2週間前" },
  { i: 3, t: "3週間前" },
  { i: 4, t: "4週間前" },
];
const KEY = "lg-trend";
type Saved = { w: string[]; status: string[]; flags: Record<string, boolean>; at: string };
const num = (s: string) => parseFloat(s) || 0;
const FLAGS: { k: "sleepLow" | "stepsLow" | "noTrain" | "noLog" | "lateSnack"; t: string }[] = [
  { k: "sleepLow", t: "睡眠が6時間未満" },
  { k: "stepsLow", t: "あまり歩かない（1日6,000歩未満）" },
  { k: "noTrain", t: "筋トレをしていない" },
  { k: "noLog", t: "食事を、記録していない" },
  { k: "lateSnack", t: "夜食・間食が多い" },
];
const tone = { ok: "#2f9e75", info: "#3b82c4", warn: "#e0a526", bad: "#e8503c" } as const;

export default function TrendCard() {
  const [w, setW] = useState<string[]>(["", "", "", "", ""]);
  const [status, setStatus] = useState<string[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [target, setTarget] = useState<Target | null>(null);
  const [avg, setAvg] = useState<ReturnType<typeof averageIntake>>(null);
  const [ready, setReady] = useState(false);
  const [at, setAt] = useState("");

  useEffect(() => {
    try {
      const s: Saved | null = JSON.parse(localStorage.getItem(KEY) || "null");
      const now = localStorage.getItem("lg-now") || "";
      if (s) {
        const ww = [...s.w];
        if (now) ww[0] = now;
        setW(ww);
        setStatus(s.status || []);
        setFlags(s.flags || {});
        setAt(s.at || "");
      } else if (now) setW([now, "", "", "", ""]);
    } catch {}
    const read = () => {
      setTarget(readTarget());
      setAvg(averageIntake(readLog()));
    };
    read();
    setReady(true);
    const evs = ["lg-profile-change", "lg-days2-change", "lg-me-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    return () => evs.forEach((e) => window.removeEventListener(e, read));
  }, []);

  const persist = (nw: string[], ns: string[], nf: Record<string, boolean>) => {
    const today = new Date();
    const stamp = `${today.getMonth() + 1}/${today.getDate()}`;
    try {
      localStorage.setItem(KEY, JSON.stringify({ w: nw, status: ns, flags: nf, at: stamp }));
      if (num(nw[0]) > 0) {
        localStorage.setItem("lg-now", nw[0]);
        window.dispatchEvent(new Event("lg-profile-change"));
      }
    } catch {}
    setAt(stamp);
  };
  const setWeight = (i: number, v: string) => {
    const nw = w.map((x, j) => (j === i ? v : x));
    setW(nw);
    persist(nw, status, flags);
  };
  const toggleStatus = (id: string) => {
    const ns = status.includes(id) ? status.filter((x) => x !== id) : [...status, id];
    setStatus(ns);
    persist(w, ns, flags);
  };
  const toggleFlag = (k: string) => {
    const nf = { ...flags, [k]: !flags[k] };
    setFlags(nf);
    persist(w, status, nf);
  };

  if (!ready) return null;
  const ws = w.map(num);
  const hasAny = ws.some((x) => x > 0);
  const res: TrendOut | null =
    target && ws[0] > 0
      ? analyzeTrend({
          w: ws,
          kind: target.kind,
          kcalTarget: target.kcal,
          avgIntake: avg ? avg.kcal : null,
          floor: target.floor,
          flags: { sleepLow: !!flags.sleepLow, stepsLow: !!flags.stepsLow, noTrain: !!flags.noTrain, noLog: !!flags.noLog, lateSnack: !!flags.lateSnack },
          status: status,
        })
      : null;
  const picked = TROUBLES.filter((t) => status.includes(t.id));

  return (
    <section className="card trendcard" id="trend" aria-label="体重の推移と、いまの状況">
      <p className="dch">④ 体重の推移と、いまの状況</p>
      <p className="agnote">体重は、朝・トイレのあとに、同じ条件で測った値を入れます。1週間ごとの値が、わかる範囲で、大丈夫です。{at && `（保存：${at}）`}</p>
      <div className="trw">
        {ROWS.map((r) => (
          <label key={r.i}>
            <span>
              {r.t}
              <small>{r.i === 0 ? dateLabel(0) : dateLabel(r.i * 7)}</small>
            </span>
            <b>
              <input inputMode="decimal" value={w[r.i]} placeholder="—" onChange={(e) => setWeight(r.i, e.target.value)} aria-label={`${r.t}の体重（kg）`} />
              kg
            </b>
          </label>
        ))}
      </div>

      <p className="startlabel">いまの状況（当てはまるもの）</p>
      <div className="trchips">
        {FLAGS.map((f) => (
          <button key={f.k} type="button" aria-pressed={!!flags[f.k]} className={flags[f.k] ? "on" : ""} onClick={() => toggleFlag(f.k)}>
            {f.t}
          </button>
        ))}
      </div>
      <p className="startlabel">困っていること（当てはまるもの）</p>
      <div className="trchips">
        {TROUBLES.map((t) => (
          <button key={t.id} type="button" aria-pressed={status.includes(t.id)} className={status.includes(t.id) ? "on" : ""} onClick={() => toggleStatus(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {!target && <p className="dcwarn">先に、上の「① 基本情報」を入れてください。</p>}
      {target && !hasAny && <p className="agnote">「今日」の体重を入れると、判定が出ます。</p>}

      {res && (
        <div className="trres">
          {res.judge ? (
            <div className="trjudge" style={{ borderColor: tone[res.judge.tone] }}>
              <b style={{ color: tone[res.judge.tone] }}>{res.judge.label}</b>
              <span>{res.slopeText}</span>
            </div>
          ) : (
            <div className="trjudge" style={{ borderColor: tone.info }}>
              <b style={{ color: tone.info }}>まだ、判定できません</b>
              <span>{res.slopeText}</span>
            </div>
          )}

          {res.causes.length > 0 && (
            <div className="trblock">
              <b>考えられる原因</b>
              <ul>
                {res.causes.map((c, i) => (
                  <li key={i}>
                    <b>{c.t}</b>
                    <small>{c.d}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="trblock">
            <b>今後のアクション</b>
            <ol className="tract2">
              {res.actions.map((a, i) => (
                <li key={i}>
                  <em>{a.when}</em>
                  <span>{a.what}</span>
                </li>
              ))}
            </ol>
          </div>

          {picked.map((t) => (
            <div key={t.id} className="trblock">
              <b>
                {t.icon} {t.label}：対処
              </b>
              <ol className="tract3">{t.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              <small className="trsee">受診の目安：{t.see.join("／")}</small>
            </div>
          ))}

          <details className="trblock trev">
            <summary>根拠（論文・公的資料）を見る</summary>
            <ul>
              {res.evidence.map((e, i) => (
                <li key={i}>
                  {e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a>
                </li>
              ))}
              {picked.flatMap((t) => t.evidence).filter((e) => e.pmid).map((e, i) => (
                <li key={"t" + i}>
                  {e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a>
                </li>
              ))}
            </ul>
            <p className="agnote">「現場の目安」と書いた部分は、研究の数値ではなく、実践で使われる目安です。研究の多くは、人数が少ない・期間が短い・対象が限られる、という限界があります。診断・治療ではありません。</p>
          </details>

          <details className="trblock trsee2">
            <summary>こんなときは、専門家（医師・管理栄養士）へ</summary>
            <ul>{res.see.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </details>
        </div>
      )}
    </section>
  );
}
