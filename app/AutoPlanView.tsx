import type { PlanOut } from "../lib/autoplan";
import { getTip } from "../lib/knowledge";

// 定期フォロー資料：お客様の状況から、自動で作った、「判断・具体的な食事・見立て・打開策・根拠」。
export default function AutoPlanView({ p, compact = false }: { p: PlanOut; compact?: boolean }) {
  const tone = p.judge.level === "stall" ? "#e0694f" : p.judge.level === "ok" ? "#2f9e75" : "#8a96a0";
  return (
    <div className="apv">
      <div className="apv-judge" style={{ borderColor: tone }}>
        <b style={{ color: tone }}>判定：{p.judge.label}</b>
        <ul>{p.judge.points.map((x) => <li key={x}>{x}</li>)}</ul>
        <details className="apv-crit" open>
          <summary>判断の目安</summary>
          <ul>{p.judge.criteria.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      </div>

      <p className="apv-h">① いまの方法を、具体的に：{p.method.icon} {p.method.name}</p>
      {p.method.g ? (
        <>
          <div className="mpk-bar" aria-label="PFCバランス">
            <span className="p" style={{ width: `${p.method.pct.p}%` }}>P {p.method.pct.p}%（{p.method.g.p}g）</span>
            <span className="f" style={{ width: `${p.method.pct.f}%` }}>F {p.method.pct.f}%（{p.method.g.f}g）</span>
            <span className="c" style={{ width: `${p.method.pct.c}%` }}>C {p.method.pct.c}%（{p.method.g.c}g）</span>
          </div>
          <p className="rxr">1日 約{Math.round(p.method.kcal / 10) * 10}kcal。食事ごとの目安（量は、食品の例で、置きかえてOK）：</p>
          {compact ? (
            <>
          <p className="apv-line">{p.meals.map((r) => `${r.name} ${r.kcal}kcal（P${r.p}・F${r.f}・C${r.c}g）`).join("　／　")}</p>
          {(() => {
            const dn = p.meals.find((r) => r.name === "夕食") ?? p.meals[p.meals.length - 1];
            return dn && (dn.foodsP.length > 0 || dn.foodsC.length > 0) ? (
              <p className="rxr">{dn.name}の目安の例：{dn.foodsP.length > 0 ? `たんぱく質（${dn.foodsP.join("／")}）` : ""}{dn.foodsC.length > 0 ? `　炭水化物（${dn.foodsC.slice(0, 2).join("／")}）` : ""}。ほかの食事は、量を、割合で置きかえてOK。</p>
            ) : null;
          })()}
            </>
          ) : (
            <table className="rtable apv-meals">
              <thead>
                <tr><th>食事</th><th>kcal</th><th>P</th><th>F</th><th>C</th><th>たんぱく質の例／炭水化物の例</th></tr>
              </thead>
              <tbody>
                {p.meals.map((r) => (
                  <tr key={r.name}>
                    <th>{r.name}{r.own && <small className="apv-own">いま：{r.own}</small>}</th>
                    <td>{r.kcal}</td>
                    <td>{r.p}g</td>
                    <td>{r.f}g</td>
                    <td>{r.c}g</td>
                    <td className="apv-ex">
                      {r.foodsP.length > 0 && <span>P：{r.foodsP.join("／")}</span>}
                      {r.foodsC.length > 0 && <span>C：{r.foodsC.slice(0, 2).join("／")}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        </>
      ) : (
        <p className="rnote">身長・年齢などを入れると、1日と、食事ごとのグラム数が出ます。</p>
      )}
      <p className="rnote">選ぶもの：{p.method.steps.join("／")}</p>
      {p.method.caution && <p className="mpk-warn">⚠ {p.method.caution}</p>}

      {p.dx.length > 0 && (
        <>
          <p className="apv-h">② 食事・生活の見立てと、次の一手（根拠つき{p.dxAll > p.dx.length ? `・優先度の高い${p.dx.length}件` : ""}）</p>
          <div className="apv-dx">
            {p.dx.map((d) => (
              <div key={d.title} className="apv-card">
                <b>{d.title}{d.general && <em className="apv-gen">一般的な助言</em>}</b>
                <p>{d.why}</p>
                <p className="apv-act">→ {d.action}</p>
                {d.ev.length > 0 && <ul className="fuev">{d.ev.map((e) => <li key={e.pmid}>{e.label}：{e.note}</li>)}</ul>}
              </div>
            ))}
          </div>
        </>
      )}

      {p.tricks.length > 0 && (
        <>
          <p className="apv-h">③ {p.trickTitle}</p>
          <div className="apv-dx">
            {p.tricks.map((d) => (
              <div key={d.title} className="apv-card">
                <b>{d.title}</b>
                <p>{d.why}</p>
                <p className="apv-act">→ {d.action}</p>
                {d.ev.length > 0 && <ul className="fuev">{d.ev.map((e) => <li key={e.pmid}>{e.label}：{e.note}</li>)}</ul>}
              </div>
            ))}
          </div>
        </>
      )}

      {p.breakerWhy.length > 0 && (p.goal !== "muscle" || p.judge.level === "stall") && (
        <>
          <p className="apv-h">④ 停滞期の打開策（この状況での、おすすめの順）</p>
          <ol className="apv-br">{p.breakerWhy.map((x) => <li key={x}>{x}</li>)}</ol>
          <p className="rxr">くわしい、やり方・PFC・注意は、「打開策」の欄に、あります。</p>
        </>
      )}
      {getTip(p.tipId) && <p className="rxr">今回のおすすめの豆知識：{getTip(p.tipId)!.icon} {getTip(p.tipId)!.name}</p>}
      <p className="rxr">※ 診断・治療ではありません。持病・服薬のある方は、主治医に、ご確認ください。「一般的な助言」と書いたものは、論文での確認は、していません。</p>
    </div>
  );
}
