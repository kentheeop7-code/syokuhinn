"use client";

import { useEffect, useState } from "react";
import { BAND_SHORT, readMe } from "./me";
import { PRESETS } from "./presets";

type Status = { touched: boolean; kcal: number; need: number; kcalSt: "low" | "ok" | "high"; ok: number; total: number; p: number; f: number; c: number };

// ホームの先頭：いまの食事から、推定カロリーを出す。1タップで入れて、すぐ数字が出る。
export default function HomeHero() {
  const [s, setS] = useState<Status | null>(null);
  const [preset, setPreset] = useState("");
  const [now, setNow] = useState(0);
  const [goal, setGoal] = useState(0);
  const [band, setBand] = useState(3);
  const [sexText, setSexText] = useState("女性");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setS(JSON.parse(localStorage.getItem("lg-status") || "null"));
        setPreset(localStorage.getItem("lg-preset") || "");
        setNow(parseFloat(localStorage.getItem("lg-now") || "") || 0);
        const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
        setGoal(parseFloat(p?.weight) || 0);
        const me = readMe();
        setBand(me.band);
        setSexText(me.sex === 2 ? "男性" : "女性");
      } catch {}
    };
    read();
    setReady(true);
    const evs = ["lg-status-change", "lg-profile-change", "lg-me-change", "lg-preset-applied", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    const iv = setInterval(read, 1500);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, read));
      clearInterval(iv);
    };
  }, []);

  if (!ready) return null;

  const has = !!s && s.touched;
  const diff = has ? s!.kcal - s!.need : 0;
  const pct = has ? Math.min(150, Math.round((s!.kcal / s!.need) * 100)) : 0;
  const okPct = has ? Math.round((s!.ok / s!.total) * 100) : 0;
  const verdict = !has ? "" : s!.kcalSt === "ok" ? "必要な量に、ほぼ合っています" : s!.kcalSt === "low" ? `必要な量より、約${Math.abs(Math.round(diff / 10) * 10).toLocaleString()}kcal 少なめ` : `必要な量より、約${Math.round(diff / 10) * 10}kcal 多め`;

  const pick = (id: string) => window.dispatchEvent(new CustomEvent("lg-preset", { detail: id }));

  return (
    <section className={`card hero ${has ? s!.kcalSt : "none"}`} aria-label="いまの推定カロリー">
      <p className="herolabel">いまの食事から、推定カロリー</p>
      <p className="herokcal">
        {has ? (
          <>
            <b>約{(Math.round(s!.kcal / 10) * 10).toLocaleString()}</b>
            <span>kcal / 日</span>
          </>
        ) : (
          <>
            <b className="dash">— —</b>
            <span>kcal / 日</span>
          </>
        )}
      </p>
      <div className="herobar" aria-hidden>
        <span style={{ width: `${Math.round((pct / 150) * 100)}%` }} />
        <i style={{ left: `${Math.round((100 / 150) * 100)}%` }} />
      </div>
      <p className="heroneed">
        {has ? (
          <>
            必要な目安：<b>{s!.need.toLocaleString()}kcal</b>（{sexText}・{BAND_SHORT[band]}）
            <em className={s!.kcalSt}>{verdict}</em>
          </>
        ) : (
          "いつもの食事に近いものを選ぶと、数字が出ます"
        )}
      </p>

      <p className="herolabel sub">いつもの食事は？（1タップ）</p>
      <div className="heropick">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" aria-pressed={preset === p.id} className={preset === p.id ? "on" : ""} onClick={() => pick(p.id)}>
            <span aria-hidden>{p.icon}</span>
            {p.short}
          </button>
        ))}
      </div>

      {has && (
        <div className="heromini">
          <div>
            <small>栄養の整い度</small>
            <b>
              {s!.ok}/{s!.total}
            </b>
            <em className={okPct >= 75 ? "ok" : okPct >= 50 ? "low" : "high"}>{okPct >= 75 ? "よい" : okPct >= 50 ? "もう少し" : "見直し"}</em>
          </div>
          <div>
            <small>P・F・C</small>
            <b>
              {s!.p}・{s!.f}・{s!.c}
              <u>%</u>
            </b>
          </div>
          {now > 0 && (
            <div>
              <small>体重</small>
              <b>
                {now}kg{goal ? <u> → {goal}</u> : null}
              </b>
            </div>
          )}
        </div>
      )}

      <div className="heroacts">
        <a href="#bal" className="heroa main">
          くわしく直す
        </a>
        <a href="#cause" className="heroa">
          原因を知る
        </a>
      </div>
    </section>
  );
}
