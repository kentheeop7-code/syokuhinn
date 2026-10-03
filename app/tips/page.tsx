import type { Metadata } from "next";
import Link from "next/link";
import { TIPS, TIP_GROUPS } from "../tipsData";

export const metadata: Metadata = {
  title: "豆知識 | 専属の栄養士",
  description: "たんぱく質とダイエットの豆知識（小麦粉のたんぱく質、プロテイン入り食品の裏事情など）",
};

export default function Tips() {
  return (
    <main className="container">
      <header className="brandbar">
        <span className="brand">LIFEGYM</span>
        <Link href="/" className="guidebtn">
          ‹ 記録に戻る
        </Link>
      </header>
      <h1 className="title sm">豆知識</h1>
      <p className="member">たんぱく質とダイエットで、知っておくと役立つ話</p>

      <nav className="anav" aria-label="ページ内メニュー">
        {TIP_GROUPS.map((g) => (
          <a key={g.key} href={`#g-${g.key}`}>
            {g.label}
          </a>
        ))}
      </nav>

      {TIP_GROUPS.map((g) => (
        <section key={g.key}>
          <h2 className="h2" id={`g-${g.key}`}>
            {g.label}
          </h2>
          <ul className="nlist">
            {TIPS.filter((t) => t.group === g.key).map((t) => (
              <li key={t.id} id={t.id} className="card ncard tipcard">
                <div className="nhead">
                  <h2>{t.title}</h2>
                </div>
                <ul className="plist">
                  {t.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {t.source && (
                  <p className="tipsrc">
                    出典：
                    <a href={t.source.url} target="_blank" rel="noopener noreferrer">
                      {t.source.label}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="note">
        ※ 一般的な情報で、個人の診断や治療に代わるものではありません。商品の成分は、必ずパッケージの表示をご確認ください。持病のある方・妊娠中の方・服薬中の方は、医師や管理栄養士にご相談ください。
      </p>
    </main>
  );
}
