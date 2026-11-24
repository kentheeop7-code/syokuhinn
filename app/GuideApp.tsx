"use client";

import { useMemo, useState } from "react";
import PdfButton from "./PdfButton";
import { FOODS, CATEGORIES, portionsOf } from "../lib/foods";
import { METHODS, macrosFor, methodBlocked, type MethodId } from "../lib/methods";
import { recommend, type Fit } from "../lib/recommend";
import { calcEnergy } from "../lib/energy";
import { personalDays } from "../lib/dayfit";
import { CONDS } from "../lib/trainerData";
import { PACES, type Pace } from "../lib/goal";
import { BANDS } from "./me";
import { StallTab, CondTab, LatestTab, LivePapers } from "./GuideMore";
import TipsTab from "./TipsTab";
import { SHORT_PLANS } from "../lib/shortplans";
import ShortPlanView from "./ShortPlanView";
import { COMMON_NOTES } from "../lib/methods";

// トレーナー向け資料：①お客様タイプ別のおすすめ ②食品PFC表＋献立づくり ③食事法とバランス ④計算方法と根拠
type Tab = "client" | "food" | "method" | "short" | "stall" | "tips" | "cond" | "latest" | "calc";
const TABS: { id: Tab; t: string }[] = [
  { id: "client", t: "① お客様に合わせる" },
  { id: "food", t: "② 食品PFC・献立づくり" },
  { id: "method", t: "③ 食事法とバランス" },
  { id: "short", t: "短期プログラム（断食・腸活）" },
  { id: "stall", t: "④ 停滞・代謝・不調" },
  { id: "tips", t: "💡 豆知識（定期フォローで送る）" },
  { id: "cond", t: "⑤ 持病向けの身体づくり" },
  { id: "latest", t: "⑥ 最新の論文（自動取得）" },
  { id: "calc", t: "⑦ 計算方法と根拠" },
];
// 検索：ひらがな・カタカナの違いを無視し、よく使う漢字も、食品名に合わせる
const ALIAS: [string, string][] = [["鮭", "さけ"], ["鯖", "さば"], ["鶏", "とり"], ["豚", "ぶた"], ["牛乳", "ぎゅうにゅう"], ["牛", "うし"], ["卵", "たまご"], ["豆腐", "とうふ"], ["納豆", "なっとう"], ["米", "こめ"], ["飯", "ごはん"], ["鯵", "あじ"], ["海老", "えび"], ["蛸", "たこ"], ["烏賊", "いか"]];
const norm = (s: string) => {
  let t = s.trim();
  for (const [a, b] of ALIAS) t = t.split(a).join(b);
  return t.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
};
const METHOD_TERM: Record<MethodId, string> = {
  balance: '("weight loss"[ti] AND (diet[ti] OR dietary[ti] OR "macronutrient"[ti]))',
  lowfat: '("low-fat"[ti] AND ("weight loss"[ti] OR diet[ti]))',
  lowcarb: '("low-carbohydrate"[ti] AND ("weight loss"[ti] OR diet[ti]))',
  highpro: '("high-protein"[ti] AND ("weight loss"[ti] OR "body composition"[ti]))',
  fast16: '(("time-restricted eating"[ti] OR "intermittent fasting"[ti]) AND ("weight loss"[ti] OR obesity[ti]))',
  keto: '(ketogenic[ti] AND ("weight loss"[ti] OR safety[ti]))',
};
const num = (s: string) => parseFloat(s) || 0;
const bandOf = (age: number) => (age < 15 ? 0 : age < 18 ? 1 : age < 30 ? 2 : age < 50 ? 3 : age < 65 ? 4 : age < 75 ? 5 : 6);
const fitColor: Record<Fit, string> = { おすすめ: "#2e7d32", 可: "#555", 注意: "#b26a00", 不可: "#c62828" };
const r1 = (n: number) => Math.round(n * 10) / 10;
const box: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 12, margin: "10px 0", background: "#fff" };
const inp: React.CSSProperties = { font: "inherit", padding: "8px 10px", border: "1px solid #bbb", borderRadius: 8, width: "100%", boxSizing: "border-box" };

export default function GuideApp() {
  const [tab, setTab] = useState<Tab>("client");
  return (
    <div id="guideroot">
      <PdfButton target="#guideroot" title="トレーナー資料集" base="lifegym-guide" label="📥 いま開いている資料を、PDFにする" />
      <div role="tablist" data-pdf-skip style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 10px" }}>
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)} className={tab === x.id ? "trchip on" : "trchip"} type="button">
            {x.t}
          </button>
        ))}
      </div>
      {tab === "client" && <ClientTab />}
      {tab === "food" && <FoodTab />}
      {tab === "method" && <MethodTab />}
      {tab === "short" && <ShortTab />}
      {tab === "stall" && <StallTab />}
      {tab === "tips" && <TipsTab />}
      {tab === "cond" && <CondTab />}
      {tab === "latest" && <LatestTab />}
      {tab === "calc" && <CalcTab />}
    </div>
  );
}

/* ---------- ① お客様に合わせる ---------- */
function ClientTab() {
  const [sex, setSex] = useState<"f" | "m">("f");
  const [age, setAge] = useState("40");
  const [weight, setWeight] = useState("65");
  const [height, setHeight] = useState("160");
  const [target, setTarget] = useState("58");
  const [goal, setGoal] = useState<"diet" | "muscle" | "both">("diet");
  const [pal, setPal] = useState(1);
  const [pace, setPace] = useState<Pace>("mid");
  const [conds, setConds] = useState<string[]>([]);
  const [pick, setPick] = useState<MethodId | "">("");

  const a = num(age);
  const band = bandOf(a);
  const youth = a > 0 && a < 18;
  const rec = useMemo(() => recommend({ sex, age: a, band, weight: num(weight), height: num(height), conds, goal, hasBody: false }), [sex, a, band, weight, height, conds, goal]);
  const energy = useMemo(
    () => calcEnergy({ sex, band, age: a, height: num(height), weight: num(weight), bmr: 0, bodyFat: 0, muscle: 0, pal, targetWeight: num(target), pace: conds.length > 0 ? "slow" : pace }),
    [sex, band, a, height, weight, target, pal, pace, conds]
  );
  const mid = (pick || rec.top) as MethodId;
  const m = METHODS.find((x) => x.id === mid)!;
  const kcal = energy?.target ?? 0;
  const mac = macrosFor(kcal, m.pct);
  const blocked = methodBlocked(m, { hasConds: conds.length > 0, youth });
  const days = useMemo(() => (kcal > 0 ? personalDays(kcal, m.pct, mid, { lipid: conds.includes("lipid"), n: 4 }) : []), [kcal, m, mid, conds]);
  const bmi = num(height) > 0 && num(weight) > 0 ? r1(num(weight) / (num(height) / 100) ** 2) : 0;
  const toggle = (id: string) => setConds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const myConds = CONDS.filter((c) => conds.includes(c.id));

  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>お客様の情報を入れると、<b>向いている食事法・カロリー・PFC・具体的な1日の例</b>が出ます。（保存はされません。指導メモには反映されません）</p>
      <div style={box}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
          <label>性別<select style={inp} value={sex} onChange={(e) => setSex(e.target.value as "f" | "m")}><option value="f">女性</option><option value="m">男性</option></select></label>
          <label>年齢<input style={inp} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></label>
          <label>身長 cm<input style={inp} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
          <label>体重 kg<input style={inp} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
          <label>目標体重 kg<input style={inp} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label>目的<select style={inp} value={goal} onChange={(e) => setGoal(e.target.value as "diet" | "muscle" | "both")}><option value="diet">ダイエット</option><option value="both">減量＋筋肉</option><option value="muscle">筋肉をつけたい</option></select></label>
          <label>活動量<select style={inp} value={pal} onChange={(e) => setPal(+e.target.value)}><option value={0}>低い</option><option value={1}>ふつう</option><option value={2}>高い</option></select></label>
          <label>ペース<select style={inp} value={pace} onChange={(e) => setPace(e.target.value as Pace)}>{PACES.map((p) => <option key={p.id} value={p.id}>{p.t}（{p.d}）</option>)}</select></label>
        </div>
        <div style={{ margin: "10px 0 2px", fontWeight: 700 }}>持病・体質（当てはまるもの）</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CONDS.map((c) => (
            <button key={c.id} type="button" aria-pressed={conds.includes(c.id)} className={conds.includes(c.id) ? "trchip on" : "trchip"} onClick={() => toggle(c.id)}>{c.icon} {c.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{BANDS[band]}{bmi ? `／BMI ${bmi}` : ""}{conds.length > 0 ? "／持病があるため、減量ペースは「ゆっくり」にしています" : ""}</div>
      </div>

      <h2 style={{ fontSize: 18 }}>おすすめの食事法（{rec.basis}）</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {METHODS.map((x) => {
          const f = rec.fits[x.id];
          return (
            <button key={x.id} type="button" onClick={() => setPick(x.id)} style={{ ...box, margin: 0, textAlign: "left", cursor: "pointer", borderColor: mid === x.id ? "#2e7d32" : "#ddd", borderWidth: mid === x.id ? 2 : 1 }}>
              <b>{x.icon} {x.name}</b>{" "}
              <span style={{ color: fitColor[f.fit], fontWeight: 700 }}>［{f.fit}{x.id === rec.top ? "・第1候補" : ""}］</span>
              <span style={{ marginLeft: 8, fontSize: 13 }}>P{x.pct.p}／F{x.pct.f}／C{x.pct.c}%</span>
              {f.why.length > 0 && <ul style={{ margin: "4px 0 0 18px", fontSize: 13 }}>{f.why.map((w, i) => <li key={i}>{w}</li>)}</ul>}
            </button>
          );
        })}
      </div>
      {blocked && <div style={{ ...box, borderColor: "#c62828", color: "#c62828" }}>⚠ {blocked}</div>}

      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>{m.icon} {m.name}：1日の目安</h3>
        {energy ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800 }}>約 {kcal.toLocaleString()} kcal／日</div>
            <div style={{ fontSize: 13, color: "#555" }}>維持 約{Math.round(energy.tdee).toLocaleString()} kcal・{energy.label}・下限 {energy.floorKcal.toLocaleString()} kcal{energy.floored ? "（下限で止めています）" : ""}{energy.capped ? "（減らす幅の上限で止めています）" : ""}</div>
            <table style={{ borderCollapse: "collapse", margin: "8px 0" }}>
              <tbody>
                <tr><th style={{ textAlign: "left", paddingRight: 14 }}>たんぱく質</th><td>{mac.p} g（{m.pct.p}%）</td></tr>
                <tr><th style={{ textAlign: "left", paddingRight: 14 }}>脂質</th><td>{mac.f} g（{m.pct.f}%）</td></tr>
                <tr><th style={{ textAlign: "left", paddingRight: 14 }}>炭水化物</th><td>{mac.c} g（{m.pct.c}%）</td></tr>
                <tr><th style={{ textAlign: "left", paddingRight: 14 }}>1食あたり</th><td>P {Math.round(mac.p / 3)}・F {Math.round(mac.f / 3)}・C {Math.round(mac.c / 3)} g</td></tr>
              </tbody>
            </table>
            {num(weight) > 0 && <div style={{ fontSize: 13 }}>たんぱく質は体重1kgあたり {r1(mac.p / num(weight))} g（減量中の筋肉維持は 1.6〜2.2 g/kg が目安。腎臓病がある人は主治医に確認）</div>}
          </>
        ) : <div>年齢・身長・体重を入れてください。</div>}
        <h4 style={{ margin: "12px 0 4px" }}>選び方・避けること</h4>
        <ul style={{ margin: "0 0 0 18px" }}>{m.choose.map((x, i) => <li key={"c" + i}>{x}</li>)}{m.avoid.map((x, i) => <li key={"a" + i} style={{ color: "#8a4b00" }}>避ける：{x}</li>)}</ul>
        <div style={{ fontSize: 13, marginTop: 6 }}><b>向く人：</b>{m.suits}</div>
        {m.caution.length > 0 && <ul style={{ margin: "6px 0 0 18px", fontSize: 13, color: "#8a4b00" }}>{m.caution.map((x, i) => <li key={i}>{x}</li>)}</ul>}
        <div style={{ fontSize: 13, marginTop: 8 }}><b>根拠：</b>（根拠の強さ：{m.level}）</div>
        <ul style={{ margin: "0 0 0 18px", fontSize: 13 }}>{m.evidence.map((e, i) => <li key={i}>{e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></li>)}</ul>
        <LivePapers key={mid} term={METHOD_TERM[mid]} />      </div>

      {days.length > 0 && (
        <div style={box}>
          <h3 style={{ margin: "0 0 6px" }}>このお客様の食事例（そのまま提案できます）</h3>
          {days.map((d) => (
            <details key={d.id} style={{ margin: "6px 0" }}>
              <summary><b>{d.name}</b>　約{Math.round(d.dk).toLocaleString()} kcal／P{Math.round(d.tot.p)}・F{Math.round(d.tot.f)}・C{Math.round(d.tot.c)} g</summary>
              <div style={{ fontSize: 13, color: "#555" }}>{d.note}</div>
              <ul style={{ margin: "4px 0 0 18px" }}>{d.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </details>
          ))}
        </div>
      )}

      {myConds.length > 0 && (
        <div style={box}>
          <h3 style={{ margin: "0 0 6px" }}>持病・体質への配慮</h3>
          {myConds.map((c) => (
            <div key={c.id} style={{ margin: "8px 0" }}>
              <b>{c.icon} {c.label}</b>
              <ul style={{ margin: "2px 0 0 18px" }}>{c.diet.map((d, i) => <li key={i}>{d}</li>)}</ul>
              <div style={{ fontSize: 13, color: "#8a4b00" }}>主治医に確認：{c.ask}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- ② 食品PFC・献立づくり ---------- */
type Item = { name: string; g: number };
function FoodTab() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState<"name" | "p" | "f" | "c" | "kcal" | "pk">("name");
  const [basis, setBasis] = useState<"100" | "portion">("100");
  const [items, setItems] = useState<Item[]>([]);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const k = norm(q);
    const list = FOODS.filter((f) => (!cat || f.cat === cat) && (!k || norm(f.name).includes(k)));
    const val = (f: (typeof FOODS)[number]) => {
      const kc = f.p * 4 + f.f * 9 + f.c * 4;
      return sort === "kcal" ? kc : sort === "pk" ? (kc ? (f.p * 4) / kc : 0) : sort === "name" ? 0 : f[sort];
    };
    return sort === "name" ? list : [...list].sort((x, y) => val(y) - val(x));
  }, [q, cat, sort]);

  const add = (name: string, g: number) => setItems((it) => [...it, { name, g }]);
  const tot = items.reduce(
    (a, it) => {
      const f = FOODS.find((x) => x.name === it.name);
      if (!f) return a;
      const r = it.g / 100;
      return { p: a.p + f.p * r, f: a.f + f.f * r, c: a.c + f.c * r, fi: a.fi + f.fi * r, salt: a.salt + f.salt * r };
    },
    { p: 0, f: 0, c: 0, fi: 0, salt: 0 }
  );
  const kcal = tot.p * 4 + tot.f * 9 + tot.c * 4;
  const text = `【献立メモ】\n${items.map((it) => `・${it.name} ${it.g}g`).join("\n")}\n合計：約${Math.round(kcal)}kcal／P${r1(tot.p)}g・F${r1(tot.f)}g・C${r1(tot.c)}g／食物繊維${r1(tot.fi)}g／食塩${r1(tot.salt)}g`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>食品ごとのPFCを、並べ替え・検索できます。「＋」で食品を追加すると、下の<b>献立づくり</b>に合計が出ます。数値は食品成分表（日本食品標準成分表）などをもとにした目安です（調理で変わります）。</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
        <input style={inp} placeholder="食品名で検索（例：鮭）" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={inp} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">すべての分類</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select style={inp} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="name">並び：もとの順</option><option value="p">たんぱく質が多い順</option><option value="pk">たんぱく質の割合が高い順</option><option value="f">脂質が多い順</option><option value="c">炭水化物が多い順</option><option value="kcal">カロリーが多い順</option>
        </select>
        <select style={inp} value={basis} onChange={(e) => setBasis(e.target.value as "100" | "portion")}><option value="100">100gあたり</option><option value="portion">目安の量あたり</option></select>
      </div>
      <div style={{ fontSize: 13, color: "#555", margin: "6px 0" }}>{rows.length}件</div>
      <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto", border: "1px solid #ddd", borderRadius: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f3f3" }}>
            <tr><th style={th}>食品</th><th style={th}>量</th><th style={th}>kcal</th><th style={th}>P</th><th style={th}>F</th><th style={th}>C</th><th style={th}>繊維</th><th style={th}></th></tr>
          </thead>
          <tbody>
            {rows.slice(0, 300).map((f) => {
              const ps = portionsOf(f);
              const p0 = ps[0];
              const g = basis === "100" || !p0 ? 100 : p0.g;
              const r = g / 100;
              return (
                <tr key={f.name} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{f.name}<div style={{ fontSize: 11, color: "#777" }}>{f.cat}</div></td>
                  <td style={td}>{basis === "100" || !p0 ? "100g" : `${p0.label}（${p0.g}g）`}</td>
                  <td style={td}>{Math.round((f.p * 4 + f.f * 9 + f.c * 4) * r)}</td>
                  <td style={td}>{r1(f.p * r)}</td>
                  <td style={td}>{r1(f.f * r)}</td>
                  <td style={td}>{r1(f.c * r)}</td>
                  <td style={td}>{r1(f.fi * r)}</td>
                  <td style={td}><button type="button" className="trchip" onClick={() => add(f.name, g)} aria-label={`${f.name}を献立に追加`}>＋</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && <div style={{ fontSize: 13, color: "#555" }}>先頭300件を表示中。検索で絞ってください。</div>}

      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>献立づくり（グラム数を直せます）</h3>
        {items.length === 0 ? <div style={{ color: "#555" }}>上の表の「＋」で食品を追加してください。</div> : (
          <>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", margin: "4px 0" }}>
                <span style={{ flex: 1 }}>{it.name}</span>
                <input style={{ ...inp, width: 90 }} inputMode="decimal" value={it.g} onChange={(e) => setItems((l) => l.map((x, j) => (j === i ? { ...x, g: num(e.target.value) } : x)))} aria-label={`${it.name}のグラム数`} />
                <span>g</span>
                <button type="button" className="trchip" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label="削除">✕</button>
              </div>
            ))}
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>約 {Math.round(kcal)} kcal</div>
            <div>P {r1(tot.p)} g／F {r1(tot.f)} g／C {r1(tot.c)} g　<span style={{ fontSize: 13, color: "#555" }}>（食物繊維 {r1(tot.fi)} g・食塩 {r1(tot.salt)} g）</span></div>
            {kcal > 0 && <div style={{ fontSize: 13, color: "#555" }}>割合：P {Math.round((tot.p * 400) / kcal)}%・F {Math.round((tot.f * 900) / kcal)}%・C {Math.round((tot.c * 400) / kcal)}%</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" className="trchip on" onClick={copy}>{copied ? "コピーしました" : "文章でコピー（LINE用）"}</button>
              <button type="button" className="trchip" onClick={() => setItems([])}>全部消す</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "6px 8px", verticalAlign: "top" };

/* ---------- 短期プログラム（断食・腸活・短期ダイエット） ---------- */
function ShortTab() {
  const [id, setId] = useState(SHORT_PLANS[0].id);
  const plan = SHORT_PLANS.find((p) => p.id === id) ?? SHORT_PLANS[0];
  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>ダイエット方法（食事の割合）とは別に、<b>期間を決めて行う</b>、ファスティング・16時間断食・腸活・短期ダイエットです。各プログラムに、根拠（PubMed）と、向かない人を載せています。</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SHORT_PLANS.map((p) => (
          <button key={p.id} type="button" aria-pressed={id === p.id} className={id === p.id ? "trchip on" : "trchip"} onClick={() => setId(p.id)}>{p.icon} {p.name.replace(/（.*$/, "")}</button>
        ))}
      </div>
      <div style={box}>
        <ShortPlanView plan={plan} />
      </div>
      <p className="agnote">指導メモ・定期フォロー資料で、このプログラムを選ぶと、お客様向けのPDFに入ります。お客様は、ホームの「短期プログラム」でも、見られます。</p>
    </section>
  );
}

/* ---------- ③ 食事法とバランス ---------- */
function MethodTab() {
  return (
    <section>
      <p style={{ margin: "0 0 8px" }}>5つの食事法の割合（エネルギー比）と、向く人・注意点・根拠です。割合は目安で、お客様に合わせて直します。</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead><tr style={{ background: "#f3f3f3" }}><th style={th}>方法</th><th style={th}>P%</th><th style={th}>F%</th><th style={th}>C%</th><th style={th}>1,600kcalなら（P/F/C g）</th><th style={th}>根拠の強さ</th></tr></thead>
          <tbody>
            {METHODS.map((m) => {
              const x = macrosFor(1600, m.pct);
              return <tr key={m.id} style={{ borderTop: "1px solid #eee" }}><td style={td}>{m.icon} {m.name}</td><td style={td}>{m.pct.p}</td><td style={td}>{m.pct.f}</td><td style={td}>{m.pct.c}</td><td style={td}>{x.p}／{x.f}／{x.c}</td><td style={td}>{m.level}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      {METHODS.map((m) => (
        <details key={m.id} style={box}>
          <summary><b>{m.icon} {m.name}</b>　{m.tag}{m.risky ? "　⚠医師の管理が必要な人が多い" : ""}</summary>
          <p style={{ margin: "8px 0" }}>{m.summary}</p>
          <div><b>向く人：</b>{m.suits}</div>
          <div style={{ marginTop: 6 }}><b>進め方</b></div>
          <ul style={{ margin: "0 0 0 18px" }}>{m.choose.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <div style={{ marginTop: 6 }}><b>避けること</b></div>
          <ul style={{ margin: "0 0 0 18px" }}>{m.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <div style={{ marginTop: 6, color: "#8a4b00" }}><b>注意</b></div>
          <ul style={{ margin: "0 0 0 18px", color: "#8a4b00" }}>{m.caution.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <div style={{ marginTop: 6 }}><b>根拠</b></div>
          <ul style={{ margin: "0 0 0 18px", fontSize: 13 }}>{m.evidence.map((e, i) => <li key={i}>{e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></li>)}</ul>
        </details>
      ))}
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>バランスの考え方（共通）</h3>
        <ul style={{ margin: "0 0 0 18px" }}>
          <li>食事法の差より、<b>カロリーを守って続けられること</b>が大きい（Sacks 2009 NEJM、Ge 2020 BMJ）。</li>
          <li>減量中のたんぱく質は体重1kgあたり1.6〜2.2g程度が目安（Morton 2018 Br J Sports Med）。腎臓病などは主治医に確認。</li>
          <li>脂質は20〜30%、食物繊維は1日18〜22g以上、食塩は男性7.5g未満・女性6.5g未満が国の目標（日本人の食事摂取基準2025年版）。</li>
          <li>毎食、主食・主菜・副菜をそろえると、ビタミン・ミネラル不足を防ぎやすい。</li>
          <li>未成年・妊娠中・持病のある人に、極端な方法（ケトジェニックなど）は使わない。</li>
        </ul>
      </div>
    </section>
  );
}

/* ---------- ④ 計算方法と根拠 ---------- */
function CalcTab() {
  return (
    <section>
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>目標カロリーの出し方</h3>
        <ol style={{ margin: "0 0 0 18px" }}>
          <li><b>基礎代謝</b>：体組成計の値があればそれを使う → 体脂肪率があれば除脂肪量から（19.7×除脂肪量＋413）→ 身長・年齢・体重があればMifflin-St Jeor式 → どれもなければ食事摂取基準の推定エネルギー必要量。</li>
          <li><b>活動量</b>：低い1.5／ふつう1.75／高い2.0 を掛けて維持カロリーを出す。</li>
          <li><b>減らす幅</b>：ゆっくり（月1kg）／ふつう（週に体重の0.5%）／しっかり（週に0.75%）。維持の15%（しっかりは20%）を上限にして、代謝が落ちすぎないようにする。</li>
          <li><b>下限</b>：女性1,200・男性1,500 kcal、または基礎代謝のどちらか高い方より下げない。4週間ごとに見直す。</li>
          <li>体重1kg ≒ 約7,200kcal は近似で、個人差があります。</li>
          <li>中学生・高校生は大人の式を使わず、減量はすすめません。</li>
        </ol>
      </div>
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>指導方針の根拠（断食・夜の糖質）</h3>
        {COMMON_NOTES.map((n) => (
          <div key={n.id} style={{ margin: "8px 0" }}>
            <b>{n.icon} {n.title}</b>
            <p style={{ margin: "4px 0", fontSize: 14 }}>{n.verdict}</p>
            <ul style={{ margin: "0 0 0 18px", fontSize: 13 }}>
              {n.evidence.map((e) => <li key={e.pmid}>{e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>この資料の限界（正直に）</h3>
        <ul style={{ margin: "0 0 0 18px" }}>
          <li>診断・治療・処方ではありません。持病・服薬のある方は主治医・管理栄養士の指示が優先です。</li>
          <li>食品の数値は目安です。調理法・銘柄で変わります。</li>
          <li>更年期・ケトジェニックの禁忌・野菜350gの目標などは、一般的な知見で、個別の論文は確認していません。</li>
          <li>機器（体組成計）の値には誤差があります。</li>
        </ul>
      </div>
      <div style={box}>
        <h3 style={{ margin: "0 0 6px" }}>主な参考文献（PubMed）</h3>
        <ul style={{ margin: "0 0 0 18px", fontSize: 14 }}>
          {[
            ["Mifflin 1990 Am J Clin Nutr（基礎代謝の式）", "2305711"],
            ["Frankenfield 2005 J Am Diet Assoc（式の比較レビュー）", "15883556"],
            ["Sacks 2009 NEJM（食事の割合と2年後の減量）", "19246357"],
            ["Ge 2020 BMJ（低脂質・低糖質の比較）", "32238384"],
            ["Morton 2018 Br J Sports Med（たんぱく質と筋肉）", "28698222"],
            ["Lean 2018 Lancet（DiRECT）", "29221645"],
          ].map(([t, id]) => <li key={id}>{t}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${id}/`} target="_blank" rel="noreferrer">PubMed</a></li>)}
        </ul>
      </div>
    </section>
  );
}
