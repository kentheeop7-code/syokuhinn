"use client";

import { useEffect, useState } from "react";
import { amountOf } from "../lib/microLookup";
import { BAND_SHORT, readMe } from "./me";

// 持病のある方の、栄養素の目安（表）。数字は、確認できた資料の値だけ。
// me＝その人の目安（食事摂取基準2025。性別・年齢で変わる）を、自動で入れる。
type Row = { n: string; me?: string; v?: string; how: string };
type Src = { label: string; url: string };
type C = { id: string; label: string; rows: Row[]; note?: string; src: Src[] };

const DRI: Src = { label: "厚生労働省 日本人の食事摂取基準（2025年版）", url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/syokuji_kijyun.html" };
const CS: C[] = [
  {
    id: "thy",
    label: "🦋 甲状腺（低下・亢進）",
    rows: [
      { n: "ヨウ素", me: "ヨウ素", how: "昆布・昆布だしを、毎日たくさんは避ける。サプリは主治医に。検査・治療の前は、制限の指示が出ることがある。" },
      { n: "セレン", me: "セレン", how: "食事の範囲で。サプリが甲状腺の病気に効くという根拠は、この調査では確認できていません。" },
      { n: "鉄・カルシウム", how: "薬（レボチロキシン）と同時にとると、吸収が下がることがある。飲む時間を、主治医・薬剤師に確認。" },
      { n: "エネルギー", how: "機能亢進で体重が減る時期は、減量の制限をしない。低下は、数値が安定してから、月1kgまで。" },
    ],
    src: [{ label: "伊藤病院「ヨウ素と甲状腺の関係」", url: "https://www.ito-hospital.jp/06_iodine/01_about_iodine.html" }, DRI],
  },
  {
    id: "dm",
    label: "🍚 糖尿病",
    rows: [
      { n: "炭水化物", v: "エネルギーの40〜60%", how: "ごはん・パン・めんは、量を決めて、毎食に分ける。" },
      { n: "たんぱく質", v: "エネルギーの20%まで", how: "魚・大豆・卵・肉を、毎食に。腎臓の合併症があるときは、主治医の指示を優先。" },
      { n: "脂質", v: "エネルギーの20〜30%", how: "揚げ物・脂の多い肉は、頻度を決める。" },
      { n: "食物繊維", me: "食物繊維", how: "野菜・きのこ・海藻・こんにゃくを、先に。" },
    ],
    note: "エネルギーの目安は、目標体重（身長m²×22）×25〜35。薬を使っている人は、食事の変更を主治医に。",
    src: [{ label: "糖尿病情報センター「糖尿病の食事のはなし」", url: "https://dmic.jihs.go.jp/general/about-dm/040/020/02-1.html" }],
  },
  {
    id: "htn",
    label: "🧂 高血圧",
    rows: [
      { n: "食塩", v: "1日6g未満", how: "汁物は半分残す。漬物・練り物・加工肉・インスタント麺は、頻度を決める。" },
      { n: "カリウム", me: "カリウム", how: "野菜・果物・豆・いも・海藻で。腎臓の病気がある人は、とりすぎに注意（主治医に確認）。" },
    ],
    note: "食塩6g未満は、高血圧治療ガイドライン2019の目標。国の目標量は、男性7.5g未満・女性6.5g未満（2025年版）。",
    src: [{ label: "高血圧治療ガイドライン2019 一般向け解説", url: "https://www.jpnsh.jp/data/jsh2019_gen.pdf" }, DRI],
  },
  {
    id: "lip",
    label: "🧈 脂質異常症",
    rows: [
      { n: "脂質", v: "エネルギーの20〜25%", how: "揚げ物・脂身・バター・洋菓子を、頻度を決める。" },
      { n: "飽和脂肪酸", v: "4.5%以上 7%未満", how: "肉の脂身・バター・生クリームに多い。" },
      { n: "コレステロール", v: "1日200mg未満", how: "卵・内臓・魚卵・いか・えびを、とりすぎない。" },
      { n: "炭水化物", v: "エネルギーの50〜60%", how: "食物繊維を増やす。" },
      { n: "食物繊維", me: "食物繊維", how: "野菜・きのこ・海藻・豆・玄米・麦。" },
      { n: "n-3系脂肪酸", how: "さば・いわし・さんまなどの青魚を、増やす。" },
      { n: "食塩・アルコール", v: "6g/日未満・25g/日以下", how: "アルコール量の目安：ビール中びん1本（500ml）で、約20g。" },
    ],
    note: "工業由来のトランス脂肪酸は、控える。LDLなどの値で、必要な食事は変わるため、主治医の指示を優先。",
    src: [{ label: "日本心臓財団「動脈硬化性疾患予防ガイドライン・エッセンス」", url: "https://www.jhf.or.jp/pro/a&s_info/guideline/post_2.html" }],
  },
  {
    id: "an",
    label: "🩸 貧血（鉄不足）",
    rows: [
      { n: "鉄", me: "鉄", how: "赤身肉・レバー・あさり・小松菜。月経のある人は、多めに。" },
      { n: "ビタミンC", me: "ビタミンC", how: "野菜・果物を、鉄の食品といっしょに。" },
      { n: "葉酸", me: "葉酸", how: "緑の野菜・豆・レバー。貧血には、鉄以外の型（葉酸・ビタミンB12の不足）もある。検査の結果で、判断を。" },
      { n: "たんぱく質", me: "たんぱく質", how: "ダイエットで食事が減ると、鉄も、たんぱく質も、足りなくなりやすい。" },
    ],
    note: "サプリは、先に医師・薬剤師へ。立ちくらみ・息切れが続くときは、受診が先。",
    src: [DRI],
  },
  {
    id: "bone",
    label: "🌙 更年期・骨",
    rows: [
      { n: "カルシウム", me: "カルシウム", how: "牛乳・ヨーグルト・小松菜・ひじき・豆腐。" },
      { n: "ビタミンD", me: "ビタミンD", how: "さけ・さんま・きのこ。日光も。" },
      { n: "ビタミンK", me: "ビタミンK", how: "納豆・小松菜・ほうれん草。ワーファリンを飲んでいる人は、納豆などを、主治医に確認。" },
      { n: "たんぱく質", me: "たんぱく質", how: "肉・魚・卵・大豆・乳製品を、毎食に。" },
      { n: "避けたいこと", how: "極端な食事制限・食塩のとりすぎ・過度の飲酒は、骨粗鬆症の危険因子。" },
    ],
    src: [{ label: "厚生労働省 e-ヘルスネット「骨粗鬆症の予防のための食生活」", url: "https://kennet.mhlw.go.jp/information/information/food/e-02-007.html" }, DRI],
  },
  {
    id: "pcos",
    label: "🌸 PCOS・月経不順",
    rows: [
      { n: "エネルギー", how: "BMI25以上は、3〜6か月で体重の5〜10%減が目標。BMI25未満は、減量を勧めない。" },
      { n: "食物繊維", me: "食物繊維", how: "野菜・きのこ・海藻・豆を、毎食に。" },
      { n: "たんぱく質", me: "たんぱく質", how: "毎食に、手のひら1枚ぶん。" },
    ],
    src: [{ label: "日本産科婦人科学会 PCOSの治療指針の検証（2025）", url: "https://www.jsog.or.jp/news/pdf/PCOSshishin_20250717.pdf" }],
  },
  {
    id: "ckd",
    label: "⚠️ 腎臓の病気",
    rows: [
      { n: "たんぱく質・カリウム・リン・食塩", how: "病気の段階で、とってよい量が変わる。自分で増やしたり、減らしたりしない。" },
    ],
    note: "このページの、たんぱく質・カリウムの目安は、腎臓の病気のある人には、当てはまりません。必ず、主治医・管理栄養士の指示で。",
    src: [],
  },
];

export default function NutrientCond() {
  const [open, setOpen] = useState("");
  const [sex, setSex] = useState<"f" | "m">("f");
  const [band, setBand] = useState(3);
  useEffect(() => {
    const m = readMe();
    setSex(m.sex === 2 ? "m" : "f");
    setBand(m.band);
  }, []);
  const c = CS.find((x) => x.id === open);
  return (
    <div className="ncond">
      <p className="agnote">当てはまるものを選ぶと、栄養素の目安が、表で出ます。診断や治療ではなく、主治医の指示が優先です。</p>
      <div className="trchips" role="group" aria-label="持病・体質">
        {CS.map((x) => (
          <button key={x.id} type="button" aria-pressed={open === x.id} className={open === x.id ? "trchip on" : "trchip"} onClick={() => setOpen(open === x.id ? "" : x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      {c && (
        <div className="ncbox">
          <table className="nctable">
            <thead>
              <tr>
                <th>栄養素</th>
                <th>目安</th>
                <th>とり方</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => {
                const mine = r.me ? amountOf(r.me, sex, band) : null;
                return (
                  <tr key={r.n}>
                    <th scope="row">{r.n}</th>
                    <td>
                      {r.v && <b>{r.v}</b>}
                      {mine && (
                        <span className="ncme">
                          {r.v ? "／" : ""}あなた：{mine}
                        </span>
                      )}
                      {!r.v && !mine && "—"}
                    </td>
                    <td>{r.how}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {c.rows.some((r) => r.me) && <p className="agnote small">「あなた：」は、食事摂取基準（2025年版）の、性別・年齢（{BAND_SHORT[band]}）の目安です。変えるには「あなたの1日の目安」で。</p>}
          {c.note && <p className="agnote">{c.note}</p>}
          {c.src.length > 0 && (
            <p className="trsrc">
              <small>出典</small>
              {c.src.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}