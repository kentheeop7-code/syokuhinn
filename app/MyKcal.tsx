"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const KCAL_TYPES = {
  balance: { label: "バランス型", p: 0.2, f: 0.25, c: 0.55, desc: "厚生労働省の目標量の範囲に収まる、ふつうの配分です。" },
  protein: { label: "高たんぱく型", p: 0.28, f: 0.25, c: 0.47, desc: "筋トレ・ダイエット中に。たんぱく質を多めに、炭水化物をやや少なめに。" },
  lowfat: { label: "低脂質型", p: 0.25, f: 0.2, c: 0.55, desc: "脂質をおさえて、減量しやすく。脂質はエネルギーの20%（目標量の下限）です。" },
  lowcarb: { label: "低糖質型", p: 0.28, f: 0.35, c: 0.37, desc: "ごはん・パンを減らす食べ方。極端な糖質制限ではありません。" },
} as const;
export type KcalType = keyof typeof KCAL_TYPES;

type Props = { topic: "nutrients" | "tips" | "gut" | "women" | "additives" };

// どのページでも、トップで決めた「1日のカロリー」と、PFCの目安を見られるカード
export default function MyKcal({ topic }: Props) {
  const [s, setS] = useState<{ kcal: number; type: KcalType; p?: number; f?: number; c?: number; label?: string } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("lg-kcal") || "null");
      const k = parseFloat(v?.kcal);
      if (k >= 800 && k <= 4000) setS({ kcal: Math.round(k), type: v.type in KCAL_TYPES ? v.type : "balance", p: v.p, f: v.f, c: v.c, label: v.label });
    } catch {}
    setReady(true);
  }, []);
  if (!ready) return null;

  if (!s)
    return (
      <Link href="/?tab=plan#r-kcal" className="gutlink mykcal">
        <span aria-hidden>🔥</span>
        <span>
          <b>1日のカロリーを決める</b>
          <small>決めると、このページにも、あなたの数字が出ます</small>
        </span>
        <i aria-hidden>›</i>
      </Link>
    );

  const t = KCAL_TYPES[s.type];
  const p = s.p ?? Math.round((s.kcal * t.p) / 4);
  const f = s.f ?? Math.round((s.kcal * t.f) / 9);
  const c = s.c ?? Math.round((s.kcal * t.c) / 4);
  const fiber = Math.max(18, Math.round((s.kcal / 1000) * 8));
  const line: Record<Props["topic"], string> = {
    nutrients: `たんぱく質${p}g・脂質${f}g・炭水化物${c}gが、あなたの1日の目安です。下の栄養素のはたらきと見くらべて、どの食品でとるかを考えましょう。`,
    tips: `たんぱく質は1食${Math.round(p / 3.5)}g前後。豆知識の「やってみよう」は、このカロリー・PFCに合わせて、量を調整してください。`,
    gut: `食物繊維は1日${fiber}g以上が目安（18g以上、または1000kcalあたり約8g）。炭水化物${c}gのうち、白米を雑穀・もち麦に変えるだけでも、増やせます。`,
    women: `月経前は、むくみ・食欲が増えやすい時期。1日${s.kcal}kcalの枠の中で、たんぱく質${p}gと、食物繊維・カリウムを意識すると、整えやすくなります。`,
    additives: `加工食品を選ぶときは、1日${s.kcal}kcalの中での、1食の量（栄養成分表示）と、食塩相当量（1日6.5g未満）を見くらべて。`,
  };

  return (
    <section className="card mykcal">
      <p className="agtitle">🔥 あなたの1日のカロリーと、PFC</p>
      <div className="agkcal">
        1日 <b>{s.kcal}</b> kcal　<small>{s.label ?? t.label}</small>
      </div>
      <div className="pfc">
        <div>
          <i className="dot p" />P <b>{p}</b>g
        </div>
        <div>
          <i className="dot f" />F <b>{f}</b>g
        </div>
        <div>
          <i className="dot c" />C <b>{c}</b>g
        </div>
      </div>
      <p className="agnote">{line[topic]}</p>
      <Link href="/?tab=plan#r-kcal" className="evlink">
        カロリーを変える・食事例を見る ›
      </Link>
    </section>
  );
}

