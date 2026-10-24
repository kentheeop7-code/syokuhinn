// 根拠（エビデンス）の一覧。確認できたものだけを載せ、「どんな種類の根拠か」も、はっきり書く。
export type Kind = "国の基準" | "診療ガイドライン" | "国際機関" | "研究・総説" | "公的な資料" | "このアプリの計算";
export type Src = { label: string; url?: string; kind: Kind; note?: string };

const DRI_URL = "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/syokuji_kijyun.html";

export const SRC: Record<string, Src> = {
  dri2025: {
    label: "厚生労働省「日本人の食事摂取基準（2025年版）」",
    url: DRI_URL,
    kind: "国の基準",
    note: "エネルギー・たんぱく質・脂質・炭水化物・食物繊維・食塩・カルシウム・鉄・ビタミンDなどの、性別・年齢別の値。",
  },
  food8: {
    label: "文部科学省「日本食品標準成分表（八訂）増補2023年」",
    url: "https://fooddb.mext.go.jp/",
    kind: "国の基準",
    note: "食品ごとの栄養量。アプリでは、1回ぶんの量に、おおまかに換算しています。",
  },
  issn2017: {
    label: "ISSN Position Stand：Protein and exercise（2017）",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
    kind: "研究・総説",
    note: "運動する人の、たんぱく質は、体重1kgあたり1.4〜2.0gで足りる人が多い、という国際学会の見解。",
  },
  morton2018: {
    label: "Morton RW et al. Br J Sports Med 2018（メタ分析・49研究）",
    url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
    kind: "研究・総説",
    note: "筋トレ時のたんぱく質は、約1.6g/kgを超えても、筋肉の増加は、増えにくかった。",
  },
  helms2014: {
    label: "Helms ER et al. J Int Soc Sports Nutr 2014",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/",
    kind: "研究・総説",
    note: "競技者の減量期についての総説。体重の0.5〜1%／週のペースなどを提案（一般の人への当てはめは、目安です）。",
  },
  ioc2018: {
    label: "IOC Consensus Statement on RED-S（2018）",
    url: "https://bjsm.bmj.com/content/52/11/687",
    kind: "国際機関",
    note: "エネルギー不足が続くと、月経・骨などに影響が出る（低エネルギー・アベイラビリティ）。",
  },
  matador: {
    label: "Byrne NM et al. Int J Obes 2018（MATADOR試験）",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5803575",
    kind: "研究・総説",
    note: "男性・肥満者の試験。女性での方法は、確立していません。",
  },
  hall2011: {
    label: "Hall KD et al. Lancet 2011;378:826–837",
    kind: "研究・総説",
    note: "体脂肪1kg＝約7,700kcal（このアプリは、日本で一般的な7,200kcal）の単純計算は、長期では、実際の減りを多く見積もる。代謝が、体重とともに変わるため。",
  },
  obesity2022: {
    label: "日本肥満学会「肥満症診療ガイドライン2022」",
    kind: "診療ガイドライン",
    note: "肥満症の減量目標は、現在の体重の3%以上（高度肥満症は5〜10%）。",
  },
  osteo2015: {
    label: "日本骨粗鬆症学会ほか「骨粗鬆症の予防と治療ガイドライン2015年版」",
    url: "https://erdb-jp.nii.ac.jp/en/title/13611",
    kind: "診療ガイドライン",
    note: "カルシウム700〜800mg・ビタミンD 10〜20μg・ビタミンK 250〜300μg。※2025年版が公開されています。最新の値は、医師・薬剤師に確認してください。",
  },
  jsge2017: {
    label: "日本消化器病学会「慢性便秘症診療ガイドライン2017」",
    kind: "診療ガイドライン",
    note: "食物繊維・水分・規則正しい食事・運動などが勧められますが、食物繊維の効果は、人によって一定しません。",
  },
  reynolds2019: {
    label: "Reynolds A et al. Lancet 2019;393:434–445（メタ分析）",
    kind: "研究・総説",
    note: "食物繊維を多くとる人は、総死亡・2型糖尿病・大腸がんが、少ない傾向（食事摂取基準2025の根拠の1つ）。",
  },
  bristol1997: {
    label: "Lewis SJ, Heaton KW. Scand J Gastroenterol 1997;32:920–924",
    kind: "研究・総説",
    note: "便の形を7つに分けた「ブリストルスケール」の原論文。",
  },
  ods: {
    label: "米国NIH 栄養補助食品局（ODS）ファクトシート（専門家向け）",
    url: "https://ods.od.nih.gov/",
    kind: "国際機関",
    note: "鉄・カルシウム・ビタミンD・マグネシウム・亜鉛などの、はたらき・不足・とりすぎ・サプリの注意。",
  },
  who2023nss: {
    label: "WHO 非糖質甘味料のガイドライン（2023）",
    url: "https://www.who.int/news/item/15-05-2023-who-advises-not-to-use-non-sugar-sweeteners-for-weight-control-in-newly-released-guideline",
    kind: "国際機関",
    note: "体重管理のために、使わないことを、条件つきで勧告（証拠の確実性は低め）。",
  },
  iarcAspartame: {
    label: "IARC アスパルテームの評価（2023）",
    url: "https://www.iarc.who.int/wp-content/uploads/2023/07/Aspartame_PR.pdf",
    kind: "国際機関",
    note: "「発がん性の可能性がある（2B）」。ADIは、維持されました。",
  },
  whoMeat: {
    label: "WHO 赤肉・加工肉とがん",
    url: "https://www.who.int/features/qa/cancer-red-meat/en/",
    kind: "国際機関",
    note: "加工肉は、大腸がんのリスクを上げる要因（証拠の強さの分類）。",
  },
  mb2023: {
    label: "消費者庁「令和5年度マーケットバスケット方式による保存料等の摂取量調査」",
    url: "https://www.caa.go.jp/policies/policy/standards_evaluation/food_additives/research_001/assets/cms_standards102_241209_01.pdf",
    kind: "公的な資料",
    note: "実際の摂取量は、多くの添加物で、ADIを大きく下回っています。",
  },
  caaAdditive: {
    label: "消費者庁「食品添加物表示に関するマメ知識」",
    url: "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/food_additive/assets/food_labeling_cms204_210408_01.pdf",
    kind: "公的な資料",
    note: "添加物の表示の読み方。",
  },
  activity2023: {
    label: "厚生労働省「健康づくりのための身体活動・運動ガイド2023」",
    kind: "国の基準",
    note: "成人は、歩行を1日約8,000歩以上、筋トレを週2〜3日、などが目安。",
  },
  japan21: {
    label: "厚生労働省「健康日本21（第三次）」",
    kind: "国の基準",
    note: "野菜は、1日350g以上が、目標。",
  },
  metabo: {
    label: "メタボリックシンドロームの診断基準（ウエスト：男性85cm・女性90cm以上）",
    kind: "診療ガイドライン",
    note: "内臓脂肪の目安。",
  },
};

// 目的別ガイド（栄養素ガイド）ごとの、根拠の強さと、使った出典
export type GoalEv = { level: "強い" | "中くらい" | "弱い"; why: string; ids: string[] };
export const GOAL_EVIDENCE: Record<string, GoalEv> = {
  pms: { level: "弱い", why: "月経前の不調と食事の関係は、研究が限られ、効果の大きさは一定しません。鉄・食事量の確保など、基本の栄養の話が中心です。強い症状は、婦人科へ。", ids: ["dri2025", "ods"] },
  menopause: { level: "中くらい", why: "カルシウム・たんぱく質・塩分の目安は、国の基準があります。大豆イソフラボンやほてりへの効果は、研究で一定しません。", ids: ["dri2025", "osteo2015"] },
  pregnancy: { level: "強い", why: "葉酸の400μg／日（妊娠前〜妊娠初期）は、神経管閉鎖障害の予防として、国が勧めています。", ids: ["dri2025", "ods"] },
  muscle: { level: "強い", why: "筋トレ時のたんぱく質量は、複数のメタ分析と国際学会の見解があります。", ids: ["issn2017", "morton2018", "dri2025"] },
  anemia: { level: "強い", why: "鉄の推奨量（月経あり／なし）は、国の基準があります。貧血は、病気が隠れることもあり、受診が先です。", ids: ["dri2025", "ods"] },
  performance: { level: "中くらい", why: "運動前後の栄養は、国際学会の見解があります。個人差が大きい分野です。", ids: ["issn2017"] },
  sleep: { level: "弱い", why: "食べ物が睡眠に与える影響は、研究が限られます。カフェインを控える・夕食の時間などの、生活の基本が中心です。", ids: ["dri2025"] },
  diet: { level: "強い", why: "減量の中心はエネルギー収支です。ペース・たんぱく質は、診療ガイドラインと研究があります。ケトジェニックなどの長期の安全性は、確立していません。", ids: ["obesity2022", "helms2014", "issn2017", "ioc2018", "matador", "hall2011"] },
  fatigue: { level: "弱い", why: "だるさの原因は、貧血・睡眠・甲状腺などさまざまです。栄養で改善する場合は、鉄・たんぱく質・ビタミンB群の不足などに限られます。", ids: ["dri2025", "ods"] },
  swelling: { level: "強い", why: "食塩の目標量は、国の基準があります。高血圧の方は、医師の指示が優先です。", ids: ["dri2025"] },
  immune: { level: "中くらい", why: "たんぱく質・ビタミンD・亜鉛などの不足が、免疫に影響することは知られています。サプリで風邪を防げる、という十分な証拠は、ありません。", ids: ["dri2025", "ods"] },
  bone: { level: "強い", why: "カルシウム・ビタミンD・運動の重要性は、国の基準と診療ガイドラインで示されています。", ids: ["dri2025", "osteo2015", "ods"] },
  beauty: { level: "弱い", why: "肌・髪と食事の関係は、たんぱく質・鉄・亜鉛などの不足を除いて、確かな証拠は限られます。コラーゲンの効果も、研究は一定しません。", ids: ["dri2025", "ods"] },
  gut: { level: "中くらい", why: "食物繊維の目標量は、国の基準があります。便秘の改善への効果は、人によって一定せず、診療ガイドラインでも「合う人には有効」という位置づけです。", ids: ["dri2025", "reynolds2019", "jsge2017"] },
};

// 豆知識で、出典がなかったものに、確認できた根拠をつける
export const TIP_SOURCES: Record<string, Src> = {
  "protein-powder": SRC.issn2017,
  "protein-ceiling": SRC.morton2018,
  "protein-bar-check": SRC.food8,
  "whey-casein": SRC.issn2017,
  "water-weight": SRC.hall2011,
  plateau: SRC.hall2011,
  "veg-350": SRC.japan21,
  steps: SRC.activity2023,
  waist: SRC.metabo,
  "gut-bristol": SRC.bristol1997,
  "gut-scfa": SRC.reynolds2019,
  alcohol: SRC.food8,
};

