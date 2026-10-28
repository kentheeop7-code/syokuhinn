"use client";

import { useEffect, useState } from "react";
import EvidenceBox from "./EvidenceBox";
import { BAND_SHORT, REF, VITD, useMe } from "./me";
import type { CIn } from "./CausePanel";

type St = "ok" | "low" | "high" | "none";
type Row = { name: string; target: string; now?: number; goal?: number; unit: string; max?: boolean; why: string; foods: string };

// ダイエット（減量）中に、特に不足させたくない栄養素。目標値は、日本人の食事摂取基準（2025年版）。
export default function DietNutrients({ bare = false }: { bare?: boolean }) {
  const me = useMe();
  const [cin, setCin] = useState<{ touched: boolean; input: CIn } | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const s = JSON.parse(localStorage.getItem("lg-cin") || "null");
        setCin(s && s.input && s.touched ? s : null);
      } catch {
        setCin(null);
      }
    };
    read();
    window.addEventListener("lg-status-change", read);
    return () => window.removeEventListener("lg-status-change", read);
  }, []);
  if (!me.ready) return null;
  const r = REF[me.sexKey];
  const b = me.band;
  const x = cin?.input;
  const rows: Row[] = [
    { name: "食物繊維", target: `${r.fiber[b]}g以上`, now: x?.fi, goal: r.fiber[b], unit: "g", why: "満腹感が続き、便通・血糖・コレステロールにも関わります。減量中の「食べすぎ」と「便秘」を防ぎます。", foods: "もち麦・玄米・豆類・納豆・野菜・きのこ・海藻・果物（急に増やさず、少しずつ）" },
    { name: "たんぱく質", target: `${r.protein[b]}g以上`, now: x?.p, goal: r.protein[b], unit: "g", why: "減量中に、筋肉が落ちるのを防ぎます。不足すると、基礎代謝が下がり、リバウンドしやすくなります。", foods: "卵・納豆・豆腐・魚・鶏むね・ささみ・牛乳・ヨーグルト（毎食に分けて）" },
    { name: "鉄", target: `${r.fe[b]}mg前後`, now: x?.feMg, goal: r.fe[b], unit: "mg", why: "食事を減らすと不足しがちです。不足すると、だるさ・立ちくらみで、運動も続けにくくなります。", foods: "赤身肉・レバー・カツオ・あさり・小松菜（ビタミンCと一緒に）" },
    { name: "カルシウム", target: `${r.ca[b]}mg前後`, now: x?.ca, goal: r.ca[b], unit: "mg", why: "骨を守ります。無理な減量は、骨量の低下につながるため、乳製品・小魚・大豆を削らないことが大切です。", foods: "牛乳・ヨーグルト・チーズ・小魚・豆腐・小松菜" },
    { name: "食塩（とりすぎない）", target: `${r.salt[b]}g未満`, now: x?.salt, goal: r.salt[b], unit: "g", max: true, why: "減量中の体重の「増減」には、水分（むくみ）も関わります。塩分が多いと、むくみ・血圧にも影響します。", foods: "麺の汁を残す・漬物や加工品を減らす" },
    { name: "カリウム", target: `${r.k[b].toLocaleString()}mg以上`, unit: "mg", why: "塩分（ナトリウム）の排出を助けます。野菜・いも・果物・豆で、とれます。", foods: "野菜・いも・バナナ・アボカド・納豆・海藻" },
    { name: "ビタミンD", target: `${VITD}μg（目安量）`, unit: "μg", why: "カルシウムの吸収を助け、骨や筋肉を守ります。", foods: "サケ・サンマ・しらす・きのこ・卵（日光も大切）" },
    { name: "ビタミンB群", target: "（食事から、まんべんなく）", unit: "", why: "食べた糖質・脂質を、エネルギーに変える働きを助けます。", foods: "豚肉・レバー・卵・納豆・魚・玄米" },
  ];
  const st = (rw: Row): St => {
    if (rw.now == null || rw.goal == null) return "none";
    if (rw.max) return rw.now >= rw.goal ? "high" : "ok";
    return rw.now >= rw.goal * (rw.name === "食物繊維" || rw.name === "たんぱく質" ? 0.9 : 0.8) ? "ok" : "low";
  };
  return (
    <section className="card" aria-label="ダイエットに必要な栄養素">
      {!bare && (
        <h2 className="h2" style={{ marginTop: 0 }}>
          🥗 ダイエットに必要な栄養素
        </h2>
      )}
      <p className="agnote">
        {me.sexKey === "f" ? "女性" : "男性"}・{BAND_SHORT[b]}の目安です。{x ? "「いまの食事」は、ホームで選んだ内容からの概算です。" : "ホームの「いまの食事のバランス」を選ぶと、あなたの食事との比較が出ます。"}
      </p>
      {me.isYouth && <p className="agnote">🌱 中学生・高校生は、成長期です。ダイエットより、しっかり食べることを優先し、気になるときは、保護者・学校の先生・医師に相談しましょう。</p>}
      <p className="balh sub">いちばん大切な考え方</p>
      <ul className="dnrules">
        <li>
          <b>食べる量を、減らしすぎない。</b>
          必要なエネルギーを大きく下回ると、筋肉・骨・月経・髪に影響し、リバウンドもしやすくなります。
        </li>
        <li>
          <b>減らすのは「量」より「中身」から。</b>
          揚げ物・甘い飲み物・お菓子・お酒から見直し、主食・たんぱく質・野菜は、残します。
        </li>
        <li>
          <b>食物繊維とたんぱく質を、先に確保する。</b>
          満腹感が続き、筋肉が守られるため、減量が続けやすくなります。
        </li>
      </ul>
      <ul className="balchk">
        {rows.map((rw) => {
          const s = st(rw);
          return (
            <li key={rw.name} className={s === "none" ? "" : s}>
              <b>{rw.name}</b>
              {rw.now != null && <span>いま 約{rw.unit === "g" ? Math.round(rw.now * 10) / 10 : Math.round(rw.now)}{rw.unit}</span>}
              <small>目安 {rw.target}</small>
              {s !== "none" && <em>{s === "ok" ? "OK" : s === "low" ? "足りない" : "多め"}</em>}
              {rw.now != null && rw.goal != null && (
                <i className="gauge" aria-hidden>
                  <u style={{ width: `${Math.min(100, Math.round((rw.now / rw.goal) * 100))}%` }} />
                </i>
              )}
              <p className="dnwhy">{rw.why}</p>
              <p className="dnfoods">
                <small>おすすめ</small>
                {rw.foods}
              </p>
            </li>
          );
        })}
      </ul>
      <EvidenceBox ids={["dri2025", "issn2017", "helms2014", "hall2011", "obesity2022"]} level="目安の量は強い／減量中の考え方は、中くらい" note="性別・年齢別の目安量は、食事摂取基準（2025年版）の値です。「減量中も、たんぱく質・食物繊維を確保し、極端に減らさない」は、肥満症診療ガイドラインや、減量中の栄養に関する総説にもとづく一般的な考え方です。減量中の特別な目安量は、基準にないため、通常の目安を使っています。" />
    </section>
  );
}
