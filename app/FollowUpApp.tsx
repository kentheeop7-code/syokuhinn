"use client";

import { useEffect, useMemo, useState } from "react";
import { calcEnergy } from "../lib/energy";
import { downloadFile, pagesToJpegFiles, pagesToPdf, renderReportPages, shareFiles } from "../lib/pdfExport";
import { effectivePct, getMethod, macrosFor } from "../lib/methods";
import { analyzeTrend } from "../lib/trend";
import { TROUBLES } from "../lib/troubles";
import { HBars, LineChart, Pie } from "./Charts";
import ShareButtons from "./ShareButtons";

// トレーナー専用：定期的にお客様へ送る「経過報告・調整・プログラム表・対策表」を作り、PDFで共有する。
// ダイエット開始時の総合まとめは「/trainer」。こちらは、2回目以降の、フォロー用。
type Row = { w: string; kg: string; waist: string; fat: string };
type Prog = { d: string; c: string; s: string };
type Meas = { issue: string; cause: string; action: string; due: string; who: string };
type S = {
  name: string;
  round: string;
  date: string;
  nextDate: string;
  sex: "f" | "m";
  band: number;
  age: string;
  height: string;
  target: string;
  days: number;
  pace: "slow" | "mid";
  pal: number;
  pfcMethod: string;
  conds: boolean;
  rows: Row[];
  trainDone: string;
  trainPlan: string;
  logDays: string;
  steps: string;
  sleep: string;
  sleepLow: boolean;
  noLog: boolean;
  status: string[];
  prevKcal: string;
  kcalOverride: string;
  prog: Prog[];
  meas: Meas[];
  homework: string[];
  comment: string;
};
const KEY = "lg-followup";
const ymd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const num = (s: string) => parseFloat(s) || 0;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r10 = (n: number) => Math.round(n / 10) * 10;
const bandOf = (age: number) => (age < 15 ? 0 : age < 18 ? 1 : age < 30 ? 2 : age < 50 ? 3 : age < 65 ? 4 : age < 75 ? 5 : 6);

const PROG_TEMPLATE: Record<number, Prog[]> = {
  1: [
    { d: "筋トレ（週1回）", c: "全身：スクワット／ベンチプレス（または腕立て）／ロウ（ダンベルロー）／ショルダープレス／プランク", s: "各2〜3セット × 8〜12回" },
    { d: "歩く日（週3〜4回）", c: "ウォーキング（早歩き）", s: "30〜40分" },
    { d: "休み", c: "ストレッチ・十分な睡眠", s: "—" },
  ],
  2: [
    { d: "筋トレ① 下半身＋体幹", c: "スクワット／ルーマニアンデッドリフト／ヒップスラスト／プランク", s: "各2〜3セット × 8〜12回" },
    { d: "筋トレ② 上半身", c: "ベンチプレス（または腕立て）／ロウ／ショルダープレス／ラットプルダウン", s: "各2〜3セット × 8〜12回" },
    { d: "歩く日（週2〜3回）", c: "ウォーキング（早歩き）", s: "30〜40分" },
  ],
  3: [
    { d: "筋トレ① 全身A", c: "スクワット／ベンチプレス／ロウ／プランク", s: "各2〜3セット × 8〜12回" },
    { d: "筋トレ② 全身B", c: "ルーマニアンデッドリフト／ショルダープレス／ラットプルダウン／ヒップスラスト", s: "各2〜3セット × 8〜12回" },
    { d: "筋トレ③ 全身C", c: "レッグプレス／腕立て／ケーブルロウ／サイドプランク", s: "各2〜3セット × 8〜12回" },
    { d: "歩く日（週2回）", c: "ウォーキング（早歩き）", s: "30分" },
  ],
};
const DEFAULT: S = {
  name: "",
  round: "2",
  date: ymd(),
  nextDate: "",
  sex: "f",
  band: 3,
  age: "",
  height: "",
  target: "",
  days: 1,
  pace: "slow",
  pal: 1,
  pfcMethod: "balance",
  conds: false,
  rows: [{ w: "0", kg: "", waist: "", fat: "" }, { w: "", kg: "", waist: "", fat: "" }],
  trainDone: "",
  trainPlan: "",
  logDays: "",
  steps: "",
  sleep: "",
  sleepLow: false,
  noLog: false,
  status: [],
  prevKcal: "",
  kcalOverride: "",
  prog: PROG_TEMPLATE[1],
  meas: [],
  homework: ["", "", ""],
  comment: "",
};

const box: React.CSSProperties = { border: "1px solid #d5e8dd", borderRadius: 14, padding: 12, margin: "12px 0", background: "#fff" };
const inp: React.CSSProperties = { font: "inherit", padding: "8px 10px", border: "2px solid #b9d9c8", borderRadius: 10, width: "100%", boxSizing: "border-box", background: "#fff" };
const lab: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, color: "#355" };

export default function FollowUpApp() {
  const [s, setS] = useState<S>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v) setS({ ...DEFAULT, ...v, date: v.date || ymd() });
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s, ready]);

  const up = (p: Partial<S>) => setS((x) => ({ ...x, ...p }));
  const loadFromMemo = () => {
    try {
      const t = JSON.parse(localStorage.getItem("lg-trainer") || "null");
      if (!t) return setMsg("指導メモ（/trainer）の保存データが、見つかりませんでした。");
      const rows = [...s.rows];
      if (!num(rows[0]?.kg) && t.now) rows[0] = { ...rows[0], w: "0", kg: String(t.now) };
      up({
        name: t.name || s.name,
        sex: t.sex === "m" ? "m" : "f",
        band: typeof t.band === "number" ? t.band : s.band,
        age: t.age || s.age,
        height: t.height || s.height,
        target: t.target || s.target,
        days: t.days >= 1 && t.days <= 3 ? t.days : s.days,
        pace: t.pace === "slow" ? "slow" : s.pace,
        pal: typeof t.pal === "number" ? t.pal : s.pal,
        pfcMethod: t.method || "balance",
        conds: Array.isArray(t.conds) && t.conds.length > 0,
        rows,
        prog: PROG_TEMPLATE[t.days >= 1 && t.days <= 3 ? t.days : 1],
      });
      setMsg("指導メモから、お客様の基本情報を読み込みました。");
    } catch {
      setMsg("読み込めませんでした。");
    }
  };

  // ---- 計算 ----
  const rows = s.rows.filter((r) => num(r.kg) > 0 && r.w !== "");
  const sorted = [...rows].sort((a, b) => num(a.w) - num(b.w));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const weeks = first && last ? num(last.w) - num(first.w) : 0;
  const total = first && last ? r1(num(last.kg) - num(first.kg)) : 0;
  const rate = weeks > 0 ? total / weeks : 0;
  const ratePct = last && weeks > 0 ? (rate / num(last.kg)) * 100 : 0;
  const nowW = last ? num(last.kg) : 0;
  const tW = num(s.target);
  const toGo = nowW && tW ? r1(nowW - tW) : 0;
  const age = num(s.age);
  const band = age >= 12 ? bandOf(age) : s.band;
  const energy = useMemo(
    () => (nowW > 0 && age >= 12 && num(s.height) >= 100 ? calcEnergy({ sex: s.sex, band, age, height: num(s.height), weight: nowW, bmr: 0, bodyFat: num(last?.fat ?? ""), muscle: 0, pal: s.pal, targetWeight: tW, pace: s.conds ? "slow" : s.pace }) : null),
    [nowW, age, s.height, s.sex, band, s.pal, tW, s.pace, s.conds, last?.fat]
  );
  const kcal = num(s.kcalOverride) || energy?.target || 0;
  const m = getMethod(s.pfcMethod || "balance");
  const pct = effectivePct(m, null);
  const mac = kcal ? macrosFor(kcal, pct) : null;
  const wArr = [0, 1, 2, 3, 4].map((k) => {
    const lw = last ? num(last.w) - k : 0;
    const r = sorted.find((x) => Math.abs(num(x.w) - lw) <= 0.5);
    return r ? num(r.kg) : 0;
  });
  const res = useMemo(
    () =>
      nowW > 0
        ? analyzeTrend({ w: wArr, kind: energy?.kind ?? (tW && tW < nowW ? "lose" : "keep"), kcalTarget: kcal, avgIntake: null, floor: energy?.floorKcal ?? 0, flags: { sleepLow: s.sleepLow || (num(s.sleep) > 0 && num(s.sleep) < 6), stepsLow: num(s.steps) > 0 && num(s.steps) < 6000, noTrain: num(s.trainDone) === 0 && num(s.trainPlan) > 0, noLog: s.noLog || (num(s.logDays) > 0 && num(s.logDays) < 3), lateSnack: false }, status: s.status })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(wArr), energy?.kind, kcal, s.sleepLow, s.sleep, s.steps, s.trainDone, s.trainPlan, s.noLog, s.logDays, s.status.join(",")]
  );
  const pts = sorted.map((r) => ({ x: num(r.w), y: num(r.kg) }));
  const trainRate = num(s.trainPlan) > 0 ? Math.round((num(s.trainDone) / num(s.trainPlan)) * 100) : 0;
  const logRate = s.logDays !== "" ? Math.round((num(s.logDays) / 7) * 100) : 0;
  const delta = kcal && num(s.prevKcal) ? kcal - num(s.prevKcal) : 0;

  const autoMeasures = () => {
    if (!res) return setMsg("先に、体重（最新）を入れてください。");
    const meas: Meas[] = res.causes.slice(0, 4).map((c, i) => {
      const a = res.actions[Math.min(i, Math.max(0, res.actions.length - 1))];
      return { issue: c.t, cause: c.d, action: a?.what ?? "", due: a?.when ?? "", who: "本人＋トレーナー" };
    });
    TROUBLES.filter((t) => s.status.includes(t.id)).forEach((t) => meas.push({ issue: t.label, cause: t.check[0] ?? "", action: t.steps.slice(0, 2).join(" "), due: "今週", who: "本人" }));
    if (meas.length === 0 && res.actions[0]) meas.push({ issue: res.judge?.label ?? "経過の確認", cause: "—", action: res.actions[0].what, due: res.actions[0].when, who: "本人＋トレーナー" });
    up({ meas });
    setMsg("対策表を、自動で入れました。内容は、直せます。");
  };

  const dateText = (() => {
    const d = new Date(s.date || ymd());
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  })();
  const fileBase = `LIFEGYM_経過報告${s.name ? "_" + s.name : ""}_${(s.date || ymd()).replace(/-/g, "")}`;
  const makeFile = async (kind: "pdf" | "img", how: "download" | "share") => {
    setMsg("");
    setBusy("作成中…（しばらく、お待ちください）");
    try {
      const pages = await renderReportPages(".fureport", (a, b) => setBusy(`作成中… ${a}/${b}`));
      if (kind === "pdf") {
        const blob = await pagesToPdf(pages);
        const file = new File([blob], `${fileBase}.pdf`, { type: "application/pdf" });
        if (how === "share") {
          if (!(await shareFiles([file], "経過報告"))) downloadFile(file, file.name);
        } else downloadFile(file, file.name);
        setMsg(`PDFを作りました（${pages.length}ページ・${Math.round(blob.size / 1024)}KB）。`);
      } else {
        const files = await pagesToJpegFiles(pages, fileBase);
        if (how === "share") {
          if (!(await shareFiles(files, "経過報告"))) for (const f of files) { downloadFile(f, f.name); await new Promise((r) => setTimeout(r, 400)); }
        } else for (const f of files) { downloadFile(f, f.name); await new Promise((r) => setTimeout(r, 400)); }
        setMsg(`画像を作りました（${files.length}枚）。`);
      }
    } catch {
      setMsg("ファイルを作れませんでした。もう一度、お試しください。");
    }
    setBusy("");
  };

  const lineText = [
    `【LIFEGYM 経過報告 第${s.round || "—"}回】${s.name ? `${s.name}さん` : ""}（${dateText}）`,
    "",
    last ? `体重：${first ? num(first.kg) : "—"}kg → ${nowW}kg（${total > 0 ? "+" : ""}${total}kg／${weeks}週）${tW ? `　目標 ${tW}kg まで あと${toGo}kg` : ""}` : "",
    res?.judge ? `判定：${res.judge.label}` : "",
    kcal && mac ? `これからの目安：約${r10(kcal).toLocaleString()}kcal（P${mac.p}g・F${mac.f}g・C${mac.c}g）${delta ? `　前回より ${delta > 0 ? "+" : ""}${r10(delta)}kcal` : ""}` : "",
    s.homework.filter(Boolean).length ? `\n今週の宿題：\n${s.homework.filter(Boolean).map((h, i) => `${i + 1}. ${h}`).join("\n")}` : "",
    s.nextDate ? `\n次回：${s.nextDate}` : "",
    s.comment ? `\nトレーナーから：${s.comment}` : "",
    "\n※ 目安です。持病・服薬のある方は、主治医にご確認ください。",
  ]
    .filter((x) => x !== "")
    .join("\n");

  if (!ready) return null;
  return (
    <div className="fu">
      <div style={box}>
        <b>使いかた</b>
        <ol style={{ margin: "6px 0 0 18px" }}>
          <li>「指導メモから読み込む」で、お客様の基本情報を入れる（または、直接入力）</li>
          <li>体重・実績・いまの状況を入れる → 判定・原因・対策が、自動で出ます</li>
          <li>プログラム表・対策表・宿題を整えて、下のレポートを確認 → PDFで、お客様に共有</li>
        </ol>
        <p className="agnote" style={{ margin: "6px 0 0" }}>ダイエット開始時の総合まとめは「指導メモ（/trainer）」です。こちらは、2回目以降の、定期フォロー用です。</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <button type="button" className="trchip on" onClick={loadFromMemo}>指導メモから読み込む</button>
          <a className="trchip" href="/trainer">← 指導メモ</a>
        </div>
      </div>

      <details style={box} open>
        <summary><b>① お客様・回</b></summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginTop: 8 }}>
          <label style={lab}>お名前<input style={inp} value={s.name} onChange={(e) => up({ name: e.target.value })} /></label>
          <label style={lab}>第 何回<input style={inp} inputMode="numeric" value={s.round} onChange={(e) => up({ round: e.target.value })} /></label>
          <label style={lab}>実施日<input style={inp} type="date" value={s.date} onChange={(e) => up({ date: e.target.value })} /></label>
          <label style={lab}>次回の予定<input style={inp} type="date" value={s.nextDate} onChange={(e) => up({ nextDate: e.target.value })} /></label>
          <label style={lab}>性別<select style={inp} value={s.sex} onChange={(e) => up({ sex: e.target.value as "f" | "m" })}><option value="f">女性</option><option value="m">男性</option></select></label>
          <label style={lab}>年齢<input style={inp} inputMode="numeric" value={s.age} onChange={(e) => up({ age: e.target.value })} /></label>
          <label style={lab}>身長 cm<input style={inp} inputMode="decimal" value={s.height} onChange={(e) => up({ height: e.target.value })} /></label>
          <label style={lab}>目標体重 kg<input style={inp} inputMode="decimal" value={s.target} onChange={(e) => up({ target: e.target.value })} /></label>
          <label style={lab}>活動量<select style={inp} value={s.pal} onChange={(e) => up({ pal: +e.target.value })}><option value={0}>低い</option><option value={1}>ふつう</option><option value={2}>高い</option></select></label>
          <label style={lab}>筋トレ 週<select style={inp} value={s.days} onChange={(e) => up({ days: +e.target.value, prog: PROG_TEMPLATE[+e.target.value] })}><option value={1}>1回</option><option value={2}>2回</option><option value={3}>3回</option></select></label>
        </div>
        <label style={{ display: "flex", gap: 8, marginTop: 8 }}><input type="checkbox" checked={s.conds} onChange={(e) => up({ conds: e.target.checked })} />持病・服薬あり（減らすペースを「ゆっくり」にします）</label>
      </details>

      <details style={box} open>
        <summary><b>② 途中結果（体重・ウエスト・体脂肪）</b></summary>
        <p className="agnote">「週」は、開始からの週数（開始＝0）です。朝・トイレのあとに、同じ条件で測った値を入れます。</p>
        {s.rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 36px", gap: 6, margin: "4px 0", alignItems: "end" }}>
            <label style={lab}>週<input style={inp} inputMode="numeric" value={r.w} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, w: e.target.value } : x)) })} /></label>
            <label style={lab}>体重kg<input style={inp} inputMode="decimal" value={r.kg} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)) })} /></label>
            <label style={lab}>ウエストcm<input style={inp} inputMode="decimal" value={r.waist} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, waist: e.target.value } : x)) })} /></label>
            <label style={lab}>体脂肪%<input style={inp} inputMode="decimal" value={r.fat} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, fat: e.target.value } : x)) })} /></label>
            <button type="button" className="trchip" aria-label="この行を消す" onClick={() => up({ rows: s.rows.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button type="button" className="trchip" onClick={() => up({ rows: [...s.rows, { w: String(Math.max(0, ...s.rows.map((x) => num(x.w))) + 1), kg: "", waist: "", fat: "" }] })}>＋ 行を足す（次の週）</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginTop: 10 }}>
          <label style={lab}>筋トレ 実施（回）<input style={inp} inputMode="numeric" value={s.trainDone} onChange={(e) => up({ trainDone: e.target.value })} /></label>
          <label style={lab}>筋トレ 予定（回）<input style={inp} inputMode="numeric" value={s.trainPlan} onChange={(e) => up({ trainPlan: e.target.value })} /></label>
          <label style={lab}>食事記録（日／7日）<input style={inp} inputMode="numeric" value={s.logDays} onChange={(e) => up({ logDays: e.target.value })} /></label>
          <label style={lab}>歩数（平均）<input style={inp} inputMode="numeric" value={s.steps} onChange={(e) => up({ steps: e.target.value })} /></label>
          <label style={lab}>睡眠（平均 時間）<input style={inp} inputMode="decimal" value={s.sleep} onChange={(e) => up({ sleep: e.target.value })} /></label>
          <label style={lab}>前回の目標kcal<input style={inp} inputMode="numeric" value={s.prevKcal} onChange={(e) => up({ prevKcal: e.target.value })} /></label>
        </div>
        <p style={{ ...lab, marginTop: 10 }}>いまの状況（当てはまるもの）</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TROUBLES.map((t) => (
            <button key={t.id} type="button" aria-pressed={s.status.includes(t.id)} className={s.status.includes(t.id) ? "trchip on" : "trchip"} onClick={() => up({ status: s.status.includes(t.id) ? s.status.filter((x) => x !== t.id) : [...s.status, t.id] })}>{t.icon} {t.label}</button>
          ))}
        </div>
      </details>

      <details style={box}>
        <summary><b>③ 調整（カロリー・PFC）</b></summary>
        <p className="agnote">最新の体重から、目標カロリーを出し直します。変えたいときは、数字を入れます。</p>
        <label style={lab}>目標kcalを、直接、決める（空欄＝自動：{energy ? energy.target.toLocaleString() : "—"}kcal）<input style={inp} inputMode="numeric" value={s.kcalOverride} onChange={(e) => up({ kcalOverride: e.target.value })} /></label>
      </details>

      <details style={box} open>
        <summary><b>④ プログラム表・対策表・宿題</b></summary>
        <p style={lab}>プログラム表（直せます）</p>
        {s.prog.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 36px", gap: 6, margin: "4px 0" }}>
            <input style={inp} value={p.d} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)) })} aria-label="日・種類" />
            <input style={inp} value={p.c} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, c: e.target.value } : x)) })} aria-label="内容" />
            <input style={inp} value={p.s} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, s: e.target.value } : x)) })} aria-label="量" />
            <button type="button" className="trchip" aria-label="消す" onClick={() => up({ prog: s.prog.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="trchip" onClick={() => up({ prog: [...s.prog, { d: "", c: "", s: "" }] })}>＋ 行を足す</button>
          <button type="button" className="trchip" onClick={() => up({ prog: PROG_TEMPLATE[s.days] })}>筋トレ週{s.days}回のひな形に戻す</button>
        </div>
        <p style={{ ...lab, marginTop: 12 }}>対策表</p>
        <button type="button" className="trchip on" onClick={autoMeasures}>🔄 判定から、自動で入れる</button>
        {s.meas.map((m2, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.6fr 70px 36px", gap: 6, margin: "4px 0" }}>
            <input style={inp} value={m2.issue} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, issue: e.target.value } : x)) })} aria-label="課題" />
            <input style={inp} value={m2.cause} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, cause: e.target.value } : x)) })} aria-label="原因" />
            <input style={inp} value={m2.action} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, action: e.target.value } : x)) })} aria-label="対策" />
            <input style={inp} value={m2.due} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)) })} aria-label="いつまで" />
            <button type="button" className="trchip" aria-label="消す" onClick={() => up({ meas: s.meas.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button type="button" className="trchip" onClick={() => up({ meas: [...s.meas, { issue: "", cause: "", action: "", due: "", who: "本人＋トレーナー" }] })}>＋ 行を足す</button>
        <p style={{ ...lab, marginTop: 12 }}>今週の宿題（3つまで）</p>
        {s.homework.map((h, i) => (
          <input key={i} style={{ ...inp, marginBottom: 6 }} value={h} placeholder={`宿題 ${i + 1}`} onChange={(e) => up({ homework: s.homework.map((x, j) => (j === i ? e.target.value : x)) })} />
        ))}
        <label style={lab}>トレーナーから、ひとこと<textarea style={{ ...inp, minHeight: 80 }} value={s.comment} onChange={(e) => up({ comment: e.target.value })} /></label>
      </details>

      <div style={box}>
        <b>⑤ お客様に共有</b>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <button type="button" className="linebtn" onClick={() => makeFile("pdf", "download")} disabled={!!busy}>📥 PDFを作る（ダウンロード）</button>
          <button type="button" className="btn ghost" onClick={() => makeFile("pdf", "share")} disabled={!!busy}>📤 PDFを、LINEなどで共有</button>
          <button type="button" className="btn ghost" onClick={() => makeFile("img", "share")} disabled={!!busy}>🖼 画像で保存・共有</button>
        </div>
        {(busy || msg) && <p className="agnote" role="status">{busy || msg}</p>}
        <p className="agnote">LINEで、文章だけを送るとき：</p>
        <ShareButtons text={lineText} label="LINE用の文章" />
      </div>

      <article className="report fureport" aria-label="お客様向け 経過報告">
        <header className="rcover">
          <div className="rcb">
            <p className="rbrand">LIFEGYM</p>
            <p className="rtag">経過報告・調整プラン　第{s.round || "—"}回</p>
          </div>
          <h1>{s.name ? `${s.name}さんの、` : ""}これまでの結果と、これからの調整</h1>
          <p className="rmeta">{dateText}{s.nextDate ? `　／　次回：${s.nextDate.replace(/-/g, "/")}` : ""}</p>
        </header>

        <section>
          <h2>1. 途中結果</h2>
          <div className="furk">
            <div><small>開始</small><b>{first ? `${num(first.kg)}kg` : "—"}</b></div>
            <div><small>いま</small><b>{last ? `${nowW}kg` : "—"}</b></div>
            <div><small>増減（{weeks}週）</small><b style={{ color: total <= 0 ? "#1f8a5b" : "#d23f2b" }}>{last && first ? `${total > 0 ? "+" : ""}${total}kg` : "—"}</b></div>
            <div><small>目標まで</small><b>{tW && nowW ? `あと${Math.max(0, toGo)}kg` : "—"}</b></div>
          </div>
          {pts.length >= 2 && <LineChart pts={pts} target={tW || undefined} />}
          {weeks > 0 && <p className="rnote">1週間あたり {r1(rate) > 0 ? "+" : ""}{r1(rate * 100) / 100}kg（体重の {ratePct > 0 ? "+" : ""}{r1(ratePct * 10) / 10}%）。目安は、体重の0.5〜1%を減らすペースです。</p>}
          {(sorted.some((r) => num(r.waist) > 0) || sorted.some((r) => num(r.fat) > 0)) && (
            <table className="rtable">
              <thead><tr><th>週</th><th>体重</th><th>ウエスト</th><th>体脂肪率</th></tr></thead>
              <tbody>{sorted.map((r, i) => <tr key={i}><td>{r.w}</td><td>{r.kg}kg</td><td>{r.waist ? `${r.waist}cm` : "—"}</td><td>{r.fat ? `${r.fat}%` : "—"}</td></tr>)}</tbody>
            </table>
          )}
          <h3 className="fuh3">がんばりの記録</h3>
          <HBars unit="%" items={[
            ...(num(s.trainPlan) > 0 ? [{ label: `筋トレ（${s.trainDone || 0}/${s.trainPlan}回）`, value: Math.min(100, trainRate), color: "#3b82c4" }] : []),
            ...(s.logDays !== "" ? [{ label: `食事の記録（${s.logDays}/7日）`, value: Math.min(100, logRate), color: "#2f9e75" }] : []),
            ...(num(s.steps) > 0 ? [{ label: `歩数（${num(s.steps).toLocaleString()}歩）`, value: Math.min(100, Math.round((num(s.steps) / 8000) * 100)), color: "#e0a526" }] : []),
            ...(num(s.sleep) > 0 ? [{ label: `睡眠（${s.sleep}時間）`, value: Math.min(100, Math.round((num(s.sleep) / 7) * 100)), color: "#7a5bd0" }] : []),
          ]} target={100} targetLabel="目標" />
        </section>

        {res?.judge && (
          <section>
            <h2>2. いまの判定と、原因</h2>
            <div className="fujudge"><b>{res.judge.label}</b><span>{res.slopeText}</span></div>
            {res.causes.length > 0 && <ul className="fucauses">{res.causes.map((c, i) => <li key={i}><b>{c.t}</b><small>{c.d}</small></li>)}</ul>}
          </section>
        )}

        {kcal > 0 && mac && (
          <section>
            <h2>3. これからの食事の目安（調整）</h2>
            <div className="furow">
              <Pie data={[{ label: "たんぱく質", value: mac.p * 4, color: "#3b82c4" }, { label: "脂質", value: mac.f * 9, color: "#e0a526" }, { label: "炭水化物", value: mac.c * 4, color: "#2f9e75" }]} />
              <div>
                <p className="fubig">約{r10(kcal).toLocaleString()}<span>kcal／日</span></p>
                {delta !== 0 && <p className="rnote">前回（{r10(num(s.prevKcal)).toLocaleString()}kcal）より {delta > 0 ? "+" : ""}{r10(delta)}kcal</p>}
                <p>たんぱく質 <b>{mac.p}g</b>　脂質 <b>{mac.f}g</b>　炭水化物 <b>{mac.c}g</b></p>
                <p className="rnote">{m.name}（P{pct.p}%・F{pct.f}%・C{pct.c}%）。最新の体重で、計算し直しました。</p>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2>4. トレーニング・プログラム表</h2>
          <table className="rtable">
            <thead><tr><th>日・種類</th><th>内容</th><th>量</th></tr></thead>
            <tbody>{s.prog.filter((p) => p.d || p.c).map((p, i) => <tr key={i}><td>{p.d}</td><td>{p.c}</td><td>{p.s}</td></tr>)}</tbody>
          </table>
          <p className="rnote">筋トレは、同じ部位を週2回あてると増えやすい傾向があります（Schoenfeld 2016）。週の総量が同じなら、回数による筋力の差は見られませんでした（Grgic 2018）。続けられる範囲で。</p>
        </section>

        {s.meas.filter((x) => x.issue || x.action).length > 0 && (
          <section>
            <h2>5. 対策表（課題 → 原因 → 対策）</h2>
            <table className="rtable">
              <thead><tr><th>課題</th><th>原因</th><th>対策</th><th>いつまで</th></tr></thead>
              <tbody>{s.meas.filter((x) => x.issue || x.action).map((x, i) => <tr key={i}><td>{x.issue}</td><td>{x.cause}</td><td>{x.action}</td><td>{x.due}</td></tr>)}</tbody>
            </table>
          </section>
        )}

        <section>
          <h2>6. 今週の宿題とチェック表</h2>
          {s.homework.filter(Boolean).length > 0 && <ol className="fuhw">{s.homework.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}</ol>}
          <table className="rtable fuweek">
            <thead><tr><th>できたら ○</th>{["月", "火", "水", "木", "金", "土", "日"].map((d) => <th key={d}>{d}</th>)}</tr></thead>
            <tbody>
              {["食事の記録", "筋トレ・歩く", "睡眠6時間以上", "水・お茶 4杯以上"].map((r) => <tr key={r}><th>{r}</th>{Array.from({ length: 7 }, (_, i) => <td key={i}>&nbsp;</td>)}</tr>)}
            </tbody>
          </table>
        </section>

        {s.comment && (
          <section>
            <h2>トレーナーから</h2>
            <p className="fucomment">{s.comment}</p>
          </section>
        )}

        {res && res.evidence.length > 0 && (
          <section>
            <h2>根拠（論文・公的資料）</h2>
            <ul className="fuev">{res.evidence.slice(0, 5).map((e, i) => <li key={i}>{e.label}：{e.note}</li>)}</ul>
          </section>
        )}
        <p className="rfoot">※ 一般的な目安です。診断・治療ではありません。持病・服薬のある方は、主治医にご確認ください。体調の変化・強い疲れ・月経が止まったときは、早めに相談してください。</p>
      </article>
    </div>
  );
}
