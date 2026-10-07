"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "mens" | "foll" | "ovul" | "lut";

const DAY = 86400000;
const toDate = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diffDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);
const md = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;

const PHASES: Record<
  Phase,
  { name: string; icon: string; color: string; body: string; eat: string; move: string; weight: string }
> = {
  mens: {
    name: "月経期",
    icon: "🩸",
    color: "#ff8fa3",
    body: "経血で鉄が失われ、だるさ・腹痛・冷え・頭痛が出やすい時期。眠気や集中力の低下を感じる人もいます。",
    eat: "鉄を意識：赤身肉・レバー・カツオ・あさり・小松菜に、ビタミンC（果物・ブロッコリー）を。温かい汁物や飲み物で体を温めて。食欲がないときは、消化のよいおかゆ・卵・豆腐から。",
    move: "軽いストレッチや散歩くらいに。つらい日は、休むのも大切。",
    weight: "むくみや、水分のバランスで、体重が上下しやすい時期。数字に一喜一憂しないで。",
  },
  foll: {
    name: "卵胞期",
    icon: "🌱",
    color: "#7ed957",
    body: "エストロゲンが増えて、体調も気分も上向きやすい時期。肌の調子がよく、むくみも少なめの人が多いです。",
    eat: "食事を見直したり、減量に取り組んだりするのに向いた時期。たんぱく質（毎食20g前後）と野菜、カルシウム（乳製品・小魚・大豆）をしっかり。",
    move: "筋トレや有酸素運動を、しっかりやりやすい時期。新しいメニューに挑戦するのにも向いています。",
    weight: "比較的ブレが少ないので、体重の測定は、この時期の数値を基準にすると比べやすいです。",
  },
  ovul: {
    name: "排卵期",
    icon: "🌼",
    color: "#ffd23f",
    body: "体温がわずかに上がり、下腹部に違和感や軽い痛みが出る人も。おりものが増えます。",
    eat: "水分をしっかりとって、食物繊維（野菜・きのこ・海藻）で腸を整えて。",
    move: "ふだんどおりでOK。体調に合わせて、ウォーキング・筋トレを。",
    weight: "このころから、少しずつ水分をためやすくなります。",
  },
  lut: {
    name: "黄体期（月経前）",
    icon: "🌙",
    color: "#b79cff",
    body: "プロゲステロンが増えて、むくみ・便秘・眠気・食欲の増加・イライラ（PMS）が出やすい時期。エネルギーの消費も、わずかに増えるとされます。",
    eat: "塩分はひかえめに、食物繊維とカリウム（野菜・果物・海藻）を。甘いものは、量を決めて楽しんで。食事を抜くと、かえって食欲が乱れます。カフェインとお酒は控えめに。",
    move: "ウォーキング・ヨガ・軽い筋トレなど、無理のない運動を。気分転換にもなります。",
    weight: "1〜2kgの増加は、ほとんど水分。月経が始まると戻ることが多いので、あわてないで。",
  },
};

type Saved = { starts: string[]; len: number; dur: number };

export default function CycleTracker() {
  const [saved, setSaved] = useState<Saved>({ starts: [], len: 28, dur: 5 });
  const [loaded, setLoaded] = useState(false);
  const [inputDate, setInputDate] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("lg-cycle") || "null");
      if (s && Array.isArray(s.starts)) setSaved({ starts: s.starts, len: s.len || 28, dur: s.dur || 5 });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("lg-cycle", JSON.stringify(saved));
    } catch {}
  }, [saved, loaded]);

  const info = useMemo(() => {
    const starts = [...saved.starts].sort();
    if (starts.length === 0) return null;
    // 2回以上の記録があれば、平均の周期（18〜60日のものだけ）を使う
    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      const g = diffDays(toDate(starts[i]), toDate(starts[i - 1]));
      if (g >= 18 && g <= 60) gaps.push(g);
    }
    const recent = gaps.slice(-3);
    const len = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : saved.len;
    const last = toDate(starts[starts.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = diffDays(today, last) + 1; // 周期の何日目か
    const ov = len - 14; // 排卵の目安日（次の月経の約14日前）
    let phase: Phase;
    if (day <= saved.dur) phase = "mens";
    else if (day < ov - 1) phase = "foll";
    else if (day <= ov + 1) phase = "ovul";
    else phase = "lut";
    const next = new Date(last.getTime() + len * DAY);
    const ovDate = new Date(last.getTime() + (ov - 1) * DAY);
    const toNext = diffDays(next, today);
    return { len, last, day, phase, next, ovDate, toNext, starts, avg: recent.length > 0 };
  }, [saved]);

  const addStart = (k: string) => {
    if (!k) return;
    setSaved((s) => ({ ...s, starts: Array.from(new Set([...s.starts, k])).sort().slice(-8) }));
  };

  const late = info && info.day > info.len;
  const irregular = info && (info.len < 25 || info.len > 38);
  const ph = info ? PHASES[info.phase] : null;

  return (
    <section className="card cyc" aria-label="月経周期と、今日のからだ">
      <h2 className="h2">🌸 今日のからだと、月経周期</h2>

      {!info || editing ? (
        <div className="cycform">
          <p className="cycnote">
            最後の月経の「開始日」を入れると、今日が周期のどの時期かと、時期に合わせた食事・運動のコツが分かります。記録は、この端末だけに保存されます。
          </p>
          <label className="cyclabel">
            最後の月経の開始日
            <input type="date" value={inputDate} max={key(new Date())} onChange={(e) => setInputDate(e.target.value)} />
          </label>
          <div className="cycrow">
            <label className="cyclabel">
              ふだんの周期（日）
              <input
                type="number"
                min={21}
                max={45}
                value={saved.len}
                onChange={(e) => setSaved((s) => ({ ...s, len: Math.min(45, Math.max(21, parseInt(e.target.value) || 28)) }))}
              />
            </label>
            <label className="cyclabel">
              月経の日数
              <input
                type="number"
                min={2}
                max={10}
                value={saved.dur}
                onChange={(e) => setSaved((s) => ({ ...s, dur: Math.min(10, Math.max(2, parseInt(e.target.value) || 5)) }))}
              />
            </label>
          </div>
          <div className="cycbtns">
            <button
              className="btn"
              disabled={!inputDate}
              onClick={() => {
                addStart(inputDate);
                setInputDate("");
                setEditing(false);
              }}
            >
              保存する
            </button>
            {info && (
              <button className="btn ghost" onClick={() => setEditing(false)}>
                やめる
              </button>
            )}
          </div>
        </div>
      ) : (
        ph && (
          <>
            <div className="cyccard" style={{ ["--pc" as string]: ph.color }}>
              <div className="cychead">
                <span className="cycicon" aria-hidden>
                  {ph.icon}
                </span>
                <div>
                  <b>周期 {info.day}日目</b>
                  <span>
                    今は<strong>{ph.name}</strong>
                  </span>
                </div>
              </div>
              <div className="cycbar" aria-hidden>
                {(["mens", "foll", "ovul", "lut"] as Phase[]).map((p) => {
                  const ov = info.len - 14;
                  const w =
                    p === "mens"
                      ? saved.dur
                      : p === "foll"
                      ? Math.max(1, ov - 2 - saved.dur)
                      : p === "ovul"
                      ? 3
                      : Math.max(1, info.len - (ov + 1));
                  return <i key={p} style={{ flex: w, background: PHASES[p].color }} className={p === info.phase ? "on" : ""} />;
                })}
                <b style={{ left: `${Math.min(100, ((info.day - 0.5) / info.len) * 100)}%` }} />
              </div>
              <ul className="cycdates">
                <li>
                  次の月経の予定：<b>{md(info.next)}ごろ</b>
                  {info.toNext > 0 ? `（あと${info.toNext}日）` : info.toNext === 0 ? "（今日ごろ）" : `（予定より${-info.toNext}日遅れ）`}
                </li>
                <li>
                  排卵の目安：{md(info.ovDate)}ごろ <small>（予測は目安です）</small>
                </li>
                <li>
                  周期の長さ：{info.len}日{info.avg ? "（記録の平均）" : "（設定した値）"}
                </li>
              </ul>
            </div>

            {late && (
              <p className="cycwarn">
                予定の日を過ぎています。妊娠の可能性があるときは、検査薬や婦人科で確認を。ストレス・体重の急な変化・食事の制限でも、周期は乱れます。3か月以上こないときは、婦人科へ。
              </p>
            )}
            {irregular && (
              <p className="cycwarn">
                周期が25〜38日の範囲から外れています。ふだんから乱れがちなときは、婦人科で相談してみましょう。
              </p>
            )}

            <div className="cyctips">
              <h3>{ph.name}の過ごし方</h3>
              <div>
                <b>からだ</b>
                <p>{ph.body}</p>
              </div>
              <div>
                <b>食べ方</b>
                <p>{ph.eat}</p>
              </div>
              <div>
                <b>運動</b>
                <p>{ph.move}</p>
              </div>
              <div>
                <b>体重の見方</b>
                <p>{ph.weight}</p>
              </div>
            </div>

            <div className="cycbtns">
              <button className="btn" onClick={() => addStart(key(new Date()))}>
                今日、月経が始まった
              </button>
              <button className="btn ghost" onClick={() => setEditing(true)}>
                日付・設定を直す
              </button>
            </div>

            {info.starts.length > 0 && (
              <details className="cychist">
                <summary>これまでの記録（{info.starts.length}回）</summary>
                <ul>
                  {[...info.starts].reverse().map((s) => (
                    <li key={s}>
                      <span>{md(toDate(s))}</span>
                      <button
                        aria-label={`${md(toDate(s))}の記録を消す`}
                        onClick={() => setSaved((v) => ({ ...v, starts: v.starts.filter((x) => x !== s) }))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )
      )}

      <p className="cycnote small">
        ※ 排卵日や月経日の予測は、目安です。避妊や、妊娠の判断には使えません。月経が3か月以上こない、周期が極端に乱れる、ひどい痛みや大量の出血があるときは、婦人科へ。
      </p>
    </section>
  );
}
