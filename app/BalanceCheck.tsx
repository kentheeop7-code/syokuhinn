"use client";

import { useEffect, useMemo, useState } from "react";

// 記録はとらない。「いつもの1日」を、ざっくり選ぶだけで、いまの食事のバランスが分かる。
type Unit = { p: number; f: number; c: number; fi: number; kcal: number; salt: number; ca: number };
const u = (p: number, f: number, c: number, fi: number, kcal: number, salt: number, ca: number): Unit => ({ p, f, c, fi, kcal, salt, ca });

// 1回（1杯・1つ・1切れ）あたりの目安（日本食品標準成分表をもとにした、おおよその値）
const U: Record<string, Unit> = {
  rice: u(3.8, 0.5, 55.7, 0.5, 252, 0, 5), // ごはん茶碗1杯（150g）
  bread: u(5.3, 2.5, 28, 1.3, 158, 0.8, 14), // 食パン6枚切り1枚
  noodle: u(10, 5, 60, 2.5, 330, 3.5, 30), // 麺類1食（汁・ソースを含む）
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
  fried: u(3, 14, 10, 0.5, 190, 0.8, 10), // 揚げ物1回
  stir: u(2, 9, 6, 0.5, 110, 1.0, 8), // 炒め物・こってり1回
  out: u(0, 6, 0, 0, 120, 1.2, 0), // 外食・コンビニ・惣菜1回の、上乗せ（油・塩分）
  cake: u(4, 12, 40, 0.5, 290, 0.5, 30), // 菓子パン・ケーキ1個
  snack: u(2, 10, 22, 0.5, 180, 0.5, 20), // チョコ・スナック1回
  sugar: u(0, 0, 25, 0, 100, 0, 0), // 甘い飲み物1杯
  alcohol: u(0, 0, 5, 0, 140, 0, 0), // お酒1杯
  base: u(0, 8, 4, 0, 90, 2.5, 0), // 調理の油・みそ汁・調味料（平均）
};

type Opt = { v: number; t: string };
const O = (vals: number[], unit: string, zero = "ほぼなし"): Opt[] => vals.map((v) => ({ v, t: v === 0 ? zero : `${v}${unit}` }));

type Item = { key: string; label: string; short: string; hint: string; opts: Opt[] };
type Group = { id: string; icon: string; title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "staple",
    icon: "🍚",
    title: "主食",
    items: [
      { key: "rice", label: "ごはん", short: "ごはん", hint: "茶碗1杯（150g）", opts: O([0, 1, 2, 3, 4], "杯") },
      { key: "bread", label: "パン", short: "パン", hint: "食パン6枚切り1枚", opts: O([0, 1, 2, 3], "枚") },
      { key: "noodle", label: "麺類（うどん・ラーメン・パスタ）", short: "麺", hint: "1食ぶん", opts: O([0, 1, 2], "食") },
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
      { key: "veg", label: "野菜", short: "野菜", hint: "小鉢1つ（約70g）。サラダ・煮物・みそ汁の具", opts: [{ v: 0, t: "ほぼなし" }, { v: 2, t: "1〜2つ" }, { v: 4, t: "3〜4つ" }, { v: 6, t: "5つ〜" }] },
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
    id: "rich",
    icon: "🍤",
    title: "こってり・外食",
    items: [
      { key: "fried", label: "揚げ物", short: "揚げ物", hint: "とんかつ・から揚げ・天ぷら", opts: O([0, 1, 2, 3], "回") },
      { key: "stir", label: "炒め物・こってり", short: "炒め物", hint: "炒め物・カレー・ドレッシングたっぷり", opts: O([0, 1, 2, 3], "回") },
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
];

const DEFAULT: Record<string, number> = { rice: 2, bread: 1, noodle: 0, meat: 1, fish: 1, egg: 1, soy: 1, veg: 2, mush: 1, milk: 1, yogurt: 0, fruit: 1, nuts: 0, fried: 1, stir: 0, out: 1, cake: 0, snack: 1, sugar: 0, alcohol: 0 };
const r0 = (n: number) => Math.round(n);

type Target = { kcal: number; p: number; f: number; c: number } | null;
type St = "low" | "ok" | "high";

export default function BalanceCheck() {
  const [a, setA] = useState<Record<string, number>>(DEFAULT);
  const [target, setTarget] = useState<Target>(null);
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState<string>("staple");

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
    for (const k of Object.keys(U)) add(U[k], k === "base" ? 1 : a[k] ?? 0);
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
  if (checks[0].st === "high") tips.push("食塩が多め：麺の汁を残す・漬物や加工食品を減らす・調味料は「かける」より「つける」に。");
  if (checks[3].st === "low") tips.push("野菜が少なめ：小鉢を、あと1〜2つ。みそ汁に野菜・きのこを足すと、手軽です。");
  if (checks[1].st === "low") tips.push("食物繊維が不足：白米にもち麦を混ぜる、納豆・海藻・きのこ・果物を足しましょう。");
  if (checks[2].st === "low") tips.push("カルシウムが不足：牛乳・ヨーグルト・小魚・豆腐を、1日1〜2つ足しましょう。");
  if ((a.alcohol ?? 0) >= 1) tips.push("お酒はエネルギーが高め。飲む日は、枝豆・冷奴など、たんぱく質のおつまみに。");
  const shown = tips.slice(0, 4);

  const set = (k: string, v: number) => {
    setA((x) => ({ ...x, [k]: v }));
    setTouched(true);
  };

  const summary = (g: Group) => {
    const parts = g.items.filter((i) => (a[i.key] ?? 0) > 0).map((i) => `${i.short}${i.opts.find((o) => o.v === a[i.key])?.t ?? ""}`);
    return parts.length ? parts.join("・") : "なし";
  };

  return (
    <section className="card bal" aria-label="いまの食事のバランス">
      <h2 className="h2" style={{ marginTop: 0 }}>
        🥗 いまの食事のバランス
      </h2>
      <p className="agnote">
        <b>記録は、いりません。</b>「いつもの1日」に近いものを選ぶだけで、いまの大体のバランスが分かります。気になる項目だけでOKです。
      </p>

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
        <p className="agnote small">※ 一般的な1人前の量から、ざっくり計算した目安で、実際の食事とは差があります。調理の油・みそ汁・調味料は、平均的な量を足しています。</p>
      </div>
    </section>
  );
}

