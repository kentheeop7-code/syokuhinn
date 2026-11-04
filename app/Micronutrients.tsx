"use client";

import { useMemo } from "react";
import EvidenceBox from "./EvidenceBox";
import { FOODS, type Food } from "../lib/foods";
import { DRI_TABLE } from "../lib/driTable";
import { BAND_SHORT, REF, useMe } from "./me";

// ビタミン・ミネラルの、1日の目安（性別・年齢別）と、それをとれる食品。数値は、日本人の食事摂取基準（2025年版）と、日本食品標準成分表（八訂増補2023年）。
const ROLE: Record<string, string> = {
  vA: "目・皮膚・粘膜を守ります。",
  vD: "カルシウムの吸収を助け、骨・筋肉を守ります。",
  vE: "細胞が酸化するのを防ぎます。",
  vK: "血液を固めるはたらきと、骨に関わります。",
  vC: "コラーゲンの材料づくり・抗酸化・鉄の吸収を助けます。",
  b1: "糖質をエネルギーに変えます。",
  b2: "脂質・糖質の代謝と、皮膚・粘膜に関わります。",
  nia: "エネルギーをつくる、はたらきを助けます。",
  b6: "たんぱく質の代謝に関わります。",
  b12: "赤血球や神経のはたらきに関わります（動物性食品に多い）。",
  fol: "赤血球や細胞の新しい細胞づくりに関わります。",
  ca: "骨・歯をつくり、筋肉や神経にも関わります。",
  mg: "骨や筋肉・神経のはたらき、エネルギーづくりに関わります。",
  fe: "血液（赤血球）で、酸素を運びます。",
  zn: "味覚・免疫・たんぱく質の合成に関わります。",
  cu: "鉄の利用や、血液づくりを助けます。",
  io: "甲状腺ホルモンの材料です。",
  se: "抗酸化のはたらきをする酵素の材料です。",
};
const NOTE: Record<string, string> = {
  vA: "レバーやサプリのとりすぎに注意（上限があります）。妊娠中は、特に注意してください。",
  vD: "日光も大切です。サプリで、上限をこえないように。",
  vK: "ワルファリンを飲んでいる方は、納豆・緑黄色野菜の量を、医師に相談してください。",
  fol: "上限は、サプリなど（食品以外）からの量です。妊娠を計画している女性は、神経管閉鎖障害を減らすため、食事に加えて、1日400μgの葉酸（サプリ）がすすめられています。",
  fe: "女性は、月経のある人の値です（65歳以上は、月経なしの値）。",
  ca: "上限は、サプリなどもふくめた量です。",
  io: "昆布・昆布だしを毎日たくさん食べると、上限をこえることがあります。甲状腺の病気のある方は、主治医に確認を。",
  b12: "植物性食品には、ほとんど含まれません。",
};
// 食品データの、どの項目に当たるか
const FIELD: Record<string, keyof Food> = { vA: "va", vD: "vd", vC: "vc", b1: "b1", b2: "b2", nia: "nia", b6: "b6", b12: "b12", fol: "fol", ca: "ca", mg: "mg", fe: "fe", zn: "zn" };
const VITAMINS = ["vA", "vD", "vE", "vK", "vC", "b1", "b2", "nia", "b6", "b12", "fol"];
const MINERALS = ["ca", "mg", "fe", "zn", "cu", "io", "se"];

const usual = (f: Food) => (f.cat === "肉類" || f.cat === "魚介類" || f.cat === "野菜・果物" || f.cat === "卵・乳・大豆" || f.cat === "穀物・主食") && !/乾|粉|素干し|干し|パウダー|加工品|（茶）|茶葉|缶詰|漬|ふりかけ|煮干し|焼き干し/.test(f.name);
const base = (n: string) => n.split("（")[0];

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : String(Math.round(n * 10) / 10));

export default function Micronutrients() {
  const me = useMe();
  const b = me.band;
  const sexText = me.sexKey === "f" ? "女性" : "男性";

  // 栄養素ごとに、よくとれる食品（100gあたりの量が多い順・同じ食品は1つ）
  const topFoods = useMemo(() => {
    const out: Record<string, Food[]> = {};
    for (const [k, field] of Object.entries(FIELD)) {
      const seen = new Set<string>();
      const list: Food[] = [];
      for (const f of [...FOODS].filter(usual).sort((x, y) => (y[field] as number) - (x[field] as number))) {
        const nm = base(f.name);
        if (seen.has(nm) || (f[field] as number) <= 0) continue;
        seen.add(nm);
        list.push(f);
        if (list.length >= 4) break;
      }
      out[k] = list;
    }
    return out;
  }, []);

  if (!me.ready) return null;

  const row = (key: string) => {
    const r = DRI_TABLE.find((x) => x.key === key);
    if (!r) return null;
    const v = (me.sexKey === "f" ? r.f : r.m)[b];
    const ul = (me.sexKey === "f" ? r.uf : r.um)?.[b] ?? null;
    const field = FIELD[key];
    const foods = topFoods[key] ?? [];
    return (
      <li key={key}>
        <details className="micro">
          <summary>
            <span className="mname">{r.name}</span>
            <span className="mval">
              <b>{fmt(v)}</b>
              {r.unit}
              <small>{r.kind}</small>
            </span>
          </summary>
          <p className="mrole">{ROLE[key]}</p>
          {ul !== null && (
            <p className="mul">
              <small>とりすぎの上限</small>
              {fmt(ul)}
              {r.unit}／日
            </p>
          )}
          {NOTE[key] && <p className="mnote">{NOTE[key]}</p>}
          {field && foods.length > 0 && (
            <div className="mfoods">
              <small>とりやすい食品（100gあたり → 1日分に必要な量）</small>
              <ul>
                {foods.map((f) => {
                  const per = f[field] as number;
                  const g = Math.max(5, Math.ceil(((v / per) * 100) / 10) * 10);
                  return (
                    <li key={f.name}>
                      <span>{base(f.name)}</span>
                      <em>
                        {fmt(per)}
                        {r.unit}
                      </em>
                      <b>約{g}g</b>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!field && <p className="mnote">この栄養素の食品別の量は、このアプリの食品データには、載せていません。</p>}
        </details>
      </li>
    );
  };

  return (
    <section className="card micros" aria-label="ビタミン・ミネラルの1日の目安">
      <p className="agnote">
        {sexText}・{BAND_SHORT[b]}の目安です（日本人の食事摂取基準 2025年版）。タップすると、はたらきと、とりやすい食品が出ます。妊娠中・授乳中は、別の基準です。
      </p>
      <p className="balh">ビタミン</p>
      <ul className="mlist">{VITAMINS.map(row)}</ul>
      <p className="balh">ミネラル</p>
      <ul className="mlist">
        {MINERALS.map(row)}
        <li>
          <details className="micro">
            <summary>
              <span className="mname">カリウム</span>
              <span className="mval">
                <b>{REF[me.sexKey].k[b].toLocaleString()}</b>mg以上<small>目標量</small>
              </span>
            </summary>
            <p className="mrole">塩分（ナトリウム）の排出を助け、血圧に関わります。野菜・いも・果物・豆・海藻で、とれます。</p>
            <p className="mnote">腎臓の病気のある方は、主治医に確認してください。</p>
          </details>
        </li>
        <li>
          <details className="micro">
            <summary>
              <span className="mname">食塩相当量</span>
              <span className="mval">
                <b>{REF[me.sexKey].salt[b]}</b>g未満<small>目標量</small>
              </span>
            </summary>
            <p className="mrole">とりすぎると、血圧・むくみに関わります。高血圧の方は、1日6g未満が目標です。</p>
          </details>
        </li>
      </ul>
      <EvidenceBox
        ids={["dri2025", "food8"]}
        level="国の基準（強い）"
        note="目安の量は、厚生労働省「日本人の食事摂取基準（2025年版）」の表から、転記しています。「推奨量」は、ほとんどの人が足りる量。「目安量」は、推奨量が決められないときの、十分と考えられる量です。食品の量は、日本食品標準成分表（八訂）増補2023年にもとづく、100gあたりの値から、このアプリが計算した、おおよその量です。"
      />
    </section>
  );
}
