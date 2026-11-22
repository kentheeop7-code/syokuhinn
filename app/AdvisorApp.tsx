"use client";

import { useMemo, useState } from "react";
import { EXAMPLES, advise, type Advice } from "../lib/advisor";
import PdfButton from "./PdfButton";
import ShareButtons from "./ShareButtons";

// トレーナーの相談アシスタント：お客様の状態を書く（または、例を押す）と、原因の候補・確認する質問・対策・今後の流れ・他の可能性・根拠が、出る。
const LC = { 高: "#e0694f", 中: "#e0a526", 低: "#3b82c4" } as const;

export default function AdvisorApp() {
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"f" | "m" | "">("");
  const [msg, setMsg] = useState("");

  const res: Advice | null = useMemo(() => (asked.trim() ? advise({ text: asked, age: parseFloat(age) || 0, sex }) : null), [asked, age, sex]);
  const run = (t?: string) => {
    const v = (t ?? text).trim();
    if (!v) return setMsg("お客様の状態を、書いてください（例を押してもOK）。");
    setMsg("");
    setAsked(v);
  };
  const loadMemo = () => {
    try {
      const m = JSON.parse(localStorage.getItem("lg-trainer") || "null");
      if (!m) return setMsg("指導メモ（/trainer）の保存データが、見つかりませんでした。");
      if (m.age) setAge(String(m.age));
      if (m.sex === "m" || m.sex === "f") setSex(m.sex);
      const bits = [m.name ? `${m.name}さん` : "", m.age ? `${m.age}歳` : "", m.now ? `体重${m.now}kg` : "", m.target ? `目標${m.target}kg` : ""].filter(Boolean).join("・");
      if (bits && !text.includes(bits)) setText((x) => (x ? x + "\n" : "") + bits + "。");
      setMsg("指導メモから、年齢・性別・体重を読み込みました。状態を、続けて書いてください。");
    } catch {
      setMsg("読み込めませんでした。");
    }
  };
  const summary = res
    ? [
        "【相談の整理】",
        ...res.matched.map((x) => "・" + x),
        "",
        "【考えられる原因】",
        ...res.causes.map((c) => `・${c.title}（可能性：${c.likelihood}）`),
        "",
        "【対策】",
        ...res.actions.map((a) => `・${a.when}：${a.what}`),
        "",
        "【今後の流れ】",
        ...res.flow.map((a) => `・${a.when}：${a.what}`),
        "",
        "【受診・相談の目安】",
        ...res.refer.map((x) => "・" + x),
        "",
        "※ ルールと論文にもとづく助言（診断ではありません）",
      ].join("\n")
    : "";

  return (
    <div className="adv">
      <div className="advnote">
        <b>トレーナーの相談アシスタント</b>
        <p>お客様の状態を、そのまま書くと、<b>原因の候補・お客様に聞く質問・対策・今後の流れ・他の可能性・根拠</b>を、出します。AIの会話ではなく、ルールと、確認できた論文（PubMed）・公的基準にもとづく助言です。「現場の経験則」は、論文ではないと、分けて書きます。診断ではありません。</p>
      </div>

      <div className="advbox">
        <label className="advl">お客様の状態（自由に書く）
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="例：体重が上がって、筋肉量が落ちて、体脂肪率が上がっている。食事は、そこまで変えていない。" rows={4} />
        </label>
        <div className="advrow">
          <label>年齢<input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="例：14" /></label>
          <label>性別<select value={sex} onChange={(e) => setSex(e.target.value as "f" | "m" | "")}><option value="">未入力</option><option value="f">女性</option><option value="m">男性</option></select></label>
          <button type="button" className="trchip" onClick={loadMemo}>指導メモから読み込む</button>
        </div>
        <p className="advex">例を押すと、すぐに、助言が出ます：</p>
        <div className="advchips">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" onClick={() => { setText(x); run(x); }}>{x}</button>
          ))}
        </div>
        <button type="button" className="linebtn" onClick={() => run()}>🧭 アドバイスを出す</button>
        {msg && <p className="dcwarn">{msg}</p>}
      </div>

      {res && (
        <div className="advres" id="advres">
          <PdfButton target="#advres" title="お客様の状況と、アドバイス" base="lifegym-advice" />
          <section className="advcard">
            <h2>1. 読み取った内容</h2>
            <div className="advtags">{res.matched.map((x) => <span key={x}>{x}</span>)}{res.matched.length === 0 && <span>（典型的なパターンを、読み取れませんでした）</span>}</div>
            {res.facts.length > 0 && <ul>{res.facts.map((x) => <li key={x}>{x}</li>)}</ul>}
          </section>

          {res.causes.length > 0 && (
            <section className="advcard">
              <h2>2. 考えられる原因（可能性の高い順に確認）</h2>
              {res.causes.map((c) => (
                <div key={c.title} className="advcause">
                  <p className="advch"><em style={{ background: LC[c.likelihood] }}>可能性：{c.likelihood}</em><b>{c.title}</b></p>
                  <p>{c.why}</p>
                  {c.ask.length > 0 && <div className="advask"><b>確認すること</b><ul>{c.ask.map((x) => <li key={x}>{x}</li>)}</ul></div>}
                  {c.ev && <ul className="advev">{c.ev.map((e) => <li key={e.label}>根拠：{e.label}{e.pmid ? <>　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></> : null}</li>)}</ul>}
                </div>
              ))}
            </section>
          )}

          <section className="advcard">
            <h2>3. お客様に、まず聞く質問</h2>
            <ol>{res.questions.map((x) => <li key={x}>{x}</li>)}</ol>
          </section>

          <section className="advcard">
            <h2>4. 対策（優先順）</h2>
            <ol className="advsteps">{res.actions.map((a, i) => <li key={i}><em>{a.when}</em><span>{a.what}</span></li>)}</ol>
          </section>

          <section className="advcard">
            <h2>5. 今後の流れ</h2>
            <ol className="advsteps">{res.flow.map((a, i) => <li key={i}><em>{a.when}</em><span>{a.what}</span></li>)}</ol>
          </section>

          {res.others.length > 0 && (
            <section className="advcard">
              <h2>6. ほかの可能性（見落としがないか）</h2>
              <ul>{res.others.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}

          <section className="advcard advwarn">
            <h2>7. 受診・相談の目安</h2>
            <ul>{res.refer.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>

          {res.experience.length > 0 && (
            <section className="advcard advexp">
              <h2>8. 現場の経験則（論文ではありません）</h2>
              <ul>{res.experience.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}

          <section className="advcard">
            <h2>9. 根拠（論文・公的基準）</h2>
            <ul className="advev">
              {res.evidence.map((e) => (
                <li key={e.label}>
                  {e.label}：{e.note}
                  {e.pmid ? <>　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></> : null}
                </li>
              ))}
            </ul>
            <p className="agnote">論文の多くは、人数が少ない・期間が短い・対象が限られる、という限界があります。個別のお客様には、そのまま当てはまらないことがあります。</p>
          </section>

          <section className="advcard">
            <h2>10. お客様への、伝え方の例（LINE用）</h2>
            <p className="advsay">{res.say}</p>
            <ShareButtons text={res.say} label="伝え方の例" />
            <p className="agnote">トレーナー用のまとめ（原因・対策・流れ）を、メモに残すとき：</p>
            <ShareButtons text={summary} label="助言のまとめ" />
          </section>
        </div>
      )}
    </div>
  );
}
