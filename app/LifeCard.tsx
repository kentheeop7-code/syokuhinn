"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LIFE, JOBS, LIFE_KEY, palFromLife, readLife, type Life } from "../lib/life";

// 生活習慣（仕事の動き・歩数・運動・睡眠・体脂肪・基礎代謝・持病）を入れる。入れるほど、カロリーが正確になる。
export default function LifeCard() {
  const [l, setL] = useState<Life>(DEFAULT_LIFE);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setL(readLife());
    setReady(true);
  }, []);
  if (!ready) return null;

  const upd = (patch: Partial<Life>) => {
    const n = { ...l, ...patch };
    setL(n);
    try {
      localStorage.setItem(LIFE_KEY, JSON.stringify(n));
      window.dispatchEvent(new Event("lg-profile-change"));
    } catch {}
  };
  const pal = palFromLife(l);
  const field = (label: string, unit: string, key: "steps" | "strength" | "cardio" | "sleep" | "bodyFat" | "bmr", ph: string, hint?: string) => (
    <label>
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <b>
        <input inputMode="decimal" value={l[key]} placeholder={ph} onChange={(e) => upd({ [key]: e.target.value } as Partial<Life>)} aria-label={`${label}（${unit}）`} />
        {unit}
      </b>
    </label>
  );

  return (
    <section className="card startcard lifecard" id="life" aria-label="生活習慣">
      <button type="button" className="startcard-h" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <b>② 生活習慣（任意：入れるほど、正確）</b>
        <span>{l.steps || l.strength || l.cardio || l.sleep || l.bmr ? `✓ 入力ずみ（${open ? "閉じる" : "直す"}）` : open ? "閉じる" : "歩数・運動・睡眠など"}</span>
      </button>
      {open && (
      <div className="startcard-b">
        <p className="startlabel">仕事・ふだんの動き</p>
        <div className="lifejobs" role="radiogroup" aria-label="仕事・ふだんの動き">
          {JOBS.map((j) => (
            <button key={j.k} type="button" role="radio" aria-checked={l.job === j.k} className={l.job === j.k ? "on" : ""} onClick={() => upd({ job: j.k })}>
              <b>{j.t}</b>
              <small>{j.d}</small>
            </button>
          ))}
        </div>
        <div className="startgrid">
          {field("歩数", "歩/日", "steps", "7000", "スマホの平均")}
          {field("筋トレ", "回/週", "strength", "1")}
          {field("有酸素運動", "分/週", "cardio", "60", "ウォーキング・ジョギング等")}
          {field("睡眠", "時間", "sleep", "7")}
        </div>
        <details className="lifemore">
          <summary>さらに正確にする（体組成計の数字があれば）</summary>
          <div className="startgrid">
            {field("体脂肪率", "%", "bodyFat", "28", "体組成計")}
            {field("基礎代謝", "kcal", "bmr", "1300", "体組成計の値")}
          </div>
          <p className="agnote">基礎代謝の数字を入れると、いちばん正確な計算になります（機器による誤差はあります）。</p>
        </details>
        <p className="startlabel">減らすペース</p>
        <div className="startpal two" role="radiogroup" aria-label="減らすペース">
          {[
            { k: "slow", t: "ゆっくり", d: "月1kg（おすすめ）" },
            { k: "mid", t: "ふつう", d: "週に体重の0.5%" },
          ].map((p) => (
            <button key={p.k} type="button" role="radio" aria-checked={l.pace === p.k} className={l.pace === p.k ? "on" : ""} onClick={() => upd({ pace: p.k as Life["pace"] })}>
              <b>{p.t}</b>
              <small>{p.d}</small>
            </button>
          ))}
        </div>
        <label className="lifecond">
          <input type="checkbox" checked={l.condition} onChange={(e) => upd({ condition: e.target.checked })} />
          <span>持病・服薬がある（食事は、主治医の指示を優先。減らすペースは「ゆっくり」にします）</span>
        </label>
        {pal ? (
          <p className="agnote">
            活動量の係数：<b>{pal.v}</b>（{pal.parts.join("・")}）。食事摂取基準の区分（低い1.50・ふつう1.75・高い2.00）の間を、生活習慣から、このアプリが補った目安です。
          </p>
        ) : (
          <p className="agnote">歩数・筋トレ・有酸素運動の、どれかを入れると、活動量を細かく計算します（未入力のときは、上の3段階を使います）。</p>
        )}
        {num(l.sleep) > 0 && num(l.sleep) < 6 && <p className="dcwarn">睡眠が6時間未満です。睡眠が短いと、減量の効果が下がり、筋肉が落ちやすいと報告されています（Nedeltcheva 2010）。</p>}
        <a href="#plan" className="startnext">1日の目安を見る ▼</a>
      </div>
      )}
    </section>
  );
}
const num = (s: string) => parseFloat(s) || 0;

