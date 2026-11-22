"use client";

import { useEffect, useState } from "react";
import MethodPlans, { PACK_DEFAULT, PACK_OPTIONS } from "./MethodPlans";
import BreakerView from "./BreakerView";
import { BREAKERS } from "../lib/breakers";
import { readTarget } from "../lib/target";
import PdfButton from "./PdfButton";

// お客様向け：ダイエット方法を、図で、比べる（理想のPFC・注意事項・根拠）。
export function DietMethods({ card = false }: { card?: boolean }) {
  const [ids, setIds] = useState<string[]>(PACK_DEFAULT);
  const [kcal, setKcal] = useState(0);
  useEffect(() => {
    const read = () => setKcal(readTarget()?.kcal ?? 0);
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);
  const body = (
    <>
      <PdfButton target="#dietmethods" title="ダイエット方法の比較（理想のPFC・注意事項）" base="lifegym-methods" />
      <p className="agnote">低糖質・16時間断食・ファスティング・ケトジェニック・脂質カットなどを、並べて比べられます。<b>どの方法も、続けられるかが、いちばん大切です。持病・服薬のある方、妊娠中の方、未成年の方は、先に主治医に相談してください。</b>{kcal > 0 ? "グラムは、ホームで出した、あなたの1日の目安から、計算しています。" : "ホームで基本情報を入れると、あなたの1日のグラム数も出ます。"}</p>
      <div className="spvchips" role="group" aria-label="ダイエット方法">
        {PACK_OPTIONS.map((o) => (
          <button key={o.id} type="button" aria-pressed={ids.includes(o.id)} className={ids.includes(o.id) ? "on" : ""} onClick={() => setIds((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))}>
            <span aria-hidden>{o.icon}</span> {o.label}
          </button>
        ))}
      </div>
      {ids.length === 0 ? <p className="agnote">比べたい方法を、選んでください。</p> : <MethodPlans ids={ids} kcal={kcal} evLimit={3} />}
    </>
  );
  return card ? (
    <section className="card shortprog" id="dietmethods" aria-label="ダイエット方法を比べる">
      <p className="dch">📊 ダイエット方法を、図で比べる（理想のPFC・注意事項）</p>
      {body}
    </section>
  ) : (
    <div id="dietmethods">{body}</div>
  );
}

// お客様向け：停滞期を抜ける・腸内環境を整える方法（リフィード・チートデイなど）。
export function StallBreakers({ card = false }: { card?: boolean }) {
  const [ids, setIds] = useState<string[]>(["log", "dietbreak", "refeed", "cheat"]);
  const body = (
    <>
      <PdfButton target="#stallbreak" title="停滞期を抜ける・腸内環境を整える方法" base="lifegym-stall" />
      <p className="agnote">体重が、2週間以上、動かないとき（停滞期）に、試せる方法です。<b>どれが合うかは、人によって違います。</b>期待できることも、正直に書いています。トレーナーと相談して、1つずつ試してください。</p>
      <div className="spvchips" role="group" aria-label="打開策">
        {BREAKERS.map((b) => (
          <button key={b.id} type="button" aria-pressed={ids.includes(b.id)} className={ids.includes(b.id) ? "on" : ""} onClick={() => setIds((x) => (x.includes(b.id) ? x.filter((y) => y !== b.id) : [...x, b.id]))}>
            <span aria-hidden>{b.icon}</span> {b.name.replace(/（.*$/, "")}
          </button>
        ))}
      </div>
      {ids.length === 0 ? <p className="agnote">見たい方法を、選んでください。</p> : <BreakerView ids={BREAKERS.map((b) => b.id).filter((i) => ids.includes(i))} evLimit={3} />}
    </>
  );
  return card ? (
    <section className="card shortprog" id="stallbreak" aria-label="停滞期を抜ける">
      <p className="dch">🧗 停滞期を抜ける・腸内環境を整える方法</p>
      {body}
    </section>
  ) : (
    <div id="stallbreak">{body}</div>
  );
}
