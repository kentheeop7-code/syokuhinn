"use client";

import { useState } from "react";
import { EXTRAS, ICON, SIZES, SLOTS, kc, r10, slotKcal, type St, type Tile } from "../lib/meals";

// 食事を、タップで選ぶ部品（朝・昼・夜・おやつ → 量 → 足したもの）。値は、親が持つ。
export default function MealPicker({ value, onChange, idp = "mp" }: { value: St; onChange: (n: St) => void; idp?: string }) {
  const [slot, setSlot] = useState("am");
  const [cats, setCats] = useState<Record<string, string>>({});
  const cur = SLOTS.find((s) => s.id === slot)!;
  const none = cur.tiles[cur.tiles.length - 1].id;
  const catList = Array.from(new Set(cur.tiles.map((t) => t.cat ?? "定番")));
  const cat = cats[slot] && catList.includes(cats[slot]) ? cats[slot] : catList[0];
  const shown = catList.length > 1 ? cur.tiles.filter((t) => (t.cat ?? "定番") === cat) : cur.tiles;
  const catCount = (c: string) => cur.tiles.filter((t) => (t.cat ?? "定番") === c && value.size[t.id] !== undefined && t.id !== none).length;
  const toggle = (t: Tile) => {
    const size = { ...value.size };
    if (size[t.id] !== undefined) delete size[t.id];
    else if (t.id === none) {
      cur.tiles.forEach((y) => delete size[y.id]);
      size[t.id] = 1;
    } else {
      delete size[none];
      size[t.id] = 1;
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
  return (
    <div className="qmp">
      <div className="qmtabs" role="tablist" aria-label="食事の時間">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={slot === s.id} className={slot === s.id ? "on" : ""} onClick={() => setSlot(s.id)}>
            <span aria-hidden>{ICON[s.icon]}</span>
            {s.label}
            {count(s) > 0 && <i>約{r10(slotKcal(value, s)).toLocaleString()}</i>}
          </button>
        ))}
      </div>
      {catList.length > 1 && (
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
      <p className="qmx">＋ 足したもの（タップで 1つ→2つ→なし）</p>
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
    </div>
  );
}