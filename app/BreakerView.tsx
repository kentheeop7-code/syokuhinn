import { getBreaker } from "../lib/breakers";

// 停滞期・腸内環境・食べ方の「打開策の候補」を、お客様向けに、並べて見せる（レポート・PDF・定期フォロー用）。
const KIND_COLOR = { 停滞期: "#e0694f", 腸内環境: "#2f9e75", 食べ方: "#3b82c4", 生活: "#7a5bd0" } as const;

export default function BreakerView({ ids, evLimit = 3 }: { ids: string[]; evLimit?: number }) {
  const list = ids.map((i) => getBreaker(i)).filter((x): x is NonNullable<ReturnType<typeof getBreaker>> => !!x);
  if (!list.length) return null;
  return (
    <div className="bkv">
      <p className="rnote">いまの状況に合わせて、候補を、いくつか選びました。1つずつ、トレーナーと相談して、試します（全部を、一度に、やる必要はありません）。</p>
      {list.map((b, n) => (
        <div key={b.id} className="bkc">
          <p className="bkh">
            <span className="bkn" style={{ background: KIND_COLOR[b.kind] }}>候補{n + 1}・{b.kind}</span>
            <b>{b.icon} {b.name}</b>
          </p>
          <p className="bkm">期間：{b.period}／根拠の強さ：{b.level}</p>
          <p><b>向く状況：</b>{b.when}</p>
          <ol>{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="bkx"><b>期待できること（正直に）：</b>{b.effect}</p>
          <p className="bkw">⚠ {b.caution.join(" ／ ")}</p>
          <ul className="bke">
            {b.evidence.slice(0, evLimit).map((e) => (
              <li key={e.pmid}>{e.label}：{e.note}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
