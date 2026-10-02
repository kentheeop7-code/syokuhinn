# PFC アプリ

- **写真で調べる**: 食品の写真からPFC・kcalを推定（Claude APIを使用）
- **目標から探す**: 残りのPFC目標を入力すると、近づけられる食品と量を提案

## ローカル起動

```bash
npm install
```

`.env.example` を `.env.local` にコピーして、`ANTHROPIC_API_KEY` を設定します。

```bash
npm run dev
```

## Vercel へのデプロイ

1. GitHub にプッシュして、Vercel でインポート
2. **Environment Variables** に `ANTHROPIC_API_KEY` を追加
3. Deploy

※ APIキーはサーバー側（`app/api/analyze/route.ts`）だけで使われ、ブラウザには公開されません。
