import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "栄養素のはたらき | PFC",
  description: "PFC・ビタミン・ミネラル・塩分のはたらきをかんたんに解説",
};

type Item = {
  name: string;
  tag: string;
  role: string;
  foods: string;
  lack?: string;
  over?: string;
  target: string;
};

const ITEMS: Item[] = [
  {
    name: "たんぱく質（P）",
    tag: "からだをつくる",
    role: "筋肉・肌・髪・内臓・ホルモンの材料になります。",
    foods: "肉、魚、卵、大豆製品、乳製品",
    lack: "筋肉が落ちる、疲れやすい、肌や髪が弱る",
    over: "腎臓に負担がかかることがあります",
    target: "運動する人は体重1kgあたり1.2〜2.0gが目安",
  },
  {
    name: "脂質（F）",
    tag: "エネルギー・ホルモン",
    role: "エネルギー源になり、ホルモンや細胞膜の材料です。ビタミンA・D・E・Kの吸収も助けます。",
    foods: "油、バター、ナッツ、アボカド、青魚",
    lack: "肌荒れ、ホルモンバランスの乱れ",
    over: "体脂肪が増えやすくなります",
    target: "1日の総エネルギーの20〜30%が目安",
  },
  {
    name: "炭水化物（C）",
    tag: "主なエネルギー源",
    role: "脳と体を動かす一番のエネルギー源。運動前後の補給に大切です。",
    foods: "ごはん、パン、麺、いも、果物",
    lack: "力が出ない、集中力が落ちる",
    over: "余った分は脂肪として蓄えられます",
    target: "1日の総エネルギーの50〜65%が目安",
  },
  {
    name: "食物繊維",
    tag: "おなかの調子",
    role: "腸内環境を整え、お通じを助けます。血糖値の急上昇やコレステロールの吸収をゆるやかにします。",
    foods: "大麦・もち麦、玄米、きのこ、海藻、豆、野菜",
    lack: "便秘、血糖値が上がりやすい",
    over: "急に増やすとおなかが張ることがあります",
    target: "男性21g以上、女性18g以上が目標",
  },
  {
    name: "ビタミンA",
    tag: "目・皮ふ・のど",
    role: "目の働き、皮ふや粘膜の健康、免疫を支えます。",
    foods: "レバー、にんじん、ほうれん草、かぼちゃ、卵",
    lack: "暗いところで見えにくい、肌や粘膜の乾燥",
    over: "脂にとけて体にたまります。レバーやサプリのとりすぎに注意（頭痛など）",
    target: "650〜850μg／上限の目安 2,700μg",
  },
  {
    name: "ビタミンB1",
    tag: "疲労回復",
    role: "糖質をエネルギーに変える手伝いをします。ごはんや麺など糖質が多い人ほど大切です。",
    foods: "豚肉、玄米、大麦、大豆、うなぎ",
    lack: "疲れやすい、だるい、食欲がない",
    over: "水にとけるので、通常の食事なら心配は少ないです",
    target: "男性1.4mg、女性1.1mg",
  },
  {
    name: "ビタミンC",
    tag: "肌・免疫・抗酸化",
    role: "コラーゲンの材料づくり、抗酸化、鉄の吸収を助けます。",
    foods: "ピーマン、ブロッコリー、いちご、キウイ、柑橘",
    lack: "肌荒れ、風邪をひきやすい",
    over: "水にとけて排出されやすく、食事ではほぼ心配ありません",
    target: "100mg（加熱や水にさらすと減ります）",
  },
  {
    name: "カルシウム",
    tag: "骨・歯・筋肉",
    role: "骨と歯をつくり、筋肉の収縮や神経の働きにも関わります。",
    foods: "牛乳、ヨーグルト、チーズ、小魚、豆腐、小松菜",
    lack: "骨がもろくなる、イライラ、けいれん",
    over: "サプリなどでとりすぎると、結石や鉄・亜鉛の吸収低下の原因に",
    target: "650〜800mg／上限の目安 2,500mg",
  },
  {
    name: "鉄",
    tag: "血液・酸素を運ぶ",
    role: "血液中で酸素を運ぶ材料です。運動する人や女性は不足しがちです。",
    foods: "レバー、赤身の肉、カツオ、あさり、ほうれん草、大豆",
    lack: "貧血、息切れ、疲れやすい、集中力の低下",
    over: "サプリでのとりすぎは、胃腸の不調や臓器への負担に",
    target: "男性7.5mg、女性10.5mg（月経あり）／上限の目安 40mg前後",
  },
  {
    name: "カリウム",
    tag: "むくみ・血圧",
    role: "余分な塩分（ナトリウム）を外に出し、むくみや血圧を整えます。筋肉の動きにも必要です。",
    foods: "野菜、いも、バナナ、アボカド、納豆",
    lack: "むくみ、筋肉のけいれん、血圧が上がりやすい",
    over: "腎臓の病気がある人は、医師の指示に従ってください",
    target: "男性3,000mg、女性2,600mg以上が目標",
  },
  {
    name: "塩分（食塩相当量）",
    tag: "とりすぎ注意",
    role: "体の水分バランスや神経・筋肉の働きに必要ですが、現代の食事ではとりすぎになりがちです。",
    foods: "みそ、しょうゆ、加工肉、練り物、パン、麺、漬物",
    over: "血圧が上がる、むくみ、腎臓への負担",
    target: "男性7.5g未満、女性6.5g未満が目標（アプリでは7.5gを超えると赤く警告）",
  },
];

export default function Nutrients() {
  return (
    <main className="container">
      <header className="brandbar">
        <span className="brand">LIFEGYM</span>
        <Link href="/" className="guidebtn">
          ‹ 記録に戻る
        </Link>
      </header>
      <h1 className="title sm">栄養素のはたらき</h1>
      <p className="member">それぞれの役割と、とりすぎ・足りないときの目安</p>

      <ul className="nlist">
        {ITEMS.map((x) => (
          <li key={x.name} className="card ncard">
            <div className="nhead">
              <h2>{x.name}</h2>
              <span className="ntag">{x.tag}</span>
            </div>
            <p className="nrole">{x.role}</p>
            <dl className="ndl">
              <dt>多い食品</dt>
              <dd>{x.foods}</dd>
              {x.lack && (
                <>
                  <dt>足りないと</dt>
                  <dd>{x.lack}</dd>
                </>
              )}
              {x.over && (
                <>
                  <dt className="red">とりすぎると</dt>
                  <dd>{x.over}</dd>
                </>
              )}
              <dt>1日の目安</dt>
              <dd>{x.target}</dd>
            </dl>
          </li>
        ))}
      </ul>

      <p className="note">
        ※ 一般的な成人向けの目安で、「日本人の食事摂取基準」などを参考にしています。年齢・体格・持病・妊娠中などで必要量は変わります。気になる方は医師や管理栄養士に相談してください。
      </p>
    </main>
  );
}
