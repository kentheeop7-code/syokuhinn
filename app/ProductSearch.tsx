"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SUPPS, SUPP_UPDATED, type Supp } from "./supplementsData";
import { SUPP_DETAILS } from "./suppDetails";
import { WOMEN_IDS } from "./SuppBar";

const GROUPS: { key: string; label: string; test: (s: Supp) => boolean }[] = [
  { key: "women", label: "女性向け", test: (s) => WOMEN_IDS.includes(s.id) },
  { key: "all", label: "すべて", test: () => true },
  { key: "protein", label: "プロテイン", test: (s) => s.kind === "プロテイン" },
  { key: "amino", label: "アミノ酸", test: (s) => ["アミノ酸", "筋肉サポート"].includes(s.kind) },
  { key: "perf", label: "運動", test: (s) => ["パフォーマンス", "エネルギー"].includes(s.kind) },
  { key: "vm", label: "ビタミン・ミネラル", test: (s) => ["ビタミン", "ミネラル"].includes(s.kind) },
  { key: "health", label: "健康・美容", test: (s) => ["脂肪酸", "美容・関節", "腸活", "リラックス", "血流"].includes(s.kind) },
];

// 「価格：4,580円」のように書かれた、最初の金額（円）を取り出す
function firstYen(s: string): number | null {
  const m = s.replace(/,/g, "").match(/(\d{3,6})\s*円/);
  return m ? parseInt(m[1], 10) : null;
}

type Sort = "rec" | "low" | "high";

function Card({ s }: { s: Supp }) {
  const [open, setOpen] = useState(false);
  const d = SUPP_DETAILS[s.id];
  return (
    <li className="card pcard">
      <button type="button" className="phead" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="pico" aria-hidden>
          {s.icon}
        </span>
        <span className="pmain">
          <b>{s.name}</b>
          <span className="pbadges">
            {s.real && <em className="preal">実商品</em>}
            <em>{s.kind}</em>
          </span>
          <span className="pprice">{s.price}</span>
        </span>
        <i aria-hidden>{open ? "−" : "＋"}</i>
      </button>
      <p className="peffect">{s.effect}</p>
      {open && (
        <div className="pbody">
          <p>
            <b>他の商品・1回あたりの目安</b>
            {s.unit}
          </p>
          <p>
            <b>選ぶコツ</b>
            {s.tip}
          </p>
          {d && (
            <>
              <p>
                <b>とり方</b>
                {d.how}
              </p>
              <p>
                <b>向いている人・注意</b>
                {d.who}
              </p>
            </>
          )}
          {s.src && <p className="psrc">出典・確認日：{s.src}</p>}
        </div>
      )}
    </li>
  );
}

// 商品を探すタブ：サプリ・プロテインを、目的・価格で探す
export default function ProductSearch() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("women");
  const [sort, setSort] = useState<Sort>("rec");
  const [realOnly, setRealOnly] = useState(false);
  const sp = useSearchParams();
  // ほかのページの「もっと見る」から来たとき、その言葉で探す
  useEffect(() => {
    const k = sp.get("q");
    if (k) {
      setQ(k);
      setGroup("all");
    }
  }, [sp]);

  const list = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group) ?? GROUPS[0];
    const s = q.trim();
    let r = SUPPS.filter((x) => g.test(x) && (!realOnly || x.real) && (!s || [x.name, x.kind, x.effect, x.price, x.unit, x.tip].some((t) => t.includes(s))));
    if (sort !== "rec") {
      r = [...r].sort((a, b) => {
        const pa = firstYen(a.price) ?? Infinity;
        const pb = firstYen(b.price) ?? Infinity;
        return sort === "low" ? pa - pb : (pb === Infinity ? -Infinity : pb) - (pa === Infinity ? -Infinity : pa);
      });
    }
    return r;
  }, [q, group, sort, realOnly]);

  return (
    <section className="psearch">
      <p className="agnote">
        サプリ・プロテインの、実在する商品の価格と、選び方です（{SUPP_UPDATED}）。価格は、店舗・時期・セールで変わります。
      </p>
      <input className="adsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="商品名・成分・目的で検索（例：鉄、ホエイ、睡眠）" aria-label="商品を検索" />
      <p className="aglabel">種類</p>
      <div className="chips tight">
        {GROUPS.map((g) => (
          <button key={g.key} className={group === g.key ? "chip on" : "chip"} onClick={() => setGroup(g.key)}>
            {g.label}
          </button>
        ))}
      </div>
      <p className="aglabel">並べかえ</p>
      <div className="chips tight">
        {(
          [
            ["rec", "おすすめ順"],
            ["low", "価格が安い順"],
            ["high", "価格が高い順"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} className={sort === k ? "chip on" : "chip"} onClick={() => setSort(k)}>
            {t}
          </button>
        ))}
        <button className={realOnly ? "chip on" : "chip"} onClick={() => setRealOnly((v) => !v)}>
          実商品のみ
        </button>
      </div>
      <p className="adcount">{list.length}件</p>
      <ul className="nlist">
        {list.map((s) => (
          <Card key={s.id} s={s} />
        ))}
      </ul>
      {list.length === 0 && <p className="note">見つかりませんでした。別の言葉や、種類で探してみてください。</p>}
      <p className="note">
        ※ 一般的な情報で、商品をすすめるものではありません。持病・妊娠中・授乳中・服薬中の人は、サプリを使う前に、医師・薬剤師に相談してください。成分・価格は、必ず公式サイトで確認を。
      </p>
    </section>
  );
}

