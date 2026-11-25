// 定期フォロー：お客様の状況（体重の推移・いまの方法・食事・生活）を入れると、停滞期の判断・具体的な食事・打開策を、自動で作る。
// 根拠の論文は、PubMedの要旨で確認したものだけ。確認していない助言は、「一般的な助言」と、はっきり書く。診断・治療ではありません。
import { getMethod, effectivePct, macrosFor } from "./methods";
import { BREAKERS, suggestBreakers, getBreaker, EVID } from "./breakers";
import { autoTips, getTip } from "./knowledge";
import { foodsFor } from "./foodlist";

export type PlanEv = { label: string; pmid: string; note: string };
export const HABITS: { id: string; label: string }[] = [
  { id: "late", label: "夕食が遅い（21時以降）" },
  { id: "skipam", label: "朝食を抜く" },
  { id: "sweet", label: "間食・甘い飲み物が多い" },
  { id: "eatout", label: "外食・コンビニが多い" },
  { id: "alcohol", label: "お酒をよく飲む" },
  { id: "nolog", label: "食事を記録していない" },
  { id: "sleep", label: "睡眠が短い（6時間未満）" },
  { id: "const", label: "便秘ぎみ" },
  { id: "lowpro", label: "たんぱく質が少ない" },
  { id: "hungry", label: "空腹感が強い" },
  { id: "tired", label: "疲れ・やる気の低下" },
  { id: "lowsteps", label: "歩数・運動が少ない" },
];

export type PlanIn = {
  methodId: string;
  kcal: number;
  tdee: number;
  weeks: number;
  ratePct: number; // 週あたり、体重の%（マイナスが、減っている）
  judgeId: string;
  stallWeeks: number; // 手で入れた、停滞の期間（週）。0＝自動
  stallAuto: number; // 記録から、数えた、停滞の期間（週）
  habits: string[];
  meals: { am: string; noon: string; pm: string; snack: string };
  train: boolean;
  conds: boolean;
  youth: boolean;
  round: number;
  goal?: "diet" | "muscle" | "both";
  weight?: number;
};
export type Dx = { title: string; why: string; action: string; ev: PlanEv[]; general?: boolean };
export type MealRow = { name: string; kcal: number; p: number; f: number; c: number; foodsP: string[]; foodsC: string[]; own: string };
export type PlanOut = {
  judge: { label: string; level: "stall" | "watch" | "ok" | "none"; points: string[]; criteria: string[]; stallWeeks: number };
  method: { id: string; name: string; icon: string; pct: { p: number; f: number; c: number }; g: { p: number; f: number; c: number } | null; kcal: number; steps: string[]; caution: string };
  meals: MealRow[];
  dx: Dx[];
  dxAll: number;
  tricks: { title: string; why: string; action: string; ev: PlanEv[] }[];
  trickTitle: string;
  trainerNotes: string[];
  goal: "diet" | "muscle" | "both";
  breakerIds: string[];
  breakerWhy: string[];
  tipId: string;
  ev: PlanEv[];
};

const KW: [RegExp, string][] = [
  [/お酒|ビール|ワイン|酎ハイ|ハイボール|日本酒|飲み会/, "alcohol"],
  [/ジュース|甘い|お菓子|スイーツ|チョコ|ケーキ|アイス|菓子パン|ラテ/, "sweet"],
  [/外食|コンビニ|ファスト|弁当|ラーメン|牛丼|カレー/, "eatout"],
  [/朝.{0,3}(抜|食べな|なし)|朝食(は)?(抜|食べな|なし)/, "skipam"],
  [/(2[1-9]|夜遅|深夜|夜中).{0,6}(食|夕飯|夕食)|遅い夕/, "late"],
];

const uniq = (a: PlanEv[]) => a.filter((e, i) => a.findIndex((x) => x.pmid === e.pmid) === i);

export function buildPlan(i: PlanIn): PlanOut {
  const text = `${i.meals.am} ${i.meals.noon} ${i.meals.pm} ${i.meals.snack}`;
  const hab = new Set(i.habits);
  KW.forEach(([re, id]) => re.test(text) && hab.add(id));

  // --- 停滞の判断
  const autoStall = ["stall", "up"].includes(i.judgeId) || (i.weeks >= 2 && i.ratePct > -0.15);
  const stallWeeks = i.stallWeeks > 0 ? i.stallWeeks : i.stallAuto >= 2 ? i.stallAuto : autoStall ? Math.max(Math.min(i.weeks, 4), 2) : 0;
  const isStall = i.stallWeeks > 0 || i.stallAuto >= 2 || autoStall;
  const points: string[] = [];
  if (i.weeks < 2) points.push("記録が2週間分に、まだ足りません。体重は、毎日ではなく、週の平均で見ます。");
  else points.push(`直近 ${i.weeks} 週間の、体重の変化は、1週間あたり ${i.ratePct > 0 ? "+" : ""}${Math.round(i.ratePct * 100) / 100}%（体重に対して）です。`);
  if (isStall) {
    points.push(stallWeeks >= 4 ? `停滞は、約${stallWeeks}週間。長く続いているため、「記録の見直し」と「食事の休み（ダイエットブレイク）」を、検討する段階です。` : `停滞の可能性があります（約${stallWeeks}週間）。まず、記録と測り方の見直しから、始めます。`);
  } else if (i.weeks >= 2) points.push("減るペースは、目安の範囲です。いまの方法を、続けてよい状態です。");
  const criteria = [
    "目安（このアプリの基準）：週平均の体重が、2週間以上、ほぼ動かない（週あたり −0.15%より小さい減少）→ 停滞の可能性",
    "1〜2日の増減は、水分・塩分・月経・排便などで、ぶれます。体重の増減は、週の平均で、見ます",
    "減量の初期の体重の減りには、グリコーゲンと水分が含まれます。そのため、初期は、速く減って、あとで、ゆっくりになります",
  ];

  // --- 具体的な食事（いまの方法）
  const m = getMethod(i.methodId || "balance");
  const goal = i.goal ?? "diet";
  const w = i.weight ?? 0;
  let kcalUse = i.kcal;
  let pct = effectivePct(m, null);
  const notesGoal: string[] = [];
  if (goal === "muscle" && i.tdee > 0 && w > 0) {
    // 筋肉をつける：維持のカロリー＋約250kcal（一般的な目安）。たんぱく質は 体重×1.8g、脂質25%、残りは炭水化物
    kcalUse = Math.round((i.tdee + 250) / 10) * 10;
    const pP = Math.min(35, Math.round(((w * 1.8 * 4) / kcalUse) * 100));
    pct = { p: pP, f: 25, c: 100 - pP - 25 };
    notesGoal.push("筋肉をつける設定：維持カロリー＋約250kcal（一般的な目安）、たんぱく質は体重×約1.8g/日。体脂肪が増えすぎる場合は、カロリーを減らす。");
  } else if (goal === "both" && w > 0 && kcalUse > 0) {
    // 減量しながら筋肉を守る：たんぱく質を、体重×1.8g以上に
    const pP = Math.min(40, Math.max(pct.p, Math.round(((w * 1.8 * 4) / kcalUse) * 100)));
    if (pP > pct.p) pct = { p: pP, f: pct.f, c: Math.max(10, 100 - pP - pct.f) };
    notesGoal.push("減量＋筋肉を守る設定：たんぱく質を、体重×約1.8g/日以上に（筋トレをしている人の、減量中は、さらに多く必要になることがあります）。");
  }
  const g = kcalUse > 0 ? macrosFor(kcalUse, pct) : null;
  const fast = m.id === "fast16";
  const split = fast ? [0, 0.4, 0.5, 0.1] : [0.25, 0.3, 0.35, 0.1];
  const names = ["朝食", "昼食", "夕食", "間食"];
  const own = [i.meals.am, i.meals.noon, i.meals.pm, i.meals.snack];
  const meals: MealRow[] = names
    .map((n, k) => {
      const kc = Math.round((kcalUse * split[k]) / 10) * 10;
      const mg = g ? { p: Math.round(g.p * split[k]), f: Math.round(g.f * split[k]), c: Math.round(g.c * split[k]) } : { p: 0, f: 0, c: 0 };
      const GROUPS = {
        p: [/鶏|ささみ|豚|牛/, /さけ|鮭|まぐろ|さば|ツナ|いわし|あじ|えび/, /卵|納豆|豆腐|ヨーグルト|牛乳/],
        c: [/ごはん|米/, /パン|オートミール|うどん|そば|パスタ|もち麦/],
      };
      const pick = (key: "p" | "c", amt: number) => {
        if (amt < 5) return [];
        const all = foodsFor(key, amt).filter((r) => !/乾|粉|ソース|ふりかけ|油|プロテイン|チーズ|するめ/.test(r.name) && r.g >= 20 && r.g <= 350);
        const out: string[] = [];
        for (const re of GROUPS[key]) {
          const r = all.find((x) => re.test(x.name));
          if (r) out.push(`${r.name} ${r.g}g`);
        }
        return out.length ? out : all.slice(0, 2).map((r) => `${r.name} ${r.g}g`);
      };
      return { name: n, kcal: kc, ...mg, foodsP: pick("p", mg.p), foodsC: pick("c", mg.c), own: own[k].trim() };
    })
    .filter((r) => r.kcal > 0);

  // --- 食事・生活の見立て
  const dx: Dx[] = [];
  const A = (d: Dx) => dx.push(d);
  if (hab.has("nolog") || i.habits.includes("nolog"))
    A({ title: "食事の記録がありません", why: "自己申告の食事量は、実際より少なくなりやすいことが、研究で報告されています。記録は、減量と関連しました。", action: "まず3日間、食べたもの（量・時刻）を、写真かメモで、記録する。", ev: [EVID.BURKE, EVID.LICHTMAN] });
  if (hab.has("sleep")) A({ title: "睡眠が短い", why: "睡眠が短いと、体脂肪が減りにくく、筋肉が減りやすく、空腹感も強まる、という少人数の報告があります。", action: "起きる時刻を固定し、夕食を就寝3時間前までに。睡眠6.5時間以上を、めざす。", ev: [EVID.NEDEL] });
  if (hab.has("const")) A({ title: "便通が気になる", why: "食物繊維は、排便の回数を増やすことが、論文で確認されています。", action: "1食に「野菜1品＋豆・海藻・きのこ1品」を足す。水分も、こまめに。", ev: [getTip("fiber")!.known[0]] });
  if (hab.has("lowpro") || (i.train && !hab.has("lowpro")))
    A({ title: i.train ? "筋トレ中のたんぱく質" : "たんぱく質が少ない", why: "筋トレ中の筋量の増加は、体重1kgあたり約1.6g/日で、頭打ちになる傾向が、報告されています。", action: g ? `いまの目安は、1日 たんぱく質${g.p}g。3食と間食に、分けて取る（1回 20〜30g）。` : "3食と間食に、分けて取る（1回 20〜30g）。", ev: [EVID.MORTON] });
  if (hab.has("lowsteps")) A({ title: "歩数・活動量が少ない", why: "1日7,000歩でも、健康への効果が大きいと報告されています。", action: "いまの歩数に、1日+1,000歩から、足す。", ev: [EVID.STEPS] });
  if (hab.has("skipam")) A({ title: "朝食を抜いている", why: "16時間断食（食べる時間を8時間に）は、3食と比べて、体重の減りに差がありませんでした。つまり、抜くかどうかより、トータルの量と、続けやすさが、大切です。", action: "意図して行うなら、食べる時間を決めて続ける。ただ抜いて、夜に食べすぎるなら、朝にたんぱく質を足す。", ev: [EVID.LOWE] });
  if (hab.has("late")) A({ title: "夕食が遅い", why: "夕食が遅いこと自体の効果を、このアプリでは、論文で確認していません。ただ、夜遅い食事は、睡眠の質に影響しやすいとされます。", action: "就寝3時間前までに、夕食を終える。遅くなる日は、量を小さく、消化のよいものに。", ev: [], general: true });
  if (hab.has("sweet")) A({ title: "間食・甘い飲み物", why: "飲み物のカロリーは、満腹感につながりにくく、気づかないうちに、1日の量が増えやすい（一般的な助言）。", action: "無糖の飲み物（水・お茶・無糖コーヒー）に置きかえる。間食は、ナッツ・ヨーグルト・果物を、小さく。", ev: [], general: true });
  if (hab.has("eatout")) A({ title: "外食・コンビニが多い", why: "外食は、量・脂質・塩分が、見えにくくなります（一般的な助言）。", action: "定食型（主食・主菜・副菜）を選ぶ。コンビニは、サラダチキン・卵・納豆・豆腐・サラダを、組み合わせる。", ev: [], general: true });
  if (hab.has("alcohol")) A({ title: "お酒", why: "お酒は、カロリーが高く、睡眠の質や、食べる量にも影響しやすいとされます（一般的な助言。このアプリでは、論文で確認していません）。", action: "飲む日を、週に決める。量を決め、おつまみは、たんぱく質と野菜に。", ev: [], general: true });
  if (hab.has("hungry")) A({ title: "空腹感が強い", why: "食事制限が長いと、空腹・疲れが強まりやすい。休みを入れる方法が、研究されています。", action: "たんぱく質と食物繊維を、各食事に足す。停滞が長いなら、ダイエットブレイクを検討。", ev: [EVID.BREAK6] });
  if (hab.has("tired")) A({ title: "疲れ・やる気の低下", why: "減量が長いと、疲れや、トレーニングの質の低下が出やすい。", action: "睡眠を整え、1〜2週間、維持のカロリーに戻す（ダイエットブレイク）ことを、検討。", ev: [EVID.MATADOR, EVID.BREAK6] });
  if (isStall) A({ title: "停滞期の見立て", why: "体重が止まる原因は、「摂取量が、思ったより多い」「消費が減った」「水分の変動」「測り方」など、複数あります。減量後の代謝の低下は、質の高い研究では、小さい、または、有意でなかった、という整理もあります。", action: "①記録3日 ②測り方（週平均・同じ条件）③睡眠・歩数 → それでも動かなければ、④食事の休み。", ev: [EVID.ADAPT, EVID.LICHTMAN] });
  if (m.id === "keto" || m.risky) A({ title: "いまの方法の注意", why: `${m.name}は、医師の確認が必要な人が多い方法です。`, action: m.caution[0] ?? "持病・服薬のある人は、主治医に確認。", ev: m.evidence.slice(0, 1) });

  const PRI = ["停滞期の見立て", "食事の記録がありません", "睡眠が短い", "筋トレ中のたんぱく質", "たんぱく質が少ない", "便通が気になる", "いまの方法の注意", "朝食を抜いている", "空腹感が強い", "疲れ・やる気の低下", "歩数・活動量が少ない"];
  dx.sort((a, b) => (PRI.indexOf(a.title) < 0 ? 99 : PRI.indexOf(a.title)) - (PRI.indexOf(b.title) < 0 ? 99 : PRI.indexOf(b.title)));
  const dxAll = dx.length;
  dx.splice(6);
  // --- 小さな工夫（痩せる／筋肉をつける）。根拠は、PubMedの要旨で確認したものだけ
  const tricks: { title: string; why: string; action: string; ev: PlanEv[] }[] = [];
  const T = (t: { title: string; why: string; action: string; ev: PlanEv[] }) => tricks.push(t);
  const TE = (id: string, k = 0): PlanEv[] => {
    const e = getTip(id)?.known[k];
    return e ? [e] : [];
  };
  if (goal !== "muscle") {
    if (hab.has("sweet")) T({ title: "甘い飲み物を、無糖に", why: "砂糖入りの飲み物は、1日1杯ふえるごとに、成人で1年に約0.12〜0.22kgの体重増加と関連（メタ分析）。", action: "毎日の甘い飲み物を、1つだけ、水・お茶・無糖コーヒーに変える。", ev: TE("waterpre", 1) });
    T({ title: "食事の前に、水を1杯", why: "低カロリー食に加えて、食前に水500mlを飲んだ群は、12週間で約2kg多く減った（48人の試験）。", action: "主な食事の前に、水かお茶を、コップ1〜2杯（無理のない量で）。", ev: TE("waterpre", 0) });
    T({ title: "ゆっくり食べる", why: "ゆっくり食べるほうが、速く食べるより、食べる量が少なかった（22の実験のメタ分析）。", action: "一口ごとに箸を置く。1日1食から始める。", ev: TE("eatslow") });
    if (hab.has("eatout") || hab.has("sweet")) T({ title: "超加工食品を、1つ置きかえる", why: "超加工食品の食事では、自由に食べると、1日約500kcal多かった（入院試験・20人）。", action: "菓子パン・スナックを、おにぎり・果物・ヨーグルトに置きかえる。", ev: TE("ultraproc") });
  }
  if (goal === "both" && tricks.length > 2) tricks.splice(2);
  if (goal !== "diet") {
    T({ title: "筋トレの量（週のセット数）", why: "週のセット数が多いほど、筋肉のつきが大きい（メタ回帰）。量が同じなら、頻度は好みで選べる（メタ分析）。", action: "1つの筋肉に、週10セット前後を、めやすに。2〜4週ごとに、少しずつ増やす。", ev: [...TE("mvolume", 0), ...TE("mvolume", 1)] });
    T({ title: "たんぱく質と、カロリー", why: "筋量の増加は、体重1kgあたり約1.6g/日で、頭打ちになる傾向。運動する人は、1.4〜2.0g/kgが十分、とされる。", action: g ? `1日 たんぱく質 約${g.p}g。3〜4回に分けて取る。` : "3〜4回に分けて取る。", ev: TE("mfuel", 0).concat(TE("mfuel", 1)) });
    if (goal === "muscle") T({ title: "睡眠と回復", why: "睡眠が短いと、筋肉などの減りが多かった（少人数の研究）。", action: "6.5時間以上。筋トレの量を増やす前に、睡眠と食事を整える。", ev: TE("sleepdiet", 0) });
  }
  const trickTitle = goal === "muscle" ? "筋肉をつけるための、工夫（根拠つき）" : goal === "both" ? "痩せる工夫と、筋肉を守る工夫（根拠つき）" : "痩せるための、小さな工夫（根拠つき）";
  tricks.splice(4);

  // --- トレーナーへ（お客様の資料には、出さない）
  const trainerNotes: string[] = [...notesGoal];
  if (isStall) trainerNotes.push("停滞の判断は、週平均の体重で。1〜2日の増減で、お客様を不安にさせない。まず、記録と測り方の確認から。");
  if (goal !== "muscle" && !isStall) trainerNotes.push("順調なときは、方法を変えない。『いまの方法を続ける』ことを、はっきり伝える。");
  if (goal === "muscle") trainerNotes.push("体重が増えない場合は、食事の量が、足りていない可能性が高い。食事の記録を、先に確認。");
  if (goal === "both") trainerNotes.push("減量中の筋トレは、重量が落ちたら、カロリーが少なすぎる合図。ダイエットブレイクも、検討。");
  if (i.habits.includes("sleep") || hab.has("sleep")) trainerNotes.push("睡眠は、減量にも筋肉にも、影響します。トレーニングや食事の指導より、先に、整えたい項目。");
  if (i.youth) trainerNotes.push("未成年は、断食・糖質制限・減量の目標設定は、避ける。成長を、優先する。");
  if (i.conds) trainerNotes.push("持病・服薬のある方は、食事の変更前に、主治医への確認を、案内する。");

  // --- 打開策
  const sb = suggestBreakers({ stall: isStall, weeksStalled: stallWeeks, gut: hab.has("const"), youth: i.youth, cond: i.conds, noReduce: false });
  const breakerIds = sb.filter((id) => !!getBreaker(id));
  const breakerWhy = breakerIds.map((id) => {
    const b = BREAKERS.find((x) => x.id === id)!;
    return `${b.icon} ${b.name.replace(/（.*$/, "")}：${b.when}`;
  });

  const tip = autoTips({ constipation: hab.has("const"), sleepLow: hab.has("sleep"), stall: isStall, train: i.train, round: i.round, max: 1, goal });

  const tipNotes = getTip(tip.ids[0] ?? "")?.trainer ?? [];
  trainerNotes.push(...tipNotes.map((x) => `（豆知識）${x}`));
  const ev = uniq([...dx.flatMap((d) => d.ev), ...tricks.flatMap((t) => t.ev), ...breakerIds.flatMap((id) => (getBreaker(id)?.evidence ?? []).slice(0, 1)), ...m.evidence.slice(0, 1)]);

  return {
    judge: { label: isStall ? (stallWeeks >= 4 ? "停滞が、長く続いている可能性" : "停滞の可能性") : i.weeks >= 2 ? "目安の範囲" : "判断には、記録が足りません", level: isStall ? "stall" : i.weeks >= 2 ? "ok" : "none", points, criteria, stallWeeks },
    method: { id: m.id, name: goal === "muscle" ? "筋肉をつける食事（増量）" : m.name, icon: goal === "muscle" ? "💪" : m.icon, pct, g, kcal: kcalUse, steps: m.choose.slice(0, 4), caution: m.caution[0] ?? "" },
    meals,
    dx,
    dxAll,
    tricks,
    trickTitle,
    trainerNotes,
    goal,
    breakerIds,
    breakerWhy,
    tipId: tip.ids[0] ?? "",
    ev,
  };
}
