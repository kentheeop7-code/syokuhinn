// 体重の推移と、いまの状況から、「いまの判定・原因・対策・今後のアクション」を出す。
// 根拠は、論文の要旨で確認できた内容だけ（lib/troubles.ts・lib/trainerData.ts と同じ出典）。現場の目安は「現場の目安」と書く。診断・治療ではありません。
export type Ev = { label: string; pmid: string; note: string };
export type Judge = { id: "good" | "slow" | "stall" | "fast" | "up" | "short" | "gain-ok" | "gain-slow" | "keep-ok" | "keep-move"; label: string; tone: "ok" | "warn" | "bad" | "info"; ratePct: number; rateKg: number };
export type TrendIn = {
  w: number[]; // [今日, 1週間前, 2週間前, 3週間前, 4週間前]（0＝未入力）
  kind: "lose" | "gain" | "keep";
  kcalTarget: number;
  avgIntake: number | null; // 昨日・一昨日の平均
  floor: number;
  flags: { sleepLow: boolean; stepsLow: boolean; noTrain: boolean; noLog: boolean; lateSnack: boolean };
  status: string[]; // いまの状況（TROUBLESのid）
};
export type TrendOut = {
  judge: Judge | null;
  slopeText: string;
  causes: { t: string; d: string }[];
  actions: { when: string; what: string }[];
  evidence: Ev[];
  see: string[];
};

const EV = {
  hall: { label: "Hall 2011 Lancet（体重の変化は、ゆっくり。減るにつれて、減りかたが緩やかになる）", pmid: "21872751", note: "同じ食事の変更でも、体重の減りは、時間とともに緩やかになる。体重は、ゆっくり動く" },
  burke: { label: "Burke 2011 J Am Diet Assoc（22研究の系統的レビュー）", pmid: "21185970", note: "食事・体重の記録（セルフモニタリング）と、減量の関連は、一貫して見られた（レビュー自身は、根拠は弱いと述べている）" },
  sacks: { label: "Sacks 2009 NEJM（811人・2年）", pmid: "19246357", note: "食事の割合が違っても、減量は、ほぼ同じ。続けられることが大切" },
  nedel: { label: "Nedeltcheva 2010 Ann Intern Med（10人）", pmid: "20921542", note: "睡眠を5.5時間にすると、同じ食事でも、体脂肪の減少が少なく、筋肉などの減少が多かった" },
  matador: { label: "MATADOR 2018 Int J Obes（肥満の男性51人）", pmid: "28925405", note: "2週間の減量と2週間の維持をくり返した群は、続けて減量した群より、体脂肪が多く減り、代謝の低下も小さかった（短期・男性）" },
  adapt: { label: "Br J Nutr 2022（系統的レビュー：33研究）", pmid: "33762040", note: "減量後の代謝の低下は、質の高い研究では小さい、または有意でなかった" },
  helms: { label: "Helms 2014 J Int Soc Sports Nutr", pmid: "24864135", note: "減量中の筋肉を守る：ゆっくりした減量（体重の0.5〜1%/週）とたんぱく質" },
  morton: { label: "Morton 2018 Br J Sports Med（メタ分析）", pmid: "28698222", note: "筋トレ中の筋力・筋量の増加は、体重1kgあたり約1.6g/日のたんぱく質で頭打ちになる傾向" },
  reds: { label: "IOC consensus 2023 Br J Sports Med（REDs）", pmid: "37752011", note: "食事（エネルギー）が足りない状態が続くと、健康と運動能力に悪い影響が出る（選手の研究）" },
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

// 最小二乗法で、1週間あたりの変化（kg/週）を出す。2点以上・期間1週間以上のときだけ。
function slope(w: number[]): number | null {
  const pts = w.map((v, i) => ({ x: -i, y: v })).filter((p) => p.y > 0);
  if (pts.length < 2) return null;
  const span = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  if (span < 1) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const num = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  return den ? num / den : null;
}

export function analyzeTrend(i: TrendIn): TrendOut {
  const out: TrendOut = { judge: null, slopeText: "", causes: [], actions: [], evidence: [], see: [] };
  const now = i.w[0];
  const sl = slope(i.w);
  const addEv = (...e: Ev[]) => e.forEach((x) => !out.evidence.some((y) => y.pmid === x.pmid && y.label === x.label) && out.evidence.push(x));
  const diffKcal = i.avgIntake !== null && i.kcalTarget ? i.avgIntake - i.kcalTarget : null;
  const over = diffKcal !== null && diffKcal > i.kcalTarget * 0.1;
  const under = diffKcal !== null && diffKcal < -i.kcalTarget * 0.1;
  const belowFloor = i.avgIntake !== null && i.floor > 0 && i.avgIntake < i.floor - 50;

  if (sl !== null && now > 0) {
    const pct = (sl / now) * 100; // 負＝減っている
    const kgw = sl;
    out.slopeText = `体重の変化：週に ${kgw > 0 ? "+" : ""}${r2(kgw)}kg（体重の ${pct > 0 ? "+" : ""}${r2(pct)}%／週）`;
    let j: Judge;
    if (i.kind === "lose") {
      if (pct <= -1.0) j = { id: "fast", label: "減るペースが、速すぎます", tone: "warn", ratePct: pct, rateKg: kgw };
      else if (pct <= -0.5) j = { id: "good", label: "順調です（体重の0.5〜1%／週）", tone: "ok", ratePct: pct, rateKg: kgw };
      else if (pct <= -0.15) j = { id: "slow", label: "ゆっくり減っています", tone: "info", ratePct: pct, rateKg: kgw };
      else if (pct < 0.15) j = { id: "stall", label: "体重が、止まっています（停滞）", tone: "warn", ratePct: pct, rateKg: kgw };
      else j = { id: "up", label: "体重が、増えています", tone: "bad", ratePct: pct, rateKg: kgw };
    } else if (i.kind === "gain") {
      if (pct >= 0.5) j = { id: "gain-ok", label: "増えるペースが、速めです", tone: "warn", ratePct: pct, rateKg: kgw };
      else if (pct >= 0.1) j = { id: "gain-ok", label: "順調です（ゆっくり増えています）", tone: "ok", ratePct: pct, rateKg: kgw };
      else j = { id: "gain-slow", label: "増えていません", tone: "info", ratePct: pct, rateKg: kgw };
    } else {
      if (Math.abs(pct) < 0.3) j = { id: "keep-ok", label: "維持できています", tone: "ok", ratePct: pct, rateKg: kgw };
      else j = { id: "keep-move", label: pct > 0 ? "少しずつ増えています" : "少しずつ減っています", tone: "warn", ratePct: pct, rateKg: kgw };
    }
    out.judge = j;

    // 原因（入力から言えることだけ）
    if (j.id === "stall" || j.id === "up" || j.id === "slow") {
      if (over) out.causes.push({ t: "食べる量が、目標より多め", d: `昨日・一昨日の平均は、目標より約${Math.round(diffKcal! / 10) * 10}kcal多めです。体重が動かない原因として、いちばん多いのは、実際の量が、思っているより多いことです（記録で確かめる）。` });
      if (i.avgIntake === null) out.causes.push({ t: "食事の量が、まだ確かめられていない", d: "昨日・一昨日の食事を入れて、目標との差を確かめましょう。盛りの量・間食・飲み物・調味料は、見落としやすいところです。" });
      else if (!over && !under) out.causes.push({ t: "記録と実際の量の、ずれ", d: "入力した食事は目標に近いのに体重が動かないときは、盛りの量・間食・飲み物・調味料の見落としがないか、確かめましょう。" });
      if (i.flags.sleepLow) out.causes.push({ t: "睡眠が短い（6時間未満）", d: "睡眠が短いと、減量の効果が下がり、筋肉が落ちやすいと報告されています。" });
      if (i.flags.stepsLow) out.causes.push({ t: "歩く量が、少なめ", d: "食事を減らさずに、消費を足せる方法です（現場の目安：1日 +1,000〜2,000歩）。" });
      if (i.flags.noTrain) out.causes.push({ t: "筋トレをしていない", d: "筋肉が減ると、代謝・見た目ともに不利です。週1回からでも続けます。" });
      if (i.flags.lateSnack) out.causes.push({ t: "夜食・間食が多い", d: "夜の食事・間食は、量を見落としやすい時間帯です。" });
      if (j.id === "stall") out.causes.push({ t: "水分・月経周期・塩分による、体重のゆれ", d: "体重は、水分で日々ゆれます。月経前は、むくみで増えやすい時期です。週の平均で比べます。" });
      addEv(EV.burke, EV.nedel, EV.hall);
    }
    if (j.id === "fast") {
      out.causes.push({ t: "食事を、減らしすぎている可能性", d: "週に体重の1%を超えて減ると、筋肉も落ちやすくなります。" });
      if (belowFloor) out.causes.push({ t: "食べる量が、下限を下回っている", d: `昨日・一昨日の平均は約${Math.round(i.avgIntake! / 10) * 10}kcalで、下限（${i.floor.toLocaleString()}kcal）を下回っています。代謝・筋肉・月経・疲れに影響します。` });
      addEv(EV.helms, EV.reds);
    }
    if (j.id === "up") addEv(EV.burke, EV.hall);

    // アクション（今週 → 2週間後 → 4週間後）
    if (j.id === "good") {
      out.actions.push({ when: "今週", what: "いまの食事・運動を、そのまま続ける。体重は、毎朝同じ条件で測り、週の平均で見る。" });
      out.actions.push({ when: "2週間後", what: "週の平均で、また判定する。体重の0.5〜1%／週に収まっていれば、変えない。" });
      out.actions.push({ when: "4週間後", what: "体重が減ったぶん、必要なカロリーも少し変わる。基本情報の体重を直して、目標カロリーを出し直す。" });
      addEv(EV.helms, EV.hall);
    } else if (j.id === "slow") {
      out.actions.push({ when: "今週", what: "昨日・一昨日の食事を入れて、目標との差を確かめる。差が小さければ、そのまま。" });
      out.actions.push({ when: "2週間後", what: "週の平均の減りが、まだ週0.15%未満なら、「停滞」と同じ対処へ。" });
      addEv(EV.hall);
    } else if (j.id === "stall" || j.id === "up") {
      out.actions.push({ when: "今週", what: "① 昨日・一昨日に続けて、3日以上、食事を入れる（写真でも、おおよそでもよい）。盛り・間食・飲み物を確かめる。" });
      out.actions.push({ when: "今週", what: "② 睡眠6時間以上・歩数 +1,000〜2,000歩・筋トレ週1回、のうち、できていないものを1つだけ足す。" });
      out.actions.push({ when: "2週間後", what: "週の平均で、2週間つづけて動かないときだけ、食事を100〜200kcal調整する（現場の目安。研究の数値ではありません）。" });
      out.actions.push({ when: "4週間後", what: "4週間以上、停滞が続くときは、1〜2週間、維持のカロリーまで戻す「休み期間」を入れる（MATADORは、肥満の男性の短期研究。一般の人・女性での確認は、限られています）。" });
      addEv(EV.matador, EV.adapt, EV.morton);
    } else if (j.id === "fast") {
      out.actions.push({ when: "今週", what: "食事を、100〜200kcal戻す（現場の目安）。たんぱく質は、毎食、手のひら1枚ぶんを入れる。" });
      out.actions.push({ when: "2週間後", what: "週の減りが、体重の0.5〜1%に入ったかを確かめる。疲れ・月経・筋トレの重さも見る。" });
      addEv(EV.helms, EV.morton);
    } else if (j.id === "gain-slow") {
      out.actions.push({ when: "今週", what: "目標カロリー（維持＋約250kcal）に届いているか、昨日・一昨日の食事で確かめる。" });
      out.actions.push({ when: "2週間後", what: "週の平均で増えていなければ、1日 +100〜200kcalを足す（現場の目安）。筋トレとたんぱく質（体重×約1.6g）も続ける。" });
      addEv(EV.morton);
    } else if (j.id === "keep-move" || j.id === "gain-ok" || j.id === "keep-ok") {
      out.actions.push({ when: "今週", what: "週の平均で、もう一度、確かめる。むくみ・月経前でないかも、見る。" });
      out.actions.push({ when: "2週間後", what: "目標からずれているときは、昨日・一昨日の食事で、目標との差を確かめる。" });
    }
  } else {
    out.slopeText = "体重を、2回以上（1週間以上の間をあけて）入れると、増減のペースを判定します。";
    out.actions.push({ when: "今日", what: "いまの体重と、1週間前（わかれば、2〜4週間前も）の体重を入れる。" });
    out.actions.push({ when: "毎日", what: "体重は、朝、トイレのあとに、同じ条件で測る。週の平均で見る（水分で日々ゆれるため）。" });
    addEv(EV.burke);
  }

  // 食べた量が、体重の判定と、別に、気になるとき
  if (belowFloor && !out.causes.some((c) => c.t.includes("下限"))) {
    out.causes.push({ t: "食べる量が、下限を下回っている", d: `昨日・一昨日の平均は約${Math.round(i.avgIntake! / 10) * 10}kcal。下限（${i.floor.toLocaleString()}kcal）を下回っています。続けると、疲れ・筋肉の減少・月経の乱れにつながります。` });
    addEv(EV.reds);
  }
  if (under && out.judge && (out.judge.id === "stall" || out.judge.id === "up")) {
    out.causes.push({ t: "食べた量は、目標より少なめに見える", d: "記録より、実際は多く食べている可能性があります。飲み物・間食・調味料を、もう一度、確かめましょう。" });
  }
  if (i.flags.noLog) out.causes.push({ t: "食事を、記録できていない", d: "記録は、写真1枚でも大丈夫です。まず、夜の食事だけでも。" });

  // 「いまの状況」で選んだ項目
  for (const s of i.status) if (s === "plateau") addEv(EV.adapt, EV.matador, EV.nedel);
  if (i.status.includes("muscleloss")) addEv(EV.morton, EV.helms);
  if (i.status.includes("fatigue") || i.status.includes("menstrual")) addEv(EV.reds);
  if (i.status.includes("sleep") || i.status.includes("hunger")) addEv(EV.nedel);

  // 受診の目安（共通）
  out.see = ["1か月で、体重の5%以上、急に減った（増えた）", "強い疲れ・立ちくらみ・息切れ・動悸が続く", "月経が3か月以上止まっている", "食べることが、こわい・止められない（摂食障害の可能性）", "持病・服薬のある方は、食事を変える前に、主治医・管理栄養士へ"];
  return out;
}
