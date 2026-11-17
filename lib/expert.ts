// 基礎情報（年齢・性別・身長・体重・目標・体のデータ・運動）に対する、身体の専門家としての評価と、
// 今後の見通し、そして「減らす」のではなく「増やす（足す）」食事指導を、まとめる。
// 根拠は、論文の要旨（PubMed）・公的な基準で確認できた内容だけ。ほかは「現場の目安」と書く。診断ではない。
import type { BodyOut } from "./body";
import type { EnergyOut } from "./energy";
import type { GoalPlan } from "./goal";
import { INCREASE, type IncItem } from "./swaps";

export type Ref = { label: string; pmid?: string };
export type Rate = "良好" | "注意" | "要対策" | "情報";
export type Eval = { id: string; icon: string; item: string; value: string; criteria: string; rate: Rate; comment: string; ref: Ref | null };
export type Milestone = { label: string; kg: number; diff: number; note: string };
export type AddGroup = { id: string; icon: string; title: string; why: string; now: string; when: string; metric: "p" | "fi" | "ca" | "fe" | "kcal"; unit: string; items: IncItem[]; priority: number };
export type NextAct = { when: string; who: "本人" | "トレーナー"; what: string };
export type Expert = { nextActions: NextAct[]; score: number; headline: string; tone: "ok" | "warn" | "bad"; evals: Eval[]; nowPoints: string[]; milestones: Milestone[]; adds: AddGroup[]; refs: Ref[] };

export type ExpertIn = {
  sex: "f" | "m";
  age: number;
  band: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: "diet" | "muscle" | "both";
  body: BodyOut | null;
  energy: EnergyOut | null;
  gp: GoalPlan | null;
  bmrInput: number;
  strengthDays: number;
  otherMin: number;
  guideMin: number;
  water: number;
  conds: string[];
  cur: { any: boolean; kcal: number; p: number; fi: number; salt: number } | null;
  goalP: number;
  goalFi: number;
  want: number;
  nextDate?: string;
};

const R: Record<string, Ref> = {
  jasso: { label: "日本肥満学会 肥満症診療ガイドライン（BMIの区分）" },
  dri: { label: "厚生労働省 日本人の食事摂取基準（2025年版）" },
  mifflin: { label: "Mifflin 1990 Am J Clin Nutr（基礎代謝の式）", pmid: "2305711" },
  frank: { label: "Frankenfield 2005 J Am Diet Assoc（式の比較）", pmid: "15883556" },
  helms: { label: "Helms 2014 J Int Soc Sports Nutr（減量中の筋肉を守る）", pmid: "24864135" },
  morton: { label: "Morton 2018 Br J Sports Med（たんぱく質）", pmid: "28698222" },
  pontzer: { label: "Pontzer 2021 Science（年代と消費エネルギー）", pmid: "34385400" },
  ding: { label: "Ding 2025 Lancet Public Health（1日の歩数）", pmid: "40713949" },
  grgic: { label: "Grgic 2018 Sports Med（筋トレの回数）", pmid: "29470825" },
  mhlw: { label: "厚生労働省 健康づくりのための身体活動・運動ガイド2023" },
  reds: { label: "IOC consensus 2023 Br J Sports Med（REDs）", pmid: "37752011" },
  hall: { label: "Hall 2011 Lancet（体重の変化はゆっくり）", pmid: "21872751" },
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const pts = { 良好: 100, 注意: 60, 要対策: 25 } as const;

export function expertAssess(i: ExpertIn): Expert {
  const evals: Eval[] = [];
  const refs: Ref[] = [];
  const addRef = (x: Ref | null) => x && !refs.some((y) => y.label === x.label) && refs.push(x);
  const push = (e: Eval) => {
    evals.push(e);
    addRef(e.ref);
  };
  const youth = i.band <= 1 || (i.age > 0 && i.age < 18);
  const b = i.body;

  // 1. 体格（BMI）
  if (b && b.bmi > 0) {
    const bmi = b.bmi;
    const rate: Rate = youth ? "情報" : bmi < 18.5 ? "要対策" : bmi < 25 ? "良好" : bmi < 35 ? "注意" : "要対策";
    push({
      id: "bmi", icon: "⚖️", item: "体格（BMI）", value: `BMI ${bmi}（${b.bmiCat}）`, criteria: "18.5〜25未満が、普通体重", rate,
      comment: youth ? "成長期は、大人のBMIの区分を、そのまま使いません。体重を減らす計算は、しません。" : bmi < 18.5 ? "低体重の範囲です。減量はおすすめしません。食べる量を、しっかり確保して、筋肉をつけます。" : bmi < 25 ? "普通の範囲です。体重の数字より、体脂肪・筋肉・見た目・体力を、整えていきます。" : bmi < 35 ? `BMI25以上は肥満（1度〜）の区分です。標準体重（BMI22）は、約${b.std22}kgです。ゆっくり確実に、体脂肪を減らす計画が役立ちます。` : "BMIが高い範囲です。食事・運動を変える前に、健診の数値を確認し、必要なら医師にも相談しましょう。",
      ref: R.jasso,
    });
    if (i.targetWeight > 0 && b.bmiGoal > 0 && !youth) {
      const t = b.bmiGoal;
      push({
        id: "goalbmi", icon: "🎯", item: "目標体重の妥当性", value: `目標 ${i.targetWeight}kg（BMI ${t}）`, criteria: "目標のBMIが、18.5以上", rate: t < 18.5 ? "要対策" : "良好",
        comment: t < 18.5 ? `目標が低体重の範囲です。目標の見直しをおすすめします（BMI22の体重は約${b.std22}kg）。` : `目標は、無理のない範囲です。${i.gp ? `約${i.gp.weeks}週間（体重の0.5〜1%/週のペース）を、見込みます。` : ""}`,
        ref: R.jasso,
      });
    }
  }

  // 2. 体組成（情報として。判定はしない）
  if (b && (b.fatPct > 0 || b.visceral > 0)) {
    const parts = [b.fatPct > 0 ? `体脂肪率 ${b.fatPct}%（体脂肪 約${b.fatKg}kg・除脂肪量 約${b.ffm}kg）` : "", b.visceral > 0 ? `内臓脂肪レベル ${b.visceral}（${b.visceralCat}）` : ""].filter(Boolean);
    const vis = b.visceral >= 15 ? "要対策" : b.visceral >= 10 ? "注意" : "情報";
    push({
      id: "comp", icon: "🧬", item: "体組成", value: parts.join("／"), criteria: "機器ごとに基準が違うため、同じ条件での変化を見る", rate: vis as Rate,
      comment: b.visceral >= 10 ? "内臓脂肪レベルが高めです（機器による区分）。食事の質と歩く習慣を整え、健診の数値（血圧・血糖・脂質）も確認しましょう。" : "体脂肪の値は、機器・測る時間で変わります。1回の値より、同じ条件で測った変化を、見ていきます。目標は、体脂肪を減らし、筋肉（除脂肪量）を守ることです。",
      ref: null,
    });
  }

  // 3. 基礎代謝
  if (i.height > 0 && i.age >= 18 && i.weight > 0) {
    const pred = Math.round(10 * i.weight + 6.25 * i.height - 5 * i.age + (i.sex === "m" ? 5 : -161));
    if (i.bmrInput > 400) {
      const d = ((i.bmrInput - pred) / pred) * 100;
      push({
        id: "bmr", icon: "🔥", item: "基礎代謝", value: `実測 ${i.bmrInput.toLocaleString()}kcal（推定式 ${pred.toLocaleString()}kcal）`, criteria: "推定式との差が、±10%以内", rate: Math.abs(d) <= 10 ? "良好" : "注意",
        comment: Math.abs(d) <= 10 ? "身長・年齢・体重から出した推定値と、近い値です。計算（目標カロリー）は、実測値を使っています。" : `推定式との差が${d > 0 ? "+" : ""}${Math.round(d)}%あります。筋肉量の違い、または体組成計の誤差が考えられます。計算は実測値を使いますが、同じ条件で測り直して確かめましょう。`,
        ref: R.mifflin,
      });
    } else {
      push({ id: "bmr", icon: "🔥", item: "基礎代謝（推定）", value: `約${pred.toLocaleString()}kcal`, criteria: "身長・年齢・体重から計算（Mifflin-St Jeor式）", rate: "情報", comment: "体組成計の基礎代謝を入れると、より正確になります。この式は、複数の式の比較で、最も信頼できると評価されています。", ref: R.frank });
    }
  }

  // 4. 活動量
  {
    const okS = i.strengthDays >= 1;
    const okM = i.otherMin >= i.guideMin * 0.5;
    push({
      id: "move", icon: "🏃", item: "運動・活動", value: `筋トレ 週${i.strengthDays}回／その他 週${i.otherMin}分`, criteria: `国の目安：週${i.guideMin}分の活動＋筋トレ週2〜3日`, rate: okS && okM ? "良好" : okS || okM ? "注意" : "要対策",
      comment: okS && okM ? "運動の習慣ができています。続けることが、いちばん大切です。" : `${!okS ? "筋トレを、週1回から足しましょう。" : ""}${!okM ? "歩く・動く時間を、まず1日+1,000歩、増やしましょう（1日7,000歩でも、健康への効果が大きいと報告されています）。" : ""}週の総量が同じなら、筋トレの回数による筋力の差は、見られませんでした。続けられる回数でOKです。`,
      ref: R.mhlw,
    });
    addRef(R.ding);
    addRef(R.grgic);
  }

  // 5. 減量ペース
  if (i.gp && i.weight > 0 && !youth) {
    const pct = (i.gp.rate / i.weight) * 100;
    push({
      id: "pace", icon: "⏱", item: i.gp.kind === "lose" ? "減量のペース" : "増量のペース", value: `週 ${r1(i.gp.rate)}kg（体重の ${r1(pct)}%）・約${i.gp.weeks}週`, criteria: "体重の0.5〜1%／週が目安", rate: i.gp.kind === "lose" ? (pct > 1 ? "要対策" : "良好") : "良好",
      comment: pct > 1 ? "週に体重の1%を超えると、筋肉も落ちやすくなります。期間をのばして、ゆっくり進めます。" : "筋肉を守りやすい、ゆっくりしたペースです。体重は、毎日ではなく、週の平均で見ましょう。",
      ref: R.helms,
    });
  }

  // 6. 食事量・たんぱく質
  if (i.energy && i.want > 0) {
    const e = i.energy;
    push({
      id: "kcal", icon: "🍚", item: "1日の食事量（目標）", value: `約${i.want.toLocaleString()}kcal（維持 約${e.tdee.toLocaleString()}kcal）`, criteria: `下限 ${e.floorKcal.toLocaleString()}kcal 以上`, rate: i.want >= e.floorKcal ? "良好" : "注意",
      comment: i.want >= e.floorKcal ? `維持のカロリーから、無理のない幅（最大15%）だけ調整した量です。代謝を守るため、${e.floorKcal.toLocaleString()}kcalを、下回らないようにします。` : "下限を下回っています。食べる量を、少しずつ増やします。",
      ref: R.dri,
    });
    if (e.protein > 0 && i.weight > 0) {
      push({
        id: "protein", icon: "🍗", item: "たんぱく質の目標", value: `${e.protein}g／日（体重1kgあたり ${r1(e.protein / i.weight)}g）`, criteria: "筋トレ中は、約1.6g/kg/日で、効果が頭打ちになる傾向", rate: "良好",
        comment: "毎食、手のひら1枚ぶん（肉・魚・卵・大豆・乳製品）を目安に、少しずつ足していきます。腎臓の病気がある方は、主治医に確認してください。",
        ref: R.morton,
      });
    }
  }

  // 7. 年代
  if (i.age > 0) {
    const t = i.age < 18 ? "成長期" : i.age < 30 ? "20代" : i.age < 50 ? "30〜40代" : i.age < 65 ? "50代" : "65歳以上";
    push({
      id: "age", icon: "🧑", item: "年代の特性", value: `${i.age}歳（${t}）`, criteria: "年代ごとの、からだの特徴", rate: "情報",
      comment: i.age < 18 ? "成長期は、3食をしっかり食べます。減量は、おすすめしません。" : i.age < 60 ? "20〜60歳は、筋肉などを考えに入れると、1日の消費エネルギーは、ほぼ一定です。「代謝が落ちた」と感じたら、筋肉の減少と活動量の低下を、まず見直します。" : "60歳以降は、消費エネルギーが低下します。筋肉を守る（たんぱく質・筋トレ）ことが、特に大切です。",
      ref: R.pontzer,
    });
  }

  // ---- 総合 ----
  const rated = evals.filter((e) => e.rate !== "情報");
  const score = rated.length ? Math.round(rated.reduce((s, e) => s + pts[e.rate as keyof typeof pts], 0) / rated.length) : 0;
  const bad = rated.filter((e) => e.rate === "要対策");
  const warn = rated.filter((e) => e.rate === "注意");
  const tone: Expert["tone"] = bad.length ? "bad" : warn.length ? "warn" : "ok";
  const headline = !rated.length ? "基礎情報を入れると、評価が出ます" : bad.length ? `まず整えたいのは「${bad[0].item}」です。ここを直すと、ほかも進みやすくなります。` : warn.length ? `土台はできています。「${warn[0].item}」を整えると、さらに進みます。` : "基礎情報は、良い状態です。いまの習慣を続け、食事の質を、さらに高めていきましょう。";
  const nowPoints = [
    ...bad.map((e) => `要対策：${e.item}（${e.value}）`),
    ...warn.map((e) => `注意：${e.item}（${e.value}）`),
    ...rated.filter((e) => e.rate === "良好").map((e) => `良好：${e.item}`),
  ];

  // ---- 今後の見通し ----
  const milestones: Milestone[] = [];
  if (i.gp && !youth) {
    const at = (w: number) => i.gp!.pts.find((p) => p.x >= w) ?? i.gp!.pts[i.gp!.pts.length - 1];
    for (const w of [4, 8, 12]) {
      if (w >= i.gp.weeks) break;
      const p = at(w);
      milestones.push({ label: `${w}週後`, kg: r1(p.y), diff: r1(p.y - i.weight), note: w === 4 ? "体重・食事の記録に慣れる時期。たんぱく質と野菜を足す習慣を、定着させる" : w === 8 ? "筋トレと歩数を、少しずつ増やす。停滞したら、記録と睡眠を見直す" : "体重が減った分、必要カロリーも変わる。基本情報を更新して、目標を出し直す" });
    }
    milestones.push({ label: `ゴール（約${i.gp.weeks}週）`, kg: i.targetWeight, diff: r1(i.targetWeight - i.weight), note: "ゴール後は、維持のカロリーに、ゆっくり近づける" });
  }

  // ---- 増やす食事 ----
  const lowP = !!i.cur && i.cur.any && i.cur.p < i.goalP * 0.9;
  const lowFi = !!i.cur && i.cur.any && i.cur.fi < i.goalFi * 0.9;
  const gentle = i.sex === "f" || i.band >= 5 || i.conds.includes("anemia") || i.conds.includes("bone");
  const adds: AddGroup[] = [
    { id: "p", icon: "🍗", title: "たんぱく質を、足す", why: "筋肉・満腹感・代謝のために。毎食に、手のひら1枚ぶんを、そろえる（まず、朝食に1品）", now: i.cur?.any ? `いま 約${Math.round(i.cur.p)}g → 目安 ${i.goalP}g以上` : `目安 ${i.goalP}g以上／日`, when: "朝：卵・納豆・ヨーグルトを足す／昼・夜：肉か魚か大豆を、手のひら1枚", metric: "p", unit: "g", items: INCREASE[0].items, priority: lowP ? 0 : 2 },
    { id: "fi", icon: "🥦", title: "野菜・食物繊維を、足す", why: "おなかの調子・満腹感のために。毎食に、野菜の小鉢を1つ足す。主食は、玄米・麦・全粒粉をまぜる", now: i.cur?.any ? `いま 約${r1(i.cur.fi)}g → 目安 ${i.goalFi}g以上` : `目安 ${i.goalFi}g以上／日`, when: "毎食：野菜の小鉢を1つ／昼・夜：きのこ・海藻を足す", metric: "fi", unit: "g", items: INCREASE[1].items, priority: lowFi ? 0 : 3 },
    { id: "ca", icon: "🥛", title: "カルシウム・鉄を、足す", why: "骨・貧血・疲れのために。乳製品・小松菜・魚・赤身肉・レバーを、週に何回か", now: gentle ? "女性・年齢・体質によって、不足しやすい栄養です" : "週に何回か、意識して足します", when: "間食・朝：牛乳やヨーグルト／夜：小松菜・魚・赤身肉", metric: "ca", unit: "mg", items: INCREASE[2].items, priority: gentle ? 1 : 4 },
    { id: "snack", icon: "🍎", title: "間食を、栄養のあるものに", why: "お菓子を禁止せず、足りない栄養をとれるものを、先に1つ足す", now: "ナッツ・果物・ヨーグルトなどを、1日1回", when: "おやつ：ナッツひとつかみ／果物／ヨーグルト", metric: "p", unit: "g", items: INCREASE[3].items, priority: 5 },
  ];
  adds.sort((a, b) => a.priority - b.priority);

  // ---- 次回までのアクション（いつ・だれが・何を） ----
  const ADD_TEXT: Record<string, string> = {
    p: "朝食に、卵・納豆・ヨーグルトのどれかを、1品足す。昼・夜は、手のひら1枚ぶんの、肉・魚・大豆を",
    fi: "毎食に、野菜の小鉢を1つ足す（冷凍野菜・カット野菜・サラダでもOK）",
    ca: "牛乳かヨーグルトを、1日1つ足す。小松菜・魚・赤身肉も、週に何回か",
    snack: "お菓子の前に、ナッツ・果物・ヨーグルトを、先に1つ足す",
  };
  const nextActions: NextAct[] = [];
  const top = adds[0];
  if (top) nextActions.push({ when: "今週", who: "本人", what: ADD_TEXT[top.id] ?? top.title });
  if (adds[1]) nextActions.push({ when: "今週", who: "本人", what: ADD_TEXT[adds[1].id] ?? adds[1].title });
  const moveEval = evals.find((e) => e.id === "move");
  nextActions.push({ when: "今週", who: "本人", what: i.strengthDays === 0 ? "筋トレを、週1回から始める（全身を、各種目2〜3セット）" : moveEval && moveEval.rate !== "良好" ? "歩く時間を、1日 +1,000歩、増やす" : "いまの運動を、続ける（週の総量が、同じなら、回数は、続けられる範囲でOK）" });
  nextActions.push({ when: "毎日", who: "本人", what: "体重を、朝・トイレのあとに測る（週の平均で見る）。食事は、1日ぶんの写真でもOK" });
  if (bad.some((e) => e.id === "pace")) nextActions.push({ when: "今週", who: "トレーナー", what: "ペースが速いため、期間をのばして、週に体重の0.5〜1%に収める" });
  if (bad.some((e) => e.id === "bmi" || e.id === "goalbmi")) nextActions.push({ when: "今週", who: "トレーナー", what: "体格・目標が、低体重・高い範囲です。目標を見直し、必要なら医師に相談する" });
  nextActions.push({ when: i.nextDate ? `次回（${i.nextDate}）` : "次回（2週間後ごろ）", who: "トレーナー", what: "体重（週の平均）・ウエスト・食事の写真・睡眠を確認。止まっていれば記録を見直し、目標（kcal・PFC）を調整する" });
  nextActions.push({ when: "4週間後", who: "トレーナー", what: "体重が変わったぶん、基本情報を更新して、目標カロリーを出し直す。ペース（体重の0.5〜1%／週）を確認" });
  return { nextActions, score, headline, tone, evals, nowPoints, milestones, adds, refs };
}
