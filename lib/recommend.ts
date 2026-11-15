// 体のデータ（基礎代謝・体脂肪など）が、記入できなかった時に、
// 年齢・性別・体重・持病から、5つの食事の方法の、向き不向きを出す。
// 持病・年齢の判断は、安全側（極端な方法は、すすめない）。診断・処方ではなく、主治医の指示が優先。
import type { MethodId } from "./methods";

export type Fit = "おすすめ" | "可" | "注意" | "不可";
export type Rec = { top: MethodId; fits: Record<MethodId, { fit: Fit; why: string[] }>; basis: string; accurate: boolean };
export type RecIn = { sex: "f" | "m"; age: number; band: number; weight: number; height: number; conds: string[]; goal: "diet" | "muscle" | "both"; hasBody: boolean };

const IDS: MethodId[] = ["balance", "lowfat", "lowcarb", "highpro", "keto"];
const RANK: Record<Fit, number> = { おすすめ: 3, 可: 2, 注意: 1, 不可: 0 };

export function recommend(i: RecIn): Rec {
  const fits = Object.fromEntries(IDS.map((id) => [id, { fit: "可" as Fit, why: [] as string[] }])) as Rec["fits"];
  const set = (id: MethodId, fit: Fit, why: string) => {
    // 厳しい判定（不可・注意）を、優先する。おすすめは、ほかが、なければ。
    const cur = fits[id];
    const worse = fit === "不可" || (fit === "注意" && cur.fit !== "不可") || (fit === "おすすめ" && cur.fit === "可");
    if (worse) cur.fit = fit;
    cur.why.push(why);
  };
  const youth = i.band <= 1 || (i.age > 0 && i.age < 18);
  const senior = i.band >= 5 || i.age >= 65;
  const has = (c: string) => i.conds.includes(c);
  const bmi = i.height > 0 && i.weight > 0 ? i.weight / ((i.height / 100) ** 2) : 0;

  // ケトジェニックは、どの場合も、おすすめしない（医師の管理が前提）
  set("keto", "注意", "医師の管理が前提の方法です。トレーナーだけの判断では、すすめません");

  if (youth) {
    IDS.forEach((id) => set(id, id === "balance" ? "おすすめ" : "不可", id === "balance" ? "成長期は、食事の割合を、制限せず、3食を、しっかり" : "成長期には、食事の割合を、制限する方法は、使いません"));
  } else {
    set("balance", "おすすめ", "国の目標量の範囲で、続けやすい、基本の方法です");
    if (senior) {
      set("lowcarb", "注意", "65歳以上は、食事量が減ると、筋肉・骨が落ちやすいため、主食を、減らしすぎない");
      set("highpro", "可", "たんぱく質を保つのに、向いています（腎臓の機能は、確認）");
      set("balance", "おすすめ", "65歳以上は、たんぱく質を、減らさない、バランス型が、土台です");
      set("keto", "不可", "65歳以上は、筋肉・骨が落ちやすいため、行いません");
    }
    if (has("t2d")) {
      set("balance", "おすすめ", "糖尿病の食事の配分（炭水化物40〜60%・たんぱく質20%まで・脂質20〜30%）に、近い方法です");
      set("lowcarb", "注意", "薬（インスリンなど）を使っていると、低血糖に注意。主治医の調整が必要です");
      set("highpro", "注意", "腎臓の合併症があるときは、たんぱく質の量を、主治医に確認");
      set("keto", "不可", "糖尿病の薬・1型糖尿病では、ケトアシドーシスなどの危険があり、行いません");
    }
    if (has("htn")) {
      set("balance", "おすすめ", "減塩（1日6g未満）を、しやすい方法です");
      set("keto", "不可", "持病（高血圧）があるため、行いません");
    }
    if (has("lipid")) {
      set("lowfat", "おすすめ", "脂質をエネルギーの20〜25%に、飽和脂肪酸を、7%未満にする、食事の方向と、合っています");
      set("lowcarb", "注意", "LDLコレステロールの低下が、低脂質食より、小さかった報告があります（肉の脂身・バターは、控える）");
      set("keto", "不可", "LDLコレステロールが、上がることがあるため、行いません");
    }
    if (has("thy-low") || has("thy-high")) {
      set("balance", "おすすめ", "甲状腺の病気では、極端な食事制限を、さけます");
      set("keto", "不可", "甲状腺の病気で、極端な制限は、さけます");
      set("lowcarb", "注意", "食事量が減りすぎないよう、主治医に確認");
    }
    if (has("pcos")) set("balance", "おすすめ", "PCOSでも、続けやすい基本の方法から始めます（BMI25以上は、3〜6か月で体重の5〜10%減が目標）");
    if (has("bone")) {
      set("balance", "おすすめ", "骨のために、カルシウム・ビタミンD・たんぱく質を、しっかりとれます");
      set("lowcarb", "注意", "極端な食事制限は、骨粗鬆症の危険因子です");
      set("keto", "不可", "骨が心配な人は、極端な制限を、さけます");
    }
    if (has("anemia")) {
      set("balance", "おすすめ", "鉄・たんぱく質を、減らさない、基本の方法です");
      set("lowcarb", "注意", "食事量が減ると、鉄が不足しやすい");
      set("keto", "不可", "貧血があるため、行いません");
    }
    if (i.conds.length > 0) {
      IDS.forEach((id) => {
        if (id !== "balance" && !fits[id].why.length) set(id, "可", "持病・服薬のある人は、主治医・管理栄養士に、確認してから");
      });
    }
    // 持病が、ない大人：目標・体格で、おすすめを、足す
    if (i.conds.length === 0 && !senior) {
      if (i.goal !== "diet") set("highpro", "おすすめ", "筋トレをして、筋肉をつけたい・守りたい人に、向いています（体重1kgあたり 約1.6g）");
      if (i.goal === "diet" && bmi >= 25) set("lowcarb", "可", "主食・甘いものが、多い人に、向いています（BMI25以上）");
      if (i.goal === "diet") set("lowfat", "可", "揚げ物・脂質が、多い人に、向いています");
    }
  }
  const top = IDS.slice().sort((a, b) => RANK[fits[b].fit] - RANK[fits[a].fit] || IDS.indexOf(a) - IDS.indexOf(b))[0];
  // おすすめが、複数のとき、持病・目標に、いちばん、合うものを、先に（balanceが、既定）
  const recs = IDS.filter((id) => fits[id].fit === "おすすめ");
  const pick: MethodId = recs.length > 1 && i.conds.length === 0 && i.goal !== "diet" && recs.includes("highpro") ? "highpro" : recs.length > 1 && has("lipid") && recs.includes("lowfat") ? "lowfat" : top;
  return {
    top: pick,
    fits,
    accurate: i.hasBody,
    basis: i.hasBody ? "体のデータ（基礎代謝・体脂肪など）が、あるため、カロリーは、より正確に計算しています。方法は、年齢・性別・持病も、考えて、選んでいます。" : "体のデータが、ないため、年齢・性別・体重・持病から、おすすめを、選んでいます。基礎代謝・体脂肪などを入れると、数字が、より正確になります。",
  };
}