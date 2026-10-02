"use client";

import { useEffect, useMemo, useState } from "react";
import { FOODS } from "@/lib/foods";

type Result = {
  name: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

const num = (v: string) => Math.max(0, parseFloat(v) || 0);
const r1 = (n: number) => Math.round(n * 10) / 10;

// 長辺1280pxのJPEGに縮小（Vercelのリクエスト上限対策）
function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    img.src = url;
  });
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

function Photo() {
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setResults(null);
    setLoading(true);
    try {
      const image = await resize(file);
      setPreview(image);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "解析に失敗しました。");
      setResults(json.foods);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const total = (results ?? []).reduce(
    (a, x) => ({
      p: a.p + x.protein,
      f: a.f + x.fat,
      c: a.c + x.carbs,
      k: a.k + x.kcal,
    }),
    { p: 0, f: 0, c: 0, k: 0 }
  );

  return (
    <section>
      <label className="drop">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="選択した写真" />
        ) : (
          <span>写真を撮る・選ぶ</span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {loading && <p className="note">解析中…</p>}
      {error && <p className="error">{error}</p>}

      {results && results.length === 0 && (
        <p className="note">食品が見つかりませんでした。</p>
      )}

      {results && results.length > 0 && (
        <div className="card">
          <div className="kcal">
            合計 <b>{Math.round(total.k)}</b> kcal
          </div>
          <PfcBars p={total.p} f={total.f} c={total.c} />
          <PfcRow p={total.p} f={total.f} c={total.c} />
          <ul className="rows">
            {results.map((x, i) => (
              <li key={i}>
                <div className="rowhead">
                  <span>{x.name}</span>
                  <span className="muted">
                    約{Math.round(x.grams)}g・{Math.round(x.kcal)}kcal
                  </span>
                </div>
                <PfcRow p={x.protein} f={x.fat} c={x.carbs} />
              </li>
            ))}
          </ul>
          <p className="note">※ 写真からの推定値です。目安としてお使いください。</p>
        </div>
      )}
    </section>
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
  const [tab, setTab] = useState<"photo" | "search" | "goal">("photo");
  return (
    <main className="container">
      <h1 className="title">PFC</h1>
      <p className="sub">食事のたんぱく質・脂質・炭水化物をすばやく確認</p>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "photo"}
          onClick={() => setTab("photo")}
        >
          写真で調べる
        </button>
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

      {tab === "photo" ? <Photo /> : tab === "search" ? <Search /> : <Goal />}
    </main>
  );
}
