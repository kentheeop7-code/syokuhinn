"use client";

import { useEffect, useState } from "react";
import { computeGoal } from "../lib/goal";
import { Bars, LineChart, Pie } from "./Charts";
import { readMe } from "./me";

// 「体重と目標」ページ：入力した体重・目標・ペースから、ゴールまでの道すじ（折れ線）と、食事の目安のバランス（円）を出す。
type Plan = { kcal: number; p: number; f: number; c: number; now: number; goal: number };
const num = (s: string | null) => parseFloat(s || "") || 0;

export default function PlanChart() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pace, setPace] = useState<"slow" | "mid">("slow");
  const [days, setDays] = useState(3);
  useEffect(() => {
    const read = () => {
      try {
        const p = JSON.parse(localStorage.getItem("lg-plan2") || "null");
        setPlan(p && p.kcal ? p : null);
        setPace(localStorage.getItem("lg-pace2") === "mid" ? "mid" : "slow");
        const d = num(localStorage.getItem("lg-days"));
        if (d >= 1 && d <= 7) setDays(d);
      } catch {}
    };
    read();
    const evs = ["lg-status-change", "lg-profile-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    const iv = setInterval(read, 1500);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, read));
      clearInterval(iv);
    };
  }, []);
  const pick = (d: number) => {
    setDays(d);
    try {
      localStorage.setItem("lg-days", String(d));
    } catch {}
  };
  if (!plan) return null;
  if (readMe().band <= 1) return null; // 中学生・高校生には、大人の減量の道すじは、出さない
  const gp = computeGoal(plan.now, plan.goal, days, "slow", pace === "slow" ? 12 / 52 : 24 / 52);
  if (!gp) return null;
  const blocks = Array.from({ length: Math.min(6, Math.ceil(Math.min(gp.weeks, 24) / 4)) }, (_, i) => ({ label: `${i * 4 + 1}〜${i * 4 + 4}週`, value: days * 4 }));
  return (
    <section className="card planchart" aria-label="ゴールまでの道すじ">
      <p className="balh">📈 ゴールまでの道すじ</p>
      <p className="trgoal">
        <b>
          {plan.now}kg → {plan.goal}kg
        </b>
        　約<b>{gp.weeks}</b>週間{gp.capped ? "（1年以上）" : ""}
      </p>
      <LineChart pts={gp.pts} target={plan.goal} marks={gp.marks} />
      <p className="balh sub">筋トレは、週に何回？</p>
      <div className="plpace" role="radiogroup" aria-label="筋トレの回数">
        {[2, 3, 4].map((d) => (
          <button key={d} type="button" role="radio" aria-checked={days === d} className={days === d ? "on" : ""} onClick={() => pick(d)}>
            週{d}回
          </button>
        ))}
      </div>
      <p className="trgoal">
        ゴールまでに、筋トレ 合計 <b>{gp.sessions}</b> 回
      </p>
      <Bars items={blocks} />
      <p className="balh sub">1日の食事の目安のバランス（約{plan.kcal.toLocaleString()}kcal）</p>
      <Pie
        data={[
          { label: "たんぱく質", value: plan.p * 4, color: "#2e9e6a" },
          { label: "脂質", value: plan.f * 9, color: "#e0a030" },
          { label: "炭水化物", value: plan.c * 4, color: "#4a7fd0" },
        ]}
      />
      <p className="agnote small">週に約{gp.rate}kgの変化が前提です（{pace === "slow" ? "ゆっくり：月1kg" : "月2kg"}）。1日に約{gp.perDay}kcalの差が必要です。体重の変化の目安で、個人差があります。</p>
    </section>
  );
}