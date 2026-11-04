"use client";

import { useEffect, useMemo, useState } from "react";
import EvidenceBox from "./EvidenceBox";
import { BAND_SHORT, REF, useMe } from "./me";

// 「体重と目標」：いまの体重・なりたい体重を入れると、1日のカロリーと食事バランスが出る。
// 持病・体質を選ぶと、その人向けの食事の考え方とカロリーの目安が出る。診断ではなく、目安。
const num = (s: string) => parseFloat(s) || 0;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r50 = (n: number) => Math.round(n / 50) * 50;
const r10 = (n: number) => Math.round(n / 10) * 10;

type Cond = { id: string; icon: string; label: string; female?: boolean };
const CONDS: Cond[] = [
  { id: "thy-low", icon: "🦋", label: "甲状腺：機能低下（橋本病など）" },
  { id: "thy-high", icon: "🦋", label: "甲状腺：機能亢進（バセドウ病など）" },
  { id: "pcos", icon: "🌸", label: "PCOS・月経不順", female: true },
  { id: "meno", icon: "🌙", label: "更年期・骨が心配", female: true },
  { id: "anemia", icon: "🩸", label: "貧血（鉄不足）" },
  { id: "dm", icon: "🍚", label: "糖尿病" },
  { id: "lipid", icon: "🧈", label: "脂質異常症（コレステロール）" },
  { id: "htn", icon: "🧂", label: "高血圧" },
];

type Ctx = { sexKey: "f" | "m"; band: number; pal: number; h: number; target: number; maint: number };

// 目標体重×エネルギー係数（糖尿病・脂質異常症）。身長が必要。
function dmKcal(c: Ctx): string {
  if (c.band <= 1) return "成長期は、この計算を使いません。主治医・管理栄養士が決めたカロリーに従ってください。";
  if (!c.h) return "身長を入れると、カロリーの目安が出ます。";
  const m = c.h / 100;
  const lo = m * m * 22;
  const hi = c.band >= 5 ? m * m * 25 : lo; // 65歳以上は 22〜25
  const [k1, k2] = c.pal === 0 ? [25, 30] : c.pal === 1 ? [30, 35] : [35, 35];
  const a = r50(lo * k1);
  const b = r50(hi * k2);
  return `約${a.toLocaleString()}${b > a ? `〜${b.toLocaleString()}` : "以上"}kcal（目標体重${r1(lo)}${hi > lo ? `〜${r1(hi)}` : ""}kg × 係数${k1}${k2 > k1 ? `〜${k2}` : "以上"}）`;
}

type Card = { kcal: (c: Ctx) => string; points: (c: Ctx) => string[]; ask: string; ids: string[]; note?: string };
const CARDS: Record<string, Card> = {
  "thy-low": {
    kcal: () => "",
    points: () => [
      "体重増加は、甲状腺ホルモンが足りないときの症状の一つです。薬（合成T4）で数値が整うと、体重が変わることがあります。",
      "昆布・昆布だしを毎日たくさん食べる、ヨウ素入りのサプリを使う、は避けます（ふつうの量の海藻は、問題ありません）。",
      "薬は、コーヒー・食物繊維の多い食品・鉄剤・一部の胃薬で、吸収が妨げられることがあります。食物繊維を急に増やす・鉄のサプリを始めるときは、薬を飲む時間を、主治医・薬剤師に相談してください。",
    ],
    ask: "薬の量を、自分で増やしたり、体重を減らす目的で使ったりしないでください（動悸・手の震えなどが出ます）。",
    ids: ["msdHypo", "okamotoLT4", "itoIodine"],
    note: "日本甲状腺学会の資料は、確認できていません。医療機関・医学書の解説にもとづく、一般的な内容です。",
  },
  "thy-high": {
    kcal: () => "",
    points: () => [
      "食欲が増えても体重が減るのは、ホルモンが多いための症状です。この時期は、減量の食事制限は、しません。",
      "薬で機能が整うと、代謝が落ち着き、以前と同じ量では、太りやすくなることがあります（多くの解説で一致）。治療前の食事量に、そのまま戻さないようにします。",
      "放射性ヨウ素の検査・治療の前は、1〜2週間ほど、ヨウ素の制限が必要なことがあります。医療機関の指示に従ってください。",
    ],
    ask: "治療の後に、甲状腺の機能が低くなり、ホルモン補充が必要になることもあります。体重が急に変わったら、主治医に伝えてください。",
    ids: ["msdHyper", "itoIodine"],
    note: "日本甲状腺学会の資料は、確認できていません。医療機関・医学書の解説にもとづく、一般的な内容です。",
  },
  pcos: {
    kcal: () => "BMI25以上なら、上の目標カロリーで、ゆっくり減量。BMI25未満は、減らさない。",
    points: () => [
      "BMI25以上のPCOSでは、減量が第一選択です。短期の目標は、3〜6か月で、体重の5〜10%減。",
      "5%の減量でも、排卵の再開などが報告されています。",
      "食事の具体的な内容は、産婦人科・管理栄養士と相談を（学会資料には、具体的な食事内容の記載は、確認できていません）。",
    ],
    ask: "月経不順・妊娠を考えている方は、産婦人科で相談してください。",
    ids: ["jsogPcos2025"],
  },
  meno: {
    kcal: () => "上の目標カロリー。ただし、急な減量は避ける（極端な食事制限は、骨粗鬆症の危険因子）。",
    points: (c) => [
      "骨粗鬆症の危険因子：カルシウム不足、ビタミンD・K不足、食塩の取りすぎ、極端な食事制限、運動不足、過度の飲酒。",
      `カルシウムの推奨量は、${BAND_SHORT[c.band]}の女性で1日${REF.f.ca[c.band]}mg（食事摂取基準2025年版）。`,
      "小松菜などの緑黄色野菜、ひじきなどの海藻、豆腐などの大豆製品で、カルシウムを増やします。",
    ],
    ask: "骨量が気になる方・のぼせなどがつらい方は、婦人科・整形外科で相談を。",
    ids: ["kennetBone", "dri2025"],
  },
  anemia: {
    kcal: () => "減らしすぎない（食事が減ると、鉄も減ります）。上の目標カロリーの範囲で。",
    points: (c) => [
      `鉄の推奨量は、${BAND_SHORT[c.band]}の${c.sexKey === "f" ? "女性（月経あり）" : "男性"}で1日${REF[c.sexKey].fe[c.band]}mg（食事摂取基準2025年版）。`,
      "赤身肉・レバー・あさり・小松菜などを、ビタミンCの野菜・果物といっしょに。",
      "貧血かどうかは、血液検査で分かります。サプリは、先に医師・薬剤師へ。",
    ],
    ask: "立ちくらみ・息切れ・強いだるさが続くときは、受診してください。",
    ids: ["dri2025"],
  },
  dm: {
    kcal: (c) => dmKcal(c),
    points: () => [
      "1日のエネルギー量＝目標体重×エネルギー係数。目標体重は、65歳未満で、身長(m)²×22（65歳以上は22〜25）。",
      "係数は、軽い労作25〜30、普通の労作30〜35、重い労作35以上。",
      "治療中は、主治医・管理栄養士が決めたカロリー・炭水化物の量を、優先してください。",
    ],
    ask: "薬（インスリン・血糖を下げる薬）を使っている方は、食事を急に減らさず、必ず主治医に相談を。",
    ids: ["dmicDiet"],
  },
  lipid: {
    kcal: (c) => dmKcal(c),
    points: () => [
      "脂質は、エネルギーの20〜25%。飽和脂肪酸は4.5%以上7%未満（バター・肉の脂身・洋菓子などを減らす）。",
      "コレステロールは、1日200mg未満が目安です。",
      "エネルギー＝標準体重（身長(m)²×22）×25〜35（活動量で変わる）。",
    ],
    ask: "検査値（LDL・中性脂肪など）で、必要な食事は変わります。主治医に確認を。",
    ids: ["jhfLipid"],
  },
  htn: {
    kcal: () => "上の目標カロリー（減量で、血圧が下がる人もいます）。",
    points: (c) => [
      "食塩は、1日6g未満（高血圧治療ガイドライン2019。強い推奨）。",
      "野菜・果物を積極的に（カリウム）。ただし、腎臓の病気がある方は、主治医に確認を。",
      `参考：健康な${c.sexKey === "f" ? "女性" : "男性"}の食塩の目標量は、1日${REF[c.sexKey].salt[c.band]}g未満です。`,
    ],
    ask: "薬を飲んでいる方は、食事の変更を、主治医に伝えてください。",
    ids: ["jshHtn2019"],
  },
};

// 甲状腺：数値が安定しているかで、ダイエットできる範囲が変わる
function ThyroidRange({ id, state, setState, target, maint, perMonth, youth, diff }: { id: string; state: string; setState: (v: string) => void; target: number | null; maint: number; perMonth: number; youth: boolean; diff: number }) {
  const low = id === "thy-low";
  const safe = target ? Math.min(target, maint) : maint;
  // 安定していても、ペースはゆっくり（月1kg）にそろえる
  const slowTarget = Math.max(maint - 240, 1200);
  return (
    <div className="thyr">
      <p className="plmini">いまの状態は？</p>
      <div className="plpace" role="radiogroup" aria-label="甲状腺の状態">
        {(
          [
            ["stable", "治療中で、数値が安定"],
            ["unstable", "治療前・不安定・分からない"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={state === k} className={state === k ? "on" : ""} onClick={() => setState(k)}>
            {l}
          </button>
        ))}
      </div>
      {state === "" && <p className="plsub">どちらかを選ぶと、ダイエットできる範囲が出ます。</p>}
      {state === "unstable" && (
        <p className="plkc">
          <small>ダイエットできる範囲</small>
          {low
            ? "ダイエットの前に、血液検査（TSHなど）と治療。体重増加は、ホルモン不足の症状のことがあり、数値が整うと変わることがあります。食事は、維持の目安（約" + maint.toLocaleString() + "kcal）より減らしません。"
            : "ダイエットはしません。食べても体重が減るのは、ホルモンが多いためです。まず治療を。食事は、維持の目安（約" + maint.toLocaleString() + "kcal）以上をしっかり。"}
        </p>
      )}
      {state === "stable" && (
        <p className="plkc">
          <small>ダイエットできる範囲</small>
          {youth
            ? "中学生・高校生は、減量のカロリーは出しません。主治医に相談を。"
            : diff <= 0.4
              ? `体重を保つ食事で、約${maint.toLocaleString()}kcal。`
              : `「ゆっくり（月1kg）」まで。目標 約${slowTarget.toLocaleString()}kcal / 日（維持 ${maint.toLocaleString()}kcal − 約240kcal）。急な制限・極端な食事法は、しません。始める前に、主治医に一言伝えてください。`}
          {!low && " 治療後に太りやすくなることがあるので、食事量は、様子を見ながら調整します。"}
        </p>
      )}
      {state === "stable" && !youth && diff > 0.4 && (
        <p className="plsub">
          このペースで、月 約1kg（あと{diff}kg → 約{Math.ceil(diff)}か月）。上の「ふつう（月2kg）」は、使いません。
        </p>
      )}
    </div>
  );
}

export default function PlanPanel() {
  const me = useMe();
  const [thy, setThy] = useState<Record<string, string>>({});
  const setThyOne = (id: string, v: string) => {
    setThy((x) => {
      const n = { ...x, [id]: v };
      try {
        localStorage.setItem("lg-thy", JSON.stringify(n));
      } catch {}
      return n;
    });
  };
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-thy") || "null");
      if (s && typeof s === "object") setThy(s);
    } catch {}
  }, []);
  const [now, setNow] = useState("");
  const [goal, setGoal] = useState("");
  const [height, setHeight] = useState("");
  const [pace, setPace] = useState<"slow" | "mid">("slow");
  const [conds, setConds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [meal, setMeal] = useState<{ kcal: number; p: number; f: number; c: number } | null>(null);

  useEffect(() => {
    try {
      setNow(localStorage.getItem("lg-now") || "");
      const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
      if (p?.weight) setGoal(String(p.weight));
      if (p?.height) setHeight(String(p.height));
      const pc = localStorage.getItem("lg-pace2");
      if (pc === "mid" || pc === "slow") setPace(pc);
      const c = JSON.parse(localStorage.getItem("lg-cond") || "null");
      if (Array.isArray(c)) setConds(c.filter((x) => typeof x === "string"));
      const st = JSON.parse(localStorage.getItem("lg-status") || "null");
      if (st?.touched) setMeal({ kcal: st.kcal, p: st.p, f: st.f, c: st.c });
    } catch {}
    setLoaded(true);
  }, []);

  // 保存（体重の予測グラフなど、ほかの場所とも共有）
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-now", now);
      const p = JSON.parse(localStorage.getItem("lg-profile") || "null") || {};
      localStorage.setItem("lg-profile", JSON.stringify({ ...p, weight: goal, height }));
      localStorage.setItem("lg-pace2", pace);
      localStorage.setItem("lg-cond", JSON.stringify(conds));
      window.dispatchEvent(new Event("lg-profile-change"));
    } catch {}
  }, [now, goal, height, pace, conds, loaded]);

  const w0 = num(now);
  const wt = num(goal);
  const h = num(height);
  const ok = w0 >= 20 && w0 <= 300 && wt >= 20 && wt <= 300;
  const maint = REF[me.sexKey].kcal[me.band][me.pal];
  const diff = ok ? r1(w0 - wt) : 0;

  const plan = useMemo(() => {
    if (!ok) return null;
    const floor = me.sexKey === "f" ? 1200 : 1500;
    let target = maint;
    let kind: "loss" | "gain" | "keep" = "keep";
    if (me.isYouth) return { kind: "keep" as const, target: maint, months: 0, perMonth: 0 };
    if (diff > 0.4) {
      kind = "loss";
      const want = r10(((pace === "slow" ? 1 : 2) * 7200) / 30);
      const deficit = Math.min(want, Math.round(maint * 0.2));
      target = Math.max(floor, maint - deficit);
    } else if (diff < -0.4) {
      kind = "gain";
      target = maint + 250;
    }
    const perMonth = Math.abs(maint - target) * 30 / 7200;
    const months = perMonth > 0 ? Math.abs(diff) / perMonth : 0;
    return { kind, target: r10(target), months: Math.ceil(months * 2) / 2, perMonth: r1(perMonth) };
  }, [ok, diff, pace, maint, me.sexKey, me.isYouth]);

  // PFC（食事摂取基準の範囲：P13〜20%・F20〜30%・C50〜65%）
  const pfc = plan
    ? (() => {
        const k = plan.target;
        const p = Math.max(REF[me.sexKey].protein[me.band], Math.round((0.17 * k) / 4));
        const f = Math.round((0.25 * k) / 9);
        const c = Math.max(0, Math.round((k - p * 4 - f * 9) / 4));
        return { p, f, c, pe: Math.round(((p * 4) / k) * 100), fe: Math.round(((f * 9) / k) * 100), ce: Math.round(((c * 4) / k) * 100) };
      })()
    : null;

  // 保存：ホームの先頭でも「目標」を出せるように
  useEffect(() => {
    if (!loaded) return;
    try {
      if (plan && pfc) localStorage.setItem("lg-plan2", JSON.stringify({ kcal: plan.target, p: pfc.p, f: pfc.f, c: pfc.c, now: w0, goal: wt }));
      else localStorage.removeItem("lg-plan2");
      window.dispatchEvent(new Event("lg-status-change"));
    } catch {}
  }, [plan, pfc?.p, pfc?.f, pfc?.c, loaded, w0, wt]);

  const bmi = (w: number) => (h > 100 && w ? w / ((h / 100) * (h / 100)) : 0);
  const ctx: Ctx = { sexKey: me.sexKey, band: me.band, pal: me.pal, h, target: plan?.target ?? maint, maint };
  const toggle = (id: string) => setConds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const step = (set: (v: string) => void, cur: string, d: number) => set(String(r1(Math.max(20, (num(cur) || 50) + d))));
  const list = CONDS.filter((c) => !(c.female && me.sexKey !== "f") && !(c.id === "meno" && me.band < 3));

  return (
    <section className="planp" aria-label="体重と目標">
      <p className="planh">① 体重を入れる</p>
      <div className="planin">
        <div className="plf">
          <span>いまの体重</span>
          <div className="plstep">
            <button type="button" aria-label="いまの体重を減らす" onClick={() => step(setNow, now, -0.5)}>
              −
            </button>
            <input inputMode="decimal" value={now} onChange={(e) => setNow(e.target.value)} placeholder="例 62" aria-label="いまの体重（kg）" />
            <button type="button" aria-label="いまの体重を増やす" onClick={() => step(setNow, now, 0.5)}>
              ＋
            </button>
          </div>
          <small>kg</small>
        </div>
        <div className="plf">
          <span>なりたい体重</span>
          <div className="plstep">
            <button type="button" aria-label="なりたい体重を減らす" onClick={() => step(setGoal, goal, -0.5)}>
              −
            </button>
            <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例 56" aria-label="なりたい体重（kg）" />
            <button type="button" aria-label="なりたい体重を増やす" onClick={() => step(setGoal, goal, 0.5)}>
              ＋
            </button>
          </div>
          <small>kg</small>
        </div>
        <div className="plf">
          <span>身長（BMI・持病の計算に使う）</span>
          <div className="plstep one">
            <input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="例 158" aria-label="身長（cm）" />
          </div>
          <small>cm</small>
        </div>
      </div>
      <p className="planme">
        {me.sexKey === "f" ? "女性" : "男性"}・{BAND_SHORT[me.band]}・活動量{["低い", "ふつう", "高い"][me.pal]}（ホームで変えられます）
      </p>

      {!ok ? (
        <p className="planempty">体重を2つ入れると、1日のカロリーと食事バランスが出ます。</p>
      ) : (
        <>
          <p className="planh">② 1日のカロリーと食事バランス</p>
          {me.isYouth ? (
            <div className="plres">
              <p className="plbig">
                <b>{maint.toLocaleString()}</b> kcal
              </p>
              <p className="plsub">中学生・高校生は、成長期です。減量のカロリーは出しません。この年代の目安のカロリーで、しっかり食べましょう。気になるときは、保護者・学校の先生・医師に相談を。</p>
            </div>
          ) : (
            <>
              {plan && plan.kind === "loss" && (
                <div className="plpace" role="radiogroup" aria-label="減らすペース">
                  {(
                    [
                      ["slow", "ゆっくり（月1kg）"],
                      ["mid", "ふつう（月2kg）"],
                    ] as const
                  ).map(([k, l]) => (
                    <button key={k} type="button" role="radio" aria-checked={pace === k} className={pace === k ? "on" : ""} onClick={() => setPace(k)}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <div className="plres">
                <p className="plkind">{plan?.kind === "loss" ? `あと${diff}kg 減らす` : plan?.kind === "gain" ? `あと${Math.abs(diff)}kg 増やす` : "いまの体重を保つ"}</p>
                <p className="plbig">
                  目標 <b>{plan?.target.toLocaleString()}</b> kcal<small> / 日</small>
                </p>
                <p className="plsub">
                  維持の目安 {maint.toLocaleString()}kcal（食事摂取基準 2025年版）
                  {plan && plan.kind !== "keep" && <>　→　約{plan.months}か月で到達（月 約{plan.perMonth}kg）</>}
                </p>
                {bmi(w0) > 0 && (
                  <p className="plsub">
                    BMI：いま {r1(bmi(w0))} → 目標 {r1(bmi(wt))}（適正の目安 18.5〜24.9）
                  </p>
                )}
              </div>

              {pfc && (
                <div className="plpfc">
                  <p className="plmini">1日の食事バランス（目標）</p>
                  <div className="ksbar" role="img" aria-label={`P${pfc.pe}% F${pfc.fe}% C${pfc.ce}%`}>
                    <span className="p" style={{ width: `${pfc.pe}%` }}>
                      P {pfc.pe}%
                    </span>
                    <span className="f" style={{ width: `${pfc.fe}%` }}>
                      F {pfc.fe}%
                    </span>
                    <span className="c" style={{ width: `${pfc.ce}%` }}>
                      C {pfc.ce}%
                    </span>
                  </div>
                  <p className="plsub">
                    たんぱく質 <b>{pfc.p}g</b>・脂質 <b>{pfc.f}g</b>・炭水化物 <b>{pfc.c}g</b>
                  </p>
                </div>
              )}

              {meal && plan && (
                <div className="plcmp">
                  <p className="plmini">いまの食事と比べると</p>
                  <p className="plsub">
                    いまの食事 約<b>{(Math.round(meal.kcal / 10) * 10).toLocaleString()}</b>kcal → 目標 <b>{plan.target.toLocaleString()}</b>kcal
                    <em className={meal.kcal - plan.target > 150 ? "high" : meal.kcal - plan.target < -150 ? "low" : "ok"}>
                      {Math.abs(meal.kcal - plan.target) <= 150 ? "ほぼ合っています" : meal.kcal > plan.target ? `約${r10(meal.kcal - plan.target)}kcal 多め` : `約${r10(plan.target - meal.kcal)}kcal 少なめ`}
                    </em>
                  </p>
                </div>
              )}
              {!meal && (
                <p className="plsub">
                  いまの食事との比べ方は、ホームで「いつもの食事」を選ぶと出ます。
                </p>
              )}
              <details className="plnote">
                <summary>計算の考え方</summary>
                <p>
                  維持のカロリーは、食事摂取基準（2025年版）の「推定エネルギー必要量」（性別・年齢・活動量別）です。減らす量は、1kgの体脂肪＝約7,200kcalとして計算した、おおまかな目安で、体重の変わり方には個人差があります。下限は、女性1,200kcal・男性1,500kcalで、維持の20%までしか減らしません（この下限と20%は、このアプリの安全のための決め方で、国の基準ではありません）。PFCは、食事摂取基準の範囲（P13〜20%・F20〜30%・C50〜65%）に入れています。
                </p>
                <EvidenceBox ids={["dri2025", "hall2011", "obesity2022"]} level="維持カロリーは強い／減る速さは、目安" />
              </details>
            </>
          )}
        </>
      )}

      <p className="planh">③ 持病・体質は？（気になるものだけ）</p>
      <div className="plconds">
        {list.map((c) => (
          <button key={c.id} type="button" aria-pressed={conds.includes(c.id)} className={conds.includes(c.id) ? "on" : ""} onClick={() => toggle(c.id)}>
            <span aria-hidden>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>
      {conds.length === 0 ? (
        <p className="planempty">当てはまるものを選ぶと、その人向けの、食事の考え方とカロリーが出ます。</p>
      ) : (
        <div className="plcards">
          {list
            .filter((c) => conds.includes(c.id))
            .map((c) => {
              const d = CARDS[c.id];
              return (
                <article key={c.id} className="plcard">
                  <h3>
                    <span aria-hidden>{c.icon}</span> {c.label}
                  </h3>
                  {c.id === "thy-low" || c.id === "thy-high" ? (
                    <ThyroidRange id={c.id} state={thy[c.id] ?? ""} setState={(v) => setThyOne(c.id, v)} target={plan?.kind === "loss" ? plan.target : null} maint={maint} perMonth={plan?.perMonth ?? 0} youth={me.isYouth} diff={diff} />
                  ) : (
                    <p className="plkc">
                      <small>カロリー</small>
                      {d.kcal(ctx)}
                    </p>
                  )}
                  <ul>
                    {d.points(ctx).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="plask">⚠ {d.ask}</p>
                  {d.note && <p className="plwarn">{d.note}</p>}
                  <EvidenceBox ids={d.ids} />
                </article>
              );
            })}
          <p className="plsub">※ 一般的な目安で、診断・治療ではありません。治療中の方は、主治医・管理栄養士の指示を優先してください。</p>
        </div>
      )}
    </section>
  );
}
