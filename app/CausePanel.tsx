"use client";

// 「いまの悩み」と「いまの食事」から、食事のどこが原因かを、数字つきで予測する。診断ではなく、目安。
export type CIn = {
  a: Record<string, number>;
  kcalDiff: number; // 必要量との差（%）
  fatPct: number;
  carbPct: number;
  p: number;
  fi: number;
  salt: number;
  feMg: number;
  ca: number;
  vegG: number;
  need: { protein: number; fiber: number; salt: number; fe: number; ca: number };
  isYouth: boolean;
};

export const COMPLAINTS: { id: string; icon: string; label: string }[] = [
  { id: "weight", icon: "⚖️", label: "体重が増えた・減らない" },
  { id: "tired", icon: "😮‍💨", label: "疲れやすい・だるい" },
  { id: "const", icon: "🚽", label: "便秘ぎみ" },
  { id: "swell", icon: "🦵", label: "むくみ・血圧" },
  { id: "skin", icon: "✨", label: "肌荒れ・口内炎" },
  { id: "sleep", icon: "😴", label: "眠りが浅い" },
  { id: "sweet", icon: "🍫", label: "甘いものがやめられない" },
  { id: "cold", icon: "🥶", label: "冷え" },
];

type Fx = { sev: number; name: string; num: string; why: string; act: string; dk?: number };
const lin = (x: number) => Math.max(0, Math.min(1, x));

function factors(i: CIn): Record<string, Fx> {
  const a = i.a;
  const n = (k: string) => a[k] ?? 0;
  const sweets = n("cake") + n("snack") + n("sugar");
  const rich = n("fried") + n("stir") + n("instant") + n("out");
  const sweetKcal = n("cake") > 0 ? 290 : n("snack") > 0 ? 180 : 100;
  const pl = i.p < i.need.protein * 0.9 ? lin(1 - i.p / i.need.protein + 0.3) : 0;
  return {
    kcalLow: {
      sev: i.kcalDiff < -15 ? lin((-i.kcalDiff - 15) / 25 + 0.4) : 0,
      name: "食べる量が足りない",
      num: `必要量より約${Math.round(-i.kcalDiff)}%少ない`,
      why: "エネルギーが足りないと、疲れ・冷え・集中力の低下・甘いものへの欲求が出やすくなります。",
      act: "主食（ごはん・パン）を減らさず、間食にヨーグルト・バナナ・チーズを足す。",
    },
    kcalHigh: {
      sev: i.kcalDiff > 15 ? lin((i.kcalDiff - 15) / 25 + 0.4) : 0,
      name: "食べる量が多め",
      num: `必要量より約${Math.round(i.kcalDiff)}%多い`,
      why: "使うエネルギーより多く食べる状態が続くと、体重が増えやすくなります。",
      act: "ごはんを、茶碗1杯→2/3杯に（約−85kcal）。",
      dk: 85,
    },
    protein: {
      sev: pl,
      name: "たんぱく質が足りない",
      num: `約${Math.round(i.p)}g（目安${i.need.protein}g以上）`,
      why: "筋肉・肌・髪・血液の材料です。不足すると、疲れやすさ・肌荒れ・冷え・食欲の乱れにつながります。",
      act: "毎食に、卵1個・納豆1パック・手のひらサイズの肉か魚のどれかを足す。",
    },
    fat: {
      sev: i.fatPct > 0.3 ? lin((i.fatPct - 0.3) / 0.1 + 0.4) : 0,
      name: "脂質が多め",
      num: `エネルギーの約${Math.round(i.fatPct * 100)}%（目安20〜30%）`,
      why: "脂質は1gで9kcalと高エネルギーで、体重増加や肌のベタつきに関わります。",
      act: "揚げ物・炒め物を1回、焼く・蒸す・ゆでるに変える（約−90kcal）。",
      dk: 90,
    },
    carb: {
      sev: i.carbPct > 0.65 ? lin((i.carbPct - 0.65) / 0.1 + 0.4) : 0,
      name: "炭水化物が多め",
      num: `エネルギーの約${Math.round(i.carbPct * 100)}%（目安50〜65%）`,
      why: "ごはん・麺・甘いものが多いと、エネルギー過多や血糖の上下につながります。",
      act: "ごはんを2/3杯にして、野菜とたんぱく質を先に食べる（約−85kcal）。",
      dk: 85,
    },
    salt: {
      sev: i.salt >= i.need.salt ? lin((i.salt / i.need.salt - 1) / 0.5 + 0.4) : 0,
      name: "塩分が多め",
      num: `約${(Math.round(i.salt * 10) / 10).toFixed(1)}g（目安${i.need.salt}g未満）`,
      why: "塩分が多いと、体に水分がたまり、むくみや血圧の上昇につながります。",
      act: "麺の汁を残す・漬物か加工品を1つ減らす。",
    },
    fiber: {
      sev: i.fi < i.need.fiber ? lin(1 - i.fi / i.need.fiber + 0.2) : 0,
      name: "食物繊維が足りない",
      num: `約${Math.round(i.fi)}g（目安${i.need.fiber}g以上）`,
      why: "便のかさと、腸内細菌のえさになります。不足すると、便秘や、満腹感の低下につながります。",
      act: "白米を、もち麦・玄米に。納豆・海藻・きのこ・果物を1つ足す。",
    },
    iron: {
      sev: i.feMg < i.need.fe * 0.8 ? lin(1 - i.feMg / i.need.fe + 0.2) : 0,
      name: "鉄が足りない",
      num: `約${(Math.round(i.feMg * 10) / 10).toFixed(1)}mg（目安${i.need.fe}mg）`,
      why: "鉄は、酸素を運ぶ血液の材料です。不足すると、だるさ・立ちくらみ・冷えにつながります。",
      act: "赤身肉・レバー・あさり・小松菜を、ビタミンCの野菜や果物といっしょに。",
    },
    veg: {
      sev: i.vegG < 300 ? lin((300 - i.vegG) / 300 + 0.2) : 0,
      name: "野菜が足りない",
      num: `約${i.vegG}g（目安350g）`,
      why: "野菜は、食物繊維・カリウム・ビタミンの大切な入り口です。不足すると、便秘・むくみ・肌荒れに関わります。",
      act: "小鉢を、あと1〜2つ。みそ汁に野菜・きのこを足す。",
    },
    sweets: {
      sev: sweets >= 2 ? lin(sweets / 4 + 0.3) : sweets === 1 ? 0.2 : 0,
      name: "甘いもの・甘い飲み物が多め",
      num: `1日に約${sweets}回`,
      why: "血糖が急に上がって下がり、また甘いものがほしくなる流れができます。エネルギー過多にもなります。",
      act: `お菓子か甘い飲み物を1回減らし、無糖ヨーグルト・果物・お茶に（約−${sweetKcal}kcal）。`,
      dk: sweetKcal,
    },
    alcohol: {
      sev: n("alcohol") >= 2 ? 1 : n("alcohol") >= 1 ? 0.7 : 0,
      name: "お酒の習慣",
      num: n("alcohol") >= 2 ? "毎日2杯以上" : "毎日1杯",
      why: "お酒はエネルギーが高く、眠りを浅くし、むくみや血圧にも関わります。",
      act: "飲む日を減らす・1杯にする（約−140kcal）。飲む日は、豆腐・枝豆などのおつまみに。",
      dk: 140,
    },
    rich: {
      sev: rich >= 3 ? lin((rich - 2) / 3 + 0.3) : 0,
      name: "こってり・外食が多め",
      num: `1日に約${rich}回`,
      why: "油と塩分が多くなりやすく、野菜やたんぱく質のバランスも崩れやすくなります。",
      act: "外食は、定食（主食・主菜・副菜がそろう）を選ぶ。揚げ物は1回に。",
      dk: 90,
    },
    breakfast: {
      sev: n("breakfast") <= 1 ? 1 : n("breakfast") <= 4 ? 0.5 : 0,
      name: "朝ごはんが少ない",
      num: `週${n("breakfast")}日`,
      why: "朝を抜くと、昼以降にまとめ食い・甘いものがほしくなり、午前中のだるさも出やすくなります。",
      act: "卵・納豆・ヨーグルト・バナナなど、手軽な1品から始める。",
    },
    late: {
      sev: n("late") >= 5 ? 1 : n("late") >= 2 ? 0.3 : 0,
      name: "夜遅い食事が多い",
      num: `週${n("late")}日（21時以降）`,
      why: "寝る直前の食事は、眠りを浅くし、翌朝の食欲を下げて、体重にも影響します。",
      act: "遅い日は、ごはんを減らし、スープ・豆腐・野菜の軽いものに。",
    },
    water: {
      sev: n("water") <= 2 ? 0.7 : 0,
      name: "水分が少ない",
      num: "1日に3杯以下",
      why: "水分が少ないと、便が硬くなり、だるさ・むくみにも関わります。",
      act: "朝起きたとき・食事ごとに、コップ1杯の水かお茶を足す。",
    },
    walk: {
      sev: n("walk") === 0 ? 0.8 : n("walk") <= 2 ? 0.2 : 0,
      name: "体を動かす時間が少ない",
      num: n("walk") === 0 ? "ほぼなし" : "週1〜2日",
      why: "動かないと、腸の動き・血流・寝つきが悪くなり、体重も増えやすくなります。",
      act: "食後に10分歩く。階段を使う。",
    },
    sleep: {
      sev: n("sleep") <= 5 ? 1 : 0,
      name: "睡眠が短い",
      num: "5時間以下",
      why: "睡眠が短いと、食欲を高めるホルモンが増え、甘いものやだるさにつながります。",
      act: "まず、いつもより30分早く布団に入る。",
    },
  };
}

const MAP: Record<string, [string, number][]> = {
  weight: [["kcalHigh", 3], ["sweets", 2.5], ["rich", 2.5], ["fat", 2], ["carb", 1.5], ["alcohol", 2], ["late", 2], ["walk", 2], ["fiber", 1], ["veg", 1], ["protein", 1]],
  tired: [["kcalLow", 3], ["iron", 2.5], ["protein", 2], ["breakfast", 2], ["sleep", 3], ["water", 1], ["veg", 0.5]],
  const: [["fiber", 3], ["water", 2.5], ["veg", 2], ["walk", 1.5], ["breakfast", 1.5], ["kcalLow", 1.5]],
  swell: [["salt", 3], ["veg", 2], ["alcohol", 1.5], ["walk", 1.5], ["water", 1], ["rich", 1.5]],
  skin: [["protein", 2.5], ["veg", 2.5], ["sweets", 2], ["rich", 2], ["sleep", 2], ["fiber", 1]],
  sleep: [["late", 3], ["alcohol", 2.5], ["sweets", 1.5], ["walk", 2], ["rich", 1]],
  sweet: [["breakfast", 2.5], ["protein", 2.5], ["kcalLow", 2.5], ["sleep", 2.5], ["sweets", 1.5], ["fiber", 1]],
  cold: [["kcalLow", 3], ["iron", 2.5], ["protein", 2.5], ["breakfast", 1], ["walk", 1.5]],
};

export type Cause = Fx & { id: string; score: number; level: "高い" | "あり" | "少し"; rel: string[] };

export function analyze(i: CIn, picked: string[]): Cause[] {
  const fx = factors(i);
  const sc = new Map<string, { score: number; rel: string[] }>();
  for (const c of picked) {
    for (const [id, w] of MAP[c] ?? []) {
      const f = fx[id];
      if (!f || f.sev <= 0) continue;
      const cur = sc.get(id) ?? { score: 0, rel: [] };
      cur.score += w * f.sev;
      cur.rel.push(COMPLAINTS.find((x) => x.id === c)?.label ?? c);
      sc.set(id, cur);
    }
  }
  return [...sc.entries()]
    .map(([id, v]) => ({ ...fx[id], id, score: v.score, rel: v.rel, level: (fx[id].sev >= 0.7 ? "高い" : fx[id].sev >= 0.4 ? "あり" : "少し") as Cause["level"] }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
}

export default function CausePanel({ input, picked, onToggle, touched }: { input: CIn; picked: string[]; onToggle: (id: string) => void; touched: boolean }) {
  const list = COMPLAINTS.filter((c) => !(input.isYouth && c.id === "weight"));
  const causes = analyze(input, picked);
  const top = causes[0];
  return (
    <div className="causep">
      <p className="balh">🔍 いまの悩みの「原因」を、予測する</p>
      <ol className="causesteps">
        <li><b>1</b>悩みを選ぶ</li>
        <li><b>2</b>原因を見る</li>
        <li><b>3</b>1つだけ変える</li>
      </ol>
      <p className="balh sub">① いま、気になることは？（いくつでも）</p>
      <div className="symchips">
        {list.map((c) => (
          <button key={c.id} type="button" aria-pressed={picked.includes(c.id)} className={picked.includes(c.id) ? "on" : ""} onClick={() => onToggle(c.id)}>
            <span aria-hidden>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {picked.length === 0 ? (
        <p className="symempty">悩みを選ぶと、いまの食事から、考えられる原因が出ます。</p>
      ) : !touched ? (
        <p className="symempty">先に、上の「いつもの1日」を選ぶと、あなたの食事から原因を予測します。</p>
      ) : causes.length === 0 ? (
        <div className="causeok">
          <p><b>食事には、大きな原因が見つかりませんでした。</b></p>
          <p>睡眠・ストレス・運動・体調（持病や薬）など、食事以外が関係しているかもしれません。症状が続くときは、医療機関に相談してください。</p>
        </div>
      ) : (
        <>
          <p className="balh sub">② 考えられる原因（可能性が高い順）</p>
          <ol className="causelist">
            {causes.map((c, idx) => (
              <li key={c.id}>
                <p className="causet">
                  <i>{idx + 1}</i>
                  <b>{c.name}</b>
                  <em className={`lv-${c.level}`}>可能性：{c.level}</em>
                </p>
                <p className="causen">
                  <small>いまの食事</small>
                  {c.num}
                </p>
                <p className="causen">
                  <small>なぜ関係する？</small>
                  {c.why}
                </p>
                {c.rel.length > 1 && <p className="causerel">{c.rel.length}つの悩みに関係：{c.rel.join("・")}</p>}
              </li>
            ))}
          </ol>
          {top && (
            <div className="causego">
              <p className="balh sub">③ まず、これだけ変えてみる</p>
              <p className="causeact">{top.act}</p>
              {top.dk && picked.includes("weight") && (
                <p className="causepred">
                  目安：毎日続けると、<b>約{top.dk}kcal</b>減。1か月で約<b>{(Math.round(((top.dk * 30) / 7200) * 10) / 10).toFixed(1)}kg</b>ぶんの変化です（体重の変わり方には、個人差があります）。
                </p>
              )}
            </div>
          )}
          <p className="agnote small">※ 食事の量は「いつもの1日」からの概算です。原因を断定するものではなく、症状が強い・続くときは医師に相談してください。</p>
        </>
      )}
    </div>
  );
}
