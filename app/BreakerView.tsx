import { getBreaker } from "../lib/breakers";
import { macrosFor } from "../lib/methods";

// 停滞期・腸内環境・食べ方の「打開策の候補」を、お客様向けに、並べて見せる（レポート・PDF・定期フォロー用）。
const KIND_COLOR = { 停滞期: "#e0694f", 腸内環境: "#2f9e75", 食べ方: "#3b82c4", 生活: "#7a5bd0" } as const;

export default function BreakerView({ ids, evLimit = 3, notes, kcal = 0, maint = 0, compact = false }: { ids: string[]; evLimit?: number; notes?: Record<string, string>; kcal?: number; maint?: number; compact?: boolean }) {
  const list = ids.map((i) => getBreaker(i)).filter((x): x is NonNullable<ReturnType<typeof getBreaker>> => !!x);
  if (!list.length) return null;
  if (compact) {
    return (
      <div className="bkv">
        <table className="rtable bk-sum">
          <thead>
            <tr><th>候補</th><th>期間・根拠</th><th>向く状況</th><th>その日のPFC</th><th>注意</th></tr>
          </thead>
          <tbody>
            {list.map((b, n) => {
              const base = b.pfc ? (b.pfc.base === "維持" ? maint : kcal) : 0;
              const g = b.pfc && base > 0 ? macrosFor(base, b.pfc) : null;
              return (
                <tr key={b.id}>
                  <th>{n + 1}. {b.icon} {b.name.replace(/（.*$/, "")}</th>
                  <td>{b.period}<br /><span className={`bk-lv lv-${b.level === "強い" ? "s" : b.level === "中くらい" ? "m" : "w"}`}>{b.level}</span></td>
                  <td>{b.when}</td>
                  <td>{b.pfc ? `P${b.pfc.p}・F${b.pfc.f}・C${b.pfc.c}%${g ? `（P${g.p}・F${g.f}・C${g.c}g）` : ""}` : "—"}</td>
                  <td>{b.caution[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.filter((b) => notes?.[b.id]?.trim()).map((b) => (
          <p key={b.id} className="bkmine"><b>{b.icon} {b.name.replace(/（.*$/, "")}：あなたへの具体的な進め方：</b>{notes![b.id]}</p>
        ))}
        {notes?._free?.trim() && <p className="bkmine"><b>そのほかの打開策：</b>{notes._free}</p>}
        <p className="rxr">やり方・しくみ・期待できること・論文は、資料集の「停滞・代謝・不調」と、お客様用ページ（停滞期を抜ける方法）に、くわしく載っています。</p>
      </div>
    );
  }
  return (
    <div className="bkv">
      <p className="rnote">いまの状況に合わせて、候補を、いくつか選びました。1つずつ、トレーナーと相談して、試します（全部を、一度に、やる必要はありません）。</p>
      <table className="rtable bk-sum">
        <thead>
          <tr><th>候補</th><th>期間</th><th>根拠の強さ</th><th>向く状況</th></tr>
        </thead>
        <tbody>
          {list.map((b, n) => (
            <tr key={b.id}>
              <th>{n + 1}. {b.icon} {b.name.replace(/（.*$/, "")}</th>
              <td>{b.period}</td>
              <td><span className={`bk-lv lv-${b.level === "強い" ? "s" : b.level === "中くらい" ? "m" : "w"}`}>{b.level}</span></td>
              <td>{b.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.map((b, n) => (
        <div key={b.id} className="bkc">
          <p className="bkh">
            <span className="bkn" style={{ background: KIND_COLOR[b.kind] }}>候補{n + 1}・{b.kind}</span>
            <b>{b.icon} {b.name}</b>
          </p>
          <p className="bkm">期間：{b.period}／根拠の強さ：{b.level}</p>
          {b.how && <p className="bkhow"><b>しくみ：</b>{b.how}</p>}
          <p><b>向く状況：</b>{b.when}</p>
          {b.pfc && (() => {
            const base = b.pfc.base === "維持" ? maint : kcal;
            const g = base > 0 ? macrosFor(base, b.pfc) : null;
            return (
              <div className="bkpfc">
                <p className="bkpt"><b>理想のPFCバランス（その日）</b>{g ? `：約${Math.round(base / 10) * 10}kcal（${b.pfc.base === "維持" ? "維持のカロリー" : "目標のカロリー"}）` : ""}</p>
                <div className="mpk-bar" aria-label="PFCバランス">
                  <span className="p" style={{ width: `${b.pfc.p}%` }}>P {b.pfc.p}%{g ? `（${g.p}g）` : ""}</span>
                  <span className="f" style={{ width: `${b.pfc.f}%` }}>F {b.pfc.f}%{g ? `（${g.f}g）` : ""}</span>
                  <span className="c" style={{ width: `${b.pfc.c}%` }}>C {b.pfc.c}%{g ? `（${g.c}g）` : ""}</span>
                </div>
                <p className="rxr">{b.pfc.note}</p>
              </div>
            );
          })()}
          <ol>{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="bkx"><b>期待できること（正直に）：</b>{b.effect}</p>
          <p className="bkw">⚠ {b.caution.join(" ／ ")}</p>
          {notes?.[b.id]?.trim() && <p className="bkmine"><b>あなたへの具体的な進め方：</b>{notes[b.id]}</p>}
          <ul className="bke">
            {b.evidence.slice(0, evLimit).map((e) => (
              <li key={e.pmid}>{e.label}：{e.note}</li>
            ))}
          </ul>
        </div>
      ))}
      {notes?._free?.trim() && <p className="bkmine"><b>そのほかの打開策：</b>{notes._free}</p>}
    </div>
  );
}
