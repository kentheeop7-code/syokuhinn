"use client";

import { useEffect, useMemo, useState } from "react";
import { FOODS } from "../../lib/foods";

const byName = new Map(FOODS.map((f) => [f.name, f]));
const r1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- セルフチェック
const CHECKS = [
  "排便が、週に3回未満",
  "便が硬い・コロコロしている（ブリストルのタイプ1〜2）",
  "排便のとき、強くいきむ",
  "出たあとも、残った感じがする",
  "朝食を抜くことが多い",
  "食物繊維の多い食品（野菜・海藻・豆・きのこ）が、1日に3品未満",
  "水分（お茶・水・汁物）が、1日1L未満",
  "便意があっても、我慢することがある",
  "運動の習慣がない（1日の歩数が5,000歩未満）",
  "月経前になると、便秘やおなかの張りが悪化する",
  "睡眠不足・ストレスで、おなかの調子が変わる",
  "下痢と便秘を、くり返す",
];

const ALARMS = [
  "便に血が混じる、または便が黒い（タール状）",
  "半年以内に、意図せず3kg以上、体重が減った",
  "強い腹痛・嘔吐・発熱がある",
  "40〜50歳以降に、急に便通が変わった（便が細い・下痢が続く）",
  "夜中に、おなかの痛みや下痢で目が覚める",
  "貧血を指摘された、または家族に大腸がんの人がいる",
];

function SelfCheck() {
  const [c, setC] = useState<boolean[]>(CHECKS.map(() => false));
  const [a, setA] = useState<boolean[]>(ALARMS.map(() => false));
  const n = c.filter(Boolean).length;
  const alarm = a.some(Boolean);
  const level =
    n <= 2
      ? { cls: "ok", text: "今のところ、腸の調子は、おおむね良さそうです。今の習慣を続けましょう。" }
      : n <= 6
      ? { cls: "mid", text: "いくつか当てはまります。下の食事・生活のポイントと、7日間プランで、整えてみましょう。" }
      : { cls: "hi", text: "当てはまる項目が多めです。まずは食物繊維・水分・朝のトイレ習慣を整えて、2〜4週間続けてもよくならないときは、消化器内科へ。" };
  return (
    <div className="gtcard">
      <h3>✅ 腸のセルフチェック</h3>
      <p className="gtnote">当てはまるものにチェックしてください（目安です。診断ではありません）。</p>
      <ul className="gtchecks">
        {CHECKS.map((t, i) => (
          <li key={t}>
            <label>
              <input type="checkbox" checked={c[i]} onChange={(e) => setC((p) => p.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span>{t}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className={`gtresult ${level.cls}`}>
        <b>{n}個</b> 当てはまっています。{level.text}
      </p>

      <h3 className="gtalarmh">⚠ 受診をすすめる「サイン」</h3>
      <ul className="gtchecks alarm">
        {ALARMS.map((t, i) => (
          <li key={t}>
            <label>
              <input type="checkbox" checked={a[i]} onChange={(e) => setA((p) => p.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span>{t}</span>
            </label>
          </li>
        ))}
      </ul>
      {alarm && (
        <p className="gtresult hi">
          <b>1つでも当てはまるときは、「ただの便秘」と決めつけず、早めに消化器内科（または内科）を受診してください。</b>
          大腸の病気（大腸がん・炎症性腸疾患など）が隠れていないか、検査で確認できます。
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 食物繊維メーカー
type F = { name: string; g: number; label: string; tag: "water" | "insol" | "ferm" | "oligo" };
const FIBER_FOODS: F[] = [
  { name: "もち麦ごはん", g: 150, label: "もち麦ごはん 茶碗1杯（150g）", tag: "water" },
  { name: "玄米ごはん", g: 150, label: "玄米ごはん 茶碗1杯（150g）", tag: "insol" },
  { name: "オートミール", g: 30, label: "オートミール 30g", tag: "water" },
  { name: "納豆", g: 45, label: "納豆 1パック（45g）", tag: "ferm" },
  { name: "わかめ（生）", g: 30, label: "わかめ 30g（みそ汁1杯ぶん）", tag: "water" },
  { name: "ひじき（乾）", g: 5, label: "ひじき（乾）5g（煮物1皿）", tag: "water" },
  { name: "オクラ", g: 40, label: "オクラ 4本（40g）", tag: "water" },
  { name: "アボカド", g: 70, label: "アボカド 1/2個（70g）", tag: "water" },
  { name: "ごぼう", g: 50, label: "ごぼう 50g（きんぴら1皿）", tag: "insol" },
  { name: "しめじ", g: 50, label: "しめじ 50g", tag: "insol" },
  { name: "ブロッコリー", g: 80, label: "ブロッコリー 80g", tag: "insol" },
  { name: "枝豆", g: 60, label: "枝豆 60g", tag: "insol" },
  { name: "大豆水煮缶", g: 50, label: "大豆水煮 50g", tag: "insol" },
  { name: "キウイ", g: 80, label: "キウイ 1個（80g）", tag: "water" },
  { name: "りんご", g: 150, label: "りんご 1/2個（150g）", tag: "water" },
  { name: "バナナ", g: 100, label: "バナナ 1本（100g）", tag: "oligo" },
  { name: "さつまいも", g: 100, label: "さつまいも 100g", tag: "insol" },
  { name: "無糖ヨーグルト", g: 150, label: "無糖ヨーグルト 150g", tag: "ferm" },
  { name: "ライ麦パン", g: 60, label: "ライ麦パン 60g", tag: "insol" },
  { name: "チアシード", g: 10, label: "チアシード 10g", tag: "water" },
];
const TAGS: { key: F["tag"] | "all"; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "water", label: "水溶性が多い" },
  { key: "insol", label: "不溶性が多い" },
  { key: "ferm", label: "発酵食品" },
  { key: "oligo", label: "オリゴ糖" },
];

function FiberMaker() {
  const [tag, setTag] = useState<F["tag"] | "all">("all");
  const [picked, setPicked] = useState<F[]>([]);
  const [added, setAdded] = useState(false);
  const total = useMemo(
    () => picked.reduce((s, p) => s + ((byName.get(p.name)?.fi ?? 0) * p.g) / 100, 0),
    [picked]
  );
  const ferm = new Set(picked.filter((p) => p.tag === "ferm").map((p) => p.name)).size;
  const water = new Set(picked.filter((p) => p.tag === "water").map((p) => p.name)).size;
  const insol = new Set(picked.filter((p) => p.tag === "insol").map((p) => p.name)).size;
  const list = FIBER_FOODS.filter((f) => tag === "all" || f.tag === tag);
  const pct18 = Math.min(100, (total / 18) * 100);
  const msg =
    total >= 25
      ? "理想の25gに届きました！"
      : total >= 18
      ? "目標の18gに届きました。25gを目指すなら、あと" + r1(25 - total) + "g。"
      : picked.length === 0
      ? "食品をタップして、1日の食物繊維を足してみましょう。"
      : "目標の18gまで、あと" + r1(18 - total) + "g。";

  const addToLog = () => {
    try {
      const d = new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const log = JSON.parse(localStorage.getItem("lg-log") || "{}");
      log[k] = [
        ...(log[k] ?? []),
        ...picked.map((p) => ({ id: crypto.randomUUID(), name: p.name, grams: p.g })),
      ];
      localStorage.setItem("lg-log", JSON.stringify(log));
      setAdded(true);
    } catch {}
  };

  return (
    <div className="gtcard">
      <h3>🥗 食物繊維「メーカー」</h3>
      <p className="gtnote">1日に何gとれるか、食品をタップして、組み立ててみましょう（女性の目標は18g以上、理想は25g）。</p>
      <div className="gtmeter">
        <div className="gthead">
          <b>食物繊維</b>
          <span>
            <strong>{r1(total)}</strong> / 18g（理想25g）
          </span>
        </div>
        <div className="gtbar">
          <i style={{ width: `${pct18}%` }} className={total >= 18 ? "done" : ""} />
        </div>
        <p className="gtmsg">{msg}</p>
        <p className="gtmix">
          水溶性の食品 {water}種類・不溶性の食品 {insol}種類・発酵食品 {ferm}種類
          {water > 0 && insol > 0 ? "　✓ 両方そろっています" : picked.length > 0 ? "　→ 水溶性と不溶性の両方があると、◎" : ""}
        </p>
      </div>
      <div className="gttags" role="tablist">
        {TAGS.map((t) => (
          <button key={t.key} className={tag === t.key ? "on" : ""} aria-selected={tag === t.key} onClick={() => setTag(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <ul className="gtfoods">
        {list.map((f) => (
          <li key={f.label}>
            <button
              onClick={() => {
                setPicked((a) => [...a, f]);
                setAdded(false);
              }}
            >
              <span className="gtn">{f.label}</span>
              <span className="gtv">
                <b>{r1(((byName.get(f.name)?.fi ?? 0) * f.g) / 100)}</b>g
              </span>
              <span className="gtp" aria-hidden>
                ＋
              </span>
            </button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="gtpicked">
          <b>選んだもの（{picked.length}品）</b>
          <ul>
            {picked.map((p, i) => (
              <li key={`${p.label}-${i}`}>
                <span>{p.label}</span>
                <button aria-label={`${p.label}を外す`} onClick={() => setPicked((a) => a.filter((_, j) => j !== i))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="gtactions">
            <button className="btn" onClick={addToLog}>
              {added ? "✓ 今日の記録に追加しました" : "＋ 今日の記録に追加"}
            </button>
            <button className="btn ghost" onClick={() => setPicked([])}>
              全部外す
            </button>
          </div>
          {added && <p className="gtnote">「記録」の画面で、確認できます。</p>}
        </div>
      )}
      <p className="gtnote small">
        食物繊維の量は、日本食品標準成分表（八訂増補2023年）をもとにした、アプリ内の食品データです。水溶性・不溶性の分類は、おもな性質の目安です。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- 7日間プラン
const PLAN = [
  { day: "1日目", title: "現状を知る", tasks: ["便の形・回数を、メモする（ブリストルのタイプ）", "起きたら、コップ1杯の水を飲む", "朝食を、必ず食べる"] },
  { day: "2日目", title: "食物繊維を足す", tasks: ["白ごはんの半分を、もち麦ごはん（または玄米）にかえる", "納豆1パックか、わかめのみそ汁を足す", "水分を、1日1.2L以上（汁物・お茶を含む）"] },
  { day: "3日目", title: "朝のルーティン", tasks: ["朝食の5〜10分後に、トイレに3分座る（スマホなし）", "足元に台を置いて、前かがみになる", "便意を、我慢しない"] },
  { day: "4日目", title: "発酵食品＋エサ", tasks: ["無糖ヨーグルト150gに、キウイかバナナを足す", "納豆・みそ・ぬか漬けのどれかを、1品", "玉ねぎ・バナナ・大豆など、オリゴ糖の食品を1品"] },
  { day: "5日目", title: "からだを動かす", tasks: ["ウォーキング20〜30分（または、8,000歩）", "ふくらはぎの上げ下げ20回×3", "腹式呼吸を5分（おなかをふくらませる）"] },
  { day: "6日目", title: "眠りとストレス", tasks: ["就寝の3時間前までに、夕食を終える", "14時以降は、カフェインを控える", "10分、リラックスする時間をつくる（入浴・ストレッチ）"] },
  { day: "7日目", title: "ふり返り", tasks: ["1週間の便のメモを見返して、タイプ3〜5の日を数える", "食物繊維が18gに届いた日を、数える", "続けられたことを3つ選んで、来週も続ける"] },
];

function Plan() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-gut-plan") || "null");
      if (s && typeof s === "object") setDone(s);
    } catch {}
  }, []);
  const toggle = (id: string) =>
    setDone((d) => {
      const n = { ...d, [id]: !d[id] };
      try {
        localStorage.setItem("lg-gut-plan", JSON.stringify(n));
      } catch {}
      return n;
    });
  const all = PLAN.flatMap((d, i) => d.tasks.map((_, j) => `${i}-${j}`));
  const n = all.filter((id) => done[id]).length;
  return (
    <div className="gtcard">
      <h3>📅 7日間の腸活プラン</h3>
      <p className="gtprog">
        <strong>{n}</strong> / {all.length} できました
        <span className="gtpbar">
          <i style={{ width: `${(n / all.length) * 100}%` }} />
        </span>
      </p>
      {PLAN.map((d, i) => (
        <div key={d.day} className="gtday">
          <strong>
            {d.day}：{d.title}
          </strong>
          <ul className="gtchecks">
            {d.tasks.map((t, j) => {
              const id = `${i}-${j}`;
              return (
                <li key={id}>
                  <label>
                    <input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} />
                    <span>{t}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function GutTools() {
  return (
    <>
      <SelfCheck />
      <FiberMaker />
      <Plan />
    </>
  );
}
