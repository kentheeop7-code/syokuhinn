import { TIP_SOURCES } from "../evidence";
import MeCard from "../MeCard";
import CauseMini from "../CauseMini";
import GuideTabs from "../GuideTabs";
import MoreFolds from "../MoreFolds";
import MyKcal from "../MyKcal";
import Fold from "../Fold";
import LatestPapers from "../LatestPapers";
import CondGuide from "../CondGuide";
import NutrientCond from "../NutrientCond";
import DietForAnyone from "../DietForAnyone";
import Disclosure from "../Disclosure";
import RelatedProducts from "../RelatedProducts";
import type { Metadata } from "next";
import Link from "next/link";
import ShareQR from "../ShareQR";
import { TIPS, TIP_GROUPS } from "../tipsData";
import { TIP_TODO } from "../tipsTodo";

export const metadata: Metadata = {
  title: "豆知識 | 専属の栄養士",
  description: "勘違いを覆す豆知識、年齢と代謝・筋肉のはなし、痩せない・筋肉がつかない原因、たんぱく質・ダイエットの豆知識",
};

export default function Tips() {
  return (
    <main className="container">
      <h1 className="title sm">豆知識</h1>
      <p className="member">勘違いを覆す話から、年齢による代謝・筋肉の変化、痩せない・筋肉がつかない原因、たんぱく質・ダイエットのコツまで</p>

      <GuideTabs current="tips" />
      <Fold id="mine" title="👤 あなたに合わせた目安と原因" sub="たんぱく質の目安と、食事から見た体重・疲れの原因">
        <MeCard variant="mini" topic="tips" />
        <CauseMini ids={["weight", "tired"]} title="🔍 あなたの食事から見た、体重・疲れの原因" />
      </Fold>
      <Link href="/gut" className="gutlink">
        <span aria-hidden>🌿</span>
        <span>
          <b>腸内環境ガイド（専用ページ）</b>
          <small>便のタイプ・食物繊維・月経と便通・7日プラン</small>
        </span>
        <i aria-hidden>›</i>
      </Link>
      <Link href="/additives" className="gutlink">
        <span aria-hidden>🏷️</span>
        <span>
          <b>食品表示・添加物ガイド（専用ページ）</b>
          <small>増粘剤・乳化剤・甘味料／原材料チェッカー</small>
        </span>
        <i aria-hidden>›</i>
      </Link>

      <nav className="anav" aria-label="ページ内メニュー">
        {TIP_GROUPS.map((g) => (
          <a key={g.key} href={`#g-${g.key}`}>
            {g.label}
          </a>
        ))}
      </nav>

      <MoreFolds limit={5}>
      {TIP_GROUPS.map((g) => (
        <Fold key={g.key} id={`g-${g.key}`} title={g.label} sub={`${TIPS.filter((t) => t.group === g.key).length}件`}>
          {g.key === "protein" && <RelatedProducts q="プロテイン" title="プロテインの商品" />}
          <ul className="nlist">
            {TIPS.filter((t) => t.group === g.key).map((t) => (
              <li key={t.id} className="card ncard tipcard" id={t.id}>
                <Disclosure
                  id={t.id}
                  head={
                    <>
                <div className="nhead">
                  <h2>{t.title}</h2>
                </div>
                <p className="tiplead">{(t.lead.split("。")[0] || t.lead).slice(0, 70)}</p>
                    </>
                  }
                >
                {t.myth && (
                  <details className="tipfold">
                    <summary>思い込みと、実際は？</summary>
                  <div className="mythbox">
                    <p className="mb-no">
                      <span>✕ よくある思い込み</span>
                      {t.myth}
                    </p>
                    <p className="mb-yes">
                      <span>◎ 実は…</span>
                      {t.lead}
                    </p>
                  </div>
                  </details>
                )}
                <ul className="plist">
                  {t.points.slice(0, 3).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {t.points.length > 3 && (
                  <details className="tipmore">
                    <summary>ほかのポイント（{t.points.length - 3}件）</summary>
                    <ul className="plist">
                      {t.points.slice(3).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {(t.todo || TIP_TODO[t.id]) && (
                  <details className="tipfold">
                    <summary>✅ 今日からできる一歩</summary>
                    <p className="tiptodo">{t.todo ?? TIP_TODO[t.id]}</p>
                  </details>
                )}
                {t.source ? (
                      <p className="tipsrc">
                        出典：
                        <a href={t.source.url} target="_blank" rel="noopener noreferrer">
                          {t.source.label}
                        </a>
                      </p>
                    ) : TIP_SOURCES[t.id] ? (
                      <p className="tipsrc">
                        出典（{TIP_SOURCES[t.id].kind}）：
                        {TIP_SOURCES[t.id].url ? (
                          <a href={TIP_SOURCES[t.id].url} target="_blank" rel="noopener noreferrer">
                            {TIP_SOURCES[t.id].label}
                          </a>
                        ) : (
                          TIP_SOURCES[t.id].label
                        )}
                      </p>
                    ) : (
                      <p className="tipsrc weak">根拠の強さ：個別の出典は、未掲載（一般的な栄養学の内容）です。気になるときは、医師・管理栄養士に確認してください。</p>
                    )}
                </Disclosure>
              </li>
            ))}
          </ul>
        </Fold>
      ))}
      </MoreFolds>
      <Fold id="cond" title="🩺 持病・体質がある方の食事と運動" sub="甲状腺・糖尿病・高血圧など（根拠つき）">
        <CondGuide />
      </Fold>
      <Fold id="any" title="👥 あなたの状況から、始め方を選ぶ" sub="どんな方でも、ダイエットを始められるように"><DietForAnyone /></Fold>
      <Fold id="n-cond" title="🩺 持病がある方の栄養素の目安" sub="栄養素の量を、表で"><NutrientCond /></Fold>
      <Fold id="latest" title="🆕 最新の論文（自動取得）" sub="PubMedから、新しい順に">
        <LatestPapers storeKey="tips" topics={[{ key: "wl", label: "減量", term: "\"weight loss\"[ti] AND (diet[ti] OR dietary[ti])" }, { key: "rt", label: "筋トレ", term: "\"resistance training\"[ti] AND (hypertrophy[ti] OR muscle[ti])" }, { key: "pr", label: "たんぱく質", term: "protein[ti] AND (muscle[ti] OR \"resistance training\"[ti])" }]} />
      </Fold>

      <p className="note">
        ※ 一般的な情報で、個人の診断や治療に代わるものではありません。商品の成分は、必ずパッケージの表示をご確認ください。持病のある方・妊娠中の方・服薬中の方は、医師や管理栄養士にご相談ください。
      </p>
      <ShareQR />
    </main>
  );
}











