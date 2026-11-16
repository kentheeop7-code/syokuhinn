"use client";

import { useState } from "react";
import { TROUBLES } from "../lib/troubles";
import { CONDS, TOPICS } from "../lib/trainerData";
import { searchPapers, type Paper } from "../lib/pubmed";

const box: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 12, margin: "10px 0", background: "#fff" };
const inp: React.CSSProperties = { font: "inherit", padding: "8px 10px", border: "1px solid #bbb", borderRadius: 8, width: "100%", boxSizing: "border-box" };
const lvColor = { 強い: "#2e7d32", 中くらい: "#b26a00", 弱い: "#c62828" } as const;

/* ---- 最新の論文：PubMedから、その場で取得（新しい順）---- */
export function LivePapers({ term, n = 5 }: { term: string; n?: number }) {
  const [state, setState] = useState<"idle" | "load" | "ok" | "none" | "err">("idle");
  const [list, setList] = useState<Paper[]>([]);
  const [at, setAt] = useState("");
  const go = async () => {
    setState("load");
    try {
      const r = await searchPapers(term, n);
      setList(r);
      setAt(new Date().toLocaleString("ja-JP"));
      setState("ok");
    } catch (e) {
      setState((e as Error).message === "none" ? "none" : "err");
    }
  };
  return (
    <div style={{ margin: "6px 0" }}>
      <button type="button" className="trchip on" onClick={go} disabled={state === "load"}>
        {state === "load" ? "取得中…" : state === "idle" ? "🔄 最新の論文を取得（PubMed）" : "🔄 もう一度、最新を取得"}
      </button>
      {state === "none" && <div style={{ fontSize: 13, color: "#555" }}>該当する論文が見つかりませんでした。</div>}
      {state === "err" && <div style={{ fontSize: 13, color: "#c62828" }}>取得できませんでした。通信を確認して、もう一度おためしください。</div>}
      {state === "ok" && (
        <>
          <div style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>取得：{at}／メタ分析・系統的レビューを新しい順。内容の評価はしていません。必ず原文を確認してください。</div>
          <ul style={{ margin: "0 0 0 18px", fontSize: 14 }}>
            {list.map((p) => (
              <li key={p.id} style={{ margin: "4px 0" }}>
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.id}/`} target="_blank" rel="noreferrer">{p.title}</a>
                <div style={{ fontSize: 12, color: "#555" }}>{p.journal}・{p.date}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---- 停滞・代謝低下 ---- */
const SIGNS = [
  "体重・ウエストが、2〜3週間（週平均で）動かない",
  "朝の体温・手足の冷えが、いつもより強い／寒がりになった",
  "強い疲れ・集中力の低下・やる気が出ない",
  "ずっと空腹、または食べ物のことばかり考える",
  "寝つきが悪い・夜中に目がさめる",
  "トレーニングの重さ・回数が落ちる、回復が遅い",
  "女性：月経が乱れる・止まる",
  "便秘・むくみ・髪や肌の乾燥",
];

export function StallTab() {
  const [weeks, setWeeks] = useState("0");
  const [sleep, setSleep] = useState("7");
  const [steps, setSteps] = useState("7000");
  const [prot, setProt] = useState("1.4");
  const [low, setLow] = useState(false); // カロリーが下限に近い
  const [log, setLog] = useState(false); // 記録している
  const [train, setTrain] = useState(false);
  const [long, setLong] = useState("8");
  const [open, setOpen] = useState("");
  const n = (s: string) => parseFloat(s) || 0;

  const rec: { t: string; why: string }[] = [];
  if (!log) rec.push({ t: "まず、食事を3日間記録して、実際の量を確かめる（減らす前に）", why: "停滞の多くは、記録と実際の量のずれ（盛り・間食・飲み物）。" });
  if (n(sleep) < 6) rec.push({ t: "睡眠を6〜7時間以上にする", why: "睡眠5.5時間で、同じ食事でも、体脂肪の減りが少なく、筋肉の減りが多かった（Nedeltcheva 2010）。" });
  if (n(prot) < 1.6) rec.push({ t: "たんぱく質を体重1kgあたり約1.6gへ（腎臓病は主治医に確認）", why: "減量中の筋肉維持（Morton 2018）。" });
  if (!train) rec.push({ t: "筋トレを週1回からでも始める", why: "筋肉が減ると、代謝・見た目ともに不利。" });
  if (n(steps) < 8000) rec.push({ t: "歩数を、いまより +1,000〜2,000歩", why: "食事を減らさずに、消費を足せる、安全な方法。" });
  if (n(weeks) >= 2 && n(long) >= 8) rec.push({ t: "1〜2週間、維持カロリーまで戻す「休み期間」を入れ、その後もとの設定へ", why: "休み期間をはさんだ群は、体重・体脂肪が多く減り、代謝低下も小さかった（MATADOR 2018・肥満男性51人の短期研究。一般の人・女性での確認は限定的）。" });
  if (low) rec.push({ t: "これ以上カロリーを減らさない。下限（女性1,200・男性1,500kcalか基礎代謝の高い方）を守る", why: "下げすぎは、筋肉の減少・疲れ・月経異常の原因。" });
  if (n(weeks) >= 4) rec.push({ t: "4週間以上動かないときは、医師に相談（甲状腺・ホルモン・服薬の影響の確認）", why: "病気や薬の影響の可能性。" });

  return (
    <section>
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>代謝が落ちている・止まっているときの合図</h3>
        <ul style={{ margin: "0 0 0 18px" }}>{SIGNS.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <div style={{ fontSize: 13, color: "#8a4b00", marginTop: 6 }}>
          ※ 上の「合図」は、現場で一般的に使われる目安で、個別の論文で確認した診断基準ではありません。研究では、減量後の代謝低下（適応熱産生）は、質の高い研究では小さい、または有意でないとされています（Br J Nutr 2022・系統的レビュー）。「止まった」＝代謝のせい、と決めつけず、記録・睡眠・筋肉・活動量から確かめます。
        </div>
      </div>

      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>お客様の状況から、対処をレコメンド</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
          <label>停滞の週数<input style={inp} inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} /></label>
          <label>減量を続けた週数<input style={inp} inputMode="numeric" value={long} onChange={(e) => setLong(e.target.value)} /></label>
          <label>睡眠 時間<input style={inp} inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} /></label>
          <label>歩数／日<input style={inp} inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
          <label>たんぱく質 g/kg<input style={inp} inputMode="decimal" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
          <button type="button" className={log ? "trchip on" : "trchip"} aria-pressed={log} onClick={() => setLog(!log)}>食事を記録している</button>
          <button type="button" className={train ? "trchip on" : "trchip"} aria-pressed={train} onClick={() => setTrain(!train)}>筋トレをしている</button>
          <button type="button" className={low ? "trchip on" : "trchip"} aria-pressed={low} onClick={() => setLow(!low)}>カロリーが下限に近い</button>
        </div>
        {rec.length === 0 ? <div>大きな問題は見当たりません。もう少し様子を見ましょう（週平均で比べる）。</div> : (
          <ol style={{ margin: "0 0 0 18px" }}>{rec.map((r, i) => <li key={i} style={{ margin: "6px 0" }}><b>{r.t}</b><div style={{ fontSize: 13, color: "#555" }}>{r.why}</div></li>)}</ol>
        )}
      </div>

      <h3>体の困りごと別：原因の見かた・対処・根拠</h3>
      {TROUBLES.map((t) => (
        <div key={t.id} style={box}>
          <button type="button" onClick={() => setOpen(open === t.id ? "" : t.id)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", fontWeight: 700 }} aria-expanded={open === t.id}>
            {t.icon} {t.label}　<span style={{ color: lvColor[t.level], fontSize: 13 }}>根拠：{t.level}</span>　{open === t.id ? "▲" : "▼"}
          </button>
          {open === t.id && (
            <div>
              <p>{t.intro}</p>
              <b>原因の見かた</b><ul style={{ margin: "0 0 0 18px" }}>{t.check.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <b>対処（順番に）</b><ul style={{ margin: "0 0 0 18px" }}>{t.steps.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <b>増やす食べもの</b><ul style={{ margin: "0 0 0 18px" }}>{t.eat.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <b style={{ color: "#c62828" }}>受診の目安</b><ul style={{ margin: "0 0 0 18px" }}>{t.see.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <b>根拠</b>
              <ul style={{ margin: "0 0 0 18px", fontSize: 13 }}>{t.evidence.map((e, i) => <li key={i}>{e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></li>)}</ul>
              <div style={{ fontSize: 13, color: "#8a4b00" }}>限界：{t.limits}</div>
              <div style={{ fontSize: 13, background: "#f6f6f6", padding: 8, borderRadius: 8, margin: "6px 0" }}>LINE用：{t.share}</div>
            </div>
          )}
        </div>
      ))}
      <div style={box}>
        <b>停滞・代謝の最新論文</b>
        <LivePapers term={'("adaptive thermogenesis"[ti] OR "weight loss plateau"[ti] OR "metabolic adaptation"[ti] OR ("energy expenditure"[ti] AND "weight loss"[ti]))'} />
      </div>
    </section>
  );
}

/* ---- 持病向けの身体づくり ---- */
const COND_TERM: Record<string, string> = {
  "thy-low": '(hypothyroidism[ti] AND (diet[ti] OR weight[ti] OR exercise[ti]))',
  "thy-high": '(hyperthyroidism[ti] AND (diet[ti] OR weight[ti] OR exercise[ti] OR nutrition[ti]))',
  t2d: '("type 2 diabetes"[ti] AND (diet[ti] OR "weight loss"[ti] OR exercise[ti]))',
  htn: '(hypertension[ti] AND (diet[ti] OR sodium[ti] OR exercise[ti]))',
  pcos: '("polycystic ovary syndrome"[ti] AND (diet[ti] OR "weight loss"[ti] OR exercise[ti]))',
  bone: '(osteoporosis[ti] AND (exercise[ti] OR protein[ti] OR diet[ti]))',
  lipid: '((dyslipidemia[ti] OR hypercholesterolemia[ti]) AND (diet[ti] OR exercise[ti]))',
  anemia: '("iron deficiency"[ti] AND (diet[ti] OR exercise[ti] OR women[ti]))',
};

export function CondTab() {
  const [sel, setSel] = useState<string[]>([]);
  const list = sel.length ? CONDS.filter((c) => sel.includes(c.id)) : CONDS;
  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>持病・体質ごとの、食事とトレーニングの考え方・根拠・主治医に確認することです。タップで絞り込みます。<b>診断・治療ではなく、主治医の指示が優先</b>です。</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CONDS.map((c) => (
          <button key={c.id} type="button" aria-pressed={sel.includes(c.id)} className={sel.includes(c.id) ? "trchip on" : "trchip"} onClick={() => setSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}>{c.icon} {c.label}</button>
        ))}
      </div>
      {list.map((c) => (
        <div key={c.id} style={box}>
          <h3 style={{ margin: "0 0 6px" }}>{c.icon} {c.label}　<span style={{ color: lvColor[c.level], fontSize: 13 }}>根拠：{c.level}</span></h3>
          <b>食事</b><ul style={{ margin: "0 0 0 18px" }}>{c.diet.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <b>トレーニング・身体づくり</b><ul style={{ margin: "0 0 0 18px" }}>{c.train.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <div style={{ marginTop: 6, color: "#8a4b00" }}><b>主治医に確認：</b>{c.ask}</div>
          <div style={{ marginTop: 6, fontSize: 13 }}><b>根拠：</b>{c.evidence}</div>
          <div style={{ fontSize: 13, color: "#8a4b00" }}><b>限界：</b>{c.limits}</div>
          <ul style={{ margin: "4px 0 0 18px", fontSize: 13 }}>{c.src.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
          <div style={{ fontSize: 13, background: "#f6f6f6", padding: 8, borderRadius: 8, margin: "6px 0" }}>LINE用：{c.share}</div>
          {COND_TERM[c.id] && <LivePapers term={COND_TERM[c.id]} />}
        </div>
      ))}
    </section>
  );
}

/* ---- 最新の論文（トピック別）---- */
export function LatestTab() {
  const [key, setKey] = useState(TOPICS[0].key);
  const t = TOPICS.find((x) => x.key === key) ?? TOPICS[0];
  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>PubMed（米国国立医学図書館）から、<b>その場で最新の論文を取得</b>します。ボタンを押すたびに、最新に更新されます。人を対象にしたメタ分析・系統的レビューを、新しい順に表示します。</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TOPICS.map((x) => <button key={x.key} type="button" className={key === x.key ? "trchip on" : "trchip"} aria-pressed={key === x.key} onClick={() => setKey(x.key)}>{x.label}</button>)}
      </div>
      <div style={box}>
        <b>{t.label}</b>
        <LivePapers key={t.key} term={t.term} n={8} />
      </div>
      <div style={{ fontSize: 13, color: "#555" }}>※ 論文の内容は自動では評価していません。指導に使う前に、原文（要旨）の対象者・結論・限界を確認してください。</div>
    </section>
  );
}
