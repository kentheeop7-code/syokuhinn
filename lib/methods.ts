// 食事の方法（5種類）：カロリーと、PFC（たんぱく質・脂質・炭水化物）のバランスを、方法ごとに、自動で出す。
// 根拠は、論文の要旨（PubMed）で、数字と結論を確認した内容だけ。ケトジェニックは、安全面の注意が、大きい。
import type { St } from "./meals";

export type Pct = { p: number; f: number; c: number };
export type MethodId = "balance" | "lowfat" | "lowcarb" | "highpro" | "keto";
export type Method = {
  id: MethodId;
  name: string;
  icon: string;
  pct: Pct;
  tag: string;
  summary: string;
  choose: string[];
  avoid: string[];
  suits: string;
  caution: string[];
  level: "強い" | "中くらい" | "弱い";
  evidence: { label: string; pmid: string; note: string }[];
  example: { name: string; ids: string[]; ext: Record<string, number>; big?: string[]; note: string };
  risky?: boolean; // 医師の管理が必要な人が多い
};

export const METHODS: Method[] = [
  {
    id: "balance",
    name: "バランス型（国の基準）",
    icon: "⚖️",
    pct: { p: 17, f: 25, c: 58 },
    tag: "まず、これから",
    summary: "主食・主菜・副菜を、そろえる、いちばん続けやすい方法。国の目標量の範囲に入ります。",
    choose: ["毎食、主食・主菜（肉・魚・卵・大豆）・副菜（野菜）を、そろえる", "主食は、茶碗1杯ぐらいを、毎食に", "魚と大豆を、週に何回か"],
    avoid: ["特定の食品を、完全に禁止しない", "揚げ物・甘い飲み物は、回数を決める"],
    suits: "ほとんどの人（初めての人・長く続けたい人・持病で主治医の食事療法がある人の土台）",
    caution: ["持病・服薬のある人は、主治医・管理栄養士の指示を優先"],
    level: "強い",
    evidence: [
      { label: "Sacks 2009 NEJM", pmid: "19246357", note: "脂質・たんぱく質・炭水化物の割合が違っても、2年後の減量は、ほぼ同じ。続けることが、大切" },
      { label: "Ge 2020 BMJ", pmid: "32238384", note: "6か月の減量は、食事の割合による差が、小さかった" },
    ],
    example: { name: "ハンバーグ定食の日", ids: ["am-wa", "no-x-hamburg", "pm-fish", "sn-x-nutsfruit"], ext: { "am:fruit": 1, "noon:salad": 1, "pm:veg": 1, "pm:salad": 1 }, note: "たんぱく質・脂質・炭水化物が、国の目標量の範囲に近い" },
  },
  {
    id: "lowfat",
    name: "ローファット（低脂質）",
    icon: "🥗",
    pct: { p: 18, f: 20, c: 62 },
    tag: "脂質を控える",
    summary: "揚げ物・脂身・バターなどの脂質を減らし、主食・野菜・魚・鶏むね・豆腐で、満たす方法。",
    choose: ["魚・鶏むね・ささみ・豆腐・卵白を、主菜に", "主食は、玄米・もち麦・いも類も", "野菜・きのこ・海藻を、たっぷり", "調理は、焼く・蒸す・煮る"],
    avoid: ["揚げ物・天ぷら・脂身の多い肉", "バター・生クリーム・洋菓子・スナック", "ドレッシング・マヨネーズを、かけすぎない"],
    suits: "脂質をとりすぎている人・外食や揚げ物が多い人・ごはんが好きな人",
    caution: ["脂質を、極端に減らさない（国の目標量は、エネルギーの20〜30%）。魚・ナッツなどの、よい脂質は、少し残す", "食べる量（カロリー）は、守る"],
    level: "中くらい",
    evidence: [
      { label: "Ge 2020 BMJ", pmid: "32238384", note: "低脂質食は、低糖質食と、6か月の減量が、ほぼ同じ（4.4kgと4.6kg）。12か月では、減量は小さくなった" },
      { label: "Clin Nutr ESPEN 2024（ネットワークメタ分析）", pmid: "39255914", note: "低脂質食も、体重を、有意に減らした" },
    ],
    example: { name: "低脂質の日（うどん・鍋・おにぎり）", ids: ["am-x-onigiri", "no-x-udon", "pm-nabe", "sn-fruit"], ext: { "am:fruit": 1, "noon:veg": 1, "pm:rice": 1, "noon:soy": 1 }, note: "脂質を、20%前後に" },
  },
  {
    id: "lowcarb",
    name: "ローカーボ（ゆるい糖質制限）",
    icon: "🍖",
    pct: { p: 25, f: 35, c: 40 },
    tag: "主食を、半分に",
    summary: "ごはん・パン・麺を、ふだんの半分〜2/3にして、その分、たんぱく質・野菜・よい脂質を増やす方法。",
    choose: ["主食は、1食 茶碗半分〜2/3杯", "肉・魚・卵・大豆を、毎食しっかり", "野菜・きのこ・海藻で、食物繊維を、確保", "ナッツ・オリーブ油・魚の脂で、よい脂質を"],
    avoid: ["甘い飲み物・お菓子・ジュース", "主食を、ほぼゼロにしない（食物繊維・ビタミンが、不足しやすい）"],
    suits: "ごはん・パン・麺・甘いものが、多い人。食後に、眠くなりやすい人",
    caution: ["糖尿病の薬（インスリンなど）を使っている人は、低血糖に注意。必ず、主治医に", "腎臓の病気がある人は、たんぱく質の量を、主治医に確認", "LDLコレステロールが、高い人は、肉の脂身・バターを、とりすぎない"],
    level: "中くらい",
    evidence: [
      { label: "Ge 2020 BMJ", pmid: "32238384", note: "低糖質食は、低脂質食と、6か月の減量が、ほぼ同じ（4.6kgと4.4kg）。LDLコレステロールの低下は、低糖質食のほうが、小さかった" },
      { label: "Clin Nutr ESPEN 2024（7試験・1,004人）", pmid: "39255914", note: "低糖質食は、減量・体脂肪の減少で、上位にランク（ただし、研究の数が少ない）" },
    ],
    example: { name: "ローカーボの日（サラダボウル・焼肉）", ids: ["no-x-bowl", "pm-x-yakiniku-lean", "sn-x-nutsfruit"], ext: { "am:egg": 2, "am:soy": 1, "am:salad": 1 }, note: "炭水化物を、40%前後に" },
  },
  {
    id: "highpro",
    name: "高たんぱく（筋肉を守る）",
    icon: "💪",
    pct: { p: 28, f: 27, c: 45 },
    tag: "筋トレ向け",
    summary: "たんぱく質を、体重1kgあたり 約1.6〜2.0gにして、減量中も、筋肉を守る方法。",
    choose: ["毎食に、手のひら1〜1.5枚ぶんの、たんぱく質（肉・魚・卵・大豆・乳製品）", "筋トレの前後に、乳製品・卵・プロテインも", "野菜・食物繊維は、落とさない"],
    avoid: ["たんぱく質だけに、偏らない（主食・野菜も、必要）", "プロテインで、食事を、置きかえすぎない"],
    suits: "筋トレをしている人・減量中に筋肉を守りたい人・食が細くなりやすい人",
    caution: ["腎臓の病気がある人は、たんぱく質の量を、必ず、主治医に", "食べる量（カロリー）が、足りないと、効果が出にくい"],
    level: "強い",
    evidence: [
      { label: "Morton 2018 BJSM（メタ分析）", pmid: "28698222", note: "筋トレ中の、筋力・筋量の伸びは、体重1kgあたり 約1.6g/日で、頭打ちになる傾向" },
      { label: "ISSN 2017", pmid: "28642676", note: "運動する人は、1日 1.4〜2.0g/kgが、推奨" },
    ],
    example: { name: "高たんぱくの日（卵・サラダボウル・ステーキ）", ids: ["am-yo", "no-x-bowl", "pm-x-steak", "sn-x-protein"], ext: { "am:egg": 2, "am:soy": 1, "pm:salad": 1 }, note: "たんぱく質を、25%以上に" },
  },
  {
    id: "keto",
    name: "ケトジェニック（超低糖質）",
    icon: "🥑",
    pct: { p: 20, f: 70, c: 10 },
    tag: "要・医師の確認",
    summary: "糖質を、1日20〜50g以下にし、脂質で、エネルギーをとる方法。国の目標量の範囲の外で、安全面の注意が、大きい方法です。",
    choose: ["糖質（ごはん・パン・麺・いも・砂糖）を、ほぼ、とらない", "肉・魚・卵・チーズ・ナッツ・オリーブ油・アボカド", "葉物の野菜で、食物繊維を、確保", "水分・塩分（みそ汁・スープ）を、しっかり"],
    avoid: ["果物・ジュース・お菓子・ごはん・麺", "期間を決めずに、続けること"],
    suits: "医師の管理のもとで行う人。短い期間に限る（トレーナーだけの判断で、すすめない）",
    caution: [
      "糖尿病の治療薬（インスリン・SGLT2阻害薬など）を使っている人、1型糖尿病、妊娠中・授乳中、腎臓・肝臓・膵臓の病気がある人、脂質異常症（LDLが高い）、摂食障害の人、未成年は、行わない（一般的な医学的注意。原本は、未確認）",
      "副作用が、よく出る：便秘・だるさ・吐き気・頭痛など。厳しいほど、多い",
      "長期（数年）の安全性は、確認されていません。LDLコレステロールが、上がることがあります",
    ],
    level: "弱い",
    risky: true,
    evidence: [
      { label: "Bueno 2013 Br J Nutr（13試験・12か月以上）", pmid: "23651522", note: "超低糖質ケトジェニック食（糖質50g/日以下）は、低脂質食より、長期の体重が 0.91kg 多く減った。中性脂肪・HDLは、改善。一方、LDLコレステロールは、上がった（+0.12mmol/L）" },
      { label: "BMC Nutr 2026（36研究の系統的整理）", pmid: "41715236", note: "ケトジェニック食では、参加者の43%に、何らかの有害事象。消化器症状が40%（便秘24%）。厳しい食事ほど、多く、重かった" },
    ],
    example: { name: "ケトジェニックの日（卵・魚・肉・サラダ）", ids: ["sn-x-nutsfruit"], ext: { "am:egg": 3, "am:soy": 1, "noon:fish": 1, "noon:egg": 1, "noon:salad": 1, "pm:meat": 2, "pm:salad": 1, "pm:veg": 1 }, note: "実際は、油・チーズ・ナッツ・アボカドを足して、脂質を70%に近づける。カロリーが、足りなくなりやすい" },
  },
];

export const getMethod = (id: string) => METHODS.find((m) => m.id === id) ?? METHODS[0];
export const exampleSt = (m: Method): St => ({ date: "", size: Object.fromEntries(m.example.ids.map((i) => [i, (m.example.big ?? []).includes(i) ? 2 : 1])), ext: m.example.ext });

// PFCの比率（%）→ 1日のグラム。合計が100でなくても、比率で、割りふる。
export function macrosFor(kcal: number, pct: Pct) {
  const sum = pct.p + pct.f + pct.c || 100;
  return { p: Math.round((kcal * (pct.p / sum)) / 4), f: Math.round((kcal * (pct.f / sum)) / 9), c: Math.round((kcal * (pct.c / sum)) / 4) };
}
// トレーナーが、数字を直した時は、それを使う。なければ、方法の初期値。
export function effectivePct(m: Method, custom: { p: string; f: string; c: string } | null | undefined): Pct {
  if (custom) {
    const p = parseFloat(custom.p);
    const f = parseFloat(custom.f);
    const c = parseFloat(custom.c);
    if ([p, f, c].every((x) => !isNaN(x) && x >= 0) && p + f + c > 0) return { p, f, c };
  }
  return m.pct;
}
// 国の目標量（食事摂取基準：たんぱく質13〜20%・脂質20〜30%・炭水化物50〜65%。年齢で少し変わる）の範囲か
export const inNational = (pct: Pct) => {
  const s = pct.p + pct.f + pct.c || 100;
  const p = (pct.p / s) * 100;
  const f = (pct.f / s) * 100;
  const c = (pct.c / s) * 100;
  return p >= 13 && p <= 20 && f >= 20 && f <= 30 && c >= 50 && c <= 65;
};
// 方法ごとに、使ってよいか（医師の確認が、必要な人には、すすめない）
export function methodBlocked(m: Method, opts: { hasConds: boolean; youth: boolean }): string {
  if (!m.risky) return "";
  if (opts.youth) return "中学生・高校生・未成年には、行いません";
  if (opts.hasConds) return "持病・体質を選んでいるため、主治医の確認が、先に、必要です";
  return "";
}