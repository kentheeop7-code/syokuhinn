"use client";

import StatusBar from "./StatusBar";
import MeCard from "./MeCard";
import NationalGuide from "./NationalGuide";
import LineShare from "./LineShare";
import { readMe, useMe, REF as ME_REF } from "./me";
import type { KcalType } from "./MyKcal";
import MyKcal from "./MyKcal";
import Fold from "./Fold";
import ProductSearch from "./ProductSearch";
import BalanceCheck from "./BalanceCheck";
import SymptomCheck from "./SymptomCheck";
import RelatedProducts from "./RelatedProducts";
import ShareQR from "./ShareQR";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QuoteHero from "./QuoteHero";
import WeightChart from "./WeightChart";
import MealCompare from "./MealCompare";
import AgeCompare, { AgeNotesBox } from "./AgeCompare";
import WomenGuide from "./WomenGuide";
import WomenCare from "./WomenCare";
import BoneMenu from "./BoneMenu";
import CycleTracker from "./CycleTracker";
import WomenDaily from "./WomenDaily";
import TipsTicker from "./TipsTicker";
import {
  CATEGORIES,
  APPROX,
  APPROX_NOTE,
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

type SortKey = "default" | "p" | "pk" | "f" | "kcal" | "fi" | "salt";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "標準" },
  { key: "p", label: "たんぱく質が多い" },
  { key: "pk", label: "100kcalあたりのたんぱく質" },
  { key: "f", label: "脂質が少ない" },
  { key: "kcal", label: "カロリーが低い" },
  { key: "fi", label: "食物繊維が多い" },
  { key: "salt", label: "塩分が少ない" },
];

const kcalOf = (x: Pick<Food, "p" | "f" | "c">) => x.p * 4 + x.f * 9 + x.c * 4;
const MAX_COMPARE = 4;

function FoodRow({
  food,
  onAdd,
  picked,
  canPick,
  onPick,
}: {
  food: Food;
  onAdd: (name: string, grams: number) => void;
  picked: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  const [grams, setGrams] = useState("100");
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  const g = num(grams) / 100;
  const portions = portionsOf(food);

  return (
    <li className="frow">
      <div className="frhead">
        <div className="frname">
          {food.name}
          {APPROX.has(food.name) && <span className="approx">概算値</span>}
        </div>
        <div className="frkcal">
          <b>{Math.round(kcalOf(food) * g)}</b>
          <small>kcal</small>
        </div>
      </div>
      {APPROX_NOTE[food.name] && <p className="amountnote">{APPROX_NOTE[food.name]}</p>}

      <div className="frpfc">
        <span className="p">
          <i className="dot p" />P <b>{r1(food.p * g)}</b>g
        </span>
        <span className="f">
          <i className="dot f" />F <b>{r1(food.f * g)}</b>g
        </span>
        <span className="c">
          <i className="dot c" />C <b>{r1(food.c * g)}</b>g
        </span>
      </div>
      <PfcBars p={food.p * g} f={food.f * g} c={food.c * g} />

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

      <div className="rowbtns">

        <button
          className={picked ? "small cmp on" : "small cmp"}
          disabled={!picked && !canPick}
          onClick={onPick}
        >
          {picked ? "✓ 比較中" : canPick ? "⇄ 比較に入れる" : "比較は4つまで"}
        </button>
        <button className="linkbtn" onClick={() => setOpen(!open)} aria-expanded={open}>
          くわしい栄養素 {open ? "▴" : "▾"}
        </button>
      </div>
      {open && <Micros food={food} g={g} />}
    </li>
  );
}

function ComparePanel({
  names,
  onRemove,
  onClear,
}: {
  names: string[];
  onRemove: (n: string) => void;
  onClear: () => void;
}) {
  const [basis, setBasis] = useState<"100g" | "100kcal">("100g");
  const [more, setMore] = useState(false);
  const list = names.map((n) => byName.get(n)).filter(Boolean) as Food[];
  // 100kcal基準のときは、各食品を「100kcalぶん」に換算して比べる
  const k = (x: Food) => (basis === "100g" ? 1 : 100 / Math.max(1, kcalOf(x)));

  type Row = {
    label: string;
    unit: string;
    get: (x: Food) => number;
    best?: "high" | "low";
    digits?: number;
  };
  const rows: Row[] =
    basis === "100g"
      ? [{ label: "エネルギー", unit: "kcal", get: (x) => kcalOf(x), best: "low", digits: 0 }]
      : [{ label: "100kcalの重さ", unit: "g", get: (x) => 10000 / Math.max(1, kcalOf(x)), digits: 0 }];
  rows.push(
    { label: "たんぱく質 P", unit: "g", get: (x) => x.p * k(x), best: "high" },
    { label: "脂質 F", unit: "g", get: (x) => x.f * k(x), best: "low" },
    { label: "炭水化物 C", unit: "g", get: (x) => x.c * k(x) },
    { label: "食物繊維", unit: "g", get: (x) => x.fi * k(x), best: "high" },
    { label: "塩分", unit: "g", get: (x) => x.salt * k(x), best: "low" }
  );
  if (more) {
    MICROS.filter((m) => !["fi", "salt"].includes(m.key)).forEach((m) =>
      rows.push({
        label: m.label,
        unit: m.unit,
        get: (x) => x[m.key] * k(x),
        best: "high",
        digits: m.key === "b1" ? 2 : 1,
      })
    );
  }

  return (
    <div className="cmp card">
      <div className="cmphead">
        <b>食品を比べる</b>
        <button className="linkbtn" onClick={onClear}>
          すべて外す
        </button>
      </div>
      <div className="chips tight">
        {(
          [
            ["100g", "同じ100gで比べる"],
            ["100kcal", "同じ100kcalで比べる"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={basis === key ? "chip on" : "chip"}
            onClick={() => setBasis(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {list.length < 2 ? (
        <p className="note">
          食品の「⇄ 比較に入れる」を押して、2つ以上選ぶと、ここに並べて表示します（最大4つ）。
        </p>
      ) : (
        <>
          <div className="cmpwrap">
            <table className="cmptable">
              <thead>
                <tr>
                  <th aria-label="項目" />
                  {list.map((x) => (
                    <th key={x.name}>
                      <span>{x.name}</span>
                      <button
                        className="cmpx"
                        onClick={() => onRemove(x.name)}
                        aria-label={`${x.name}を比較から外す`}
                      >
                        ×
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const vals = list.map((x) => r.get(x));
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  return (
                    <tr key={r.label}>
                      <th scope="row">
                        {r.label}
                        <small>{r.unit}</small>
                      </th>
                      {vals.map((v, i) => {
                        const isBest =
                          max !== min &&
                          ((r.best === "high" && v === max) || (r.best === "low" && v === min));
                        const d = r.digits ?? 1;
                        return (
                          <td key={list[i].name} className={isBest ? "best" : ""}>
                            {d === 0 ? Math.round(v) : Math.round(v * 10 ** d) / 10 ** d}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="agnote">
            緑の太字は、ダイエット中に有利な側です（たんぱく質・食物繊維・ビタミン・ミネラルは多い、カロリー・脂質・塩分は少ない）。
          </p>
          <button className="linkbtn" onClick={() => setMore(!more)}>
            ビタミン・ミネラルも比べる {more ? "▴" : "▾"}
          </button>
        </>
      )}
    </div>
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
  const [sort, setSort] = useState<SortKey>("default");
  const [picked, setPicked] = useState<string[]>([]);

  const key: Record<SortKey, (x: Food) => number> = {
    default: () => 0,
    p: (x) => -x.p,
    pk: (x) => -(x.p / Math.max(1, kcalOf(x))),
    f: (x) => x.f,
    kcal: (x) => kcalOf(x),
    fi: (x) => -x.fi,
    salt: (x) => x.salt,
  };
  const hits = FOODS.filter(
    (x) => (cat === "すべて" || x.cat === cat) && x.name.includes(q.trim())
  );
  const shown =
    sort === "default"
      ? hits
      : [...hits]
          // エネルギーがごく小さい食品（調味料など）は、並び替えの上位に出ないようにする
          .filter((x) => sort !== "pk" || kcalOf(x) >= 20)
          .sort((a, b) => key[sort](a) - key[sort](b));

  const toggle = (n: string) =>
    setPicked((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].slice(0, MAX_COMPARE)));

  return (
    <section>
      <input
        className="textinput full"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="食品名で検索（例: 鶏、ごはん、麦）"
        aria-label="食品名"
      />
      <p className="aglabel">分類</p>
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
      <p className="aglabel">並び替え</p>
      <div className="chips">
        {SORTS.map((o) => (
          <button
            key={o.key}
            className={o.key === sort ? "chip on" : "chip"}
            onClick={() => setSort(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {picked.length > 0 && (
        <ComparePanel
          names={picked}
          onRemove={(n) => setPicked((cur) => cur.filter((x) => x !== n))}
          onClear={() => setPicked([])}
        />
      )}

      <p className="note">
        {shown.length}件。初めは100gあたりの値です。目安ボタンやグラム数で、量ごとの栄養を確かめられます（記録は、いりません）。
      </p>
      <p className="note">
        数値は文部科学省「日本食品標準成分表（八訂）増補2023年」を元にしています（「概算値」は公式に同じ食品がないものです）。
      </p>
      {shown.length === 0 && <p className="note">見つかりませんでした。</p>}
      <ul className="rows card flist">
        {shown.map((x) => (
          <FoodRow
            key={x.name}
            food={x}
            onAdd={onAdd}
            picked={picked.includes(x.name)}
            canPick={picked.length < MAX_COMPARE}
            onPick={() => toggle(x.name)}
          />
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

  const [open, setOpen] = useState(false);
  const [sy, sm, sd] = selected.split("-").map(Number);
  const selDate = new Date(sy, sm - 1, sd);
  const step = (n: number) => {
    const d = new Date(sy, sm - 1, sd + n);
    setSelected(key(d));
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const toToday = () => {
    const d = new Date();
    setSelected(key(d));
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const selStatus = status(selected);

  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className="card cal compact">
      <div className="calbar">
        <button aria-label="前の日" onClick={() => step(-1)}>
          ‹
        </button>
        <div className="caltoday">
          <b>
            {sm}月{sd}日（{["日", "月", "火", "水", "木", "金", "土"][selDate.getDay()]}）
          </b>
          {selected === today ? (
            <span className="todaybadge">今日</span>
          ) : (
            <button className="tobtn" onClick={toToday}>
              今日へ
            </button>
          )}
          {selStatus && <i className={`mark ${selStatus}`} />}
        </div>
        <button aria-label="次の日" onClick={() => step(1)}>
          ›
        </button>
        <button className="calopen" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          📅 {open ? "閉じる" : "月を見る"}
        </button>
      </div>
      {open && (
      <>
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
      </>
      )}
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
  // 年齢に合わせた調整：60歳以上は、食事を減らす幅を小さく（ダイエットは1割→7%減）、たんぱく質は上限を設ける
  const energyMul = pf.purpose === "diet" && age >= 60 ? 0.93 : purpose.energy;
  const ageCap = age >= 60 ? (pf.purpose === "diet" ? 1.3 : 1.5) : age >= 50 ? 1.6 : 9;
  const target = Math.max(tdee * energyMul, bm * 1.1);
  const method: Method = pf.purpose === "diet" ? pf.method : "balance";
  let p = Math.round(weight * Math.min(purpose.pPerKg, ageCap));
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
    p = Math.round(weight * Math.min(1.8, ageCap));
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
  onAddMany?: (items: MenuItem[]) => void;
}) {
  const [pf, setPf] = useState<Profile>({
    sex: "f",
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
        latest.current = { ...latest.current, ...s, sex: readMe().sex === 2 ? "m" : "f" }; // 性別は、全ページ共通の設定を使う
        setPf(latest.current);
      }
    } catch {}
  }, []);

  const me = useMe();
  useEffect(() => {
    if (latest.current.sex === me.sexKey) return;
    latest.current = { ...latest.current, sex: me.sexKey };
    setPf(latest.current);
    const r = calcPlan(latest.current);
    if (r) setGoal({ p: String(r.p), f: String(r.f), c: String(r.c) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.sexKey]);

  const update = (patch: Partial<Profile>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setPf(next);
    setAdded(false);
    try {
      localStorage.setItem("lg-profile", JSON.stringify(next));
      window.dispatchEvent(new Event("lg-profile-change"));
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
      <div className="mechips two">
        {[1, 2].map((v) => (
          <button key={v} type="button" aria-pressed={me.sex === v} className={me.sex === v ? "on" : ""} onClick={() => me.set({ sex: v as 1 | 2 })}>
            {v === 1 ? "女性" : "男性"}
          </button>
        ))}
      </div>
      <p className="agnote">{me.sexKey === "f" ? "女性" : "男性"}のからだに合わせた式（国立健康・栄養研究所の推定式）で計算します。</p>
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
          年齢（18歳以上）・身長・目標体重を入れて、目的を選ぶと、目標のPFCが自動で入ります。{num(pf.age) > 0 && num(pf.age) < 18 && " 中学生・高校生は、成長期のため、体重を減らす目標の自動計算は、おすすめしません。上の「あなたの1日の目安」で、必要な量を確認してください。"}
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
            <AgeNotesBox age={plan.age} sex={pf.sex} />
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
  const [showMicros, setShowMicros] = useState(false);
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

      <h3 className="sec">
        <span>1</span>目標を決める
      </h3>
      <div className="card">
        <p className="cardtitle">目標のPFC</p>
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

      <h3 className="sec">
        <span>2</span>今日の合計と、目標との差
      </h3>
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
        <button
          className="linkbtn microtoggle"
          onClick={() => setShowMicros(!showMicros)}
          aria-expanded={showMicros}
        >
          ビタミン・ミネラル・塩分を見る {showMicros ? "▴" : "▾"}
        </button>
        {showMicros && <Micros food={total} g={1} warn />}
        {warnings.length > 0 && (
          <ul className="alert" role="alert">
            {warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <h3 className="sec">
        <span>3</span>今日食べたもの
      </h3>
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
        <>
        <h3 className="sec">
          <span>4</span>目標に近づく食品
        </h3>
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
        </>
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

const MEAL_TIPS: Record<string, string> = {
  朝食: "たんぱく質を忘れずに（卵・納豆・ヨーグルト）。血糖値の上がりすぎをおさえ、午前中の集中力にも。",
  昼食: "いちばんしっかり食べる時間。主食・主菜・野菜を、そろえやすい。外食のときは、定食を選ぶと整えやすい。",
  夕食: "寝る2〜3時間前までに。炭水化物は少なめにしすぎず、野菜・きのこで量を出す。",
  間食: "ヨーグルト・果物・ナッツなど、栄養のあるものを。お菓子にしたいときは、量を決めて食べる。",
};

const SWAPS: { from: string; to: string }[] = [
  { from: "鶏むね肉 100g（たんぱく質 約23g）", to: "サケ 100g／卵 4個／納豆 3パック／木綿豆腐 350g" },
  { from: "白ごはん 150g（炭水化物 約55g）", to: "食パン 6枚切り 2枚／ゆでうどん 250g／もち麦ごはん 150g（食物繊維が増える）" },
  { from: "オリーブオイル 10g（脂質 10g）", to: "アーモンド 17g／バター 12g／マヨネーズ 14g" },
  { from: "バナナ 100g（炭水化物 約22g）", to: "りんご 150g／みかん 180g／さつまいも 70g" },
];

const REF_NUTRI: { key: "fi" | "ca" | "fe" | "vc" | "salt"; label: string; unit: string; ref: string; kind: "min" | "max"; v: number }[] = [
  { key: "fi", label: "食物繊維", unit: "g", ref: "18g以上", kind: "min", v: 18 },
  { key: "ca", label: "カルシウム", unit: "mg", ref: "650mg前後", kind: "min", v: 650 },
  { key: "fe", label: "鉄", unit: "mg", ref: "10mg前後（月経がある人）", kind: "min", v: 10 },
  { key: "vc", label: "ビタミンC", unit: "mg", ref: "100mg", kind: "min", v: 100 },
  { key: "salt", label: "食塩相当量", unit: "g", ref: "6.5g未満", kind: "max", v: 6.5 },
];

const KCAL_PRESETS = [1200, 1400, 1600, 1800, 2000, 2200];

type KGoal = "cut" | "keep" | "gain";
type KTrain = "none" | "some" | "much";

const K_GOALS: Record<KGoal, { label: string; icon: string; desc: string; fatPct: number; type: KcalType }> = {
  cut: { label: "ダイエット（体脂肪を減らす）", icon: "🔻", desc: "筋肉を守りながら、体脂肪を落とす。", fatPct: 0.22, type: "protein" },
  keep: { label: "いまの体型をキープ", icon: "⚖️", desc: "体重・体脂肪を保ちながら、体調を整える。", fatPct: 0.25, type: "balance" },
  gain: { label: "筋肉をつける（ボディメイク）", icon: "💪", desc: "筋肉を増やす。少し多めに食べて、筋トレで刺激を。", fatPct: 0.25, type: "balance" },
};
const K_TRAIN: Record<KTrain, string> = { none: "筋トレはしていない", some: "週1〜2回", much: "週3回以上" };

// 体重1kgあたりのたんぱく質（g）：[目安, 下限, 上限]
const K_PROT: Record<KGoal, Record<KTrain, [number, number, number]>> = {
  cut: { none: [1.4, 1.2, 1.6], some: [1.8, 1.6, 2.2], much: [2.0, 1.8, 2.4] },
  keep: { none: [1.1, 1.0, 1.2], some: [1.4, 1.2, 1.6], much: [1.6, 1.4, 2.0] },
  gain: { none: [1.4, 1.2, 1.6], some: [1.7, 1.6, 2.0], much: [1.9, 1.6, 2.2] },
};

const K_EVID: Record<KGoal, { title: string; items: string[] }> = {
  cut: {
    title: "ダイエットの根拠",
    items: [
      "減量の中心は、エネルギー収支（食べる量＜使う量）。配分（PFC）の違いより、続けられる量と、たんぱく質の確保が大切です。",
      "減らす幅は、消費カロリーの10〜25%、体重の減るペースは、週に体重の0.5〜1%以内が目安。急ぎすぎると、筋肉も減りやすくなります（Helms 2014）。",
      "筋トレをしている人が、カロリー制限中に筋肉を守るには、通常より多めのたんぱく質（体重1kgあたり約1.6〜2.2g、研究によってはそれ以上）が有利です（ISSN 2017）。",
      "脂質は、エネルギーの20%前後を下回らないように。ホルモンの材料・脂溶性ビタミンの吸収に必要です。炭水化物は、のこりで。トレーニングの日は、減らしすぎない。",
      "女性は、エネルギー不足が続くと、月経不順・骨密度の低下・疲労骨折につながります（低エネルギー・アベイラビリティ／RED-S、IOC 2018）。",
      "長い減量では、2週間ほど、消費カロリーに近い食事に戻す「ダイエットブレイク」が、体重減少の効率を上げた研究があります（男性・肥満者対象のMATADOR試験）。女性での確立された方法ではないため、参考程度に。",
    ],
  },
  keep: {
    title: "キープの根拠",
    items: [
      "消費カロリーと、食べるカロリーを、そろえる。体重の増減が、1か月で±1%以内なら、ほぼ維持できています。",
      "たんぱく質は、体重1kgあたり1.0〜1.6g。40代以降は、筋肉が減りやすいので、少し多めに、毎食に分けます（食事摂取基準2025・ISSN 2017）。",
      "PFCは、食事摂取基準の目標量の範囲：たんぱく質13〜20%（50歳以上14〜20%）、脂質20〜30%、炭水化物50〜65%。",
    ],
  },
  gain: {
    title: "筋肉をつける根拠",
    items: [
      "筋肉が増えるには、①筋トレなどの刺激、②たんぱく質、③消費より少し多いエネルギー、の3つが必要です。",
      "筋トレをしている人のたんぱく質は、体重1kgあたり1.4〜2.0gで足りる人が多い（ISSN 2017）。約1.6g/日を超えても、筋肉の増加は、それ以上は増えにくいという分析があります（Morton 2018）。",
      "エネルギーは、消費の+5〜15%ほどを、目安に。食べすぎると、体脂肪が先に増えるので、体重は、月に0.5〜1%の増加を目安にします。",
      "1食のたんぱく質は、体重1kgあたり0.3〜0.5g（体重55kgで約17〜28g）を、1日3〜4回に分けると、筋肉の合成に、使いやすい。",
      "炭水化物は、トレーニングの前後に、しっかり。不足すると、トレーニングの質が落ちます。睡眠は7時間以上、回復も大切です。",
    ],
  },
};

// 一番上で「1日のカロリー」を決めると、PFCのバランスと、1日の食事例がすぐ分かる
function KcalSetter({
  setGoal,
  onAddMany,
}: {
  setGoal: (g: Goal) => void;
  onAddMany?: (items: MenuItem[]) => void;
}) {
  const me = useMe();
  const [kcal, setKcal] = useState("1800");
  const [kgoal, setKgoal] = useState<KGoal>("cut");
  const [train, setTrain] = useState<KTrain>("some");
  const [weight, setWeight] = useState("");
  const [prof, setProf] = useState<{ age: number; height: number; pal: Pal } | null>(null);
  const [done, setDone] = useState<"" | "goal" | "log">("");
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-kcal") || "null");
      if (s?.kcal) setKcal(String(s.kcal));
      if (s?.kgoal && s.kgoal in K_GOALS) setKgoal(s.kgoal);
      if (s?.train && s.train in K_TRAIN) setTrain(s.train);
      const now = localStorage.getItem("lg-now");
      if (s?.weight) setWeight(String(s.weight));
      else if (now) setWeight(String(now));
      const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
      if (p && num(p.age) >= 18 && num(p.height) >= 120) setProf({ age: num(p.age), height: num(p.height), pal: (p.pal in PAL ? p.pal : "mid") as Pal });
    } catch {}
    setLoaded(true);
  }, []);

  const k = num(kcal);
  const w = num(weight);
  const wOk = w >= 30 && w <= 200;
  const valid = k >= 800 && k <= 4000;
  const g = K_GOALS[kgoal];

  // たんぱく質は体重あたり、脂質はエネルギー比と体重あたりの下限、のこりが炭水化物
  const plan = (() => {
    if (!valid) return null;
    const [pk] = K_PROT[kgoal][train];
    let p = wOk ? Math.round(w * pk) : Math.round((k * 0.22) / 4);
    p = Math.min(p, Math.round((k * 0.35) / 4));
    const f = Math.round(Math.max((k * g.fatPct) / 9, wOk ? w * 0.6 : 0));
    const c = Math.max(0, Math.round((k - p * 4 - f * 9) / 4));
    return { kcal: Math.round(k), p, f, c };
  })();

  // 消費カロリーの推定（プロフィールがあるとき）
  const tdee = prof && wOk ? bmr(me.sexKey, prof.age, prof.height, w) * PAL[prof.pal].v : null;
  const diff = tdee && plan ? ((plan.kcal - tdee) / tdee) * 100 : null;
  const pace = tdee && plan && wOk ? (((plan.kcal - tdee) * 7) / 7200 / w) * 100 : null; // 週の体重変化（%）
  const eaFloor = wOk ? Math.round(30 * w * 0.72) : null; // 体脂肪率28%と仮定した、除脂肪体重×30kcal

  useEffect(() => {
    if (!loaded || !touched) return;
    try {
      localStorage.setItem(
        "lg-kcal",
        JSON.stringify({
          kcal,
          type: g.type,
          kgoal,
          train,
          weight,
          label: g.label,
          p: plan?.p,
          f: plan?.f,
          c: plan?.c,
        })
      );
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kcal, kgoal, train, weight, loaded, touched, plan?.p, plan?.f, plan?.c]);

  const menu = useMemo(
    () => (plan ? buildMenu(plan, kgoal === "cut" && plan.f / (plan.kcal / 9) < 0.23 ? "lowfat" : "balance") : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan?.kcal, plan?.p, plan?.f, plan?.c, kgoal]
  );
  const pc = (x: number) => Math.round(x * 100);
  const pe = plan ? (plan.p * 4) / plan.kcal : 0;
  const fe = plan ? (plan.f * 9) / plan.kcal : 0;
  const ce = plan ? (plan.c * 4) / plan.kcal : 0;
  const reset = () => {
    setDone("");
    setTouched(true);
  };
  const range = K_PROT[kgoal][train];

  return (
    <section className="card kset">
      <h2 className="h2" style={{ marginTop: 0 }}>
        1日のカロリー・PFCを決める
      </h2>
      <p className="agnote">
        最新のスポーツ栄養学（ISSN 2017・IOC 2018・日本人の食事摂取基準2025年版）をもとに、目的に合った、たんぱく質・脂質・炭水化物を計算します。
      </p>

      {me.isYouth && (
        <p className="caution">
          ⚠ 中学生・高校生は、からだをつくる成長期です。体重を減らすための食事は、おすすめしません。1日に必要なエネルギーの目安は、約{ME_REF[me.sexKey].kcal[me.band][me.pal].toLocaleString()}kcalです。体型で悩んでいるときは、保護者・学校の先生・医師に相談してください。
        </p>
      )}
      <p className="agtitle">① 目的</p>
      <div className="kgoals">
        {(Object.keys(K_GOALS) as KGoal[]).map((x) => (
          <button
            key={x}
            className={kgoal === x ? "kgoal on" : "kgoal"}
            onClick={() => {
              setKgoal(x);
              reset();
            }}
          >
            <span aria-hidden>{K_GOALS[x].icon}</span>
            <b>{K_GOALS[x].label}</b>
            <small>{K_GOALS[x].desc}</small>
          </button>
        ))}
      </div>

      <p className="agtitle">② からだと、トレーニング</p>
      <label className="afield">
        <span>いまの体重</span>
        <span className="gram">
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              reset();
            }}
            placeholder="55"
            aria-label="いまの体重（kg）"
          />
          kg
        </span>
      </label>
      <p className="aglabel">筋トレ（ウエイト・自重）の頻度</p>
      <div className="chips tight">
        {(Object.keys(K_TRAIN) as KTrain[]).map((x) => (
          <button
            key={x}
            className={train === x ? "chip on" : "chip"}
            onClick={() => {
              setTrain(x);
              reset();
            }}
          >
            {K_TRAIN[x]}
          </button>
        ))}
      </div>
      {!wOk && <p className="note">体重を入れると、体重1kgあたりのたんぱく質で、計算します（入れないときは、エネルギーの22%で計算）。</p>}

      <p className="agtitle">③ 1日のカロリー</p>
      <div className="chips tight">
        {KCAL_PRESETS.map((v) => (
          <button
            key={v}
            className={String(v) === kcal ? "chip on" : "chip"}
            onClick={() => {
              setKcal(String(v));
              reset();
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <label className="afield">
        <span>自分で入力</span>
        <span className="gram">
          <input
            inputMode="numeric"
            value={kcal}
            onChange={(e) => {
              setKcal(e.target.value);
              reset();
            }}
            aria-label="1日のカロリー（kcal）"
          />
          kcal
        </span>
      </label>
      {tdee ? (
        <p className="agnote">
          あなたの1日の消費カロリーの目安：約<b>{Math.round(tdee / 10) * 10}</b>kcal（目標の体重・身長・年齢・活動量から推定）。
          {kgoal === "cut" && " ダイエットは、ここから10〜25%少なめが、目安です。"}
          {kgoal === "gain" && " 筋肉をつけるときは、ここから5〜15%多めが、目安です。"}
          {kgoal === "keep" && " キープは、ここに近い量です。"}
        </p>
      ) : (
        <p className="agnote">
          「目標を決める」（下の欄）で、年齢・身長・活動量を入れると、あなたの消費カロリーと、設定の差が表示されます。体重の入力も必要です。
        </p>
      )}

      {!plan && <p className="note">800〜4000kcalの範囲で入力してください。</p>}

      {plan && (
        <>
          <div className="agresult">
            <div className="agkcal">
              1日 <b>{plan.kcal}</b> kcal　<small>{g.label}</small>
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
            <PfcRow p={plan.p} f={plan.f} c={plan.c} />
            <dl className="agdl">
              <dt>たんぱく質</dt>
              <dd>
                {plan.p}g
                {wOk && (
                  <>
                    （体重1kgあたり {r1(plan.p / w)}g ／ 目安の範囲 {range[1]}〜{range[2]}g）
                  </>
                )}
                。1食あたり {Math.round(plan.p / 4)}〜{Math.round(plan.p / 3)}g（3〜4回に分けて）
                {wOk && <>、1食の目安 {Math.round(w * 0.3)}〜{Math.round(w * 0.5)}g</>}。
              </dd>
              <dt>脂質</dt>
              <dd>
                {plan.f}g（エネルギーの{pc(fe)}%）。20〜30%の範囲・体重1kgあたり0.6g以上を、下回らないように。
              </dd>
              <dt>炭水化物</dt>
              <dd>
                {plan.c}g（エネルギーの{pc(ce)}%）
                {wOk && <>、体重1kgあたり {r1(plan.c / w)}g</>}。ごはんにすると、約{Math.round(plan.c / 0.372 / 10) * 10}g分。
                {train !== "none" && wOk && plan.c / w < 3 && " トレーニングする日は、やや少なめです。前後に、補給を。"}
              </dd>
              <dt>食物繊維</dt>
              <dd>{Math.max(18, Math.round((plan.kcal / 1000) * 8))}g以上（18g以上、または1000kcalあたり 約8g）。</dd>
              {diff !== null && (
                <>
                  <dt>消費との差</dt>
                  <dd>
                    {diff >= 0 ? "+" : ""}
                    {Math.round(diff)}%（{Math.round(plan.kcal - tdee!) >= 0 ? "+" : ""}
                    {Math.round(plan.kcal - tdee!)}kcal）
                    {pace !== null && (
                      <>
                        ／ 体重の変化の目安：週に {pace >= 0 ? "+" : ""}
                        {r1(pace)}%（約{r1((pace / 100) * w)}kg）
                      </>
                    )}
                  </dd>
                </>
              )}
              {eaFloor && (
                <>
                  <dt>最低ライン</dt>
                  <dd>
                    食事は、約{eaFloor}kcal（除脂肪体重×30kcalの目安）に、運動で使った分を足した量を、下回らないように。
                  </dd>
                </>
              )}
            </dl>

            {kgoal === "cut" && diff !== null && diff < -25 && (
              <p className="caution">⚠ 消費より25%以上少ない設定です。筋肉・骨・月経に影響が出やすいので、減らす幅を小さくするか、期間を短くしてください。</p>
            )}
            {kgoal === "cut" && pace !== null && pace < -1 && (
              <p className="caution">⚠ 週に体重の1%より速いペースです。研究では、体重の0.5〜1%／週が、筋肉を守りやすいとされています。</p>
            )}
            {kgoal === "cut" && diff !== null && diff > -5 && (
              <p className="agnote">※ 消費とほぼ同じ量です。体脂肪を減らすなら、10〜25%少ない量が、目安です。</p>
            )}
            {kgoal === "gain" && diff !== null && diff > 20 && (
              <p className="caution">⚠ 消費より20%以上多い設定です。体脂肪が先に増えやすいので、+5〜15%を、目安にしてください。</p>
            )}
            {kgoal === "gain" && diff !== null && diff < 0 && (
              <p className="agnote">※ 消費より少ない設定です。筋肉をつけるなら、消費と同じか、+5〜15%が、目安です。</p>
            )}
            {(plan.kcal < 1200 || plan.kcal > 3200) && (
              <p className="caution">
                {plan.kcal < 1200
                  ? "⚠ 1日1200kcal未満は、栄養不足になりやすい量です。続ける前に、管理栄養士・医師に相談してください。"
                  : "⚠ かなり多めの設定です。活動量に合っているか、確認してください。"}
              </p>
            )}
            {eaFloor && plan.kcal < eaFloor && (
              <p className="caution">
                ⚠ 運動で使うカロリーを引くと、エネルギー不足（低エネルギー・アベイラビリティ）になりやすい量です。月経不順・疲れやすさ・骨の弱りが出たら、食事を増やして、婦人科・医師へ。
              </p>
            )}
          </div>

          <details className="ksmore" open>
            <summary>{K_EVID[kgoal].title}（研究にもとづく目安）</summary>
            <ul className="plist">
              {K_EVID[kgoal].items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="agnote">
              体の大きさ・年齢・活動量・体調で、必要量は変わります。2〜3週間続けて、体重（週平均）・ウエスト・疲れやすさ・月経の変化を見ながら、100〜200kcalずつ調整するのが現実的です。
            </p>
            <p className="agnote">
              出典：
              <a href="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8" target="_blank" rel="noopener noreferrer">
                ISSN たんぱく質と運動（2017）
              </a>
              ／
              <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/" target="_blank" rel="noopener noreferrer">
                Morton 2018（たんぱく質補給と筋力トレーニング）
              </a>
              ／
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/" target="_blank" rel="noopener noreferrer">
                Helms 2014（競技者の減量期の総説・一般の方は目安）
              </a>
              ／
              <a href="https://bjsm.bmj.com/content/52/11/687" target="_blank" rel="noopener noreferrer">
                IOC RED-S 2018
              </a>
              ／
              <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5803575" target="_blank" rel="noopener noreferrer">
                MATADOR（Byrne 2018）
              </a>
              ／
              <a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/syokuji_kijyun.html" target="_blank" rel="noopener noreferrer">
                日本人の食事摂取基準（2025年版）
              </a>
            </p>
          </details>

          {menu && (
            <div className="agmenu">
              <p className="agtitle">この目標に近づく、1日の食事の例</p>
              {menu.meals.map((m) => {
                const mt = sum(m.items.map((i) => ({ id: "", name: i.name, grams: i.g })));
                return (
                  <div key={m.title} className="agmeal">
                    <b>
                      {m.title}
                      <span className="muted">
                        {" "}
                        約{Math.round(mt.kcal)}kcal ／ P{r1(mt.p)} F{r1(mt.f)} C{r1(mt.c)}
                      </span>
                    </b>
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
                    {MEAL_TIPS[m.title] && <p className="agnote">💡 {MEAL_TIPS[m.title]}</p>}
                  </div>
                );
              })}
              <details className="ksmore">
                <summary>栄養のようす・食材の置きかえを見る</summary>
                <p className="aglabel">この例の栄養のようす（目安との比較）</p>
                <ul className="ksnut">
                  {REF_NUTRI.map((n) => {
                    const v = menu.total[n.key];
                    const ok = n.kind === "min" ? v >= n.v : v < n.v;
                    return (
                      <li key={n.key} className={ok ? "ok" : "ng"}>
                        <b>{n.label}</b>
                        <span>
                          {r1(v)}
                          {n.unit}
                        </span>
                        <em>
                          目安 {n.ref} {ok ? "✓" : n.kind === "min" ? "→ 足りません" : "→ 多めです"}
                        </em>
                      </li>
                    );
                  })}
                </ul>
                <p className="agnote">
                  ※ この食事例は、味つけ（しょうゆ・みそ・塩など）を含まないため、食塩は実際より少なく出ます。カルシウム・鉄が足りないときは、小魚・牛乳・チーズ・小松菜・豆腐、赤身肉・レバー・あさり・ほうれん草を足すと補えます。
                </p>
                <p className="aglabel">食材の置きかえ（目的の栄養が、ほぼ同じ量になる目安）</p>
                <ul className="kswap">
                  {SWAPS.map((s) => (
                    <li key={s.from}>
                      <b>{s.from}</b>
                      <span>＝ {s.to}</span>
                    </li>
                  ))}
                </ul>
              </details>
              <p className="agnote">
                この例の合計: {Math.round(menu.total.kcal)}kcal ／ P{r1(menu.total.p)}g F{r1(menu.total.f)}g C{r1(menu.total.c)}g（目標との差 P
                {menu.total.p - plan.p >= 0 ? "+" : ""}
                {r1(menu.total.p - plan.p)}g F{menu.total.f - plan.f >= 0 ? "+" : ""}
                {r1(menu.total.f - plan.f)}g C{menu.total.c - plan.c >= 0 ? "+" : ""}
                {r1(menu.total.c - plan.c)}g）
              </p>
            </div>
          )}

          <div className="ksbtns">
            <button
              className="small"
              onClick={() => {
                setGoal({ p: String(plan.p), f: String(plan.f), c: String(plan.c) });
                setDone("goal");
              }}
            >
              {done === "goal" ? "✓ 目標に設定しました" : "この数字を、目標にする"}
            </button>
          </div>
          <p className="agnote">
            食材は一例です。同じ栄養の食品に置きかえても大丈夫です。持病・妊娠中・授乳中・摂食障害の経験がある人は、医師・管理栄養士に相談してください。
          </p>
          <LineShare
            title="1日の目標カロリー・PFC"
            build={() =>
              [
                `■ 目的：${g.label}`,
                `■ 体重 ${wOk ? `${w}kg` : "未入力"}／筋トレ ${K_TRAIN[train]}`,
                `■ 1日の目標：${plan.kcal}kcal`,
                `P たんぱく質 ${plan.p}g／F 脂質 ${plan.f}g／C 炭水化物 ${plan.c}g`,
                diff !== null ? `■ 消費との差：${diff >= 0 ? "+" : ""}${Math.round(diff)}%${pace !== null ? `（体重の変化の目安：週に${pace >= 0 ? "+" : ""}${r1(pace)}%）` : ""}` : "",
              ]
                .filter(Boolean)
                .join("\n")
            }
          />
        </>
      )}
    </section>
  );
}

function HomeInner() {
  const [tab, setTab] = useState<"record" | "search" | "women" | "products">("record");
  const sp = useSearchParams();
  // 画面右上のバーから ?tab=search で来たときも、タブを切り替える
  useEffect(() => {
    const q = sp.get("tab");
    const t = q === "search" ? "search" : q === "women" ? "women" : q === "products" ? "products" : "record";
    setTab(t);
    window.scrollTo(0, 0);
  }, [sp]);
  const changeTab = (t: "record" | "search" | "women" | "products") => {
    setTab(t);
    window.history.replaceState(null, "", t === "search" ? "/?tab=search" : t === "women" ? "/?tab=women" : t === "products" ? "/?tab=products" : "/");
  };
  const [log, setLog] = useState<Log>({});
  const [goal, setGoal] = useState<Goal>({ p: "", f: "", c: "" });
  const [loaded, setLoaded] = useState(false);
  const [hasKcal, setHasKcal] = useState(false);
  const meHook = useMe();
  const [selected, setSelected] = useState(key(new Date()));
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem("lg-log") || "null");
      if (l) setLog(l);
      const g = JSON.parse(localStorage.getItem("lg-goal") || "null");
      if (g) setGoal(g);
      setHasKcal(!!localStorage.getItem("lg-kcal"));
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
      <h1 className="title">{tab === "women" ? "からだのケア" : tab === "search" ? "食品をしらべる" : tab === "products" ? "商品をさがす" : "専属の栄養士"}</h1>
      <p className="tagline">女性のからだに寄りそう、食事とからだのパートナー。</p>
      <p className="member">LIFEGYM 女性会員様のための専用アプリ</p>





      {tab === "record" ? (
        <>
          <StatusBar />
          <BalanceCheck />
          <NationalGuide />
          <Fold key="r-weight" id="r-weight" title="⚖️ 目標体重に着く時期の予測" sub="ペースを選ぶと、到達する時期が分かる" cls="wfold" defaultOpen>
            <WeightChart />
          </Fold>
          {loaded && (
            <Fold key={hasKcal ? "k1" : "k0"} id="r-kcal" title="🔥 1日のカロリー・PFCを決める" sub={hasKcal ? "設定ずみ。タップで見なおす・変える" : "目的・体重・カロリーから、PFCと食事例を計算"} cls="wfold">
              <KcalSetter setGoal={setGoal} />
            </Fold>
          )}
          <Fold key="r-goal" id="r-goal" title="🎯 目標体重・年齢などを入れる" sub="体重の予測と、カロリーの計算に使います" cls="wfold">
            <ProfileGoal setGoal={setGoal} />
          </Fold>

          <Fold key="h-tip" id="h-tip" title="💡 今日の豆知識" sub="1日1つ、ひとことで" cls="wfold">
        <TipsTicker />
      </Fold>
          <Fold key="r-diary" id="r-diary" title="📝 食べたものを記録したい人へ（任意）" sub="このアプリでは、記録は、すすめていません" cls="wfold">
            <p className="agnote">記録は、負担になりやすいので、必須ではありません。細かく確かめたい日だけ、お使いください。</p>
            <Calendar month={month} setMonth={setMonth} selected={selected} setSelected={pick} log={log} goal={goal} />
            <DayView date={selected} entries={log[selected] ?? []} goal={goal} setGoal={setGoal} onAdd={add} onRemove={remove} log={log} />
            <WomenDaily entries={log[selected] ?? []} goal={goal} onAdd={add} />
          </Fold>
        </>
      ) : tab === "women" ? (
        <>
          <Link href="/gut" className="gutlink">
            <span aria-hidden>🌿</span>
            <span>
              <b>腸内環境ガイド</b>
              <small>便のタイプ・食物繊維・月経と便通・7日プラン</small>
            </span>
            <i aria-hidden>›</i>
          </Link>
          <Link href="/additives" className="gutlink">
            <span aria-hidden>🏷️</span>
            <span>
              <b>食品表示・添加物ガイド</b>
              <small>増粘剤・乳化剤・甘味料／原材料チェッカー</small>
            </span>
            <i aria-hidden>›</i>
          </Link>
          <Fold key="w-me" id="w-me" title="👤 あなたの1日の目安" sub="性別・年齢で、目安が変わります" cls="wfold" defaultOpen><MeCard /></Fold>
          <Fold key="w-sym" id="w-sym" title="🩺 気になることから、足したい栄養を探す" sub="選ぶだけ。記録は、いりません" cls="wfold" defaultOpen><SymptomCheck /></Fold>
          <MyKcal topic="women" />
          {meHook.sexKey === "f" && <Fold key="w-cycle" id="w-cycle" title="🌸 今日のからだと、月経周期" sub="今の時期の食事・過ごし方" cls="wfold"><CycleTracker /></Fold>}
          {meHook.sexKey === "f" && <Fold key="w-guide" id="w-guide" title="👩 年代別ガイド（女性）" sub="月経・妊活・更年期・骨など" cls="wfold"><WomenGuide /></Fold>}
          <Fold key="w-bone" id="w-bone" title="🥛 骨と血をつくる食品メーカー" sub="カルシウム・鉄の食事" cls="wfold"><BoneMenu onAdd={add} />
            <RelatedProducts q="カルシウム" title="カルシウムの商品" />
            <RelatedProducts q="鉄" title="鉄の商品" /></Fold>
          {meHook.sexKey === "f" && meHook.band >= 3 && <Fold key="w-care" id="w-care" title="🩺 更年期・「困った」ガイド" sub="症状ごとの工夫と受診の目安" cls="wfold"><WomenCare /></Fold>}
          <Fold key="w-age" id="w-age" title="🧓 30歳と60歳のダイエットの違い" sub="年齢でちがう、減らし方" cls="wfold"><AgeCompare /></Fold>
          <Fold key="w-meal" id="w-meal" title="🍽 1日の食事例をくらべる" sub="4つのタイプを、ひと目で" cls="wfold"><MealCompare goal={goal} onAdd={add} /></Fold>
          <ShareQR />
        </>      ) : tab === "products" ? (
        <ProductSearch />
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}







































