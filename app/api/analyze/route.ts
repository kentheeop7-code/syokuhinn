import { NextResponse } from "next/server";

export const maxDuration = 30;

const MODEL = "gemini-2.5-flash";

const PROMPT = `写真に写っている食品・料理を識別し、PFC（たんぱく質・脂質・炭水化物）を推定してください。
見た目から量（グラム）も推定し、その量での合計値を出してください。
食品が写っていない場合は foods を空配列にしてください。
次のJSONだけを返してください（説明文やコードブロックは不要）。
{"foods":[{"name":"日本語の食品名","grams":数値,"protein":数値,"fat":数値,"carbs":数値,"kcal":数値}]}
protein/fat/carbs は g、小数1桁まで。`;

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "写真認識は現在使えません。「食品を検索」をお使いください。" },
      { status: 500 }
    );
  }

  let image: unknown;
  try {
    ({ image } = await req.json());
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }
  const prefix = "data:image/jpeg;base64,";
  if (typeof image !== "string" || !image.startsWith(prefix)) {
    return NextResponse.json({ error: "画像が不正です。" }, { status: 400 });
  }
  const data = image.slice(prefix.length);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: "image/jpeg", data } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (res.status === 429) {
    return NextResponse.json(
      {
        error:
          "無料枠の利用上限に達しました。しばらく待つか、「食品を検索」をお使いください。",
      },
      { status: 429 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "解析に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }

  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  try {
    const parsed = JSON.parse(match ? match[0] : text);
    return NextResponse.json({ foods: parsed.foods ?? [] });
  } catch {
    return NextResponse.json(
      { error: "結果を読み取れませんでした。別の写真でお試しください。" },
      { status: 502 }
    );
  }
}
