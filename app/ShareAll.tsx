"use client";

import { useEffect, useState } from "react";
import { averageIntake, dateLabel, readLog } from "../lib/daylog";
import { buildPlanText } from "../lib/plantext";
import { readTarget } from "../lib/target";
import { analyzeTrend } from "../lib/trend";
import ShareButtons from "./ShareButtons";

// 最後に：目安・昨日一昨日との差・体重の推移と今後のアクションを、まとめてコピー／共有する。
const r10 = (n: number) => Math.round(n / 10) * 10;
const num = (s: string) => parseFloat(s) || 0;

export default function ShareAll() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const build = () => {
      const t = readTarget();
      if (!t) {
        setText("");
        return;
      }
      const L: string[] = [];
      const name = (() => {
        try {
          return "";
        } catch {
          return "";
        }
      })();
      L.push(`【食事と体重のまとめ】${name}（${dateLabel(0)} 時点）`);
      L.push("");
      L.push(buildPlanText(t));
      const log = readLog();
      const avg = averageIntake(log);
      if (avg) {
        const diff = avg.kcal - t.kcal;
        L.push("");
        L.push("【昨日・一昨日の食事と、目標との差】");
        L.push(`${avg.days === 1 ? "入力した1日" : "平均"}：約${r10(avg.kcal).toLocaleString()}kcal（目標より ${diff >= 0 ? "+" : ""}${r10(diff).toLocaleString()}kcal）`);
        L.push(`たんぱく質 約${Math.round(avg.p)}g（目標${t.p}g）／脂質 約${Math.round(avg.f)}g（目標${t.f}g）／炭水化物 約${Math.round(avg.c)}g（目標${t.c}g）`);
        if (avg.kcal < t.floor - 50) L.push(`※ 下限（${t.floor.toLocaleString()}kcal）を下回っています。食事を増やしましょう。`);
      }
      try {
        const s = JSON.parse(localStorage.getItem("lg-trend") || "null");
        const w = (s?.w ?? []).map((x: string) => num(x));
        if (w[0] > 0) {
          const res = analyzeTrend({ w, kind: t.kind, kcalTarget: t.kcal, avgIntake: avg ? avg.kcal : null, floor: t.floor, flags: { sleepLow: !!s?.flags?.sleepLow, stepsLow: !!s?.flags?.stepsLow, noTrain: !!s?.flags?.noTrain, noLog: !!s?.flags?.noLog, lateSnack: !!s?.flags?.lateSnack }, status: s?.status ?? [] });
          L.push("");
          L.push("【体重の推移と、これから】");
          L.push(`体重：${w.map((x: number, i: number) => (x > 0 ? `${i === 0 ? "今日" : i + "週間前"} ${x}kg` : "")).filter(Boolean).join(" → ")}`);
          if (res.judge) L.push(`判定：${res.judge.label}（${res.slopeText.replace("体重の変化：", "")}）`);
          res.causes.slice(0, 3).forEach((c) => L.push(`原因：${c.t}`));
          res.actions.forEach((a) => L.push(`${a.when}：${a.what}`));
        }
      } catch {}
      L.push("");
      L.push("※ 診断ではなく目安です。持病・服薬のある方、急な体重の変化・強い疲れ・月経が止まったときは、医師・管理栄養士へ。");
      setText(L.join("\n"));
    };
    build();
    setReady(true);
    const evs = ["lg-profile-change", "lg-days2-change", "lg-me-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, build));
    const iv = setInterval(build, 2000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, build));
      clearInterval(iv);
    };
  }, []);
  if (!ready) return null;
  return (
    <section className="card shareall" id="shareall" aria-label="まとめて共有">
      <p className="dch">⑦ まとめて、コピー・共有</p>
      {text ? (
        <>
          <pre className="sharepre">{text}</pre>
          <ShareButtons text={text} label="まとめ" />
        </>
      ) : (
        <p className="dcwarn">基本情報を入れると、ここに、まとめが出ます。</p>
      )}
    </section>
  );
}
