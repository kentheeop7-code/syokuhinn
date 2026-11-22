"use client";

import { useEffect, useMemo, useState } from "react";
import { calcEnergy } from "../lib/energy";
import { downloadFile, pagesToJpegFiles, pagesToPdf, renderReportPages, shareFiles } from "../lib/pdfExport";
import { METHODS, effectivePct, getMethod, macrosFor } from "../lib/methods";
import { NUTS, NUT_BASIS, foodsFor, unitLabel } from "../lib/foodlist";
import { analyzeTrend } from "../lib/trend";
import { TROUBLES } from "../lib/troubles";
import { HBars, LineChart, Pie } from "./Charts";
import ShareButtons from "./ShareButtons";
import { AddFoods, NextActions } from "./ExpertSection";
import { SHORT_PLANS, getShortPlan } from "../lib/shortplans";
import ShortPlanView from "./ShortPlanView";
import { BREAKERS, suggestBreakers } from "../lib/breakers";
import BreakerView from "./BreakerView";
import MethodPlans, { PACK_DEFAULT, PACK_OPTIONS } from "./MethodPlans";
import { advise, type Advice } from "../lib/advisor";
import { expertAssess } from "../lib/expert";
import { computeGoal } from "../lib/goal";
import { goalOf } from "../lib/meals";

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
  shortPlan: string;
  breakers: string[];
  pack: string[];
  bkNotes: Record<string, string>;
  situation: string;
  advice: string;
  foodAmt: string;
  fastStart: string;
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
  shortPlan: "",
  breakers: [],
  pack: [],
  bkNotes: {},
  situation: "",
  advice: "",
  foodAmt: "10",
  fastStart: "12",
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

const box: React.CSSProperties = { border: "2px solid #cfe6d8", borderRadius: 18, padding: "14px 16px", margin: "16px 0", background: "#fff" };
const inp: React.CSSProperties = { font: "inherit", fontSize: 17, padding: "11px 12px", border: "2px solid #b9d9c8", borderRadius: 12, width: "100%", boxSizing: "border-box", background: "#fff", minHeight: 48 };
const lab: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 800, color: "#244" };
const sum: React.CSSProperties = { fontSize: 19, fontWeight: 800, color: "#0f3d2e", cursor: "pointer", padding: "4px 0" };
const card: React.CSSProperties = { position: "relative", border: "2px solid #e0eee6", borderRadius: 14, padding: "12px 12px 10px", margin: "10px 0", background: "#f9fcfa", display: "grid", gap: 8 };
const del: React.CSSProperties = { position: "absolute", top: 6, right: 6, width: 40, height: 40, border: "none", borderRadius: 999, background: "#fff", fontSize: 18, cursor: "pointer", color: "#a33" };

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
  const [asked, setAsked] = useState("");
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
  const sp = getShortPlan(s.shortPlan);
  const foodAmtN = num(s.foodAmt) > 0 ? num(s.foodAmt) : 10;
  const fastStartN = num(s.fastStart) || 12;
  const goalPct = first && last && tW && num(first.kg) !== tW ? Math.max(0, Math.min(100, Math.round(((num(first.kg) - nowW) / (num(first.kg) - tW)) * 100))) : 0;
  const intervals = sorted.slice(1).map((r, i) => ({ label: `${sorted[i].w}→${r.w}週`, value: Math.round((num(r.kg) - num(sorted[i].kg)) * 10) / 10 }));
  const waistPts = sorted.filter((r) => num(r.waist) > 0).map((r) => ({ x: num(r.w), y: num(r.waist) }));
  const fatPts = sorted.filter((r) => num(r.fat) > 0).map((r) => ({ x: num(r.w), y: num(r.fat) }));
  const delta = kcal && num(s.prevKcal) ? kcal - num(s.prevKcal) : 0;
  const gpF = nowW > 0 && tW > 0 ? computeGoal(nowW, tW, s.days, s.conds ? "slow" : s.pace) : null;
  const glF = goalOf(s.sex, band);
  const expert = expertAssess({ sex: s.sex, age, band, height: num(s.height), weight: nowW, targetWeight: tW, goal: "diet", body: null, energy, gp: gpF, bmrInput: 0, strengthDays: s.days, otherMin: 0, guideMin: 150, water: 0, conds: s.conds ? ["cond"] : [], cur: null, goalP: energy?.protein ?? parseFloat(glF.p || "0"), goalFi: parseFloat(glF.fi || "0"), want: kcal, nextDate: s.nextDate ? s.nextDate.replace(/-/g, "/") : "" });

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
    s.pack.length ? `\nダイエット方法の施策：${PACK_OPTIONS.filter((o) => s.pack.includes(o.id)).map((o) => o.label).join("・")}（くわしくは、PDFをご覧ください）` : "",
    s.advice.trim() ? `\n【くわしいアドバイス】\n${s.advice.trim()}` : "",
    s.comment ? `\nトレーナーから：${s.comment}` : "",
    "\n※ 目安です。持病・服薬のある方は、主治医にご確認ください。",
  ]
    .filter((x) => x !== "")
    .join("\n");

  if (!ready) return null;
  let sec = 0;
  const H = (t: string) => `${++sec}. ${t}`;
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
        </div>
      </div>

      <div className="fustrip" aria-label="いまの状況">
        <div><small>最新の体重</small><b>{last ? `${nowW}kg` : "—"}</b></div>
        <div><small>判定</small><b>{res?.judge ? res.judge.label.replace(/（.*$/, "") : "—"}</b></div>
        <div><small>目標</small><b>{kcal ? `${r10(kcal).toLocaleString()}kcal` : "—"}</b></div>
        <a href="#fu-share">共有へ ▼</a>
      </div>

      <details style={box} open>
        <summary style={sum}>① お客様・回{s.name ? `：${s.name}さん` : ""}</summary>
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
        <summary style={sum}>② 途中結果（体重・ウエスト・体脂肪）</summary>
        <p className="agnote">「週」は、開始からの週数（開始＝0）です。朝・トイレのあとに、同じ条件で測った値を入れます。</p>
        {s.rows.map((r, i) => (
          <div key={i} style={{ ...card, gridTemplateColumns: "1fr 1fr" }}>
            <b style={{ gridColumn: "1 / 3", fontSize: 16, color: "#1f6f54" }}>{r.w === "0" ? "開始" : r.w ? `${r.w}週目` : "週を入れてください"}</b>
            <label style={lab}>週（開始＝0）<input style={inp} inputMode="numeric" value={r.w} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, w: e.target.value } : x)) })} /></label>
            <label style={lab}>体重（kg）<input style={inp} inputMode="decimal" value={r.kg} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)) })} /></label>
            <label style={lab}>ウエスト（cm）<input style={inp} inputMode="decimal" value={r.waist} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, waist: e.target.value } : x)) })} /></label>
            <label style={lab}>体脂肪率（%）<input style={inp} inputMode="decimal" value={r.fat} onChange={(e) => up({ rows: s.rows.map((x, j) => (j === i ? { ...x, fat: e.target.value } : x)) })} /></label>
            <button type="button" style={del} aria-label="この行を消す" onClick={() => up({ rows: s.rows.filter((_, j) => j !== i) })}>✕</button>
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
        <summary style={sum}>③ 調整（カロリー・PFC）</summary>
        <p className="agnote">最新の体重から、目標カロリーを出し直します。変えたいときは、数字を入れます。</p>
        <label style={lab}>目標kcalを、直接、決める（空欄＝自動：{energy ? energy.target.toLocaleString() : "—"}kcal）<input style={inp} inputMode="numeric" value={s.kcalOverride} onChange={(e) => up({ kcalOverride: e.target.value })} /></label>
        <p style={{ ...lab, marginTop: 12 }}>ダイエットの方法（お客様に合わせて選ぶ）</p>
        <div style={{ display: "grid", gap: 8 }}>
          {METHODS.map((x) => (
            <button key={x.id} type="button" aria-pressed={s.pfcMethod === x.id} onClick={() => up({ pfcMethod: x.id })} style={{ ...inp, textAlign: "left", cursor: "pointer", borderColor: s.pfcMethod === x.id ? "#2f9e75" : "#b9d9c8", background: s.pfcMethod === x.id ? "#e6f5ec" : "#fff" }}>
              <b>{x.icon} {x.name}</b>
              <span style={{ display: "block", fontSize: 13, color: "#567" }}>{x.tag}・P{x.pct.p}／F{x.pct.f}／C{x.pct.c}%・根拠：{x.level}{x.risky ? "・⚠医師の確認が必要" : ""}</span>
            </button>
          ))}
        </div>
        {s.pfcMethod === "fast16" && (
          <label style={{ ...lab, marginTop: 8 }}>16時間断食：最初の食事の時刻
            <select style={inp} value={s.fastStart} onChange={(e) => up({ fastStart: e.target.value })}>
              {Array.from({ length: 9 }, (_, i) => 6 + i).map((h) => <option key={h} value={String(h)}>{h}:00（食べる時間 {h}:00〜{(h + 8) % 24}:00）</option>)}
            </select>
          </label>
        )}
        <p style={{ ...lab, marginTop: 12 }}>新しいダイエット方法の施策（選んだ方法を、並べて、お客様に共有：理想のPFC・注意事項つき）</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="trchip on" onClick={() => up({ pack: PACK_DEFAULT })}>5つ全部（低糖質・16時間断食・ファスティング・ケトジェニック・脂質カット）</button>
          <button type="button" className="trchip" onClick={() => up({ pack: [] })}>全部はずす</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {PACK_OPTIONS.map((o) => (
            <button key={o.id} type="button" aria-pressed={s.pack.includes(o.id)} className={s.pack.includes(o.id) ? "trchip on" : "trchip"} onClick={() => up({ pack: s.pack.includes(o.id) ? s.pack.filter((x) => x !== o.id) : [...s.pack, o.id] })}>{o.icon} {o.label}</button>
          ))}
        </div>
        <p style={{ ...lab, marginTop: 12 }}>食べ物の例の「量」（たんぱく質・炭水化物・脂質）</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {["5", "10", "20", "30"].map((v) => (
            <button key={v} type="button" className={s.foodAmt === v ? "trchip on" : "trchip"} onClick={() => up({ foodAmt: v })}>{v}g</button>
          ))}
          <input style={{ ...inp, width: 110 }} inputMode="decimal" value={s.foodAmt} onChange={(e) => up({ foodAmt: e.target.value })} aria-label="食べ物の例の量（g）" />
        </div>
        <p style={{ ...lab, marginTop: 12 }}>停滞期を抜ける・腸内環境を整える：打開策の候補（選んで提案）</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="trchip on" onClick={() => up({ breakers: suggestBreakers({ stall: (!!res?.judge && ["stall", "up", "slow"].includes(res.judge.id)) || (weeks >= 2 && ratePct > -0.15), weeksStalled: (res?.judge && ["stall", "slow"].includes(res.judge.id)) || (weeks >= 2 && ratePct > -0.15) ? Math.max(weeks, 4) : 0, gut: s.status.includes("constipation"), youth: band <= 1 || (age > 0 && age < 18), cond: s.conds, noReduce: false }) })}>🔄 判定から、自動で候補を出す</button>
          <button type="button" className="trchip" onClick={() => up({ breakers: [] })}>全部はずす</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {BREAKERS.map((b) => (
            <button key={b.id} type="button" aria-pressed={s.breakers.includes(b.id)} className={s.breakers.includes(b.id) ? "trchip on" : "trchip"} onClick={() => up({ breakers: s.breakers.includes(b.id) ? s.breakers.filter((x) => x !== b.id) : [...s.breakers, b.id] })}>{b.icon} {b.name.replace(/（.*$/, "")}</button>
          ))}
        </div>
        {s.breakers.map((id) => {
          const b = BREAKERS.find((x) => x.id === id);
          if (!b) return null;
          return (
            <label key={id} style={{ ...lab, marginTop: 8 }}>
              {b.icon} {b.name.replace(/（.*$/, "")}：このお客様への、具体的な指示（開始日・量・回数・注意など。レポートに載ります）
              <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={s.bkNotes[id] ?? ""} placeholder="例：来週月曜から2週間。体重は毎朝測り、週平均で見る。" onChange={(e) => up({ bkNotes: { ...s.bkNotes, [id]: e.target.value } })} />
            </label>
          );
        })}
        <label style={{ ...lab, marginTop: 8 }}>
          自分で足す打開策（上にない方法：例 ファスティング〇日、チートデイの回数 など）
          <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={s.bkNotes["_free"] ?? ""} placeholder="ここに書いた内容が、打開策の欄の最後に載ります。" onChange={(e) => up({ bkNotes: { ...s.bkNotes, _free: e.target.value } })} />
        </label>
        <p style={{ ...lab, marginTop: 12 }}>停滞期・お客様の最新の状況を書くと、アドバイスを出します</p>
        <textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} value={s.situation} placeholder="例：2ヶ月体重が減っていない。食事もそこまで減らしていない。最近よく眠れず、歩数も落ちている。" onChange={(e) => up({ situation: e.target.value })} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <button type="button" className="trchip on" onClick={() => setAsked(s.situation)}>🧭 アドバイスを出す</button>
          <button type="button" className="trchip" onClick={() => { const bits = [res?.judge ? "判定：" + res.judge.label : "", res?.slopeText ?? "", weeks >= 1 ? weeks + "週の記録" : "", s.sleepLow ? "睡眠が少ない" : "", s.noLog ? "食事を記録していない" : "", s.status.length ? "状態：" + s.status.join("・") : ""].filter(Boolean).join("。"); up({ situation: s.situation ? s.situation + "\n" + bits : bits }); }}>この画面の記録から、状況を入れる</button>
        </div>
        {asked.trim() && (() => {
          const a: Advice = advise({ text: asked, age, sex: s.sex });
          return (
            <div style={{ ...card, marginTop: 8 }}>
              <p style={{ margin: "0 0 4px" }}><b>読み取った状況：</b>{a.matched.join("・") || "（典型的なパターンを、読み取れませんでした）"}</p>
              {a.causes.length > 0 && (<><b>考えられる原因</b><ul style={{ margin: "2px 0 6px 18px" }}>{a.causes.map((c) => <li key={c.title}>［{c.likelihood}］{c.title}：{c.why}</li>)}</ul></>)}
              {a.questions.length > 0 && (<><b>確認すること</b><ul style={{ margin: "2px 0 6px 18px" }}>{a.questions.slice(0, 5).map((q) => <li key={q}>{q}</li>)}</ul></>)}
              {a.actions.length > 0 && (<><b>対策</b><ol style={{ margin: "2px 0 6px 18px" }}>{a.actions.map((x, i) => <li key={i}>［{x.when}］{x.what}</li>)}</ol></>)}
              {a.flow.length > 0 && (<><b>今後の流れ</b><ol style={{ margin: "2px 0 6px 18px" }}>{a.flow.map((x, i) => <li key={i}>［{x.when}］{x.what}</li>)}</ol></>)}
              {a.refer.length > 0 && <p style={{ margin: "4px 0", color: "#8a4b00" }}>⚠ {a.refer.join(" ／ ")}</p>}
              <p style={{ margin: "4px 0", fontSize: 13, color: "#555" }}>根拠：{a.evidence.slice(0, 4).map((e) => e.label).join("／") || "—"}（くわしくは「相談」ページ）</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="trchip on" onClick={() => up({ advice: (s.advice ? s.advice + "\n\n" : "") + a.say })}>お客様向けの文を、「詳しいアドバイス」に入れる</button>
                <button type="button" className="trchip" onClick={() => up({ advice: (s.advice ? s.advice + "\n\n" : "") + a.actions.map((x, i) => (i + 1) + ". " + x.what).join("\n") })}>対策を、「詳しいアドバイス」に入れる</button>
                <button type="button" className="trchip" onClick={() => up({ meas: [...s.meas, ...a.causes.slice(0, 3).map((c, i) => ({ issue: c.title, cause: c.why, action: a.actions[i]?.what ?? "", due: "次回まで", who: "本人＋トレーナー" }))] })}>原因を、対策表に入れる</button>
                <button type="button" className="trchip" onClick={() => up({ breakers: suggestBreakers({ stall: /停滞|減らない|減って(い)?ない|落ちない|変わらない/.test(asked), weeksStalled: /ヶ月|か月|カ月|週間/.test(asked) ? 6 : 0, gut: /便秘|お腹|腸/.test(asked), youth: age > 0 && age < 18, cond: s.conds, noReduce: /そこまで(へら|減ら)していない/.test(asked) }) })}>状況から、打開策の候補を選ぶ</button>
              </div>
            </div>
          );
        })()}
        <label style={{ ...lab, marginTop: 12 }}>
          詳しいアドバイス（お客様に送る文章。自由に書けます）
          <textarea style={{ ...inp, minHeight: 130, resize: "vertical" }} value={s.advice} placeholder="例：停滞の原因は…／まず1週間、〇〇を試す／うまくいかないときは…" onChange={(e) => up({ advice: e.target.value })} />
        </label>
        <p style={{ ...lab, marginTop: 12 }}>短期プログラム（任意：ファスティング・腸活など）</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className={s.shortPlan === "" ? "trchip on" : "trchip"} onClick={() => up({ shortPlan: "" })}>なし</button>
          {SHORT_PLANS.map((p) => (
            <button key={p.id} type="button" className={s.shortPlan === p.id ? "trchip on" : "trchip"} onClick={() => up({ shortPlan: p.id })}>{p.icon} {p.name.replace(/（.*$/, "")}</button>
          ))}
        </div>
      </details>

      <details style={box} open>
        <summary style={sum}>④ プログラム表・対策表・宿題</summary>
        <p style={lab}>プログラム表（直せます）</p>
        {s.prog.map((p, i) => (
          <div key={i} style={card}>
            <label style={{ ...lab, paddingRight: 44 }}>日・種類<input style={inp} value={p.d} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)) })} /></label>
            <label style={lab}>内容<textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={p.c} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, c: e.target.value } : x)) })} /></label>
            <label style={lab}>量・時間<input style={inp} value={p.s} onChange={(e) => up({ prog: s.prog.map((x, j) => (j === i ? { ...x, s: e.target.value } : x)) })} /></label>
            <button type="button" style={del} aria-label="この行を消す" onClick={() => up({ prog: s.prog.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="trchip" onClick={() => up({ prog: [...s.prog, { d: "", c: "", s: "" }] })}>＋ 行を足す</button>
          <button type="button" className="trchip" onClick={() => up({ prog: PROG_TEMPLATE[s.days] })}>筋トレ週{s.days}回のひな形に戻す</button>
        </div>
        <p style={{ ...lab, marginTop: 12 }}>対策表</p>
        <button type="button" className="trchip on" onClick={autoMeasures}>🔄 判定から、自動で入れる</button>
        {s.meas.map((m2, i) => (
          <div key={i} style={card}>
            <label style={{ ...lab, paddingRight: 44 }}>課題<input style={inp} value={m2.issue} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, issue: e.target.value } : x)) })} /></label>
            <label style={lab}>原因<textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={m2.cause} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, cause: e.target.value } : x)) })} /></label>
            <label style={lab}>対策<textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={m2.action} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, action: e.target.value } : x)) })} /></label>
            <label style={lab}>いつまで<input style={inp} value={m2.due} onChange={(e) => up({ meas: s.meas.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)) })} /></label>
            <button type="button" style={del} aria-label="この行を消す" onClick={() => up({ meas: s.meas.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button type="button" className="trchip" onClick={() => up({ meas: [...s.meas, { issue: "", cause: "", action: "", due: "", who: "本人＋トレーナー" }] })}>＋ 行を足す</button>
        <p style={{ ...lab, marginTop: 12 }}>今週の宿題（3つまで）</p>
        {s.homework.map((h, i) => (
          <input key={i} style={{ ...inp, marginBottom: 6 }} value={h} placeholder={`宿題 ${i + 1}`} onChange={(e) => up({ homework: s.homework.map((x, j) => (j === i ? e.target.value : x)) })} />
        ))}
        <label style={lab}>トレーナーから、ひとこと<textarea style={{ ...inp, minHeight: 80 }} value={s.comment} onChange={(e) => up({ comment: e.target.value })} /></label>
      </details>

      <div style={box} id="fu-share">
        <b style={{ fontSize: 19, color: "#0f3d2e" }}>⑤ お客様に共有</b>
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
        {nowW > 0 && <NextActions e={expert} title={H("次回までのアクション")} nextDate={s.nextDate ? s.nextDate.replace(/-/g, "/") : ""} />}

        <section>
          <h2>{H("途中結果")}</h2>
          <div className="furk">
            <div><small>開始</small><b>{first ? `${num(first.kg)}kg` : "—"}</b></div>
            <div><small>いま</small><b>{last ? `${nowW}kg` : "—"}</b></div>
            <div><small>増減（{weeks}週）</small><b style={{ color: total <= 0 ? "#1f8a5b" : "#d23f2b" }}>{last && first ? `${total > 0 ? "+" : ""}${total}kg` : "—"}</b></div>
            <div><small>目標まで</small><b>{tW && nowW ? `あと${Math.max(0, toGo)}kg` : "—"}</b></div>
          </div>
          {tW > 0 && first && last && num(first.kg) !== tW && (
            <div className="fuprog" aria-label="ゴールまでの進み具合">
              <div className="fupt"><b>ゴールまでの進み具合</b><span>{goalPct}%</span></div>
              <div className="fupbar"><i style={{ width: `${goalPct}%` }} /></div>
              <div className="fupl"><small>開始 {num(first.kg)}kg</small><small>いま {nowW}kg</small><small>目標 {tW}kg</small></div>
            </div>
          )}
          {pts.length >= 2 && <h3 className="fuh3">体重の推移</h3>}
          {pts.length >= 2 && <LineChart pts={pts} target={tW || undefined} />}
          {intervals.length > 0 && (
            <>
              <h3 className="fuh3">期間ごとの増減（kg）</h3>
              <HBars unit="kg" items={intervals.map((x) => ({ label: x.label, value: Math.abs(x.value), color: x.value <= 0 ? "#2f9e75" : "#e0694f" }))} />
              <p className="rnote">緑＝減った、赤＝増えた（長さは、変化の大きさ）。{intervals.map((x) => `${x.label} ${x.value > 0 ? "+" : ""}${x.value}kg`).join("／")}</p>
            </>
          )}
          {waistPts.length >= 2 && (<><h3 className="fuh3">ウエストの推移（cm）</h3><LineChart pts={waistPts} unit="cm" /></>)}
          {fatPts.length >= 2 && (<><h3 className="fuh3">体脂肪率の推移（%）</h3><LineChart pts={fatPts} unit="%" /></>)}
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
            <h2>{H("いまの判定と、原因")}</h2>
            <div className="fujudge"><b>{res.judge.label}</b><span>{res.slopeText}</span></div>
            {res.causes.length > 0 && <ul className="fucauses">{res.causes.map((c, i) => <li key={i}><b>{c.t}</b><small>{c.d}</small></li>)}</ul>}
          </section>
        )}

        {s.breakers.length > 0 && (
          <section>
            <h2>{H("停滞期を抜ける・整える 打開策の候補")}</h2>
            <BreakerView ids={s.breakers} evLimit={3} notes={s.bkNotes} />
          </section>
        )}
        {s.breakers.length === 0 && s.bkNotes._free?.trim() && (
          <section>
            <h2>{H("停滞期を抜ける 打開策")}</h2>
            <p className="fuadv">{s.bkNotes._free}</p>
          </section>
        )}
        {s.advice.trim() && (
          <section>
            <h2>{H("トレーナーからの、詳しいアドバイス")}</h2>
            <p className="fuadv">{s.advice}</p>
          </section>
        )}

        {kcal > 0 && mac && (
          <section>
            <h2>{H("これからの食事の目安（調整）")}</h2>
            <div className="furow">
              <Pie data={[{ label: "たんぱく質", value: mac.p * 4, color: "#3b82c4" }, { label: "脂質", value: mac.f * 9, color: "#e0a526" }, { label: "炭水化物", value: mac.c * 4, color: "#2f9e75" }]} />
              <div>
                <p className="fubig">約{r10(kcal).toLocaleString()}<span>kcal／日</span></p>
                {delta !== 0 && <p className="rnote">前回（{r10(num(s.prevKcal)).toLocaleString()}kcal）より {delta > 0 ? "+" : ""}{r10(delta)}kcal</p>}
                <p>たんぱく質 <b>{mac.p}g</b>　脂質 <b>{mac.f}g</b>　炭水化物 <b>{mac.c}g</b></p>
                <p className="rnote">{m.name}（P{pct.p}%・F{pct.f}%・C{pct.c}%）。最新の体重で、計算し直しました。</p>
              </div>
            </div>
            <div className="fumeth">
              <p className="fumh">{m.icon} 選んだダイエット方法：{m.name}<small>根拠の強さ：{m.level}</small></p>
              <p>{m.summary}</p>
              {m.id === "fast16" && (
                <div className="fufast">
                  <div className="fpbar" aria-label="1日の時間割"><span className="eat" style={{ width: "33.3%" }}>食べる 8時間</span><span className="fast" style={{ width: "66.7%" }}>食べない 16時間</span></div>
                  <p>食べる時間：<b>{fastStartN}:00〜{(fastStartN + 8) % 24}:00</b>　／　食べない時間：{(fastStartN + 8) % 24}:00〜{fastStartN}:00（翌日）。水・お茶・無糖のコーヒーは、とってOK。</p>
                </div>
              )}
              <div className="furow2">
                <div><b>選ぶもの</b><ul>{m.choose.slice(0, 4).map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><b>控えること・気をつけること</b><ul>{m.avoid.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
              <ul className="fuev">{m.evidence.slice(0, 3).map((e) => <li key={e.pmid}>{e.label}：{e.note}</li>)}</ul>
              {m.caution.length > 0 && <p className="fucaut">⚠ {m.caution[0]}</p>}
            </div>
          </section>
        )}

        {s.pack.length > 0 && (
          <section>
            <h2>{H("ダイエット方法の施策（比較・理想のPFC・注意事項）")}</h2>
            <MethodPlans ids={s.pack} kcal={kcal} evLimit={2} />
          </section>
        )}

        {nowW > 0 && <AddFoods e={expert} compact title={H("増やす食事で、変えていく")} />}

        {sp && (
          <section>
            <h2>{H(`短期プログラム：${sp.name.replace(/（.*$/, "")}`)}</h2>
            <ShortPlanView plan={sp} evLimit={4} />
          </section>
        )}

        <section>
          <h2>{H("食べ物の例：たんぱく質10gの食品と、脂質が多い食品（30種）")}</h2>
          <p className="rnote">上の15種は「たんぱく質10gをとれる量」、下の15種は「脂質が多い食品（脂質10gをとれる量）」です。脂質は、とりすぎないよう、量の目安に、使ってください。</p>
          <div className="fufoods">
            {[
              { k: "p" as const, t: "たんぱく質 10g をとれる食品（15種）", rows: foodsFor("p", 10).filter((r) => !/乾|粉|ソース|ふりかけ/.test(r.name)).slice(0, 15) },
              { k: "f" as const, t: "脂質が多い食品（脂質10gをとれる量・15種）", rows: foodsFor("f", 10).filter((r) => !/油|ラード|ショートニング|マーガリン|ドレッシング|マヨ/.test(r.name)).slice(0, 15) },
            ].map((b) => (
              <div key={b.k} className="fufood">
                <p className="fufh">{b.t}</p>
                <table className="rtable rinct">
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.name}>
                        <th>
                          {r.name}
                          <small style={{ display: "block", fontWeight: 400, color: "#667" }}>{unitLabel(r)}</small>
                        </th>
                        <td>{r.g}g</td>
                        <td>{r.kcal}kcal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="rxr">根拠：{NUT_BASIS[b.k]}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>{H(`食べ物の例（${foodAmtN}gぶん）`)}</h2>
          <p className="rnote">「たんぱく質{foodAmtN}g」「炭水化物{foodAmtN}g」「脂質{foodAmtN}g」を、それぞれ、とれる食品の例です。量が少なくて済む食品が、上に出ます（日本食品標準成分表をもとにした目安）。</p>
          <div className="fufoods">
            {(["p", "c", "f"] as const).map((k) => {
              const n = NUTS.find((x) => x.key === k)!;
              const rows = foodsFor(k, foodAmtN).slice(0, 40);
              return (
                <div key={k} className="fufood">
                  <p className="fufh">{n.label} {foodAmtN}g<small>{n.hint}</small></p>
                  <table className="rtable rinct">
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.name}>
                          <th>
                            {r.name}
                            <small style={{ display: "block", fontWeight: 400, color: "#667" }}>{unitLabel(r)}</small>
                          </th>
                          <td>{r.g}g</td>
                          <td>{r.kcal}kcal</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="rxr">根拠：{NUT_BASIS[k]}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2>{H("トレーニング・プログラム表")}</h2>
          <table className="rtable">
            <thead><tr><th>日・種類</th><th>内容</th><th>量</th></tr></thead>
            <tbody>{s.prog.filter((p) => p.d || p.c).map((p, i) => <tr key={i}><td>{p.d}</td><td>{p.c}</td><td>{p.s}</td></tr>)}</tbody>
          </table>
          <p className="rnote">筋トレは、同じ部位を週2回あてると増えやすい傾向があります（Schoenfeld 2016）。週の総量が同じなら、回数による筋力の差は見られませんでした（Grgic 2018）。続けられる範囲で。</p>
        </section>

        {s.meas.filter((x) => x.issue || x.action).length > 0 && (
          <section>
            <h2>{H("対策表（課題 → 原因 → 対策）")}</h2>
            <table className="rtable">
              <thead><tr><th>課題</th><th>原因</th><th>対策</th><th>いつまで</th></tr></thead>
              <tbody>{s.meas.filter((x) => x.issue || x.action).map((x, i) => <tr key={i}><td>{x.issue}</td><td>{x.cause}</td><td>{x.action}</td><td>{x.due}</td></tr>)}</tbody>
            </table>
          </section>
        )}

        <section>
          <h2>{H("今週の宿題とチェック表")}</h2>
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

