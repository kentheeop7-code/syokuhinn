"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QuoteHero from "./QuoteHero";
import {
  CATEGORIES,
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
        <span>{food.name}</span>
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
        <p className="cardtitle">目標のPFC（g）</p>
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
        <Link href="/nutrients" className="toplink">
          栄養素のはたらき ›
        </Link>
      </header>
      <h1 className="title">PFC</h1>
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
