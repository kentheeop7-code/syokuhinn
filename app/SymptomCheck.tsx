"use client";

import EvidenceBox from "./EvidenceBox";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMe } from "./me";
import LineShare from "./LineShare";
import CauseMini from "./CauseMini";

// 気になること → 原因予測の悩み
const TO_COMPLAINT: Record<string, string> = { tired: "tired", anemia: "tired", swell: "swell", const: "const", skin: "skin", hair: "skin", cold: "cold", sleep: "sleep", sweet: "sweet" };

// 記録はとらない。「いまの気になること」を選ぶだけで、足したい栄養と食べ物が分かる。
type Sym = { id: string; icon: string; label: string; nutrients: string[]; foods: string; tip: string; guide?: string };

const SYMS: Sym[] = [
  { id: "tired", icon: "😮‍💨", label: "疲れやすい・だるい", nutrients: ["鉄", "ビタミンB群", "たんぱく質"], foods: "赤身肉・レバー・カツオ・豚肉・鶏肉・納豆・卵・あさり", tip: "朝食を抜かず、毎食にたんぱく質を。2週間続けても取れないときは、受診を。", guide: "fatigue" },
  { id: "anemia", icon: "🩸", label: "立ちくらみ・貧血ぎみ", nutrients: ["鉄", "ビタミンC", "ビタミンB12"], foods: "赤身牛肉・レバー・あさり・小松菜・ほうれん草・ブロッコリー・ピーマン・キウイ", tip: "鉄は、ビタミンCの食品と一緒に。食事中のお茶・コーヒーは避ける。", guide: "anemia" },
  { id: "swell", icon: "🦵", label: "むくみ・血圧が気になる", nutrients: ["カリウム", "たんぱく質", "食塩をひかえる"], foods: "バナナ・ほうれん草・アボカド・いも・かぼちゃ・トマト・海藻・納豆", tip: "麺の汁を残す・漬物や加工品を減らす。食塩は、性別・年齢ごとの目標量（食事摂取基準2025年版）未満が目安。", guide: "swelling" },
  { id: "const", icon: "🚽", label: "便秘・おなかの張り", nutrients: ["食物繊維", "水分", "マグネシウム"], foods: "もち麦・オートミール・納豆・ごぼう・ブロッコリー・豆類・おから・海藻・きのこ・キウイ・ヨーグルト", tip: "朝は、水1杯→朝食→トイレ（3分）。食物繊維は、少しずつ増やす。", guide: "gut" },
  { id: "skin", icon: "✨", label: "肌荒れ・口内炎", nutrients: ["ビタミンB2・B6", "たんぱく質", "ビタミンC", "亜鉛"], foods: "卵・納豆・レバー・サケ・鶏肉・ピーマン・ブロッコリー・牛肉", tip: "甘いもの・揚げ物が続いていないか見直して、睡眠もしっかり。", guide: "beauty" },
  { id: "hair", icon: "💇‍♀️", label: "髪が細い・抜けやすい", nutrients: ["たんぱく質", "鉄", "亜鉛"], foods: "肉・魚・卵・大豆・あさり・牛肉", tip: "極端な食事制限は、髪にも出やすい。たんぱく質を、毎食に。", guide: "beauty" },
  { id: "cold", icon: "🥶", label: "冷え", nutrients: ["鉄", "たんぱく質", "ビタミンE"], foods: "赤身肉・魚・卵・アーモンド・かぼちゃ", tip: "食事量が少なすぎないか確認を。温かい汁物を、1日1回。" },
  { id: "pms", icon: "🌙", label: "月経前のイライラ・不調", nutrients: ["ビタミンB6", "マグネシウム", "カルシウム"], foods: "マグロ・鶏むね肉・バナナ・大豆・海藻・乳製品", tip: "月経前の1週間は、カフェイン・甘い飲み物・塩分を、控えめに。", guide: "pms" },
  { id: "sleep", icon: "😴", label: "眠りが浅い・寝つきが悪い", nutrients: ["マグネシウム", "トリプトファン", "カフェインをひかえる"], foods: "牛乳・ヨーグルト・納豆・バナナ・卵・海藻", tip: "夕食は寝る3時間前までに。カフェインは、午後2〜3時まで。", guide: "sleep" },
  { id: "hot", icon: "🔥", label: "ほてり・のぼせ（更年期）", nutrients: ["大豆製品", "ビタミンE", "カルシウム"], foods: "豆腐・納豆・豆乳・アーモンド・乳製品・小魚", tip: "辛いもの・カフェイン・お酒は控えめに。つらいときは婦人科へ。", guide: "menopause" },
  { id: "bone", icon: "🦴", label: "骨・関節が気になる", nutrients: ["カルシウム", "ビタミンD", "ビタミンK", "たんぱく質"], foods: "牛乳・ヨーグルト・小魚・サケ・きのこ・納豆・小松菜", tip: "食事と、体重をかける運動（ウォーキング・スクワット）をセットで。", guide: "bone" },
  { id: "cold2", icon: "🤧", label: "風邪をひきやすい", nutrients: ["たんぱく質", "ビタミンC", "ビタミンD", "亜鉛"], foods: "卵・肉・魚・ピーマン・キウイ・きのこ・牛肉", tip: "睡眠を十分にとり（成人は6時間以上が目安）、毎食にたんぱく質を。", guide: "immune" },
  { id: "muscle", icon: "💪", label: "筋肉が落ちた・つきにくい", nutrients: ["たんぱく質", "ビタミンD", "エネルギー（食べる量）"], foods: "鶏むね肉・魚・卵・牛乳・ごはん（主食も）", tip: "体重1kgあたり1.4〜2.0gのたんぱく質を、毎食に分けて。", guide: "muscle" },
  { id: "sweet", icon: "🍫", label: "甘いものがやめられない", nutrients: ["たんぱく質", "食物繊維", "鉄"], foods: "卵・ヨーグルト・ナッツ・もち麦・納豆", tip: "食事を抜かない・間隔をあけすぎない・睡眠不足を避ける。" },
  { id: "cramp", icon: "🦶", label: "足がつる（こむら返り）", nutrients: ["マグネシウム", "カリウム", "水分"], foods: "海藻・大豆・ナッツ・バナナ・ほうれん草・水分", tip: "寝る前に、水分とふくらはぎのストレッチを。" },
  { id: "eye", icon: "👀", label: "目の疲れ", nutrients: ["ビタミンA", "ビタミンB群", "DHA・EPA"], foods: "にんじん・かぼちゃ・レバー・サバ・イワシ", tip: "1時間に1回は、遠くを見て休憩を。" },
];

export default function SymptomCheck() {
  const me = useMe();
  const [sel, setSel] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-sym") || "null");
      if (Array.isArray(s)) setSel(s.filter((x) => SYMS.some((y) => y.id === x)));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-sym", JSON.stringify(sel));
    } catch {}
  }, [sel, loaded]);

  // 性別・年齢に合わせて、出す項目を絞る（月経・更年期は、女性のみ）
  const list = SYMS.filter((s) => {
    if (s.id === "pms") return me.sexKey === "f" && me.band <= 4;
    if (s.id === "hot") return me.sexKey === "f" && me.band >= 3 && me.band <= 5;
    return true;
  });
  const chosen = list.filter((s) => sel.includes(s.id));
  // 選んだ不調に、いちばん多く出てくる栄養を、上に
  const ranking = useMemo(() => {
    const m = new Map<string, number>();
    chosen.forEach((s) => s.nutrients.forEach((n) => m.set(n, (m.get(n) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [chosen]);

  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  return (
    <section className="card symc" aria-label="気になることから、足したい栄養を探す">
      <h2 className="h2" style={{ marginTop: 0 }}>
        🩺 気になることから、足したい栄養を探す
      </h2>
      <p className="agnote">
        <b>記録は、いりません。</b>いま気になることを、タップして選ぶだけ（いくつでもOK）。足したい栄養と、食べ物が分かります。
      </p>

      <p className="agnote">
        原因を知りたいときは、ホームの
        <Link href="/" className="evlink">
          「いまの食事のバランス」→ 原因を予測する ›
        </Link>
        で、いつもの食事から調べられます。
      </p>
      <div className="symchips">
        {list.map((s) => (
          <button key={s.id} type="button" aria-pressed={sel.includes(s.id)} className={sel.includes(s.id) ? "on" : ""} onClick={() => toggle(s.id)}>
            <span aria-hidden>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {chosen.length === 0 ? (
        <p className="symempty">気になることを選ぶと、ここに結果が出ます。</p>
      ) : (
        <div className="symres">
          <p className="balh">足したい栄養（多く関わる順）</p>
          <ul className="symrank">
            {ranking.map(([n, c], i) => (
              <li key={n}>
                <i>{i + 1}</i>
                <b>{n}</b>
                {c > 1 && <em>{c}つの項目に関係</em>}
              </li>
            ))}
          </ul>

          {(() => {
            const ids = [...new Set(chosen.map((s) => TO_COMPLAINT[s.id]).filter(Boolean))];
            return ids.length > 0 ? <CauseMini ids={ids} title="🔍 あなたの食事から見た、原因の予測" /> : null;
          })()}

          <p className="balh">項目ごとの、食べ物とひとこと</p>
          <ul className="symlist">
            {chosen.map((s) => (
              <li key={s.id}>
                <p className="symt">
                  <span aria-hidden>{s.icon}</span> <b>{s.label}</b>
                </p>
                <p>
                  <small>足したい栄養</small>
                  {s.nutrients.join("・")}
                </p>
                <p>
                  <small>おすすめの食べ物</small>
                  {s.foods}
                </p>
                <p>
                  <small>ひとこと</small>
                  {s.tip}
                </p>
                {s.guide && (
                  <Link href={`/nutrients#${s.guide}`} className="evlink">
                    くわしいガイドを見る ›
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {me.isYouth && <p className="symage">🌱 中学生・高校生は、成長期です。ダイエットや食事を減らす対策は、せず、気になるときは、保護者・学校の先生・医師に相談しましょう。</p>}
          {me.band >= 5 && <p className="symage">🌱 65歳以上の方は、食べる量が減っていないか、体重が減っていないかを、あわせて確認しましょう。「しっかり食べる」ことを、優先してください。</p>}
          {me.band === 4 && me.sexKey === "f" && <p className="symage">🌱 50代の女性は、更年期で、骨・血圧・コレステロールが変わりやすい時期です。年1回の健診も、忘れずに。</p>}
          <EvidenceBox ids={["dri2025", "ods"]} level="栄養の基本は強い／症状との対応は、一般的" note="それぞれの栄養素のはたらきと、必要な量は、国の基準と、NIHの資料にもとづきます。「この症状には、この栄養」という対応は、一般的な栄養学の知識で、症状の原因は人によって違います。食事だけで治らないことも多く、続くときは、受診してください。" />
          <LineShare
            title="気になること"
            build={() =>
              ["■ 気になること", ...chosen.map((s) => `・${s.label}`), "", "■ 足したい栄養（多く関わる順）", ranking.map(([n]) => n).join("・"), "", "■ おすすめの食べ物", ...chosen.map((s) => `・${s.label}：${s.foods}`)].join("\n")
            }
          />
          <p className="symwarn">
            ⚠ 症状が強い・長く続く・急に出たときは、食事で様子を見ず、医師に相談してください。サプリを使う場合も、先に医師・薬剤師へ。
          </p>
        </div>
      )}
      {chosen.length > 0 && (
        <button type="button" className="btn ghost symclear" onClick={() => setSel([])}>
          選びなおす
        </button>
      )}
    </section>
  );
}





