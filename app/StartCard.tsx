"use client";

import { useEffect, useState } from "react";
import { calcEnergy } from "../lib/energy";
import { useMe, writeMe } from "./me";

// ホームの先頭：はじめに、基本情報（性別・年齢・身長・体重・目標体重・1日の運動量）を入れる。
// 入れた値は、ほかのページ（体重と目標・カロリー・PFC）でも、そのまま使われる。
const bandOf = (age: number) => (age < 15 ? 0 : age < 18 ? 1 : age < 30 ? 2 : age < 50 ? 3 : age < 65 ? 4 : age < 75 ? 5 : 6);
const PALS = [
  { k: "low", t: "低い", d: "ほぼ座って過ごす" },
  { k: "mid", t: "ふつう", d: "座り仕事＋通勤・家事・軽い運動" },
  { k: "high", t: "高い", d: "立ち仕事・週に何度も運動" },
];
const num = (s: string) => parseFloat(s) || 0;

type Prof = { age: string; height: string; weight: string; pal: string; purpose?: string | null; [k: string]: unknown };

export default function StartCard() {
  const me = useMe();
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [now, setNow] = useState("");
  const [target, setTarget] = useState("");
  const [pal, setPal] = useState(1);
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
      if (p) {
        setAge(p.age ?? "");
        setHeight(p.height ?? "");
        setTarget(p.weight ?? "");
        setPal(p.pal === "low" ? 0 : p.pal === "high" ? 2 : 1);
      }
      setNow(localStorage.getItem("lg-now") || "");
      const done = localStorage.getItem("lg-start-done") === "1";
      if (done) setOpen(false);
    } catch {}
    setReady(true);
    const sync = () => {
      try {
        const n = localStorage.getItem("lg-now") || "";
        setNow((x) => (x === n ? x : n));
      } catch {}
    };
    window.addEventListener("lg-profile-change", sync);
    return () => window.removeEventListener("lg-profile-change", sync);
  }, []);

  const save = (patch: { age?: string; height?: string; now?: string; target?: string; pal?: number }) => {
    const a = patch.age ?? age;
    const h = patch.height ?? height;
    const n = patch.now ?? now;
    const t = patch.target ?? target;
    const pl = patch.pal ?? pal;
    if (patch.age !== undefined) setAge(a);
    if (patch.height !== undefined) setHeight(h);
    if (patch.now !== undefined) setNow(n);
    if (patch.target !== undefined) setTarget(t);
    if (patch.pal !== undefined) setPal(pl);
    try {
      const old: Prof = JSON.parse(localStorage.getItem("lg-profile") || "null") || { age: "", height: "", weight: "", pal: "mid", purpose: null, method: "balance" };
      const next: Prof = { ...old, age: a, height: h, weight: t, pal: pl === 0 ? "low" : pl === 2 ? "high" : "mid" };
      if (!next.purpose && num(n) > 0 && num(t) > 0) next.purpose = num(n) > num(t) ? "diet" : "muscle";
      localStorage.setItem("lg-profile", JSON.stringify(next));
      localStorage.setItem("lg-now", n);
      localStorage.setItem("lg-start-done", "1");
      window.dispatchEvent(new Event("lg-profile-change"));
    } catch {}
    const ag = num(a);
    writeMe({ pal: pl, ...(ag >= 12 && ag <= 99 ? { band: bandOf(ag) } : {}) });
  };

  if (!ready) return null;

  const ag = num(age);
  const w = num(now);
  const wt = num(target);
  const hh = num(height);
  const band = ag >= 12 ? bandOf(ag) : me.band;
  const youth = ag > 0 && ag < 18;
  const energy = w >= 20 && hh >= 100 && ag >= 12 ? calcEnergy({ sex: me.sexKey, band, age: ag, height: hh, weight: w, bmr: 0, bodyFat: 0, muscle: 0, pal, targetWeight: wt, pace: "slow" }) : null;
  const bmi = w > 0 && hh > 0 ? Math.round((w / (hh / 100) ** 2) * 10) / 10 : 0;
  const diff = w > 0 && wt > 0 ? Math.round((w - wt) * 10) / 10 : 0;
  const weeks = energy && energy.diff < -50 && diff > 0 ? Math.min(104, Math.ceil((diff * 7200) / Math.abs(energy.diff) / 7)) : 0;
  const filled = ag > 0 && hh > 0 && w > 0 && wt > 0;

  return (
    <section className="card startcard" aria-label="はじめに、基本情報">
      <button type="button" className="startcard-h" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <b>① はじめに：基本情報</b>
        <span>{filled ? `✓ 入力ずみ（${open ? "閉じる" : "直す"}）` : "身長・体重・目標体重・運動量"}</span>
      </button>
      {open && (
        <div className="startcard-b">
          <div className="mechips two">
            {[1, 2].map((v) => (
              <button key={v} type="button" aria-pressed={me.sex === v} className={me.sex === v ? "on" : ""} onClick={() => me.set({ sex: v as 1 | 2 })}>
                {v === 1 ? "女性" : "男性"}
              </button>
            ))}
          </div>
          <div className="startgrid">
            <label>
              <span>年齢</span>
              <b><input inputMode="numeric" value={age} placeholder="35" onChange={(e) => save({ age: e.target.value })} aria-label="年齢（歳）" />歳</b>
            </label>
            <label>
              <span>身長</span>
              <b><input inputMode="decimal" value={height} placeholder="160" onChange={(e) => save({ height: e.target.value })} aria-label="身長（cm）" />cm</b>
            </label>
            <label>
              <span>いまの体重</span>
              <b><input inputMode="decimal" value={now} placeholder="60" onChange={(e) => save({ now: e.target.value })} aria-label="いまの体重（kg）" />kg</b>
            </label>
            <label>
              <span>目標体重</span>
              <b><input inputMode="decimal" value={target} placeholder="55" onChange={(e) => save({ target: e.target.value })} aria-label="目標体重（kg）" />kg</b>
            </label>
          </div>
          <p className="startlabel">1日の運動量（ふだんの動き）</p>
          <div className="startpal" role="radiogroup" aria-label="1日の運動量">
            {PALS.map((p, i) => (
              <button key={p.k} type="button" role="radio" aria-checked={pal === i} className={pal === i ? "on" : ""} onClick={() => save({ pal: i })}>
                <b>{p.t}</b>
                <small>{p.d}</small>
              </button>
            ))}
          </div>
          {filled && (
            <div className="startres">
              {bmi > 0 && <div><small>BMI</small><b>{bmi}</b></div>}
              {energy && <div><small>維持のカロリー</small><b>約{Math.round(energy.tdee / 10) * 10}</b></div>}
              {energy && !youth && <div><small>目標のカロリー</small><b>約{energy.target.toLocaleString()}</b></div>}
              {weeks > 0 && !youth && <div><small>ゴールまで</small><b>約{weeks}週</b></div>}
            </div>
          )}
          {youth && filled && <p className="agnote">中学生・高校生は、成長期のため、体重を減らす計算はしません。必要な量を、しっかり食べましょう。</p>}
          {filled && !youth && <p className="agnote">診断ではなく、目安です。次の「② 昨日・一昨日の食事」を入れると、この目標との差が分かります。</p>}
          <a href="#qm" className="startnext">② 昨日・一昨日の食事を入れる ▼</a>
        </div>
      )}
    </section>
  );
}

