"use client";

import { useEffect, useMemo, useState } from "react";

// 記録はとらない。「いつもの1日」を、ざっくり選ぶだけで、いまの食事のバランスが分かる。
type Unit = { p: number; f: number; c: number; fi: number; kcal: number };

const U = {
  staple: { p: 3.8, f: 0.5, c: 55.7, fi: 0.5, kcal: 252 }, // ごはん茶碗1杯（150g）
  main: { p: 17, f: 7, c: 1, fi: 0, kcal: 175 }, // 主菜1つ（約90g：肉・魚・卵・大豆の平均）
  veg: { p: 1.2, f: 0.2, c: 4, fi: 1.8, kcal: 25 }, // 野菜・きのこ・海藻の小鉢1つ（約70g）
  dairy: { p: 6, f: 6, c: 8.5, fi: 0, kcal: 111 }, // 牛乳コップ1杯・ヨーグルト1個
  fruit: { p: 0.6, f: 0.2, c: 15, fi: 1.5, kcal: 60 }, // 果物（約100g）
  oily: { p: 3, f: 14, c: 10, fi: 0.5, kcal: 190 }, // 揚げ物・炒め物など、こってり1回
  sweet: { p: 2, f: 8, c: 30, fi: 0.5, kcal: 200 }, // お菓子・甘い飲み物・デザート1回
  drink: { p: 0, f: 0, c: 5, fi: 0, kcal: 140 }, // お酒1杯（アルコールのカロリーを含む）
  base: { p: 0, f: 8, c: 4, fi: 0, kcal: 90 }, // 調理の油・調味料
} satisfies Record<string, Unit>;

type Key = "staple" | "main" | "veg" | "dairy" | "fruit" | "oily" | "sweet" | "drink";

const Q: { key: Key; icon: string; q: string; hint: string; opts: { v: number; t: string }[] }[] = [
  { key: "staple", icon: "🍚", q: "ごはん・パン・麺", hint: "ごはん茶碗1杯（150g）＝パン1.5枚＝麺1/2玉くらい", opts: [{ v: 1, t: "1杯" }, { v: 2, t: "2杯" }, { v: 3, t: "3杯" }, { v: 4, t: "4杯" }, { v: 5, t: "5杯〜" }] },
  { key: "main", icon: "🍗", q: "肉・魚・卵・大豆", hint: "手のひら1枚（約90g）＝卵2個＝豆腐1/2丁＝納豆2パック", opts: [{ v: 0, t: "ほぼなし" }, { v: 1, t: "1つ" }, { v: 2, t: "2つ" }, { v: 3, t: "3つ" }, { v: 4, t: "4つ〜" }] },
  { key: "veg", icon: "🥦", q: "野菜・きのこ・海藻", hint: "小鉢1つ（約70g）。サラダ・おひたし・みそ汁の具など", opts: [{ v: 0, t: "ほぼなし" }, { v: 2, t: "1〜2つ" }, { v: 4, t: "3〜4つ" }, { v: 6, t: "5つ〜" }] },
  { key: "dairy", icon: "🥛", q: "牛乳・ヨーグルト・チーズ", hint: "牛乳コップ1杯・ヨーグルト1個＝1つ", opts: [{ v: 0, t: "ほぼなし" }, { v: 1, t: "1つ" }, { v: 2, t: "2つ" }, { v: 3, t: "3つ〜" }] },
  { key: "fruit", icon: "🍎", q: "果物", hint: "りんご1/2個・バナナ1本・みかん1個＝1つ", opts: [{ v: 0, t: "ほぼなし" }, { v: 1, t: "1つ" }, { v: 2, t: "2つ〜" }] },
  { key: "oily", icon: "🍤", q: "揚げ物・炒め物・こってり", hint: "とんかつ・から揚げ・ラーメン・ドレッシングたっぷり、など", opts: [{ v: 0, t: "ほぼなし" }, { v: 1, t: "1日1回" }, { v: 2, t: "2回" }, { v: 3, t: "3回〜" }] },
  { key: "sweet", icon: "🍰", q: "お菓子・甘い飲み物", hint: "菓子パン・チョコ・ケーキ・ジュース・加糖コーヒー", opts: [{ v: 0, t: "ほぼなし" }, { v: 1, t: "1日1回" }, { v: 2, t: "2回" }, { v: 3, t: "3回〜" }] },
  { key: "drink", icon: "🍺", q: "お酒", hint: "ビール中ジョッキ・ワイン2杯弱・チューハイ1缶＝1杯", opts: [{ v: 0, t: "飲まない" }, { v: 0.2, t: "週1〜2回" }, { v: 1, t: "毎日1杯" }, { v: 2, t: "毎日2杯〜" }] },
];

const DEFAULT: Record<Key, number> = { staple: 3, main: 2, veg: 2, dairy: 1, fruit: 1, oily: 1, sweet: 1, drink: 0 };
const r0 = (n: number) => Math.round(n);

type Target = { kcal: number; p: number; f: number; c: number } | null;

export default function BalanceCheck() {
  const [a, setA] = useState<Record<Key, number>>(DEFAULT);
  const [target, setTarget] = useState<Target>(null);
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-bal") || "null");
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
      localStorage.setItem("lg-bal", JSON.stringify(a));
    } catch {}
  }, [a, loaded, touched]);

  const t = useMemo(() => {
    const parts: [Unit, number][] = [
      [U.staple, a.staple],
      [U.main, a.main],
      [U.veg, a.veg],
      [U.dairy, a.dairy],
      [U.fruit, a.fruit],
      [U.oily, a.oily],
      [U.sweet, a.sweet],
      [U.drink, a.drink],
      [U.base, 1],
    ];
    const s = { p: 0, f: 0, c: 0, fi: 0, kcal: 0 };
    for (const [u, n] of parts) {
      s.p += u.p * n;
      s.f += u.f * n;
      s.c += u.c * n;
      s.fi += u.fi * n;
      s.kcal += u.kcal * n;
    }
    return s;
  }, [a]);

  const pe = (t.p * 4) / (t.p * 4 + t.f * 9 + t.c * 4);
  const fe = (t.f * 9) / (t.p * 4 + t.f * 9 + t.c * 4);
  const ce = (t.c * 4) / (t.p * 4 + t.f * 9 + t.c * 4);
  const pc = (x: number) => Math.round(x * 100);

  // 評価：目標があれば目標のg、なければ食事摂取基準の割合（P13〜20%・F20〜30%・C50〜65%）
  const judge = (v: number, lo: number, hi: number) => (v < lo ? "low" : v > hi ? "high" : "ok");
  const rows = [
    { name: "たんぱく質", cls: "p", g: t.p, pct: pe, st: target ? judge(t.p, target.p * 0.85, target.p * 1.2) : judge(pe, 0.13, 0.2), tg: target ? `${target.p}g` : "13〜20%" },
    { name: "脂質", cls: "f", g: t.f, pct: fe, st: target ? judge(t.f, target.f * 0.8, target.f * 1.2) : judge(fe, 0.2, 0.3), tg: target ? `${target.f}g` : "20〜30%" },
    { name: "炭水化物", cls: "c", g: t.c, pct: ce, st: target ? judge(t.c, target.c * 0.8, target.c * 1.2) : judge(ce, 0.5, 0.65), tg: target ? `${target.c}g` : "50〜65%" },
  ];
  const stText = { low: "少なめ", ok: "ちょうどよい", high: "多め" } as const;

  const tips: string[] = [];
  const pStat = rows[0].st;
  if (pStat === "low") tips.push("たんぱく質が少なめ：毎食に、卵1個か納豆1パックか、手のひらサイズの肉・魚を足しましょう。");
  if (rows[1].st === "high") tips.push("脂質が多め：揚げ物・こってりを、1回へらして、焼く・蒸す・ゆでるに。");
  if (rows[2].st === "high" && (a.sweet >= 1 || a.drink >= 1)) tips.push("炭水化物が多め：お菓子・甘い飲み物・お酒を、1回ぶん、ヨーグルトや果物・お茶に置きかえましょう。");
  else if (rows[2].st === "high") tips.push("炭水化物が多め：ごはんを、1杯→2/3杯にしてみる。野菜とたんぱく質を先に食べる。");
  if (rows[2].st === "low") tips.push("炭水化物が少なめ：主食を抜かず、ごはん・もち麦・パンで、エネルギーを確保。");
  if (a.veg < 4) tips.push("野菜が少なめ：小鉢を、あと1〜2つ。1日350g（小鉢5つ）が目安です。");
  if (t.fi < 18) tips.push(`食物繊維が約${r0(t.fi)}g（目安18g以上）：白米にもち麦を混ぜる、納豆・海藻・きのこを足す。`);
  if (a.dairy === 0) tips.push("カルシウムが不足しがち：牛乳・ヨーグルト・小魚・豆腐を、1日1〜2つ。");
  if (a.drink >= 1) tips.push("お酒は、エネルギーが高めで、睡眠・体重にも影響。飲む日は、枝豆・冷奴などのおつまみで、たんぱく質を。");
  const shown = tips.slice(0, 4);

  const set = (k: Key, v: number) => {
    setA((x) => ({ ...x, [k]: v }));
    setTouched(true);
  };

  return (
    <section className="card bal" aria-label="いまの食事のバランス">
      <h2 className="h2" style={{ marginTop: 0 }}>
        🥗 いまの食事のバランス
      </h2>
      <p className="agnote">
        <b>記録は、いりません。</b>「いつもの1日」に近いものを、タップするだけで、いまの大体のバランスが分かります。
      </p>

      <ul className="balq">
        {Q.map((q) => (
          <li key={q.key}>
            <p className="balqt">
              <span aria-hidden>{q.icon}</span> <b>{q.q}</b>
              <small>{q.hint}</small>
            </p>
            <div className="balopts" role="radiogroup" aria-label={q.q}>
              {q.opts.map((o) => (
                <button key={o.t} type="button" role="radio" aria-checked={a[q.key] === o.v} className={a[q.key] === o.v ? "on" : ""} onClick={() => set(q.key, o.v)}>
                  {o.t}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

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
              <span>約{r0(r.g)}g（{pc(r.pct)}%）</span>
              <em>{stText[r.st as "low" | "ok" | "high"]}</em>
            </li>
          ))}
        </ul>
        <p className="agnote">
          {target ? `目安は、あなたが決めた目標（P${target.p}g・F${target.f}g・C${target.c}g）との比較です。` : "目安は、食事摂取基準の割合（P13〜20%・F20〜30%・C50〜65%）との比較です。下の「1日のカロリー・PFCを決める」で目標を決めると、目標との比較になります。"}
        </p>

        {shown.length > 0 ? (
          <div className="baltips">
            <p className="balh">今日から、ひとつだけ</p>
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
    </section>
  );
}

