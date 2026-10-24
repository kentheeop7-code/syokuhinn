"use client";

import Link from "next/link";
import EvidenceBox from "./EvidenceBox";
import { AGE_INFO, BANDS, BAND_SHORT, PAL_TEXT, REF, VITD, useMe } from "./me";

// 性別・年齢を選ぶと、1日の目安と、年齢による影響が出る。どのページでも共通。
export default function MeCard({ variant = "full", topic }: { variant?: "full" | "mini"; topic?: "gut" | "additives" | "tips" | "women" }) {
  const me = useMe();
  if (!me.ready) return null;
  const ref = REF[me.sexKey];
  const b = me.band;
  const sexText = me.sexKey === "f" ? "女性" : "男性";
  const info = AGE_INFO[b];

  if (variant === "mini") {
    const line =
      topic === "gut"
        ? `食物繊維の目安は、1日${ref.fiber[b]}g以上です。`
        : topic === "additives"
          ? `食塩相当量の目安は、1日${ref.salt[b]}g未満です。${b >= 6 ? "（75歳以上は、減塩より、しっかり食べることを優先）" : ""}`
          : topic === "tips"
            ? `たんぱく質の推奨量は、1日${ref.protein[b]}gです。${b >= 5 ? "筋肉を守るため、毎食とりましょう。" : b <= 1 ? "成長期は、毎食しっかりとりましょう。" : ""}`
            : `カルシウム${ref.ca[b]}mg・鉄${ref.fe[b]}mgが、1日の目安です。`;
    return (
      <div className="mecard mini">
        <p>
          <b>
            👤 {sexText}・{BAND_SHORT[b]}
          </b>
          <span>{line}</span>
        </p>
        <Link href="/" className="evlink">
          性別・年齢を変える（ホームの「今の食事のバランス」） ›
        </Link>
      </div>
    );
  }

  return (
    <section className="card mecard" aria-label="あなたの目安">
      <h2 className="h2" style={{ marginTop: 0 }}>
        👤 あなたの1日の目安
      </h2>
      <p className="agnote">性別と年齢を選ぶと、必要な量と、気をつけることが変わります（全ページ共通）。</p>
      <p className="meh">性別</p>
      <div className="mechips two">
        {[1, 2].map((v) => (
          <button key={v} type="button" aria-pressed={me.sex === v} className={me.sex === v ? "on" : ""} onClick={() => me.set({ sex: v as 1 | 2 })}>
            {v === 1 ? "女性" : "男性"}
          </button>
        ))}
      </div>
      <p className="meh">年齢</p>
      <div className="mechips">
        {BANDS.map((t, i) => (
          <button key={t} type="button" aria-pressed={b === i} className={b === i ? "on" : ""} onClick={() => me.set({ band: i })}>
            {t}
          </button>
        ))}
      </div>
      <p className="meh">ふだんの活動量</p>
      <div className="mechips three">
        {PAL_TEXT.map((t, i) => (
          <button key={t} type="button" aria-pressed={me.pal === i} className={me.pal === i ? "on" : ""} onClick={() => me.set({ pal: i })}>
            {t}
          </button>
        ))}
      </div>

      <ul className="mereflist">
        <li>
          <span>エネルギー</span>
          <b>約{ref.kcal[b][me.pal].toLocaleString()}kcal</b>
        </li>
        <li>
          <span>たんぱく質</span>
          <b>{ref.protein[b]}g以上</b>
        </li>
        <li>
          <span>カルシウム</span>
          <b>{ref.ca[b]}mg</b>
        </li>
        <li>
          <span>鉄{me.sexKey === "f" && b <= 4 ? "（月経あり）" : ""}</span>
          <b>{ref.fe[b]}mg</b>
        </li>
        <li>
          <span>食物繊維</span>
          <b>{ref.fiber[b]}g以上</b>
        </li>
        <li>
          <span>食塩相当量</span>
          <b>{ref.salt[b]}g未満</b>
        </li>
        <li>
          <span>カリウム</span>
          <b>{ref.k[b].toLocaleString()}mg以上</b>
        </li>
        <li>
          <span>ビタミンD</span>
          <b>{VITD}μg</b>
        </li>
      </ul>
      <p className="agnote small">日本人の食事摂取基準（2025年版）の目安です。身体活動レベルは、{PAL_TEXT[me.pal]}の場合。</p>

      <EvidenceBox ids={["dri2025", "osteo2015"]} level="強い（国の基準）" note="性別・年齢別の目安は、食事摂取基準（2025年版）の表です。年齢ごとの注意（骨・筋肉・低栄養など）は、基準の考え方と、骨粗鬆症ガイドラインにもとづく、一般的な内容です。" />
      <div className="meage">
        <p className="balh">🌱 {info.title}</p>
        <ul>
          {info.points.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="balfocus">
          <b>この年代の重点：</b>
          {info.focus}
        </p>
      </div>
    </section>
  );
}


