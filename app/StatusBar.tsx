"use client";

import { useEffect, useState } from "react";
import { BAND_SHORT, readMe } from "./me";

type Status = { touched: boolean; kcal: number; need: number; kcalSt: "low" | "ok" | "high"; ok: number; total: number; p: number; f: number; c: number };

// ホームの先頭：いまの状態が、ひと目で分かる「ステータスバー」
export default function StatusBar() {
  const [s, setS] = useState<Status | null>(null);
  const [now, setNow] = useState(0);
  const [goal, setGoal] = useState(0);
  const [height, setHeight] = useState(0);
  const [band, setBand] = useState(3);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setS(JSON.parse(localStorage.getItem("lg-status") || "null"));
        setNow(parseFloat(localStorage.getItem("lg-now") || "") || 0);
        const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
        setGoal(parseFloat(p?.weight) || 0);
        setHeight(parseFloat(p?.height) || 0);
        setBand(readMe().band);
      } catch {}
    };
    read();
    setReady(true);
    window.addEventListener("lg-status-change", read);
    window.addEventListener("lg-profile-change", read);
    window.addEventListener("lg-me-change", read);
    window.addEventListener("storage", read);
    const iv = setInterval(read, 1500); // 体重の入力は、すぐ反映
    return () => {
      window.removeEventListener("lg-status-change", read);
      window.removeEventListener("lg-profile-change", read);
      window.removeEventListener("lg-me-change", read);
      window.removeEventListener("storage", read);
      clearInterval(iv);
    };
  }, []);

  if (!ready) return null;

  const hasFood = !!s && s.touched;
  const h = height > 100 ? height / 100 : 0;
  const bmi = (w: number) => (h && w ? w / (h * h) : 0);
  const bmiNow = bmi(now);
  const bmiGoal = bmi(goal);
  const loB = band >= 5 ? 21.5 : 18.5;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - 14) / (36 - 14)) * 100));
  const energyPct = hasFood ? Math.min(150, Math.round((s!.kcal / s!.need) * 100)) : 0;
  const okPct = hasFood ? Math.round((s!.ok / s!.total) * 100) : 0;
  const okLabel = !hasFood ? "" : okPct >= 75 ? "よい状態" : okPct >= 50 ? "もう少し" : "見直しどき";

  return (
    <section className="card statbar" aria-label="いまのステータス">
      <h2 className="h2" style={{ marginTop: 0 }}>
        📊 いまのステータス
      </h2>
      {!hasFood && !bmiNow ? (
        <p className="agnote">下の「今の食事のバランス」と、体重を入れると、ここに、いまの状態が出ます。</p>
      ) : null}

      <div className="stgrid">
        <div className={`sttile ${hasFood ? s!.kcalSt : "none"}`}>
          <p className="stlabel">🍚 食事のエネルギー</p>
          <p className="stval">
            {hasFood ? (
              <>
                <b>{s!.kcal.toLocaleString()}</b> / {s!.need.toLocaleString()} <small>kcal</small>
              </>
            ) : (
              <span className="stnone">未入力</span>
            )}
          </p>
          <div className="stbar">
            <span style={{ width: `${Math.min(100, Math.round((energyPct / 150) * 100))}%` }} />
            <i style={{ left: `${Math.round((100 / 150) * 100)}%` }} aria-hidden />
          </div>
          <p className="stnote">{hasFood ? (s!.kcalSt === "ok" ? "必要な量に、ほぼ合っています" : s!.kcalSt === "low" ? "必要な量より、少なめです" : "必要な量より、多めです") : "必要な量：性別・年齢で決まります"}</p>
        </div>

        <div className={`sttile ${hasFood ? (okPct >= 75 ? "ok" : okPct >= 50 ? "low" : "high") : "none"}`}>
          <p className="stlabel">🥗 栄養の整い度</p>
          <p className="stval">
            {hasFood ? (
              <>
                <b>{s!.ok}</b> / {s!.total} <small>項目がOK</small>
              </>
            ) : (
              <span className="stnone">未入力</span>
            )}
          </p>
          <div className="stbar">
            <span style={{ width: `${okPct}%` }} />
          </div>
          <p className="stnote">{hasFood ? okLabel : "PFC・食塩・食物繊維など9項目"}</p>
        </div>

        <div className={`sttile wide ${bmiNow ? "ok" : "none"}`}>
          <p className="stlabel">⚖️ 体重（BMI）の位置</p>
          <p className="stval">
            {now ? (
              <>
                いま <b>{now}</b>kg{goal ? <> → 目標 <b>{goal}</b>kg（あと{Math.max(0, Math.round((now - goal) * 10) / 10)}kg）</> : null}
              </>
            ) : (
              <span className="stnone">未入力（体重の予測に入力）</span>
            )}
          </p>
          {bmiNow ? (
            <div className="bmibar" aria-label={`BMI ${bmiNow.toFixed(1)}`}>
              <i className="bmiok" style={{ left: `${pos(loB)}%`, width: `${pos(24.9) - pos(loB)}%` }} />
              <b className="bminow" style={{ left: `${pos(bmiNow)}%` }} title="いま">
                <span>いま {bmiNow.toFixed(1)}</span>
              </b>
              {bmiGoal ? (
                <b className="bmigoal" style={{ left: `${pos(bmiGoal)}%` }} title="目標">
                  <span>目標 {bmiGoal.toFixed(1)}</span>
                </b>
              ) : null}
            </div>
          ) : (
            <p className="stnote">{height > 100 ? "体重を入れると、BMIの位置が出ます" : "目標を決める欄に、身長を入れると、BMIの位置が出ます"}</p>
          )}
          {bmiNow ? <p className="stnote">緑の帯が、適正な範囲（BMI{loB}〜24.9）です。{BAND_SHORT[band]}の目安。</p> : null}
        </div>

        {hasFood && (
          <div className="sttile wide">
            <p className="stlabel">🔥 P・F・Cのバランス</p>
            <div className="stpfc" role="img" aria-label={`P${s!.p}% F${s!.f}% C${s!.c}%`}>
              <span className="p" style={{ width: `${s!.p}%` }}>
                P {s!.p}%
              </span>
              <span className="f" style={{ width: `${s!.f}%` }}>
                F {s!.f}%
              </span>
              <span className="c" style={{ width: `${s!.c}%` }}>
                C {s!.c}%
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
