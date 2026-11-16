"use client";

import { useEffect, useState } from "react";
import { EXTRAS, ICON, SIZES, SLOTS, kc, r10, slotKcal, type St, type Tile } from "../lib/meals";

// 食事を、タップで選ぶ部品。使いかたは、3つだけ：
// ① 食事の時間（朝・昼・夜・おやつ）を選ぶ → ② 食べたものを、タップ（複数OK。名前で探すこともできる）→ ③ 量を選ぶ
const RECENT_KEY = "lg-recent";
const NEED = "★";

export default function MealPicker({ value, onChange, hint = false }: { value: St; onChange: (n: St) => void; hint?: boolean; idp?: string }) {
  const [slot, setSlot] = useState("am");
  const [cats, setCats] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(r)) setRecent(r.filter((x) => typeof x === "string"));
    } catch {}
  }, []);
  const idx = SLOTS.findIndex((s) => s.id === slot);
  const cur = SLOTS[idx];
  const next = SLOTS[idx + 1];
  const none = cur.tiles[cur.tiles.length - 1].id;
  const catList = Array.from(new Set(cur.tiles.map((t) => t.cat ?? "定番")));
  const cat = cats[slot] && catList.includes(cats[slot]) ? cats[slot] : catList[0];
  const query = q.trim().toLowerCase();
  const shown = query ? cur.tiles.filter((t) => t.label.toLowerCase().includes(query)) : catList.length > 1 ? cur.tiles.filter((t) => (t.cat ?? "定番") === cat) : cur.tiles;
  const catCount = (c: string) => cur.tiles.filter((t) => (t.cat ?? "定番") === c && value.size[t.id] !== undefined && t.id !== none).length;
  const remember = (id: string) => {
    const r = [id, ...recent.filter((x) => x !== id)].slice(0, 24);
    setRecent(r);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(r));
    } catch {}
  };
  const toggle = (t: Tile) => {
    const size = { ...value.size };
    if (size[t.id] !== undefined) delete size[t.id];
    else if (t.id === none) {
      cur.tiles.forEach((y) => delete size[y.id]);
      size[t.id] = 1;
    } else {
      delete size[none];
      size[t.id] = 1;
      remember(t.id);
    }
    onChange({ ...value, size });
  };
  const setSize = (id: string, z: number) => onChange({ ...value, size: { ...value.size, [id]: z } });
  const bump = (k: string) => {
    const key = `${slot}:${k}`;
    const c = ((value.ext[key] ?? 0) + 1) % 3;
    const ext = { ...value.ext };
    if (c === 0) delete ext[key];
    else ext[key] = c;
    onChange({ ...value, ext });
  };
  const count = (s: (typeof SLOTS)[number]) => s.tiles.filter((t) => value.size[t.id] !== undefined).length + Object.keys(value.ext).filter((k) => k.startsWith(s.id + ":")).length;
  const picked = cur.tiles.filter((t) => value.size[t.id] !== undefined && t.id !== none);
  const done = count(cur) > 0;
  const extCount = Object.keys(value.ext).filter((k) => k.startsWith(slot + ":")).length;
  const recentTiles = recent.map((id) => cur.tiles.find((t) => t.id === id)).filter((t): t is Tile => !!t && value.size[t.id] === undefined).slice(0, 6);
  return (
    <div className="qmp">
      {hint && (
        <ol className="qmguide" aria-label="使いかた">
          <li>
            <b>1</b>食事の時間を選ぶ
          </li>
          <li>
            <b>2</b>食べたものを、タップ（複数OK）
          </li>
          <li>
            <b>3</b>量を選ぶ（なければ、そのまま）
          </li>
        </ol>
      )}
      <div className="qmtabs" role="tablist" aria-label="食事の時間">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={slot === s.id} className={slot === s.id ? "on" : ""} onClick={() => { setSlot(s.id); setQ(""); }}>
            <span aria-hidden>{ICON[s.icon]}</span>
            {s.label}
            {count(s) > 0 ? <i>✓ 約{r10(slotKcal(value, s)).toLocaleString()}</i> : <em>まだ</em>}
          </button>
        ))}
      </div>
      <label className="qmsearch">
        <span aria-hidden>🔍</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="食事の名前で探す（例：ラーメン・鮭・サラダ）" aria-label="食事の名前で探す" />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="検索をクリア">
            ×
          </button>
        )}
      </label>
      {recentTiles.length > 0 && !query && (
        <div className="qmrecent">
          <small>最近選んだ</small>
          {recentTiles.map((t) => (
            <button key={t.id} type="button" onClick={() => toggle(t)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
      {!query && catList.length > 1 && (
        <div className="qmcats" role="tablist" aria-label="料理の種類">
          {catList.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} className={cat === c ? "on" : ""} onClick={() => setCats((x) => ({ ...x, [slot]: c }))}>
              {c}
              {catCount(c) > 0 && <i>{catCount(c)}</i>}
            </button>
          ))}
        </div>
      )}
      <div className="qmtiles" role="group" aria-label={`${cur.label}の食事`}>
        {shown.map((t) => {
          const on = value.size[t.id] !== undefined;
          const k = kc(t.vals);
          return (
            <button key={t.id} type="button" aria-pressed={on} className={on ? "qmt on" : "qmt"} onClick={() => toggle(t)}>
              <span aria-hidden>{t.icon}</span>
              {t.label}
              {k > 0 && <small>約{r10(k)}kcal</small>}
            </button>
          );
        })}
        {shown.length === 0 && <p className="agnote">「{q}」に合う食事が、見つかりません。ほかの言葉で、探してください（例：うどん・卵・魚）。</p>}
      </div>
      {picked.map((t) => (
        <div key={t.id} className="qmsize">
          <span>
            {t.icon} {t.label}の量
          </span>
          <div role="radiogroup" aria-label={`${t.label}の量`}>
            {SIZES.map((z, i) => (
              <button key={z.t} type="button" role="radio" aria-checked={value.size[t.id] === i} className={value.size[t.id] === i ? "on" : ""} onClick={() => setSize(t.id, i)}>
                {z.t}
              </button>
            ))}
          </div>
        </div>
      ))}
      <details className="qmextra" open={extCount > 0}>
        <summary>＋ 食品を1つずつ足す（{EXTRAS.length}種類：卵・豆・ナッツ・乳製品・お酒など）{extCount > 0 ? `　${extCount}つ` : ""}</summary>
        <p className="qmx">タップで 1つ → 2つ → なし</p>
        <div className="qmextras">
          {EXTRAS.map((x) => {
            const c = value.ext[`${slot}:${x.k}`] ?? 0;
            return (
              <button key={x.k} type="button" aria-pressed={c > 0} className={c > 0 ? "on" : ""} onClick={() => bump(x.k)}>
                <span aria-hidden>{x.icon}</span>
                {x.label}
                {c > 0 && <i>×{c}</i>}
              </button>
            );
          })}
        </div>
      </details>
      <div className="qmnext">
        {next ? (
          <button type="button" className={done ? "qmnextb on" : "qmnextb"} onClick={() => { setSlot(next.id); setQ(""); }}>
            {done ? "✓ " : ""}次は、{next.label} ▶
          </button>
        ) : (
          <p className="agnote">{NEED} 選び終わったら、上の「推定カロリー」と、栄養のグラフを、見てください。</p>
        )}
      </div>
    </div>
  );
}