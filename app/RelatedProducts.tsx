"use client";

import Link from "next/link";
import { SUPPS } from "./supplementsData";

// 各ページから、関係する商品（実商品の価格）を、少しだけ見せて、「商品」タブにつなぐ
export default function RelatedProducts({ q, title = "関連する商品" }: { q: string; title?: string }) {
  // まず、商品名・種類に、その言葉があるものを。なければ、効果の説明に出てくるもの
  const main = SUPPS.filter((x) => x.name.includes(q) || x.kind.includes(q));
  const list = (main.length > 0 ? main : SUPPS.filter((x) => x.effect.includes(q))).slice(0, 3);
  if (list.length === 0) return null;
  return (
    <div className="relprod">
      <p className="aglabel">🛒 {title}（実商品の価格）</p>
      <ul>
        {list.map((s) => (
          <li key={s.id}>
            <span aria-hidden>{s.icon}</span>
            <span>
              <b>{s.name}</b>
              <small>{s.price}</small>
            </span>
          </li>
        ))}
      </ul>
      <Link href={`/?tab=products&q=${encodeURIComponent(q)}`} className="evlink">
        「{q}」の商品を、もっと見る ›
      </Link>
      <p className="agnote">サプリは補助です。まず食事から。持病・妊娠中・服薬中の人は、使う前に、医師・薬剤師へ。</p>
    </div>
  );
}

