"use client";

import { useEffect, useState } from "react";
import { amountOf } from "../lib/microLookup";
import { readMe } from "./me";

// どんな方でも、ダイエットを始められるように。「いまの状況」を選ぶと、食事・動く・注意が、短く出る。
// 根拠（kind）：国の指針／試験・レビュー／安全のための一般的な配慮／現場の工夫、を分けて書く。
type Src = { label: string; url: string };
type S = { id: string; label: string; eat: string[]; move: string[]; care: string; kind: string; src?: Src[]; senior?: boolean };

const SACKS: Src = { label: "Sacks 2009 N Engl J Med（811人・2年の試験）", url: "https://pubmed.ncbi.nlm.nih.gov/19246357/" };
const BURKE: Src = { label: "Burke 2011 J Am Diet Assoc（記録と減量・系統的レビュー）", url: "https://pubmed.ncbi.nlm.nih.gov/21185970/" };
const LOOK: Src = { label: "Look AHEAD 2013 N Engl J Med（維持の難しさ）", url: "https://pubmed.ncbi.nlm.nih.gov/23796131/" };
const STEPS: Src = { label: "Ding 2025 Lancet Public Health（1日7,000歩・メタ分析）", url: "https://pubmed.ncbi.nlm.nih.gov/40713949/" };
const FREQ: Src = { label: "Grgic 2018 Sports Med（筋トレの回数・メタ分析）", url: "https://pubmed.ncbi.nlm.nih.gov/29470825/" };
const GUIDE: Src = { label: "厚生労働省 身体活動・運動ガイド2023", url: "https://www.mhlw.go.jp/content/001195866.pdf" };

const LIST: S[] = [
  {
    id: "buy",
    label: "料理しない（外食・コンビニ）",
    eat: ["主食・主菜（肉・魚・卵・大豆）・野菜の3つが、そろう選び方にする。", "栄養成分表示の「エネルギー」と「食塩相当量」を見る。", "食べ方は、続けられるものを選ぶ。糖質を減らしても、脂質を減らしても、2年後の減量は、ほぼ同じ。"],
    move: ["1駅ぶん歩く・階段を使う、から。"],
    care: "夜の食事だけ、写真で残す（記録は、減量と関連。ただし根拠は弱い）。",
    kind: "試験・レビュー",
    src: [SACKS, BURKE],
  },
  {
    id: "busy",
    label: "運動が苦手・時間がない",
    eat: ["運動より、まず食事（量と内容）を整える。"],
    move: ["いまより、1日+10分、歩く。国の目安は、成人で1日60分（約8,000歩）。1日7,000歩でも、健康の効果が大きい（2025年のメタ分析）。", "筋トレは、スクワット・壁腕立てなどの自重で、週1回から、よい。1週間の総量が同じなら、回数による筋力の差は、見られなかった（国の目安は、週2〜3日）。"],
    care: "全部やろうとせず、1つだけ、続ける。",
    kind: "国の指針・メタ分析",
    src: [GUIDE, STEPS, FREQ],
  },
  {
    id: "senior",
    label: "65歳以上",
    eat: ["急に食事を減らさない。やせすぎは、筋肉・骨が落ちやすい。", "たんぱく質を、減らさない（毎食に、肉・魚・卵・大豆・乳製品）。"],
    move: ["歩行など1日40分以上（約6,000歩以上）が国の目安。", "筋トレを含む運動を、週2〜3日。"],
    care: "減量が必要か、主治医に相談してから。",
    kind: "国の指針",
    src: [GUIDE],
    senior: true,
  },
  {
    id: "youth",
    label: "中学生・高校生",
    eat: ["大人の減量の計算は、使わない。食事を減らさず、3食を、しっかり。", "お菓子・甘い飲み物の回数を、決める。"],
    move: ["こどもの目安は、中強度以上の運動を、1日60分以上。"],
    care: "体重を減らしたいときは、保護者と、医師・学校の先生に相談。",
    kind: "国の指針",
    src: [GUIDE],
  },
  {
    id: "preg",
    label: "妊娠中・授乳中",
    eat: ["減量は、しない。食事は、主治医・助産師の指示で。"],
    move: ["運動は、主治医に確認してから。"],
    care: "ダイエット目的の食事制限は、しない。",
    kind: "安全のための配慮",
  },
  {
    id: "pain",
    label: "ひざ・腰が痛い",
    eat: ["食事で、ゆっくり（月1kgまで）減らす。体重が減ると、関節の負担も減る。"],
    move: ["痛くない運動を選ぶ：座ってできる筋トレ・自転車・水中歩行など。", "痛みが強いとき・しびれがあるときは、先に医師へ。"],
    care: "痛みを我慢して、動かない。",
    kind: "安全のための配慮",
  },
  {
    id: "shift",
    label: "夜勤・不規則な生活",
    eat: ["食事の時間より、1日の合計（量と内容）を整える。", "夜勤中は、食べすぎやすい。あらかじめ、量を決めて持っていく。"],
    move: ["歩く時間を、勤務の前後に、10分。"],
    care: "睡眠は、6時間以上が国の目安。眠れていないと、食欲が乱れやすい。",
    kind: "国の指針（睡眠）",
  },
  {
    id: "cheap",
    label: "食費をおさえたい",
    eat: ["たんぱく質は、卵・納豆・豆腐・鶏むね・サバ缶・ツナ缶で。", "野菜は、冷凍野菜・カット野菜・もやしでも、よい。"],
    move: ["お金のかからない、ウォーキングから。"],
    care: "安い菓子パン・ジュースで、おなかを満たさない。",
    kind: "現場の工夫",
  },
  {
    id: "veg",
    label: "ベジタリアン・食物アレルギー",
    eat: ["たんぱく質は、大豆・豆・卵・乳製品で、毎食に。", "ビタミンB12は、植物性食品に、ほとんど含まれない。完全菜食では、医師・栄養士に相談。", "アレルギーのある食品は、必ず、医師の指示で。"],
    move: ["ふつうの運動で、よい。"],
    care: "鉄・B12は、検査で、不足を確かめる。",
    kind: "一般的な栄養学",
  },
  {
    id: "regain",
    label: "何度も、リバウンドした",
    eat: ["戻るのは、よくあること。責めない。", "一度に大きく減らさず、ゆっくり（月1kgまで）。", "週に1回、体重の平均を、確認する。"],
    move: ["続けられる運動を、1つだけ。"],
    care: "試験では、減量は1年目に大きく、その後、小さくなった。維持には、記録と、定期的な確認が役立つ。",
    kind: "試験・レビュー",
    src: [LOOK, BURKE],
  },
  {
    id: "binge",
    label: "食べすぎが止まらない・制限がつらい",
    eat: ["厳しい制限は、やめる。3食を、決まった時間に。", "食べたくなったら、先に、水・お茶・少し時間を置く。"],
    move: ["運動で、食べた分を取り返そうとしない。"],
    care: "むちゃ食いを繰り返す・吐く・下剤を使う、などがあるときは、摂食障害の可能性があります。ダイエットより先に、医療機関へ。",
    kind: "安全のための配慮",
  },
  {
    id: "alc",
    label: "お酒が好き",
    eat: ["飲む量・回数を決める。ビール中びん1本（500ml）で、アルコール約20g。", "おつまみは、揚げ物より、刺身・冷奴・枝豆・野菜。"],
    move: ["飲んだ日の翌日に、10分、歩く。"],
    care: "肝臓の病気・薬を飲んでいる人は、主治医に確認。",
    kind: "現場の工夫",
  },
];

export default function DietForAnyone() {
  const [open, setOpen] = useState("");
  const [sex, setSex] = useState<"f" | "m">("f");
  const [band, setBand] = useState(3);
  useEffect(() => {
    const m = readMe();
    setSex(m.sex === 2 ? "m" : "f");
    setBand(m.band);
  }, []);
  const s = LIST.find((x) => x.id === open);
  return (
    <div className="anyone">
      <p className="agnote">当てはまるものを選ぶと、始め方が、短く出ます。どれも、診断や治療ではありません。</p>
      <div className="trchips" role="group" aria-label="いまの状況">
        {LIST.map((x) => (
          <button key={x.id} type="button" aria-pressed={open === x.id} className={open === x.id ? "trchip on" : "trchip"} onClick={() => setOpen(open === x.id ? "" : x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      {s && (
        <div className="ncbox">
          <div className="trs">
            <small>食事</small>
            <ol>
              {s.eat.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            {s.senior && <p className="ncme">あなたの、たんぱく質の目安：{amountOf("たんぱく質", sex, Math.max(band, 5))}</p>}
          </div>
          <div className="trs">
            <small>動く</small>
            <ol>
              {s.move.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <p className="tre">
            <small>注意</small>
            {s.care}
          </p>
          <p className="agnote small">根拠の種類：{s.kind}</p>
          {s.src && (
            <p className="trsrc">
              <small>出典</small>
              {s.src.map((x) => (
                <a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer">
                  {x.label}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}