// PubMed（米国国立医学図書館）から、メタ分析・系統的レビューを、新しい順に取得する。
// まず、言葉が、すべてタイトル・要旨に入る論文だけを探す（関係の薄い論文を減らすため）。
// 見つからないときだけ、ゆるい検索にもどす。内容の評価は、していない。
export type Paper = { id: string; title: string; journal: string; date: string };
const TYPE = "(meta-analysis[pt] OR systematic review[pt])";
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// PubMedは、1秒に3回までの制限がある。制限にあたったときは、少し待って、やり直す。
async function getJson(url: string, tries = 3): Promise<any> {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        if (!j.error) return j;
      }
    } catch {}
    await new Promise((res) => setTimeout(res, 1200 * (i + 1)));
  }
  throw new Error("net");
}

export async function searchPapers(term: string, n: number): Promise<Paper[]> {
  // term は、PubMedの検索式（[ti]＝題名に含む）。人を対象にした、メタ分析・系統的レビューだけ。
  const q = `(${term}) AND ${TYPE} AND humans[mh]`;
  const s = await getJson(`${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${n}&sort=pub+date&term=${encodeURIComponent(q)}`);
  const ids: string[] = s.esearchresult?.idlist ?? [];
  if (ids.length === 0) throw new Error("none");
  const d = await getJson(`${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
  return ids.map((id) => ({ id, title: d.result?.[id]?.title ?? "", journal: d.result?.[id]?.source ?? "", date: d.result?.[id]?.pubdate ?? "" }));
}