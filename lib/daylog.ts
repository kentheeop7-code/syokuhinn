// 「昨日」「一昨日」「今日」の食事を、日付ごとに保存する。
import { totals, type St } from "./meals";

const KEY = "lg-days2";
export type DayLog = Record<string, St>;

export const dateKey = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dateLabel = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
export const emptySt = (date: string): St => ({ date, size: {}, ext: {} });

export function readLog(): DayLog {
  try {
    const l = JSON.parse(localStorage.getItem(KEY) || "{}");
    return l && typeof l === "object" ? l : {};
  } catch {
    return {};
  }
}
export function saveDay(daysAgo: number, st: St) {
  const log = readLog();
  const k = dateKey(daysAgo);
  const has = Object.keys(st.size).length > 0 || Object.values(st.ext).some((v) => v > 0);
  if (has) log[k] = { ...st, date: k };
  else delete log[k];
  // 古い日（10日より前）は、消す
  const keep = new Set(Array.from({ length: 10 }, (_, i) => dateKey(i)));
  for (const d of Object.keys(log)) if (!keep.has(d)) delete log[d];
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
    window.dispatchEvent(new Event("lg-days2-change"));
  } catch {}
}
export const stOfDay = (log: DayLog, daysAgo: number): St => log[dateKey(daysAgo)] ?? emptySt(dateKey(daysAgo));

// 昨日・一昨日で、食事を入れた日の、平均（なければ null）
export function averageIntake(log: DayLog): { kcal: number; p: number; f: number; c: number; fi: number; salt: number; days: number } | null {
  const rows = [1, 2].map((d) => totals(stOfDay(log, d))).filter((t) => t.any);
  if (!rows.length) return null;
  const s = (k: "kcal" | "p" | "f" | "c" | "fi" | "salt") => rows.reduce((a, t) => a + t[k], 0) / rows.length;
  return { kcal: s("kcal"), p: s("p"), f: s("f"), c: s("c"), fi: s("fi"), salt: s("salt"), days: rows.length };
}
