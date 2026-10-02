# PFC アプリ

- **写真で調べる**: 食品の写真からPFC・kcalを推定（Google Gemini APIの無料枠を使用）
- **食品を検索**: 食品名とグラム数からPFCを表示（APIキー不要）
- **目標から探す**: 残りのPFC目標を入力すると、近づけられる食品と量を提案

## ローカル起動

```bash
npm install
```

`.env.example` を `.env.local` にコピーして、`GEMINI_API_KEY`（[Google AI Studio](https://aistudio.google.com) で無料作成）を設定します。

```bash
npm run dev
```

## Vercel へのデプロイ

1. GitHub にプッシュして、Vercel でインポート
2. **Environment Variables** に `GEMINI_API_KEY` を追加
3. Deploy

※ キーが未設定でも、写真認識以外の機能は使えます。APIキーはサーバー側（`app/api/analyze/route.ts`）だけで使われ、ブラウザには公開されません。
