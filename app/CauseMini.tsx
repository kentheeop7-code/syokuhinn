"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { analyze, COMPLAINTS, type CIn } from "./CausePanel";

// ホームの「いまの食事のバランス」で選んだ内容から、このページのテーマに関わる原因を、短く出す。
export default function CauseMini({ ids, title }: { ids: string[]; title?: string }) {
  const [cin, setCin] = useState<{ touched: boolean; input: CIn } | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const s = JSON.parse(localStorage.getItem("lg-cin") || "null");
        setCin(s && s.input ? s : null);
      } catch {
        setCin(null);
      }
    };
    read();
    window.addEventListener("lg-status-change", read);
    return () => window.removeEventListener("lg-status-change", read);
  }, []);

  const names = ids.map((id) => COMPLAINTS.find((c) => c.id === id)?.label ?? id).join("・");
  const head = title ?? `🔍 あなたの食事から見た、「${names}」の原因`;
  if (!cin || !cin.touched) {
    return (
      <div className="causemini">
        <p className="balh">{head}</p>
        <p>ホームの「いまの食事のバランス」で、いつもの食事を選ぶと、ここに、あなたの食事から考えられる原因が出ます。</p>
        <Link href="/" className="evlink">
          食事を選びに行く（1タップ）›
        </Link>
      </div>
    );
  }
  const causes = analyze(cin.input, ids);
  return (
    <div className="causemini">
      <p className="balh">{head}</p>
      {causes.length === 0 ? (
        <p>いまの食事には、大きな原因は見つかりませんでした。睡眠・運動・体調など、食事以外も確認しましょう。</p>
      ) : (
        <>
          <ol>
            {causes.map((c, i) => (
              <li key={c.id}>
                <b>
                  {i + 1}. {c.name}
                </b>
                <span>{c.num}</span>
              </li>
            ))}
          </ol>
          <p className="causeact">まず：{causes[0].act}</p>
        </>
      )}
      <Link href="/" className="evlink">
        ほかの悩みも調べる（ホーム）›
      </Link>
    </div>
  );
}
