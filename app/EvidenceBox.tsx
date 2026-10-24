"use client";

import { SRC } from "./evidence";

// 「根拠（エビデンス）を見る」：出典の名前・種類・リンク・何の根拠かを、まとめて見せる。
export default function EvidenceBox({ ids, note, level }: { ids: string[]; note?: string; level?: string }) {
  const list = ids.map((i) => SRC[i]).filter(Boolean);
  return (
    <details className="evbox">
      <summary>📚 根拠（エビデンス）を見る{level ? `　［根拠の強さ：${level}］` : ""}</summary>
      {note && <p className="evnote">{note}</p>}
      <ul className="evlist">
        {list.map((s) => (
          <li key={s.label}>
            <em className="evkind">{s.kind}</em>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ) : (
              <span className="evname">{s.label}</span>
            )}
            {s.note && <small>{s.note}</small>}
          </li>
        ))}
      </ul>
      <p className="evfoot">
        ※ 「国の基準」「診療ガイドライン」「国際機関」は、公的な根拠です。「研究・総説」は、研究の結果で、個人にそのまま当てはまるとは限りません。「このアプリの計算」は、おおまかな目安です。
      </p>
    </details>
  );
}
