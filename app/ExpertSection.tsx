import type { Expert } from "../lib/expert";
import { HBars, Pie } from "./Charts";

// お客様向け：基礎情報への「専門家の評価」「今後の見通し」「増やす食事」を、図表で見せる（レポート・PDF用）。
const RATE_COLOR = { 良好: "#2e9e6a", 注意: "#e0a526", 要対策: "#e0694f", 情報: "#3b82c4" } as const;
const TONE_COLOR = { ok: "#2e9e6a", warn: "#e0a526", bad: "#e0694f" } as const;
const METRIC_LABEL = { p: "たんぱく質", fi: "食物繊維", ca: "カルシウム", fe: "鉄", kcal: "エネルギー" } as const;

export function NextActions({ e, title, nextDate }: { e: Expert; title: string; nextDate?: string }) {
  const groups = ["今週", "毎日", "次回", "4週間後"];
  const rows = e.nextActions;
  return (
    <section className="rnext">
      <h2>{title}</h2>
      <p className="rnote">見直すときは、ここを見てください。「だれが・いつまでに・何をするか」です。{nextDate ? `次回：${nextDate}` : ""}</p>
      <ol className="rnl">
        {rows.map((a, i) => (
          <li key={i} className={a.who === "本人" ? "me" : "tr"}>
            <em>{a.when}</em>
            <span className="who">{a.who}</span>
            <b>{a.what}</b>
          </li>
        ))}
      </ol>
      <p className="rnote" style={{ display: "none" }}>{groups.length}</p>
    </section>
  );
}

export default function ExpertSection({ e, compact, title1, title2, title3 }: { e: Expert; compact: boolean; title1: string; title2: string; title3: string }) {
  const tone = TONE_COLOR[e.tone];
  const counts = { 良好: 0, 注意: 0, 要対策: 0 };
  e.evals.forEach((x) => {
    if (x.rate in counts) counts[x.rate as keyof typeof counts]++;
  });
  return (
    <>
      <section className="rexpert">
        <h2>{title1}</h2>
        <p className="rnote">年齢・体格・体のデータ・運動などの、基礎情報について、身体の専門家の目線で、評価しました（診断ではなく、目安です）。</p>
        <div className="rxhead" style={{ borderColor: tone }}>
          <div className="rxscore" style={{ color: tone }}>
            <b>{e.score}</b>
            <small>／100</small>
          </div>
          <div className="rxtxt">
            <b>総合評価</b>
            <p>{e.headline}</p>
          </div>
          <Pie
            size={92}
            data={[
              { label: "良好", value: counts.良好, color: "#2e9e6a" },
              { label: "注意", value: counts.注意, color: "#f0b84a" },
              { label: "要対策", value: counts.要対策, color: "#e0694f" },
            ]}
          />
        </div>
        <div className="rxcards">
          {e.evals.map((x) => (
            <div key={x.id} className="rxcard" style={{ borderLeftColor: RATE_COLOR[x.rate] }}>
              <div className="rxch">
                <span aria-hidden>{x.icon}</span>
                <b>{x.item}</b>
                <em style={{ background: RATE_COLOR[x.rate] }}>{x.rate}</em>
              </div>
              <p className="rxv">{x.value}</p>
              <p className="rxc">基準：{x.criteria}</p>
              <p className="rxm">{x.rate === "良好" || x.rate === "情報" ? x.comment.split("。")[0] + "。" : x.comment}</p>
              {x.ref && <p className="rxr">根拠：{x.ref.label}</p>}
            </div>
          ))}
        </div>
      </section>

      {e.milestones.length > 0 && (
        <section>
          <h2>{title2}</h2>
          <p className="rnote">いまの状況から、これからの見通しです。体重は、週の平均で見ます。</p>
          <table className="rtable rxmile">
            <thead>
              <tr>
                <th>いつ</th>
                <th>体重の目安</th>
                <th>この時期のポイント</th>
              </tr>
            </thead>
            <tbody>
              {e.milestones.map((m) => (
                <tr key={m.label}>
                  <th>{m.label}</th>
                  <td>
                    <b>{m.kg}kg</b>
                    <small style={{ display: "block", color: "#667" }}>{m.diff > 0 ? "+" : ""}{m.diff}kg</small>
                  </td>
                  <td>{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <AddFoods e={e} compact={compact} title={title3} />
    </>
  );
}

export function AddFoods({ e, compact, title }: { e: Expert; compact: boolean; title: string }) {
  return (
      <section className="rxadd">
        <h2>{title}</h2>
        <p className="rnote rxkey">
          <b>減らす</b>のではなく、<b>足す</b>。まず、足りない栄養を、食事に<b>1つずつ足して</b>いきます。足すほど、満足感が上がり、食べすぎや間食が、自然に整います。
        </p>
        {(compact ? e.adds.slice(0, 3) : e.adds).map((g) => (
          <div key={g.id} className="rxg">
            <p className="rxgh">
              <span aria-hidden>{g.icon}</span> <b>{g.title}</b>
              <small>{g.now}</small>
            </p>
            <p className="rxgw">{g.why}</p>
            <p className="rxgt">🕐 {g.when}</p>
            <HBars
              unit={g.unit}
              color={g.id === "p" ? "#3b82c4" : g.id === "fi" ? "#2e9e6a" : g.id === "ca" ? "#7a5bd0" : "#e0a526"}
              items={[...g.items]
                .sort((a, b) => (b[g.metric === "kcal" ? "kcal" : g.metric] as number) - (a[g.metric === "kcal" ? "kcal" : g.metric] as number))
                .slice(0, compact ? 8 : 12)
                .map((x) => ({ label: `${x.label}`, value: x[g.metric === "kcal" ? "kcal" : g.metric] as number }))}
            />
            <p className="rnote">1回あたりの「{METRIC_LABEL[g.metric]}」の量です（日本食品標準成分表をもとにした目安）。</p>
          </div>
        ))}
        {e.refs.length > 0 && (
          <p className="rxrefs">
            <b>評価の根拠：</b>
            {e.refs.map((r) => r.label).join("／")}
          </p>
        )}
      </section>
  );
}
