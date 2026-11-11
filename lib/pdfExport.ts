// お客様向けのまとめを、PDFファイル・画像にする（ブラウザの中だけで、作る。サーバーには、送らない）。
// 画面の「.report」を、A4の幅に整えて、区切りのよい場所（見出し・表・グラフのかたまり）で、ページに分ける。
const PAGE_W = 794; // A4の幅（96dpi）
const PAGE_H = 1123;
const M_X = 30;
const M_TOP = 30;
const M_BOTTOM = 40;
const BODY_W = PAGE_W - M_X * 2; // 734
const LIMIT = PAGE_H - M_TOP - M_BOTTOM; // 1 ページに入る高さ
const GAP = 8;
const SCALE = 2;

const BLOCK_STOP = new Set(["TABLE", "TBODY", "THEAD", "TR", "svg"]);

// 高さが、1ページを超える要素は、子ごとに、分ける。小さい子は、まとめて、1つのかたまりにする。
function collect(el: HTMLElement): HTMLElement[] {
  if (el.offsetHeight <= LIMIT) return [el];
  const kids = Array.from(el.children) as HTMLElement[];
  if (kids.length === 0) return [el];
  if (BLOCK_STOP.has(el.tagName)) return kids.flatMap(collect);
  const out: HTMLElement[] = [];
  let group: HTMLElement[] = [];
  let gh = 0;
  const flush = () => {
    if (!group.length) return;
    if (group.length === 1) out.push(group[0]);
    else {
      const w = el.cloneNode(false) as HTMLElement;
      el.insertBefore(w, group[0]);
      group.forEach((g) => w.appendChild(g));
      out.push(w);
    }
    group = [];
    gh = 0;
  };
  for (const k of kids) {
    const h = k.offsetHeight + 8;
    if (k.offsetHeight > LIMIT) {
      flush();
      out.push(...collect(k));
    } else if (gh + h > LIMIT) {
      flush();
      group.push(k);
      gh = h;
    } else {
      group.push(k);
      gh += h;
    }
  }
  flush();
  return out;
}

export async function renderReportPages(selector: string, onProgress?: (done: number, total: number) => void): Promise<HTMLCanvasElement[]> {
  const src = document.querySelector(selector) as HTMLElement | null;
  if (!src) throw new Error("no report");
  const { default: html2canvas } = await import("html2canvas");
  try {
    await (document as any).fonts?.ready;
  } catch {}
  const wrap = document.createElement("div");
  wrap.style.cssText = `position:absolute;left:-20000px;top:0;width:${BODY_W}px;background:#fff;`;
  const clone = src.cloneNode(true) as HTMLElement;
  clone.classList.add("pdfmode");
  clone.style.width = `${BODY_W}px`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);
  try {
    await new Promise((r) => setTimeout(r, 120));
    const pieces = collect(clone);
    const pages: HTMLCanvasElement[] = [];
    const newPage = () => {
      const c = document.createElement("canvas");
      c.width = PAGE_W * SCALE;
      c.height = PAGE_H * SCALE;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      pages.push(c);
      return c;
    };
    let page = newPage();
    let y = M_TOP;
    const cr = clone.getBoundingClientRect();
    for (let i = 0; i < pieces.length; i++) {
      const el = pieces[i];
      onProgress?.(i, pieces.length);
      const r = el.getBoundingClientRect();
      const shot = await html2canvas(el, { scale: SCALE, backgroundColor: "#ffffff", logging: false, useCORS: true });
      const hCss = shot.height / SCALE;
      const xCss = Math.max(0, r.left - cr.left);
      if (y + hCss > PAGE_H - M_BOTTOM && y > M_TOP) {
        page = newPage();
        y = M_TOP;
      }
      // 1ページより高い（子に分けられない）ものは、ページごとに、切る
      let off = 0;
      while (off < hCss) {
        const room = PAGE_H - M_BOTTOM - y;
        const take = Math.min(hCss - off, room);
        page.getContext("2d")!.drawImage(shot, 0, off * SCALE, shot.width, take * SCALE, (M_X + xCss) * SCALE, y * SCALE, shot.width, take * SCALE);
        off += take;
        y += take;
        if (off < hCss) {
          page = newPage();
          y = M_TOP;
        }
      }
      y += GAP;
    }
    onProgress?.(pieces.length, pieces.length);
    // ページ番号
    pages.forEach((c, i) => {
      const g = c.getContext("2d")!;
      g.fillStyle = "#667";
      g.font = `${11 * SCALE}px sans-serif`;
      g.textAlign = "center";
      g.fillText(`LIFEGYM　${i + 1} / ${pages.length}`, (PAGE_W / 2) * SCALE, (PAGE_H - 16) * SCALE);
    });
    return pages;
  } finally {
    document.body.removeChild(wrap);
  }
}

export async function pagesToPdf(pages: HTMLCanvasElement[]): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pages.forEach((c, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(c.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 210, 297, undefined, "FAST");
  });
  return pdf.output("blob");
}

export const pagesToJpegFiles = (pages: HTMLCanvasElement[], base: string): Promise<File[]> =>
  Promise.all(
    pages.map(
      (c, i) =>
        new Promise<File>((res, rej) =>
          c.toBlob((b) => (b ? res(new File([b], `${base}_${i + 1}.jpg`, { type: "image/jpeg" })) : rej(new Error("toBlob"))), "image/jpeg", 0.9)
        )
    )
  );

export function downloadFile(f: Blob | File, name: string) {
  const url = URL.createObjectURL(f);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// スマホなどで、LINE・メールなどに、ファイルを、直接、共有できるか
export async function shareFiles(files: File[], title: string): Promise<boolean> {
  const nav = navigator as any;
  try {
    if (nav.canShare && nav.canShare({ files })) {
      await nav.share({ files, title });
      return true;
    }
  } catch (e: any) {
    if (e?.name === "AbortError") return true; // 共有の画面を、閉じただけ
  }
  return false;
}