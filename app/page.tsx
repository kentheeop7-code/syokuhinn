"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QuoteHero from "./QuoteHero";
import {
  CATEGORIES,
  APPROX,
  FOODS,
  LIMITS,
  MICROS,
  describeAmount,
  portionsOf,
  type Food,
  type NutrientKey,
} from "@/lib/foods";

type Entry = { id: string; name: string; grams: number };
type Log = Record<string, Entry[]>;
type Goal = { p: string; f: string; c: string };
type Totals = Record<NutrientKey, number> & { kcal: number };

const MAX_GRAMS: Record<string, number> = {
  "肉類": 250,
  "魚介類": 250,
  "穀物・主食": 250,
  "野菜・果物": 200,
  "卵・乳・大豆": 250,
  "調味料・油": 30,
  "惣菜・外食": 250,
};

const num = (v: string) => Math.max(0, parseFloat(v) || 0);
const r1 = (n: number) => Math.round(n * 10) / 10;
const byName = new Map(FOODS.map((x) => [x.name, x]));

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const label = (k: string) => {
  const [y, m, d] = k.split("-");
  return `${y}年${+m}月${+d}日`;
};

function sum(entries: Entry[]): Totals {
  const t = {
    p: 0,
    f: 0,
    c: 0,
    fi: 0,
    va: 0,
    b1: 0,
    vc: 0,
    ca: 0,
    fe: 0,
    k: 0,
    salt: 0,
    mg: 0,
    b2: 0,
    b6: 0,
    b12: 0,
    fol: 0,
    nia: 0,
    zn: 0,
    vd: 0,
  };
  for (const e of entries) {
    const food = byName.get(e.name);
    if (!food) continue;
    const g = e.grams / 100;
    (Object.keys(t) as NutrientKey[]).forEach((n) => (t[n] += food[n] * g));
  }
  return { ...t, kcal: t.p * 4 + t.f * 9 + t.c * 4 };
}

function PfcBars({ p, f, c }: { p: number; f: number; c: number }) {
  const total = p + f + c || 1;
  return (
    <div className="bars" aria-hidden>
      <span className="bar p" style={{ width: `${(p / total) * 100}%` }} />
      <span className="bar f" style={{ width: `${(f / total) * 100}%` }} />
      <span className="bar c" style={{ width: `${(c / total) * 100}%` }} />
    </div>
  );
}

function PfcRow({ p, f, c }: { p: number; f: number; c: number }) {
  return (
    <div className="pfc">
      <div>
        <i className="dot p" />P <b>{r1(p)}</b>g
      </div>
      <div>
        <i className="dot f" />F <b>{r1(f)}</b>g
      </div>
      <div>
        <i className="dot c" />C <b>{r1(c)}</b>g
      </div>
    </div>
  );
}

function Micros({
  food,
  g,
  warn,
}: {
  food: Pick<Food, NutrientKey>;
  g: number;
  warn?: boolean;
}) {
  return (
    <dl className="micros">
      {MICROS.map((m) => {
        const v = food[m.key] * g;
        const limit = warn ? LIMITS[m.key] : undefined;
        const over = limit !== undefined && v > limit;
        return (
          <div key={m.key} className={over ? "over" : ""}>
            <dt>{m.label}</dt>
            <dd>
              {over && "⚠"}
              {m.key === "b1" ? Math.round(v * 100) / 100 : r1(v)}
              <small>{m.unit}</small>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Progress({
  name,
  cls,
  value,
  target,
}: {
  name: string;
  cls: string;
  value: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const left = target - value;
  const over = target > 0 && value > target * 1.1;
  return (
    <div className={`prog${over ? " over" : ""}`}>
      <div className="proghead">
        <span>
          <i className={`dot ${cls}`} />
          {name}
          {over && " ⚠ 摂りすぎ"}
        </span>
        <span className="muted">
          {r1(value)} / {r1(target)}g
          {target > 0 && (left >= 0 ? `（あと${r1(left)}g）` : `（${r1(-left)}g超過）`)}
        </span>
      </div>
      <div className="track">
        <span
          className={`fill ${over ? "danger" : cls}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FoodRow({
  food,
  onAdd,
}: {
  food: Food;
  onAdd: (name: string, grams: number) => void;
}) {
  const [grams, setGrams] = useState("100");
  const [added, setAdded] = useState(false);
  const g = num(grams) / 100;
  const portions = portionsOf(food);

  return (
    <li>
      <div className="rowhead">
        <span>
          {food.name}
          {APPROX.has(food.name) && <span className="approx">概算値</span>}
        </span>
        <span className="muted">
          {Math.round((food.p * 4 + food.f * 9 + food.c * 4) * g)}kcal
        </span>
      </div>
      <div className="amount">
        <label className="gram">
          <input
            inputMode="decimal"
            value={grams}
            onChange={(e) => {
              setGrams(e.target.value);
              setAdded(false);
            }}
            aria-label={`${food.name}のグラム数`}
          />
          g
        </label>
        <div className="chips tight">
          <button
            className={num(grams) === 100 ? "chip on" : "chip"}
            onClick={() => setGrams("100")}
          >
            100g
          </button>
          {portions.map((p) => (
            <button
              key={p.label}
              className={num(grams) === p.g ? "chip on" : "chip"}
              onClick={() => {
                setGrams(String(p.g));
                setAdded(false);
              }}
            >
              {p.label} {p.g}g
            </button>
          ))}
        </div>
      </div>
      <PfcBars p={food.p * g} f={food.f * g} c={food.c * g} />
      <PfcRow p={food.p * g} f={food.f * g} c={food.c * g} />
      <Micros food={food} g={g} />
      <button
        className="small"
        disabled={g <= 0}
        onClick={() => {
          onAdd(food.name, num(grams));
          setAdded(true);
        }}
      >
        {added ? "✓ 追加しました" : "＋ 追加"}
      </button>
    </li>
  );
}

function Search({
  date,
  onAdd,
}: {
  date: string;
  onAdd: (name: string, grams: number) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("すべて");
  const hits = FOODS.filter(
    (x) => (cat === "すべて" || x.cat === cat) && x.name.includes(q.trim())
  );

  return (
    <section>
      <input
        className="textinput full"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="食品名で検索（例: 鶏、ごはん、麦）"
        aria-label="食品名"
      />
      <div className="chips">
        {["すべて", ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={c === cat ? "chip on" : "chip"}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="note">
        最初は100gあたりの栄養素です。茶碗1杯などの目安ボタンか、グラム数の入力で量を変えられます。「追加」で{" "}
        {label(date)} の記録に入ります。
      </p>
      <p className="note">
        数値は文部科学省「日本食品標準成分表（八訂）増補2023年」を元にしています（「概算値」は公式に同じ食品がないものです）。
      </p>
      {hits.length === 0 && <p className="note">見つかりませんでした。</p>}
      <ul className="rows card">
        {hits.map((x) => (
          <FoodRow key={x.name} food={x} onAdd={onAdd} />
        ))}
      </ul>
    </section>
  );
}
function Calendar({
  month,
  setMonth,
  selected,
  setSelected,
  log,
  goal,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  selected: string;
  setSelected: (k: string) => void;
  log: Log;
  goal: Goal;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = key(new Date());
  const t = { p: num(goal.p), f: num(goal.f), c: num(goal.c) };

  const status = (k: string) => {
    const e = log[k];
    if (!e || e.length === 0) return "";
    const s = sum(e);
    const parts = (["p", "f", "c"] as const).filter((n) => t[n] > 0);
    if (parts.length === 0) return "logged";
    const avg =
      parts.reduce((a, n) => a + Math.min(s[n] / t[n], 1), 0) / parts.length;
    return avg >= 0.9 ? "reached" : "logged";
  };

  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className="card cal">
      <div className="calhead">
        <button aria-label="前の月" onClick={() => setMonth(new Date(y, m - 1, 1))}>
          ‹
        </button>
        <b>
          {y}年{m + 1}月
        </b>
        <button aria-label="次の月" onClick={() => setMonth(new Date(y, m + 1, 1))}>
          ›
        </button>
      </div>
      <div className="grid">
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <span key={w} className="wd">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const k = key(new Date(y, m, d));
          const s = status(k);
          return (
            <button
              key={k}
              className={`day${k === selected ? " sel" : ""}${
                k === today ? " today" : ""
              }`}
              onClick={() => setSelected(k)}
            >
              {d}
              {s && <i className={`mark ${s}`} />}
            </button>
          );
        })}
      </div>
      <p className="legend">
        <i className="mark logged" /> 記録あり　<i className="mark reached" /> 目標の90%以上
      </p>
    </div>
  );
}

type Sex = "m" | "f";
type Pal = "low" | "mid" | "high";
type PurposeKey = "diet" | "muscle" | "performance";
type Method = "balance" | "lowfat" | "keto";
type Profile = {
  sex: Sex | null;
  age: string;
  height: string;
  pal: Pal;
  weight: string; // 目標体重
  purpose: PurposeKey | null;
  method: Method; // ダイエットのやり方
};

const PAL: Record<Pal, { label: string; v: number; desc: string }> = {
  low: { label: "低い", v: 1.5, desc: "ほぼ座って過ごす（運動習慣なし）" },
  mid: { label: "ふつう", v: 1.75, desc: "座り仕事が中心＋通勤・家事・軽い運動" },
  high: { label: "高い", v: 2.0, desc: "立ち仕事や、週に何度も運動する" },
};

// エネルギーは「目標体重を維持するエネルギー」を基準に、目的で調整します。
const PURPOSES: Record<
  PurposeKey,
  { label: string; energy: number; pPerKg: number; fatPct: number; desc: string }
> = {
  diet: {
    label: "ダイエット",
    energy: 0.9,
    pPerKg: 1.6,
    fatPct: 0.25,
    desc: "維持エネルギーより約1割少なめ。筋肉を守るため、たんぱく質は多めです。",
  },
  muscle: {
    label: "筋肉をつける",
    energy: 1.1,
    pPerKg: 1.8,
    fatPct: 0.25,
    desc: "維持エネルギーより約1割多め。筋肉の材料（たんぱく質）をしっかりとります。",
  },
  performance: {
    label: "パフォーマンスアップ",
    energy: 1.0,
    pPerKg: 1.5,
    fatPct: 0.22,
    desc: "運動のエネルギー源になる炭水化物を多めに。練習量が多い人向けです。",
  },
};

// ダイエットのやり方（ダイエットを選んだときだけ使います）
const METHODS: Record<Method, { label: string; desc: string }> = {
  balance: {
    label: "バランス型",
    desc: "たんぱく質は体重×1.6g、脂質はエネルギーの25%、残りを炭水化物に。厚労省の目標量の範囲内で、続けやすい配分です。",
  },
  lowfat: {
    label: "ローファット",
    desc: "脂質をエネルギーの20%（厚労省の下限）に抑え、たんぱく質は体重×1.8g、残りを炭水化物に。脂質を10〜15%まで下げる方法は、長く続けるのは勧められません。",
  },
  keto: {
    label: "ケトジェニック",
    desc: "炭水化物を1日20〜50gに抑え、たんぱく質は体重×1.6g、残りを脂質（約70〜75%）に。同じカロリーなら減量効果は他の方法と大きく変わらず、LDLコレステロールが上がることがあります。",
  },
};

// 目標とするBMI（日本人の食事摂取基準 2025年版）
const bmiRange = (age: number) =>
  age < 50 ? [18.5, 24.9] : age < 65 ? [20.0, 24.9] : [21.5, 24.9];
// エネルギー産生栄養素バランス 目標量（%エネルギー）
const pRange = (age: number) => (age < 50 ? [13, 20] : age < 65 ? [14, 20] : [15, 20]);

// 基礎代謝量：国立健康・栄養研究所の推定式（日本人向け）
function bmr(sex: Sex, age: number, height: number, weight: number) {
  const k = sex === "m" ? 0.4235 : 0.9708;
  return ((0.0481 * weight + 0.0234 * height - 0.0138 * age - k) * 1000) / 4.186;
}

function calcPlan(pf: Profile) {
  const age = num(pf.age);
  const height = num(pf.height);
  const weight = num(pf.weight);
  if (
    !pf.sex ||
    !pf.purpose ||
    age < 18 ||
    age > 99 ||
    height < 120 ||
    height > 220 ||
    weight < 30 ||
    weight > 200
  )
    return null;
  const purpose = PURPOSES[pf.purpose];
  const bm = bmr(pf.sex, age, height, weight);
  const tdee = bm * PAL[pf.pal].v;
  const target = Math.max(tdee * purpose.energy, bm * 1.1);
  const method: Method = pf.purpose === "diet" ? pf.method : "balance";
  let p = Math.round(weight * purpose.pPerKg);
  let f: number;
  let c: number;
  if (method === "keto") {
    // 炭水化物は1日20〜50g（エネルギーの約5%）。たんぱく質は摂りすぎない（〜30%）。残りを脂質で。
    c = Math.min(50, Math.max(20, Math.round((target * 0.05) / 4)));
    p = Math.min(p, Math.round((target * 0.3) / 4));
    f = Math.round(Math.max(0, (target - p * 4 - c * 4) / 9));
  } else if (method === "lowfat") {
    // 脂質はエネルギーの20%（厚労省の目標量の下限。体重×0.6gは下回らない）。
    // 減量中はたんぱく質を少し多めに（体重×1.8g）。残りを炭水化物で。
    p = Math.round(weight * 1.8);
    f = Math.round(Math.max((target * 0.2) / 9, weight * 0.6));
    c = Math.round(Math.max(0, (target - p * 4 - f * 9) / 4));
  } else {
    f = Math.round(Math.max((target * purpose.fatPct) / 9, weight * 0.8));
    c = Math.round(Math.max(0, (target - p * 4 - f * 9) / 4));
  }
  const kcal = p * 4 + f * 9 + c * 4;
  const bmi = weight / (height / 100) ** 2;
  return {
    bmr: Math.round(bm / 10) * 10,
    tdee: Math.round(tdee / 10) * 10,
    kcal,
    p,
    f,
    c,
    bmi,
    age,
    weight,
    method,
  };
}

type MenuItem = { name: string; g: number };
type Meal = { title: string; items: MenuItem[] };

// 目標のPFCに近づくように、よくある食材で1日の食事例を組み立てる
function buildMenu(
  t: { kcal: number; p: number; f: number; c: number },
  method: Method
): {
  meals: Meal[];
  total: Totals;
} {
  if (method === "keto") return buildKetoMenu(t);
  const lean = method === "lowfat"; // 脂質を抑える：魚はタラ、卵は少なめ、ナッツなし
  const fishName = lean ? "タラ" : "サケ（焼き）";
  const get = (n: string) => byName.get(n)!;
  const rice = get("白ごはん");
  const chicken = get("鶏むね肉（皮なし）");
  const salmon = get(fishName);
  const oil = get("オリーブオイル");
  const s = Math.min(1.3, Math.max(0.7, t.kcal / 2200));
  const r5 = (x: number) => Math.max(0, Math.round(x / 5) * 5);

  const fixed: Record<string, MenuItem[]> = {
    朝食: [
      { name: "卵", g: lean ? 50 : Math.max(50, Math.round((100 * s) / 50) * 50) },
      { name: "納豆", g: 45 },
    ],
    昼食: [
      { name: "ブロッコリー", g: r5(80 * s) },
      { name: "トマト", g: r5(100 * s) },
    ],
    夕食: [
      { name: "キャベツ", g: r5(100 * s) },
      { name: "えのき", g: 50 },
    ],
    間食: [
      { name: "無糖ヨーグルト", g: Math.max(100, Math.round((150 * s) / 50) * 50) },
      { name: "バナナ", g: 100 },
      ...(lean ? [] : [{ name: "アーモンド", g: 10 }]),
    ],
  };
  const fx = sum(Object.values(fixed).flat().map((i) => ({ id: "", name: i.name, grams: i.g })));

  const meat = {
    p: (chicken.p + salmon.p) / 2,
    f: (chicken.f + salmon.f) / 2,
  };
  const alm = get("アーモンド");
  let R = 200;
  let M = 150;
  let O = 10;
  let A = 0; // 間食に足すアーモンド
  for (let i = 0; i < 60; i++) {
    const gap = t.f - fx.f - (rice.f * R) / 100 - (meat.f * M) / 100;
    O = Math.min(45, Math.max(0, gap / (oil.f / 100))); // 油は1日45gまで
    A = lean ? 0 : Math.min(40, Math.max(0, (gap - O) / (alm.f / 100))); // アーモンドは追加で40gまで
    R = Math.max(0, (t.c - fx.c - (alm.c * A) / 100) / (rice.c / 100));
    M = Math.max(0, (t.p - fx.p - (rice.p * R) / 100 - (alm.p * A) / 100) / (meat.p / 100));
  }
  const r10 = (x: number) => Math.max(0, Math.round(x / 10) * 10);
  const riceG = [0.3, 0.4, 0.3].map((w) => r10(R * w));
  const meatG = [r10(M * 0.5), r10(M * 0.5)];
  const oilG = [Math.round(O * 0.6), O - Math.round(O * 0.6)].map((x) => Math.max(0, Math.round(x)));
  const push = (arr: MenuItem[], name: string, g: number) => {
    if (g >= 5) arr.push({ name, g });
  };

  const meals: Meal[] = [
    { title: "朝食", items: [] },
    { title: "昼食", items: [] },
    { title: "夕食", items: [] },
    { title: "間食", items: [] },
  ];
  push(meals[0].items, "白ごはん", riceG[0]);
  meals[0].items.push(...fixed["朝食"]);
  push(meals[1].items, "白ごはん", riceG[1]);
  push(meals[1].items, "鶏むね肉（皮なし）", meatG[0]);
  meals[1].items.push(...fixed["昼食"]);
  push(meals[1].items, "オリーブオイル", oilG[0]);
  push(meals[2].items, "白ごはん", riceG[2]);
  push(meals[2].items, fishName, meatG[1]);
  meals[2].items.push(...fixed["夕食"]);
  push(meals[2].items, "オリーブオイル", oilG[1]);
  meals[3].items.push(
    ...fixed["間食"].map((i) =>
      i.name === "アーモンド" ? { name: i.name, g: i.g + r5(A) } : i
    )
  );

  const total = sum(
    meals.flatMap((m) => m.items).map((i) => ({ id: "", name: i.name, grams: i.g }))
  );
  return { meals, total };
}

// ケトジェニック用：ごはん・パン・麺を使わず、肉・魚・卵・チーズ・野菜・油で組み立てる
function buildKetoMenu(t: { kcal: number; p: number; f: number; c: number }): {
  meals: Meal[];
  total: Totals;
} {
  const get = (n: string) => byName.get(n)!;
  const thigh = get("鶏もも肉（皮つき）");
  const salmon = get("サケ（焼き）");
  const oil = get("オリーブオイル");
  const butter = get("バター");
  const s = Math.min(1.3, Math.max(0.8, t.kcal / 2200));
  const r5 = (x: number) => Math.max(0, Math.round(x / 5) * 5);
  const ent = (items: MenuItem[]) => items.map((i) => ({ id: "", name: i.name, grams: i.g }));

  const base: MenuItem[] = [
    { name: "卵", g: Math.max(100, Math.round((150 * s) / 50) * 50) },
    { name: "プロセスチーズ", g: 30 },
    { name: "アボカド", g: 70 },
    { name: "アーモンド", g: 20 },
  ];
  const baseSum = sum(ent(base));
  // 野菜は炭水化物の目標に合わせて量を決める
  const veg0: MenuItem[] = [
    { name: "ブロッコリー", g: 100 },
    { name: "キャベツ", g: 100 },
    { name: "トマト", g: 80 },
    { name: "えのき", g: 50 },
  ];
  const veg0Sum = sum(ent(veg0));
  const sv = Math.min(2, Math.max(0.4, (t.c - baseSum.c) / (veg0Sum.c || 1)));
  const veg = veg0.map((i) => ({ name: i.name, g: Math.max(20, r5(i.g * sv)) }));
  const fx = sum(ent([...base, ...veg]));

  const meat = { p: (thigh.p + salmon.p) / 2, f: (thigh.f + salmon.f) / 2 };
  const M = Math.min(400, Math.max(0, (t.p - fx.p) / (meat.p / 100)));
  const gap = Math.max(0, t.f - fx.f - (meat.f * M) / 100);
  const O = Math.min(60, (gap * 0.6) / (oil.f / 100));
  const B = Math.min(40, Math.max(0, (gap - O * (oil.f / 100)) / (butter.f / 100)));
  const r10 = (x: number) => Math.max(0, Math.round(x / 10) * 10);
  const r1g = (x: number) => Math.max(0, Math.round(x));
  const push = (arr: MenuItem[], name: string, g: number) => {
    if (g >= 5) arr.push({ name, g });
  };

  const meals: Meal[] = [
    { title: "朝食", items: [] },
    { title: "昼食", items: [] },
    { title: "夕食", items: [] },
    { title: "間食", items: [] },
  ];
  meals[0].items.push(base[0], base[2]);
  push(meals[0].items, "バター", r1g(B * 0.5));
  push(meals[1].items, "鶏もも肉（皮つき）", r10(M * 0.5));
  meals[1].items.push(veg[0], veg[1]);
  push(meals[1].items, "オリーブオイル", r1g(O * 0.6));
  push(meals[2].items, "サケ（焼き）", r10(M * 0.5));
  meals[2].items.push(veg[2], veg[3]);
  push(meals[2].items, "オリーブオイル", r1g(O * 0.4));
  push(meals[2].items, "バター", r1g(B * 0.5));
  meals[3].items.push(base[1], base[3]);

  const total = sum(ent(meals.flatMap((m) => m.items)));
  return { meals, total };
}

function ProfileGoal({
  setGoal,
  onAddMany,
}: {
  setGoal: (g: Goal) => void;
  onAddMany: (items: MenuItem[]) => void;
}) {
  const [pf, setPf] = useState<Profile>({
    sex: null,
    age: "",
    height: "",
    pal: "mid",
    weight: "",
    purpose: null,
    method: "balance",
  });
  const [added, setAdded] = useState(false);
  const latest = useRef(pf); // 続けて入力されても、常に最新の値を元に計算する

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-profile") || "null");
      if (s) {
        latest.current = { ...latest.current, ...s };
        setPf(latest.current);
      }
    } catch {}
  }, []);

  const update = (patch: Partial<Profile>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setPf(next);
    setAdded(false);
    try {
      localStorage.setItem("lg-profile", JSON.stringify(next));
    } catch {}
    const r = calcPlan(next);
    if (r) setGoal({ p: String(r.p), f: String(r.f), c: String(r.c) });
  };

  const plan = calcPlan(pf);
  const menu = useMemo(
    () => (plan ? buildMenu(plan, plan.method) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan?.kcal, plan?.p, plan?.f, plan?.c, plan?.method]
  );
  const [bLo, bHi] = plan ? bmiRange(plan.age) : [0, 0];
  const [pLo, pHi] = plan ? pRange(plan.age) : [0, 0];
  const pe = plan ? Math.round(((plan.p * 4) / plan.kcal) * 100) : 0;
  const fe = plan ? Math.round(((plan.f * 9) / plan.kcal) * 100) : 0;
  const ce = plan ? Math.round(((plan.c * 4) / plan.kcal) * 100) : 0;

  const field = (
    labelText: string,
    unit: string,
    key: "age" | "height" | "weight",
    ph: string
  ) => (
    <label className="afield">
      <span>{labelText}</span>
      <span className="gram">
        <input
          inputMode="decimal"
          value={pf[key]}
          onChange={(e) => update({ [key]: e.target.value } as Partial<Profile>)}
          placeholder={ph}
          aria-label={`${labelText}（${unit}）`}
        />
        {unit}
      </span>
    </label>
  );

  return (
    <div className="autogoal">
      <p className="agtitle">① あなたのこと</p>
      <div className="chips tight">
        {(
          [
            ["m", "男性"],
            ["f", "女性"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            className={pf.sex === k ? "chip on" : "chip"}
            onClick={() => update({ sex: k })}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="agrow">
        {field("年齢", "歳", "age", "30")}
        {field("身長", "cm", "height", "165")}
      </div>
      <p className="aglabel">ふだんの活動量</p>
      <div className="chips tight">
        {(Object.keys(PAL) as Pal[]).map((k) => (
          <button
            key={k}
            className={pf.pal === k ? "chip on" : "chip"}
            onClick={() => update({ pal: k })}
          >
            {PAL[k].label}
          </button>
        ))}
      </div>
      <p className="note">{PAL[pf.pal].desc}</p>

      <p className="agtitle">② 目標体重</p>
      <div className="agrow">{field("目標体重", "kg", "weight", "55")}</div>

      <p className="agtitle">③ 目的</p>
      <div className="chips tight">
        {(Object.keys(PURPOSES) as PurposeKey[]).map((k) => (
          <button
            key={k}
            className={pf.purpose === k ? "chip on" : "chip"}
            onClick={() => update({ purpose: k })}
          >
            {PURPOSES[k].label}
          </button>
        ))}
      </div>
      {pf.purpose && <p className="note">{PURPOSES[pf.purpose].desc}</p>}

      {pf.purpose === "diet" && (
        <>
          <p className="aglabel">ダイエットのやり方（PFCを見比べて選べます）</p>
          <div className="mcards">
            {(Object.keys(METHODS) as Method[]).map((k) => {
              const mp = calcPlan({ ...pf, method: k });
              return (
                <button
                  key={k}
                  className={pf.method === k ? "mcard on" : "mcard"}
                  onClick={() => update({ method: k })}
                >
                  <b>{METHODS[k].label}</b>
                  {mp ? (
                    <>
                      <span>P {mp.p}g</span>
                      <span>F {mp.f}g</span>
                      <span>C {mp.c}g</span>
                      <em>
                        F{Math.round(((mp.f * 9) / mp.kcal) * 100)}% / C
                        {Math.round(((mp.c * 4) / mp.kcal) * 100)}%
                      </em>
                    </>
                  ) : (
                    <em>数値は入力後に表示</em>
                  )}
                </button>
              );
            })}
          </div>
          <p className="note">{METHODS[pf.method].desc}</p>
          <Link href="/nutrients#diets" className="evlink">
            研究・根拠のまとめを見る ›
          </Link>
        </>
      )}

      {!plan && (
        <p className="note">
          性別・年齢（18歳以上）・身長・目標体重を入れて、目的を選ぶと、目標のPFCが自動で入ります。
        </p>
      )}

      {plan && pf.purpose && (
        <>
          <div className="agresult">
            <div className="agkcal">
              1日の目標 <b>{plan.kcal}</b> kcal
            </div>
            <PfcRow p={plan.p} f={plan.f} c={plan.c} />
            <p className="agnote">
              エネルギー比 P{pe}% / F{fe}% / C{ce}%　（厚生労働省の目標量: P{pLo}〜{pHi}%・F20〜30%・C50〜65%）
            </p>
            {(pe > pHi || pe < pLo || fe < 20 || fe > 30 || ce < 50 || ce > 65) && (
              <p className="agnote">
                ※ この配分は、食事摂取基準の目標量の範囲から外れています
                {[
                  pe > pHi || pe < pLo ? "たんぱく質" : "",
                  fe < 20 || fe > 30 ? "脂質" : "",
                  ce < 50 || ce > 65 ? "炭水化物" : "",
                ]
                  .filter(Boolean)
                  .join("・")
                  .replace(/^/, "（")
                  .replace(/$/, "）")}
                。目的に合わせた配分のためで、長く続ける場合は医師や管理栄養士に相談してください。
              </p>
            )}
            {plan.method === "keto" && pf.purpose === "diet" && (
              <p className="caution">
                ⚠ ケトジェニックは糖質を大きく減らす食事法で、長期の安全性は十分に確立されていません。糖尿病などで薬を使っている方、腎臓・肝臓の病気がある方、妊娠・授乳中の方、摂食障害の経験がある方は、必ず医師に相談してください。食物繊維が不足しやすく、便秘や体調不良が出ることもあります。
              </p>
            )}
            <dl className="agdl">
              <dt>基礎代謝</dt>
              <dd>約{plan.bmr}kcal</dd>
              <dt>1日の消費目安</dt>
              <dd>約{plan.tdee}kcal（基礎代謝×活動量{PAL[pf.pal].v}）</dd>
              <dt>目標体重のBMI</dt>
              <dd>
                {r1(plan.bmi)}
                {plan.bmi < bLo
                  ? `（目標とする範囲 ${bLo}〜${bHi} より低めです）`
                  : plan.bmi > bHi
                  ? `（目標とする範囲 ${bLo}〜${bHi} より高めです）`
                  : `（目標とする範囲 ${bLo}〜${bHi} に入っています）`}
              </dd>
            </dl>
          </div>

          {menu && (
            <div className="agmenu">
              <p className="agtitle">その目標に近づく、1日の食事の例</p>
              {menu.meals.map((m) => (
                <div key={m.title} className="agmeal">
                  <b>{m.title}</b>
                  <ul>
                    {m.items.map((i) => {
                      const food = byName.get(i.name)!;
                      const hint = describeAmount(food, i.g);
                      return (
                        <li key={i.name}>
                          {i.name} <span className="muted">約{i.g}g{hint && `（${hint}）`}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <p className="agnote">
                この例の合計: {Math.round(menu.total.kcal)}kcal ／ P{r1(menu.total.p)}g F
                {r1(menu.total.f)}g C{r1(menu.total.c)}g（目標との差 P{menu.total.p - plan.p >= 0 ? "+" : ""}
                {r1(menu.total.p - plan.p)}g F{menu.total.f - plan.f >= 0 ? "+" : ""}
                {r1(menu.total.f - plan.f)}g C{menu.total.c - plan.c >= 0 ? "+" : ""}
                {r1(menu.total.c - plan.c)}g）
              </p>
              <button
                className="small"
                onClick={() => {
                  onAddMany(menu.meals.flatMap((m) => m.items));
                  setAdded(true);
                }}
              >
                {added ? "✓ この日の記録に追加しました" : "＋ この例を今日の記録に追加"}
              </button>
              <p className="agnote">
                食材は一例です。同じ栄養の食品に置きかえても大丈夫です（「食品を探す」で調べられます）。
              </p>
            </div>
          )}
        </>
      )}

      <p className="note">
        目安の計算です。基礎代謝は国立健康・栄養研究所の推定式、BMIとPFCの範囲は「日本人の食事摂取基準（2025年版）」を参考にしています。体調や持病、妊娠・授乳中の方は医師や管理栄養士に相談してください。結果は下の欄で自由に調整できます。
      </p>
    </div>
  );
}
function DayView({
  date,
  entries,
  goal,
  setGoal,
  onAdd,
  onRemove,
  log,
}: {
  date: string;
  entries: Entry[];
  goal: Goal;
  setGoal: (g: Goal) => void;
  onAdd: (name: string, grams: number) => void;
  onRemove: (id: string) => void;
  log: Log;
}) {
  const total = useMemo(() => sum(entries), [entries]);
  const t = { p: num(goal.p), f: num(goal.f), c: num(goal.c) };
  const [shareText, setShareText] = useState("");
  const [msg, setMsg] = useState("");

  const suggestions = useMemo(() => {
    const r = {
      p: Math.max(0, t.p - total.p),
      f: Math.max(0, t.f - total.f),
      c: Math.max(0, t.c - total.c),
    };
    const need = r.p + r.f + r.c;
    if (need === 0) return [];
    return FOODS.map((food) => {
      let s = MAX_GRAMS[food.cat] / 100; // 1回あたりの現実的な上限
      (["p", "f", "c"] as const).forEach((k) => {
        const per = food[k] / 100;
        if (per > 0 && r[k] > 0) s = Math.min(s, (r[k] * 1.1) / per / 100);
        if (per > 0.02 && r[k] === 0) s = 0;
      });
      const grams = Math.round((s * 100) / 5) * 5;
      const g = grams / 100;
      const got = { p: food.p * g, f: food.f * g, c: food.c * g };
      const covered =
        (Math.min(got.p, r.p) + Math.min(got.f, r.f) + Math.min(got.c, r.c)) /
        need;
      return { food, grams, got, covered };
    })
      .filter((x) => x.grams >= 10 && x.covered > 0.05)
      .sort((a, b) => b.covered - a.covered)
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, total.p, total.f, total.c]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    (
      [
        ["p", "たんぱく質"],
        ["f", "脂質"],
        ["c", "炭水化物"],
      ] as const
    ).forEach(([k, name]) => {
      if (t[k] > 0 && total[k] > t[k] * 1.1) w.push(`${name}が目標を超えています`);
    });
    MICROS.forEach((m) => {
      const limit = LIMITS[m.key];
      if (limit !== undefined && total[m.key] > limit)
        w.push(`${m.label}が1日の上限の目安（${limit}${m.unit}）を超えています`);
    });
    return w;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, total]);

  const buildText = () => {
    const lines = [
      `【LIFEGYM PFC記録】${label(date)}`,
      `目標 P${r1(t.p)} / F${r1(t.f)} / C${r1(t.c)} g`,
      `合計 P${r1(total.p)} / F${r1(total.f)} / C${r1(total.c)} g（${Math.round(
        total.kcal
      )}kcal）`,
      `食物繊維${r1(total.fi)}g ビタミンC${r1(total.vc)}mg カルシウム${r1(
        total.ca
      )}mg 鉄${r1(total.fe)}mg 塩分${r1(total.salt)}g`,
      ...warnings.map((w) => `⚠ ${w}`),
      "",
      ...entries.map((e) => `・${e.name} ${e.grams}g`),
    ];
    return lines.join("\n");
  };

  const share = async () => {
    const text = buildText();
    setMsg("");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    setShareText(text);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setMsg("コピーしました");
    } catch {
      setMsg("上の文章を選択してコピーしてください");
    }
  };

  const exportCsv = () => {
    const rows = ["日付,食品,グラム,P,F,C,kcal,塩分g"];
    Object.keys(log)
      .sort()
      .forEach((d) =>
        log[d].forEach((e) => {
          const s = sum([e]);
          rows.push(
            [
              d,
              e.name,
              e.grams,
              r1(s.p),
              r1(s.f),
              r1(s.c),
              Math.round(s.kcal),
              r1(s.salt),
            ].join(",")
          );
        })
      );
    const blob = new Blob(["﻿" + rows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifegym-pfc.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <h2 className="h2">{label(date)}</h2>

      <div className="card">
        <p className="cardtitle">目標のPFC</p>
        <ProfileGoal setGoal={setGoal} onAddMany={(items) => items.forEach((i) => onAdd(i.name, i.g))} />
        <p className="cardtitle">目標の量（g）— 手動で調整もできます</p>
        <div className="inputs">
          {(
            [
              ["p", "P たんぱく質"],
              ["f", "F 脂質"],
              ["c", "C 炭水化物"],
            ] as const
          ).map(([k, name]) => (
            <label key={k}>
              <i className={`dot ${k}`} />
              {name}
              <input
                inputMode="decimal"
                value={goal[k]}
                onChange={(e) => setGoal({ ...goal, [k]: e.target.value })}
                placeholder="0"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="kcal">
          合計 <b>{Math.round(total.kcal)}</b> kcal
          {t.p + t.f + t.c > 0 && (
            <span className="muted"> ／ 目標 {Math.round(t.p * 4 + t.f * 9 + t.c * 4)} kcal</span>
          )}
        </div>
        <Progress name="たんぱく質" cls="p" value={total.p} target={t.p} />
        <Progress name="脂質" cls="f" value={total.f} target={t.f} />
        <Progress name="炭水化物" cls="c" value={total.c} target={t.c} />
        <Micros food={total} g={1} warn />
        {warnings.length > 0 && (
          <ul className="alert" role="alert">
            {warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <p className="cardtitle">食べたもの</p>
        {entries.length === 0 && (
          <p className="note">
            まだありません。下の提案か「食品を探す」から追加しましょう。
          </p>
        )}
        <ul className="rows">
          {entries.map((e) => {
            const s = sum([e]);
            return (
              <li key={e.id} className="entry">
                <span>
                  {e.name}{" "}
                  <span className="muted">
                    {e.grams}g
                    {byName.get(e.name) &&
                      describeAmount(byName.get(e.name)!, e.grams) &&
                      `（${describeAmount(byName.get(e.name)!, e.grams)}）`}
                  </span>
                </span>
                <span className="muted">
                  P{r1(s.p)} F{r1(s.f)} C{r1(s.c)}
                </span>
                <button
                  className="del"
                  onClick={() => onRemove(e.id)}
                  aria-label={`${e.name}を削除`}
                >
                  削除
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {suggestions.length > 0 && (
        <div className="card">
          <p className="cardtitle">目標に近づく食品</p>
          <p className="note">残りのPFCに合う食品です。「追加」で合計に足せます。</p>
          <ul className="rows">
            {suggestions.map(({ food, grams, got, covered }) => (
              <li key={food.name}>
                <div className="rowhead">
                  <span>{food.name}</span>
                  <span className="muted">
                    {grams}g・残りの{Math.round(covered * 100)}%
                  </span>
                </div>
                {describeAmount(food, grams) && (
                  <p className="amountnote">目安: {describeAmount(food, grams)}</p>
                )}
                <PfcRow p={got.p} f={got.f} c={got.c} />
                <button className="small" onClick={() => onAdd(food.name, grams)}>
                  ＋ 追加
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button className="btn" onClick={share} disabled={entries.length === 0}>
          この日を共有
        </button>
        <button className="btn ghost" onClick={exportCsv}>
          CSVで保存
        </button>
      </div>
      <p className="note">
        記録は自動でこの端末のブラウザに保存されます。端末をまたいで見るときは共有やCSVをお使いください。
      </p>

      {shareText && (
        <div className="card">
          <textarea className="sharebox" readOnly value={shareText} rows={8} />
          <button className="small" onClick={copy}>
            コピー
          </button>
          {msg && <span className="muted"> {msg}</span>}
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"record" | "search">("record");
  const [log, setLog] = useState<Log>({});
  const [goal, setGoal] = useState<Goal>({ p: "", f: "", c: "" });
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(key(new Date()));
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem("lg-log") || "null");
      if (l) setLog(l);
      const g = JSON.parse(localStorage.getItem("lg-goal") || "null");
      if (g) setGoal(g);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-log", JSON.stringify(log));
      localStorage.setItem("lg-goal", JSON.stringify(goal));
    } catch {}
  }, [log, goal, loaded]);

  const add = (name: string, grams: number) =>
    setLog((l) => ({
      ...l,
      [selected]: [
        ...(l[selected] ?? []),
        { id: crypto.randomUUID(), name, grams },
      ],
    }));

  const remove = (id: string) =>
    setLog((l) => ({
      ...l,
      [selected]: (l[selected] ?? []).filter((e) => e.id !== id),
    }));

  const pick = (k: string) => {
    setSelected(k);
    const [y, m] = k.split("-");
    setMonth(new Date(+y, +m - 1, 1));
  };

  return (
    <main className="container">
      <header className="brandbar">
        <span className="brand">LIFEGYM</span>
        <Link href="/nutrients" className="guidebtn">
          📖 栄養素ガイド
        </Link>
      </header>
      <h1 className="title">専属の栄養士</h1>
      <p className="tagline">PFCをはかって、理想のカラダへ。</p>
      <p className="member">LIFEGYM会員様専用アプリ</p>

      <QuoteHero />

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "record"}
          onClick={() => setTab("record")}
        >
          記録・目標
        </button>
        <button
          role="tab"
          aria-selected={tab === "search"}
          onClick={() => setTab("search")}
        >
          食品を探す
        </button>
      </div>

      {tab === "record" ? (
        <>
          <Calendar
            month={month}
            setMonth={setMonth}
            selected={selected}
            setSelected={pick}
            log={log}
            goal={goal}
          />
          <DayView
            date={selected}
            entries={log[selected] ?? []}
            goal={goal}
            setGoal={setGoal}
            onAdd={add}
            onRemove={remove}
            log={log}
          />
        </>
      ) : (
        <Search
          date={selected}
          onAdd={(n, g) => {
            add(n, g);
          }}
        />
      )}
    </main>
  );
}
