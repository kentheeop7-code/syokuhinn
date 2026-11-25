// トレーナー専用：自動提案から、「トレーナーへ」の助言。お客様の資料（PDF・リンク）には、出ません。
export default function TrainerNotes({ notes, title = "👤 トレーナーへ（お客様の資料には、出ません）" }: { notes: string[]; title?: string }) {
  if (!notes.length) return null;
  return (
    <div className="trnotes noprint" data-pdf-skip>
      <b>{title}</b>
      <ul>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
    </div>
  );
}
