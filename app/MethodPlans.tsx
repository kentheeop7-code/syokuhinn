import { METHODS, getMethod, macrosFor, type Pct } from "../lib/methods";
import { getShortPlan } from "../lib/shortplans";
import { BREAKERS } from "../lib/breakers";

// 定期フォロー資料：新しいダイエット方法の施策（低糖質・16時間断食・ファスティング・ケトジェニック・脂質カットなど）を、
// 並べて見せる。理想のPFCバランス（％とグラム）・注意事項・根拠つき。お客様に共有する資料用。
export const PACK_OPTIONS: { id: string; icon: string; label: string }[] = [
  { id: "lowcarb", icon: "🍚", label: "低糖質" },
  { id: "fast16", icon: "⏱️", label: "16時間断食" },
  { id: "fasting", icon: "💧", label: "ファスティング" },
  { id: "keto", icon: "🥑", label: "ケトジェニック" },
  { id: "lowfat", icon: "🥗", label: "脂質カット（低脂質）" },
  { id: "highpro", icon: "🍗", label: "高たんぱく" },
  { id: "balance", icon: "⚖️", label: "バランス型" },
];
export const PACK_DEFAULT = ["lowcarb", "fast16", "lowfat"]; // 初期設定（PDFを小さくするため、3つ）
export const PACK_ALL = ["lowcarb", "fast16", "fasting", "keto", "lowfat"];

type Card = {
  id: string;
  icon: string;
  name: string;
  level: string;
  pct: Pct | null;
  summary: string;
  who: string;
  choose: string[];
  avoid: string[];
  caution: string[];
  expect: string;
  period: string;
  risky: boolean;
  ev: { label: string; pmid: string; note: string }[];
};

function cardOf(id: string): Card | null {
  if (id === "fasting") {
    const p = getShortPlan("fast-clinic");
    if (!p) return null;
    return {
      id,
      icon: "💧",
      name: "ファスティング（断食）",
      level: p.level,
      pct: null,
      summary: p.summary,
      who: p.who,
      choose: p.eat.slice(0, 4),
      avoid: p.avoid.slice(0, 4),
      caution: p.caution,
      expect: p.expect,
      period: p.period,
      risky: true,
      ev: p.evidence,
    };
  }
  if (!METHODS.some((m) => m.id === id)) return null;
  const m = getMethod(id);
  const period = id === "fast16" ? "毎日・続けられる範囲で（まず2週間）" : id === "keto" ? "短期（医師の確認のうえ）" : "続けられる範囲で（数か月）";
  return { id, icon: m.icon, name: m.name, level: m.level, pct: m.pct, summary: m.summary, who: m.suits, choose: m.choose.slice(0, 4), avoid: m.avoid.slice(0, 4), caution: m.caution, expect: "", period, risky: !!m.risky, ev: m.evidence };
}

export default function MethodPlans({ ids, kcal, evLimit = 2 }: { ids: string[]; kcal: number; evLimit?: number }) {
  const cards = ids.map(cardOf).filter((c): c is Card => !!c);
  if (!cards.length) return null;
  return (
    <div className="mpk">
      <p className="rnote">ダイエットの方法は、いくつかあります。結果の差は、小さく、「続けられるか」が、いちばん大切です。向き・不向きと、注意事項を、確認して、トレーナーと一緒に、選びます。</p>
      <div className="mpk-chart" role="img" aria-label="方法ごとのPFCバランスの比較">
        <p className="mpk-ct">図：方法ごとの、PFCバランス（エネルギーの割合）</p>
        {cards.filter((c) => c.pct).map((c) => (
          <div key={c.id} className="mpk-crow">
            <span className="mpk-cl">{c.icon} {c.name.replace(/（.*$/, "")}</span>
            <div className="mpk-bar">
              <span className="p" style={{ width: `${c.pct!.p}%` }}>{c.pct!.p}</span>
              <span className="f" style={{ width: `${c.pct!.f}%` }}>{c.pct!.f}</span>
              <span className="c" style={{ width: `${c.pct!.c}%` }}>{c.pct!.c}</span>
            </div>
          </div>
        ))}
        <p className="mpk-leg"><i className="p" />たんぱく質（P）<i className="f" />脂質（F）<i className="c" />炭水化物（C）　数字は％</p>
      </div>
      <table className="rtable mpk-cmp">
        <thead>
          <tr>
            <th>方法</th>
            <th>理想のPFC</th>
            <th>1日のグラム</th>
            <th>根拠</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const g = c.pct && kcal > 0 ? macrosFor(kcal, c.pct) : null;
            return (
              <tr key={c.id}>
                <th>{c.icon} {c.name.replace(/（.*$/, "")}{c.risky ? "（要・医師）" : ""}</th>
                <td>{c.pct ? `P${c.pct.p}%・F${c.pct.f}%・C${c.pct.c}%` : "（断食中は、なし）"}</td>
                <td>{g ? `P${g.p}g・F${g.f}g・C${g.c}g` : "—"}</td>
                <td>{c.level}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {kcal > 0 && <p className="rxr">グラムは、いまの目安カロリー（約{Math.round(kcal / 10) * 10}kcal）で、計算しました。</p>}
      {cards.map((c) => {
        const g = c.pct && kcal > 0 ? macrosFor(kcal, c.pct) : null;
        return (
          <div key={c.id} className={c.risky ? "mpk-card risky" : "mpk-card"}>
            <p className="mpk-h">{c.icon} {c.name}<small>根拠の強さ：{c.level}／期間：{c.period}</small></p>
            <p>{c.summary}</p>
            {c.pct && (
              <div className="mpk-bar" aria-label="理想のPFCバランス">
                <span className="p" style={{ width: `${c.pct.p}%` }}>P {c.pct.p}%{g ? `（${g.p}g）` : ""}</span>
                <span className="f" style={{ width: `${c.pct.f}%` }}>F {c.pct.f}%{g ? `（${g.f}g）` : ""}</span>
                <span className="c" style={{ width: `${c.pct.c}%` }}>C {c.pct.c}%{g ? `（${g.c}g）` : ""}</span>
              </div>
            )}
            {!c.pct && <p className="rnote">断食中は、PFCの目標は、ありません。終わったあとは、バランス型の食事に、ゆっくり戻します。</p>}
            <p><b>向く人：</b>{c.who}</p>
            <div className="furow2">
              <div><b>選ぶもの</b><ul>{c.choose.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><b>控えること</b><ul>{c.avoid.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            {c.expect && <p><b>期待できること（正直に）：</b>{c.expect}</p>}
            <div className="mpk-warn">
              <b>⚠ 注意事項</b>
              <ul>{c.caution.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <ul className="fuev">{c.ev.slice(0, evLimit).map((e) => <li key={e.pmid}>{e.label}：{e.note}</li>)}</ul>
          </div>
        );
      })}
    </div>
  );
}

// LINE・メールに、そのまま貼れる、文面（お客様向け）
export function packText(ids: string[], kcal: number): string {
  const cards = ids.map(cardOf).filter((c): c is Card => !!c);
  if (!cards.length) return "";
  const L: string[] = ["■ ダイエット方法の施策（選んで、一緒に決めましょう）"];
  for (const c of cards) {
    const g = c.pct && kcal > 0 ? macrosFor(kcal, c.pct) : null;
    L.push(
      "",
      `【${c.icon} ${c.name.replace(/（.*$/, "")}】根拠：${c.level}${c.risky ? "／要・医師の確認" : ""}`,
      c.pct ? `理想のPFC：P${c.pct.p}%・F${c.pct.f}%・C${c.pct.c}%${g ? `（1日 P${g.p}g・F${g.f}g・C${g.c}g）` : ""}` : "断食中は、PFCの目標は、ありません",
      `向く人：${c.who}`,
      `⚠ 注意：${c.caution.slice(0, 2).join(" ／ ")}`
    );
  }
  return L.join("\n");
}

export function breakerText(ids: string[], notes: Record<string, string> = {}): string {
  const list = ids.map((i) => BREAKERS.find((b) => b.id === i)).filter((b): b is (typeof BREAKERS)[number] => !!b);
  if (!list.length && !notes._free?.trim()) return "";
  const L: string[] = ["■ 停滞期を抜ける・整える 打開策"];
  list.forEach((b, n) => {
    L.push("", `候補${n + 1}：${b.icon} ${b.name}`, `期間：${b.period}／根拠：${b.level}`, `向く状況：${b.when}`, `やり方：${b.steps.slice(0, 3).join(" → ")}`, `⚠ ${b.caution.slice(0, 2).join(" ／ ")}`);
    if (notes[b.id]?.trim()) L.push(`あなたへの進め方：${notes[b.id].trim()}`);
  });
  if (notes._free?.trim()) L.push("", `そのほか：${notes._free.trim()}`);
  return L.join("\n");
}
