import type { ShortPlan } from "../lib/shortplans";

// 短期プログラム（ファスティング・16時間断食・腸活・短期ダイエット）の、共通の表示。お客様用・トレーナー用・レポート用で、同じ内容を出す。
const KIND_COLOR = { 断食: "#5b6b8a", 腸活: "#2f9e75", ダイエット: "#e0a526" } as const;

export default function ShortPlanView({ plan, evLimit = 6 }: { plan: ShortPlan; evLimit?: number }) {
  return (
    <div className="spv">
      <div className="spvh">
        <span className="spvk" style={{ background: KIND_COLOR[plan.kind] }}>{plan.kind}</span>
        <b>
          {plan.icon} {plan.name}
        </b>
        <small>期間：{plan.period}／根拠の強さ：{plan.level}</small>
      </div>
      {plan.risky && <p className="spvwarn">⚠ 専門家（医師）の管理が必要な内容です。自己流・トレーナーだけの判断では、行いません。</p>}
      <p className="spvg">🎯 {plan.goal}</p>
      <p className="spvs">{plan.summary}</p>
      <table className="rtable spvt">
        <thead>
          <tr>
            <th>いつ</th>
            <th>やること</th>
          </tr>
        </thead>
        <tbody>
          {plan.schedule.map((d) => (
            <tr key={d.day}>
              <th>{d.day}</th>
              <td>
                <ul>
                  {d.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="spvrow">
        <div>
          <b>食べるもの・とるもの</b>
          <ul>
            {plan.eat.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <b>さけること</b>
          <ul>
            {plan.avoid.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="spvx">
        <b>期待できること（正直に）：</b>
        {plan.expect}
      </p>
      <p className="spvw">
        <b>向く人：</b>
        {plan.who}
      </p>
      <div className="spvc">
        <b>⚠ 向かない人・注意</b>
        <ul>
          {plan.caution.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="spve">
        <b>根拠（論文・PubMed）</b>
        <ul>
          {plan.evidence.slice(0, evLimit).map((e) => (
            <li key={e.pmid}>
              {e.label}：{e.note}　<a href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`} target="_blank" rel="noreferrer">PubMed</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
