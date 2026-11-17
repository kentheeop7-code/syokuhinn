"use client";

import { useEffect, useState } from "react";
import { buildPlanText, planNumbers } from "../lib/plantext";
import { readTarget, type Target } from "../lib/target";
import ShareButtons from "./ShareButtons";

// 入力から、1日のカロリー・PFC・食事ごとの量・食事量の目安を、まとめて出す。
export default function PlanResult() {
  const [t, setT] = useState<Target | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setT(readTarget());
    read();
    setReady(true);
    const evs = ["lg-profile-change", "lg-me-change", "storage"];
    evs.forEach((e) => window.addEventListener(e, read));
    return () => evs.forEach((e) => window.removeEventListener(e, read));
  }, []);
  if (!ready) return null;
  if (!t)
    return (
      <section className="card planres" id="plan">
        <p className="dch">③ あなたの1日の目安</p>
        <p className="dcwarn">年齢・身長・体重・目標体重を入れると、1日のカロリーとPFC、食事の量が出ます。</p>
      </section>
    );
  const n = planNumbers(t);
  const badge = { 高: "#2f9e75", 中: "#e0a526", 標準: "#8a96a0" }[t.accuracy];
  return (
    <section className="card planres" id="plan" aria-label="1日の目安">
      <p className="dch">③ あなたの1日の目安</p>
      <div className="plbig">
        <small>1日の目標カロリー</small>
        <b>約{t.kcal.toLocaleString()}<span>kcal</span></b>
        <em style={{ background: badge }}>計算の精度：{t.accuracy}</em>
      </div>
      <p className="agnote">{t.accuracyText}</p>
      <div className="plgrid">
        <div><small>維持のカロリー</small><b>約{t.tdee.toLocaleString()}</b></div>
        {t.bmr > 0 && <div><small>基礎代謝</small><b>約{t.bmr.toLocaleString()}</b></div>}
        <div><small>活動量の係数</small><b>{t.pal}</b></div>
        {n.weeks > 0 && !t.youth && <div><small>ゴールまで</small><b>約{n.weeks}週</b></div>}
      </div>
      {t.youth && <p className="dcwarn">中学生・高校生は、成長期のため、体重を減らす計算はしません。必要な量を、しっかり食べましょう。</p>}

      <p className="startlabel">PFCバランス（1日）</p>
      <div className="plpfc" aria-label="PFCバランス">
        <span style={{ width: `${n.pPct}%`, background: "#3b82c4" }}>P {n.pPct}%</span>
        <span style={{ width: `${n.fPct}%`, background: "#e0a526" }}>F {n.fPct}%</span>
        <span style={{ width: `${n.cPct}%`, background: "#2f9e75" }}>C {n.cPct}%</span>
      </div>
      <table className="pltable">
        <thead>
          <tr><th></th><th>たんぱく質</th><th>脂質</th><th>炭水化物</th><th>kcal</th></tr>
        </thead>
        <tbody>
          <tr className="tot"><th>1日</th><td>{t.p}g</td><td>{t.f}g</td><td>{t.c}g</td><td>{t.kcal.toLocaleString()}</td></tr>
          {n.meals.map((m) => (
            <tr key={m.label}><th>{m.label}</th><td>{m.p}g</td><td>{m.f}g</td><td>{m.c}g</td><td>{m.kcal}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="agnote">たんぱく質は、体重1kgあたり {n.perKg}g。筋肉を守る目安は約1.6g/kg（Morton 2018）。腎臓の病気がある方は、主治医に確認してください。</p>

      <p className="startlabel">食事量の目安（1日）</p>
      <ul className="plguide">
        <li><b>🍚 ごはん</b>茶碗 {n.guide.rice} 杯（1食 約{n.guide.perMeal.rice}杯）</li>
        <li><b>🍖 肉・魚・卵・大豆</b>手のひら {n.guide.palms} 枚（1食 約{n.guide.perMeal.palms}枚）</li>
        <li><b>🥗 野菜</b>{n.guide.veg} 皿（小鉢）</li>
        <li><b>🥛 乳製品</b>{n.guide.dairy} つ　<b>🍎 果物</b>{n.guide.fruit} つ</li>
        <li><b>🌾 食物繊維</b>{n.fiber}g以上　<b>🧂 食塩</b>{n.salt}g未満　<b>💧 水分</b>水・お茶で4杯以上</li>
      </ul>

      <details className="trblock trev">
        <summary>計算の根拠を見る</summary>
        <ul>
          {t.notes.map((x, i) => <li key={i}>{x}</li>)}
          {t.palParts.length > 0 && <li>活動量：{t.palParts.join("・")}（食事摂取基準の区分の間を、このアプリが補った目安）</li>}
          {t.refs.map((r, i) => (
            <li key={"r" + i}>
              {r.label}
              {r.pmid && <>　<a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></>}
            </li>
          ))}
        </ul>
        <p className="agnote">体重1kg＝約7,200kcalは近似で、個人差があります。減らす幅は、維持の15%までにして、代謝が落ちすぎないようにしています。</p>
      </details>

      <ShareButtons text={buildPlanText(t)} label="1日の目安" />
      <a href="#qm" className="startnext">次は、昨日・一昨日の食事を入れる ▼</a>
    </section>
  );
}


