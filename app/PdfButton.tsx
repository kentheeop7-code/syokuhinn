"use client";

import { useState } from "react";
import { downloadFile, pagesToPdf, renderReportPages, shareFiles } from "../lib/pdfExport";

// ページの一部（資料）を、お客様に見やすい、PDFにする。ブラウザの中だけで作る（サーバーには送らない）。
// target：PDFにしたい部分の、CSSセレクタ。ボタン・入力欄・[data-pdf-skip] は、PDFから除く。
export default function PdfButton({ target, title, base, label = "📥 この内容をPDFにする" }: { target: string; title: string; base: string; label?: string }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const make = async (how: "download" | "share") => {
    const src = document.querySelector(target) as HTMLElement | null;
    if (!src) return setMsg("PDFにする内容が、見つかりませんでした。");
    setMsg("");
    setBusy("作成中…（しばらく、お待ちください）");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-30000px;top:0;width:734px;background:#fff;";
    const art = document.createElement("article");
    art.className = "report pdfdoc-src";
    art.id = "pdfdoc-src";
    const now = new Date();
    art.innerHTML = `<header class="rcover"><div class="rcb"><p class="rbrand">LIFEGYM</p><p class="rtag">お客様向け資料</p></div><h1></h1><p class="rmeta">${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日</p></header>`;
    (art.querySelector("h1") as HTMLElement).textContent = title;
    const body = src.cloneNode(true) as HTMLElement;
    body.removeAttribute("id");
    body.querySelectorAll("button, input, textarea, select, [data-pdf-skip], .noprint, script, style").forEach((e) => e.remove());
    body.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    body.style.cssText += ";box-shadow:none;border:0;margin:0;padding:0;max-width:none;width:100%;";
    art.appendChild(body);
    host.appendChild(art);
    document.body.appendChild(host);
    try {
      const pages = await renderReportPages("#pdfdoc-src", (a, b) => setBusy(`作成中… ${a}/${b}`));
      const blob = await pagesToPdf(pages);
      const file = new File([blob], `${base}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.pdf`, { type: "application/pdf" });
      if (how === "share") {
        if (!(await shareFiles([file], title))) downloadFile(file, file.name);
      } else downloadFile(file, file.name);
      setMsg(`PDFを作りました（${pages.length}ページ・${Math.round(blob.size / 1024)}KB）。`);
    } catch {
      setMsg("PDFを作れませんでした。もう一度、お試しください。");
    } finally {
      document.body.removeChild(host);
      setBusy("");
    }
  };

  return (
    <div className="pdfbtn noprint" data-pdf-skip>
      <button type="button" className="trchip on" onClick={() => make("download")} disabled={!!busy}>{label}</button>
      <button type="button" className="trchip" onClick={() => make("share")} disabled={!!busy}>📤 LINEなどで共有</button>
      {(busy || msg) && <span className="pdfbtn-msg" role="status">{busy || msg}</span>}
    </div>
  );
}
