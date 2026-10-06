"use client";

import { useEffect, useState } from "react";

type Stage = "u40" | "s40" | "s50" | "s60";
type Block = { title: string; items: string[] };
type StageInfo = { key: Stage; tab: string; head: string; lead: string; blocks: Block[] };

const STAGES: StageInfo[] = [
  {
    key: "u40",
    tab: "20〜30代",
    head: "20〜30代：骨の貯金をためる、最後のチャンス",
    lead: "ホルモンは安定していて、月経の周期で体調が変わります。この時期に、骨と筋肉の土台をつくっておくことが、40代以降を大きく左右します。",
    blocks: [
      {
        title: "からだに起きていること",
        items: [
          "骨量は20歳前後でピークになり、40代ごろまで保たれます。無理な食事制限は、将来の骨粗鬆症のもとになります。",
          "月経の周期にあわせて、むくみ・食欲・便秘・眠気が変わります。体重は同じ時期どうしで比べましょう。",
          "月経で鉄が失われるため、貧血や、隠れ鉄不足になりやすい世代です。",
        ],
      },
      {
        title: "食事のポイント",
        items: [
          "カルシウムは1日650mg（食事摂取基準・推奨量）。牛乳・ヨーグルト・チーズ・小松菜・豆腐を毎日。",
          "鉄は月経のある人で、1日10.0〜10.5mg。赤身肉・レバー・カツオ・あさりを週に数回。ビタミンCをいっしょに。",
          "ダイエットでも、月経が止まるほどの減らし方はNG。BMIは18.5以上を保ちます。",
          "妊娠を考えている人は、葉酸（食事に加えて、サプリで1日400μg）を、妊娠の1か月以上前から。",
        ],
      },
      {
        title: "運動",
        items: ["筋トレ（週2〜3回）に、ウォーキングやジョギングなど、骨に刺激のある運動を。"],
      },
      {
        title: "検診・受診の目安",
        items: [
          "子宮頸がん検診：20歳以上で2年に1回。",
          "月経が3か月以上こない、ひどい月経痛、経血量が極端に多い・少ないときは、婦人科へ。",
        ],
      },
    ],
  },
  {
    key: "s40",
    tab: "40代",
    head: "40代：プレ更年期。代謝と骨の変化が始まる",
    lead: "月経の周期や量が変わり始め、基礎代謝が下がります。「食べる量は同じなのに、太る」のは、気のせいではありません。",
    blocks: [
      {
        title: "からだに起きていること",
        items: [
          "女性ホルモン（エストロゲン）が、ゆらぎながら減り始めます。月経の周期が短くなったり、乱れたり、量が変わったりします。",
          "基礎代謝が下がり、おなかまわりに脂肪（内臓脂肪）がつきやすくなります。",
          "眠りが浅い、イライラ、疲れが抜けない、といった不調が、ホルモンのゆらぎで出ることがあります。",
          "筋肉が少しずつ減り始めます。",
        ],
      },
      {
        title: "食事のポイント",
        items: [
          "たんぱく質は、体重1kgあたり1.2〜1.6g。毎食、手のひら1枚分の肉・魚・卵・大豆を。",
          "カルシウム1日650〜800mg、ビタミンD、ビタミンK（納豆・小松菜）を、毎日。",
          "鉄は、月経のある人は10.5mg。月経の量が多い人は、貧血に注意。",
          "塩分は控えめに（血圧が上がりやすくなります）。揚げ物・洋菓子・お酒は量を決めて。",
          "減量は、1か月に体重の約3%まで。食事を極端に減らすと、筋肉と骨が先に減ります。",
        ],
      },
      {
        title: "運動",
        items: [
          "筋トレを週2〜3回（スクワット・ヒップリフト・背中の運動）。ここで筋肉を保つのが、いちばんの更年期対策です。",
          "ウォーキングや階段など、荷重運動を、毎日20分以上。",
        ],
      },
      {
        title: "検診・受診の目安",
        items: [
          "乳がん検診：40歳以上で2年に1回。",
          "骨粗鬆症検診：40歳・45歳（自治体で対象年齢が違います）。",
          "健診で、血圧・LDLコレステロール・中性脂肪・血糖を、毎年確認。",
        ],
      },
    ],
  },
  {
    key: "s50",
    tab: "50代",
    head: "50代：更年期〜閉経。骨とコレステロールが大きく動く",
    lead: "閉経の平均は約50.5歳。閉経後5〜10年は、骨量が特に速く減り、LDLコレステロールも上がりやすくなります。",
    blocks: [
      {
        title: "からだに起きていること",
        items: [
          "ほてり・発汗・動悸、眠りの浅さ、気分の落ち込み、関節や肩の痛み、など、更年期の症状が出やすい時期（個人差が大きい）。",
          "骨量が速く減ります。骨粗鬆症は、50代で約9人に1人、といわれます。",
          "LDL（悪玉）コレステロール、中性脂肪、血圧が上がりやすく、内臓脂肪もつきやすくなります。",
          "月経が不規則になり、やがて止まります。閉経後は、鉄の必要量は下がります。",
        ],
      },
      {
        title: "食事のポイント",
        items: [
          "カルシウムは1日700〜800mgを目標に。ビタミンD（10〜20μg）、ビタミンK（250〜300μg）もそろえます。",
          "たんぱく質は、体重1kgあたり1.2〜1.5g。毎食20〜30gを。",
          "大豆食品（豆腐・納豆・みそ・豆乳）を毎日。サプリでの上乗せは、1日30mgまで。",
          "コレステロールが高めなら、揚げ物・バター・脂身を減らし、魚・大豆・野菜・きのこ・海藻を増やす。",
          "塩分は1日6.5g未満（女性の目標量）を目安に。カフェインとお酒のとりすぎにも注意。",
          "減量は、1か月に体重の約2〜3%まで。",
        ],
      },
      {
        title: "運動",
        items: [
          "筋トレを週2〜3回に、荷重運動（早歩き・階段）を毎日。バランス運動（片足立ち）も。",
          "更年期の不調は、体を動かす習慣で、軽くなる人も多いとされます。",
        ],
      },
      {
        title: "検診・受診の目安",
        items: [
          "骨粗鬆症検診：50歳・55歳。乳がん検診：2年に1回。",
          "ほてり・眠れない・気分の落ち込みなど、生活がつらいときは、婦人科へ（薬やホルモン補充、漢方など、治療の選択肢があります）。",
          "不正出血があったときは、すぐ婦人科へ。",
        ],
      },
    ],
  },
  {
    key: "s60",
    tab: "60代以降",
    head: "60代以降：筋肉・骨を守る、ゆっくりダイエット",
    lead: "骨と筋肉の減少が続き、転倒・骨折がいちばんのリスクになります。やせすぎも、太りすぎも、避けたい年代です。",
    blocks: [
      {
        title: "からだに起きていること",
        items: [
          "骨量の減少が続き、骨粗鬆症は、60代で約3人に1人、70代で約2人に1人といわれます。",
          "筋肉が減るサルコペニアが進みやすく、食欲が落ちて、低栄養になる人もいます。",
          "骨盤底筋がゆるみ、尿もれが気になる人が増えます。",
        ],
      },
      {
        title: "食事のポイント",
        items: [
          "たんぱく質は、体重1kgあたり1.0〜1.3gを、毎食に分けて（腎臓の病気がある人は、医師の指示に従ってください）。",
          "カルシウム・ビタミンD・ビタミンKを毎日。魚・きのこ・乳製品・納豆・緑黄色野菜を、いろいろと。",
          "目標のBMIは、65歳以上で21.5〜24.9。BMIが低いほどよいわけではありません。",
          "減量するなら、1か月に体重の約1〜2%まで。筋トレとセットで。",
        ],
      },
      {
        title: "運動",
        items: [
          "筋トレ（椅子からの立ち座り、かかとの上げ下げ、スクワット）週2回以上に、ウォーキング。",
          "バランス運動（片足立ち1分×左右）で、転倒を予防。骨粗鬆症と診断されている人は、運動内容を医師に確認を。",
        ],
      },
      {
        title: "検診・受診の目安",
        items: [
          "骨粗鬆症検診：60歳・65歳・70歳。骨密度が低いときは、薬の治療もあります。",
          "身長が2cm以上縮んだ、背中が丸くなった、軽い転倒で骨折した、といったときは、整形外科へ。",
        ],
      },
    ],
  },
];

// 骨粗鬆症の危険因子のチェック（目安。診断ではありません）
const CHECKS = [
  "閉経している（または、月経が1年以上ない）",
  "若いころに、無理なダイエットや、月経が止まる食事制限をしたことがある",
  "BMIが18.5未満（やせ型）",
  "親に、太ももの付け根などの骨折歴がある",
  "牛乳・乳製品・小魚・大豆製品を、あまり食べない",
  "日光を浴びる機会が少ない（日傘・日焼け止め・屋内中心）",
  "運動する習慣がない（週に2回未満）",
  "喫煙している、または、お酒を毎日飲む",
  "ステロイド薬を、長く使っている",
  "身長が、若いころより2cm以上縮んだ",
];

const CYCLE = [
  {
    name: "月経期（1〜5日目ごろ）",
    body: "経血で鉄が失われ、だるさ・冷え・腹痛が出やすい時期。",
    eat: "赤身肉・レバー・あさり・小松菜で鉄を。体を冷やす飲み物は控えめに。無理な運動は避けて。",
  },
  {
    name: "卵胞期（月経後〜排卵前）",
    body: "体調が安定し、気分も上向きやすい時期。",
    eat: "運動や食事の見直しに、取り組みやすい時期。体重は、この時期のものを基準にすると比べやすい。",
  },
  {
    name: "排卵期",
    body: "体温がやや上がり、下腹部に違和感が出る人も。",
    eat: "水分をしっかりとって、食物繊維で腸を整えます。",
  },
  {
    name: "黄体期（排卵後〜月経前）",
    body: "むくみ・便秘・眠気・食欲の増加が出やすく、体重が1〜2kg増える人も（多くは水分）。",
    eat: "塩分ひかえめ、食物繊維、カリウム（野菜・果物）を。甘いものは、量を決めて楽しんで。体重の増加に、あわてないで。",
  },
];

export default function WomenGuide() {
  const [stage, setStage] = useState<Stage>("s40");
  const [sex, setSex] = useState<"m" | "f" | null>(null);
  const [age, setAge] = useState(0);
  const [picked, setPicked] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));

  useEffect(() => {
    const read = () => {
      try {
        const p = JSON.parse(localStorage.getItem("lg-profile") || "null");
        const a = parseFloat(p?.age) || 0;
        setSex(p?.sex === "f" || p?.sex === "m" ? p.sex : null);
        setAge(a);
      } catch {}
    };
    read();
    window.addEventListener("lg-profile-change", read);
    return () => window.removeEventListener("lg-profile-change", read);
  }, []);

  // 年齢が分かっていて、まだ自分で選んでいないときは、その年代を自動で開く
  useEffect(() => {
    if (picked || !(age >= 18)) return;
    setStage(age < 40 ? "u40" : age < 50 ? "s40" : age < 60 ? "s50" : "s60");
  }, [age, picked]);

  const cur = STAGES.find((s) => s.key === stage) ?? STAGES[1];
  const n = checks.filter(Boolean).length;
  const level =
    n <= 1
      ? { cls: "ok", text: "今のところ、リスク要因は少なめです。今の生活（カルシウム・運動）を続けましょう。" }
      : n <= 3
      ? { cls: "mid", text: "いくつか当てはまります。食事・運動を見直して、自治体の骨粗鬆症検診や、健診で骨密度を確認しましょう。" }
      : { cls: "hi", text: "当てはまる項目が多めです。一度、整形外科や婦人科で、骨密度の検査を受けることをおすすめします。" };

  return (
    <section className="card wguide" aria-label="女性のからだと食事の年代別ガイド">
      <h2 className="h2">👩 女性のからだと食事：年代別ガイド</h2>
      <p className="wgnote">
        女性は、月経・妊娠・閉経と、ホルモンが大きく変わります。年代ごとの「からだの変化」と「食事・運動・検診」を、まとめました。
        {sex === "m" && "（性別が「男性」になっています。女性向けの内容ですが、参考にもなります）"}
      </p>

      <div className="wgtabs" role="tablist" aria-label="年代">
        {STAGES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={stage === s.key}
            className={stage === s.key ? "on" : ""}
            onClick={() => {
              setStage(s.key);
              setPicked(true);
            }}
          >
            {s.tab}
          </button>
        ))}
      </div>

      <div className="wgpanel">
        <h3>{cur.head}</h3>
        <p className="wglead">{cur.lead}</p>
        {cur.blocks.map((b) => (
          <div key={b.title} className="wgblock">
            <b>{b.title}</b>
            <ul>
              {b.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="wgcheck">
        <h3>🦴 骨粗鬆症のリスクチェック</h3>
        <p className="wgnote">当てはまるものにチェックしてください（目安です。診断ではありません）。</p>
        <ul>
          {CHECKS.map((c, i) => (
            <li key={c}>
              <label>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => setChecks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))}
                />
                <span>{c}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className={`wgresult ${level.cls}`}>
          <b>{n}個</b> 当てはまっています。{level.text}
        </p>
      </div>

      <div className="wgcycle">
        <h3>🌙 月経周期と、体・食べ方のリズム</h3>
        <p className="wgnote">周期には個人差があります。ご自分のリズムに合わせて、目安にしてください。</p>
        {CYCLE.map((c) => (
          <details key={c.name}>
            <summary>{c.name}</summary>
            <p>
              <b>からだ</b>
              {c.body}
            </p>
            <p>
              <b>食べ方</b>
              {c.eat}
            </p>
          </details>
        ))}
      </div>

      <p className="wgnote small">
        ※ 一般的な情報で、診断や治療ではありません。持病や服薬のある人、妊娠中・授乳中の人は、医師に相談してください。出典：
        <a href="https://www.jsog.or.jp/citizen/5717/" target="_blank" rel="noopener noreferrer">
          日本産科婦人科学会
        </a>
        ／
        <a href="https://www.jpof.or.jp/osteoporosis/faq/faqabout.html" target="_blank" rel="noopener noreferrer">
          日本骨粗鬆症学会
        </a>
        ／
        <a
          href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/syokuji_kijyun.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          日本人の食事摂取基準（2025年版）
        </a>
      </p>
    </section>
  );
}
