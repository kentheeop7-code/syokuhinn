"use client";

import { useEffect, useMemo, useState } from "react";
import { FOODS } from "@/lib/foods";

const num = (v: string) => Math.max(0, parseFloat(v) || 0);
const r1 = (n: number) => Math.round(n * 10) / 10;

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

function Search() {
  const [q, setQ] = useState("");
  const [grams, setGrams] = useState("100");
  const g = (num(grams) || 0) / 100;
  const hits = FOODS.filter((x) => x.name.includes(q.trim()));

  return (
    <section>
      <div className="searchbar">
        <input
          className="textinput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="食品名で検索（例: 鶏、ごはん）"
          aria-label="食品名"
        />
        <label className="gram">
          <input
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            aria-label="グラム数"
          />
          g
        </label>
      </div>
      <p className="note">
        {num(grams) === 100
          ? "100gあたりの栄養素を表示しています。"
          : `${r1(num(grams))}gあたりの栄養素を表示しています。`}
      </p>
      {hits.length === 0 && <p className="note">見つかりませんでした。</p>}
      <ul className="rows card">
        {hits.map((x) => (
          <li key={x.name}>
            <div className="rowhead">
              <span>{x.name}</span>
              <span className="muted">
                {Math.round((x.p * 4 + x.f * 9 + x.c * 4) * g)}kcal
              </span>
            </div>
            <PfcBars p={x.p * g} f={x.f * g} c={x.c * g} />
            <PfcRow p={x.p * g} f={x.f * g} c={x.c * g} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Goal() {
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("goal") || "null");
      if (s) {
        setP(s.p);
        setF(s.f);
        setC(s.c);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("goal", JSON.stringify({ p, f, c }));
    } catch {}
  }, [p, f, c]);

  const suggestions = useMemo(() => {
    const t = { p: num(p), f: num(f), c: num(c) };
    const sum = t.p + t.f + t.c;
    if (sum === 0) return [];
    return FOODS.map((food) => {
      // 目標を1割以上超えない最大量（上限400g）
      let s = 4;
      (["p", "f", "c"] as const).forEach((k) => {
        const per = food[k] / 100;
        if (per > 0 && t[k] > 0) s = Math.min(s, (t[k] * 1.1) / per / 100);
        if (per > 0.02 && t[k] === 0) s = 0;
      });
      const grams = Math.round((s * 100) / 5) * 5;
      const g = grams / 100;
      const got = {
        p: food.p * g,
        f: food.f * g,
        c: food.c * g,
      };
      const covered =
        (Math.min(got.p, t.p) + Math.min(got.f, t.f) + Math.min(got.c, t.c)) /
        sum;
      return { food, grams, got, covered };
    })
      .filter((x) => x.grams >= 10 && x.covered > 0.05)
      .sort((a, b) => b.covered - a.covered)
      .slice(0, 8);
  }, [p, f, c]);

  const hasGoal = num(p) + num(f) + num(c) > 0;

  return (
    <section>
      <p className="note">
        今日あと摂りたい量（g）を入力すると、近づけられる食品を提案します。
      </p>
      <div className="inputs">
        <label>
          <i className="dot p" />P たんぱく質
          <input
            inputMode="decimal"
            value={p}
            onChange={(e) => setP(e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          <i className="dot f" />F 脂質
          <input
            inputMode="decimal"
            value={f}
            onChange={(e) => setF(e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          <i className="dot c" />C 炭水化物
          <input
            inputMode="decimal"
            value={c}
            onChange={(e) => setC(e.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      {hasGoal && suggestions.length === 0 && (
        <p className="note">当てはまる食品が見つかりませんでした。</p>
      )}

      <ul className="rows card">
        {suggestions.map(({ food, grams, got, covered }) => (
          <li key={food.name}>
            <div className="rowhead">
              <span>{food.name}</span>
              <span className="muted">
                {grams}g・目標の {Math.round(covered * 100)}%
              </span>
            </div>
            <PfcRow p={got.p} f={got.f} c={got.c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"search" | "goal">("search");
  return (
    <main className="container">
      <h1 className="title">PFC</h1>
      <p className="sub">食事のたんぱく質・脂質・炭水化物をすばやく確認</p>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "search"}
          onClick={() => setTab("search")}
        >
          食品を検索
        </button>
        <button
          role="tab"
          aria-selected={tab === "goal"}
          onClick={() => setTab("goal")}
        >
          目標から探す
        </button>
      </div>

      {tab === "search" ? <Search /> : <Goal />}
    </main>
  );
}
