"use client";

import { useEffect, useState } from "react";

// お客様ごとの保存：いま入力している内容（指導メモ・定期フォロー）を、名前を付けて、このブラウザに保存し、
// あとで、切り替えて開ける。サーバーには、送らない。ファイルに書き出して、別の端末へ移すこともできる。
const LIST = "lg-clients";
const KEYS = ["lg-trainer", "lg-followup", "lg-trainer-text"] as const;
type Rec = { id: string; name: string; at: string; data: Record<string, string> };

const read = (): Rec[] => {
  try {
    const v = JSON.parse(localStorage.getItem(LIST) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const write = (l: Rec[]) => localStorage.setItem(LIST, JSON.stringify(l));
const currentName = (): string => {
  for (const k of ["lg-trainer", "lg-followup"]) {
    try {
      const n = JSON.parse(localStorage.getItem(k) || "null")?.name;
      if (typeof n === "string" && n.trim()) return n.trim();
    } catch {}
  }
  return "";
};
const snapshot = (): Record<string, string> => {
  const d: Record<string, string> = {};
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (v) d[k] = v;
  }
  return d;
};

export default function ClientSaves() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Rec[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setList(read());
  }, []);
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  };

  const save = () => {
    const nm = (name.trim() || currentName() || "（名前なし）").slice(0, 40);
    const data = snapshot();
    if (!Object.keys(data).length) return flash("保存する内容が、まだ、ありません。");
    const l = read();
    const at = new Date().toLocaleString("ja-JP");
    const i = l.findIndex((x) => x.name === nm);
    if (i >= 0) l[i] = { ...l[i], at, data };
    else l.unshift({ id: String(Date.now()), name: nm, at, data });
    write(l);
    setList(l);
    setName("");
    flash(`「${nm}」さんを、保存しました。`);
  };
  const load = (r: Rec) => {
    if (!confirm(`「${r.name}」さんの内容を開きます。いま入力中の内容は、置き換わります（先に「保存」すると、残せます）。よろしいですか？`)) return;
    for (const k of KEYS) {
      if (r.data[k]) localStorage.setItem(k, r.data[k]);
      else localStorage.removeItem(k);
    }
    location.reload();
  };
  const del = (r: Rec) => {
    if (!confirm(`「${r.name}」さんの保存を、削除します。元に戻せません。よろしいですか？`)) return;
    const l = read().filter((x) => x.id !== r.id);
    write(l);
    setList(l);
  };
  const fresh = () => {
    if (!confirm("いま入力中の内容を、空にして、新しいお客様を始めます（先に「保存」すると、残せます）。よろしいですか？")) return;
    for (const k of KEYS) localStorage.removeItem(k);
    location.reload();
  };
  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ app: "lifegym", at: new Date().toISOString(), clients: read() })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lifegym-clients-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const inc: Rec[] = Array.isArray(j?.clients) ? j.clients.filter((x: Rec) => x && typeof x.name === "string" && x.data && typeof x.data === "object") : [];
      if (!inc.length) return flash("読み込めるお客様が、ありませんでした。");
      const l = read();
      for (const r of inc) {
        const i = l.findIndex((x) => x.name === r.name);
        const rec: Rec = { id: r.id || String(Date.now() + Math.random()), name: r.name, at: r.at || "", data: r.data };
        if (i >= 0) l[i] = rec;
        else l.push(rec);
      }
      write(l);
      setList(l);
      flash(`${inc.length}人を、読み込みました。`);
    } catch {
      flash("ファイルを読み込めませんでした。");
    }
  };

  return (
    <div className="clsv noprint">
      <button type="button" className="clsv-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        👥 お客様を保存・切り替え{list.length ? `（${list.length}人）` : ""} {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="clsv-body">
          <p className="agnote">いま入力している内容（指導メモ・定期フォロー）を、お客様ごとに、このブラウザへ保存できます。サーバーには、送りません。ブラウザのデータを消すと、なくなるので、ときどき「ファイルに書き出す」で、バックアップしてください。</p>
          <div className="clsv-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={currentName() ? `お客様の名前（空なら「${currentName()}」）` : "お客様の名前"} aria-label="お客様の名前" />
            <button type="button" className="trchip on" onClick={save}>💾 いまの内容を保存</button>
            <button type="button" className="trchip" onClick={fresh}>＋ 新しいお客様（空にする）</button>
          </div>
          {msg && <p className="clsv-msg" role="status">{msg}</p>}
          {list.length === 0 ? (
            <p className="agnote">まだ、保存したお客様は、いません。</p>
          ) : (
            <ul className="clsv-list">
              {list.map((r) => (
                <li key={r.id}>
                  <span>
                    <b>{r.name}</b>
                    <small>保存：{r.at}</small>
                  </span>
                  <button type="button" className="trchip" onClick={() => load(r)}>開く</button>
                  <button type="button" className="trchip" onClick={() => del(r)}>削除</button>
                </li>
              ))}
            </ul>
          )}
          <div className="clsv-row">
            <button type="button" className="trchip" onClick={exportAll} disabled={!list.length}>⬇ ファイルに書き出す</button>
            <label className="trchip clsv-file">
              ⬆ ファイルから読み込む
              <input type="file" accept="application/json,.json" onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </div>
          <p className="agnote small">書き出したファイルには、お客様の情報が入っています。取り扱いに、ご注意ください。</p>
        </div>
      )}
    </div>
  );
}
