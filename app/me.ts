"use client";

import { useEffect, useState } from "react";

// 性別・年齢・活動量は、すべてのページで共通（「今の食事のバランス」と同じ場所に保存）。
export const BANDS = ["中学生（12〜14歳）", "高校生（15〜17歳）", "18〜29歳", "30〜49歳", "50〜64歳", "65〜74歳", "75歳以上"];
export const BAND_SHORT = ["12〜14歳", "15〜17歳", "18〜29歳", "30〜49歳", "50〜64歳", "65〜74歳", "75歳以上"];
export const PAL_TEXT = ["低い", "ふつう", "高い"];

// 性別・年齢ごとの目安（日本人の食事摂取基準 2025年版）
export const REF = {
  f: {
    kcal: [[2150, 2400, 2700], [2050, 2300, 2550], [1700, 1950, 2250], [1750, 2050, 2350], [1700, 1950, 2250], [1650, 1850, 2050], [1450, 1750, 1750]],
    protein: [55, 55, 50, 50, 50, 50, 50],
    ca: [800, 650, 650, 650, 650, 650, 600],
    fe: [12.5, 11, 10, 10.5, 10.5, 6, 5.5], // 月経がある人（65歳以上は月経なし）
    fiber: [16, 18, 18, 18, 18, 18, 17],
    salt: [6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5],
    k: [2400, 2600, 2600, 2600, 2600, 2600, 2600],
  },
  m: {
    kcal: [[2300, 2600, 2900], [2500, 2850, 3150], [2250, 2600, 3000], [2350, 2750, 3150], [2250, 2650, 3000], [2100, 2350, 2650], [1850, 2250, 2250]],
    protein: [60, 65, 65, 65, 65, 60, 60],
    ca: [1000, 800, 800, 750, 750, 750, 750],
    fe: [9, 9, 7, 7.5, 7, 7, 6.5],
    fiber: [17, 19, 20, 22, 22, 21, 20],
    salt: [7, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5],
    k: [2600, 3000, 3000, 3000, 3000, 3000, 3000],
  },
};
export const P_LO = [13, 13, 13, 13, 14, 15, 15];
export const VITD = 9.0; // μg（目安量・12歳以上）

export type Me = { sex: 1 | 2; band: number; pal: number };
export const DEFAULT_ME: Me = { sex: 1, band: 3, pal: 1 };

export function readMe(): Me {
  try {
    const s = JSON.parse(localStorage.getItem("lg-bal2") || "null");
    if (s) {
      return {
        sex: s.sex === 2 ? 2 : 1,
        band: Math.min(6, Math.max(0, typeof s.band === "number" ? s.band : 3)),
        pal: Math.min(2, Math.max(0, typeof s.pal === "number" ? s.pal : 1)),
      };
    }
  } catch {}
  return DEFAULT_ME;
}

export function writeMe(patch: Partial<Me>) {
  try {
    const s = JSON.parse(localStorage.getItem("lg-bal2") || "null") || {};
    localStorage.setItem("lg-bal2", JSON.stringify({ ...s, ...patch }));
    window.dispatchEvent(new Event("lg-me-change"));
  } catch {}
}

export function hasMe(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("lg-bal2") || "null");
    return !!s && typeof s.band === "number";
  } catch {
    return false;
  }
}

// ページを開いた後に、保存された性別・年齢を読む。変えたら、ほかの場所にも反映される。
export function useMe(): Me & { ready: boolean; sexKey: "f" | "m"; isYouth: boolean; set: (p: Partial<Me>) => void } {
  const [me, setMe] = useState<Me>(DEFAULT_ME);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setMe(readMe());
    read();
    setReady(true);
    window.addEventListener("lg-me-change", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("lg-me-change", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return { ...me, ready, sexKey: me.sex === 2 ? "m" : "f", isYouth: me.band <= 1, set: writeMe };
}

// 年齢による、からだと食事への影響（一般的な内容）
export const AGE_INFO: { title: string; points: string[]; focus: string }[] = [
  {
    title: "中学生：からだが大きく育つ時期",
    points: ["骨が、いちばん育つ時期。カルシウムが、一生のうちで最も必要です（男子1,000mg・女子800mg）。", "女子は、月経が始まると、鉄が不足しやすくなります（1日12.5mg）。", "エネルギーが足りないと、身長・骨・月経に影響が出ます。ダイエットは、おすすめしません。", "朝ごはん・牛乳・魚・肉・卵・野菜を、毎日。部活動の日は、主食もしっかり。"],
    focus: "カルシウム・鉄・朝ごはん",
  },
  {
    title: "高校生：骨をつくる、最後の大切な時期",
    points: ["骨量は、20歳ごろまでにほぼ決まります。カルシウム・たんぱく質・運動が大切です。", "女子は、鉄（11mg）が不足しがち。やせたい気持ちから、食事を減らしすぎないように。", "夜更かし・夜食・甘い飲み物・カップ麺が増えやすい年ごろです。", "不安や悩みがあるときは、保護者・学校の先生・医師に、相談を。"],
    focus: "カルシウム・鉄・食べすぎ飲みすぎ",
  },
  {
    title: "18〜29歳：骨量のピークを保つ時期",
    points: ["骨量が最大になる年代。ここで蓄えた骨が、将来の骨粗鬆症予防になります。", "女性は、やせすぎ（BMI18.5未満）が、月経・骨・妊娠に影響します。", "外食・飲酒・夜型の生活で、食事が乱れやすい時期。朝食を抜かないように。"],
    focus: "たんぱく質・鉄・朝ごはん",
  },
  {
    title: "30〜49歳：代謝が下がりはじめる時期",
    points: ["基礎代謝が、少しずつ下がり、同じ食事で太りやすくなります。", "女性は、月経・妊娠・出産で、鉄・葉酸・カルシウムが大切です。", "仕事・育児で忙しく、食事が偏りがち。食塩・脂質・お酒が増えていないか確認を。"],
    focus: "野菜・食塩・たんぱく質",
  },
  {
    title: "50〜64歳：からだの変わり目",
    points: ["筋肉が減りはじめ、内臓脂肪がつきやすくなります。血圧・血糖・コレステロールも気になる時期。", "女性は、更年期で骨密度が下がりやすくなります。カルシウム・ビタミンD・運動を。", "たんぱく質は、エネルギーの14〜20%を目安に、毎食とりましょう。"],
    focus: "カルシウム・たんぱく質・食塩",
  },
  {
    title: "65〜74歳：筋肉と骨を、守る時期",
    points: ["筋肉が減る「サルコペニア」や、弱りやすい状態「フレイル」を防ぐことが大切です。", "やせすぎ（低栄養）に注意。たんぱく質は、エネルギーの15〜20%を目安に、毎食しっかり。", "食べる量が減っていないか、体重が減っていないか、確認を。水分も、こまめに。"],
    focus: "たんぱく質・食べる量・水分",
  },
  {
    title: "75歳以上：しっかり食べて、弱らない",
    points: ["食が細くなり、低栄養になりやすい時期。減塩より、「しっかり食べる」ことを優先してください。", "少量でも栄養が多いもの（卵・乳製品・魚・豆腐）を、1日3食と間食に。", "噛みにくい・飲み込みにくいときは、やわらかく調理を。体重が減ってきたら、早めに相談を。"],
    focus: "低栄養の予防・水分・たんぱく質",
  },
];
