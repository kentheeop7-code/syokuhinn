"use client";

import { useState } from "react";
import { SHORT_PLANS } from "../lib/shortplans";
import ShortPlanView from "./ShortPlanView";

// お客様向け（ホーム）：短期プログラム（ファスティング・16時間断食・腸活・短期ダイエット）を、選んで見る。
export default function ShortPrograms() {
  const [id, setId] = useState(SHORT_PLANS[0].id);
  const plan = SHORT_PLANS.find((p) => p.id === id) ?? SHORT_PLANS[0];
  return (
    <section className="card shortprog" id="shortplan" aria-label="短期プログラム">
      <p className="dch">🗓 短期プログラム（ファスティング・腸活・短期ダイエット）</p>
      <p className="agnote">期間を決めて行う、短い取り組みです。ダイエットの方法（食事の割合）とは、別に、選べます。<b>持病・服薬のある方、妊娠中の方、未成年の方は、先に主治医に相談してください。</b></p>
      <div className="spvchips" role="tablist" aria-label="短期プログラム">
        {SHORT_PLANS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={id === p.id} className={id === p.id ? "on" : ""} onClick={() => setId(p.id)}>
            <span aria-hidden>{p.icon}</span> {p.name.replace(/（.*$/, "")}
            <small>{p.kind}・{p.period.replace(/（.*$/, "")}</small>
          </button>
        ))}
      </div>
      <ShortPlanView plan={plan} evLimit={4} />
    </section>
  );
}
