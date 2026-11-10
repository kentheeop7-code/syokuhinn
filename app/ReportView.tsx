"use client";

import { useEffect, useState } from "react";
import { CONDS, ISSUES, PLAYS } from "../lib/trainerData";
import { SLOTS, describe, goalOf, r10, slotKcal, totals, type St } from "../lib/meals";
import { makeInsights } from "../lib/advice";
import { computeGoal, PACES, type Pace } from "../lib/goal";
import { EXAMPLES, GENERIC_SWAPS, INCREASE, swapsFor } from "../lib/swaps";
import { microStatus } from "../lib/micro";
import { OTHER_TYPES, describeEx, guideMin, labelOf, weeklyMin, type OtherEx } from "../lib/exercise";
import { REPORT_EVIDENCE } from "../lib/evidenceNotes";
import { decodePayload, shareUrl } from "../lib/shareLink";
import { Bars, HBars, LineChart, Pie, Radar } from "./Charts";
import NutrientBars, { stateOf, type NRow } from "./NutrientBars";
import { lineUrl } from "./LineShare";
import { BANDS } from "./me";

// お客様向けのまとめ（A4・印刷→「PDFとして保存」）。
// mode="trainer"：トレーナー用ページの内容（この端末）から作る。 mode="client"：お客様に送った、リンク（#以降）の内容から作る。
type S = Record<string, any>;
const num = (s: unknown) => parseFloat(String(s ?? "").replace(/,/g, "")) || 0;
const empty = (): St => ({ date: "", size: {}, ext: {} });
const R1 = (n: number) => Math.round(n * 10) / 10;
const COL = { p: "#2e9e6a", f: "#e0a030", c: "#4a7fd0" };
const stOf = (x: any): St => (x?.size ? { date: "", size: x.size, ext: x.ext || {} } : empty());
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default function ReportView({ mode = "trainer" }: { mode?: "trainer" | "client" }) {
  const [s, setS] = useState<S | null>(null);
  const [copied, setCopied] = useState("");
  const [link, setLink] = useState("");
  const [bad, setBad] = useState(false);
  useEffect(() => {
    document.body.classList.add("rpt");
    (async () => {
      if (mode === "client") {
        const h = decodeURIComponent(location.hash.replace(/^#/, ""));
        const p = h ? await decodePayload(h) : null;
        if (p) setS(p as S);
        else setBad(true);
      } else {
        let v: S = {};
        try {
          v = JSON.parse(localStorage.getItem("lg-trainer") || "null") || {};
        } catch {}
        setS(v);
        try {
          setLink(await shareUrl(v));
        } catch {}
      }
    })();
    return () => document.body.classList.remove("rpt");
  }, [mode]);
  if (bad)
    return (
      <div className="rptwrap">
        <p className="plwarn">このリンクの内容を、読みこめませんでした。トレーナーに、もう一度、リンクを送ってもらってください。</p>
      </div>
    );
  if (!s) return null;

  const cur = stOf(s.curMeal);
  const plan = stOf(s.planMeal);
  const sex: "f" | "m" = s.sex === "m" ? "m" : "f";
  const band: number = typeof s.band === "number" ? s.band : 3;
  const ct = totals(cur);
  const pt = totals(plan);
  const base = pt.any ? pt : ct;
  const hasCur = ct.any && pt.any;
  const g = goalOf(sex, band);
  const want = num(s.targetKcal);
  const goalText = s.goal === "diet" ? "体重を減らす" : s.goal === "muscle" ? "筋力・筋肉をつける" : "体重を減らして、筋力もつける";
  const w = num(s.now);
  const wt = num(s.target);
  const days = typeof s.days === "number" ? s.days : 1;
  const others: OtherEx[] = Array.isArray(s.others) ? s.others : [];
  const water = typeof s.water === "number" ? s.water : 0;
  const hasConds = (s.conds || []).length > 0;
  const pace: Pace = hasConds ? "slow" : s.pace === "slow" || s.pace === "fast" ? s.pace : "mid";
  const gp = computeGoal(w, wt, days, pace);
  const issues = ISSUES.filter((i) => (s.issues || []).includes(i.id) && (s.picked || []).includes("i-" + i.id));
  const conds = CONDS.filter((c) => (s.conds || []).includes(c.id) && (s.picked || []).includes("c-" + c.id));
  const plays = PLAYS.filter((p) => (s.picked || []).includes(p.id));
  const ins = makeInsights(cur, sex, band, want).slice(0, 3);
  const swaps = swapsFor(cur).filter((x) => !(s.swapOff || []).includes(x.id));
  const pins: { id: string; title: string; journal: string; date: string }[] = Array.isArray(s.pins) ? s.pins : [];
  const d = new Date();
  const dateText = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  const name = String(s.name || "").trim();
  const kcalMain = pt.any ? pt.kcal : want || 0;
  const aim = want || kcalMain;
  const near = aim ? EXAMPLES.map((e) => ({ id: e.id, d: Math.abs(totals(e.st).kcal - aim) })).sort((a, b) => a.d - b.d)[0]?.id : "";
  let secNo = 0;
  const H = (t: string) => `${++secNo}. ${t}`;
  const paceT = PACES.find((p) => p.id === pace);
  const blocks = gp ? Array.from({ length: Math.min(6, Math.ceil(Math.min(gp.weeks, 24) / 4)) }, (_, i) => ({ label: `${i * 4 + 1}〜${i * 4 + 4}週`, value: days * 4 })) : [];

  // 栄養素のチェック
  const rows: NRow[] = [];
  const micros = (base.any ? microStatus(pt.any ? plan : cur, sex, band) : null);
  const microCur = hasCur ? microStatus(cur, sex, band) : null;
  if (base.any) {
    rows.push({ label: "たんぱく質", unit: "g", cur: hasCur ? Math.round(ct.p) : undefined, plan: Math.round(base.p), goal: parseFloat(g.p || "0"), kind: "min" });
    rows.push({ label: "脂質（エネルギー比）", unit: "%", cur: hasCur ? pct(ct.f * 9, ct.kcal) : undefined, plan: pct(base.f * 9, base.kcal), lo: 20, hi: 30, kind: "range" });
    rows.push({ label: "炭水化物（エネルギー比）", unit: "%", cur: hasCur ? pct(ct.c * 4, ct.kcal) : undefined, plan: pct(base.c * 4, base.kcal), lo: 50, hi: 65, kind: "range" });
    rows.push({ label: "食物繊維", unit: "g", cur: hasCur ? R1(ct.fi) : undefined, plan: R1(base.fi), goal: parseFloat(g.fi || "0"), kind: "min" });
    rows.push({ label: "食塩", unit: "g", cur: hasCur ? R1(ct.salt) : undefined, plan: R1(base.salt), goal: g.salt, kind: "max" });
  }
  if (water > 0) rows.push({ label: "水分（水・お茶）", unit: "杯", plan: water, goal: 4, kind: "min", note: "1杯＝200ml。公的な基準は、確認できていません（このアプリの目安）" });
  const microRows: NRow[] = (micros?.rows ?? []).filter((r) => r.goal > 0).map((r, i) => ({ label: r.label, unit: r.unit, cur: microCur ? Math.round(microCur.rows[i].value * 10) / 10 : undefined, plan: Math.round(r.value * 10) / 10, goal: r.goal, kind: "min" as const }));
  const all = [...rows, ...microRows];
  const okN = all.filter((r) => stateOf(r, r.plan) === "ok").length;
  const low = (micros?.rows ?? []).filter((r) => r.goal > 0 && r.pct < 0.7).sort((a, b) => a.pct - b.pct).slice(0, 3);

  const slotData = SLOTS.map((sl) => ({ label: sl.label, cur: slotKcal(cur, sl), plan: slotKcal(plan, sl) }));
  const slotColors = ["#f2b84b", "#4a7fd0", "#7b5ea7", "#e0709a"];
  const radarAxes = (micros?.rows ?? [])
    .filter((r) => r.goal > 0 && ["ca", "fe", "va", "vc", "b1", "b2", "mg", "zn"].includes(r.key))
    .map((r) => ({ label: r.label.replace("ビタミン", "V"), plan: r.pct, cur: microCur ? microCur.rows.find((x) => x.key === r.key)?.pct : undefined }));
  if (rows.length) {
    const p = rows.find((r) => r.label === "たんぱく質");
    const fi = rows.find((r) => r.label === "食物繊維");
    if (p?.goal) radarAxes.unshift({ label: "たんぱく質", plan: p.plan / p.goal, cur: p.cur !== undefined ? p.cur / p.goal : undefined });
    if (fi?.goal) radarAxes.splice(1, 0, { label: "食物繊維", plan: fi.plan / fi.goal, cur: fi.cur !== undefined ? fi.cur / fi.goal : undefined });
  }
  const exK = EXAMPLES.map((e) => ({ label: e.name, value: Math.round(totals(e.st).kcal / 10) * 10, color: near === e.id ? "#2e9e6a" : "#9fc4b0" }));

  const text = () => {
    let body = "";
    try {
      body = localStorage.getItem("lg-trainer-text") || "";
    } catch {}
    return `【LIFEGYM トレーニングのまとめ】\n${dateText}${name ? `　${name}さん` : ""}\n\n${body}${link && link.length <= 1800 && !body.includes(link) ? `\n\n■ あなた専用のまとめ（スマホで見られます）\n${link}` : ""}\n\n※ 一般的な目安です。持病・服薬のある方は、主治医にご確認ください。`;
  };
  const copy = async (what: "text" | "link") => {
    const v = what === "text" ? text() : link;
    try {
      await navigator.clipboard.writeText(v);
      setCopied(what);
      setTimeout(() => setCopied(""), 3000);
    } catch {
      window.prompt("コピーして、使ってください", v);
    }
  };

  return (
    <div className="rptwrap">
      <div className="noprint rptbar">
        {mode === "trainer" ? (
          <>
            <p className="agnote">お客様に渡す「まとめ」の、プレビューです。内容を確かめて、PDFにするか、お客様専用のリンクを送ります。</p>
            <div className="rptbtns">
              <button type="button" className="linebtn" onClick={() => window.print()}>
                📄 PDFとして保存（印刷）
              </button>
              <button type="button" className="btn ghost" onClick={() => copy("link")} disabled={!link}>
                {copied === "link" ? "✓ リンクをコピーしました" : "お客様専用ページの、リンクをコピー"}
              </button>
              <button type="button" className="btn ghost" onClick={() => copy("text")}>
                {copied === "text" ? "✓ 文章をコピーしました" : "LINE用の文章をコピー"}
              </button>
              <button type="button" className="btn ghost" onClick={() => window.open(lineUrl(text()), "_blank", "noopener")}>
                公式LINEを開く（文章・リンクつき）
              </button>
              <a className="btn ghost" href="/trainer">
                ‹ 戻って直す
              </a>
            </div>
            <ol className="rptsteps">
              <li>「PDFとして保存」で、PDFを作る（印刷の画面で、送信先を「PDFに保存」）。</li>
              <li>「公式LINEを開く」で、文章と、お客様専用ページのリンクを送る。</li>
              <li>LINEのトークで、保存したPDFを、ファイルとして添付する（PDFは、LINEの仕様上、自動では添付できません）。</li>
            </ol>
            <p className="agnote small">お客様専用ページのリンクは、お客様の内容が、リンクの中に入っています（サーバーには、保存されません）。お客様ごとに、送ってください。</p>
          </>
        ) : (
          <>
            <p className="agnote">{name ? `${name}さんの、` : ""}食事・運動のまとめです。スマホで、いつでも見られます。</p>
            <div className="rptbtns">
              <button type="button" className="linebtn" onClick={() => window.print()}>
                📄 PDFとして保存する
              </button>
            </div>
          </>
        )}
      </div>

      <article className="report" aria-label="お客様向けのまとめ">
        <header className="rhead">
          <p className="rbrand">LIFEGYM</p>
          <h1>あなたの目指す姿と、食事・運動のまとめ</h1>
          <p className="rmeta">
            {dateText}
            {name ? `　${name} さん` : ""}
          </p>
        </header>

        <div className="rkpi" aria-label="サマリー">
          <div>
            <small>目標</small>
            <b>{gp ? `${w}→${wt}kg` : w ? `${w}kg` : "—"}</b>
            <em>{gp ? `約${gp.weeks}週間` : goalText}</em>
          </div>
          <div>
            <small>1日の食事</small>
            <b>{kcalMain > 0 ? `約${r10(kcalMain).toLocaleString()}` : "—"}</b>
            <em>kcal</em>
          </div>
          <div>
            <small>筋トレ</small>
            <b>週{days}回</b>
            <em>{gp ? `合計${gp.sessions}回` : ""}</em>
          </div>
          <div>
            <small>その他の運動</small>
            <b>{others.length ? `週${weeklyMin(others)}分` : "—"}</b>
            <em>{others.length ? `国の目安 ${guideMin(band)}分` : ""}</em>
          </div>
          <div>
            <small>栄養チェック</small>
            <b>{all.length ? `${okN}/${all.length}` : "—"}</b>
            <em>目安を満たした数</em>
          </div>
        </div>

        <section>
          <h2>{H("ゴール（どこを目指すか）")}</h2>
          <p className="rgoal">
            <span>{goalText}</span>
            {gp ? (
              <>
                <b>
                  {w}kg → {wt}kg
                </b>
                <em>
                  約{gp.weeks}週間{gp.capped ? "（1年以上）" : ""}　／　筋トレ 週{days}回　→　合計 {gp.sessions}回
                </em>
              </>
            ) : (
              <em>
                {w ? `体重：${w}kg` : ""}
                {days ? `　筋トレ 週${days}回` : ""}
              </em>
            )}
          </p>
          {gp && (
            <>
              <LineChart pts={gp.pts} target={wt} marks={gp.marks} />
              <table className="rtable rmarks">
                <thead>
                  <tr>
                    <th>めやす</th>
                    <th>体重</th>
                    <th>筋トレ 累計</th>
                  </tr>
                </thead>
                <tbody>
                  {gp.marks.map((m) => (
                    <tr key={m.week}>
                      <th>{m.week}週後</th>
                      <td>{m.kg}kg</td>
                      <td>{m.sessions}回</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="rnote">
                ペース：{paceT?.t}（{paceT?.d}）。週に約{gp.rate}kgの変化が前提で、食事の置きかえと活動で、1日に約{gp.perDay}kcalの差をつくります。体重の変化の目安で、個人差があります。
                {hasConds ? "持病・体質がある方は、ゆっくり（月1kgまで）で、主治医の指示を優先します。" : ""}
              </p>
            </>
          )}
        </section>

        <section>
          <h2>{H("運動のプラン")}</h2>
          <ul>
            {describeEx(days, others).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {others.length > 0 && (
            <>
              <Bars unit="分" items={[...others.map((x) => ({ label: labelOf(x.id).slice(0, 6), value: x.min * x.days })), { label: "国の目安", value: guideMin(band) }]} />
              <p className="rnote">
                週の合計 {weeklyMin(others)}分（国の目安：歩行など 週{guideMin(band)}分）。筋トレは、国の目安で週2〜3日。まず、できることから、少しずつ。
              </p>
            </>
          )}
          <p className="rnote">
            筋トレは、週1回でも、続ければ、筋力が伸びます（1週間の総量が同じなら、回数による筋力の差は、見られませんでした：Grgic 2018）。歩数は、1日7,000歩でも、健康の効果が大きいと報告されています（Ding 2025）。
          </p>
        </section>

        {(kcalMain > 0 || ct.any) && (
          <section>
            <h2>{H("1日の食事の目安と、栄養のバランス")}</h2>
            <p className="rbig">
              {kcalMain > 0 ? (
                <>
                  <b>約 {r10(kcalMain).toLocaleString()}</b> kcal / 日{pt.any ? "（提案する食事）" : "（目標）"}
                </>
              ) : null}
            </p>
            {base.any && (
              <div className="rpies">
                {hasCur && <Pie data={[{ label: "たんぱく質", value: ct.p * 4, color: COL.p }, { label: "脂質", value: ct.f * 9, color: COL.f }, { label: "炭水化物", value: ct.c * 4, color: COL.c }]} title="いまの食事" />}
                <Pie data={[{ label: "たんぱく質", value: base.p * 4, color: COL.p }, { label: "脂質", value: base.f * 9, color: COL.f }, { label: "炭水化物", value: base.c * 4, color: COL.c }]} title={hasCur ? "これからの食事" : "いまの食事"} />
              </div>
            )}
            {base.any && (
              <>
                <p className="nbgroup">朝・昼・夜・おやつの、カロリー配分</p>
                <div className="rchartrow">
                  <Pie
                    size={120}
                    title={hasCur ? "これから" : "いま"}
                    data={slotData.map((s2, i) => ({ label: s2.label, value: Math.max(1, hasCur ? s2.plan : pt.any ? s2.plan : s2.cur), color: slotColors[i] }))}
                  />
                  <div style={{ flex: "1 1 220px" }}>
                    <HBars unit="kcal" items={slotData.map((s2, i) => ({ label: s2.label, value: Math.round((hasCur ? s2.plan : pt.any ? s2.plan : s2.cur) / 10) * 10, color: slotColors[i] }))} />
                  </div>
                </div>
              </>
            )}
            <p className="rnote">
              円グラフは、エネルギーの割合。国の目標量は、たんぱく質13〜20%・脂質20〜30%・炭水化物50〜65%（食事摂取基準 2025年版。年齢で少し変わります）。{BANDS[band]}・{sex === "m" ? "男性" : "女性"}の目安。量は「ふつうの1食ぶん」からの目安で、実際とは、ずれます。
            </p>
          </section>
        )}

        {all.length > 0 && (
          <section>
            <h2>{H("栄養素のチェック（食物繊維・脂質・水分・塩分・ビタミン・ミネラル）")}</h2>
            <div className="rscore">
              <Pie size={96} data={[{ label: "目安の範囲", value: okN, color: "#2e9e6a" }, { label: "あと少し", value: Math.max(0, all.length - okN), color: "#e3e6ea" }]} />
              <p>
                目安を満たした栄養素　<b>{okN}</b> / {all.length}
                <br />
                <span className="rnote">{hasCur ? "細い線＝いま、太い線＝これから。縦線＝目安。" : "太い線＝いまの食事。縦線＝目安。"}</span>
              </p>
            </div>
            {radarAxes.length >= 3 && (
              <div className="rchartrow">
                <Radar axes={radarAxes} />
                <p className="rnote" style={{ maxWidth: 260 }}>
                  レーダーチャート：緑の点線の輪が、1日の目安（100%）。緑の面が、{hasCur ? "これから" : "いま"}の食事{hasCur ? "、灰色の点線が、いまの食事" : ""}。外側ほど、足りています。
                </p>
              </div>
            )}
            {rows.length > 0 && (
              <>
                <p className="nbgroup">エネルギーの栄養素・塩分・水分</p>
                <NutrientBars rows={rows} hasCur={hasCur} />
              </>
            )}
            {microRows.length > 0 && (
              <>
                <p className="nbgroup">ビタミン・ミネラル</p>
                <NutrientBars rows={microRows} hasCur={hasCur} />
                <p className="rnote">ビタミン・ミネラルは、重さの決められる食品（ごはん・肉・魚・卵・野菜・乳製品など）だけで計算しています。外食・お菓子・汁物などの分は含まないため、実際より、少なめに出ます。目安は、食事摂取基準（2025年版）の推奨量・目安量です。</p>
              </>
            )}
            {low.length > 0 && (
              <div className="rshort">
                <b>足りにくい栄養と、おすすめの食品</b>
                <ul>
                  {low.map((r) => (
                    <li key={r.key}>
                      <b>{r.label}</b>（目安の{Math.round(r.pct * 100)}%）→ {r.foods}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section>
          <h2>{H("こちらを食べてください（増やす食事・置きかえ）")}</h2>
          <p className="rnote">食べるのを、がまんするのではなく、「代わりに、こちらを食べる」置きかえです。栄養が、増えます。</p>
          <table className="rtable rswap">
            <thead>
              <tr>
                <th>いまの食事</th>
                <th>こちらを、食べてください</th>
                <th>増えるもの</th>
              </tr>
            </thead>
            <tbody>
              {swaps.length > 0
                ? swaps.map((x) => (
                    <tr key={x.id}>
                      <td>{x.from}</td>
                      <td>
                        <b>{x.to}</b>
                      </td>
                      <td>
                        {x.why}
                        <br />
                        <span className="ract">
                          {x.dk > 0 ? "+" : ""}
                          {x.dk}kcal／たんぱく質 {x.dp > 0 ? "+" : ""}
                          {x.dp}g／食物繊維 {x.dfi > 0 ? "+" : ""}
                          {x.dfi}g
                        </span>
                      </td>
                    </tr>
                  ))
                : GENERIC_SWAPS.map(([a, b]) => (
                    <tr key={a}>
                      <td>{a}</td>
                      <td>
                        <b>{b}</b>
                      </td>
                      <td>栄養が、増える</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {swaps.length > 0 && (
            <>
              <p className="nbgroup">置きかえで、増えるたんぱく質（g）</p>
              <HBars unit="g" items={swaps.map((x) => ({ label: x.from.slice(0, 8), value: Math.max(0, x.dp) }))} />
              <p className="nbgroup">置きかえで、変わるカロリー（kcal）</p>
              <HBars unit="kcal" items={swaps.map((x) => ({ label: x.from.slice(0, 8), value: Math.abs(x.dk), color: x.dk <= 0 ? "#4a7fd0" : "#e0a030" }))} />
              <p className="rnote">青＝カロリーが減る置きかえ、オレンジ＝カロリーが増える置きかえ（栄養が増えるため）。</p>
              <p className="rnote">そのほかの置きかえ</p>
              <table className="rtable rswap">
                <tbody>
                  {GENERIC_SWAPS.map(([a, b]) => (
                    <tr key={a}>
                      <td>{a}</td>
                      <td>
                        <b>{b}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section>
          <h2>{H("増やしたい食品リスト（目的別）")}</h2>
          <p className="rnote">1回ぶんの目安です。栄養は、日本食品標準成分表をもとにした目安値からの計算です。</p>
          <p className="nbgroup">たんぱく質が多い食品（1回ぶん・g）</p>
          <HBars unit="g" items={[...INCREASE[0].items].sort((a, b) => b.p - a.p).slice(0, 8).map((it) => ({ label: it.label.replace(/ .*$/, ""), value: it.p }))} />
          <p className="nbgroup">食物繊維が多い食品（1回ぶん・g）</p>
          <HBars unit="g" color="#4a7fd0" items={[...INCREASE[1].items].sort((a, b) => b.fi - a.fi).slice(0, 8).map((it) => ({ label: it.label.replace(/ .*$/, ""), value: it.fi }))} />
          {INCREASE.map((grp) => (
            <div key={grp.title} className="rinc">
              <p className="rext">
                {grp.title}
                <span> {grp.why}</span>
              </p>
              <table className="rtable rinct">
                <thead>
                  <tr>
                    <th>食品（1回ぶん）</th>
                    <th>kcal</th>
                    <th>たんぱく質</th>
                    <th>食物繊維</th>
                    <th>カルシウム</th>
                    <th>鉄</th>
                  </tr>
                </thead>
                <tbody>
                  {grp.items.map((it) => (
                    <tr key={it.label}>
                      <th>{it.label}</th>
                      <td>{it.kcal}</td>
                      <td>{it.p}g</td>
                      <td>{it.fi}g</td>
                      <td>{it.ca}mg</td>
                      <td>{it.fe}mg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <section>
          <h2>{H("1日の食事の例（8パターン）")}</h2>
          <p className="rnote">そのまま、まねできる例です。{near ? "目安のカロリーに近い例に、★をつけています。" : ""}</p>
          <p className="nbgroup">8パターンの、カロリー{aim ? `（縦線＝目安 ${r10(aim).toLocaleString()}kcal）` : ""}</p>
          <HBars unit="kcal" items={exK} target={aim || undefined} />
          <div className="rex">
            {EXAMPLES.map((e) => {
              const t = totals(e.st);
              return (
                <div key={e.id} className={`rexc${near === e.id ? " near" : ""}`}>
                  <p className="rext">
                    {near === e.id ? "★ " : ""}
                    {e.name}　<b>約{r10(t.kcal).toLocaleString()}kcal</b>
                  </p>
                  <p className="rexn">
                    たんぱく質 {Math.round(t.p)}g／食物繊維 {R1(t.fi)}g／食塩 {R1(t.salt)}g　{e.note}
                  </p>
                  <ul>
                    {describe(e.st).map((l) => (
                      <li key={l}>{l.replace(/（約\d[\d,]*kcal）$/, "")}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

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
            {String(s.nextDate || "").trim() && (
              <p>
                次回の確認：<b>{String(s.nextDate).trim()}</b>
              </p>
            )}
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

        <section className="rsrc">
          <h2>{H("根拠（研究から分かっていること）")}</h2>
          <table className="rtable rev">
            <thead>
              <tr>
                <th>テーマ</th>
                <th>分かっていること</th>
                <th>研究（PubMed番号）</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_EVIDENCE.map((e) => (
                <tr key={e.pmid}>
                  <th>{e.topic}</th>
                  <td>
                    {e.found}
                    <br />
                    <span className="rlim">限界：{e.limit}</span>
                  </td>
                  <td>
                    {e.ref}
                    <br />
                    <span className="rlim">PMID {e.pmid}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pins.length > 0 && (
            <>
              <p className="rnote">トレーナーが、参考にした、最新の研究</p>
              <ul>
                {pins.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    {p.title.replace(/\.$/, "")}（{p.journal}・{p.date}） PMID {p.id}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="rnote">PubMed（米国国立医学図書館）の論文の要旨で、数字と結論を確認しています。論文のタイトルと番号で、検索できます。</p>
        </section>

        <footer className="rfoot">※ 一般的な目安で、診断や治療ではありません。持病・服薬・妊娠中の方は、主治医にご相談ください。　LIFEGYM</footer>
      </article>
    </div>
  );
}