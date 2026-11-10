"use client";

import { useEffect, useState } from "react";
import { CONDS, ISSUES, PLAYS } from "../lib/trainerData";
import { describe, goalOf, r10, totals, type St } from "../lib/meals";
import { makeInsights } from "../lib/advice";
import { lineUrl } from "./LineShare";
import { BANDS } from "./me";

// お客様用のまとめ（A4・印刷→「PDFとして保存」）。トレーナー用ページの内容から、自動でつくる。
type S = Record<string, any>;
const num = (s: unknown) => parseFloat(String(s ?? "").replace(/,/g, "")) || 0;
const empty = (): St => ({ date: "", size: {}, ext: {} });
const R1 = (n: number) => Math.round(n * 10) / 10;

export default function ReportView() {
  const [s, setS] = useState<S | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    document.body.classList.add("rpt");
    try {
      setS(JSON.parse(localStorage.getItem("lg-trainer") || "null") || {});
    } catch {
      setS({});
    }
    return () => document.body.classList.remove("rpt");
  }, []);
  if (!s) return null;

  const cur: St = s.curMeal?.size ? { date: "", size: s.curMeal.size, ext: s.curMeal.ext || {} } : empty();
  const plan: St = s.planMeal?.size ? { date: "", size: s.planMeal.size, ext: s.planMeal.ext || {} } : empty();
  const sex: "f" | "m" = s.sex === "m" ? "m" : "f";
  const band: number = typeof s.band === "number" ? s.band : 3;
  const ct = totals(cur);
  const pt = totals(plan);
  const g = goalOf(sex, band);
  const want = num(s.targetKcal);
  const goalText = s.goal === "diet" ? "体重を減らす" : s.goal === "muscle" ? "筋力・筋肉をつける" : "体重を減らして、筋力もつける";
  const w = num(s.now);
  const wt = num(s.target);
  const issues = ISSUES.filter((i) => (s.issues || []).includes(i.id) && (s.picked || []).includes("i-" + i.id));
  const conds = CONDS.filter((c) => (s.conds || []).includes(c.id) && (s.picked || []).includes("c-" + c.id));
  const plays = PLAYS.filter((p) => (s.picked || []).includes(p.id));
  const ins = makeInsights(cur, sex, band, want).slice(0, 3);
  const d = new Date();
  const dateText = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  const name = String(s.name || "").trim();
  const srcs = Array.from(new Set([...issues.map((i) => i.src[0]?.label), ...plays.map((p) => p.src[0]?.label), ...conds.map((c) => c.src[0]?.label)].filter(Boolean)));
  let secNo = 0;
  const H = (t: string) => `${++secNo}. ${t}`;
  const kcalMain = pt.any ? pt.kcal : want || 0;

  const text = () => {
    let body = "";
    try {
      body = localStorage.getItem("lg-trainer-text") || "";
    } catch {}
    return `【LIFEGYM トレーニングのまとめ】\n${dateText}${name ? `　${name}さん` : ""}\n\n${body}\n\n※ 一般的な目安です。持病・服薬のある方は、主治医にご確認ください。`;
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.prompt("コピーして、使ってください", text());
    }
  };

  return (
    <div className="rptwrap">
      <div className="noprint rptbar">
        <p className="agnote">お客様に渡す「まとめ」です。内容を確かめて、「PDFとして保存」を押します（印刷の画面で、送信先を「PDFに保存」にします）。</p>
        <div className="rptbtns">
          <button type="button" className="linebtn" onClick={() => window.print()}>
            📄 PDFとして保存（印刷）
          </button>
          <button type="button" className="btn ghost" onClick={copy}>
            {copied ? "✓ 文章をコピーしました" : "LINE用の文章をコピー"}
          </button>
          <button type="button" className="btn ghost" onClick={() => window.open(lineUrl(text()), "_blank", "noopener")}>
            公式LINEを開く（文章つき）
          </button>
          <a className="btn ghost" href="/trainer">
            ‹ 戻って直す
          </a>
        </div>
        <ol className="rptsteps">
          <li>「PDFとして保存」で、PDFを作る。</li>
          <li>「LINE用の文章をコピー」か「公式LINEを開く」で、文章を送る。</li>
          <li>LINEのトークで、保存したPDFを、ファイルとして、添付して送る（PDFは、LINEの仕様上、自動では添付できません）。</li>
        </ol>
      </div>

      <article className="report" aria-label="お客様用のまとめ">
        <header className="rhead">
          <p className="rbrand">LIFEGYM</p>
          <h1>あなたの食事・トレーニングのまとめ</h1>
          <p className="rmeta">
            {dateText}
            {name ? `　${name} さん` : ""}
          </p>
        </header>

        <section>
          <h2>{H("今回の目的")}</h2>
          <p>
            <b>{goalText}</b>
            {w ? `　体重：${w}kg${wt ? ` → ${wt}kg` : ""}` : ""}
            {s.days ? `　筋トレ：週${s.days}回` : ""}
          </p>
        </section>

        {(kcalMain > 0 || ct.any) && (
          <section>
            <h2>{H("あなたの1日の食事の目安")}</h2>
            <p className="rbig">
              {kcalMain > 0 ? (
                <>
                  <b>約 {r10(kcalMain).toLocaleString()}</b> kcal / 日{pt.any ? "（提案する食事）" : "（目標）"}
                </>
              ) : null}
            </p>
            {pt.any && (
              <table className="rtable">
                <thead>
                  <tr>
                    <th></th>
                    {ct.any && <th>いま</th>}
                    <th>提案</th>
                    <th>目安</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>エネルギー</th>
                    {ct.any && <td>{r10(ct.kcal).toLocaleString()}kcal</td>}
                    <td>{r10(pt.kcal).toLocaleString()}kcal</td>
                    <td>{want ? `${r10(want).toLocaleString()}kcal（目標）` : "—"}</td>
                  </tr>
                  <tr>
                    <th>たんぱく質</th>
                    {ct.any && <td>{Math.round(ct.p)}g</td>}
                    <td>{Math.round(pt.p)}g</td>
                    <td>{g.p}</td>
                  </tr>
                  <tr>
                    <th>脂質</th>
                    {ct.any && <td>{Math.round(ct.f)}g</td>}
                    <td>{Math.round(pt.f)}g</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <th>炭水化物</th>
                    {ct.any && <td>{Math.round(ct.c)}g</td>}
                    <td>{Math.round(pt.c)}g</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <th>食物繊維</th>
                    {ct.any && <td>{R1(ct.fi)}g</td>}
                    <td>{R1(pt.fi)}g</td>
                    <td>{g.fi}</td>
                  </tr>
                  <tr>
                    <th>食塩</th>
                    {ct.any && <td>{R1(ct.salt)}g</td>}
                    <td>{R1(pt.salt)}g</td>
                    <td>{g.salt}g未満</td>
                  </tr>
                </tbody>
              </table>
            )}
            <p className="rnote">
              {BANDS[band]}・{sex === "m" ? "男性" : "女性"}の目安（日本人の食事摂取基準 2025年版）。量は「ふつうの1食ぶん」からの目安で、実際とは、ずれます。
            </p>
          </section>
        )}

        {pt.any && (
          <section>
            <h2>{H("おすすめの食事内容")}</h2>
            <ul>
              {describe(plan).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        )}

        {(issues.length > 0 || String(s.problem || "").trim() || ins.length > 0) && (
          <section>
            <h2>{H("いまの課題と、対策")}</h2>
            <ul>
              {issues.map((i) => (
                <li key={i.id}>
                  {i.share}
                  <br />
                  <span className="ract">▶ {i.act[0]}</span>
                </li>
              ))}
              {!issues.length &&
                ins.map((i) => (
                  <li key={i.id}>
                    {i.t.replace(/。.*$/, "")}
                    <br />
                    <span className="ract">▶ {i.a}</span>
                  </li>
                ))}
              {String(s.problem || "").trim() && <li>{String(s.problem).trim()}</li>}
            </ul>
          </section>
        )}

        {(String(s.weekAct || "").trim() || issues.length > 0) && (
          <section>
            <h2>{H("今週やること")}</h2>
            {String(s.weekAct || "").trim() ? (
              <p className="rbox">{String(s.weekAct).trim()}</p>
            ) : (
              <ul>
                {issues.map((i) => (
                  <li key={i.id}>{i.act[0]}</li>
                ))}
              </ul>
            )}
            {String(s.nextDate || "").trim() && <p>次回の確認：<b>{String(s.nextDate).trim()}</b></p>}
          </section>
        )}

        {(plays.length > 0 || conds.length > 0) && (
          <section>
            <h2>{H("アドバイス")}</h2>
            <ul>
              {plays.map((p) => (
                <li key={p.id}>{p.share(w)}</li>
              ))}
              {conds.map((c) => (
                <li key={c.id}>{c.share}</li>
              ))}
            </ul>
            {conds.length > 0 && <p className="rnote">持病・服薬のある方は、食事や運動を変える前に、主治医に確認してください。</p>}
          </section>
        )}

        {String(s.note || "").trim() && (
          <section>
            <h2>{H("トレーナーから")}</h2>
            <p className="rbox pre">{String(s.note).trim()}</p>
          </section>
        )}

        {srcs.length > 0 && (
          <section className="rsrc">
            <h2>根拠</h2>
            <ul>
              {srcs.map((x) => (
                <li key={x as string}>{x}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="rfoot">※ 一般的な目安で、診断や治療ではありません。持病・服薬・妊娠中の方は、主治医にご相談ください。　LIFEGYM</footer>
      </article>
    </div>
  );
}