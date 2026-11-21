// 各ページの「最新の論文」を、PubMed（米国国立医学図書館）から取得して、public/content/latest.json に保存する。
// 使いかた：  npm run update-evidence   →  変更を commit / push すると、全サイトが自動で更新される（Vercel）。
// 取得するのは、人を対象にした、メタ分析・系統的レビューの、題名・雑誌・発行日・PMIDだけ。内容の評価は、していない。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TYPE = "(meta-analysis[pt] OR systematic review[pt])";
const OUT = new URL("../public/content/latest.json", import.meta.url);

// store/key は、ページ側（LatestPapers の storeKey と topic.key）と、そろえる。
const TOPICS = [
  ["plan", "ob", "減量・肥満", '(obesity[ti] AND ("weight loss"[ti] OR "lifestyle intervention"[ti]))'],
  ["plan", "dm", "糖尿病と食事", '("type 2 diabetes"[ti] AND (diet[ti] OR "low-calorie"[ti] OR remission[ti]))'],
  ["plan", "th", "甲状腺と体重", '((hypothyroidism[ti] OR thyroid[ti]) AND ("body weight"[ti] OR obesity[ti] OR weight[ti]))'],
  ["gut", "mb", "腸内細菌と食事", '("gut microbiota"[ti] AND diet[ti])'],
  ["gut", "co", "便秘と食事", "(constipation[ti] AND (fiber[ti] OR dietary[ti]))"],
  ["gut", "pb", "プロバイオティクス", '(probiotics[ti] AND (gut[ti] OR intestinal[ti] OR constipation[ti] OR "irritable bowel"[ti]))'],
  ["nut", "pro", "たんぱく質", '"protein intake"[ti]'],
  ["nut", "fib", "食物繊維", '"dietary fiber"[ti]'],
  ["nut", "vd", "ビタミンD", '("vitamin D"[ti] AND supplementation[ti])'],
  ["nut", "na", "塩分・血圧", '(("sodium intake"[ti] OR "salt intake"[ti] OR "salt reduction"[ti] OR "sodium reduction"[ti]) AND "blood pressure"[ti])'],
  ["tips", "wl", "減量", '("weight loss"[ti] AND (diet[ti] OR dietary[ti]))'],
  ["tips", "rt", "筋トレ", '("resistance training"[ti] AND (hypertrophy[ti] OR muscle[ti]))'],
  ["tips", "pr", "たんぱく質", '(protein[ti] AND (muscle[ti] OR "resistance training"[ti]))'],
  ["add", "em", "乳化剤・増粘剤", '(emulsifier*[ti] OR "food additives"[ti] OR thickener*[ti])'],
  ["add", "sw", "人工甘味料", '"non-nutritive sweeteners"[ti]'],
  ["add", "up", "超加工食品", '("ultra-processed"[ti] AND (health[ti] OR mortality[ti] OR obesity[ti]))'],
  // トレーナー用
  ["trainer", "rt", "筋トレ・筋肥大", '("resistance training"[ti] AND (hypertrophy[ti] OR muscle[ti]))'],
  ["trainer", "prot", "たんぱく質", '(protein[ti] AND (muscle[ti] OR "resistance training"[ti]))'],
  ["trainer", "loss", "減量・ダイエット", '("weight loss"[ti] AND (diet[ti] OR dietary[ti]))'],
  ["trainer", "diet", "食事法", '("weight loss"[ti] AND (diet[ti] OR "low-carbohydrate"[ti] OR "low-fat"[ti] OR "intermittent fasting"[ti]))'],
  ["trainer", "sleep", "睡眠・活動", '(sleep[ti] AND (obesity[ti] OR "weight loss"[ti] OR "body weight"[ti]))'],
  ["trainer", "tre", "時間制限食・断食", '(("time-restricted eating"[ti] OR "intermittent fasting"[ti] OR "time-restricted feeding"[ti]))'],
  ["trainer", "stall", "停滞・代謝適応", '("adaptive thermogenesis"[ti] OR "metabolic adaptation"[ti] OR "weight loss plateau"[ti])'],
  ["trainer", "lowcarb", "低糖質・低脂質", '("low-carbohydrate"[ti] OR "low-fat"[ti]) AND ("weight loss"[ti])'],
  ["trainer", "t2d", "2型糖尿病の食事・運動", '("type 2 diabetes"[ti] AND (diet[ti] OR exercise[ti]))'],
  ["trainer", "htn", "高血圧の食事・運動", "(hypertension[ti] AND (diet[ti] OR sodium[ti] OR exercise[ti]))"],
  ["trainer", "pcos", "PCOSの食事・運動", '("polycystic ovary syndrome"[ti] AND (diet[ti] OR "weight loss"[ti] OR exercise[ti]))'],
  ["trainer", "bone", "骨粗鬆症の運動・栄養", "(osteoporosis[ti] AND (exercise[ti] OR protein[ti] OR diet[ti]))"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        if (!j.error) return j;
      }
    } catch {}
    await sleep(1200 * (i + 1));
  }
  throw new Error("fetch failed: " + url);
}

let prev = {};
if (existsSync(OUT)) {
  try {
    prev = JSON.parse(readFileSync(OUT, "utf8")).topics ?? {};
  } catch {}
}
const topics = {};
let ok = 0;
for (const [store, key, label, term] of TOPICS) {
  const id = `${store}/${key}`;
  try {
    const q = `(${term}) AND ${TYPE} AND humans[mh]`;
    const s = await getJson(`${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=8&sort=pub+date&term=${encodeURIComponent(q)}`);
    const ids = s.esearchresult?.idlist ?? [];
    await sleep(400);
    if (!ids.length) {
      topics[id] = { label, list: prev[id]?.list ?? [] };
      continue;
    }
    const d = await getJson(`${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
    const old = new Set((prev[id]?.list ?? []).map((x) => x.id));
    topics[id] = {
      label,
      list: ids.map((pid) => ({ id: pid, title: d.result?.[pid]?.title ?? "", journal: d.result?.[pid]?.source ?? "", date: d.result?.[pid]?.pubdate ?? "", isNew: old.size > 0 && !old.has(pid) })),
    };
    ok++;
  } catch (e) {
    console.error("skip", id, e.message);
    if (prev[id]) topics[id] = prev[id];
  }
  await sleep(400);
}
const now = new Date();
const out = { fetchedAt: now.toISOString(), fetchedDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`, source: "PubMed（米国国立医学図書館）", topics };
mkdirSync(new URL("../public/content/", import.meta.url), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1), "utf8");
console.log(`updated ${ok}/${TOPICS.length} topics at ${out.fetchedDate}`);
