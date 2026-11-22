import { getTip } from "../lib/knowledge";

// 定期フォロー資料：おすすめ栄養素の豆知識（読むと、知識になる形）。
export default function TipView({ id }: { id: string }) {
  const t = getTip(id);
  if (!t) return null;
  return (
    <div className="tipv">
      <p className="tip-hook">{t.icon} {t.hook}</p>
      <div className="tip-row">
        <div className="tip-box">
          <b>① とは？</b>
          <p>{t.what}</p>
        </div>
        <div className="tip-box">
          <b>② からだのなかで</b>
          <p>{t.body}</p>
        </div>
      </div>
      <div className="tip-row">
        <div className="tip-box">
          <b>③ とれる食べ物</b>
          <ul>{t.foods.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="tip-box">
          <b>④ とり方のコツ</b>
          <ul>{t.how.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <div className="tip-box">
        <b>⑤ 論文でわかっていること</b>
        <ul className="fuev">{t.known.map((e) => <li key={e.pmid}>{e.label}：{e.note}</li>)}</ul>
        <b>まだ、わかっていないこと</b>
        <ul>{t.unknown.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <div className="mpk-warn">
        <b>⚠ 注意</b>
        <ul>{t.caution.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <div className="tip-remember">
        <b>📌 覚えておくこと（3つ）</b>
        <ol>{t.remember.map((x) => <li key={x}>{x}</li>)}</ol>
        <p className="rxr">こんな人におすすめ：{t.suits}</p>
      </div>
    </div>
  );
}
