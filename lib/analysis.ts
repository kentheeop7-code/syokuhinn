// お客様の「年齢・体格・体のデータ・食事・運動・持病・いまの状況」から、詳しく分析して、対策を出す。
// 数字の根拠は、論文の要旨（PubMed）・食事摂取基準で確認した内容だけ。そのほかは、一般的な考え方（そう書く）。診断ではない。
import { CONDS } from "./trainerData";
import { TROUBLES } from "./troubles";
import type { BodyOut } from "./body";
import type { EnergyOut } from "./energy";
import type { Tot } from "./meals";

export type Sev = "要対策" | "注意" | "良好";
export type Finding = { id: string; icon: string; title: string; sev: Sev; detail: string; actions: string[]; refs?: { label: string; pmid: string }[] };
export type AgeNote = { title: string; icon: string; points: string[]; refs: { label: string; pmid: string }[] };
export type AnalysisIn = {
  sex: "f" | "m";
  age: number;
  band: number;
  weight: number;
  targetWeight: number;
  body: BodyOut | null;
  energy: EnergyOut | null;
  wantKcal: number;
  cur: Tot | null; // 現状の食事（なければ null）
  goalP: number; // たんぱく質の目安(g)
  goalFi: number;
  goalSalt: number;
  water: number; // 0＝未入力
  strengthDays: number;
  otherMin: number; // 週の、その他の運動（分）
  guideMin: number;
  conds: string[];
  goal: "diet" | "muscle" | "both";
  troubles: string[];
  weeks: number;
  rate: number; // 週の体重の変化(kg)
};
const REF_PONTZER = { label: "Pontzer 2021 Science（二重標識水法・8日〜95歳）", pmid: "34385400" };
const REF_MORTON = { label: "Morton 2018 BJSM（メタ分析）", pmid: "28698222" };
const REF_PROTSAR = { label: "Int J Environ Res Public Health 2022（高齢者のたんぱく質とサルコペニア・メタ分析）", pmid: "35886571" };
const REF_REDS = { label: "IOC consensus 2023 Br J Sports Med（REDs）", pmid: "37752011" };
const REF_HELMS = { label: "Helms 2014 JISSN", pmid: "24864135" };

export function ageNote(age: number, band: number, sex: "f" | "m"): AgeNote | null {
  const a = age > 0 ? age : [13, 16, 24, 40, 57, 70, 80][band] ?? 0;
  if (!a) return null;
  if (a < 18) return { title: "成長期（中学生・高校生）", icon: "🌱", points: ["大人の減量の計算は使いません。3食を、しっかり食べます", "カルシウム（骨）・鉄（女子は、月経で不足しやすい）・たんぱく質を、減らさない", "体重を減らしたいときは、保護者・医師・学校の先生と、いっしょに"], refs: [] };
  if (a < 30) return { title: "20代", icon: "🌟", points: ["朝食抜き・外食・甘い飲み物・夜更かしで、食事が、かたよりやすい時期", "筋肉を、つけやすい時期。筋トレ＋たんぱく質で、将来の土台を", "女性は、月経による鉄不足（疲れ・立ちくらみ）に、注意", "20〜60歳は、筋肉などを考えに入れると、1日のエネルギー消費は、ほぼ一定（Pontzer 2021）。体重が増えるのは、食事量と活動量の影響が、大きい"], refs: [REF_PONTZER] };
  if (a < 50) return { title: "30〜40代", icon: "💼", points: ["仕事・育児で、座る時間が増え、活動量と睡眠が、減りやすい", "「代謝が落ちた」と感じても、筋肉などを考えに入れると、20〜60歳の消費エネルギーは、ほぼ一定（Pontzer 2021）。筋肉の減少と、活動量の低下を、まず疑う", "筋トレ（週1回〜）と、たんぱく質で、筋肉を守る", sex === "f" ? "月経の乱れ・鉄不足・PCOS・甲状腺の病気も、確認" : "健診の数値（血圧・血糖・脂質・肝臓）を、確認"], refs: [REF_PONTZER] };
  if (a < 65) return { title: "50代", icon: "🍂", points: [sex === "f" ? "更年期の前後は、体重・内臓脂肪が増え、骨も弱りやすい時期（一般的な知見。原本は、未確認）。カルシウム・ビタミンD・筋トレ・歩く習慣を" : "内臓脂肪・血圧・血糖・脂質に、注意が必要な時期（一般的な知見）", "筋肉の量が減りやすい。たんぱく質を減らさない", "20〜60歳は、筋肉などを考えに入れると、消費エネルギーは、ほぼ一定。60歳以降に、低下する（Pontzer 2021）", "骨粗鬆症・血圧などの、健診の結果も、確認"], refs: [REF_PONTZER] };
  return { title: "65歳以上", icon: "🌿", points: ["60歳以降は、筋肉などを考えに入れても、1日のエネルギー消費が、低下する（Pontzer 2021）", "サルコペニア（筋肉が減る状態）の人は、たんぱく質の摂取が、少ない傾向があった（観察研究のメタ分析）。たんぱく質を、減らさない", "急な減量は、筋肉・骨を落とします。減量の必要があるかを、主治医に確認", "歩行（1日40分・約6,000歩以上）と、筋トレ（週2〜3日）を、国の目安に"], refs: [REF_PONTZER, REF_PROTSAR] };
}

const order: Record<Sev, number> = { 要対策: 0, 注意: 1, 良好: 2 };
export function analyzeClient(i: AnalysisIn): Finding[] {
  const out: Finding[] = [];
  const push = (f: Finding) => out.push(f);
  const youth = i.band <= 1 || (i.age > 0 && i.age < 18);
  const b = i.body;
  // 体格
  if (b && b.bmi > 0) {
    if (b.bmi < 18.5 && !youth)
      push({ id: "bmi-low", icon: "⚖️", title: `BMI ${b.bmi}（低体重）`, sev: "要対策", detail: "BMI18.5未満は、日本肥満学会の基準で、低体重です。減量は、すすめません。", actions: ["減量は、行わず、食べる量を、しっかり確保する", "たんぱく質・主食・乳製品を、毎食に", "筋トレで、筋肉をつける（食事量とセット）", "月経の乱れ・疲れ・体重の減りが、あるときは、受診"], refs: [REF_REDS] });
    else if (b.bmi >= 25)
      push({ id: "bmi-high", icon: "⚖️", title: `BMI ${b.bmi}（${b.bmiCat}）`, sev: "注意", detail: "BMI25以上は、日本肥満学会の基準で、肥満です。ゆっくり、確実に、体脂肪を減らす計画が、役立ちます。", actions: ["食事の置きかえ（増やす食事）で、無理なく、続ける", "筋肉を守るため、たんぱく質と筋トレを、セットで", "週に体重の0.5〜1%以内のペースで", "健診の数値（血圧・血糖・脂質）を、確認"], refs: [REF_HELMS] });
    else push({ id: "bmi-ok", icon: "⚖️", title: `BMI ${b.bmi}（${b.bmiCat}）`, sev: "良好", detail: i.goal === "diet" ? "体格は、普通の範囲です。見た目・体脂肪を整える目的なら、筋トレ＋食事の質が、中心です。" : "体格は、普通の範囲です。", actions: [] });
    if (b.bmiGoal > 0 && b.bmiGoal < 18.5 && !youth) push({ id: "goal-low", icon: "🎯", title: `ゴールのBMI ${b.bmiGoal}（低体重の範囲）`, sev: "要対策", detail: "目標の体重が、低体重の範囲です。目標の見直しを、おすすめします。", actions: [`BMI22の体重は、約${b.std22}kgです。目標を、見直す`, "体重より、体脂肪・見た目・体力を、目標に"] });
  }
  // ペース
  if (i.rate > 0 && i.weight > 0 && i.targetWeight > 0 && i.targetWeight < i.weight && !youth) {
    const pct = (i.rate / i.weight) * 100;
    if (pct > 1) push({ id: "pace", icon: "⏱", title: `減量のペースが速め（週に体重の${pct.toFixed(1)}%）`, sev: "要対策", detail: "週に体重の1%を超えると、筋肉が落ちやすくなります。", actions: ["期間を、のばして、週に0.5〜1%以内に", "たんぱく質と筋トレで、筋肉を守る"], refs: [REF_HELMS] });
    else push({ id: "pace-ok", icon: "⏱", title: `減量のペース（週に体重の${pct.toFixed(1)}%・約${i.weeks}週間）`, sev: "良好", detail: "筋肉を守りやすい、ゆっくりしたペースです。", actions: [] });
  }
  // エネルギー
  if (i.energy && i.cur?.any) {
    const cur = Math.round(i.cur.kcal / 10) * 10 + 90;
    const e = i.energy;
    if (e.bmr > 0 && cur < e.bmr) push({ id: "energy-low", icon: "🔥", title: `いまの食事（約${cur.toLocaleString()}kcal）が、基礎代謝（約${e.bmr.toLocaleString()}kcal）より少ない`, sev: "要対策", detail: "食べなさすぎが続くと、疲れ・筋肉の減少・月経の乱れなど、不調の原因になり、代謝も落ちやすくなります。", actions: ["減らす前に、まず、食事を、少しずつ増やす（1〜2週ごとに +100〜200kcal）", "たんぱく質・主食（ごはん）を、戻す", `目標は、約${e.target.toLocaleString()}kcal（下限 ${e.floorKcal.toLocaleString()}kcal）`], refs: [REF_REDS] });
    else if (cur < e.floorKcal) push({ id: "energy-floor", icon: "🔥", title: `いまの食事（約${cur.toLocaleString()}kcal）が、下限（${e.floorKcal.toLocaleString()}kcal）を下回る`, sev: "注意", detail: "下限を下回ると、代謝・筋肉・体調に、影響が出やすくなります。", actions: [`目標（約${e.target.toLocaleString()}kcal）まで、少しずつ増やす`], refs: [REF_REDS] });
    else if (cur > e.tdee + 200) push({ id: "energy-high", icon: "🔥", title: `いまの食事（約${cur.toLocaleString()}kcal）が、維持（約${e.tdee.toLocaleString()}kcal）より多い`, sev: "注意", detail: "維持より多い状態が続くと、体重が増えます。", actions: ["置きかえ（増やす食事）で、甘い飲み物・揚げ物・間食を、栄養のあるものに", `目標は、約${e.target.toLocaleString()}kcal`] });
    else if (cur < e.target - 250 && i.goal !== "muscle") push({ id: "energy-under", icon: "🔥", title: `いまの食事（約${cur.toLocaleString()}kcal）が、目標（約${e.target.toLocaleString()}kcal）より、約${(Math.round((e.target - cur) / 10) * 10).toLocaleString()}kcal少ない`, sev: "注意", detail: "食べ足りない状態が続くと、疲れ・筋肉の減少・代謝の低下につながりやすくなります。体重が減らないときは、まず、記録で、実際の量を確かめます。", actions: ["減らす前に、目標の量まで、少しずつ増やす（たんぱく質・主食から）", "3日間、写真で食事を記録して、実際の量を確かめる", `下限は ${e.floorKcal.toLocaleString()}kcal（これ以下には、しない）`], refs: [REF_REDS] });
    else push({ id: "energy-ok", icon: "🔥", title: `いまの食事は、約${cur.toLocaleString()}kcal（維持 約${e.tdee.toLocaleString()}kcal・目標 約${e.target.toLocaleString()}kcal）`, sev: "良好", detail: "大きなずれは、ありません。内容（たんぱく質・野菜）を、整えます。", actions: [] });
  }
  // たんぱく質・食物繊維・塩分
  if (i.cur?.any) {
    const pT = i.weight > 0 && i.goal !== "diet" ? Math.max(i.goalP, Math.round(i.weight * 1.6)) : i.goalP;
    const pr = i.cur.p / (pT || 1);
    if (pr < 0.7) push({ id: "protein", icon: "🍗", title: `たんぱく質が少ない（約${Math.round(i.cur.p)}g／目安 ${pT}g以上）`, sev: "要対策", detail: "筋肉・満腹感・代謝のために、毎食のたんぱく質が、足りません。", actions: ["毎食に、手のひら1枚ぶん（肉・魚・卵・大豆・乳製品）", "まず、朝食に、卵・納豆・ヨーグルトを足す", i.age >= 65 ? "高齢者は、特に、減らさない（サルコペニアの予防）" : "筋トレをする人は、体重1kgあたり 約1.6g/日"], refs: i.age >= 65 || i.band >= 5 ? [REF_PROTSAR, REF_MORTON] : [REF_MORTON] });
    else if (pr < 1) push({ id: "protein", icon: "🍗", title: `たんぱく質が、やや少ない（約${Math.round(i.cur.p)}g／目安 ${pT}g以上）`, sev: "注意", detail: "もう少し、足したいところです。", actions: ["毎食に、たんぱく質を、1品ずつ足す"], refs: [REF_MORTON] });
    else push({ id: "protein-ok", icon: "🍗", title: `たんぱく質は、目安に届いている（約${Math.round(i.cur.p)}g）`, sev: "良好", detail: "筋肉を守る、土台ができています。", actions: [] });
    const fr = i.cur.fi / (i.goalFi || 1);
    if (fr < 0.7) push({ id: "fiber", icon: "🥦", title: `食物繊維が少ない（約${Math.round(i.cur.fi * 10) / 10}g／目安 ${i.goalFi}g以上）`, sev: "注意", detail: "便秘・満腹感・血糖・コレステロールに、関わります。", actions: ["野菜・きのこ・海藻・豆を、毎食に", "ごはんに、麦・玄米を、1/3まぜる", "緑キウイを1日2個（便秘のとき）"], refs: [{ label: "Gearry 2023 Am J Gastroenterol", pmid: "36537785" }] });
    else push({ id: "fiber-ok", icon: "🥦", title: `食物繊維は、${fr >= 1 ? "目安に届いている" : "もう少し"}（約${Math.round(i.cur.fi * 10) / 10}g）`, sev: fr >= 1 ? "良好" : "注意", detail: fr >= 1 ? "おなかの調子・満腹感に、役立ちます。" : "あと少し、足したいところです。", actions: fr >= 1 ? [] : ["野菜の小鉢を、1つ足す"] });
    if (i.cur.salt > i.goalSalt) push({ id: "salt", icon: "🧂", title: `食塩が多め（約${Math.round(i.cur.salt * 10) / 10}g／目標 ${i.goalSalt}g未満）`, sev: i.cur.salt > i.goalSalt * 1.3 ? "要対策" : "注意", detail: "むくみ・血圧に、関わります。", actions: ["汁物は、具を食べて、汁は半分残す", "漬物・加工品・麺の汁・外食を、回数で決める"] });
  }
  // 水分
  if (i.water > 0) push(i.water <= 2 ? { id: "water", icon: "💧", title: "水分が少なめ（1日 コップ3杯以下）", sev: "注意", detail: "便秘・だるさ・むくみに、関わることがあります（公的な基準は、確認できていません。このアプリの目安）。", actions: ["朝起きたら1杯、食事ごとに1杯（水・お茶）"] } : { id: "water-ok", icon: "💧", title: "水分は、とれている", sev: "良好", detail: "", actions: [] });
  // 運動
  const exActions: string[] = [];
  if (i.strengthDays === 0) exActions.push("筋トレを、週1回から始める（全身を、各種目2〜3セット）");
  if (i.otherMin < i.guideMin * 0.5) exActions.push(`歩く・動くを、増やす（国の目安：週${i.guideMin}分。まず、1日 +1,000歩）`);
  if (exActions.length) push({ id: "move", icon: "🏃", title: `運動が少なめ（筋トレ 週${i.strengthDays}回・その他 週${i.otherMin}分）`, sev: i.strengthDays === 0 && i.otherMin < i.guideMin * 0.3 ? "要対策" : "注意", detail: "筋肉を守り、代謝を保つために、動く習慣が、役立ちます。", actions: exActions, refs: [{ label: "Ding 2025 Lancet Public Health（1日7,000歩）", pmid: "40713949" }, { label: "Grgic 2018 Sports Med（筋トレの回数）", pmid: "29470825" }] });
  else if (i.strengthDays > 0) push({ id: "move-ok", icon: "🏃", title: `運動：筋トレ 週${i.strengthDays}回・その他 週${i.otherMin}分`, sev: "良好", detail: "続けることが、いちばん大切です。", actions: [] });
  // 内臓脂肪
  if (b && b.visceral > 0) {
    if (b.visceral >= 15) push({ id: "visceral", icon: "🫀", title: `内臓脂肪レベル ${b.visceral}（高い）`, sev: "要対策", detail: "体組成計の区分で、高めです（機器により、異なります）。", actions: ["食事（甘い飲み物・揚げ物・お酒）と、歩く習慣を、見直す", "健診（血圧・血糖・脂質）を、確認。必要なら、受診"] });
    else if (b.visceral >= 10) push({ id: "visceral", icon: "🫀", title: `内臓脂肪レベル ${b.visceral}（やや高い）`, sev: "注意", detail: "体組成計の区分で、やや高めです。", actions: ["食事の質と、歩数を、整える"] });
    else push({ id: "visceral-ok", icon: "🫀", title: `内臓脂肪レベル ${b.visceral}（標準）`, sev: "良好", detail: "", actions: [] });
  }
  // 持病
  for (const c of CONDS.filter((x) => i.conds.includes(x.id))) {
    push({ id: "cond-" + c.id, icon: "🩺", title: `持病・体質：${c.label}`, sev: "注意", detail: `先に確認：${c.ask}`, actions: [...c.diet.slice(0, 2), ...c.train.slice(0, 1)], refs: [] });
  }
  // 現在の状況（困りごと）
  for (const t of TROUBLES.filter((x) => i.troubles.includes(x.id))) {
    push({ id: "tr-" + t.id, icon: t.icon, title: `いまの状況：${t.label}`, sev: "注意", detail: t.intro, actions: t.steps.slice(0, 3).map((s) => s.replace(/^[①-⑩]\s*/, "")), refs: t.evidence.filter((e) => e.pmid).slice(0, 2).map((e) => ({ label: e.label, pmid: e.pmid })) });
  }
  return out.sort((a, b2) => order[a.sev] - order[b2.sev]);
}