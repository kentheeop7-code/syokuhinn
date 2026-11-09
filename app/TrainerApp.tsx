"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LineShare from "./LineShare";
import { searchPapers, type Paper } from "../lib/pubmed";
import { CONDS, ISSUES, PLAYS, TOPICS, TRAINER_CHECKED, type Cond, type Issue, type Play } from "../lib/trainerData";

// トレーナー用：お客様の指導メモ。結論・具体策・根拠・実績を見ながら、最後に、公式LINEへ、まとめて共有できる。
type Goal = "diet" | "muscle" | "both";
const num = (s: string) => parseFloat(s) || 0;

export default function TrainerApp() {
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("both");
  const [now, setNow] = useState("");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState(3);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const [weekAct, setWeekAct] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [pins, setPins] = useState<Paper[]>([]);
  const [papers, setPapers] = useState<Record<string, { at: string; list: Paper[] }>>({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-trainer") || "null");
      if (s) {
        setName(s.name ?? "");
        setGoal(s.goal ?? "both");
        setNow(s.now ?? "");
        setTarget(s.target ?? "");
        setDays(s.days ?? 3);
        setNote(s.note ?? "");
        setPicked(Array.isArray(s.picked) ? s.picked : []);
        setConds(Array.isArray(s.conds) ? s.conds : []);
        setIssues(Array.isArray(s.issues) ? s.issues : []);
        setProblem(s.problem ?? "");
        setWeekAct(s.weekAct ?? "");
        setNextDate(s.nextDate ?? "");
        setPins(Array.isArray(s.pins) ? s.pins : []);
      }
      const p = JSON.parse(localStorage.getItem("lg-trainer-papers") || "null");
      if (p) setPapers(p);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-trainer", JSON.stringify({ name, goal, now, target, days, note, picked, pins, conds, issues, problem, weekAct, nextDate }));
    } catch {}
  }, [loaded, name, goal, now, target, days, note, picked, pins, conds, issues, problem, weekAct, nextDate]);

  const w = num(now);
  const wt = num(target);
  const plays = useMemo(() => PLAYS.filter((p) => goal === "both" || p.group === "both" || p.group === goal), [goal]);
  const chosen = PLAYS.filter((p) => picked.includes(p.id));
  const myConds = CONDS.filter((c) => conds.includes(c.id));
  const chosenConds = myConds.filter((c) => picked.includes("c-" + c.id));
  const myIssues = ISSUES.filter((c) => issues.includes(c.id));
  const chosenIssues = myIssues.filter((c) => picked.includes("i-" + c.id));
  const toggleIssue = (id: string) => setIssues((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const toggleCond = (id: string) => setConds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  // 最新の論文：PubMed（米国国立医学図書館）から、そのつど取得する。メタ分析・系統的レビューの、新しい順。
  const fetchTopic = async (key: string, term: string) => {
    setBusy(key);
    setErr("");
    try {
      const list = await searchPapers(term, 6);
      const next = { ...papers, [key]: { at: new Date().toLocaleString("ja-JP"), list } };
      setPapers(next);
      try {
        localStorage.setItem("lg-trainer-papers", JSON.stringify(next));
      } catch {}
    } catch (e) {
      setErr("取得できませんでした。通信を確認して、もう一度お試しください。");
    }
    setBusy("");
  };
  const pin = (p: Paper) => setPins((x) => (x.some((y) => y.id === p.id) ? x.filter((y) => y.id !== p.id) : [...x, p]));

  const build = () => {
    const L: string[] = [];
    L.push(`■ 目標：${goal === "diet" ? "体重を減らす" : goal === "muscle" ? "筋力・筋肉アップ" : "体重を減らして、筋力もアップ"}`);
    if (w) L.push(`■ 体重：${w}kg${wt ? ` → ${wt}kg` : ""}　筋トレ：週${days}回`);
    if (chosenIssues.length || problem.trim()) {
      L.push("", "■ いまの課題");
      chosenIssues.forEach((c, i) => L.push(`${i + 1}. ${c.share}`));
      if (problem.trim()) L.push(problem.trim());
    }
    if (weekAct.trim() || chosenIssues.length) {
      L.push("", "■ 今週やること");
      if (weekAct.trim()) L.push(weekAct.trim());
      else chosenIssues.forEach((c) => L.push(`・${c.act[0]}`));
    }
    if (nextDate.trim()) L.push("", `■ 次回の確認：${nextDate.trim()}`);
    if (chosenConds.length) {
      L.push("", "■ 持病・体質に合わせた注意");
      chosenConds.forEach((c) => L.push(c.share));
      L.push("※ 持病・服薬のある方は、運動や食事を変える前に、主治医に確認してください。");
    }
    if (chosen.length) {
      L.push("", "■ 今日のポイント");
      chosen.forEach((p, i) => L.push(`${i + 1}. ${p.share(w)}`));
    }
    if (note.trim()) L.push("", "■ トレーナーから", note.trim());
    if (pins.length) {
      L.push("", "■ 参考にした最新の研究（PubMed）");
      pins.slice(0, 3).forEach((p) => L.push(`・${p.title.replace(/\.$/, "")}（${p.journal}）https://pubmed.ncbi.nlm.nih.gov/${p.id}/`));
    }
    if (chosen.some((p) => p.src.length) || chosenConds.length || chosenIssues.length) {
      L.push("", "■ 根拠");
      const labels = [...chosenIssues.slice(0, 4).map((c) => c.src[0].label), ...chosen.slice(0, 4).map((p) => p.src[0].label), ...chosenConds.slice(0, 4).map((c) => c.src[0].label)];
      Array.from(new Set(labels)).forEach((l) => L.push(`・${l}`));
    }
    return L.join("\n");
  };

  const card = (p: Play) => (
    <li key={p.id}>
      <details className="trcard">
        <summary>
          <span className="trt">{p.title}</span>
          <span className={`trlv lv-${p.level}`}>根拠 {p.level}</span>
        </summary>
        <p className="tra">
          <b>結論</b>
          {p.answer}
        </p>
        <div className="trs">
          <small>具体策</small>
          <ol>
            {p.steps(w).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        {p.results && (
          <p className="trr">
            <small>実績（試験の結果）</small>
            <b>{p.results.title}</b>：{p.results.text}
          </p>
        )}
        <p className="tre">
          <small>根拠（何が分かっているか）</small>
          {p.evidence}
        </p>
        <p className="trl">
          <small>限界・注意</small>
          {p.limits}
        </p>
        <p className="trsrc">
          <small>出典</small>
          {p.src.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </p>
        <button type="button" className={picked.includes(p.id) ? "trpick on" : "trpick"} onClick={() => toggle(p.id)}>
          {picked.includes(p.id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
        </button>
      </details>
    </li>
  );

  const issueCard = (c: Issue) => {
    const id = "i-" + c.id;
    return (
      <li key={c.id}>
        <details className="trcard">
          <summary>
            <span className="trt">{c.label}</span>
            <span className={`trlv lv-${c.level}`}>根拠 {c.level}</span>
          </summary>
          <p className="tra">
            <b>お客様に確認</b>
            {c.ask}
          </p>
          <div className="trs">
            <small>食事での対応</small>
            <ol>
              {c.diet.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="trs">
            <small>今週の行動</small>
            <ol>
              {c.act.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="tre">
            <small>根拠（何が分かっているか）</small>
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
          <button type="button" className={picked.includes(id) ? "trpick on" : "trpick"} onClick={() => toggle(id)}>
            {picked.includes(id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
          </button>
        </details>
      </li>
    );
  };
  const condCard = (c: Cond) => {
    const id = "c-" + c.id;
    return (
      <li key={c.id}>
        <details className="trcard">
          <summary>
            <span className="trt">
              {c.icon} {c.label}
            </span>
            <span className={`trlv lv-${c.level}`}>根拠 {c.level}</span>
          </summary>
          <p className="tra">
            <b>先に確認</b>
            {c.ask}
          </p>
          <div className="trs">
            <small>食事（ダイエット）</small>
            <ol>
              {c.diet.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="trs">
            <small>トレーニング（筋力アップ）</small>
            <ol>
              {c.train.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="tre">
            <small>根拠（何が分かっているか）</small>
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
          <button type="button" className={picked.includes(id) ? "trpick on" : "trpick"} onClick={() => toggle(id)}>
            {picked.includes(id) ? "✓ お客様への共有に入れた" : "＋ お客様への共有に入れる"}
          </button>
        </details>
      </li>
    );
  };

  return (
    <div className="trainer">
      <Link href="/" className="backlink">
        ‹ ホームへ戻る
      </Link>
      <p className="trnote">トレーナー用。指導の根拠と具体策を見ながら、最後に、お客様へ公式LINEで共有できます。内容の確認日：{TRAINER_CHECKED}</p>

      <section className="card">
        <p className="balh">① お客様のメモ</p>
        <label className="trf">
          <span>お名前（任意）</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：さくら" aria-label="お客様のお名前" />
        </label>
        <p className="balh sub">目標</p>
        <div className="plpace" role="radiogroup" aria-label="目標">
          {(
            [
              ["diet", "体重を減らす"],
              ["muscle", "筋力アップ"],
              ["both", "両方"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={goal === k} className={goal === k ? "on" : ""} onClick={() => setGoal(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="trgrid">
          <label className="trf">
            <span>いまの体重（kg）</span>
            <input inputMode="decimal" value={now} onChange={(e) => setNow(e.target.value)} placeholder="例 64" aria-label="いまの体重" />
          </label>
          <label className="trf">
            <span>目標の体重（kg）</span>
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="例 58" aria-label="目標の体重" />
          </label>
        </div>
        <p className="balh sub">筋トレの回数（週）</p>
        <div className="plpace" role="radiogroup" aria-label="筋トレの回数">
          {[2, 3, 4].map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
              週{d}回
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="balh">② 課題と、今週の行動</p>
        <p className="agnote">お客様の課題を選ぶと、確認すること・食事での対応・根拠が出ます。下の欄に、トレーナーが、課題と行動を書き込めます。</p>
        <div className="trchips" role="group" aria-label="課題">
          {ISSUES.map((c) => (
            <button key={c.id} type="button" aria-pressed={issues.includes(c.id)} className={issues.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggleIssue(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        {myIssues.length > 0 && <ul className="trlist">{myIssues.map(issueCard)}</ul>}
        <label className="trf">
          <span>課題（トレーナーの記入・任意）</span>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} placeholder="例：夜の間食が多く、週の平均体重が、2週間動いていない。" aria-label="課題" />
        </label>
        <label className="trf">
          <span>今週やること（具体的に・数字で）</span>
          <textarea value={weekAct} onChange={(e) => setWeekAct(e.target.value)} rows={2} placeholder="例：夜の間食は、週3回まで。朝食に、卵か納豆を足す。" aria-label="今週やること" />
        </label>
        <label className="trf">
          <span>次回の確認日</span>
          <input value={nextDate} onChange={(e) => setNextDate(e.target.value)} placeholder="例：11月15日" aria-label="次回の確認日" />
        </label>
      </section>

      <section className="card">
        <p className="balh">③ 持病・体質のあるお客様</p>
        <p className="agnote">当てはまるものを選ぶと、食事とトレーニングの考え方・根拠・限界が出ます。診断や治療ではなく、主治医の指示が優先です。</p>
        <div className="trchips" role="group" aria-label="持病・体質">
          {CONDS.map((c) => (
            <button key={c.id} type="button" aria-pressed={conds.includes(c.id)} className={conds.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggleCond(c.id)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {myConds.length > 0 && <ul className="trlist">{myConds.map(condCard)}</ul>}
      </section>

      <section className="card">
        <p className="balh">④ 指導メニュー（結論・具体策・根拠・実績）</p>
        <p className="agnote">タップで開きます。共有に入れたものが、最後のLINEにまとまります。</p>
        <ul className="trlist">{plays.map(card)}</ul>
      </section>

      <section className="card">
        <p className="balh">⑤ 最新の論文（自動で取得）</p>
        <p className="agnote">PubMed（米国国立医学図書館）から、メタ分析・系統的レビューの新しい順に取得します。タイトルの一覧で、内容の評価は、していません。指導に使う前に、トレーナーが確認してください。</p>
        <div className="trtopics">
          {TOPICS.map((t) => (
            <div key={t.key} className="trtopic">
              <div className="trthead">
                <b>{t.label}</b>
                <button type="button" className="btn ghost" disabled={busy === t.key} onClick={() => fetchTopic(t.key, t.term)}>
                  {busy === t.key ? "取得中…" : papers[t.key] ? "更新する" : "最新を取得"}
                </button>
              </div>
              {papers[t.key] && (
                <>
                  <p className="trat">取得：{papers[t.key].at}</p>
                  <ul className="trpapers">
                    {papers[t.key].list.map((p) => (
                      <li key={p.id}>
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.id}/`} target="_blank" rel="noopener noreferrer">
                          {p.title}
                        </a>
                        <small>
                          {p.journal}・{p.date}
                        </small>
                        <button type="button" className={pins.some((x) => x.id === p.id) ? "trpin on" : "trpin"} onClick={() => pin(p)}>
                          {pins.some((x) => x.id === p.id) ? "✓ 共有に入れた" : "＋ 共有に入れる"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
        {err && <p className="plwarn">{err}</p>}
      </section>

      <section className="card">
        <p className="balh">⑥ お客様への共有</p>
        <label className="trf">
          <span>トレーナーからの一言（任意）</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="例：今週は、歩数を8,000歩に。スクワットは、フォーム優先で。" aria-label="トレーナーからの一言" />
        </label>
        <p className="plmini">送る内容（プレビュー）</p>
        <pre className="trpre">{build() || "（共有に入れたものが、ここに出ます）"}</pre>
        <LineShare title="トレーニングのまとめ" build={build} noProfile />
      </section>
    </div>
  );
}
