"use client";

import { useEffect, useMemo, useState } from "react";

// 記録はとらない。「いつもの1日」を、ざっくり選ぶだけで、いまの食事のバランスが分かる。
// 最後に、結果を「公式LINE」に、ワンタップで送れる。
type Unit = { p: number; f: number; c: number; fi: number; kcal: number; salt: number; ca: number };
const u = (p: number, f: number, c: number, fi: number, kcal: number, salt: number, ca: number): Unit => ({ p, f, c, fi, kcal, salt, ca });

// 公式LINEのID（例："@123abcde"）。入れると、LINEの公式アカウントのトークに、直接つながる。
// 空のままなら、LINEの「送り先を選ぶ画面」が開く（そこで公式アカウントを選ぶ）。
const LINE_OA_ID: string = process.env.NEXT_PUBLIC_LINE_OA_ID ?? "";

// 1回（1杯・1つ・1切れ）あたりの目安（日本食品標準成分表をもとにした、おおよその値）
const U: Record<string, Unit> = {
  rice: u(3.8, 0.5, 55.7, 0.5, 252, 0, 5), // 白ごはん茶碗1杯（150g）
  brown: u(4.2, 1.5, 53, 2.1, 248, 0, 11), // 玄米・もち麦ごはん茶碗1杯
  bread: u(5.3, 2.5, 28, 1.3, 158, 0.8, 14), // 食パン6枚切り1枚
  noodle: u(10, 5, 60, 2.5, 330, 3.5, 30), // 麺類1食（汁・ソースを含む）
  imo: u(1.4, 0.1, 22, 1.6, 95, 0, 8), // いも・かぼちゃ・とうもろこし（約100g）
  meat: u(19, 8, 0, 0, 170, 0.2, 8), // 肉（手のひら1枚・約90g）
  fish: u(17, 6, 0, 0, 135, 0.8, 40), // 魚（1切れ・約80g）
  egg: u(6, 5, 0.2, 0, 75, 0.2, 25), // 卵1個
  soy: u(9, 5, 3, 2, 90, 0.3, 100), // 豆腐1/2丁・納豆1パック
  veg: u(1.2, 0.2, 4, 1.8, 25, 0, 25), // 野菜の小鉢1つ（約70g）
  mush: u(1.5, 0.3, 3, 2.5, 18, 0.2, 20), // きのこ・海藻1回
  milk: u(6.6, 7.6, 9.6, 0, 134, 0.2, 220), // 牛乳コップ1杯
  yogurt: u(5, 4, 7, 0, 85, 0.3, 130), // ヨーグルト1個・チーズ1切れ
  fruit: u(0.6, 0.2, 15, 1.5, 60, 0, 8), // 果物（約100g）
  nuts: u(4, 10.5, 3, 2, 120, 0, 30), // ナッツ（ひとつかみ・約20g）
  soup: u(2, 1, 3, 0.8, 35, 1.3, 15), // みそ汁・スープ1杯
  pickle: u(0.5, 0, 2, 0.8, 12, 1, 12), // 漬物・梅干し・佃煮など1回
  processed: u(7, 15, 1, 0, 170, 1.5, 5), // ハム・ソーセージ・ベーコン・練り物など1回
  fried: u(3, 14, 10, 0.5, 190, 0.8, 10), // 揚げ物1回
  stir: u(2, 9, 6, 0.5, 110, 1, 8), // 炒め物・こってり1回
  instant: u(9, 16, 55, 2, 420, 5, 90), // カップ麺・インスタント1個
  out: u(0, 6, 0, 0, 120, 1.2, 0), // 外食・コンビニ・惣菜1回の、上乗せ（油・塩分）
  cake: u(4, 12, 40, 0.5, 290, 0.5, 30), // 菓子パン・ケーキ1個
  snack: u(2, 10, 22, 0.5, 180, 0.5, 20), // チョコ・スナック1回
  sugar: u(0, 0, 25, 0, 100, 0, 0), // 甘い飲み物1杯
  alcohol: u(0, 0, 5, 0, 140, 0, 0), // お酒1杯
  base: u(0, 8, 4, 0, 90, 1.2, 0), // 調理の油・調味料（平均）
};

type Opt = { v: number; t: string };
const O = (vals: number[], unit: string, zero = "ほぼなし"): Opt[] => vals.map((v) => ({ v, t: v === 0 ? zero : `${v}${unit}` }));

type Item = { key: string; label: string; short: string; hint: string; opts: Opt[]; habit?: boolean };
type Group = { id: string; icon: string; title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "staple",
    icon: "🍚",
    title: "主食",
    items: [
      { key: "rice", label: "白ごはん", short: "白ごはん", hint: "茶碗1杯（150g）", opts: O([0, 1, 2, 3, 4], "杯") },
      { key: "brown", label: "玄米・もち麦ごはん", short: "玄米もち麦", hint: "茶碗1杯（150g）", opts: O([0, 1, 2, 3], "杯") },
      { key: "bread", label: "パン", short: "パン", hint: "食パン6枚切り1枚", opts: O([0, 1, 2, 3], "枚") },
      { key: "noodle", label: "麺類（うどん・ラーメン・パスタ）", short: "麺", hint: "1食ぶん", opts: O([0, 1, 2], "食") },
      { key: "imo", label: "いも・かぼちゃ・とうもろこし", short: "いも類", hint: "約100g（さつまいも1/2本）", opts: O([0, 1, 2], "つ") },
    ],
  },
  {
    id: "main",
    icon: "🍗",
    title: "主菜（たんぱく質）",
    items: [
      { key: "meat", label: "肉", short: "肉", hint: "手のひら1枚（約90g）", opts: O([0, 1, 2, 3], "つ") },
      { key: "fish", label: "魚", short: "魚", hint: "1切れ（約80g）・缶詰も", opts: O([0, 1, 2, 3], "切れ") },
      { key: "egg", label: "卵", short: "卵", hint: "1個", opts: O([0, 1, 2, 3, 4], "個") },
      { key: "soy", label: "豆腐・納豆などの大豆", short: "大豆", hint: "豆腐1/2丁・納豆1パック", opts: O([0, 1, 2, 3], "つ") },
    ],
  },
  {
    id: "side",
    icon: "🥦",
    title: "副菜（野菜・きのこ・海藻）",
    items: [
      { key: "veg", label: "野菜", short: "野菜", hint: "小鉢1つ（約70g）。サラダ・煮物・おひたしなど", opts: [{ v: 0, t: "ほぼなし" }, { v: 2, t: "1〜2つ" }, { v: 4, t: "3〜4つ" }, { v: 6, t: "5つ〜" }] },
      { key: "mush", label: "きのこ・海藻", short: "きのこ海藻", hint: "1回（わかめ・しいたけなど）", opts: O([0, 1, 2], "回") },
    ],
  },
  {
    id: "extra",
    icon: "🥛",
    title: "乳製品・果物・ナッツ",
    items: [
      { key: "milk", label: "牛乳", short: "牛乳", hint: "コップ1杯（200ml）", opts: O([0, 1, 2, 3], "杯") },
      { key: "yogurt", label: "ヨーグルト・チーズ", short: "ヨーグルト", hint: "ヨーグルト1個・チーズ1切れ", opts: O([0, 1, 2], "つ") },
      { key: "fruit", label: "果物", short: "果物", hint: "りんご1/2個・バナナ1本・みかん1個", opts: O([0, 1, 2], "つ") },
      { key: "nuts", label: "ナッツ", short: "ナッツ", hint: "ひとつかみ（約20g）", opts: O([0, 1, 2], "回") },
    ],
  },
  {
    id: "salt",
    icon: "🍲",
    title: "汁物・漬物・加工品",
    items: [
      { key: "soup", label: "みそ汁・スープ", short: "汁物", hint: "1杯", opts: O([0, 1, 2, 3], "杯") },
      { key: "pickle", label: "漬物・梅干し・佃煮", short: "漬物", hint: "1回（小皿1つ）", opts: O([0, 1, 2], "回") },
      { key: "processed", label: "ハム・ソーセージ・練り物", short: "加工品", hint: "1回（ハム2枚・ソーセージ2本）", opts: O([0, 1, 2], "回") },
    ],
  },
  {
    id: "rich",
    icon: "🍤",
    title: "こってり・外食",
    items: [
      { key: "fried", label: "揚げ物", short: "揚げ物", hint: "とんかつ・から揚げ・天ぷら", opts: O([0, 1, 2, 3], "回") },
      { key: "stir", label: "炒め物・こってり", short: "炒め物", hint: "炒め物・カレー・ドレッシングたっぷり", opts: O([0, 1, 2, 3], "回") },
      { key: "instant", label: "カップ麺・インスタント", short: "インスタント", hint: "1個・1食", opts: O([0, 1, 2], "回") },
      { key: "out", label: "外食・コンビニ・惣菜", short: "外食", hint: "1食を外で済ませた回数", opts: O([0, 1, 2, 3], "回") },
    ],
  },
  {
    id: "treat",
    icon: "🍰",
    title: "おやつ・飲み物",
    items: [
      { key: "cake", label: "菓子パン・ケーキ", short: "ケーキ類", hint: "1個", opts: O([0, 1, 2, 3], "個") },
      { key: "snack", label: "チョコ・スナック・アイス", short: "スナック", hint: "1回", opts: O([0, 1, 2, 3], "回") },
      { key: "sugar", label: "甘い飲み物", short: "甘い飲み物", hint: "ジュース・加糖コーヒー・ラテ", opts: O([0, 1, 2, 3], "杯") },
      { key: "alcohol", label: "お酒", short: "お酒", hint: "ビール中ジョッキ・ワイン2杯弱・チューハイ1缶", opts: [{ v: 0, t: "飲まない" }, { v: 0.2, t: "週1〜2回" }, { v: 1, t: "毎日1杯" }, { v: 2, t: "毎日2杯〜" }] },
    ],
  },
  {
    id: "habit",
    icon: "⏰",
    title: "食べ方・生活のリズム",
    items: [
      { key: "breakfast", label: "朝ごはん", short: "朝食", hint: "1週間のうち", habit: true, opts: [{ v: 7, t: "毎日" }, { v: 4, t: "週3〜5日" }, { v: 1, t: "ほぼ食べない" }] },
      { key: "late", label: "夜遅い食事（21時以降）", short: "夜食", hint: "1週間のうち", habit: true, opts: [{ v: 0, t: "ほぼなし" }, { v: 2, t: "週1〜2日" }, { v: 5, t: "週3日以上" }] },
      { key: "water", label: "水・お茶（甘くないもの）", short: "水分", hint: "1日にコップ何杯（1杯＝200ml）", habit: true, opts: [{ v: 2, t: "〜3杯" }, { v: 5, t: "4〜6杯" }, { v: 8, t: "7杯〜" }] },
      { key: "walk", label: "運動・歩く（30分以上）", short: "運動", hint: "1週間のうち", habit: true, opts: [{ v: 0, t: "ほぼなし" }, { v: 2, t: "週1〜2日" }, { v: 4, t: "週3日以上" }] },
      { key: "sleep", label: "睡眠時間", short: "睡眠", hint: "1日の平均", habit: true, opts: [{ v: 5, t: "〜5時間" }, { v: 6, t: "6時間" }, { v: 7, t: "7時間〜" }] },
    ],
  },
];

const DEFAULT: Record<string, number> = { rice: 2, brown: 0, bread: 1, noodle: 0, imo: 0, meat: 1, fish: 1, egg: 1, soy: 1, veg: 2, mush: 1, milk: 1, yogurt: 0, fruit: 1, nuts: 0, soup: 1, pickle: 0, processed: 0, fried: 1, stir: 0, instant: 0, out: 1, cake: 0, snack: 1, sugar: 0, alcohol: 0, breakfast: 7, late: 0, water: 5, walk: 2, sleep: 6 };
const HABIT_KEYS = new Set(GROUPS.flatMap((g) => g.items.filter((i) => i.habit).map((i) => i.key)));
const r0 = (n: number) => Math.round(n);

type Target = { kcal: number; p: number; f: number; c: number } | null;
type St = "low" | "ok" | "high";

function lineUrl(text: string): string {
  const q = encodeURIComponent(text);
  return LINE_OA_ID ? `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${q}` : `https://line.me/R/msg/text/?${q}`;
}

export default function BalanceCheck() {
  const [a, setA] = useState<Record<string, number>>(DEFAULT);
  const [target, setTarget] = useState<Target>(null);
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState<string>("staple");
  const [nick, setNick] = useState("");
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-bal2") || "null");
      if (s) {
        setA({ ...DEFAULT, ...s });
        setTouched(true);
      }
      const k = JSON.parse(localStorage.getItem("lg-kcal") || "null");
      if (k?.kcal && k.p && k.f && k.c) setTarget({ kcal: parseFloat(k.kcal), p: k.p, f: k.f, c: k.c });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !touched) return;
    try {
      localStorage.setItem("lg-bal2", JSON.stringify(a));
    } catch {}
  }, [a, loaded, touched]);

  const t = useMemo(() => {
    const s = { p: 0, f: 0, c: 0, fi: 0, kcal: 0, salt: 0, ca: 0 };
    const add = (x: Unit, n: number) => {
      s.p += x.p * n;
      s.f += x.f * n;
      s.c += x.c * n;
      s.fi += x.fi * n;
      s.kcal += x.kcal * n;
      s.salt += x.salt * n;
      s.ca += x.ca * n;
    };
    for (const k of Object.keys(U)) add(U[k], k === "base" ? 1 : HABIT_KEYS.has(k) ? 0 : a[k] ?? 0);
    return s;
  }, [a]);

  const en = t.p * 4 + t.f * 9 + t.c * 4;
  const pe = (t.p * 4) / en;
  const fe = (t.f * 9) / en;
  const ce = (t.c * 4) / en;
  const pc = (x: number) => Math.round(x * 100);
  const judge = (v: number, lo: number, hi: number): St => (v < lo ? "low" : v > hi ? "high" : "ok");

  const rows = [
    { name: "たんぱく質", cls: "p", g: t.p, pct: pe, st: target ? judge(t.p, target.p * 0.85, target.p * 1.2) : judge(pe, 0.13, 0.2) },
    { name: "脂質", cls: "f", g: t.f, pct: fe, st: target ? judge(t.f, target.f * 0.8, target.f * 1.2) : judge(fe, 0.2, 0.3) },
    { name: "炭水化物", cls: "c", g: t.c, pct: ce, st: target ? judge(t.c, target.c * 0.8, target.c * 1.2) : judge(ce, 0.5, 0.65) },
  ];
  const stText: Record<St, string> = { low: "少なめ", ok: "ちょうどよい", high: "多め" };
  const vegG = (a.veg ?? 0) * 70;

  const checks: { name: string; value: string; goal: string; st: St }[] = [
    { name: "食塩", value: `約${(Math.round(t.salt * 10) / 10).toFixed(1)}g`, goal: "6.5g未満", st: t.salt >= 6.5 ? "high" : "ok" },
    { name: "食物繊維", value: `約${r0(t.fi)}g`, goal: "18g以上", st: t.fi >= 18 ? "ok" : "low" },
    { name: "カルシウム", value: `約${r0(t.ca)}mg`, goal: "650mg前後", st: t.ca >= 600 ? "ok" : "low" },
    { name: "野菜", value: `約${vegG}g`, goal: "350g（小鉢5つ）", st: vegG >= 300 ? "ok" : "low" },
  ];

  const tips: string[] = [];
  if (rows[0].st === "low") tips.push("たんぱく質が少なめ：毎食に、卵1個か納豆1パックか、手のひらサイズの肉・魚を足しましょう。");
  if (rows[1].st === "high") tips.push("脂質が多め：揚げ物・炒め物を1回へらして、焼く・蒸す・ゆでるに。");
  if (rows[2].st === "high" && (a.cake ?? 0) + (a.snack ?? 0) + (a.sugar ?? 0) + (a.alcohol ?? 0) >= 1) tips.push("炭水化物が多め：お菓子・甘い飲み物・お酒を1回ぶん、ヨーグルトや果物・お茶に置きかえましょう。");
  else if (rows[2].st === "high") tips.push("炭水化物が多め：ごはんを、1杯→2/3杯にして、野菜とたんぱく質を先に食べましょう。");
  if (rows[2].st === "low") tips.push("炭水化物が少なめ：主食を抜かず、ごはん・もち麦・パンでエネルギーを確保しましょう。");
  if (checks[0].st === "high") tips.push("食塩が多め：汁物・漬物・麺の汁・加工品を1つ減らし、調味料は「かける」より「つける」に。");
  if (checks[3].st === "low") tips.push("野菜が少なめ：小鉢を、あと1〜2つ。みそ汁に野菜・きのこを足すと、手軽です。");
  if (checks[1].st === "low") tips.push("食物繊維が不足：白米を玄米・もち麦に変える、納豆・海藻・きのこ・果物を足しましょう。");
  if (checks[2].st === "low") tips.push("カルシウムが不足：牛乳・ヨーグルト・小魚・豆腐を、1日1〜2つ足しましょう。");
  if ((a.alcohol ?? 0) >= 1) tips.push("お酒はエネルギーが高め。飲む日は、枝豆・冷奴など、たんぱく質のおつまみに。");
  if ((a.breakfast ?? 7) <= 4) tips.push("朝ごはんが少ない：卵・納豆・ヨーグルト・バナナなど、手軽なものから、1品始めましょう。");
  if ((a.late ?? 0) >= 5) tips.push("夜遅い食事が多い：遅い日は、ごはんを減らして、スープ・豆腐・野菜などの軽いものに。");
  if ((a.water ?? 5) <= 2) tips.push("水分が少なめ：朝起きたとき・食事ごとに、コップ1杯の水かお茶を足しましょう。");
  if ((a.walk ?? 2) === 0) tips.push("運動がほぼない：食後に10分歩くところから。階段を使うだけでも、違います。");
  if ((a.sleep ?? 6) <= 5) tips.push("睡眠が短め：6〜7時間を目標に。睡眠不足は、食欲を増やします。");
  const shown = tips.slice(0, 5);

  const set = (k: string, v: number) => {
    setA((x) => ({ ...x, [k]: v }));
    setTouched(true);
  };

  const summary = (g: Group) => {
    const parts = g.items.filter((i) => (g.id === "habit" ? true : (a[i.key] ?? 0) > 0)).map((i) => `${i.short}${i.opts.find((o) => o.v === a[i.key])?.t ?? ""}`);
    return parts.length ? parts.join("・") : "なし";
  };

  // 公式LINEに送る文章
  const message = useMemo(() => {
    const d = new Date();
    const lines: string[] = [];
    lines.push("【LIFEGYM 食事バランスチェック】");
    lines.push(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日${nick.trim() ? `　${nick.trim()}さん` : ""}`);
    lines.push("");
    lines.push(`■ いまの食事（1日の目安）：約${(Math.round(t.kcal / 50) * 50).toLocaleString()}kcal`);
    lines.push(`P たんぱく質 約${r0(t.p)}g（${pc(pe)}%）${stText[rows[0].st]}`);
    lines.push(`F 脂質 約${r0(t.f)}g（${pc(fe)}%）${stText[rows[1].st]}`);
    lines.push(`C 炭水化物 約${r0(t.c)}g（${pc(ce)}%）${stText[rows[2].st]}`);
    lines.push(`食塩 約${(Math.round(t.salt * 10) / 10).toFixed(1)}g／食物繊維 約${r0(t.fi)}g／カルシウム 約${r0(t.ca)}mg／野菜 約${vegG}g`);
    if (target) lines.push(`（目標：${r0(target.kcal)}kcal・P${target.p}g・F${target.f}g・C${target.c}g）`);
    lines.push("");
    lines.push("■ いつもの食事");
    for (const g of GROUPS) lines.push(`${g.icon} ${g.title.replace(/（.*?）/g, "")}：${summary(g)}`);
    if (shown.length > 0) {
      lines.push("");
      lines.push("■ 気になる点");
      shown.slice(0, 3).forEach((x) => lines.push(`・${x.split("：")[0]}`));
    }
    lines.push("");
    lines.push("※ ざっくり計算した目安です。");
    return lines.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, nick, target]);

  const sendLine = () => {
    window.open(lineUrl(message), "_blank", "noopener");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setShowText(true);
    }
  };

  return (
    <section className="card bal" aria-label="いまの食事のバランス">
      <h2 className="h2" style={{ marginTop: 0 }}>
        🥗 いまの食事のバランス
      </h2>
      <p className="agnote">
        <b>記録は、いりません。</b>「いつもの1日」に近いものを選ぶだけで、いまの大体のバランスが分かります。最後に、結果を公式LINEに送れます。
      </p>

      <ol className="balsteps">
        <li>
          <b>1</b>選ぶ
        </li>
        <li>
          <b>2</b>結果を見る
        </li>
        <li>
          <b>3</b>LINEで送る
        </li>
      </ol>

      <div className="balgroups">
        {GROUPS.map((g) => {
          const isOpen = open === g.id;
          return (
            <div key={g.id} className={isOpen ? "balg open" : "balg"}>
              <button type="button" className="balgh" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? "" : g.id)}>
                <span className="balgi" aria-hidden>
                  {g.icon}
                </span>
                <span className="balgt">
                  <b>{g.title}</b>
                  <small>{summary(g)}</small>
                </span>
                <i aria-hidden>{isOpen ? "−" : "＋"}</i>
              </button>
              <div className="balgb" hidden={!isOpen}>
                {g.items.map((it) => (
                  <div key={it.key} className="balit">
                    <p className="balqt">
                      <b>{it.label}</b>
                      <small>{it.hint}</small>
                    </p>
                    <div className="balopts" role="radiogroup" aria-label={it.label}>
                      {it.opts.map((o) => (
                        <button key={o.t} type="button" role="radio" aria-checked={a[it.key] === o.v} className={a[it.key] === o.v ? "on" : ""} onClick={() => set(it.key, o.v)}>
                          {o.t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {(() => {
                  const idx = GROUPS.findIndex((x) => x.id === g.id);
                  const next = GROUPS[idx + 1];
                  return next ? (
                    <button type="button" className="balnext" onClick={() => setOpen(next.id)}>
                      次へ：{next.title.replace(/（.*?）/g, "")} ›
                    </button>
                  ) : (
                    <button type="button" className="balnext" onClick={() => document.querySelector(".balres")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                      結果を見る ↓
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="balres">
        <p className="balh">{touched ? "いまの食事の目安（1日）" : "例：ふつうの1日の目安（選ぶと、あなたの結果になります）"}</p>
        <div className="balk">
          約 <b>{(Math.round(t.kcal / 50) * 50).toLocaleString()}</b> kcal
          {target && <small>（あなたの設定：{r0(target.kcal)}kcal）</small>}
        </div>
        <div className="ksbar" role="img" aria-label={`P${pc(pe)}% F${pc(fe)}% C${pc(ce)}%`}>
          <span className="p" style={{ width: `${pc(pe)}%` }}>
            P {pc(pe)}%
          </span>
          <span className="f" style={{ width: `${pc(fe)}%` }}>
            F {pc(fe)}%
          </span>
          <span className="c" style={{ width: `${pc(ce)}%` }}>
            C {pc(ce)}%
          </span>
        </div>
        <ul className="balrows">
          {rows.map((r) => (
            <li key={r.name} className={r.st}>
              <i className={`dot ${r.cls}`} />
              <b>{r.name}</b>
              <span>
                約{r0(r.g)}g（{pc(r.pct)}%）
              </span>
              <em>{stText[r.st]}</em>
            </li>
          ))}
        </ul>
        <p className="balh sub">そのほかのチェック</p>
        <ul className="balchk">
          {checks.map((c) => (
            <li key={c.name} className={c.st}>
              <b>{c.name}</b>
              <span>{c.value}</span>
              <small>目安 {c.goal}</small>
              <em>{c.st === "ok" ? "OK" : c.st === "low" ? "足りない" : "多め"}</em>
            </li>
          ))}
        </ul>
        <p className="agnote">
          {target ? `PFCは、あなたが決めた目標（P${target.p}g・F${target.f}g・C${target.c}g）との比較です。` : "PFCは、食事摂取基準の割合（P13〜20%・F20〜30%・C50〜65%）との比較です。目標を決めると、目標との比較になります。"}
        </p>

        {shown.length > 0 ? (
          <div className="baltips">
            <p className="balh">今日から、できること</p>
            <ul>
              {shown.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="baltips ok">バランスは、よい状態です。この調子で、続けましょう。</p>
        )}
        <p className="agnote small">※ 一般的な1人前の量から、ざっくり計算した目安で、実際の食事とは差があります。調理の油・調味料は、平均的な量を足しています。</p>
      </div>

      <div className="linebox">
        <p className="balh">📨 結果を、公式LINEに送る</p>
        <ol className="linesteps">
          <li>下のボタンを押す</li>
          <li>LINEが開く → {LINE_OA_ID ? "公式アカウントのトークに、文章が入ります" : "送り先に、LINEの公式アカウントを選ぶ"}</li>
          <li>「送信」を押して、完了</li>
        </ol>
        <label className="linenick">
          <span>お名前（あれば）</span>
          <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="例：さくら" maxLength={20} aria-label="お名前（任意）" />
        </label>
        <button type="button" className="linebtn" onClick={sendLine}>
          <span aria-hidden>💬</span> LINEで送る
        </button>
        <div className="linesub">
          <button type="button" className="btn ghost" onClick={copy}>
            {copied ? "✓ コピーしました" : "文章をコピー"}
          </button>
          <button type="button" className="btn ghost" onClick={() => setShowText((v) => !v)}>
            {showText ? "送る内容を閉じる" : "送る内容を見る"}
          </button>
        </div>
        {showText && <textarea className="linetext" readOnly value={message} rows={12} aria-label="LINEに送る文章" onFocus={(e) => e.currentTarget.select()} />}
        <p className="agnote small">※ お名前は、送る文章にだけ入ります（このアプリには、保存されません）。診断ではなく、ざっくりした目安です。</p>
      </div>
    </section>
  );
}
