// サイト全体の「最新の論文」の一覧（public/content/latest.json）を読む。
// この一覧は、スクリプト（npm run update-evidence）か、毎週の自動更新（GitHub Actions）で、更新される。
export type SitePaper = { id: string; title: string; journal: string; date: string; isNew?: boolean };
export type SiteLatest = { fetchedAt: string; fetchedDate: string; source: string; topics: Record<string, { label: string; list: SitePaper[] }> };

let cached: Promise<SiteLatest | null> | null = null;
export function loadSiteLatest(): Promise<SiteLatest | null> {
  if (!cached) {
    cached = fetch("/content/latest.json", { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<SiteLatest>) : null))
      .catch(() => null);
  }
  return cached;
}
