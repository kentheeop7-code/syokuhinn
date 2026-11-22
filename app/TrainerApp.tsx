"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LineShare from "./LineShare";
import { searchPapers, type Paper } from "../lib/pubmed";
import MealPicker from "./MealPicker";
import { computeGoal, PACES, type Pace } from "../lib/goal";
import { OTHER_TYPES, MINUTES, labelOf, weeklyMin, guideMin, describeEx, type OtherEx } from "../lib/exercise";
import { microStatus } from "../lib/micro";
import { shareUrl } from "../lib/shareLink";
import { calcEnergy, PAL_VAL } from "../lib/energy";
import { buildActions } from "../lib/actions";
import { analyzeBody } from "../lib/body";
import { PAL_TEXT } from "./me";
import { Bars, Pie } from "./Charts";
import { SHORT_PLANS, getShortPlan } from "../lib/shortplans";
import { BREAKERS, suggestBreakers } from "../lib/breakers";
import BreakerView from "./BreakerView";
import MethodPlans, { PACK_DEFAULT, PACK_OPTIONS, breakerText, packText } from "./MethodPlans";
import { advise, type Advice } from "../lib/advisor";
import ShortPlanView from "./ShortPlanView";
import { COMMON_CAUTION, COMMON_LINES, COMMON_NOTES, type MethodId, METHODS, effectivePct, exampleSt, getMethod, inNational, macrosFor, methodBlocked } from "../lib/methods";
import { recommend } from "../lib/recommend";
import { analyzeClient, ageNote } from "../lib/analysis";
import { TROUBLES } from "../lib/troubles";
import { NUTS, foodsFor, unitLabel, type NutKey } from "../lib/foodlist";
import { personalDays } from "../lib/dayfit";
import { energyPhases } from "../lib/energy";
import { swapsFor } from "../lib/swaps";
import { LineChart } from "./Charts";
import { makeInsights, goodPoints, draftAdvice, ASK, ASK_CARE } from "../lib/advice";
import { BANDS } from "./me";
import { describe, goalOf, r10, today, totals, type St } from "../lib/meals";
import { CONDS, ISSUES, PLAYS, TOPICS, TRAINER_CHECKED, type Cond, type Issue, type Play } from "../lib/trainerData";

// トレーナー用：お客様の指導メモ。結論・具体策・根拠・実績を見ながら、最後に、公式LINEへ、まとめて共有できる。
type Goal = "diet" | "muscle" | "both";
const num = (s: string) => parseFloat(s) || 0;

export default function TrainerApp() {
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("both");
  const [now, setNow] = useState("");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState(1);
  const [others, setOthers] = useState<OtherEx[]>([]);
  const [water, setWater] = useState(0);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [bmr, setBmr] = useState("");
  const [muscle, setMuscle] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [pal, setPal] = useState(1);
  const [fatMass, setFatMass] = useState("");
  const [visceral, setVisceral] = useState("");
  const [bmiIn, setBmiIn] = useState("");
  const [method, setMethod] = useState(""); // ""＝自動（おすすめ）。選んだら、その方法
  const [troubles, setTroubles] = useState<string[]>([]);
  const [foodAmts, setFoodAmts] = useState<Record<string, string>>({});
  const [foodNut, setFoodNut] = useState<NutKey>("p");
  const [shortPlan, setShortPlan] = useState("");
  const [breakers, setBreakers] = useState<string[]>([]);
  const [pack, setPack] = useState<string[]>([]);
  const [bkNotes, setBkNotes] = useState<Record<string, string>>({});
  const [advice, setAdvice] = useState("");
  const [situation, setSituation] = useState("");
  const [asked, setAsked] = useState("");
  const [pfc, setPfc] = useState<{ p: string; f: string; c: string } | null>(null);
  const [actOff, setActOff] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [sex, setSex] = useState<"f" | "m">("f");
  const [band, setBand] = useState(3);
  const [curMeal, setCurMeal] = useState<St>({ date: today(), size: {}, ext: {} });
  const [planMeal, setPlanMeal] = useState<St>({ date: today(), size: {}, ext: {} });
  const [targetKcal, setTargetKcal] = useState("");
  const [pace, setPace] = useState<Pace>("mid");
  const [swapOff, setSwapOff] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const [weekAct, setWeekAct] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [pins, setPins] = useState<Paper[]>([]);
  const [papers, setPapers] = useState<Record<string, { at: string; ts?: number; list: Paper[] }>>({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-trainer") || "null");
      if (s) {
        setName(s.name ?? "");
        setGoal(s.goal ?? "both");
        setNow(s.now ?? "");
        setTarget(s.target ?? "");
        setDays(typeof s.days === "number" ? s.days : 1);
        setOthers(Array.isArray(s.others) ? s.others : []);
        setWater(typeof s.water === "number" ? s.water : 0);
        setAge(s.age ?? "");
        setHeight(s.height ?? "");
        setBmr(s.bmr ?? "");
        setMuscle(s.muscle ?? "");
        setBodyFat(s.bodyFat ?? "");
        setPal(typeof s.pal === "number" ? s.pal : 1);
        setFatMass(s.fatMass ?? "");
        setVisceral(s.visceral ?? "");
        setBmiIn(s.bmiIn ?? "");
        setMethod(s.methodManual === true && typeof s.method === "string" ? s.method : "");
        setTroubles(Array.isArray(s.troubles) ? s.troubles : []);
        setFoodAmts(s.foodAmts && typeof s.foodAmts === "object" ? s.foodAmts : {});
        setShortPlan(typeof s.shortPlan === "string" ? s.shortPlan : "");
        setBreakers(Array.isArray(s.breakers) ? s.breakers : []);
        setPack(Array.isArray(s.pack) ? s.pack : []);
        setBkNotes(s.bkNotes && typeof s.bkNotes === "object" ? s.bkNotes : {});
        setAdvice(typeof s.advice === "string" ? s.advice : "");
        setSituation(typeof s.situation === "string" ? s.situation : "");
        setPfc(s.pfc && typeof s.pfc === "object" ? s.pfc : null);
        setActOff(Array.isArray(s.actOff) ? s.actOff : []);
        setNote(s.note ?? "");
        setPicked(Array.isArray(s.picked) ? s.picked : []);
        setConds(Array.isArray(s.conds) ? s.conds : []);
        setIssues(Array.isArray(s.issues) ? s.issues : []);
        setSex(s.sex === "m" ? "m" : "f");
        setBand(typeof s.band === "number" ? s.band : 3);
        if (s.curMeal && s.curMeal.size) setCurMeal({ date: today(), size: s.curMeal.size, ext: s.curMeal.ext || {} });
        if (s.planMeal && s.planMeal.size) setPlanMeal({ date: today(), size: s.planMeal.size, ext: s.planMeal.ext || {} });
        setTargetKcal(s.targetKcal ?? "");
        setPace(s.pace === "slow" || s.pace === "fast" ? s.pace : "mid");
        setSwapOff(Array.isArray(s.swapOff) ? s.swapOff : []);
        setProblem(s.problem ?? "");
        setWeekAct(s.weekAct ?? "");
        setNextDate(s.nextDate ?? "");
        setPins(Array.isArray(s.pins) ? s.pins : []);
      }
      const p = JSON.parse(localStorage.getItem("lg-trainer-papers") || "null");
      if (p) setPapers(p);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-trainer", JSON.stringify({ name, goal, now, target, days, note, picked, pins, conds, issues, problem, weekAct, nextDate, sex, band, curMeal, planMeal, targetKcal, pace, swapOff, others, water, age, height, bmr, muscle, bodyFat, pal, actOff, fatMass, visceral, bmiIn, method, methodManual: method !== "", pfc, troubles, foodAmts, shortPlan, breakers, pack, bkNotes, advice, situation }));
    } catch {}
  }, [loaded, name, goal, now, target, days, note, picked, pins, conds, issues, problem, weekAct, nextDate, sex, band, curMeal, planMeal, targetKcal, pace, swapOff, others, water, age, height, bmr, muscle, bodyFat, pal, actOff, fatMass, visceral, bmiIn, method, pfc, troubles, foodAmts, shortPlan, breakers, pack, bkNotes, advice, situation]);

  const w = num(now);
  const wt = num(target);
  const plays = useMemo(() => PLAYS.filter((p) => goal === "both" || p.group === "both" || p.group === goal), [goal]);
  const chosen = PLAYS.filter((p) => picked.includes(p.id));
  const myConds = CONDS.filter((c) => conds.includes(c.id));
  const chosenConds = myConds.filter((c) => picked.includes("c-" + c.id));
  const ct = totals(curMeal);
  const pt = totals(planMeal);
  const gl = goalOf(sex, band);
  const manualKcal = num(targetKcal.replace(/,/g, ""));
  const effPace: Pace = conds.length > 0 ? "slow" : pace;
  const plan = computeGoal(w, wt, days, effPace);
  // 目標カロリー：トレーナーが、直接入れた値を、優先。なければ、体のデータから、自動で計算。
  const bfAuto = num(bodyFat) || (num(fatMass) > 0 && w > 0 ? (num(fatMass) / w) * 100 : 0);
  const bodyA = analyzeBody({ height: num(height), weight: w, targetWeight: wt, bodyFat: num(bodyFat), fatMass: num(fatMass), muscle: num(muscle), visceral: num(visceral), bmiIn: num(bmiIn) });
  const energy = calcEnergy({ sex, band, age: num(age), height: num(height), weight: w, bmr: num(bmr), bodyFat: bfAuto, muscle: num(muscle), pal, targetWeight: wt, pace: effPace });
  const wantKcal = manualKcal || energy?.target || 0;
  const rec = recommend({ sex, age: num(age), band, weight: w, height: num(height), conds, goal, hasBody: num(bmr) > 0 || bfAuto > 0 });
  const methodId: MethodId = ((method as MethodId) || rec.top) as MethodId;
  const mth = getMethod(methodId);
  const youthNow = band <= 1 || (num(age) > 0 && num(age) < 18);
  const blocked = methodBlocked(mth, { hasConds: conds.length > 0, youth: youthNow });
  const pctEff = effectivePct(mth, pfc);
  const pctSum = pctEff.p + pctEff.f + pctEff.c;
  const mac = wantKcal ? macrosFor(wantKcal, pctEff) : null;
  const phases = energy && plan ? energyPhases({ sex, band, age: num(age), height: num(height), weight: w, bmr: num(bmr), bodyFat: bfAuto, muscle: num(muscle), pal, targetWeight: wt, pace: effPace }, plan.pts, plan.weeks) : [];
  const pdays = personalDays(wantKcal, pctEff, methodId, { lipid: conds.includes("lipid"), n: 6 });
  const ageN = ageNote(num(age), band, sex);
  const findings = analyzeClient({ sex, age: num(age), band, weight: w, targetWeight: wt, body: bodyA, energy, wantKcal, cur: ct.any ? ct : null, goalP: parseFloat(gl.p || "0"), goalFi: parseFloat(gl.fi || "0"), goalSalt: gl.salt, water, strengthDays: days, otherMin: weeklyMin(others), guideMin: guideMin(band), conds, goal, troubles, weeks: plan?.weeks ?? 0, rate: plan?.rate ?? 0 });
  const nSev = { 要対策: findings.filter((f) => f.sev === "要対策").length, 注意: findings.filter((f) => f.sev === "注意").length, 良好: findings.filter((f) => f.sev === "良好").length };
  const exSt = exampleSt(mth);
  const exT = totals(exSt);
  const exE = exT.p * 4 + exT.f * 9 + exT.c * 4 || 1;
  const swaps = swapsFor(curMeal);
  const swapOn = swaps.filter((s) => !swapOff.includes(s.id));
  // お客様専用ページ（リンク）：内容を、リンクの中に入れる。サーバーには、保存されない。
  useEffect(() => {
    if (!loaded) return;
    const h = setTimeout(async () => {
      try {
        setLink(await shareUrl({ name, goal, now, target, days, others, water, sex, band, curMeal, planMeal, targetKcal, pace, swapOff, picked, conds, issues, problem, weekAct, nextDate, note, pins, age, height, bmr, muscle, bodyFat, pal, actOff, fatMass, visceral, bmiIn, method: methodId, pfc, troubles, foodAmts, shortPlan, breakers, pack, bkNotes, advice, situation }));
      } catch {}
    }, 600);
    return () => clearTimeout(h);
  }, [loaded, name, goal, now, target, days, others, water, sex, band, curMeal, planMeal, targetKcal, pace, swapOff, picked, conds, issues, problem, weekAct, nextDate, note, pins, age, height, bmr, muscle, bodyFat, pal, actOff, fatMass, visceral, bmiIn, methodId, pfc, troubles, foodAmts, shortPlan, breakers, pack, bkNotes, advice, situation]);
  const insights = makeInsights(curMeal, sex, band, wantKcal);
  const good = goodPoints(curMeal, sex, band);
  const draft = draftAdvice({ name, cur: curMeal, plan: planMeal, sex, band, wantKcal, nextDate });
  const actions = buildActions({ cur: curMeal, plan: planMeal, swaps: swapOn, insights, days, others, water, hasCur: ct.any });
  const actionsOn = actions.filter((x) => !actOff.includes(x.id));
  const myIssues = ISSUES.filter((c) => issues.includes(c.id));
  const chosenIssues = myIssues.filter((c) => picked.includes("i-" + c.id));
  const toggleIssue = (id: string) => setIssues((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const toggleCond = (id: string) => setConds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  // 最新の論文：PubMed（米国国立医学図書館）から、そのつど取得する。メタ分析・系統的レビューの、新しい順。
  const fetchTopic = async (key: string, term: string) => {
    setBusy(key);
    setErr("");
    try {
      const list = await searchPapers(term, 6);
      const at = new Date().toLocaleString("ja-JP");
      setPapers((prev) => {
        const next = { ...prev, [key]: { at, ts: Date.now(), list } };
        try {
          localStorage.setItem("lg-trainer-papers", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (e) {
      setErr(e instanceof Error && e.message === "none" ? "該当する論文が見つかりませんでした。" : "取得できませんでした。通信を確認して、もう一度お試しください。");
    }
    setBusy((b) => (b === key ? "" : b));
  };
  // 開いたとき、1日以上たった（まだ取得していない）テーマを、自動で最新にする
  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    (async () => {
      for (const t of TOPICS) {
        if (!alive) return;
        const c = papers[t.key];
        if (c && c.ts && Date.now() - c.ts < 24 * 3600 * 1000) continue;
        await fetchTopic(t.key, t.term);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  const pin = (p: Paper) => setPins((x) => (x.some((y) => y.id === p.id) ? x.filter((y) => y.id !== p.id) : [...x, p]));

  const build = () => {
    const L: string[] = [];
    L.push(`■ 目標：${goal === "diet" ? "体重を減らす" : goal === "muscle" ? "筋力・筋肉アップ" : "体重を減らして、筋力もアップ"}`);
    if (w) L.push(`■ 体重：${w}kg${wt ? ` → ${wt}kg` : ""}　筋トレ：週${days}回`);
    {
      const ex = describeEx(days, others);
      if (ex.length) L.push("", "■ 運動", ...ex);
    }
    if (water) L.push(`■ 水分：1日 ${water === 2 ? "〜3杯" : water === 5 ? "4〜6杯" : "7杯〜"}（コップ200ml）`);
    if (pt.any) {
      const ms = microStatus(planMeal, sex, band);
      const low = ms.rows.filter((r) => r.pct < 0.7).sort((a, b) => a.pct - b.pct).slice(0, 3);
      if (low.length) L.push("", `■ 足りにくい栄養：${low.map((r) => r.label).join("・")}（おすすめ：${low.map((r) => r.foods.split("・").slice(0, 2).join("・")).join("／")}）`);
    }
    if (actionsOn.length) {
      L.push("", "■ 今日からの、アクション（まず、これだけ）");
      actionsOn.forEach((x, i) => L.push(`${i + 1}. ${x.text}`));
    }
    if (energy && wantKcal) L.push("", `■ 1日の目安：約${wantKcal.toLocaleString()}kcal（${energy.method === "dri" ? "年代・性別の目安" : `基礎代謝 約${energy.bmr}kcal × 活動量${energy.pal}`}）`);
    if (mac) L.push("", `■ 食事の方法：${mth.name}（たんぱく質${Math.round((pctEff.p / pctSum) * 100)}%・脂質${Math.round((pctEff.f / pctSum) * 100)}%・炭水化物${Math.round((pctEff.c / pctSum) * 100)}%）`, `　1日 約${wantKcal.toLocaleString()}kcal：たんぱく質 約${mac.p}g・脂質 約${mac.f}g・炭水化物 約${mac.c}g`);
    if (pack.length) L.push("", packText(pack, wantKcal));
    if (breakers.length || bkNotes._free?.trim()) L.push("", breakerText(breakers, bkNotes));
    if (advice.trim()) L.push("", "■ 詳しいアドバイス", advice.trim());
    L.push("", "■ 気をつけること（指導方針）", ...COMMON_LINES);
    if (plan) L.push("", `■ ゴールの目安：${w}kg → ${wt}kg　約${plan.weeks}週間（筋トレ 週${days}回・合計${plan.sessions}回）`);
    if (swapOn.length) {
      L.push("", "■ 置きかえ（こちらを食べてください）");
      swapOn.forEach((s) => L.push(`・${s.from} → ${s.to}`));
    }
    if (bodyA) {
      const bp = [bodyA.bmi > 0 ? `BMI ${bodyA.bmi}（${bodyA.bmiCat}）` : "", bodyA.fatPct > 0 ? `体脂肪率 ${bodyA.fatPct}%（体脂肪 約${bodyA.fatKg}kg）` : "", num(muscle) > 0 ? `骨格筋 ${num(muscle)}kg` : "", bodyA.visceral > 0 ? `内臓脂肪レベル ${bodyA.visceral}（${bodyA.visceralCat}）` : "", num(bmr) > 0 ? `基礎代謝 ${num(bmr)}kcal` : ""].filter(Boolean);
      if (bp.length) L.push("", `■ からだのデータ：${bp.join("／")}`);
    }
    if (ct.any) {
      L.push("", `■ 現状の食事（約${r10(ct.kcal).toLocaleString()}kcal・食塩${Math.round(ct.salt * 10) / 10}g）`);
      describe(curMeal).forEach((s) => L.push(s));
      insights.slice(0, 3).forEach((s) => L.push(`・${s.t}`));
    }
    if (pt.any) {
      L.push("", `■ 提案する食事（約${r10(pt.kcal).toLocaleString()}kcal・食塩${Math.round(pt.salt * 10) / 10}g）`);
      describe(planMeal).forEach((s) => L.push(s));
      if (ct.any) L.push(`現状から：${r10(pt.kcal - ct.kcal) > 0 ? "+" : ""}${r10(pt.kcal - ct.kcal).toLocaleString()}kcal、たんぱく質 ${Math.round(pt.p - ct.p) > 0 ? "+" : ""}${Math.round(pt.p - ct.p)}g、食塩 ${Math.round((pt.salt - ct.salt) * 10) / 10 > 0 ? "+" : ""}${Math.round((pt.salt - ct.salt) * 10) / 10}g`);
    }
    if (chosenIssues.length || problem.trim()) {
      L.push("", "■ いまの課題");
      chosenIssues.forEach((c, i) => L.push(`${i + 1}. ${c.share}`));
      if (problem.trim()) L.push(problem.trim());
    }
    if (weekAct.trim() || chosenIssues.length) {
      L.push("", "■ 今週やること");
      if (weekAct.trim()) L.push(weekAct.trim());
      else chosenIssues.forEach((c) => L.push(`・${c.act[0]}`));
    }
    if (nextDate.trim()) L.push("", `■ 次回の確認：${nextDate.trim()}`);
    if (chosenConds.length) {
      L.push("", "■ 持病・体質に合わせた注意");
      chosenConds.forEach((c) => L.push(c.share));
      L.push("※ 持病・服薬のある方は、運動や食事を変える前に、主治医に確認してください。");
    }
    if (chosen.length) {
      L.push("", "■ 今日のポイント");
      chosen.forEach((p, i) => L.push(`${i + 1}. ${p.share(w)}`));
    }
    if (troubles.length) {
      L.push("", "■ 困りごとへの対処");
      TROUBLES.filter((t) => troubles.includes(t.id)).forEach((t) => L.push(t.share));
    }
    if (findings.length) L.push("", `■ 分析（要対策 ${nSev.要対策}・注意 ${nSev.注意}・良好 ${nSev.良好}）`, ...findings.filter((f) => f.sev !== "良好").slice(0, 4).map((f) => `・${f.title}`));
    if (note.trim()) L.push("", "■ トレーナーから", note.trim());
    if (link && link.length <= 1800) L.push("", "■ あなた専用のまとめ（スマホで見られます）", link);
    if (pins.length) {
      L.push("", "■ 参考にした最新の研究（PubMed）");
      pins.slice(0, 3).forEach((p) => L.push(`・${p.title.replace(/\.$/, "")}（${p.journal}）https://pubmed.ncbi.nlm.nih.gov/${p.id}/`));
    }
    if (chosen.some((p) => p.src.length) || chosenConds.length || chosenIssues.length) {
      L.push("", "■ 根拠");
      const labels = [...chosenIssues.slice(0, 4).map((c) => c.src[0].label), ...chosen.slice(0, 4).map((p) => p.src[0].label), ...chosenConds.slice(0, 4).map((c) => c.src[0].label)];
      Array.from(new Set(labels)).forEach((l) => L.push(`・${l}`));
    }
    return L.join("\n");
  };

  const card = (p: Play) => (
    <li key={p.id}>
      <details className="trcard">
        <summary>
          <span className="trt">{p.title}</span>
          <span className={`trlv lv-${p.level}`}>根拠 {p.level}</span>
        </summary>
        <p className="tra">
          <b>結論</b>
          {p.answer}
        </p>
        <div className="trs">
          <small>具体策</small>
          <ol>
            {p.steps(w).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        {p.results && (
          <p className="trr">
            <small>実績（試験の結果）</small>
            <b>{p.results.title}</b>：{p.results.text}
          </p>
        )}
        <p className="tre">
          <small>根拠（何が分かっているか）</small>
          {p.evidence}
        </p>
        <p className="trl">
          <small>限界・注意</small>
          {p.limits}
        </p>
        <p className="trsrc">
          <small>出典</small>
          {p.src.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </p>
        <button type="button" className={picked.includes(p.id) ? "trpick on" : "trpick"} onClick={() => toggle(p.id)}>
          {picked.includes(p.id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
        </button>
      </details>
    </li>
  );

  // お客様用のまとめ（PDFの画面）が、LINE用の文章を、読めるように、保存しておく
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-trainer-text", build());
    } catch {}
  });
  const issueCard = (c: Issue) => {
    const id = "i-" + c.id;
    return (
      <li key={c.id}>
        <details className="trcard">
          <summary>
            <span className="trt">{c.label}</span>
            <span className={`trlv lv-${c.level}`}>根拠 {c.level}</span>
          </summary>
          <p className="tra">
            <b>お客様に確認</b>
            {c.ask}
          </p>
          <div className="trs">
            <small>食事での対応</small>
            <ol>
              {c.diet.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="trs">
            <small>今週の行動</small>
            <ol>
              {c.act.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="tre">
            <small>根拠（何が分かっているか）</small>
            {c.evidence}
          </p>
          <p className="trl">
            <small>限界・注意</small>
            {c.limits}
          </p>
          <p className="trsrc">
            <small>出典</small>
            {c.src.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </p>
          <button type="button" className={picked.includes(id) ? "trpick on" : "trpick"} onClick={() => toggle(id)}>
            {picked.includes(id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
          </button>
        </details>
      </li>
    );
  };
  const condCard = (c: Cond) => {
    const id = "c-" + c.id;
    return (
      <li key={c.id}>
        <details className="trcard">
          <summary>
            <span className="trt">
              {c.icon} {c.label}
            </span>
            <span className={`trlv lv-${c.level}`}>根拠 {c.level}</span>
          </summary>
          <p className="tra">
            <b>先に確認</b>
            {c.ask}
          </p>
          <div className="trs">
            <small>食事（ダイエット）</small>
            <ol>
              {c.diet.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="trs">
            <small>トレーニング（筋力アップ）</small>
            <ol>
              {c.train.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="tre">
            <small>根拠（何が分かっているか）</small>
            {c.evidence}
          </p>
          <p className="trl">
            <small>限界・注意</small>
            {c.limits}
          </p>
          <p className="trsrc">
            <small>出典</small>
            {c.src.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </p>
          <button type="button" className={picked.includes(id) ? "trpick on" : "trpick"} onClick={() => toggle(id)}>
            {picked.includes(id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
          </button>
        </details>
      </li>
    );
  };

  return (
    <div className="trainer">
      <Link href="/" className="backlink">
        ‹ ホームへ戻る
      </Link>
      <p className="trnote">トレーナー用。指導の根拠と具体策を見ながら、最後に、お客様へ公式LINEで共有できます。内容の確認日：{TRAINER_CHECKED}</p>

      <nav className="trsteps" aria-label="進め方">
        {(
          [
            ["s1", "お客様", !!(name.trim() || w)],
            ["s1a", "分析・対策", findings.length > 0],
            ["s2", "現状の食事", ct.any],
            ["s3", "提案", pt.any],
            ["s3b", "ゴール・置きかえ", !!plan],
            ["s4", "課題・今週", issues.length > 0 || !!problem.trim() || !!weekAct.trim()],
            ["s8", "PDF・LINE", false],
          ] as const
        ).map(([id, t, done], i) => (
          <a key={id} href={`#${id}`} className={done ? "done" : ""}>
            <i>{done ? "✔" : i + 1}</i>
            {t}
          </a>
        ))}
      </nav>
      <a className="trfab" href="/trainer/report" target="_blank" rel="noopener noreferrer">
        📄 PDFを作る
      </a>

      <section className="card" id="s1">
        <p className="balh">① お客様のメモ</p>
        <label className="trf">
          <span>お名前（任意）</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：さくら" aria-label="お客様のお名前" />
        </label>
        <p className="balh sub">お客様の性別・年代（目安の計算に使います）</p>
        <div className="plpace" role="radiogroup" aria-label="性別">
          {(
            [
              ["f", "女性"],
              ["m", "男性"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={sex === k} className={sex === k ? "on" : ""} onClick={() => setSex(k)}>
              {l}
            </button>
          ))}
        </div>
        <label className="trf">
          <span>年代</span>
          <select value={band} onChange={(e) => setBand(parseInt(e.target.value, 10))} aria-label="年代">
            {BANDS.map((b, i) => (
              <option key={b} value={i}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <details className="trbody">
          <summary>任意：からだのデータ（基礎代謝・筋肉量・体脂肪率）を入れると、カロリーを自動で計算</summary>
          <div className="trgrid">
            <label className="trf">
              <span>年齢（歳）</span>
              <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="例 38" aria-label="年齢" />
            </label>
            <label className="trf">
              <span>身長（cm）</span>
              <input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="例 160" aria-label="身長" />
            </label>
            <label className="trf">
              <span>基礎代謝（kcal）</span>
              <input inputMode="numeric" value={bmr} onChange={(e) => setBmr(e.target.value)} placeholder="体組成計の値" aria-label="基礎代謝" />
            </label>
            <label className="trf">
              <span>体脂肪率（%）</span>
              <input inputMode="decimal" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="例 28" aria-label="体脂肪率" />
            </label>
            <label className="trf">
              <span>骨格筋量（kg）</span>
              <input inputMode="decimal" value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="体組成計の値" aria-label="筋肉量" />
            </label>
            <label className="trf">
              <span>体脂肪量（kg）</span>
              <input inputMode="decimal" value={fatMass} onChange={(e) => setFatMass(e.target.value)} placeholder="体組成計の値" aria-label="体脂肪量" />
            </label>
            <label className="trf">
              <span>内臓脂肪（レベル）</span>
              <input inputMode="numeric" value={visceral} onChange={(e) => setVisceral(e.target.value)} placeholder="例 8" aria-label="内臓脂肪レベル" />
            </label>
            <label className="trf">
              <span>BMI（空欄なら自動）</span>
              <input inputMode="decimal" value={bmiIn} onChange={(e) => setBmiIn(e.target.value)} placeholder="体組成計の値" aria-label="BMI" />
            </label>
          </div>
          <p className="balh sub">ふだんの活動量</p>
          <div className="plpace" role="radiogroup" aria-label="活動量">
            {PAL_TEXT.map((t, i) => (
              <button key={t} type="button" role="radio" aria-checked={pal === i} className={pal === i ? "on" : ""} onClick={() => setPal(i)}>
                {t}
                <small>係数 {PAL_VAL[i]}</small>
              </button>
            ))}
          </div>
          {bodyA && (
            <div className="trenergy" aria-label="体のデータの分析">
              <p className="balh sub">体のデータの分析</p>
              <ul className="trinsight">
                {bodyA.bmi > 0 && (
                  <li>
                    BMI <b>{bodyA.bmi}</b>（{bodyA.bmiCat}）{bodyA.bmiGoal > 0 ? `　ゴールのBMI ${bodyA.bmiGoal}（${bodyA.bmiGoalCat}）` : ""}
                    {bodyA.std22 > 0 ? `　BMI22の体重 ${bodyA.std22}kg` : ""}
                  </li>
                )}
                {bodyA.fatPct > 0 && (
                  <li>
                    体脂肪率 <b>{bodyA.fatPct}%</b>（体脂肪 約{bodyA.fatKg}kg／除脂肪 約{bodyA.ffm}kg）
                    {bodyA.goalFatPct > 0 ? `　筋肉を保って、${wt}kgにすると、体脂肪率は 約${bodyA.goalFatPct}%` : ""}
                  </li>
                )}
                {bodyA.musclePct > 0 && (
                  <li>
                    骨格筋量 <b>{num(muscle)}kg</b>（体重の {bodyA.musclePct}%）
                  </li>
                )}
                {bodyA.visceral > 0 && (
                  <li>
                    内臓脂肪レベル <b>{bodyA.visceral}</b>（{bodyA.visceralCat}。体組成計の区分）
                  </li>
                )}
                {bodyA.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="agnote small">BMIの区分は、日本肥満学会の基準です。体脂肪・内臓脂肪の区分は、機器により異なるため、値の変化を、見てください。</p>
            </div>
          )}
          {energy && (
            <div className="trenergy" aria-label="カロリーの自動計算">
              <p className="trgoal">
                1日の目標　約<b>{energy.target.toLocaleString()}</b> kcal　<small>（維持 約{energy.tdee.toLocaleString()}kcal{energy.diff !== 0 ? `、${energy.diff > 0 ? "+" : ""}${energy.diff}` : ""}）</small>
              </p>
              <p className="agnote small">
                方法：{energy.label}
                {energy.bmr > 0 ? `／基礎代謝 約${energy.bmr}kcal` : ""}
                {energy.ffm > 0 ? `／除脂肪量 約${energy.ffm}kg` : ""}
              </p>
              <p className="agnote small">
                {mac ? `${mth.name}：たんぱく質 約${mac.p}g／脂質 約${mac.f}g／炭水化物 約${mac.c}g` : `たんぱく質 約${energy.protein}g／脂質 約${energy.fat}g／炭水化物 約${energy.carb}g`}
              </p>
              <p className="agnote small">
                代謝を守る下限：<b>{energy.floorKcal.toLocaleString()}kcal</b>（これ以下に、しない）／目標 <b>{energy.target.toLocaleString()}kcal</b>／維持 <b>{energy.tdee.toLocaleString()}kcal</b>
              </p>
              {phases.length > 1 && (
                <table className="nctable trcmp" aria-label="カロリー計画">
                  <thead>
                    <tr>
                      <th>期間</th>
                      <th>体重（予定）</th>
                      <th>目標kcal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.map((p) => (
                      <tr key={p.from}>
                        <th scope="row">{p.from}〜{p.to}週</th>
                        <td>{p.weight}kg</td>
                        <td>{p.target.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <ul className="trinsight">
                {energy.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              {energy.refs.length > 0 && (
                <p className="trsrc">
                  <small>根拠</small>
                  {energy.refs.map((r) =>
                    r.pmid ? (
                      <a key={r.pmid + r.label} href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer">
                        {r.label}
                      </a>
                    ) : (
                      <span key={r.label}>{r.label}</span>
                    )
                  )}
                </p>
              )}
              <p className="agnote small">体組成計の値は、機器による誤差があります。目安として、使ってください。妊娠中・授乳中・持病のある方は、主治医の指示が優先です。</p>
              {manualKcal > 0 && <p className="plwarn">「③の目標カロリー」に、手で入力した値（{manualKcal.toLocaleString()}kcal）があるため、そちらを使っています。</p>}
            </div>
          )}
        </details>        <p className="balh sub">目標</p>
        <div className="plpace" role="radiogroup" aria-label="目標">
          {(
            [
              ["diet", "体重を減らす"],
              ["muscle", "筋力アップ"],
              ["both", "両方"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={goal === k} className={goal === k ? "on" : ""} onClick={() => setGoal(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="trgrid">
          <label className="trf">
            <span>いまの体重（kg）</span>
            <input inputMode="decimal" value={now} onChange={(e) => setNow(e.target.value)} placeholder="例 64" aria-label="いまの体重" />
          </label>
          <label className="trf">
            <span>目標の体重（kg）</span>
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="例 58" aria-label="目標の体重" />
          </label>
        </div>
        <p className="balh sub">筋トレの回数（週）</p>
        <div className="plpace" role="radiogroup" aria-label="筋トレの回数">
          {[1, 2, 3, 4].map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
              週{d}回
            </button>
          ))}
        </div>
        <p className="balh sub">その他の運動（歩く・走る・泳ぐ など）</p>
        <p className="agnote small">やっている運動を、タップで足します。「1回の時間」と「週の回数」を、選びます。</p>
        <div className="trchips" role="group" aria-label="その他の運動">
          {OTHER_TYPES.map((t) => {
            const on = others.some((x) => x.id === t.id);
            return (
              <button key={t.id} type="button" aria-pressed={on} className={on ? "trchip on" : "trchip"} onClick={() => setOthers((l) => (on ? l.filter((x) => x.id !== t.id) : [...l, { id: t.id, min: 30, days: 3 }]))}>
                {t.icon} {t.t}
              </button>
            );
          })}
        </div>
        {others.map((x) => (
          <div key={x.id} className="trex">
            <span>{labelOf(x.id)}</span>
            <select value={x.min} aria-label={`${labelOf(x.id)}の1回の時間`} onChange={(e) => setOthers((l) => l.map((y) => (y.id === x.id ? { ...y, min: parseInt(e.target.value, 10) } : y)))}>
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  1回 {m}分
                </option>
              ))}
            </select>
            <select value={x.days} aria-label={`${labelOf(x.id)}の週の回数`} onChange={(e) => setOthers((l) => l.map((y) => (y.id === x.id ? { ...y, days: parseInt(e.target.value, 10) } : y)))}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  週{d}回
                </option>
              ))}
            </select>
          </div>
        ))}
        {others.length > 0 && (
          <>
            <Bars unit="分" items={others.map((x) => ({ label: labelOf(x.id).slice(0, 6), value: x.min * x.days }))} />
            <p className="agnote small">
              週の合計 <b>{weeklyMin(others)}分</b>（国の目安：歩行など 週{guideMin(band)}分）。筋トレは、国の目安で週2〜3日。まず、できる回数から。
            </p>
          </>
        )}
      </section>

      <section className="card" id="s1a">
        <p className="balh">分析と対策（自動）</p>
        <p className="agnote">年齢・体重・体のデータ・食事・運動・持病に加えて、「いまの状況」を選ぶと、詳しく分析して、対策が出ます。</p>
        <p className="balh sub">いまの状況（当てはまるもの）</p>
        <div className="trchips" role="group" aria-label="いまの状況">
          {TROUBLES.map((t) => {
            const hint = (t.id === "constipation" && ct.any && ct.fi < parseFloat(gl.fi || "0") * 0.7) || (t.id === "muscleloss" && ct.any && ct.p < parseFloat(gl.p || "0") * 0.7);
            return (
              <button key={t.id} type="button" aria-pressed={troubles.includes(t.id)} className={troubles.includes(t.id) ? "trchip on" : "trchip"} onClick={() => setTroubles((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}>
                {t.icon} {t.label}
                {hint ? " ★" : ""}
              </button>
            );
          })}
        </div>
        <p className="agnote small">★は、現状の食事から、当てはまりそうな項目です（食物繊維・たんぱく質が、目安の7割未満）。</p>
        {findings.length === 0 && !ageN ? (
          <p className="agnote">年齢・体重・食事などを入れると、分析と対策が出ます。</p>
        ) : (
          <>
            <div className="trsev" aria-label="分析のまとめ">
              <span className="s0">要対策 {nSev.要対策}</span>
              <span className="s1">注意 {nSev.注意}</span>
              <span className="s2">良好 {nSev.良好}</span>
            </div>
            {ageN && (
              <div className="trage">
                <p className="trt">
                  {ageN.icon} 年代のポイント：{ageN.title}
                </p>
                <ul>
                  {ageN.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                {ageN.refs.length > 0 && (
                  <p className="trsrc">
                    <small>根拠</small>
                    {ageN.refs.map((r) => (
                      <a key={r.pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer">
                        {r.label}
                      </a>
                    ))}
                  </p>
                )}
              </div>
            )}
            <ul className="trfind">
              {findings.map((f) => (
                <li key={f.id} className={`sev-${f.sev}`}>
                  <p className="trfh">
                    <span aria-hidden>{f.icon}</span>
                    <b>{f.title}</b>
                    <em>{f.sev}</em>
                  </p>
                  {f.detail && <p className="trfd">{f.detail}</p>}
                  {f.actions.length > 0 && (
                    <ol>
                      {f.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ol>
                  )}
                  {f.refs && f.refs.length > 0 && (
                    <p className="trsrc">
                      {f.refs.map((r) => (
                        <a key={r.pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer">
                          {r.label}
                        </a>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="card" id="s2">
        <p className="balh">② 現状の食事（任意：聞けたときだけ）</p>
        <p className="agnote">食事は、入れなくても、大丈夫です。入れなくても、目標カロリー・PFC・食事例・専門家の評価・アクションは、基本情報から、出ます。入れると、現状との差も、出ます。</p>
        <details className="trask">
          <summary>聞くことのリスト（タップで開く）</summary>
          {ASK.map((g) => (
            <div key={g.t} className="trs">
              <small>{g.t}</small>
              <ol>
                {g.q.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </div>
          ))}
          <p className="plwarn">{ASK_CARE}</p>
          <p className="agnote small">聞き取りの項目は、現場で使う一般的なものです。</p>
        </details>
        <p className="agnote">朝・昼・夜・おやつを、お客様の話に合わせて、タップで選びます。量や足したものも、直せます。</p>
        <MealPicker value={curMeal} onChange={setCurMeal} />
        <p className="balh sub">水分（水・お茶。甘くないもの）</p>
        <div className="plpace" role="radiogroup" aria-label="水分">
          {(
            [
              [2, "〜3杯"],
              [5, "4〜6杯"],
              [8, "7杯〜"],
            ] as const
          ).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={water === v} className={water === v ? "on" : ""} onClick={() => setWater(water === v ? 0 : v)}>
              {t}
              <small>1日・200ml/杯</small>
            </button>
          ))}
        </div>
        {ct.any ? (
          <>
            <ul className="qmtot" aria-label="現状の1日の合計">
              <li>
                <small>エネルギー</small>
                <b>{r10(ct.kcal).toLocaleString()}</b>
                <em>kcal</em>
              </li>
              <li>
                <small>たんぱく質</small>
                <b>{Math.round(ct.p)}g</b>
                <em>目安 {gl.p}</em>
              </li>
              <li>
                <small>脂質</small>
                <b>{Math.round(ct.f)}g</b>
              </li>
              <li>
                <small>炭水化物</small>
                <b>{Math.round(ct.c)}g</b>
              </li>
              <li className={ct.salt > gl.salt ? "over" : ""}>
                <small>食塩</small>
                <b>{Math.round(ct.salt * 10) / 10}g</b>
                <em>目標 {gl.salt}g未満</em>
              </li>
            </ul>
            <p className="balh sub">気づき（自動）</p>
            {good.length > 0 && (
              <p className="trgood">
                <b>✔ できていること</b>
                {good.join("／")}
              </p>
            )}
            <ul className="trinsight">
              {insights.map((s) => (
                <li key={s.id}>
                  {s.t}
                  {s.k ? <b> （約{r10(s.k)}kcal）</b> : null}
                  <br />
                  <span className="ract">▶ {s.a}</span>
                </li>
              ))}
              {insights.length === 0 && <li>大きな偏りは、見当たりません。量と、続けやすさを、確認しましょう。</li>}
            </ul>
            <p className="agnote small">気づきは、選んだ食事の目安量からの自動計算です。目安量は「ふつうの1食ぶん」で、実際とは、ずれます。お客様に、確かめながら使ってください。</p>
          </>
        ) : (
          <p className="agnote">食事を選ぶと、合計と、気づきが出ます。</p>
        )}
      </section>

      <section className="card" id="s3">
        <p className="balh">③ 提案する食事内容（任意）</p>
        <p className="agnote">こちらも、任意です。入れなくても、自動の食事例が、お客様向けのまとめに、出ます。</p>
        <p className="agnote">現状を、コピーして、直すと、早いです。比べながら、お客様に、示せます。</p>
        <div className="trgrid">
          <button type="button" className="btn ghost" onClick={() => setPlanMeal({ date: curMeal.date, size: { ...curMeal.size }, ext: { ...curMeal.ext } })}>
            現状をコピーして、直す
          </button>
          <label className="trf">
            <span>1日の目標カロリー（任意）</span>
            <input inputMode="numeric" value={targetKcal} onChange={(e) => setTargetKcal(e.target.value)} placeholder="空欄なら、自動（体のデータから）" aria-label="1日の目標カロリー" />
          </label>
        </div>
        <MealPicker value={planMeal} onChange={setPlanMeal} />
        {pt.any && (
          <table className="nctable trcmp" aria-label="現状と提案の比較">
            <thead>
              <tr>
                <th></th>
                <th>現状</th>
                <th>提案</th>
                <th>差</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["エネルギー(kcal)", r10(ct.kcal), r10(pt.kcal)],
                  ["たんぱく質(g)", Math.round(ct.p), Math.round(pt.p)],
                  ["脂質(g)", Math.round(ct.f), Math.round(pt.f)],
                  ["炭水化物(g)", Math.round(ct.c), Math.round(pt.c)],
                  ["食物繊維(g)", Math.round(ct.fi * 10) / 10, Math.round(pt.fi * 10) / 10],
                  ["食塩(g)", Math.round(ct.salt * 10) / 10, Math.round(pt.salt * 10) / 10],
                ] as [string, number, number][]
              ).map(([n, a, b]) => (
                <tr key={n}>
                  <th scope="row">{n}</th>
                  <td>{a.toLocaleString()}</td>
                  <td>{b.toLocaleString()}</td>
                  <td>
                    <b>{b - a > 0 ? "+" : ""}{(Math.round((b - a) * 10) / 10).toLocaleString()}</b>
                  </td>
                </tr>
              ))}
              {wantKcal > 0 && (
                <tr>
                  <th scope="row">目標との差(kcal)</th>
                  <td>{r10(ct.kcal - wantKcal) > 0 ? "+" : ""}{r10(ct.kcal - wantKcal).toLocaleString()}</td>
                  <td>{r10(pt.kcal - wantKcal) > 0 ? "+" : ""}{r10(pt.kcal - wantKcal).toLocaleString()}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {pt.any && wantKcal > 0 && Math.abs(pt.kcal - wantKcal) > 200 && <p className="plwarn">提案の食事が、目標カロリーから、約{r10(Math.abs(pt.kcal - wantKcal)).toLocaleString()}kcal はなれています。量や足したものを、調整しましょう。</p>}
      </section>
      <section className="card" id="s3s">
        <p className="balh">短期プログラム（任意）：ファスティング・16時間断食・腸活・短期ダイエット</p>
        <p className="agnote">ダイエット方法（食事の割合）とは別に、期間を決めて行う取り組みを、選べます。選ぶと、お客様向けのまとめ（PDF・リンク）に、日程表・注意・根拠が入ります。選ばなくても、大丈夫です。</p>
        <div className="mechips" role="radiogroup" aria-label="短期プログラム" style={{ flexWrap: "wrap" }}>
          <button type="button" role="radio" aria-checked={shortPlan === ""} className={shortPlan === "" ? "on" : ""} onClick={() => setShortPlan("")}>なし</button>
          {SHORT_PLANS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={shortPlan === p.id} className={shortPlan === p.id ? "on" : ""} onClick={() => setShortPlan(p.id)}>{p.icon} {p.name.replace(/（.*$/, "")}</button>
          ))}
        </div>
        {getShortPlan(shortPlan) && <ShortPlanView plan={getShortPlan(shortPlan)!} />}
      </section>
      <section className="card" id="s3p">
        <p className="balh">新しいダイエット方法の施策（選んで提案：理想のPFC・注意事項つき）</p>
        <p className="agnote">低糖質・16時間断食・ファスティング・ケトジェニック・脂質カットなどを、並べて、お客様に提案できます。選ぶと、お客様向けのまとめ（PDF・リンク）に、比較の表、理想のPFC（％とグラム）、注意事項、根拠が入ります。</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
          <button type="button" className="trchip on" onClick={() => setPack(PACK_DEFAULT)}>5つ全部（低糖質・16時間断食・ファスティング・ケトジェニック・脂質カット）</button>
          <button type="button" className="trchip" onClick={() => setPack([])}>全部はずす</button>
        </div>
        <div className="mechips" role="group" aria-label="ダイエット方法の施策" style={{ flexWrap: "wrap" }}>
          {PACK_OPTIONS.map((o) => (
            <button key={o.id} type="button" aria-pressed={pack.includes(o.id)} className={pack.includes(o.id) ? "on" : ""} onClick={() => setPack((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))}>{o.icon} {o.label}</button>
          ))}
        </div>
        {pack.length > 0 && <MethodPlans ids={pack} kcal={wantKcal} evLimit={2} />}
      </section>
      <section className="card" id="s3k">
        <p className="balh">停滞期を抜ける・腸内環境を整える：打開策の候補（選んで提案）</p>
        <p className="agnote">リフィード・チートデイ・ダイエットブレイク・16時間断食・腸活など、候補を、いくつか選んで、お客様に提案できます。選ぶと、お客様向けのまとめ（PDF・リンク）に、やり方・注意・根拠が入ります。「自動で候補を出す」は、いまの状況（困りごと・持病・年齢）から、選びます。</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
          <button type="button" className="trchip on" onClick={() => setBreakers(suggestBreakers({ stall: troubles.includes("plateau"), weeksStalled: troubles.includes("plateau") ? 4 : 0, gut: troubles.includes("constipation"), youth: youthNow, cond: conds.length > 0, noReduce: false }))}>🔄 自動で候補を出す</button>
          <button type="button" className="trchip" onClick={() => setBreakers([])}>全部はずす</button>
        </div>
        <div className="mechips" role="group" aria-label="打開策の候補" style={{ flexWrap: "wrap" }}>
          {BREAKERS.map((b) => (
            <button key={b.id} type="button" aria-pressed={breakers.includes(b.id)} className={breakers.includes(b.id) ? "on" : ""} onClick={() => setBreakers((x) => (x.includes(b.id) ? x.filter((y) => y !== b.id) : [...x, b.id]))}>{b.icon} {b.name.replace(/（.*$/, "")}</button>
          ))}
        </div>
        {breakers.map((id) => {
          const b = BREAKERS.find((x) => x.id === id);
          if (!b) return null;
          return (
            <label key={id} className="advl" style={{ marginTop: 8 }}>
              {b.icon} {b.name.replace(/（.*$/, "")}：このお客様への、具体的な指示（開始日・量・回数・注意など。まとめに載ります）
              <textarea value={bkNotes[id] ?? ""} rows={3} placeholder="例：来週月曜から2週間。体重は毎朝測り、週平均で見る。" onChange={(e) => setBkNotes((x) => ({ ...x, [id]: e.target.value }))} />
            </label>
          );
        })}
        <label className="advl" style={{ marginTop: 8 }}>
          自分で足す打開策（上にない方法：例 ファスティング〇日、チートデイの回数 など）
          <textarea value={bkNotes._free ?? ""} rows={3} placeholder="ここに書いた内容が、打開策の欄の最後に載ります。" onChange={(e) => setBkNotes((x) => ({ ...x, _free: e.target.value }))} />
        </label>
        {breakers.length > 0 && <BreakerView ids={breakers} evLimit={4} notes={bkNotes} />}
        <p className="balh" style={{ marginTop: 14 }}>お客様の最新の状況を書くと、アドバイスを出します</p>
        <textarea className="advta" style={{ width: "100%", boxSizing: "border-box", font: "inherit", padding: 10, border: "1px solid #bbb", borderRadius: 10 }} rows={4} value={situation} placeholder="例：2ヶ月体重が減っていない。食事もそこまで減らしていない。最近よく眠れず、歩数も落ちている。" onChange={(e) => setSituation(e.target.value)} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}>
          <button type="button" className="trchip on" onClick={() => setAsked(situation)}>🧭 アドバイスを出す</button>
          <button type="button" className="trchip" onClick={() => setBreakers(suggestBreakers({ stall: /停滞|減らない|減って(い)?ない|落ちない|変わらない/.test(situation) || troubles.includes("plateau"), weeksStalled: /ヶ月|か月|カ月|週間/.test(situation) ? 6 : troubles.includes("plateau") ? 4 : 0, gut: /便秘|お腹|腸/.test(situation) || troubles.includes("constipation"), youth: youthNow, cond: conds.length > 0, noReduce: /そこまで(へら|減ら)していない/.test(situation) }))}>状況から、打開策の候補を選ぶ</button>
        </div>
        {asked.trim() && (() => {
          const a: Advice = advise({ text: asked, age: num(age), sex });
          return (
            <div className="advcard" style={{ margin: "8px 0" }}>
              <p style={{ margin: "0 0 4px" }}><b>読み取った状況：</b>{a.matched.join("・") || "（典型的なパターンを、読み取れませんでした）"}</p>
              {a.causes.length > 0 && (<><b>考えられる原因</b><ul style={{ margin: "2px 0 6px 18px" }}>{a.causes.map((c) => <li key={c.title}>［{c.likelihood}］{c.title}：{c.why}</li>)}</ul></>)}
              {a.questions.length > 0 && (<><b>確認すること</b><ul style={{ margin: "2px 0 6px 18px" }}>{a.questions.slice(0, 5).map((q) => <li key={q}>{q}</li>)}</ul></>)}
              {a.actions.length > 0 && (<><b>対策</b><ol style={{ margin: "2px 0 6px 18px" }}>{a.actions.map((x, i) => <li key={i}>［{x.when}］{x.what}</li>)}</ol></>)}
              {a.flow.length > 0 && (<><b>今後の流れ</b><ol style={{ margin: "2px 0 6px 18px" }}>{a.flow.map((x, i) => <li key={i}>［{x.when}］{x.what}</li>)}</ol></>)}
              {a.refer.length > 0 && <p style={{ margin: "4px 0", color: "#8a4b00" }}>⚠ {a.refer.join(" ／ ")}</p>}
              <p style={{ margin: "4px 0", fontSize: 13, color: "#555" }}>根拠：{a.evidence.slice(0, 4).map((e) => e.label).join("／") || "—"}（くわしくは「相談」ページ）</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="trchip on" onClick={() => setAdvice((x) => (x ? x + "\n\n" : "") + a.say)}>お客様向けの文を、「詳しいアドバイス」に入れる</button>
                <button type="button" className="trchip" onClick={() => setAdvice((x) => (x ? x + "\n\n" : "") + a.actions.map((y, i) => (i + 1) + ". " + y.what).join("\n"))}>対策を、「詳しいアドバイス」に入れる</button>
              </div>
            </div>
          );
        })()}
        <label className="advl" style={{ marginTop: 8 }}>
          詳しいアドバイス（お客様に送る文章。自由に書けます）
          <textarea value={advice} rows={6} placeholder="例：停滞の原因は…／まず1週間、〇〇を試す／うまくいかないときは…" onChange={(e) => setAdvice(e.target.value)} />
        </label>
      </section>
      <section className="card" id="s3m">
        <p className="balh">食事の方法（5つの提案）：カロリーとPFCバランス</p>
        <p className="agnote">方法を選ぶと、1日のカロリー（自動）に合わせて、たんぱく質・脂質・炭水化物（PFC）のグラム数と、食事例が出ます。PFCの%は、手で直せます。</p>
        <div className="trrec" aria-label="おすすめの食事の方法">
          <p>
            <b>おすすめ：{getMethod(rec.top).icon} {getMethod(rec.top).name}</b>
            {method && method !== rec.top ? <span>（いまは、手で「{mth.name}」を選んでいます）</span> : <span>（自動）</span>}
          </p>
          <p className="agnote small">{rec.basis}</p>
          <ul>
            {rec.fits[rec.top].why.slice(0, 3).map((x) => (
              <li key={x}>{x}</li>
            ))}
            {rec.fits[methodId].fit !== "おすすめ" && rec.fits[methodId].why.slice(0, 2).map((x) => <li key={x} className="warn">{mth.name}：{x}</li>)}
          </ul>
          {method && (
            <button type="button" className="btn ghost" onClick={() => { setMethod(""); setPfc(null); }}>
              おすすめ（自動）に戻す
            </button>
          )}
        </div>        <div className="trmeth" role="radiogroup" aria-label="食事の方法">
          {METHODS.map((m) => {
            const b = methodBlocked(m, { hasConds: conds.length > 0, youth: youthNow });
            return (
              <button key={m.id} type="button" role="radio" aria-checked={methodId === m.id} className={methodId === m.id ? "on" : ""} disabled={!!b || rec.fits[m.id].fit === "不可"} onClick={() => { setMethod(m.id); setPfc(null); }}>
                <span aria-hidden>{m.icon}</span>
                <b>{m.name}</b>
                <small>
                  {m.tag}　<i className={`trfit f-${rec.fits[m.id].fit}`}>{rec.fits[m.id].fit}</i>
                  {m.id === rec.top ? <i className="trfit f-top">自動で選択</i> : null}
                </small>
                {b && <em>{b}</em>}
                {!b && rec.fits[m.id].fit === "不可" && <em>{rec.fits[m.id].why[0]}</em>}
              </button>
            );
          })}
        </div>
        {blocked && <p className="plwarn">{blocked}</p>}
        <div className="trmbox">
          <p className="trgoal">
            <b>{mth.name}</b>　{wantKcal ? <>1日 約<b>{wantKcal.toLocaleString()}</b> kcal</> : "（体重や体のデータを入れると、カロリーが自動で出ます）"}
          </p>
          <p className="agnote">{mth.summary}</p>
          <p className="balh sub">PFCの比率（%）：直せます</p>
          <div className="trgrid3">
            {(
              [
                ["p", "たんぱく質"],
                ["f", "脂質"],
                ["c", "炭水化物"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="trf">
                <span>{l}（%）</span>
                <input inputMode="numeric" value={pfc ? pfc[k] : String(mth.pct[k])} onChange={(e) => setPfc({ ...(pfc ?? { p: String(mth.pct.p), f: String(mth.pct.f), c: String(mth.pct.c) }), [k]: e.target.value })} aria-label={`${l}の比率`} />
              </label>
            ))}
          </div>
          <div className="rchartrow">
            <Pie
              size={110}
              title="目標のPFC"
              data={[
                { label: "たんぱく質", value: pctEff.p, color: "#2e9e6a" },
                { label: "脂質", value: pctEff.f, color: "#e0a030" },
                { label: "炭水化物", value: pctEff.c, color: "#4a7fd0" },
              ]}
            />
            <div style={{ flex: "1 1 200px" }}>
              {mac ? (
                <p className="trgoal">
                  たんぱく質 <b>{mac.p}</b>g／脂質 <b>{mac.f}</b>g／炭水化物 <b>{mac.c}</b>g
                </p>
              ) : null}
              <p className="agnote small">
                {Math.abs(pctSum - 100) > 1 ? `合計が ${pctSum}% です。比率で、割りふっています。` : ""}
                {inNational(pctEff) ? "国の目標量の範囲内です。" : "国の目標量（たんぱく質13〜20%・脂質20〜30%・炭水化物50〜65%）の範囲の外です。"}
              </p>
              {pfc && (
                <button type="button" className="btn ghost" onClick={() => setPfc(null)}>
                  自動（方法の初期値）に戻す
                </button>
              )}
            </div>
          </div>
          <div className="trs">
            <small>選ぶもの</small>
            <ol>
              {mth.choose.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="trs">
            <small>控えるもの・気をつけること</small>
            <ol>
              {mth.avoid.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="trs trcommon">
            <small>トレーナーの指導方針（全員共通）：気をつけること</small>
            {COMMON_NOTES.map((n) => (
              <div key={n.id} className="trcn">
                <b>{n.icon} {n.title}</b>
                <ul>
                  {n.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="trverdict">{n.verdict}</p>
                <ul className="trevl">
                  {n.evidence.map((e) => (
                    <li key={e.pmid}>
                      <a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noopener noreferrer">{e.label}</a>：{e.note}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ul className="trcaution">
              {COMMON_CAUTION.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="agnote small">上の「根拠の強さ」と、論文の結果（PubMed）を、お客様への説明に使ってください。論文の結果と、指導方針が、ちがう部分も、そのまま書いています。</p>
          </div>
          <p className="tre">
            <small>向いている人</small>
            {mth.suits}
          </p>
          <div className="trl">
            <small>注意</small>
            <ul>
              {mth.caution.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <p className="trsrc">
            <small>根拠（{mth.level}）</small>
            {mth.evidence.map((e) => (
              <a key={e.pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noopener noreferrer">
                {e.label}：{e.note}
              </a>
            ))}
          </p>
          <div className="rexc near" style={{ marginTop: 8 }}>
            <p className="rext">
              食事例：{mth.example.name}　<b>約{r10(exT.kcal).toLocaleString()}kcal</b>
            </p>
            <p className="rexn">
              実際の比率：たんぱく質 {Math.round(((exT.p * 4) / exE) * 100)}%・脂質 {Math.round(((exT.f * 9) / exE) * 100)}%・炭水化物 {Math.round(((exT.c * 4) / exE) * 100)}%（{Math.round(exT.p)}g・{Math.round(exT.f)}g・{Math.round(exT.c)}g）　{mth.example.note}
            </p>
            <ul>
              {describe(exSt).map((l) => (
                <li key={l}>{l.replace(/（約\d[\d,]*kcal）$/, "")}</li>
              ))}
            </ul>
            <button type="button" className="trpick" disabled={!!blocked} onClick={() => setPlanMeal({ date: planMeal.date, size: { ...exSt.size }, ext: { ...exSt.ext } })}>
              この食事例を、「③提案する食事」に入れる
            </button>
            <p className="agnote small">食事例のカロリーは、目標と違います。量（少なめ／多め）や、足したものを、③で、調整してください。</p>
          </div>
        </div>
        <p className="balh sub">5つの方法の、くらべ</p>
        <table className="nctable trcmp">
          <thead>
            <tr>
              <th>方法</th>
              <th>P / F / C（%）</th>
              <th>国の範囲</th>
              <th>根拠</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((m) => (
              <tr key={m.id}>
                <th scope="row">{m.name}</th>
                <td>
                  {m.pct.p} / {m.pct.f} / {m.pct.c}
                </td>
                <td>{inNational(m.pct) ? "内" : "外"}</td>
                <td>{m.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="agnote small">どの方法でも、続けられることと、食べる量（カロリー）が、大切です（Sacks 2009）。持病・服薬のある人は、主治医の指示が優先です。</p>
        <p className="balh sub">このお客様の食事例（{pdays.length}パターン：カロリー・PFCに合わせて、量を調整）</p>
        {pdays.length === 0 ? (
          <p className="agnote">体重・体のデータを入れて、目標カロリーが出ると、お客様ごとの食事例が出ます。</p>
        ) : (
          <div className="rex">
            {pdays.map((d2) => (
              <div key={d2.id} className="rexc">
                <p className="rext">
                  {d2.name}　<b>約{r10(d2.tot.kcal).toLocaleString()}kcal</b>
                </p>
                <p className="rexn">
                  目標との差 {d2.dk > 0 ? "+" : ""}{d2.dk}kcal／P {d2.pct.p}%・F {d2.pct.f}%・C {d2.pct.c}%　{d2.note}
                </p>
                <ul>
                  {d2.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <button type="button" className="trpick" onClick={() => setPlanMeal({ date: planMeal.date, size: { ...d2.st.size }, ext: { ...d2.st.ext } })}>
                  この例を、「③提案する食事」に入れる
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card" id="s3b">
        <p className="balh">ゴールの目安と、置きかえ（増やす食事）</p>
        <p className="balh sub">ペース</p>
        <div className="plpace" role="radiogroup" aria-label="ペース">
          {PACES.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={effPace === p.id} className={effPace === p.id ? "on" : ""} disabled={conds.length > 0 && p.id !== "slow"} onClick={() => setPace(p.id)}>
              {p.t}
              <small>{p.d}</small>
            </button>
          ))}
        </div>
        {conds.length > 0 && <p className="agnote small">持病・体質を選んでいるため、ゆっくり（月1kgまで）にしています。</p>}
        {plan ? (
          <>
            <p className="trgoal">
              <b>
                {w}kg → {wt}kg
              </b>
              　約<b>{plan.weeks}</b>週間{plan.capped ? "（1年以上）" : ""}　筋トレ 週{days}回 → 合計<b>{plan.sessions}</b>回
            </p>
            <LineChart pts={plan.pts} target={wt} marks={plan.marks} />
            <p className="agnote small">
              週に約{plan.rate}kgの変化（{plan.kind === "lose" ? "減量" : "増量"}）が前提です。1日あたり約{plan.perDay}kcalの差が必要です（食事の置きかえと、活動で）。体重の変化の目安で、個人差があります。
            </p>
          </>
        ) : (
          <p className="agnote">いまの体重と目標の体重を入れると、ゴールまでの道すじが出ます。</p>
        )}
        <p className="balh sub">置きかえの提案（こちらを食べてください）</p>
        {swaps.length > 0 ? (
          <ul className="trswap">
            {swaps.map((s) => (
              <li key={s.id} className={swapOff.includes(s.id) ? "off" : ""}>
                <label>
                  <input type="checkbox" checked={!swapOff.includes(s.id)} onChange={() => setSwapOff((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : [...x, s.id]))} aria-label={`${s.from}の置きかえを、お客様に示す`} />
                  <span>
                    <em>いま：{s.from}</em>
                    <b>→ {s.to}</b>
                    <small>
                      {s.why}（{s.dk > 0 ? "+" : ""}
                      {s.dk}kcal／たんぱく質 {s.dp > 0 ? "+" : ""}
                      {s.dp}g／食物繊維 {s.dfi > 0 ? "+" : ""}
                      {s.dfi}g）
                    </small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="agnote">②で、現状の食事を選ぶと、「こちらを食べてください」という置きかえが出ます。</p>
        )}
        <p className="agnote small">「減らす」ではなく「増やす」置きかえです。チェックしたものが、お客様用のまとめに入ります。kcalとg は、食品の目安値からの計算です。</p>
      </section>
      <section className="card" id="s5t">
        <p className="balh">困りごとへの対処（くわしく）</p>
        {troubles.length === 0 && <p className="agnote">上の「いまの状況」で、当てはまるものを選ぶと、原因の見かた・対処・食べるもの・受診の目安・根拠が、ここに出ます。選んだものは、お客様向けまとめに入ります。</p>}
        {TROUBLES.filter((t) => troubles.includes(t.id)).map((t) => (
          <details key={t.id} className="trcard" open>
            <summary>
              <span className="trt">
                {t.icon} {t.label}
              </span>
              <span className={`trlv lv-${t.level}`}>根拠 {t.level}</span>
            </summary>
            <p className="tra">{t.intro}</p>
            <div className="trs">
              <small>原因の見かた</small>
              <ul>
                {t.check.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="trs">
              <small>対処のステップ</small>
              <ol>
                {t.steps.map((x) => (
                  <li key={x}>{x.replace(/^[①-⑩]\s*/, "")}</li>
                ))}
              </ol>
            </div>
            <div className="trs">
              <small>増やす食べもの</small>
              <ul>
                {t.eat.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <p className="plwarn">
              <b>受診の目安：</b>
              {t.see.join("／")}
            </p>
            <p className="trsrc">
              <small>根拠</small>
              {t.evidence.map((e) =>
                e.pmid ? (
                  <a key={e.label} href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noopener noreferrer">
                    {e.label}：{e.note}
                  </a>
                ) : (
                  <span key={e.label}>
                    {e.label}：{e.note}
                  </span>
                )
              )}
            </p>
            <p className="trl">
              <small>限界</small>
              {t.limits}
            </p>
          </details>
        ))}
      </section>

      <section className="card" id="s6f">
        <p className="balh">食品の例（量の早見表）</p>
        <p className="agnote">「たんぱく質10gをとれる食品」「高炭水化物の食品」など、量を入れると、食品ごとの量が出ます。お客様向けまとめにも、入ります。</p>
        <div className="trchips" role="group" aria-label="栄養素">
          {NUTS.map((n) => (
            <button key={n.key} type="button" aria-pressed={foodNut === n.key} className={foodNut === n.key ? "trchip on" : "trchip"} onClick={() => setFoodNut(n.key)}>
              {n.label}
            </button>
          ))}
        </div>
        {(() => {
          const nut = NUTS.find((n) => n.key === foodNut)!;
          const amt = parseFloat(foodAmts[foodNut] ?? String(nut.defaults[0])) || nut.defaults[0];
          const rows = foodsFor(foodNut, amt);
          return (
            <>
              <label className="trf">
                <span>
                  {nut.label}の量（{nut.unit}）　{nut.hint}
                </span>
                <input inputMode="decimal" value={foodAmts[foodNut] ?? String(nut.defaults[0])} onChange={(e) => setFoodAmts((x) => ({ ...x, [foodNut]: e.target.value }))} aria-label={`${nut.label}の量`} />
              </label>
              <table className="nctable trcmp">
                <thead>
                  <tr>
                    <th>
                      {nut.label} {amt}
                      {nut.unit} をとれる食品
                    </th>
                    <th>量</th>
                    <th>kcal</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name}>
                      <th scope="row">
                        {r.name}
                        <small style={{ display: "block", fontWeight: 400, color: "#667" }}>{unitLabel(r)}</small>
                      </th>
                      <td>{r.g}g</td>
                      <td>{r.kcal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="agnote small">日本食品標準成分表をもとにした目安値からの計算です。調理法・商品で、変わります。</p>
            </>
          );
        })()}
      </section>
      <section className="card" id="s4a">
        <p className="balh">お客様に示す、アクション（自動）</p>
        <p className="agnote">「何を、どう変えるか」を、番号つきで、お客様に示します。チェックを外すと、まとめから、はずれます。</p>
        {actions.length > 0 ? (
          <ol className="tract">
            {actions.map((x) => (
              <li key={x.id} className={actOff.includes(x.id) ? "off" : ""}>
                <label>
                  <input type="checkbox" checked={!actOff.includes(x.id)} onChange={() => setActOff((o) => (o.includes(x.id) ? o.filter((y) => y !== x.id) : [...o, x.id]))} aria-label={`アクション「${x.text.slice(0, 12)}」を、お客様に示す`} />
                  <span>
                    <em>{x.tag}</em>
                    <b>{x.text}</b>
                    {x.detail && <small>{x.detail}</small>}
                  </span>
                </label>
              </li>
            ))}
          </ol>
        ) : (
          <p className="agnote">食事・運動を入力すると、アクションが出ます。</p>
        )}
      </section>
      <section className="card">
        <p className="balh">アドバイスのたたき台（自動）</p>
        <p className="agnote">現状の食事と提案から、お客様への伝え方の案を作ります。「できていること」を先に伝え、取り組むことは、1つだけに絞ります。</p>
        {ct.any ? (
          <>
            <pre className="trpre">{draft}</pre>
            <button type="button" className="trpick" onClick={() => setNote((n) => (n.trim() ? `${n.trim()}\n\n${draft}` : draft))}>
              ＋ 「トレーナーからの一言」に入れる
            </button>
            <p className="agnote small">案は、自動で作った下書きです。お客様の様子に合わせて、言葉を直してから使ってください。</p>
          </>
        ) : (
          <p className="agnote">②で、現状の食事を選ぶと、案が出ます。</p>
        )}
      </section>

      <section className="card" id="s4">
        <p className="balh">④ 課題と、今週の行動</p>
        <p className="agnote">お客様の課題を選ぶと、確認すること・食事での対応・根拠が出ます。下の欄に、トレーナーが、課題と行動を書き込めます。</p>
        <div className="trchips" role="group" aria-label="課題">
          {ISSUES.map((c) => (
            <button key={c.id} type="button" aria-pressed={issues.includes(c.id)} className={issues.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggleIssue(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        {myIssues.length > 0 && <ul className="trlist">{myIssues.map(issueCard)}</ul>}
        <label className="trf">
          <span>課題（トレーナーの記入・任意）</span>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} placeholder="例：夜の間食が多く、週の平均体重が、2週間動いていない。" aria-label="課題" />
        </label>
        <label className="trf">
          <span>今週やること（具体的に・数字で）</span>
          <textarea value={weekAct} onChange={(e) => setWeekAct(e.target.value)} rows={2} placeholder="例：夜の間食は、週3回まで。朝食に、卵か納豆を足す。" aria-label="今週やること" />
        </label>
        <label className="trf">
          <span>次回の確認日</span>
          <input value={nextDate} onChange={(e) => setNextDate(e.target.value)} placeholder="例：11月15日" aria-label="次回の確認日" />
        </label>
      </section>

      <section className="card">
        <p className="balh">⑤ 持病・体質のあるお客様</p>
        <p className="agnote">当てはまるものを選ぶと、食事とトレーニングの考え方・根拠・限界が出ます。診断や治療ではなく、主治医の指示が優先です。</p>
        <div className="trchips" role="group" aria-label="持病・体質">
          {CONDS.map((c) => (
            <button key={c.id} type="button" aria-pressed={conds.includes(c.id)} className={conds.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggleCond(c.id)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {myConds.length > 0 && <ul className="trlist">{myConds.map(condCard)}</ul>}
      </section>

      <section className="card">
        <p className="balh">⑥ 指導メニュー（結論・具体策・根拠・実績）</p>
        <p className="agnote">タップで開きます。共有に入れたものが、最後のLINEにまとまります。</p>
        <ul className="trlist">{plays.map(card)}</ul>
      </section>

      <section className="card">
        <p className="balh">⑦ 最新の論文（自動で取得）</p>
        <p className="agnote">PubMed（米国国立医学図書館）から、メタ分析・系統的レビューの新しい順に取得します。タイトルの一覧で、内容の評価は、していません。指導に使う前に、トレーナーが確認してください。</p>
        <div className="trtopics">
          {TOPICS.map((t) => (
            <div key={t.key} className="trtopic">
              <div className="trthead">
                <b>{t.label}</b>
                <button type="button" className="btn ghost" disabled={busy === t.key} onClick={() => fetchTopic(t.key, t.term)}>
                  {busy === t.key ? "取得中…" : papers[t.key] ? "更新する" : "最新を取得"}
                </button>
              </div>
              {papers[t.key] && (
                <>
                  <p className="trat">取得：{papers[t.key].at}</p>
                  <ul className="trpapers">
                    {papers[t.key].list.map((p) => (
                      <li key={p.id}>
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.id}/`} target="_blank" rel="noopener noreferrer">
                          {p.title}
                        </a>
                        <small>
                          {p.journal}・{p.date}
                        </small>
                        <button type="button" className={pins.some((x) => x.id === p.id) ? "trpin on" : "trpin"} onClick={() => pin(p)}>
                          {pins.some((x) => x.id === p.id) ? "✓ 共有に入れた" : "＋ 共有に入れる"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
        {err && <p className="plwarn">{err}</p>}
      </section>

      <section className="card" id="s8">
        <p className="balh">⑧ お客様に送る（PDF・LINE）</p>
        <label className="trf">
          <span>トレーナーからの一言（任意）</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="例：今週は、歩数を8,000歩に。スクワットは、フォーム優先で。" aria-label="トレーナーからの一言" />
        </label>
        <p className="plmini">送る内容（プレビュー）</p>
        <pre className="trpre">{build() || "（共有に入れたものが、ここに出ます）"}</pre>
        <div className="trsend">
          <p className="balh sub">送る前の確認</p>
          <ul className="trchk">
            <li>数字（カロリー・食塩・体重）は、合っていますか？</li>
            <li>持病・服薬のある方は、主治医への確認の一文が、入っていますか？</li>
            <li>取り組むことは、多すぎませんか？（1〜2つ）</li>
          </ul>
          <p className="balh sub">お客様用のPDF</p>
          <p className="agnote">カロリー・食事内容・課題・今週やること・アドバイスを、A4の1〜2枚にまとめます。</p>
          <a className="linebtn" href="/trainer/report" target="_blank" rel="noopener noreferrer">
            📄 お客様用のまとめ（PDF）を作る
          </a>
          <div className="trlink">
            <p className="balh sub">お客様専用ページ（リンク）</p>
            <p className="agnote small">お客様が、スマホで見られるページです。PDFの代わりに、リンクを送ることもできます。お客様ごとに、送ってください。</p>
            <div className="rptbtns">
              <button
                type="button"
                className="btn ghost"
                disabled={!link}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  } catch {
                    window.prompt("コピーして、使ってください", link);
                  }
                }}
              >
                {copiedLink ? "✓ リンクをコピーしました" : "リンクをコピー"}
              </button>
              <a className="btn ghost" href={link || "#"} target="_blank" rel="noopener noreferrer" aria-disabled={!link}>
                お客様の画面を、見てみる
              </a>
            </div>
            {link.length > 1800 && <p className="agnote small">リンクが長いため、LINEの文章には、入れていません。「リンクをコピー」で、別に、送ってください。</p>}
          </div>
          <ol className="rptsteps">
            <li>上のボタンで、まとめの画面を開き、「PDFとして保存」を押す。</li>
            <li>下の「LINEで送る」（または、まとめの画面のボタン）で、文章を送る。</li>
            <li>LINEのトークで、保存したPDFを、ファイルとして添付する（PDFは、LINEの仕様上、自動では添付できません）。</li>
          </ol>
        </div>
        <LineShare title="トレーニングのまとめ" build={build} noProfile />
      </section>
    </div>
  );
}
