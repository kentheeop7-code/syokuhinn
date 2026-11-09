"use client";

import { useEffect, useState } from "react";
import { U } from "./BalanceCheck";
import { amountOf } from "../lib/microLookup";
import { readMe } from "./me";

// かんたん入力：朝・昼・夜・おやつを、タップで選ぶだけ。選んだものの合計が、1日の食事（推定カロリー）になる。
// 量は「ふつうの1食ぶん」の目安。くわしく直したい人は、「くわしく直す」へ。
type Tile = { id: string; icon: string; label: string; vals: Record<string, number> };
type Slot = { id: string; icon: string; label: string; tiles: Tile[] };

const SLOTS: Slot[] = [
  {
    id: "am",
    icon: "SUN",
    label: "朝",
    tiles: [
      { id: "am-wa", icon: "🍚", label: "ごはん・卵・みそ汁", vals: { rice: 1, egg: 1, soup: 1 } },
      { id: "am-natto", icon: "🫘", label: "納豆ごはん", vals: { rice: 1, soy: 1, soup: 1 } },
      { id: "am-pan", icon: "🥐", label: "パン・卵", vals: { bread: 2, egg: 1 } },
      { id: "am-light", icon: "🥖", label: "パン・牛乳", vals: { bread: 1, milk: 1 } },
      { id: "am-yo", icon: "🍓", label: "ヨーグルト・果物", vals: { yogurt: 1, fruit: 1 } },
      { id: "am-oats", icon: "🥣", label: "シリアル・オートミール", vals: { oats: 1, milk: 1 } },
      { id: "am-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "noon",
    icon: "SUNNY",
    label: "昼",
    tiles: [
      { id: "no-set", icon: "🍱", label: "定食（ごはん・主菜・汁）", vals: { rice: 1, chicken: 1, veg: 1, soup: 1 } },
      { id: "no-men", icon: "🍜", label: "麺類", vals: { noodle: 1, out: 1 } },
      { id: "no-don", icon: "🍛", label: "丼・カレー", vals: { rice: 2, stir: 1, out: 1 } },
      { id: "no-conv", icon: "🍙", label: "コンビニ弁当", vals: { rice: 1, fried: 1, out: 1 } },
      { id: "no-onigiri", icon: "🥗", label: "おにぎり・サラダチキン", vals: { rice: 1, chicken: 1, salad: 1 } },
      { id: "no-sand", icon: "🥪", label: "サンドイッチ・パン", vals: { bread: 2, egg: 1, out: 1 } },
      { id: "no-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "pm",
    icon: "MOON",
    label: "夜",
    tiles: [
      { id: "pm-fish", icon: "🐟", label: "魚の定食", vals: { rice: 1, fish: 1, greenveg: 1, soup: 1 } },
      { id: "pm-meat", icon: "🍖", label: "肉料理", vals: { rice: 1, meat: 1, veg: 1, stir: 1 } },
      { id: "pm-nabe", icon: "🍲", label: "鍋・煮物", vals: { chicken: 1, veg: 2, soy: 1, mush: 1 } },
      { id: "pm-fry", icon: "🍤", label: "揚げ物", vals: { rice: 1, fried: 1, salad: 1 } },
      { id: "pm-men", icon: "🍝", label: "麺類", vals: { noodle: 1 } },
      { id: "pm-out", icon: "🍻", label: "外食・居酒屋", vals: { out: 1, fried: 1, rice: 1 } },
      { id: "pm-none", icon: "⭕", label: "食べない", vals: {} },
    ],
  },
  {
    id: "snack",
    icon: "COOKIE",
    label: "おやつ・飲み物",
    tiles: [
      { id: "sn-cake", icon: "🍰", label: "菓子パン・ケーキ", vals: { cake: 1 } },
      { id: "sn-choco", icon: "🍫", label: "チョコ・スナック", vals: { snack: 1 } },
      { id: "sn-fruit", icon: "🍎", label: "果物", vals: { fruit: 1 } },
      { id: "sn-yo", icon: "🥛", label: "ヨーグルト", vals: { yogurt: 1 } },
      { id: "sn-sugar", icon: "🥤", label: "甘い飲み物", vals: { sugar: 1 } },
      { id: "sn-alc", icon: "🍺", label: "お酒", vals: { alcohol: 1 } },
      { id: "sn-none", icon: "⭕", label: "とらない", vals: {} },
    ],
  },
];
const ICON: Record<string, string> = { SUN: "🌅", SUNNY: "☀", MOON: "🌙", COOKIE: "🍪" };
const KEY = "lg-qm2";
const SIZES = [
  { t: "少なめ", m: 0.7 },
  { t: "ふつう", m: 1 },
  { t: "多め", m: 1.4 },
];
// 「足したもの」：1食に、ちょっと足したもの。タップするたびに、0→1→2→0。
const EXTRAS: { k: string; icon: string; label: string }[] = [
  { k: "salad", icon: "🥗", label: "サラダ" },
  { k: "veg", icon: "🥦", label: "野菜" },
  { k: "soup", icon: "🍲", label: "汁物" },
  { k: "egg", icon: "🥚", label: "卵" },
  { k: "soy", icon: "🫘", label: "納豆・豆腐" },
  { k: "meat", icon: "🍖", label: "肉" },
  { k: "fish", icon: "🐟", label: "魚" },
  { k: "rice", icon: "🍚", label: "ごはん" },
  { k: "fruit", icon: "🍎", label: "果物" },
  { k: "fried", icon: "🍤", label: "揚げ物" },
  { k: "sugar", icon: "🥤", label: "甘い飲み物" },
];
type St = { date: string; size: Record<string, number>; ext: Record<string, number> };
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const kc = (vals: Record<string, number>, m = 1) => Object.entries(vals).reduce((s, [k, v]) => s + (U[k]?.kcal ?? 0) * v * m, 0);
const r10 = (n: number) => Math.round(n / 10) * 10;

export default function QuickMeals() {
  const [st, setSt] = useState<St>({ date: today(), size: {}, ext: {} });
  const [prev, setPrev] = useState<St | null>(null);
  const [slot, setSlot] = useState("am");
  const [kcal, setKcal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object" && s.size) {
        if (s.date === today()) setSt({ date: s.date, size: s.size, ext: s.ext || {} });
        else if (Object.keys(s.size).length) setPrev({ date: s.date, size: s.size, ext: s.ext || {} });
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        const x = JSON.parse(localStorage.getItem("lg-status") || "null");
        setKcal(x && x.touched ? x.kcal : 0);
      } catch {}
    };
    read();
    window.addEventListener("lg-status-change", read);
    return () => window.removeEventListener("lg-status-change", read);
  }, []);

  const build = (n: St) => {
    const vals: Record<string, number> = {};
    SLOTS.forEach((s) =>
      s.tiles.forEach((t) => {
        const z = n.size[t.id];
        if (z !== undefined) for (const [k, v] of Object.entries(t.vals)) vals[k] = (vals[k] ?? 0) + v * SIZES[z].m;
      })
    );
    for (const [key, c] of Object.entries(n.ext)) {
      const k = key.split(":")[1];
      if (c > 0) vals[k] = (vals[k] ?? 0) + c;
    }
    return vals;
  };
  const apply = (n: St) => window.dispatchEvent(new CustomEvent("lg-meals", { detail: build(n) }));
  const save = (n: St) => {
    setSt(n);
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {}
    apply(n);
  };
  const cur = SLOTS.find((s) => s.id === slot)!;
  const none = cur.tiles[cur.tiles.length - 1].id;
  const toggle = (t: Tile) => {
    const size = { ...st.size };
    if (size[t.id] !== undefined) delete size[t.id];
    else if (t.id === none) {
      cur.tiles.forEach((y) => delete size[y.id]);
      size[t.id] = 1;
    } else {
      delete size[none];
      size[t.id] = 1;
    }
    save({ ...st, size });
  };
  const setSize = (id: string, z: number) => save({ ...st, size: { ...st.size, [id]: z } });
  const bump = (k: string) => {
    const key = `${slot}:${k}`;
    const c = ((st.ext[key] ?? 0) + 1) % 3;
    const ext = { ...st.ext };
    if (c === 0) delete ext[key];
    else ext[key] = c;
    save({ ...st, ext });
  };
  const reset = () => save({ date: today(), size: {}, ext: {} });
  const copyPrev = () => prev && save({ date: today(), size: prev.size, ext: prev.ext });

  const slotKcal = (s: Slot) => {
    let v = 0;
    s.tiles.forEach((t) => {
      const z = st.size[t.id];
      if (z !== undefined) v += kc(t.vals, SIZES[z].m);
    });
    for (const [key, c] of Object.entries(st.ext)) if (key.startsWith(s.id + ":")) v += kc({ [key.split(":")[1]]: c });
    return v;
  };
  const count = (s: Slot) => s.tiles.filter((t) => st.size[t.id] !== undefined).length + Object.keys(st.ext).filter((k) => k.startsWith(s.id + ":")).length;
  // 1日の合計の内訳（調理の油・調味料の分を、1日1回ぶん足す。くわしい入力と、同じ計算）
  const all = build(st);
  const any = Object.keys(all).length > 0;
  const tot = { p: 0, f: 0, c: 0, fi: 0, salt: 0 };
  if (any) for (const [k, v] of Object.entries({ ...all, base: 1 })) {
    const u = U[k];
    if (!u) continue;
    tot.p += u.p * v;
    tot.f += u.f * v;
    tot.c += u.c * v;
    tot.fi += u.fi * v;
    tot.salt += u.salt * v;
  }
  const me = typeof window !== "undefined" ? readMe() : { sex: 1, band: 3 };
  const sk = me.sex === 2 ? "m" : "f";
  const saltGoal = me.sex === 2 ? 7.5 : 6.5;
  const picked = cur.tiles.filter((t) => st.size[t.id] !== undefined && t.id !== none);
  if (!loaded) return null;
  return (
    <section className="card qm" aria-label="かんたん入力">
      <p className="balh">🍽 今日の食事を、タップで選ぶ</p>
      <p className="agnote">朝・昼・夜・おやつを選ぶと、上の推定カロリーに、すぐ反映されます。量も、足したものも、直せます。</p>
      {prev && Object.keys(st.size).length === 0 && (
        <button type="button" className="btn ghost qmprev" onClick={copyPrev}>
          前回の内容を、今日にコピーする
        </button>
      )}
      <div className="qmtabs" role="tablist" aria-label="食事の時間">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={slot === s.id} className={slot === s.id ? "on" : ""} onClick={() => setSlot(s.id)}>
            <span aria-hidden>{ICON[s.icon]}</span>
            {s.label}
            {count(s) > 0 && <i>約{r10(slotKcal(s)).toLocaleString()}</i>}
          </button>
        ))}
      </div>
      <div className="qmtiles" role="group" aria-label={`${cur.label}の食事`}>
        {cur.tiles.map((t) => {
          const on = st.size[t.id] !== undefined;
          const k = kc(t.vals);
          return (
            <button key={t.id} type="button" aria-pressed={on} className={on ? "qmt on" : "qmt"} onClick={() => toggle(t)}>
              <span aria-hidden>{t.icon}</span>
              {t.label}
              {k > 0 && <small>約{r10(k)}kcal</small>}
            </button>
          );
        })}
      </div>
      {picked.map((t) => (
        <div key={t.id} className="qmsize">
          <span>
            {t.icon} {t.label}の量
          </span>
          <div role="radiogroup" aria-label={`${t.label}の量`}>
            {SIZES.map((z, i) => (
              <button key={z.t} type="button" role="radio" aria-checked={st.size[t.id] === i} className={st.size[t.id] === i ? "on" : ""} onClick={() => setSize(t.id, i)}>
                {z.t}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="qmx">＋ 足したもの（タップで 1つ→2つ→なし）</p>
      <div className="qmextras">
        {EXTRAS.map((x) => {
          const c = st.ext[`${slot}:${x.k}`] ?? 0;
          return (
            <button key={x.k} type="button" aria-pressed={c > 0} className={c > 0 ? "on" : ""} onClick={() => bump(x.k)}>
              <span aria-hidden>{x.icon}</span>
              {x.label}
              {c > 0 && <i>×{c}</i>}
            </button>
          );
        })}
      </div>
      <p className="qmsum">
        {kcal > 0 ? (
          <>
            いまの合計：約<b>{r10(kcal).toLocaleString()}</b>kcal / 日
          </>
        ) : (
          "選ぶと、合計が出ます"
        )}
        {(Object.keys(st.size).length > 0 || Object.keys(st.ext).length > 0) && (
          <button type="button" className="btn ghost" onClick={reset}>
            選びなおす
          </button>
        )}
      </p>
      {any && (
        <ul className="qmtot" aria-label="1日の合計の内訳">
          <li>
            <small>たんぱく質</small>
            <b>{Math.round(tot.p)}g</b>
            <em>目安 {amountOf("たんぱく質", sk, me.band)}</em>
          </li>
          <li>
            <small>脂質</small>
            <b>{Math.round(tot.f)}g</b>
          </li>
          <li>
            <small>炭水化物</small>
            <b>{Math.round(tot.c)}g</b>
          </li>
          <li>
            <small>食物繊維</small>
            <b>{Math.round(tot.fi * 10) / 10}g</b>
            <em>目安 {amountOf("食物繊維", sk, me.band)}</em>
          </li>
          <li className={tot.salt > saltGoal ? "over" : ""}>
            <small>食塩</small>
            <b>{Math.round(tot.salt * 10) / 10}g</b>
            <em>目標 {saltGoal}g未満</em>
          </li>
        </ul>
      )}
      <p className="agnote small">量は目安です。ごはんの杯数や野菜の量を、細かく直したいときは、下の「くわしく直す」へ。</p>
    </section>
  );
}