"use client";

import { useState } from "react";
import { CONDS } from "../lib/trainerData";

// 持病・体質ごとの、食事とトレーニングの考え方（根拠つき）。閲覧用。トレーナー用ページと同じ内容。
export default function CondGuide() {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) => setOpen((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const mine = CONDS.filter((c) => open.includes(c.id));
  return (
    <div className="condguide">
      <p className="agnote">当てはまるものを選ぶと、食事と運動の考え方・根拠・限界が出ます。診断や治療ではなく、主治医の指示が優先です。</p>
      <div className="trchips" role="group" aria-label="持病・体質">
        {CONDS.map((c) => (
          <button key={c.id} type="button" aria-pressed={open.includes(c.id)} className={open.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggle(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      {mine.length > 0 && (
        <ul className="trlist">
          {mine.map((c) => (
            <li key={c.id}>
              <div className="trcard" style={{ padding: "12px 14px" }}>
                <p className="trt">
                  {c.icon} {c.label} <span className={`trlv lv-${c.level}`}>根拠 {c.level}</span>
                </p>
                <p className="tra">
                  <b>先に確認</b>
                  {c.ask}
                </p>
                <div className="trs">
                  <small>食事</small>
                  <ol>{c.diet.map((s) => <li key={s}>{s}</li>)}</ol>
                </div>
                <div className="trs">
                  <small>トレーニング</small>
                  <ol>{c.train.map((s) => <li key={s}>{s}</li>)}</ol>
                </div>
                <p className="tre">
                  <small>根拠</small>
                  {c.evidence}
                </p>
                <p className="trl">
                  <small>限界・注意</small>
                  {c.limits}
                </p>
                <p className="trsrc">
                  <small>出典</small>
                  {c.src.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}