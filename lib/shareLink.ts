// お客様に、リンクで見せるための、データのつつみかた。
// データは、URLの「#」より後ろ（フラグメント）に入れる。「#」より後ろは、サーバーに、送られない。
// ただし、LINEなどに、貼ったリンクを、持っている人は、中身が見られる。お客様ごとに、送ること。
// 圧縮は、どの端末でも動く方式（lz-string）。古いスマホ・LINEの中のブラウザでも、開けるように。
import LZString from "lz-string";
export type Payload = Record<string, unknown>;
const KEYS = ["name", "goal", "now", "target", "days", "others", "water", "sex", "band", "curMeal", "planMeal", "targetKcal", "pace", "swapOff", "picked", "conds", "issues", "problem", "weekAct", "nextDate", "note", "pins", "age", "height", "bmr", "muscle", "bodyFat", "pal", "actOff", "fatMass", "visceral", "bmiIn", "method", "pfc"];

export function payloadOf(s: Record<string, any>): Payload {
  const p: Payload = {};
  for (const k of KEYS) if (s[k] !== undefined) p[k] = s[k];
  if (Array.isArray(s.pins)) p.pins = s.pins.map((x: any) => ({ id: x.id, title: x.title, journal: x.journal, date: x.date }));
  return p;
}

const b64u = (u8: Uint8Array) => {
  let s = "";
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64u = (t: string) => {
  const s = atob(t.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((t.length + 3) % 4));
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
};

export async function encodePayload(p: Payload): Promise<string> {
  // "z."＝lz-string（どの端末でも開ける）。URLに使える文字だけ（A-Z a-z 0-9 - _）にする。
  return "z." + b64u(LZString.compressToUint8Array(JSON.stringify(p)));
}
export async function decodePayload(t: string): Promise<Payload | null> {
  try {
    const kind = t.slice(0, 2);
    const u8 = unb64u(t.slice(2));
    if (kind === "z.") {
      const s = LZString.decompressFromUint8Array(u8);
      return s ? JSON.parse(s) : null;
    }
    if (kind === "g.") {
      const DS = (globalThis as any).DecompressionStream;
      if (!DS) return null;
      const ds = new DS("gzip");
      const w = ds.writable.getWriter();
      w.write(u8);
      w.close();
      const out = await new Response(ds.readable).arrayBuffer();
      return JSON.parse(new TextDecoder().decode(out));
    }
    if (kind === "p.") return JSON.parse(new TextDecoder().decode(u8));
  } catch {}
  return null;
}

export async function shareUrl(s: Record<string, any>): Promise<string> {
  return `${location.origin}/share#${await encodePayload(payloadOf(s))}`;
}