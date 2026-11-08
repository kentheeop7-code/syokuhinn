"use client";

import { useEffect, useState } from "react";

// ページのテーマに合わせて、最新の論文（メタ分析・系統的レビュー）を、PubMedから、そのつど取得する。
// タイトルの一覧で、内容の評価はしていない。使う前に、トレーナー・専門家が、確認すること。
type Paper = { id: string; title: string; journal: string; date: string };
export type Topic = { key: string; label: string; term: string };

export default function LatestPapers({ topics, storeKey }: { topics: Topic[]; storeKey: string }) {
  const [data, setData] = useState<Record<string, { at: string; list: Paper[] }>>({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(`lg-papers-${storeKey}`) || "null");
      if (s) setData(s);
    } catch {}
  }, [storeKey]);

  const run = async (t: Topic) => {
    setBusy(t.key);
    setErr("");
    try {
      const q = `(${t.term}) AND (meta-analysis[pt] OR systematic review[pt])`;
      const s = await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=pub+date&term=${encodeURIComponent(q)}`)).json();
      const ids: string[] = s.esearchresult?.idlist ?? [];
      if (ids.length === 0) throw new Error("none");
      const d = await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`)).json();
      const list: Paper[] = ids.map((id) => ({ id, title: d.result?.[id]?.title ?? "", journal: d.result?.[id]?.source ?? "", date: d.result?.[id]?.pubdate ?? "" }));
      const next = { ...data, [t.key]: { at: new Date().toLocaleString("ja-JP"), list } };
      setData(next);
      try {
        localStorage.setItem(`lg-papers-${storeKey}`, JSON.stringify(next));
      } catch {}
    } catch {
      setErr("取得できませんでした。通信を確認して、もう一度お試しください。");
    }
    setBusy("");
  };

  return (
    <div className="latest">
      <p className="agnote">PubMed（米国国立医学図書館）から、メタ分析・系統的レビューを、新しい順に取得します。英語のタイトルの一覧で、内容の評価はしていません。使う前に、専門家が確認してください。</p>
      <div className="trtopics">
        {topics.map((t) => (
          <div key={t.key} className="trtopic">
            <div className="trthead">
              <b>{t.label}</b>
              <button type="button" className="btn ghost" disabled={busy === t.key} onClick={() => run(t)}>
                {busy === t.key ? "取得中…" : data[t.key] ? "更新する" : "最新を取得"}
              </button>
            </div>
            {data[t.key] && (
              <>
                <p className="trat">取得：{data[t.key].at}</p>
                <ul className="trpapers">
                  {data[t.key].list.map((p) => (
                    <li key={p.id}>
                      <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.id}/`} target="_blank" rel="noopener noreferrer">
                        {p.title}
                      </a>
                      <small>
                        {p.journal}・{p.date}
                      </small>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
      {err && <p className="plwarn">{err}</p>}
    </div>
  );
}
